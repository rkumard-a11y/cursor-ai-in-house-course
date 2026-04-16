import { useCallback, useState } from 'react'
import { ProductCard } from '../components'
import type { Product } from '../components'
import { SAMPLE_PRODUCTS } from '../data/sampleProducts'

export type ProductCardDemoPageProps = {
  /** Section id for in-page navigation (scroll-spy) */
  sectionId?: string
  /** Heading element id for `aria-labelledby` */
  headingId?: string
}

export function ProductCardDemoPage({
  sectionId = 'products',
  headingId = 'products-heading',
}: ProductCardDemoPageProps) {
  const [cartIds, setCartIds] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const addToCart = useCallback((product: Product) => {
    setCartIds((prev) => [...prev, product.id])
    setToast(`${product.title} added to cart.`)
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  return (
    <section
      id={sectionId}
      aria-labelledby={headingId}
      className="scroll-mt-24 border-b border-slate-200/80 py-10 sm:px-6 lg:px-8 lg:py-14 dark:border-slate-800/80"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-0">
      <header className="mx-auto mb-10 max-w-3xl text-center lg:mb-12 lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
          E-commerce
        </p>
        <h1
          id={headingId}
          className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white"
        >
          Product cards
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400">
          Responsive catalog tiles with ratings, pricing, and an accessible cart action.
          Hover a card or button to see motion (reduced when “prefer reduced motion” is on).
        </p>
        <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">
          Items in cart (demo):{' '}
          <span className="tabular-nums text-violet-600 dark:text-violet-400">
            {cartIds.length}
          </span>
        </p>
      </header>

      <div
        className="mb-8 min-h-[2.75rem] rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 sm:px-5"
        aria-live="polite"
        aria-atomic="true"
      >
        {toast ?? (
          <span className="text-slate-500 dark:text-slate-500">
            Use “Add to Cart” on any product to update the counter and this message.
          </span>
        )}
      </div>

      <ul className="grid list-none grid-cols-1 gap-8 p-0 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-10">
        {SAMPLE_PRODUCTS.map((product) => (
          <li key={product.id} className="min-w-0">
            <ProductCard
              product={product}
              onAddToCart={addToCart}
              addDisabled={
                product.active === false ||
                (product.stock !== undefined && product.stock <= 0)
              }
            />
          </li>
        ))}
      </ul>
      </div>
    </section>
  )
}
