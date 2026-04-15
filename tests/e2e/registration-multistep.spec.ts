import { test, expect, type Page } from '@playwright/test'
import { openFreshRegistrationWizard, uniqueEmail } from './helpers'

test.describe('Multi-step registration wizard', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await openFreshRegistrationWizard(page)
  })

  async function fillStep1(page: Page, name: string, email: string) {
    await page.getByTestId('reg-wizard-full-name').fill(name)
    await page.getByTestId('reg-wizard-email').fill(email)
    await expect(page.getByTestId('reg-wizard-email')).toHaveValue(email)
    await page.getByTestId('registration-next').click()
    await expect(page.getByTestId('registration-step-2')).toHaveAttribute('aria-current', 'step')
  }

  async function fillStep2(page: Page, password: string, confirm: string) {
    await page.getByTestId('reg-wizard-password').fill(password)
    await page.getByTestId('reg-wizard-confirm').fill(confirm)
    await expect(page.getByTestId('reg-wizard-password')).toHaveValue(password)
    await expect(page.getByTestId('reg-wizard-confirm')).toHaveValue(confirm)
    await page.getByTestId('registration-next').click()
    await expect(page.getByTestId('registration-step-3')).toHaveAttribute('aria-current', 'step')
    await expect(page.getByTestId('registration-submit')).toBeEnabled()
  }

  test('step 1: required and format validation surfaces errors with ARIA', async ({ page }) => {
    await page.getByTestId('registration-next').click()

    await expect(page.getByText('Full name is required.')).toBeVisible()
    await expect(page.getByText('Email is required.')).toBeVisible()

    const name = page.getByTestId('reg-wizard-full-name')
    const email = page.getByTestId('reg-wizard-email')
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    await expect(name).toHaveAttribute('aria-describedby', /.+-error/)
    await expect(email).toHaveAttribute('aria-invalid', 'true')

    await name.fill('x')
    await email.fill('not-an-email')
    await page.getByTestId('registration-next').click()
    await expect(page.getByText('Full name must be at least 2 characters.')).toBeVisible()
    await expect(page.getByText('Enter a valid email address.')).toBeVisible()
  })

  test('step 1: full name max length validation', async ({ page }) => {
    await page.getByTestId('reg-wizard-full-name').fill('a'.repeat(81))
    await page.getByTestId('reg-wizard-email').fill(uniqueEmail())
    await page.getByTestId('registration-next').click()
    await expect(page.getByText('Full name must be at most 80 characters.')).toBeVisible()
  })

  test('step 2: password length and confirmation validation', async ({ page }) => {
    await fillStep1(page, 'Valid User', uniqueEmail())

    await page.getByTestId('registration-next').click()
    await expect(page.getByText('Password is required.')).toBeVisible()
    await expect(page.getByText('Confirm your password.')).toBeVisible()

    await page.getByTestId('reg-wizard-password').fill('short')
    await page.getByTestId('reg-wizard-confirm').fill('short')
    await page.getByTestId('registration-next').click()
    await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible()

    await page.getByTestId('reg-wizard-password').fill('a'.repeat(65))
    await page.getByTestId('reg-wizard-confirm').fill('a'.repeat(65))
    await page.getByTestId('registration-next').click()
    await expect(page.getByText('Password must be at most 64 characters.')).toBeVisible()

    await page.getByTestId('reg-wizard-password').fill('password123')
    await page.getByTestId('reg-wizard-confirm').fill('password999')
    await page.getByTestId('registration-next').click()
    await expect(page.getByText('Passwords do not match.')).toBeVisible()
  })

  test('navigation: next and previous preserve field values', async ({ page }) => {
    const email = uniqueEmail()
    await fillStep1(page, 'Nav User', email)
    await fillStep2(page, 'securepass1', 'securepass1')

    await expect(page.getByTestId('registration-review-name')).toHaveText('Nav User')
    await expect(page.getByTestId('registration-review-email')).toHaveText(email)

    await page.getByTestId('registration-back').click()
    await expect(page.getByTestId('reg-wizard-password')).toHaveValue('securepass1')

    await page.getByTestId('registration-back').click()
    await expect(page.getByTestId('reg-wizard-full-name')).toHaveValue('Nav User')
    await expect(page.getByTestId('reg-wizard-email')).toHaveValue(email)

    await page.getByTestId('registration-next').click()
    await page.getByTestId('registration-next').click()
    await expect(page.getByTestId('registration-submit')).toBeEnabled()
    await page.getByTestId('registration-submit').click()
    await expect(page.getByTestId('registration-success')).toBeVisible()
  })

  test('form submission succeeds and shows polite success announcement', async ({ page }) => {
    await fillStep1(page, 'Happy Path', uniqueEmail())
    await fillStep2(page, 'password12', 'password12')
    await page.getByTestId('registration-submit').click()

    const success = page.getByTestId('registration-success')
    await expect(success).toBeVisible()
    await expect(success).toHaveAttribute('role', 'status')
    await expect(success).toHaveAttribute('aria-live', 'polite')
    await expect(page.getByTestId('registration-success-heading')).toBeVisible()
  })

  test('form submission shows server-style error in assertive live region', async ({ page }) => {
    await fillStep1(page, 'Error Case', 'failure@registration.test')
    await fillStep2(page, 'password12', 'password12')
    await page.getByTestId('registration-submit').click()

    const alert = page.getByTestId('registration-form-error')
    await expect(alert).toBeVisible()
    await expect(alert).toHaveAttribute('role', 'alert')
    await expect(alert).toHaveAttribute('aria-live', 'assertive')
    await expect(alert).toContainText('could not be completed')
  })

  test('duplicate email on submit shows form-level alert', async ({ page }) => {
    const taken = 'taken@example.com'
    await page.evaluate((em) => {
      localStorage.setItem('e2e_reg_wizard_users', JSON.stringify({ [em]: { name: 'Existing' } }))
    }, taken)

    await fillStep1(page, 'Someone', taken)
    await fillStep2(page, 'password12', 'password12')
    await page.getByTestId('registration-submit').click()

    await expect(page.getByTestId('registration-form-error')).toContainText('already exists')
  })

  test('accessibility: visible labels are associated with inputs', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: 'Full name' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()

    await fillStep1(page, 'Label Test', uniqueEmail())

    const pwd = page.getByTestId('reg-wizard-password')
    const pwdId = await pwd.getAttribute('id')
    expect(pwdId).toBeTruthy()
    await expect(page.locator(`label[for="${pwdId}"]`)).toHaveText('Password')

    const confirm = page.getByTestId('reg-wizard-confirm')
    const confirmId = await confirm.getAttribute('id')
    expect(confirmId).toBeTruthy()
    await expect(page.locator(`label[for="${confirmId}"]`)).toHaveText('Confirm password')
  })

  test('accessibility: field errors are announced and linked via aria-describedby', async ({
    page,
  }) => {
    await page.getByTestId('registration-next').click()
    const name = page.getByTestId('reg-wizard-full-name')
    const describedBy = await name.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    const errorEl = page.locator(`[id=${JSON.stringify(describedBy!)}]`)
    await expect(errorEl).toHaveText('Full name is required.')
    await expect(errorEl).toHaveAttribute('role', 'alert')
  })

  test('accessibility: step indicator marks current step', async ({ page }) => {
    const step1 = page.getByTestId('registration-step-1')
    await expect(step1).toHaveAttribute('aria-current', 'step')
    await fillStep1(page, 'Step User', uniqueEmail())
    await expect(page.getByTestId('registration-step-2')).toHaveAttribute('aria-current', 'step')
    await expect(step1).not.toHaveAttribute('aria-current', 'step')
  })
})
