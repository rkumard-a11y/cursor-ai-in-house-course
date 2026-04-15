import { expect, test } from '@playwright/test'
import { openFreshE2EApp, uniqueEmail } from './helpers'

test.describe('Responsive layout', () => {
  test('E2E harness: register and see task form on narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openFreshE2EApp(page)

    const email = uniqueEmail()
    const password = 'password123'

    await page.getByTestId('go-to-register').click()
    await page.getByTestId('register-name').fill('Mobile user')
    await page.getByTestId('register-email').fill(email)
    await page.getByTestId('register-password').fill(password)
    await page.getByTestId('register-confirm').fill(password)
    await page.getByTestId('register-submit').click()

    await page.getByTestId('login-email').fill(email)
    await page.getByTestId('login-password').fill(password)
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('task-add')).toBeVisible()
    const box = await page.getByTestId('task-add').boundingBox()
    expect(box).toBeTruthy()
    expect(box!.width).toBeGreaterThan(0)
  })

  test('Dashboard: mobile menu opens sidebar navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/?view=dashboard')

    await expect(page.getByLabel('Open navigation menu')).toBeVisible()
    await page.getByLabel('Open navigation menu').click()
    const primaryNav = page.getByRole('navigation', { name: 'Primary' })
    await expect(primaryNav).toBeVisible()
    await expect(primaryNav.getByRole('link', { name: 'Tasks' })).toBeVisible()
    await primaryNav.getByRole('link', { name: 'Tasks' }).click()
    await expect(page.getByRole('heading', { name: 'Task board' })).toBeVisible()
  })

  test('Dashboard: wide viewport shows condensed sidebar labels', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/?view=dashboard')
    await expect(page.getByRole('heading', { name: 'Task board' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible()
  })
})
