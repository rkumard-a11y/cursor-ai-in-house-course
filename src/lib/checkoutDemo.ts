import type { Product } from '../components'

/** Mirrors doc CART-E-01 — max units per line in this demo. */
export const MAX_LINE_QTY = 99

export const DEFAULT_SHIPPING_USD = 9.99
export const TAX_RATE = 0.0725

export type CartLineLike = {
  quantity: number
  product: Product
}

export type MockPaymentMethod =
  | 'tok_success'
  | 'tok_decline'
  | 'tok_insufficient'
  | 'tok_invalid_expiry'

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export function cartSubtotal(lines: CartLineLike[]): number {
  if (lines.length === 0) return 0
  const sum = lines.reduce((acc, line) => acc + line.product.price * line.quantity, 0)
  return roundMoney(sum)
}

/** DISC-S-01 / CART-S-01 style — reject obviously dangerous patterns client-side. */
export function hasSuspiciousCheckoutInput(value: string): boolean {
  const s = value.toLowerCase()
  return (
    s.includes("'") ||
    s.includes('--') ||
    s.includes(';') ||
    s.includes('/*') ||
    s.includes('drop table') ||
    s.includes('update ') ||
    s.includes('delete from')
  )
}

export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase()
}

export type PromoEvaluation =
  | {
      ok: true
      discountAmount: number
      freeShipping: boolean
      label: string
    }
  | { ok: false; message: string }

/**
 * Server-style promo rules (single active code). Case-insensitive after trim (DISC-N-06 / DISC-E-04).
 */
export function evaluatePromo(codeRaw: string, lines: CartLineLike[]): PromoEvaluation {
  const code = normalizePromoCode(codeRaw)
  if (!code) {
    return { ok: false, message: 'Enter a discount code.' }
  }
  if (hasSuspiciousCheckoutInput(codeRaw)) {
    return { ok: false, message: 'Unable to apply this code.' }
  }

  const subtotal = cartSubtotal(lines)
  if (subtotal <= 0) {
    return { ok: false, message: 'Add items to your cart before applying a code.' }
  }

  switch (code) {
    case 'SAVE10': {
      const discountAmount = roundMoney(subtotal * 0.1)
      return {
        ok: true,
        discountAmount,
        freeShipping: false,
        label: '10% off your order',
      }
    }
    case 'FLAT5': {
      const discountAmount = roundMoney(Math.min(5, subtotal))
      return {
        ok: true,
        discountAmount,
        freeShipping: false,
        label: '$5 off your order',
      }
    }
    case 'FREESHIP':
      return {
        ok: true,
        discountAmount: 0,
        freeShipping: true,
        label: 'Free standard shipping',
      }
    case 'ELEC10': {
      const elecSum = lines
        .filter((l) => (l.product.category ?? '').toLowerCase() === 'electronics')
        .reduce((acc, l) => acc + l.product.price * l.quantity, 0)
      if (elecSum <= 0) {
        return { ok: false, message: 'This code only applies to Electronics in your cart.' }
      }
      const discountAmount = roundMoney(elecSum * 0.1)
      return {
        ok: true,
        discountAmount,
        freeShipping: false,
        label: '10% off Electronics',
      }
    }
    case 'SAVEBIG': {
      if (subtotal < 50) {
        return { ok: false, message: 'This code requires a minimum order of $50.' }
      }
      return {
        ok: true,
        discountAmount: roundMoney(subtotal * 0.15),
        freeShipping: false,
        label: '15% off orders $50+',
      }
    }
    case 'EXPIRED':
      return { ok: false, message: 'This promotion has expired.' }
    case 'NOTYET':
      return { ok: false, message: 'This code is not active yet.' }
    case 'ALLUSED':
      return { ok: false, message: 'This code has reached its usage limit.' }
    case 'STAFFONLY':
      return { ok: false, message: 'Unable to apply this code.' }
    default:
      return { ok: false, message: 'We could not find that discount code.' }
  }
}

export type OrderTotals = {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  currency: string
}

export function computeOrderTotals(
  lines: CartLineLike[],
  promo: PromoEvaluation | null,
  currency = 'USD',
): OrderTotals {
  const subtotal = cartSubtotal(lines)
  const discount =
    promo && promo.ok ? Math.min(promo.discountAmount, subtotal) : 0
  const freeShip = promo && promo.ok && promo.freeShipping
  const shipping = lines.length === 0 ? 0 : freeShip ? 0 : DEFAULT_SHIPPING_USD
  const taxable = Math.max(0, roundMoney(subtotal - discount + shipping))
  const tax = roundMoney(taxable * TAX_RATE)
  const total = roundMoney(taxable + tax)
  return { subtotal, discount, shipping, tax, total, currency }
}

export function mockProcessPayment(method: MockPaymentMethod): { ok: true } | { ok: false; message: string } {
  switch (method) {
    case 'tok_success':
      return { ok: true }
    case 'tok_decline':
      return { ok: false, message: 'Your card was declined. Try another payment method.' }
    case 'tok_insufficient':
      return { ok: false, message: 'Insufficient funds. Your cart was kept for you.' }
    case 'tok_invalid_expiry':
      return { ok: false, message: 'Check the expiration date on your card.' }
    default:
      return { ok: false, message: 'Invalid payment method.' }
  }
}

export function sanitizeOrderEmail(raw: string): string {
  return raw.replace(/[\r\n]/g, '').trim()
}

export function isPlausibleEmail(email: string): boolean {
  const e = sanitizeOrderEmail(email)
  if (e.length < 5 || e.length > 254) return false
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false
  return true
}

export function newOrderId(): string {
  const part = Date.now().toString(36).toUpperCase()
  return `ORD-${part}`
}
