import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { Product } from '..'
import type { LastOrder } from '../../context/cartTypes'
import { useDemoCart } from '../../context/DemoCartContext'
import type { MockPaymentMethod } from '../../lib/checkoutDemo'

function formatMoney(amount: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `$${amount.toFixed(2)}`
  }
}

function lineTotal(product: Product, qty: number) {
  return formatMoney(product.price * qty, product.currency ?? 'USD')
}

const PAYMENT_OPTIONS: { value: MockPaymentMethod; label: string }[] = [
  { value: 'tok_success', label: 'Test: Payment succeeds' },
  { value: 'tok_decline', label: 'Test: Card declined' },
  { value: 'tok_insufficient', label: 'Test: Insufficient funds' },
  { value: 'tok_invalid_expiry', label: 'Test: Invalid expiry' },
]

/**
 * Full-screen checkout: discount codes, PCI-safe mock payment tokens, totals, confirmation + email notice.
 * Maps to docs/test-cases-ecommerce-checkout.md (DISC-*, PAY-*, ORD-*, MAIL-*).
 */
export function CheckoutModal() {
  const { isCheckoutOpen, checkoutSessionId } = useDemoCart()
  if (!isCheckoutOpen) return null
  return <CheckoutModalInner key={checkoutSessionId} />
}

