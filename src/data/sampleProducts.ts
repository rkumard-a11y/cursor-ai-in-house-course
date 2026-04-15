import type { Product } from '../components'

/** Shared catalog fixtures for product demos */
export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'p-aurora-desk',
    title: 'Aurora standing desk',
    description:
      'Motorized height adjustment, memory presets, and a whisper-quiet dual motor. Ships flat with tool-free assembly.',
    price: 849,
    currency: 'USD',
    imageUrl:
      'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&h=600&fit=crop',
    rating: 4.8,
    reviewCount: 326,
    category: 'Furniture',
  },
  {
    id: 'p-lumen-lamp',
    title: 'Lumen ceramic desk lamp',
    description:
      'Warm dimmable LED, touch controls, and a matte ceramic base. Designed for long evening work sessions.',
    price: 129,
    imageUrl:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=600&fit=crop',
    rating: 4.2,
    reviewCount: 94,
    category: 'Accessories',
  },
  {
    id: 'p-echo-headphones',
    title: 'Echo ANC headphones',
    description:
      'Hybrid active noise cancellation, 32-hour battery, and breathable memory-foam ear cushions.',
    price: 279.99,
    currency: 'USD',
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
    rating: 3.6,
    reviewCount: 1204,
    category: 'Electronics',
  },
  {
    id: 'p-canvas-pack',
    title: 'Canvas weekender bag',
    description:
      'Waxed canvas, brass hardware, and a padded laptop sleeve. Carry-on friendly for most airlines.',
    price: 185,
    imageUrl:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
    rating: 5,
    reviewCount: 56,
    category: 'Accessories',
  },
  {
    id: 'p-steel-bottle',
    title: 'Steel insulated bottle — 32oz',
    description:
      'Keeps drinks cold for 24 hours or hot for 12. Powder coat finish resists chips and fingerprints.',
    price: 42,
    imageUrl:
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=600&fit=crop',
    rating: 2.4,
    reviewCount: 18,
    category: 'Accessories',
  },
  {
    id: 'p-notebook-set',
    title: 'Archivist notebook set (3)',
    description:
      'Lay-flat binding, 120gsm acid-free paper, and numbered volumes. A favorite for journaling and field notes.',
    price: 36.5,
    currency: 'USD',
    imageUrl:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop',
    rating: 4,
    reviewCount: 7,
    category: 'Stationery',
  },
]
