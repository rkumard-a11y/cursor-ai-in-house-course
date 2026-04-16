import type { Product } from '../components'
import type { OrderTotals } from '../lib/checkoutDemo'

export type DemoCartLine = {
  lineId: string
  product: Product
  quantity: number
}

export type CartAddResult = { ok: true } | { ok: false; message: string }

export type LastOrder = {
  orderId: string
  placedAt: number
  customerEmail: string
  lines: DemoCartLine[]
  totals: OrderTotals
  emailQueued: boolean
}

export type PlaceOrderResult =
  | { ok: true; order: LastOrder }
  | { ok: false; message: string }
