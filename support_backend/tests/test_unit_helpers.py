from app.extensions import db
from app.models import (
    Ticket,
    TicketCategory,
    TicketPriority,
    TicketStatus,
    User,
    UserRole,
)
from app.sanitize import sanitize_text
from app.status_rules import can_transition


def test_sanitize_strips_script():
    assert "<script>" not in sanitize_text("<script>alert(1)</script>hello")


def test_can_transition_open_to_assigned(app):
    with app.app_context():
        u = User(
            name="t",
            email="t@t.com",
            role=UserRole.customer,
        )
        u.password_hash = "x"
        db.session.add(u)
        db.session.commit()
        t = Ticket(
            ticket_number="TICK-20990101-0001",
            subject="Hello world",
            description="x" * 25,
            status=TicketStatus.open,
            priority=TicketPriority.low,
            category=TicketCategory.general,
            customer_email="t@t.com",
            created_by_id=u.id,
        )
        db.session.add(t)
        db.session.commit()
        ok, err = can_transition(t, TicketStatus.assigned, 7)
        assert ok and err is None


def test_can_transition_closed_to_reopened_window(app):
    from datetime import datetime, timedelta, timezone

    with app.app_context():
        u = User(
            name="t2",
            email="t2@t.com",
            role=UserRole.customer,
        )
        u.password_hash = "x"
        db.session.add(u)
        db.session.commit()
        t = Ticket(
            ticket_number="TICK-20990101-0002",
            subject="Hello world",
            description="x" * 25,
            status=TicketStatus.closed,
            priority=TicketPriority.low,
            category=TicketCategory.general,
            customer_email="t2@t.com",
            created_by_id=u.id,
            closed_at=datetime.now(timezone.utc) - timedelta(days=20),
        )
        db.session.add(t)
        db.session.commit()
        ok, err = can_transition(t, TicketStatus.reopened, 7)
        assert not ok and err
