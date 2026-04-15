import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Product } from '../components'

export type DemoCartLine = {
  lineId: string
  product: Product
}

type DemoCartContextValue = {
  lines: DemoCartLine[]
  itemCount: number
  addToCart: (product: Product) => void
  removeLine: (lineId: string) => void
  clearCart: () => void
}

const DemoCartContext = createContext<DemoCartContextValue | null>(null)

function newLineId(productId: string) {
  return `${productId}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

export function DemoCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<DemoCartLine[]>([])

  const addToCart = useCallback((product: Product) => {
    setLines((prev) => [
      ...prev,
      { lineId: newLineId(product.id), product: { ...product } },
    ])
  }, [])

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId))
  }, [])

  const clearCart = useCallback(() => {
    setLines([])
  }, [])

  const value = useMemo<DemoCartContextValue>(
    () => ({
      lines,
      itemCount: lines.length,
      addToCart,
      removeLine,
      clearCart,
    }),
    [lines, addToCart, removeLine, clearCart],
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
