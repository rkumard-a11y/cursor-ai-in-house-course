from datetime import datetime, timedelta, timezone

from app.extensions import db
from app.models import Ticket

from tests.conftest import login


def _agent_id(client, agent_headers):
    return client.get("/api/auth/me", headers=agent_headers).get_json()["user"]["id"]


def _create_payload(**kw):
    base = {
        "subject": "Login issue today",
        "description": "This is a detailed description with enough chars.",
        "priority": "medium",
        "category": "technical",
        "customer_email": "cust@example.com",
    }
    base.update(kw)
    return base


def test_register_and_me(client):
    r = client.post(
        "/api/auth/register",
        json={
            "name": "New",
            "email": "new@example.com",
            "password": "Password12!",
        },
    )
    assert r.status_code == 201
    h = login(client, "new@example.com", "Password12!")
    r2 = client.get("/api/auth/me", headers=h)
    assert r2.status_code == 200
    assert r2.get_json()["user"]["email"] == "new@example.com"


def test_login_invalid(client):
    r = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "wrong"},
    )
    assert r.status_code == 401
    assert r.get_json()["code"] == "UNAUTHORIZED"


def test_create_ticket_validation_subject_too_short(client, customer_headers):
    p = _create_payload(subject="bad")
    r = client.post("/api/tickets", json=p, headers=customer_headers)
    assert r.status_code == 400
    assert r.get_json()["code"] == "VALIDATION_ERROR"


def test_create_ticket_validation_description_short(client, customer_headers):
    p = _create_payload(description="short")
    r = client.post("/api/tickets", json=p, headers=customer_headers)
    assert r.status_code == 400


def test_create_ticket_customer_email_must_match(client, customer_headers):
    p = _create_payload(customer_email="other@example.com")
    r = client.post("/api/tickets", json=p, headers=customer_headers)
    assert r.status_code == 400


def test_create_ticket_success_and_ticket_number_format(client, customer_headers):
    p = _create_payload()
    r = client.post("/api/tickets", json=p, headers=customer_headers)
    assert r.status_code == 201
    tn = r.get_json()["ticket"]["ticket_number"]
    assert tn.startswith("TICK-")
    assert tn.count("-") == 2


def test_create_ticket_sends_confirmation_email(client, customer_headers, app):
    app.extensions["mail_outbox"] = []
    p = _create_payload()
    r = client.post("/api/tickets", json=p, headers=customer_headers)
    assert r.status_code == 201
    ob = app.extensions.get("mail_outbox", [])
    assert any("cust@example.com" == m["to"] for m in ob)


def test_list_tickets_customer_only_own(client, customer_headers, admin_headers):
    client.post("/api/tickets", json=_create_payload(), headers=customer_headers)
    r = client.get("/api/tickets", headers=customer_headers)
    assert r.status_code == 200
    assert r.get_json()["total"] >= 1
    r2 = client.get("/api/tickets", headers=admin_headers)
    assert r2.get_json()["total"] >= 1


def test_agent_sees_unassigned_queue(client, customer_headers, agent_headers):
    client.post("/api/tickets", json=_create_payload(), headers=customer_headers)
    r = client.get("/api/tickets", headers=agent_headers)
    assert r.status_code == 200
    assert r.get_json()["total"] >= 1


def test_admin_assign_and_status_assigned(client, customer_headers, admin_headers, agent_headers):
    tid = client.post(
        "/api/tickets", json=_create_payload(), headers=customer_headers
    ).get_json()["ticket"]["id"]
    aid = _agent_id(client, agent_headers)
    r = client.post(
        f"/api/tickets/{tid}/assign",
        json={"user_id": aid},
        headers=admin_headers,
    )
    assert r.status_code == 200
    assert r.get_json()["ticket"]["status"] == "assigned"
    assert r.get_json()["ticket"]["assigned_to_id"] == aid


def test_invalid_status_transition(client, customer_headers, admin_headers, agent_headers):
    tid = client.post(
        "/api/tickets", json=_create_payload(), headers=customer_headers
    ).get_json()["ticket"]["id"]
    aid = _agent_id(client, agent_headers)
    client.post(
        f"/api/tickets/{tid}/assign",
        json={"user_id": aid},
        headers=admin_headers,
    )
    r = client.put(
        f"/api/tickets/{tid}/status",
        json={"status": "resolved"},
        headers=agent_headers,
    )
    assert r.status_code == 400


