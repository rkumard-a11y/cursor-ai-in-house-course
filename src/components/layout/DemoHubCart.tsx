import { useEffect, useId, useRef, useState } from 'react'
import type { Product } from '..'
import { useDemoCart } from '../../context/DemoCartContext'

function formatLinePrice(p: Product) {
  const code = p.currency ?? 'USD'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
    }).format(p.price)
  } catch {
    return `${p.currency ?? '$'}${p.price.toFixed(2)}`
  }
}

export function DemoHubCart() {
  const { lines, itemCount, removeLine, clearCart } = useDemoCart()
  const [open, setOpen] = useState(false)
  const btnId = useId().replace(/:/g, '')
  const menuId = useId().replace(/:/g, '')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      if (document.getElementById(btnId)?.contains(t)) return
      setOpen(false)
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open, btnId])

  return (
    <div className="relative">
      <button
        id={btnId}
        type="button"
        data-testid="demo-hub-cart"
        className="relative inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        <svg
          className="h-5 w-5 shrink-0 text-slate-600 dark:text-slate-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 6h15l-1.5 9h-12z" />
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
        </svg>
        <span className="hidden sm:inline">Cart</span>
        <span
          className={`inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums ${
            itemCount > 0
              ? 'bg-violet-600 text-white dark:bg-violet-500'
              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
          }`}
          aria-label={`${itemCount} items in cart`}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      </button>

      <div
        ref={panelRef}
        id={menuId}
        role="menu"
        aria-labelledby={btnId}
        aria-hidden={!open}
        className={`absolute right-0 z-[60] mt-2 w-[min(calc(100vw-2rem),22rem)] origin-top-right rounded-xl border border-slate-200 bg-white/98 p-2 shadow-xl ring-1 ring-slate-900/5 backdrop-blur-md transition-[opacity,transform] duration-200 ease-out dark:border-slate-700 dark:bg-slate-900/98 dark:ring-white/10 ${
          open
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
        } motion-reduce:transition-none`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-2 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Your cart</p>
          {itemCount > 0 ? (
            <button
              type="button"
              role="menuitem"
              className="text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
              onClick={() => {
                clearCart()
                setOpen(false)
              }}
            >
              Clear all
            </button>
          ) : null}
        </div>

        {itemCount === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Cart is empty. Add products from the Products page.
          </p>
        ) : (
          <ul className="mt-1 max-h-72 list-none space-y-1 overflow-y-auto p-0">
            {lines.map(({ lineId, product }) => (
              <li
                key={lineId}
                className="flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/80"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {product.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatLinePrice(product)}</p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                  onClick={() => removeLine(lineId)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