function CheckoutModalInner() {
  const headingId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const {
    closeCheckout,
    lines,
    totals,
    appliedPromoCode,
    promoEvaluation,
    promoStale,
    applyPromo,
    clearPromo,
    placeOrder,
    clearLastOrder,
  } = useDemoCart()

  const [email, setEmail] = useState('you@example.com')
  const [promoDraft, setPromoDraft] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)
  const [payError, setPayError] = useState<string | null>(null)
  const [payment, setPayment] = useState<MockPaymentMethod>('tok_success')
  const [busy, setBusy] = useState(false)
  const [confirmed, setConfirmed] = useState<LastOrder | null>(null)

  useEffect(() => {
    if (lines.length === 0 && !confirmed) {
      closeCheckout()
    }
  }, [lines.length, confirmed, closeCheckout])

  useLayoutEffect(() => {
    const el = dialogRef.current
    const focusable = el?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    focusable?.focus()
  }, [])

  const onApplyPromo = () => {
    setPromoError(null)
    const r = applyPromo(promoDraft)
    if (!r.ok) setPromoError(r.message)
    else setPromoDraft('')
  }

  const onPlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setPayError(null)
    setBusy(true)
    const r = await placeOrder({ email, payment })
    setBusy(false)
    if (!r.ok) {
      setPayError(r.message)
      return
    }
    setConfirmed(r.order)
  }

  const onDone = () => {
    clearLastOrder()
    closeCheckout()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget && !busy) closeCheckout()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        data-testid="checkout-modal"
        className="flex max-h-[min(100dvh,42rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
          <h2 id={headingId} className="text-lg font-semibold text-slate-900 dark:text-white">
            {confirmed ? 'Order confirmed' : 'Checkout'}
          </h2>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => !busy && (confirmed ? onDone() : closeCheckout())}
          >
            {confirmed ? 'Done' : 'Close'}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {confirmed ? (
            <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <p>
                Thank you! Your order{' '}
                <span className="font-mono font-semibold text-violet-700 dark:text-violet-300">
                  {confirmed.orderId}
                </span>{' '}
                is confirmed.
              </p>
              <p>
                Total charged:{' '}
                <span className="font-semibold tabular-nums">
                  {formatMoney(confirmed.totals.total, confirmed.totals.currency)}
                </span>
              </p>
              <div
                className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100"
                role="status"
              >
                <p className="font-medium">Email notification</p>
                <p className="mt-1 text-emerald-900/90 dark:text-emerald-100/90">
                  A confirmation message was queued to{' '}
                  <span className="break-all font-medium">{confirmed.customerEmail}</span> (demo — no
                  real email is sent).
                </p>
              </div>
              <ul className="list-none space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                {confirmed.lines.map((line) => (
                  <li key={line.lineId} className="flex justify-between gap-2 text-slate-600 dark:text-slate-400">
                    <span className="min-w-0 truncate">
                      {line.product.title}{' '}
                      <span className="text-slate-400 dark:text-slate-500">×{line.quantity}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {lineTotal(line.product, line.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={onPlaceOrder}>
              <section aria-labelledby="checkout-summary-heading">
                <h3 id="checkout-summary-heading" className="text-sm font-semibold text-slate-900 dark:text-white">
                  Order summary
                </h3>
                <ul className="mt-2 list-none space-y-2">
                  {lines.map((line) => (
                    <li
                      key={line.lineId}
                      className="flex justify-between gap-2 text-sm text-slate-700 dark:text-slate-300"
                    >
                      <span className="min-w-0 truncate">
                        {line.product.title}{' '}
                        <span className="text-slate-500 dark:text-slate-400">×{line.quantity}</span>
                      </span>
                      <span className="shrink-0 tabular-nums font-medium">
                        {lineTotal(line.product, line.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section aria-labelledby="checkout-discount-heading">
                <h3 id="checkout-discount-heading" className="text-sm font-semibold text-slate-900 dark:text-white">
                  Discount code
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Demo codes: <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">SAVE10</code>,{' '}
                  <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">FLAT5</code>,{' '}
                  <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">FREESHIP</code>,{' '}
                  <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">ELEC10</code> (Electronics),{' '}
                  <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">SAVEBIG</code> (min $50). Try{' '}
                  <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">EXPIRED</code> for errors.
                </p>
                {promoStale && appliedPromoCode && promoEvaluation && !promoEvaluation.ok ? (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                    {promoEvaluation.message}{' '}
                    <button
                      type="button"
                      className="font-semibold text-amber-900 underline dark:text-amber-50"
                      onClick={() => clearPromo()}
                    >
                      Remove code
                    </button>
                  </p>
                ) : null}
                {appliedPromoCode && promoEvaluation?.ok ? (
                  <p className="mt-2 text-sm text-violet-700 dark:text-violet-300">
                    Applied: <span className="font-mono">{appliedPromoCode}</span> — {promoEvaluation.label}
                    <button
                      type="button"
                      className="ml-2 text-xs font-medium text-slate-600 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      onClick={() => clearPromo()}
                    >
                      Remove
                    </button>
                  </p>
                ) : null}
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    name="promo"
                    autoComplete="off"
                    value={promoDraft}
                    onChange={(e) => setPromoDraft(e.target.value)}
                    placeholder="Enter code"
                    data-testid="checkout-promo-input"
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-violet-500/0 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                    onClick={onApplyPromo}
                  >
                    Apply
                  </button>
                </div>
                {promoError ? (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                    {promoError}
                  </p>
                ) : null}
              </section>

              <section className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex justify-between py-0.5 text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatMoney(totals.subtotal, totals.currency)}</span>
                </div>
                {totals.discount > 0 ? (
                  <div className="flex justify-between py-0.5 text-emerald-700 dark:text-emerald-400">
                    <span>Discount</span>
                    <span className="tabular-nums">−{formatMoney(totals.discount, totals.currency)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between py-0.5 text-slate-600 dark:text-slate-400">
                  <span>Shipping</span>
                  <span className="tabular-nums">
                    {totals.shipping === 0 ? 'Free' : formatMoney(totals.shipping, totals.currency)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 text-slate-600 dark:text-slate-400">
                  <span>Estimated tax</span>
                  <span className="tabular-nums">{formatMoney(totals.tax, totals.currency)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                  <span>Total</span>
                  <span className="tabular-nums">{formatMoney(totals.total, totals.currency)}</span>
                </div>
              </section>

              <section>
                <label htmlFor="checkout-email" className="text-sm font-semibold text-slate-900 dark:text-white">
                  Email for confirmation
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="checkout-email-input"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Card data is never collected in this demo — choose a mock payment outcome below (PAY-S-01).
                </p>
              </section>

              <section>
                <label htmlFor="checkout-payment" className="text-sm font-semibold text-slate-900 dark:text-white">
                  Payment (mock token)
                </label>
                <select
                  id="checkout-payment"
                  value={payment}
                  onChange={(e) => setPayment(e.target.value as MockPaymentMethod)}
                  data-testid="checkout-payment-select"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                >
                  {PAYMENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </section>

              {payError ? (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {payError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy || lines.length === 0 || promoStale}
                data-testid="checkout-place-order"
                className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-sm outline-none transition hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-400 dark:focus-visible:ring-offset-slate-900"
              >
                {busy ? 'Processing…' : 'Place order'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
