import { RatingStars } from './RatingStars'
import type { ProductCardProps } from './types'

function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function ProductCard({
  product,
  onAddToCart,
  addDisabled = false,
  className = '',
}: ProductCardProps) {
  const {
    id,
    title,
    description,
    price,
    currency = 'USD',
    imageUrl,
    imageAlt,
    rating,
    maxRating = 5,
    reviewCount,
  } = product

  const titleId = `product-title-${id}`
  const descId = `product-desc-${id}`
  const priceText = formatPrice(price, currency)
  const imgAlt = imageAlt?.trim() || `${title} product photo`

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5 transition-[box-shadow,transform,border-color] duration-300 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg motion-safe:hover:shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:ring-white/10 dark:motion-safe:hover:shadow-black/40 ${className}`}
      aria-labelledby={titleId}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={imageUrl}
          alt={imgAlt}
          width={640}
          height={480}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-1 flex-col gap-2">
          <h3
            id={titleId}
            className="text-lg font-semibold leading-snug tracking-tight text-slate-900 sm:text-xl dark:text-white"
          >
            {title}
          </h3>
          <p
            id={descId}
            className="line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
          >
            {description}
          </p>
        </div>

        <RatingStars
          rating={rating}
          maxRating={maxRating}
          reviewCount={reviewCount}
          className="min-h-6"
        />

        <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">
            <span className="sr-only">Price: </span>
            {priceText}
          </p>
          <button
            type="button"
            disabled={addDisabled || !onAddToCart}
            onClick={() => onAddToCart?.(product)}
            aria-label={`Add ${title} to cart for ${priceText}`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm outline-none transition-[transform,background-color,box-shadow] duration-200 ease-out hover:bg-violet-500 hover:shadow-md focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 dark:bg-violet-500 dark:hover:bg-violet-400 dark:focus-visible:ring-offset-slate-900 sm:w-auto sm:min-w-[10.5rem]"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  )
}
