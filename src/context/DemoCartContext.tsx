/* eslint-disable react-refresh/only-export-components -- context provider + consumer hook belong together */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Product } from '../components'
import {
  MAX_LINE_QTY,
  cartSubtotal,
  computeOrderTotals,
  evaluatePromo,
  hasSuspiciousCheckoutInput,
  isPlausibleEmail,
  mockProcessPayment,
  newOrderId,
  normalizePromoCode,
  sanitizeOrderEmail,
  type MockPaymentMethod,
  type OrderTotals,
  type PromoEvaluation,
} from '../lib/checkoutDemo'
import type {
  CartAddResult,
  DemoCartLine,
  LastOrder,
  PlaceOrderResult,
} from './cartTypes'

type DemoCartContextValue = {
  lines: DemoCartLine[]
  itemCount: number
  subtotal: number
  appliedPromoCode: string | null
  promoEvaluation: PromoEvaluation | null
  /** When a code is stored but no longer qualifies, totals ignore discount; UI can prompt to remove. */
  promoStale: boolean
  totals: OrderTotals
  isCheckoutOpen: boolean
  checkoutSessionId: number
  lastOrder: LastOrder | null
  openCheckout: () => void
  closeCheckout: () => void
  clearLastOrder: () => void
  addToCart: (product: Product, qty?: number) => CartAddResult
  setLineQuantity: (lineId: string, qty: number) => CartAddResult
  removeLine: (lineId: string) => void
  clearCart: () => void
  applyPromo: (raw: string) => { ok: true } | { ok: false; message: string }
  clearPromo: () => void
  placeOrder: (input: {
    email: string
    payment: MockPaymentMethod
  }) => Promise<PlaceOrderResult>
}

const DemoCartContext = createContext<DemoCartContextValue | null>(null)

