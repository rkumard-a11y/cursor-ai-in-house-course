import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { E2E_URL, openFreshE2EApp } from './helpers'

function seriousViolations(violations: { impact?: string | null }[]) {
  return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
}

test.describe('Accessibility (axe)', () => {
  test('E2E task harness login view', async ({ page }) => {
    await openFreshE2EApp(page)
    const results = await new AxeBuilder({ page }).analyze()
    expect(seriousViolations(results.violations)).toEqual([])
  })

  test('E2E task harness after login', async ({ page }) => {
    await openFreshE2EApp(page)
    const email = `a11y-${Date.now()}@example.com`
    const password = 'password123'

    await page.getByTestId('go-to-register').click()
    await page.getByTestId('register-name').fill('A11y')
    await page.getByTestId('register-email').fill(email)
    await page.getByTestId('register-password').fill(password)
    await page.getByTestId('register-confirm').fill(password)
    await page.getByTestId('register-submit').click()

    await page.getByTestId('login-email').fill(email)
    await page.getByTestId('login-password').fill(password)
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('tasks-heading')).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(seriousViolations(results.violations)).toEqual([])
  })

  test('Settings panel (tabbed form)', async ({ page }) => {
    await page.goto('/?view=settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(seriousViolations(results.violations)).toEqual([])
  })

  test('E2E URL responds', async ({ page }) => {
    await page.goto(E2E_URL)
    await expect(page.getByTestId('e2e-task-app')).toBeVisible()
  })
})
