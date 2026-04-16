"""FR-035 email notifications — pluggable backends (log / outbox for tests)."""

from __future__ import annotations

from flask import current_app


def _outbox():
    ob = current_app.extensions.setdefault("mail_outbox", [])
    return ob


def send_email(to: str, subject: str, body: str) -> None:
    backend = current_app.config.get("MAIL_BACKEND", "log")
    msg = {"to": to, "subject": subject, "body": body}
    if backend == "outbox":
        _outbox().append(msg)
        return
    current_app.logger.info("EMAIL to=%s subject=%s\n%s", to, subject, body)


def notify_ticket_created(ticket) -> None:
    send_email(
        ticket.customer_email,
        f"Ticket {ticket.ticket_number} received",
        f"Your support ticket {ticket.ticket_number} was created. Subject: {ticket.subject}",
    )


def notify_ticket_assigned(ticket, agent) -> None:
    send_email(
        agent.email,
        f"Ticket {ticket.ticket_number} assigned to you",
        f"You have been assigned ticket {ticket.ticket_number}: {ticket.subject}",
    )


def notify_status_changed(ticket, new_status: str) -> None:
    recipients = {ticket.customer_email}
    if ticket.assignee:
        recipients.add(ticket.assignee.email)
    for addr in recipients:
        send_email(
            addr,
            f"Ticket {ticket.ticket_number} status: {new_status}",
            f"Ticket {ticket.ticket_number} is now '{new_status}'.",
        )


def notify_new_comment(ticket, comment, recipients: list[str]) -> None:
    for addr in set(recipients):
        send_email(
            addr,
            f"New comment on {ticket.ticket_number}",
            f"Ticket {ticket.ticket_number} has a new comment.",
        )


def notify_sla_event(ticket, subject: str, body: str, agent_emails: list[str]) -> None:
    for addr in set(agent_emails + [ticket.customer_email]):
        send_email(addr, subject, body)