def test_valid_status_flow_and_history(client, customer_headers, admin_headers, agent_headers):
    tid = client.post(
        "/api/tickets", json=_create_payload(), headers=customer_headers
    ).get_json()["ticket"]["id"]
    aid = _agent_id(client, agent_headers)
    client.post(
        f"/api/tickets/{tid}/assign",
        json={"user_id": aid},
        headers=admin_headers,
    )
    for st in ("in_progress", "waiting", "in_progress", "resolved", "closed"):
        r = client.put(
            f"/api/tickets/{tid}/status",
            json={"status": st, "note": "n"},
            headers=agent_headers,
        )
        assert r.status_code == 200, r.get_json()
    h = client.get(f"/api/tickets/{tid}/history", headers=agent_headers)
    assert h.status_code == 200
    types = {e["type"] for e in h.get_json()["items"]}
    assert "status" in types
    assert "assignment" in types


def test_priority_change_requires_reason(client, customer_headers, admin_headers, agent_headers):
    tid = client.post(
        "/api/tickets", json=_create_payload(), headers=customer_headers
    ).get_json()["ticket"]["id"]
    aid = _agent_id(client, agent_headers)
    client.post(
        f"/api/tickets/{tid}/assign",
        json={"user_id": aid},
        headers=admin_headers,
    )
    r = client.put(
        f"/api/tickets/{tid}/priority",
        json={"priority": "high"},
        headers=agent_headers,
    )
    assert r.status_code == 400
    r2 = client.put(
        f"/api/tickets/{tid}/priority",
        json={"priority": "high", "reason": "Customer escalation"},
        headers=agent_headers,
    )
    assert r2.status_code == 200
    assert r2.get_json()["ticket"]["priority"] == "high"


def test_comments_public_and_internal_visibility(
    client, customer_headers, admin_headers, agent_headers
):
    tid = client.post(
        "/api/tickets", json=_create_payload(), headers=customer_headers
    ).get_json()["ticket"]["id"]
    aid = _agent_id(client, agent_headers)
    client.post(
        f"/api/tickets/{tid}/assign",
        json={"user_id": aid},
        headers=admin_headers,
    )
    client.put(
        f"/api/tickets/{tid}/status",
        json={"status": "in_progress"},
        headers=agent_headers,
    )
    client.post(
        f"/api/tickets/{tid}/comments",
        json={"content": "Internal note", "is_internal": True},
        headers=agent_headers,
    )
    client.post(
        f"/api/tickets/{tid}/comments",
        json={"content": "Hello customer"},
        headers=agent_headers,
    )
    rc = client.get(f"/api/tickets/{tid}/comments", headers=customer_headers)
    assert rc.status_code == 200
    assert len(rc.get_json()["items"]) == 1
    ra = client.get(f"/api/tickets/{tid}/comments", headers=agent_headers)
    assert len(ra.get_json()["items"]) == 2


def test_customer_cannot_post_internal_comment(
    client, customer_headers, admin_headers, agent_headers
):
    tid = client.post(
        "/api/tickets", json=_create_payload(), headers=customer_headers
    ).get_json()["ticket"]["id"]
    aid = _agent_id(client, agent_headers)
    client.post(
        f"/api/tickets/{tid}/assign",
        json={"user_id": aid},
        headers=admin_headers,
    )
    r = client.post(
        f"/api/tickets/{tid}/comments",
        json={"content": "x", "is_internal": True},
        headers=customer_headers,
    )
    assert r.status_code == 403


def test_customer_cannot_change_status(client, customer_headers):
    tid = client.post(
        "/api/tickets", json=_create_payload(), headers=customer_headers
    ).get_json()["ticket"]["id"]
    r = client.put(
        f"/api/tickets/{tid}/status",
        json={"status": "closed"},
        headers=customer_headers,
    )
    assert r.status_code == 403


