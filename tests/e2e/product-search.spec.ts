import { expect, test } from '@playwright/test'

import { ProductCatalogPage } from './pages'

test.describe('Product search catalog', () => {
  test.beforeEach(async ({ page }) => {
    await new ProductCatalogPage(page).open()
  })

  test('search with valid query shows matching products', async ({ page }) => {
    const catalog = new ProductCatalogPage(page)
    await catalog.searchInput().fill('Lumen ceramic')
    await catalog.applyFilters()
    await expect(catalog.searchError()).toHaveCount(0)
    await expect(catalog.productCard('product-card-p-lumen-lamp')).toBeVisible()
    await expect(catalog.resultSummary()).toContainText('of 1 products')
  })

  test('search with no results shows empty state', async ({ page }) => {
    const catalog = new ProductCatalogPage(page)
    await catalog.searchInput().fill('zzznoresultsqueryzzz')
    await catalog.applyFilters()
    await expect(catalog.emptyResults()).toBeVisible()
    await expect(catalog.emptyResults()).toContainText('No products match')
    await expect(catalog.resultSummary()).toContainText('of 0 products')
    await expect(catalog.productCard('product-card-p-lumen-lamp')).toHaveCount(0)
  })

  test('apply single category filter', async ({ page }) => {
    const catalog = new ProductCatalogPage(page)
    await catalog.categoryFilter().selectOption('Electronics')
    await catalog.applyFilters()
    await expect(catalog.productCard('product-card-p-echo-headphones')).toBeVisible()
    await expect(catalog.resultSummary()).toContainText('of 1 products')
  })

  test('apply multiple filters together', async ({ page }) => {
    const catalog = new ProductCatalogPage(page)
    await catalog.categoryFilter().selectOption('Accessories')
    await catalog.priceMin().fill('150')
    await catalog.applyFilters()
    await expect(catalog.productCard('product-card-p-canvas-pack')).toBeVisible()
    await expect(catalog.productCard('product-card-p-lumen-lamp')).toHaveCount(0)
    await expect(catalog.resultSummary()).toContainText('of 1 products')
  })

  test('clear all filters restores full catalog', async ({ page }) => {
    const catalog = new ProductCatalogPage(page)
    await catalog.searchInput().fill('desk')
    await catalog.categoryFilter().selectOption('Furniture')
    await catalog.applyFilters()
    await expect(catalog.resultSummary()).toContainText('of 1 products')

    await catalog.clearFiltersButton().click()
    await expect(catalog.resultSummary()).toContainText('of 6 products')
    await expect(catalog.emptyResults()).toHaveCount(0)
  })

  test('pagination navigation changes visible products', async ({ page }) => {
    const catalog = new ProductCatalogPage(page)
    await catalog.applyFilters()
    await expect(catalog.resultSummary()).toContainText('of 6 products')
    await expect(catalog.paginationCurrent()).toHaveText('1')

    const firstPageCard = catalog.firstProductCard()
    const firstId = await firstPageCard.getAttribute('data-testid')

    await catalog.paginationNext().click()
    await expect(catalog.paginationCurrent()).toHaveText('2')
    const secondPageCard = catalog.firstProductCard()
    const secondId = await secondPageCard.getAttribute('data-testid')
    expect(secondId).not.toBe(firstId)

    await catalog.paginationPrev().click()
    await expect(catalog.paginationCurrent()).toHaveText('1')
    await expect(catalog.firstProductCard()).toHaveAttribute('data-testid', firstId!)
  })

  test('sort by price low to high orders results', async ({ page }) => {
    const catalog = new ProductCatalogPage(page)
    await catalog.sortSelect().selectOption('price-asc')
    await catalog.applyFilters()
    const first = catalog.firstProductCard()
    await expect(first).toHaveAttribute('data-testid', 'product-card-p-notebook-set')
  })

  test('sort by price high to low puts desk first', async ({ page }) => {
    const catalog = new ProductCatalogPage(page)
    await catalog.sortSelect().selectOption('price-desc')
    await catalog.applyFilters()
    const first = catalog.firstProductCard()
    await expect(first).toHaveAttribute('data-testid', 'product-card-p-aurora-desk')
  })

  test('sort by name A–Z', async ({ page }) => {
    const catalog = new ProductCatalogPage(page)
    await catalog.sortSelect().selectOption('name-asc')
    await catalog.applyFilters()
    const first = catalog.firstProductCard()
    await expect(first).toHaveAttribute('data-testid', 'product-card-p-notebook-set')
  })

  test('invalid price range shows error state', async ({ page }) => {
    const catalog = new ProductCatalogPage(page)
    await catalog.priceMin().fill('500')
    await catalog.priceMax().fill('100')
    await catalog.applyFilters()
    const alert = catalog.searchError()
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('Minimum price cannot be greater than maximum price')
    await expect(catalog.emptyResults()).toHaveCount(0)
  })

  test('invalid min price shows error', async ({ page }) => {
    const catalog = new ProductCatalogPage(page)
    await catalog.priceMin().fill('not-a-number')
    await catalog.applyFilters()
    await expect(catalog.searchError()).toContainText('Minimum price must be a valid number')
  })

  test('invalid max price shows error', async ({ page }) => {
    const catalog = new ProductCatalogPage(page)
    await catalog.priceMax().fill('not-a-number')
    await catalog.applyFilters()
    await expect(catalog.searchError()).toContainText('Maximum price must be a valid number')
  })

  test('featured sort keeps catalog order on first page', async ({ page }) => {
    const catalog = new ProductCatalogPage(page)
    await catalog.sortSelect().selectOption('featured')
    await catalog.applyFilters()
    const first = catalog.firstProductCard()
    await expect(first).toHaveAttribute('data-testid', 'product-card-p-aurora-desk')
  })
})

