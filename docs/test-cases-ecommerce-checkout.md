# Test Cases: E-Commerce Checkout Process

This document defines **manual and automated test scenarios** for an end-to-end checkout flow: cart management, discount codes, payment, order confirmation, and post-purchase email notifications. Each scenario includes **objective**, **preconditions**, **test data**, **steps**, and **expected results** where applicable.

**Frontend demo (reference):** The Vite/React app implements a **guest checkout** flow from the hub cart: quantity controls, merged line quantities when adding the same SKU, stock caps, disabled add-to-cart for inactive/out-of-stock products, promo evaluation in `src/lib/checkoutDemo.ts`, mock payment outcomes (no card PAN), order confirmation + “email queued” copy. Entry: **Products** → add items → **Cart** → **Checkout**. Key files: `src/context/DemoCartContext.tsx`, `src/components/checkout/CheckoutModal.tsx`, `src/components/layout/DemoHubCart.tsx`.

## How to run these scenarios

**Manual (primary today)** — Each table row (e.g. `CART-P-01`, `DISC-N-01`) is executed by you in the browser against the demo UI.

1. From the repo root, start the app: `npm run dev` (Vite is usually **http://localhost:5173**).
2. Open **http://localhost:5173/?view=products** (or use the **Products** tab in the hub).
3. Walk the doc: add to cart, open **Cart**, use **Checkout**, apply codes from the modal hint (`SAVE10`, `EXPIRED`, …), switch **Payment (mock token)** for decline vs success, submit and confirm the order summary + email message.
4. Optional **Playwright** UI tests for *other* demos: `npx playwright install` once, then `npm run test:e2e` or `npm run test:e2e:ui` (see root `README.md`). There is **no** dedicated `checkout*.spec.ts` yet; the checkout UI exposes `data-testid` values such as `demo-hub-cart`, `cart-open-checkout`, `checkout-modal`, `checkout-promo-input`, `checkout-payment-select`, `checkout-place-order` if you want to add specs later.

**Automated logic only** — Pure functions in `src/lib/checkoutDemo.ts` (promo rules, totals, payment mock) are not wired to Vitest/Jest in this repo; you would add a small unit test file and a `npm test` script if you need that layer.

**Conventions**

- **P** = Positive (happy path)  
- **N** = Negative (invalid input / business rules / failures)  
- **E** = Edge / boundary / resilience  
- **S** = Security (data handling, injection, abuse)  

**Scope assumptions (adjust to your product spec)**

- Cart may be **guest** and/or **authenticated**; payment uses a **PCI-compliant** path (tokenized card or redirect to PSP).  
- Discount codes are validated **server-side**; totals are recomputed on the server before charge.  
- Order confirmation is **idempotent** where possible (duplicate submit does not double-charge).

---

## 1. Adding items to cart

### 1.1 Positive (P)

| ID | Title | Preconditions | Test data | Steps | Expected result |
|----|--------|-----------------|-----------|--------|-----------------|
| CART-P-01 | Add single in-stock SKU | Product active, qty ≥ 1 | `sku`: valid, `qty`: 1 | Add to cart (UI or POST cart line) | Line appears; subtotal = price × 1; inventory reserved or decremented per policy |
| CART-P-02 | Add multiple quantities | Stock sufficient | `qty`: 5 | Add/update line | Correct line total; cart count reflects 5 units |
| CART-P-03 | Add second distinct product | Two SKUs in catalog | Two different `sku` values | Add both | Two lines; combined subtotal correct |
| CART-P-04 | Merge duplicate SKU | Same SKU already in cart | Same `sku`, additional `qty`: 2 | Add again | Single line with merged quantity (or explicit replace per spec); no duplicate rows |
| CART-P-05 | Authenticated cart persists | Logged-in user | Add item, sign out, sign in | Re-open cart | Items still present (if server-side cart) |

### 1.2 Negative (N)

| ID | Title | Test data | Steps | Expected result |
|----|--------|-----------|--------|-----------------|
| CART-N-01 | Unknown SKU | `sku`: non-existent ID | Add to cart | `404` / `400`; no partial cart corruption |
| CART-N-02 | Inactive or discontinued product | Product `active: false` | Add | Rejected; user-friendly message |
| CART-N-03 | Quantity exceeds stock | `qty`: stock + 1 | Add/update | `409` / `422`; cap or reject with clear message |
| CART-N-04 | Zero or negative quantity | `qty`: 0 or -1 | Add | `400`; line not created |
| CART-N-05 | Missing SKU or product id | Empty body / null id | Add | `400` validation error |

### 1.3 Edge (E)

| ID | Title | Test data | Steps | Expected result |
|----|--------|-----------|--------|-----------------|
| CART-E-01 | Maximum line quantity boundary | `qty` = max allowed (e.g. 99) | Add | Accepted if stock allows; at max+1 rejected per N-03 |
| CART-E-02 | Price change while item in cart | Admin changes price after add | Open cart / refresh | Cart shows **current** price or locked price per business rule; user notified if policy requires |
| CART-E-03 | Concurrent add (two tabs) | Same SKU | Both tabs add 1 quickly | Final quantity consistent; no race lost updates |
| CART-E-04 | Session expiry (guest cart) | Guest session TTL | Wait past expiry, return | Empty cart or merge prompt per spec; no silent data loss without UX |

### 1.4 Security (S)

| ID | Title | Steps | Expected result |
|----|--------|--------|-----------------|
| CART-S-01 | SQL injection in SKU or product id | `sku`: `1'; DROP TABLE carts;--` | Add | Parameterized queries; generic error; no stack trace / schema leak |
| CART-S-02 | Path traversal / IDOR on cart | User A’s `cart_id` from User B’s session | Fetch/update B’s cart with A’s id | `403` / `404`; no cross-user cart access |
| CART-S-03 | Mass cart API abuse | 1000 rapid add requests | Rate limit / `429`; legitimate users unaffected within threshold |

---

## 2. Applying discount codes

### 2.1 Positive (P)

| ID | Title | Preconditions | Test data | Steps | Expected result |
|----|--------|-----------------|-----------|--------|-----------------|
| DISC-P-01 | Valid percentage code | Code active, within date | `code`: "SAVE10" (10% off) | Apply at checkout | Discount line shown; total reduced correctly (rounding per policy) |
| DISC-P-02 | Valid fixed-amount code | Min order met if required | `code`: "FLAT5" ($5 off) | Apply | Subtotal − $5 (not below zero unless policy allows) |
| DISC-P-03 | Free shipping code | Code ties to shipping method | Apply code | Shipping = $0 where applicable; tax base updated if needed |
| DISC-P-04 | Stackable vs single code | Spec: one code only | Apply second valid code | Either second rejected with message or stack per rules—**consistent with documented policy** |
| DISC-P-05 | Code with eligible categories only | Code limited to "Electronics" | Cart has eligible + ineligible | Discount applies only to eligible lines |

### 2.2 Negative (N)

| ID | Title | Test data | Steps | Expected result |
|----|--------|-----------|--------|-----------------|
| DISC-N-01 | Expired code | Past `valid_to` | Apply | `400` / `422`; "expired" message |
| DISC-N-02 | Not yet valid code | Future `valid_from` | Apply | Rejected with clear reason |
| DISC-N-03 | Usage limit exhausted | Code `max_uses` reached | Apply | Rejected; no partial discount |
| DISC-N-04 | Below minimum order | Cart $20, code requires $50 | Apply | Rejected; cart unchanged |
| DISC-N-05 | Wrong channel / region | Code US-only, EU checkout | Apply | Rejected per geo rules |
| DISC-N-06 | Case sensitivity | Code stored uppercase; user enters mixed case | Apply | Accepted if spec is case-insensitive; else consistent rejection |

### 2.3 Edge (E)

| ID | Title | Test data | Steps | Expected result |
|----|--------|-----------|--------|-----------------|
| DISC-E-01 | Discount exceeds subtotal | 100% off or fixed > subtotal | Apply | Total floor at $0 (or min charge); no negative payable |
| DISC-E-02 | Apply then remove item | Code valid only with item X | Remove X after apply | Discount recalculated or removed; total consistent |
| DISC-E-03 | Double-submit apply | Same code twice quickly | Two requests | Idempotent: one application or clear duplicate handling; no double discount |
| DISC-E-04 | Whitespace in code | `" SAVE10 "` | Apply | Trimmed match or validation error—**consistent** |

### 2.4 Security (S)

| ID | Title | Steps | Expected result |
|----|--------|--------|-----------------|
| DISC-S-01 | SQL injection in coupon field | `code`: `'; UPDATE coupons SET max_uses=999999--` | Apply | Safe query; no unauthorized DB change |
| DISC-S-02 | Enumeration of valid codes | Brute-force random strings | High volume | Throttle / lockout; no oracle revealing "exists" vs "invalid" beyond generic message if policy requires |
| DISC-S-03 | Privilege escalation | Normal user tries staff-only code | Apply | Rejected same as invalid for non-staff |

---

## 3. Payment processing

### 3.1 Positive (P)

| ID | Title | Preconditions | Test data | Steps | Expected result |
|----|--------|-----------------|-----------|--------|-----------------|
| PAY-P-01 | Successful card charge | Test PSP token / test card | Valid token, amount matches server total | Submit payment | `200`/`201`; PSP success; order `paid` or `processing` |
| PAY-P-02 | 3DS / SCA success flow | Card requires authentication | Follow redirect / challenge | Complete auth | Order completes; webhook/state aligned |
| PAY-P-03 | Partial gift card + card | Gift card covers part | Apply gift card then card for remainder | Pay | Correct split; single order id |
| PAY-P-04 | Currency and amount match | Multi-currency if supported | Checkout in EUR | Charge in EUR; amount matches displayed total |

### 3.2 Negative (N)

| ID | Title | Test data | Steps | Expected result |
|----|--------|-----------|--------|-----------------|
| PAY-N-01 | Declined card | PSP test decline | Submit | User sees decline message; **no** order confirmed as paid; inventory not permanently reduced if spec ties to payment |
| PAY-N-02 | Insufficient funds | PSP simulation | Submit | Decline handled; cart retained |
| PAY-N-03 | Expired or invalid card metadata | Invalid month/year if collected (prefer token flow) | Submit | Validation error before PSP or PSP error mapped safely |
| PAY-N-04 | Amount tampering | Client sends lower `amount` than server total | Submit | Server recomputes; rejects mismatch or charges correct server-side total only |
| PAY-N-05 | Replay old payment intent | Reuse succeeded `payment_intent_id` | Submit again | No second charge; idempotent response |

### 3.3 Edge (E)

| ID | Title | Test data | Steps | Expected result |
|----|--------|-----------|--------|-----------------|
| PAY-E-01 | Timeout / PSP unavailable | Mock PSP timeout | Submit | Graceful failure; user can retry; no orphan "paid" without confirmation |
| PAY-E-02 | Webhook arrives before redirect | Async PSP | Pay | Order eventually consistent; no duplicate orders |
| PAY-E-03 | Rounding: tax + discount + shipping | Totals with 0.01 edge | Pay | Penny-accurate vs accounting rules; PSP amount matches |
| PAY-E-04 | Empty cart checkout blocked | Cart cleared mid-flow | Submit pay | `400` / redirect; no charge |

### 3.4 Security (S)

| ID | Title | Steps | Expected result |
|----|--------|--------|-----------------|
| PAY-S-01 | PAN/CVV not stored or logged | Complete payment with test card | Inspect logs, DB, responses | Only tokens / last4; PCI DSS alignment |
| PAY-S-02 | TLS for all payment-related calls | MITM proxy on HTTP | Force HTTPS | HSTS / redirect; no secrets on plaintext |
| PAY-S-03 | Server-side amount authority | Modify browser DevTools total | Submit | Charged amount = server total only |
| PAY-S-04 | SQL injection in billing name/address | `city`: `'); DELETE FROM orders;--` | Submit | Parameterized; no injection |
| PAY-S-05 | Webhook signature verification | Forged webhook without secret | POST webhook | `401`/`403`; order state unchanged |

---

## 4. Order confirmation

### 4.1 Positive (P)

| ID | Title | Preconditions | Steps | Expected result |
|----|--------|-----------------|--------|-----------------|
| ORD-P-01 | Confirmation page after pay | Payment succeeded | Land on thank-you / order summary | Order number, line items, totals, shipping address displayed |
| ORD-P-02 | Idempotent confirm API | Same checkout session | GET order by id twice | Same payload; stable `order_id` |
| ORD-P-03 | Inventory decremented | Stock tracked | Complete order | Stock reduced; oversell prevented on concurrent buys |

### 4.2 Negative (N)

| ID | Title | Steps | Expected result |
|----|--------|--------|-----------------|
| ORD-N-01 | View order without auth | Anonymous GET `/orders/{id}` | `401`/`403`/`404` per privacy model |
| ORD-N-02 | Cancel already shipped | Illegal transition | `409` / business error |

### 4.3 Edge (E)

| ID | Title | Steps | Expected result |
|----|--------|--------|-----------------|
| ORD-E-01 | Double browser submit | Click "Pay" twice rapidly | At most one paid order; duplicate shows clear message or same order id |
| ORD-E-02 | Order number format | — | Human-readable, unique, non-guessable if security requires |

### 4.4 Security (S)

| ID | Title | Steps | Expected result |
|----|--------|--------|-----------------|
| ORD-S-01 | IDOR: guess sequential order ids | Access other users’ orders | Denied unless ownership proven |
| ORD-S-02 | Sensitive PII on confirmation | View page source / API | Masked where appropriate (full card never shown) |

---

## 5. Email notifications

### 5.1 Positive (P)

| ID | Title | Preconditions | Test data | Steps | Expected result |
|----|--------|-----------------|-----------|--------|-----------------|
| MAIL-P-01 | Order confirmation email | SMTP/mock mailer | Valid customer email | Complete checkout | Email received; contains order id, summary link, support contact |
| MAIL-P-02 | Shipping notification | Fulfillment triggers ship event | — | Mark shipped | "Shipped" email with tracking if applicable |
| MAIL-P-03 | BCC / internal copy | Config requires ops copy | — | Order placed | Internal inbox receives copy per policy |

### 5.2 Negative (N)

| ID | Title | Test data | Steps | Expected result |
|----|--------|-----------|--------|-----------------|
| MAIL-N-01 | Invalid email on account | Malformed email stored incorrectly | Checkout | Validation at registration/checkout; no silent drop without user feedback |
| MAIL-N-02 | Mailer down | Mock SES failure | Complete order | Order still succeeds if async queue; retry / dead-letter; user sees on-site confirmation |

### 5.3 Edge (E)

| ID | Title | Test data | Steps | Expected result |
|----|--------|-----------|--------|-----------------|
| MAIL-E-01 | Long product names in template | 200-char title | Order | Email renders; not truncated mid-HTML |
| MAIL-E-02 | Unicode customer name | "Müller 北京" | Order | UTF-8 correct in subject/body |

### 5.4 Security (S)

| ID | Title | Steps | Expected result |
|----|--------|--------|-----------------|
| MAIL-S-01 | Header injection in name | `name`: `user@x.com\nBcc: attacker@evil.com` | Order | Sanitized; no extra recipients |
| MAIL-S-02 | Phishing links in merchant template | Template uses HTTPS links only | Inspect email | Links to official domain; optional signed deep links |
| MAIL-S-03 | No secrets in email | — | Body contains no full payment tokens, passwords, or internal API keys |

---

## 6. Cross-cutting checkout scenarios

### 6.1 Empty cart and invalid payment (highlighted edge cases)

| ID | Title | Steps | Expected result |
|----|--------|--------|-----------------|
| XCHK-E-01 | Navigate to checkout with empty cart | Go to `/checkout` with no lines | Redirect to cart or message; no payment step |
| XCHK-E-02 | Payment API with empty `order_id` / no cart | POST pay without lines | `400`; no PSP call or zero-amount policy explicit |
| XCHK-E-03 | Invalid payment method id | Random `payment_method_id` | PSP error mapped to safe user message |
| XCHK-E-04 | Checkout after inventory race | Pay succeeds but stock lost between authorize and capture | Defined policy: cancel, partial fulfill, or backorder with notice |

### 6.2 Security summary matrix

| Area | Risk | Test focus |
|------|------|-------------|
| Cart | SQLi, IDOR | Parameterized IDs; auth on cart resource |
| Discount | SQLi, enumeration | Server validation; rate limits |
| Payment | Tampered amount, PAN leakage, forged webhooks | Server totals; tokens; signature verify |
| Order | IDOR, double submit | Ownership checks; idempotency keys |
| Email | Header injection, secret leakage | Sanitize inputs; template review |

---

## 7. Traceability snippet (for automation)

When implementing automated tests, map **test method names** or **pytest ids** to the IDs above (e.g. `test_CART_P_01_add_single_sku`). Group test classes by **Cart**, **Discount**, **Payment**, **Order**, **Email** to mirror this document.

---

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-15 | Initial comprehensive checkout test case catalog |
