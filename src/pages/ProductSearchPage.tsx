import { useCallback, useMemo, useState } from 'react'
import { ProductCard } from '../components'
import type { Product } from '../components'
import { SAMPLE_PRODUCTS } from '../data/sampleProducts'

const PAGE_SIZE = 2

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc'

const ALL_CATEGORIES = Array.from(
  new Set(
    SAMPLE_PRODUCTS.map((p) => p.category ?? 'General').filter(Boolean),
  ),
).sort()

function normalizeCategory(p: Product): string {
  return p.category ?? 'General'
}

function filterProducts(
  products: Product[],
  query: string,
  category: string,
  minPrice: number | null,
  maxPrice: number | null,
): Product[] {
  const q = query.trim().toLowerCase()
  return products.filter((p) => {
    if (q) {
      const hay = `${p.title} ${p.description}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (category && category !== 'all') {
      if (normalizeCategory(p) !== category) return false
    }
    if (minPrice != null && p.price < minPrice) return false
    if (maxPrice != null && p.price > maxPrice) return false
    return true
  })
}

function sortProducts(products: Product[], sort: SortOption): Product[] {
  const copy = [...products]
  const originalIndex = new Map(copy.map((p, i) => [p.id, i]))
  switch (sort) {
    case 'price-asc':
      return copy.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return copy.sort((a, b) => b.price - a.price)
    case 'name-asc':
      return copy.sort((a, b) => a.title.localeCompare(b.title))
    case 'featured':
    default:
      return copy.sort(
        (a, b) =>
          (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0),
      )
  }
}

export type ProductCatalogSearchProps = {
  /** Wired to the same cart toast flow as the product hero when provided */
  onAddToCart?: (product: Product) => void
}

/**
 * Searchable catalog: query, category & price filters, sort, pagination, empty & error states.
 */
export function ProductCatalogSearch({ onAddToCart }: ProductCatalogSearchProps) {
  const [draftQuery, setDraftQuery] = useState('')
  const [draftCategory, setDraftCategory] = useState('all')
  const [draftMin, setDraftMin] = useState('')
  const [draftMax, setDraftMax] = useState('')
  const [draftSort, setDraftSort] = useState<SortOption>('featured')

  const [appliedQuery, setAppliedQuery] = useState('')
  const [appliedCategory, setAppliedCategory] = useState('all')
  const [appliedMin, setAppliedMin] = useState<number | null>(null)
  const [appliedMax, setAppliedMax] = useState<number | null>(null)
  const [appliedSort, setAppliedSort] = useState<SortOption>('featured')

  const [pageIndex, setPageIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const filteredSorted = useMemo(() => {
    const filtered = filterProducts(
      SAMPLE_PRODUCTS,
      appliedQuery,
      appliedCategory,
      appliedMin,
      appliedMax,
    )
    return sortProducts(filtered, appliedSort)
  }, [
    appliedQuery,
    appliedCategory,
    appliedMin,
    appliedMax,
    appliedSort,
  ])

  const pageCount = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE))
  const safePage = Math.min(pageIndex, pageCount - 1)
  const sliceStart = safePage * PAGE_SIZE
  const pageItems = filteredSorted.slice(sliceStart, sliceStart + PAGE_SIZE)
  const total = filteredSorted.length

  const applyFilters = useCallback(() => {
    setError(null)
    const minRaw = draftMin.trim()
    const maxRaw = draftMax.trim()
    let minN: number | null = null
    let maxN: number | null = null
    if (minRaw !== '') {
      const n = Number(minRaw)
      if (!Number.isFinite(n)) {
        setError('Minimum price must be a valid number.')
        return
      }
      minN = n
    }
    if (maxRaw !== '') {
      const n = Number(maxRaw)
      if (!Number.isFinite(n)) {
        setError('Maximum price must be a valid number.')
        return
      }
      maxN = n
    }
    if (minN != null && maxN != null && minN > maxN) {
      setError('Minimum price cannot be greater than maximum price.')
      return
    }
    setAppliedQuery(draftQuery)
    setAppliedCategory(draftCategory)
    setAppliedMin(minN)
    setAppliedMax(maxN)
    setAppliedSort(draftSort)
    setPageIndex(0)
  }, [draftQuery, draftCategory, draftMin, draftMax, draftSort])

  const clearAll = useCallback(() => {
    setDraftQuery('')
    setDraftCategory('all')
    setDraftMin('')
    setDraftMax('')
    setDraftSort('featured')
    setAppliedQuery('')
    setAppliedCategory('all')
    setAppliedMin(null)
    setAppliedMax(null)
    setAppliedSort('featured')
    setPageIndex(0)
    setError(null)
  }, [])

  const goPrev = useCallback(() => {
    setPageIndex((p) => {
      const c = Math.min(Math.max(0, p), pageCount - 1)
      return Math.max(0, c - 1)
    })
  }, [pageCount])

  const goNext = useCallback(() => {
    setPageIndex((p) => {
      const c = Math.min(Math.max(0, p), pageCount - 1)
      return Math.min(pageCount - 1, c + 1)
    })
  }, [pageCount])

  const showingFrom = total === 0 ? 0 : sliceStart + 1
  const showingTo = total === 0 ? 0 : sliceStart + pageItems.length

  return (
    <div className="min-h-0">
      <section
        className="border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/80 to-slate-50 dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/80"
        aria-labelledby="product-catalog-search-heading"
      >
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <h2
            id="product-catalog-search-heading"
            className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-white"
          >
            Search and filter
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Search by title or description, narrow by category and price, sort results, and browse
            pages. Apply filters to refresh the list.
          </p>

          <div className="mt-8 grid gap-4 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              Search
              <input
                data-testid="product-search-query"
                type="search"
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyFilters()
                }}
                placeholder="Title or description…"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-violet-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              Category
              <select
                data-testid="category-filter"
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-violet-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="all">All categories</option>
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              Min price
              <input
                data-testid="price-min"
                inputMode="decimal"
                value={draftMin}
                onChange={(e) => setDraftMin(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-violet-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              Max price
              <input
                data-testid="price-max"
                inputMode="decimal"
                value={draftMax}
                onChange={(e) => setDraftMax(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-violet-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-2 lg:col-span-2">
              Sort by
              <select
                data-testid="sort-select"
                value={draftSort}
                onChange={(e) => setDraftSort(e.target.value as SortOption)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-violet-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="featured">Featured (catalog order)</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name-asc">Name: A–Z</option>
              </select>
            </label>
            <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-2">
              <button
                type="button"
                data-testid="apply-filters"
                onClick={applyFilters}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                Apply filters
              </button>
              <button
                type="button"
                data-testid="clear-filters"
                onClick={clearAll}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Clear all
              </button>
            </div>
          </div>

          {error ? (
            <div
              data-testid="search-error"
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
            >
              {error}
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p
          data-testid="result-summary"
          className="text-sm text-slate-600 dark:text-slate-400"
        >
          Showing {showingFrom}–{showingTo} of {total} products
          {pageCount > 1 ? (
            <span className="ml-2 text-slate-500 dark:text-slate-500">
              (page{' '}
              <span data-testid="pagination-current">{safePage + 1}</span> of {pageCount})
            </span>
          ) : null}
        </p>

        {total === 0 && !error ? (
          <div
            data-testid="empty-results"
            className="mt-10 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40"
          >
            <p className="text-base font-medium text-slate-800 dark:text-slate-200">
              No products match your filters
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Try a different search or clear filters to see the full catalog.
            </p>
          </div>
        ) : null}

        {total > 0 ? (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {pageItems.map((product) => (
              <li key={product.id} data-testid={`product-card-${product.id}`}>
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                  addDisabled={
                    product.active === false ||
                    (product.stock !== undefined && product.stock <= 0)
                  }
                />
              </li>
            ))}
          </ul>
        ) : null}

        {total > PAGE_SIZE ? (
          <nav
            className="mt-10 flex flex-wrap items-center justify-center gap-2"
            aria-label="Pagination"
          >
            <button
              type="button"
              data-testid="pagination-prev"
              onClick={goPrev}
              disabled={safePage <= 0}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              Previous
            </button>
            <button
              type="button"
              data-testid="pagination-next"
              onClick={goNext}
              disabled={safePage >= pageCount - 1}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              Next
            </button>
          </nav>
        ) : null}
      </div>
    </div>
  )
}
