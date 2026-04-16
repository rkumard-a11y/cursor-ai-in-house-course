import { expect, type Locator, type Page } from '@playwright/test'

import { BasePage } from './BasePage'

/** Product catalog hub: `/?view=products` */
export class ProductCatalogPage extends BasePage {
  static readonly PATH = '/?view=products'

  constructor(page: Page) {
    super(page)
  }

  heading(): Locator {
    return this.page.getByRole('heading', { name: 'Search and filter' })
  }

  searchInput(): Locator {
    return this.page.getByTestId('product-search-query')
  }

  categoryFilter(): Locator {
    return this.page.getByTestId('category-filter')
  }

  priceMin(): Locator {
    return this.page.getByTestId('price-min')
  }

  priceMax(): Locator {
    return this.page.getByTestId('price-max')
  }

  applyFiltersButton(): Locator {
    return this.page.getByTestId('apply-filters')
  }

  clearFiltersButton(): Locator {
    return this.page.getByTestId('clear-filters')
  }

  sortSelect(): Locator {
    return this.page.getByTestId('sort-select')
  }

  resultSummary(): Locator {
    return this.page.getByTestId('result-summary')
  }

  searchError(): Locator {
    return this.page.getByTestId('search-error')
  }

  emptyResults(): Locator {
    return this.page.getByTestId('empty-results')
  }

  productCard(testId: string): Locator {
    return this.page.getByTestId(testId)
  }

  paginationCurrent(): Locator {
    return this.page.getByTestId('pagination-current')
  }

  paginationNext(): Locator {
    return this.page.getByTestId('pagination-next')
  }

  paginationPrev(): Locator {
    return this.page.getByTestId('pagination-prev')
  }

  firstProductCard(): Locator {
    return this.page.locator('[data-testid^="product-card-"]').first()
  }

  async open() {
    await this.goto(ProductCatalogPage.PATH)
    const heading = this.heading()
    await expect(heading).toBeVisible()
    await heading.scrollIntoViewIfNeeded()
  }

  async applyFilters() {
    const btn = this.applyFiltersButton()
    await btn.scrollIntoViewIfNeeded()
    await btn.click()
  }
}