def test_delete_ticket_admin_only(client, customer_headers, admin_headers, agent_headers):
    tid = client.post(
        "/api/tickets", json=_create_payload(), headers=customer_headers
    ).get_json()["ticket"]["id"]
    assert client.delete(f"/api/tickets/{tid}", headers=agent_headers).status_code == 403
    assert client.delete(f"/api/tickets/{tid}", headers=admin_headers).status_code == 204


def test_auto_assign_on_create(client, customer_headers, admin_headers):
    p = _create_payload()
    r = client.post("/api/tickets?auto_assign=true", json=p, headers=customer_headers)
    assert r.status_code == 201
    assert r.get_json()["ticket"]["assigned_to_id"] is not None


def test_sla_flags_present(client, customer_headers):
    r = client.post(
        "/api/tickets", json=_create_payload(priority="urgent"), headers=customer_headers
    )
    t = r.get_json()["ticket"]
    assert "sla_response_approaching" in t
    assert t["sla_response_due_at"] is not None


def test_reopen_within_window(client, customer_headers, admin_headers, agent_headers, app):
    tid = client.post(
        "/api/tickets", json=_create_payload(), headers=customer_headers
    ).get_json()["ticket"]["id"]
    aid = _agent_id(client, agent_headers)
    client.post(
        f"/api/tickets/{tid}/assign",
        json={"user_id": aid},
        headers=admin_headers,
    )
    for st in ("in_progress", "resolved", "closed"):
        client.put(
            f"/api/tickets/{tid}/status",
            json={"status": st},
            headers=agent_headers,
        )
    with app.app_context():
        ticket = db.session.get(Ticket, tid)
        ticket.closed_at = datetime.now(timezone.utc) - timedelta(days=1)
        db.session.commit()
    r = client.put(
        f"/api/tickets/{tid}/status",
        json={"status": "reopened"},
        headers=agent_headers,
    )
    assert r.status_code == 200
    assert r.get_json()["ticket"]["status"] == "reopened"


def test_reopen_blocked_after_window(client, customer_headers, admin_headers, agent_headers, app):
    tid = client.post(
        "/api/tickets", json=_create_payload(), headers=customer_headers
    ).get_json()["ticket"]["id"]
    aid = _agent_id(client, agent_headers)
    client.post(
        f"/api/tickets/{tid}/assign",
        json={"user_id": aid},
        headers=admin_headers,
    )
    for st in ("in_progress", "resolved", "closed"):
        client.put(
            f"/api/tickets/{tid}/status",
            json={"status": st},
            headers=agent_headers,
        )
    with app.app_context():
        ticket = db.session.get(Ticket, tid)
        ticket.closed_at = datetime.now(timezone.utc) - timedelta(days=10)
        db.session.commit()
    r = client.put(
        f"/api/tickets/{tid}/status",
        json={"status": "reopened"},
        headers=agent_headers,
    )
    assert r.status_code == 400


def test_non_admin_cannot_assign(client, customer_headers, agent_headers):
    tid = client.post(
        "/api/tickets", json=_create_payload(), headers=customer_headers
    ).get_json()["ticket"]["id"]
    aid = _agent_id(client, agent_headers)
    r = client.post(
        f"/api/tickets/{tid}/assign",
        json={"user_id": aid},
        headers=agent_headers,
    )
    assert r.status_code == 403


def test_get_ticket_not_found(client, admin_headers):
    r = client.get("/api/tickets/999999", headers=admin_headers)
    assert r.status_code == 404


def test_comment_notification_email(client, customer_headers, admin_headers, agent_headers, app):
    app.extensions["mail_outbox"] = []
    tid = client.post(
        "/api/tickets", json=_create_payload(), headers=customer_headers
    ).get_json()["ticket"]["id"]
    aid = _agent_id(client, agent_headers)
    client.post(
        f"/api/tickets/{tid}/assign",
        json={"user_id": aid},
        headers=admin_headers,
    )
    client.put(
        f"/api/tickets/{tid}/status",
        json={"status": "in_progress"},
        headers=agent_headers,
    )
    client.post(
        f"/api/tickets/{tid}/comments",
        json={"content": "Please see update"},
        headers=agent_headers,
    )
    ob = app.extensions.get("mail_outbox", [])
    assert len(ob) >= 1
