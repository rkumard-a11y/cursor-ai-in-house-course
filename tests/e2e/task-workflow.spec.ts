import { expect, test } from '@playwright/test'
import { E2E_URL, openFreshE2EApp, uniqueEmail } from './helpers'

test.describe('Task management E2E harness', () => {
  test('register → login → create → complete → delete → logout', async ({ page }) => {
    const email = uniqueEmail()
    const password = 'password123'
    const name = 'E2E User'

    await openFreshE2EApp(page)

    await page.getByTestId('go-to-register').click()
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible()

    await page.getByTestId('register-name').fill(name)
    await page.getByTestId('register-email').fill(email)
    await page.getByTestId('register-password').fill(password)
    await page.getByTestId('register-confirm').fill(password)
    await page.getByTestId('register-submit').click()

    await expect(page.getByTestId('e2e-banner')).toContainText('Account created')
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

    await page.getByTestId('login-email').fill(email)
    await page.getByTestId('login-password').fill(password)
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('tasks-heading')).toContainText(email)
    await expect(page.getByTestId('logout-button')).toBeVisible()

    const title = 'Ship release checklist'
    await page.getByTestId('task-title-input').fill(title)
    await page.getByTestId('task-add').click()

    await expect(page.getByTestId('task-list').getByTestId('task-title').first()).toHaveText(
      title,
    )
    await expect(page.getByTestId('task-status').first()).toHaveText('Open')

    await page.getByTestId('task-toggle-complete').first().click()
    await expect(page.getByTestId('task-status').first()).toHaveText('Done')

    await page.getByTestId('task-delete').first().click()
    await expect(page.getByTestId('task-title').filter({ hasText: title })).toHaveCount(0)

    await page.getByTestId('logout-button').click()
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByTestId('e2e-banner')).toContainText('signed out')
  })

  test('persisted session restores task list after reload', async ({ page }) => {
    const email = uniqueEmail()
    const password = 'password123'

    await openFreshE2EApp(page)
    await page.getByTestId('go-to-register').click()
    await page.getByTestId('register-name').fill('Persist User')
    await page.getByTestId('register-email').fill(email)
    await page.getByTestId('register-password').fill(password)
    await page.getByTestId('register-confirm').fill(password)
    await page.getByTestId('register-submit').click()

    await page.getByTestId('login-email').fill(email)
    await page.getByTestId('login-password').fill(password)
    await page.getByTestId('login-submit').click()

    await page.getByTestId('task-title-input').fill('Survives reload')
    await page.getByTestId('task-add').click()

    await page.reload()
    await expect(page.getByTestId('tasks-heading')).toContainText(email)
    await expect(page.getByTestId('task-title').filter({ hasText: 'Survives reload' })).toHaveCount(
      1,
    )
  })
})

test.describe('Dashboard demo (static board)', () => {
  test('loads task board from hub', async ({ page }) => {
    await page.goto('/?view=dashboard')
    await expect(page.getByRole('heading', { name: 'Task board' })).toBeVisible()
    await expect(page.getByText('Ship accessibility audit fixes')).toBeVisible()
  })
})
