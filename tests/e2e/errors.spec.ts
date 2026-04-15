import { expect, test } from '@playwright/test'
import { openFreshE2EApp, uniqueEmail } from './helpers'

test.describe('Error handling', () => {
  test('rejects invalid login credentials', async ({ page }) => {
    await openFreshE2EApp(page)
    await page.getByTestId('login-email').fill('nobody@example.com')
    await page.getByTestId('login-password').fill('wrong-password')
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('e2e-form-error')).toContainText('Invalid email or password')
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('rejects duplicate registration email', async ({ page }) => {
    const email = uniqueEmail()
    const password = 'password123'

    await openFreshE2EApp(page)
    await page.getByTestId('go-to-register').click()

    for (let i = 0; i < 2; i++) {
      await page.getByTestId('register-name').fill(`User ${i}`)
      await page.getByTestId('register-email').fill(email)
      await page.getByTestId('register-password').fill(password)
      await page.getByTestId('register-confirm').fill(password)
      await page.getByTestId('register-submit').click()
      if (i === 0) {
        await expect(page.getByTestId('e2e-banner')).toContainText('Account created')
        await page.getByTestId('go-to-register').click()
      }
    }

    await expect(page.getByTestId('e2e-form-error')).toContainText('already exists')
  })

  test('rejects empty task title', async ({ page }) => {
    const email = uniqueEmail()
    const password = 'password123'

    await openFreshE2EApp(page)
    await page.getByTestId('go-to-register').click()
    await page.getByTestId('register-name').fill('Taskless')
    await page.getByTestId('register-email').fill(email)
    await page.getByTestId('register-password').fill(password)
    await page.getByTestId('register-confirm').fill(password)
    await page.getByTestId('register-submit').click()

    await page.getByTestId('login-email').fill(email)
    await page.getByTestId('login-password').fill(password)
    await page.getByTestId('login-submit').click()

    await page.getByTestId('task-title-input').fill('')
    await page.getByTestId('task-add').click()
    await expect(page.getByTestId('e2e-form-error')).toContainText('Task title is required')
  })

  test('rejects mismatched passwords on register', async ({ page }) => {
    await openFreshE2EApp(page)
    await page.getByTestId('go-to-register').click()
    await page.getByTestId('register-name').fill('Mismatch')
    await page.getByTestId('register-email').fill(uniqueEmail())
    await page.getByTestId('register-password').fill('password123')
    await page.getByTestId('register-confirm').fill('password999')
    await page.getByTestId('register-submit').click()

    await expect(page.getByTestId('e2e-form-error')).toContainText('Passwords do not match')
  })
})