function newLineId(productId: string) {
  return `${productId}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

export function DemoCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<DemoCartLine[]>([])
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [checkoutSessionId, setCheckoutSessionId] = useState(0)
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null)

  const promoEvaluation = useMemo<PromoEvaluation | null>(() => {
    if (!appliedPromoCode) return null
    return evaluatePromo(appliedPromoCode, lines)
  }, [appliedPromoCode, lines])

  const promoStale = Boolean(
    appliedPromoCode && promoEvaluation && !promoEvaluation.ok,
  )

  const totals = useMemo(
    () =>
      computeOrderTotals(
        lines,
        promoEvaluation && promoEvaluation.ok ? promoEvaluation : null,
      ),
    [lines, promoEvaluation],
  )

  const itemCount = useMemo(
    () => lines.reduce((n, line) => n + line.quantity, 0),
    [lines],
  )

  const subtotal = useMemo(() => cartSubtotal(lines), [lines])

  const addToCart = useCallback((product: Product, qty = 1): CartAddResult => {
    if (product.active === false) {
      return { ok: false, message: 'This product is no longer available.' }
    }
    const stock = product.stock ?? 999
    if (stock <= 0) {
      return { ok: false, message: 'This item is out of stock.' }
    }
    if (!Number.isInteger(qty) || qty < 1) {
      return { ok: false, message: 'Choose a quantity of at least 1.' }
    }
    if (qty > MAX_LINE_QTY) {
      return { ok: false, message: `You can add at most ${MAX_LINE_QTY} per line.` }
    }

    let result: CartAddResult = { ok: true }
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      const currentQty = existing?.quantity ?? 0
      const maxAllowed = Math.min(MAX_LINE_QTY, stock)
      const nextQty = currentQty + qty
      if (nextQty > maxAllowed) {
        result = {
          ok: false,
          message:
            currentQty >= maxAllowed
              ? 'Maximum quantity for this item is already in your cart.'
              : `Only ${maxAllowed - currentQty} more of this item can be added.`,
        }
        return prev
      }
      if (existing) {
        return prev.map((l) =>
          l.lineId === existing.lineId ? { ...l, quantity: nextQty } : l,
        )
      }
      return [
        ...prev,
        { lineId: newLineId(product.id), product: { ...product }, quantity: qty },
      ]
    })
    return result
  }, [])

  const setLineQuantity = useCallback((lineId: string, qty: number): CartAddResult => {
    if (!Number.isInteger(qty) || qty < 1) {
      return { ok: false, message: 'Use quantity 1 or more, or remove the line.' }
    }
    let result: CartAddResult = { ok: true }
    setLines((prev) => {
      const line = prev.find((l) => l.lineId === lineId)
      if (!line) return prev
      const stock = line.product.stock ?? 999
      const cap = Math.min(MAX_LINE_QTY, stock)
      if (qty > cap) {
        result = { ok: false, message: `Maximum for this item is ${cap}.` }
        return prev
      }
      return prev.map((l) => (l.lineId === lineId ? { ...l, quantity: qty } : l))
    })
    return result
  }, [])

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId))
  }, [])

  const clearCart = useCallback(() => {
    setLines([])
    setAppliedPromoCode(null)
  }, [])

  const applyPromo = useCallback(
    (raw: string): { ok: true } | { ok: false; message: string } => {
      if (lines.length === 0) {
        return { ok: false, message: 'Add items before applying a discount code.' }
      }
      const ev = evaluatePromo(raw, lines)
      if (!ev.ok) {
        return { ok: false, message: ev.message }
      }
      setAppliedPromoCode(normalizePromoCode(raw))
      return { ok: true }
    },
    [lines],
  )

  const clearPromo = useCallback(() => {
    setAppliedPromoCode(null)
  }, [])

  const openCheckout = useCallback(() => {
    setCheckoutSessionId((id) => id + 1)
    setIsCheckoutOpen(true)
  }, [])

  const closeCheckout = useCallback(() => {
    setIsCheckoutOpen(false)
  }, [])

  const clearLastOrder = useCallback(() => {
    setLastOrder(null)
  }, [])

  const placeOrder = useCallback(
    async (input: { email: string; payment: MockPaymentMethod }): Promise<PlaceOrderResult> => {
      if (lines.length === 0) {
        return { ok: false, message: 'Your cart is empty. Add products before paying.' }
      }

      const cleanEmail = sanitizeOrderEmail(input.email)
      if (!isPlausibleEmail(cleanEmail)) {
        return { ok: false, message: 'Enter a valid email for your receipt and shipping updates.' }
      }
      if (hasSuspiciousCheckoutInput(cleanEmail)) {
        return { ok: false, message: 'Check your email address and try again.' }
      }

      const promoForTotals: PromoEvaluation | null = appliedPromoCode
        ? evaluatePromo(appliedPromoCode, lines)
        : null

      if (appliedPromoCode && promoForTotals && !promoForTotals.ok) {
        return { ok: false, message: promoForTotals.message }
      }

      const paymentResult = mockProcessPayment(input.payment)
      if (!paymentResult.ok) {
        return { ok: false, message: paymentResult.message }
      }

      await new Promise((r) => window.setTimeout(r, 450))

      const orderTotals = computeOrderTotals(
        lines,
        promoForTotals && promoForTotals.ok ? promoForTotals : null,
      )

      const order: LastOrder = {
        orderId: newOrderId(),
        placedAt: Date.now(),
        customerEmail: cleanEmail,
        lines: lines.map((l) => ({
          lineId: l.lineId,
          quantity: l.quantity,
          product: { ...l.product },
        })),
        totals: orderTotals,
        emailQueued: true,
      }

      setLastOrder(order)
      setLines([])
      setAppliedPromoCode(null)
      return { ok: true, order }
    },
    [lines, appliedPromoCode],
  )

  const value = useMemo<DemoCartContextValue>(
    () => ({
      lines,
      itemCount,
      subtotal,
      appliedPromoCode,
      promoEvaluation,
      promoStale,
      totals,
      isCheckoutOpen,
      checkoutSessionId,
      lastOrder,
      openCheckout,
      closeCheckout,
      clearLastOrder,
      addToCart,
      setLineQuantity,
      removeLine,
      clearCart,
      applyPromo,
      clearPromo,
      placeOrder,
    }),
    [
      lines,
      itemCount,
      subtotal,
      appliedPromoCode,
      promoEvaluation,
      promoStale,
      totals,
      isCheckoutOpen,
      checkoutSessionId,
      lastOrder,
      openCheckout,
      closeCheckout,
      clearLastOrder,
      addToCart,
      setLineQuantity,
      removeLine,
      clearCart,
      applyPromo,
      clearPromo,
      placeOrder,
    ],
  )

  return <DemoCartContext.Provider value={value}>{children}</DemoCartContext.Provider>
}

export function useDemoCart(): DemoCartContextValue {
  const ctx = useContext(DemoCartContext)
  if (!ctx) {
    throw new Error('useDemoCart must be used within DemoCartProvider')
  }
  return ctx
}
