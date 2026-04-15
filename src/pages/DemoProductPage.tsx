import { useCallback, useState } from 'react'
import type { Product } from '../components'
import { useDemoCart } from '../context/DemoCartContext'
import { ProductCatalogSearch } from './ProductSearchPage'

/**
 * Searchable catalog (filters, sort, pagination); cart state syncs to the hub header.
 */
export function DemoProductPage() {
  const { addToCart: addToCartContext } = useDemoCart()
  const [toast, setToast] = useState<string | null>(null)

  const addToCart = useCallback(
    (product: Product) => {
      addToCartContext(product)
      setToast(`${product.title} added to cart.`)
      window.setTimeout(() => setToast(null), 3200)
    },
    [addToCartContext],
  )

  return (
    <div className="min-h-full">
      {toast ? (
        <div
          className="border-b border-slate-200/80 bg-violet-50/90 px-4 py-2 text-center text-sm font-medium text-violet-900 dark:border-slate-800 dark:bg-violet-500/10 dark:text-violet-100 sm:px-6"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {toast}
        </div>
      ) : null}

      <ProductCatalogSearch onAddToCart={addToCart} />
    </div>
  )
}
