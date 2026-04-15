import { expect, test, type Page } from '@playwright/test'

/** Product catalog with search, filters, sort, pagination (hub: ?view=products). */
const PRODUCTS = '/?view=products'

async function openProductCatalog(page: Page) {
  await page.goto(PRODUCTS)
  const heading = page.getByRole('heading', { name: 'Search and filter' })
  await expect(heading).toBeVisible()
  await heading.scrollIntoViewIfNeeded()
}

async function applyFilters(page: Page) {
  const btn = page.getByTestId('apply-filters')
  await btn.scrollIntoViewIfNeeded()
  await btn.click()
}

test.describe('Product search catalog', () => {
  test.beforeEach(async ({ page }) => {
    await openProductCatalog(page)
  })

  test('search with valid query shows matching products', async ({ page }) => {
    await page.getByTestId('product-search-query').fill('Lumen ceramic')
    await applyFilters(page)
    await expect(page.getByTestId('search-error')).toHaveCount(0)
    await expect(page.getByTestId('product-card-p-lumen-lamp')).toBeVisible()
    await expect(page.getByTestId('result-summary')).toContainText('of 1 products')
  })

  test('search with no results shows empty state', async ({ page }) => {
    await page.getByTestId('product-search-query').fill('zzznoresultsqueryzzz')
    await applyFilters(page)
    await expect(page.getByTestId('empty-results')).toBeVisible()
    await expect(page.getByTestId('empty-results')).toContainText('No products match')
    await expect(page.getByTestId('result-summary')).toContainText('of 0 products')
    await expect(page.getByTestId('product-card-p-lumen-lamp')).toHaveCount(0)
  })

  test('apply single category filter', async ({ page }) => {
    await page.getByTestId('category-filter').selectOption('Electronics')
    await applyFilters(page)
    await expect(page.getByTestId('product-card-p-echo-headphones')).toBeVisible()
    await expect(page.getByTestId('result-summary')).toContainText('of 1 products')
  })

  test('apply multiple filters together', async ({ page }) => {
    await page.getByTestId('category-filter').selectOption('Accessories')
    await page.getByTestId('price-min').fill('150')
    await applyFilters(page)
    await expect(page.getByTestId('product-card-p-canvas-pack')).toBeVisible()
    await expect(page.getByTestId('product-card-p-lumen-lamp')).toHaveCount(0)
    await expect(page.getByTestId('result-summary')).toContainText('of 1 products')
  })

  test('clear all filters restores full catalog', async ({ page }) => {
    await page.getByTestId('product-search-query').fill('desk')
    await page.getByTestId('category-filter').selectOption('Furniture')
    await applyFilters(page)
    await expect(page.getByTestId('result-summary')).toContainText('of 1 products')

    await page.getByTestId('clear-filters').click()
    await expect(page.getByTestId('result-summary')).toContainText('of 6 products')
    await expect(page.getByTestId('empty-results')).toHaveCount(0)
  })

  test('pagination navigation changes visible products', async ({ page }) => {
    await applyFilters(page)
    await expect(page.getByTestId('result-summary')).toContainText('of 6 products')
    await expect(page.getByTestId('pagination-current')).toHaveText('1')

    const firstPageCard = page.locator('[data-testid^="product-card-"]').first()
    const firstId = await firstPageCard.getAttribute('data-testid')

    await page.getByTestId('pagination-next').click()
    await expect(page.getByTestId('pagination-current')).toHaveText('2')
    const secondPageCard = page.locator('[data-testid^="product-card-"]').first()
    const secondId = await secondPageCard.getAttribute('data-testid')
    expect(secondId).not.toBe(firstId)

    await page.getByTestId('pagination-prev').click()
    await expect(page.getByTestId('pagination-current')).toHaveText('1')
    await expect(page.locator('[data-testid^="product-card-"]').first()).toHaveAttribute(
      'data-testid',
      firstId!,
    )
  })

  test('sort by price low to high orders results', async ({ page }) => {
    await page.getByTestId('sort-select').selectOption('price-asc')
    await applyFilters(page)
    const first = page.locator('[data-testid^="product-card-"]').first()
    await expect(first).toHaveAttribute('data-testid', 'product-card-p-notebook-set')
  })

  test('sort by price high to low puts desk first', async ({ page }) => {
    await page.getByTestId('sort-select').selectOption('price-desc')
    await applyFilters(page)
    const first = page.locator('[data-testid^="product-card-"]').first()
    await expect(first).toHaveAttribute('data-testid', 'product-card-p-aurora-desk')
  })

  test('sort by name A–Z', async ({ page }) => {
    await page.getByTestId('sort-select').selectOption('name-asc')
    await applyFilters(page)
    const first = page.locator('[data-testid^="product-card-"]').first()
    await expect(first).toHaveAttribute('data-testid', 'product-card-p-notebook-set')
  })

  test('invalid price range shows error state', async ({ page }) => {
    await page.getByTestId('price-min').fill('500')
    await page.getByTestId('price-max').fill('100')
    await applyFilters(page)
    const alert = page.getByTestId('search-error')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('Minimum price cannot be greater than maximum price')
    await expect(page.getByTestId('empty-results')).toHaveCount(0)
  })

  test('invalid min price shows error', async ({ page }) => {
    await page.getByTestId('price-min').fill('not-a-number')
    await applyFilters(page)
    await expect(page.getByTestId('search-error')).toContainText('Minimum price must be a valid number')
  })

  test('invalid max price shows error', async ({ page }) => {
    await page.getByTestId('price-max').fill('not-a-number')
    await applyFilters(page)
    await expect(page.getByTestId('search-error')).toContainText('Maximum price must be a valid number')
  })

  test('featured sort keeps catalog order on first page', async ({ page }) => {
    await page.getByTestId('sort-select').selectOption('featured')
    await applyFilters(page)
    const first = page.locator('[data-testid^="product-card-"]').first()
    await expect(first).toHaveAttribute('data-testid', 'product-card-p-aurora-desk')
  })
})

