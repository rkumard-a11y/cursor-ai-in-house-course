import { useId } from 'react'
import type { RatingStarsProps } from './types'

const starBox = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

type StarCellProps = {
  fill: number
  starId: string
  index: number
}

function StarCell({ fill, starId, index }: StarCellProps) {
  const pct = clamp(Math.round(fill * 100), 0, 100)
  const clipId = `${starId}-clip-${index}`
  const clipWidth = (pct / 100) * 20

  return (
    <svg
      className="block h-full w-full"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={clipWidth} height="20" />
        </clipPath>
      </defs>
      <path
        className="text-slate-200 dark:text-slate-600"
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z"
      />
      <path
        className="text-amber-500 dark:text-amber-400"
        clipPath={`url(#${clipId})`}
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z"
      />
    </svg>
  )
}

export function RatingStars({
  rating,
  maxRating = 5,
  reviewCount,
  className = '',
  size = 'md',
}: RatingStarsProps) {
  const starId = useId().replace(/:/g, '')
  const safeMax = maxRating > 0 ? maxRating : 5
  const clampedRating = clamp(rating, 0, safeMax)

  const stars = Array.from({ length: safeMax }, (_, i) =>
    clamp(clampedRating - i, 0, 1),
  )

  const roundedDisplay = (Math.round(clampedRating * 10) / 10).toFixed(1)
  const reviewPart =
    reviewCount != null
      ? ` Based on ${reviewCount.toLocaleString()} reviews.`
      : ''

  const label = `Rated ${roundedDisplay} out of ${safeMax} stars.${reviewPart}`

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="img"
      aria-label={label}
    >
      <div className="flex items-center gap-0.5" aria-hidden>
        {stars.map((fill, index) => (
          <div key={index} className={`shrink-0 ${starBox[size]}`}>
            <StarCell fill={fill} starId={starId} index={index} />
          </div>
        ))}
      </div>
      {reviewCount != null ? (
        <span
          className="text-sm tabular-nums text-slate-500 dark:text-slate-400"
          aria-hidden
        >
          ({reviewCount.toLocaleString()})
        </span>
      ) : null}
    </div>
  )
}