test.describe('Product search viewports', () => {
  test.describe('tablet 834×1112', () => {
    test.use({ viewport: { width: 834, height: 1112 } })
    test('filters, apply, and results summary', async ({ page }) => {
      const catalog = new ProductCatalogPage(page)
      await catalog.open()
      await catalog.categoryFilter().selectOption('Stationery')
      await catalog.applyFilters()
      await expect(catalog.resultSummary()).toContainText('of 1 products')
      await expect(catalog.productCard('product-card-p-notebook-set')).toBeVisible()
    })
  })

  test.describe('small desktop 1024×768', () => {
    test.use({ viewport: { width: 1024, height: 768 } })
    test('filters, apply, and results summary', async ({ page }) => {
      const catalog = new ProductCatalogPage(page)
      await catalog.open()
      await catalog.categoryFilter().selectOption('Stationery')
      await catalog.applyFilters()
      await expect(catalog.resultSummary()).toContainText('of 1 products')
      await expect(catalog.productCard('product-card-p-notebook-set')).toBeVisible()
    })
  })

  test.describe('narrow mobile 390×844', () => {
    test.use({ viewport: { width: 390, height: 844 } })
    test('search input and pagination controls are usable', async ({ page }) => {
      const catalog = new ProductCatalogPage(page)
      await catalog.open()
      await catalog.searchInput().fill('Echo')
      await catalog.applyFilters()
      await expect(catalog.resultSummary()).toContainText('of 1 products')
      await expect(catalog.productCard('product-card-p-echo-headphones')).toBeVisible()
      await catalog.clearFiltersButton().scrollIntoViewIfNeeded()
      await catalog.clearFiltersButton().click()
      await expect(catalog.resultSummary()).toContainText('of 6 products')
      await catalog.paginationNext().scrollIntoViewIfNeeded()
      await catalog.paginationNext().click()
      await expect(catalog.paginationCurrent()).toHaveText('2')
    })
  })
})