test.describe('Product search viewports', () => {
  test.describe('tablet 834×1112', () => {
    test.use({ viewport: { width: 834, height: 1112 } })
    test('filters, apply, and results summary', async ({ page }) => {
      await openProductCatalog(page)
      await page.getByTestId('category-filter').selectOption('Stationery')
      await applyFilters(page)
      await expect(page.getByTestId('result-summary')).toContainText('of 1 products')
      await expect(page.getByTestId('product-card-p-notebook-set')).toBeVisible()
    })
  })

  test.describe('small desktop 1024×768', () => {
    test.use({ viewport: { width: 1024, height: 768 } })
    test('filters, apply, and results summary', async ({ page }) => {
      await openProductCatalog(page)
      await page.getByTestId('category-filter').selectOption('Stationery')
      await applyFilters(page)
      await expect(page.getByTestId('result-summary')).toContainText('of 1 products')
      await expect(page.getByTestId('product-card-p-notebook-set')).toBeVisible()
    })
  })

  test.describe('narrow mobile 390×844', () => {
    test.use({ viewport: { width: 390, height: 844 } })
    test('search input and pagination controls are usable', async ({ page }) => {
      await openProductCatalog(page)
      await page.getByTestId('product-search-query').fill('Echo')
      await applyFilters(page)
      await expect(page.getByTestId('result-summary')).toContainText('of 1 products')
      await expect(page.getByTestId('product-card-p-echo-headphones')).toBeVisible()
      await page.getByTestId('clear-filters').scrollIntoViewIfNeeded()
      await page.getByTestId('clear-filters').click()
      await expect(page.getByTestId('result-summary')).toContainText('of 6 products')
      await page.getByTestId('pagination-next').scrollIntoViewIfNeeded()
      await page.getByTestId('pagination-next').click()
      await expect(page.getByTestId('pagination-current')).toHaveText('2')
    })
  })
})
