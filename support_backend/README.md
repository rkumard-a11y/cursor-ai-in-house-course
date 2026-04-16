# Customer Support Ticket API

Flask implementation of the **Customer Support Ticket System** described in  
`PRD_Customer_Support_System.txt` (repository root). This service covers core ticket management:

- **FR-001–FR-004:** Ticket creation with validation, auto ticket numbers (`TICK-YYYYMMDD-XXXX`), email confirmation, initial `open` status  
- **FR-005–FR-010:** Admin assignment, assignment history, auto-assignment by workload/category/availability, agent notification on assign, status → `assigned` when appropriate  
- **FR-011–FR-014:** Full status model, transition rules (including **closed → reopened** within 7 days), status history audit trail, email on status change  
- **FR-015–FR-016:** Public and internal comments with role-based visibility  
- **FR-020–FR-021:** SLA response/resolution due times per priority; API flags for approaching/missed SLA  
- **FR-035:** Email notifications (ticket created, assigned, status changed, new comment) via configurable backend  

Security aligned with PRD / NFRs where applicable:

- **bcrypt** password hashing (cost factor configurable, default **12**)  
- **JWT** access tokens with **24h** expiry  
- **Flask-Limiter** default **100 requests/minute** per user (JWT identity) or IP (`RATELIMIT_DEFAULT` / `RATELIMIT_ENABLED`)  
- **bleach** stripping for XSS mitigation on text fields  
- **SQLAlchemy** ORM for SQL injection safe queries  
- **RBAC** enforced in route handlers (customer / agent / admin)  

## Requirements

- Python 3.11+ recommended  
- SQLite by default (no separate DB server)  

## Setup

```bash
cd support_backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # edit secrets for non-local use
```

## Run the API

```bash
export FLASK_APP=run.py
python run.py
```

Default URL: **http://127.0.0.1:5001**

## Seeded users (first startup)

After `db.create_all()`, the app seeds:

| Role   | Email              | Password          |
|--------|--------------------|-------------------|
| Admin  | `admin@example.com` | `AdminPassw0rd!` |
| Agent  | `agent@example.com` | `AgentPassw0rd!` |

Register additional **customers** via `POST /api/auth/register`.

## API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register customer |
| POST | `/api/auth/login` | Login (JWT) |
| POST | `/api/auth/logout` | Logout (stateless JWT; discard client-side) |
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/auth/me` | Update profile (`name`, `avatar_url`, `bio`; unknown fields ignored) |
| PUT | `/api/auth/password` | Change password (`current_password`, `new_password`) |
| DELETE | `/api/auth/me` | Delete own account (JSON body: `password`, `confirm` must be **`DELETE`**) |
| GET | `/api/tickets` | List tickets (RBAC + filters: `q`, `status`, `priority`, `category`, `customer_email`, `assigned_to_id`, `sla_approaching`, `page`) |
| POST | `/api/tickets` | Create ticket (JSON or `multipart/form-data` + `attachments`) |
| GET | `/api/tickets/:id` | Ticket detail (+ SLA highlight flags) |
| PUT | `/api/tickets/:id` | Update subject/description (agent/admin) |
| DELETE | `/api/tickets/:id` | Delete ticket (**admin** only) |
| POST | `/api/tickets/:id/comments` | Add comment |
| GET | `/api/tickets/:id/comments` | List comments (internal hidden for customers) |
| PUT | `/api/tickets/:id/status` | Status transition (**agent/admin**) |
| PUT | `/api/tickets/:id/priority` | Priority change with **reason** (**agent/admin**) |
| POST | `/api/tickets/:id/assign` | Assign to agent (**admin**) |
| GET | `/api/tickets/:id/history` | Status + assignment timeline |

Query **`?auto_assign=true`** on **POST /api/tickets** to run auto-assignment after creation.

## Swagger UI

Open **http://127.0.0.1:5001/apidocs/** (use `Authorization: Bearer <token>` for protected routes).

## Email / notifications

- `MAIL_BACKEND=log` (default): log only  
- `MAIL_BACKEND=outbox`: append to `app.extensions["mail_outbox"]` (used in tests)  

## Tests

```bash
pytest
```

Includes **25+** cases (API + helpers) with coverage gate (**≥80%** on `app/`).

## Validation highlights

- Subject: 5–200 chars, allowed punctuation per PRD  
- Description: 20–5000 chars  
- Priority / category enums  
- Attachments: max **3** files, **5 MB** each, extensions `.pdf`, `.jpg`/`.jpeg`, `.png`, `.doc`, `.docx`  
- Customers must set `customer_email` equal to their account email  

## Production notes

- Set strong `SECRET_KEY` and `JWT_SECRET_KEY`, use HTTPS (NFR-012).  
- Configure a real rate-limit storage (e.g. Redis) for `Flask-Limiter`.  
- Use PostgreSQL or another production DB for `DATABASE_URI` if you outgrow SQLite.  
