# Commerce REST API (demo + automated tests)

Small Flask API for **users**, **products** (catalog), and **orders**, with JWT auth, admin vs customer roles, Marshmallow validation, Flask-Limiter rate limits, and a **pytest** suite organized by category.

## Endpoints (summary)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create customer account |
| POST | `/api/auth/login` | — | JWT access token |
| GET | `/api/auth/me` | JWT | Current user |
| GET | `/api/users` | Admin | List users |
| GET/PUT | `/api/users/<id>` | Admin or self | Get / update user |
| DELETE | `/api/users/<id>` | Admin | Delete user (not self) |
| GET | `/api/products` | — | List active products (rate-limited in prod config) |
| GET | `/api/products/<id>` | — | Product detail |
| POST/PUT/DELETE | `/api/products[...]` | Admin | Catalog CRUD |
| GET/POST | `/api/orders` | JWT | List (scoped) / create |
| GET/PUT/DELETE | `/api/orders/<id>` | JWT / Admin | Read, update status, admin delete |
| GET | `/api/health` | — | Liveness |
| GET | `/api/health/boom` | — | Returns **500** when `ENABLE_BOOM_ROUTE` is true (tests only) |

**Seed users (TestConfig in-memory DB):**

- Admin: `admin@commerce.test` / `AdminPassw0rd!`
- Customer: `customer@commerce.test` / `Customer12!`

## Run tests

```bash
cd commerce_api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pytest -v
```

### Run by marker (category)

```bash
pytest -m auth -v
pytest -m authz -v
pytest -m crud -v
pytest -m validation -v
pytest -m errors -v
pytest -m ratelimit -v
pytest -m performance -v
```

## Run the API locally

```bash
cd commerce_api && source .venv/bin/activate
python run.py
```

Default: **http://127.0.0.1:5002**. SQLite file `commerce.db` is created in `commerce_api/` when using default `Config`.
