/** Product data shown on a catalog card */
export type Product = {
  id: string
  title: string
  description: string
  /** Unit price in major currency units (e.g. USD dollars) */
  price: number
  /** ISO 4217 code, default USD */
  currency?: string
  imageUrl: string
  imageAlt?: string
  /** Average rating from 0 up to `maxRating` (inclusive) */
  rating: number
  maxRating?: number
  reviewCount?: number
  /** Catalog segment for search & filters */
  category?: string
}

export type ProductCardProps = {
  product: Product
  onAddToCart?: (product: Product) => void
  /** Visually disabled cart action */
  addDisabled?: boolean
  className?: string
}

export type RatingStarsProps = {
  rating: number
  maxRating?: number
  reviewCount?: number
  className?: string
  /** Visual size */
  size?: 'sm' | 'md' | 'lg'
}
