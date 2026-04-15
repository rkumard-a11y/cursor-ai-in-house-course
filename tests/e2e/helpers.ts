import type { Page } from '@playwright/test'

export const E2E_URL = '/?e2e=tasks'
export const E2E_REGISTRATION_URL = '/?e2e=registration'

/** Clear harness storage and reload the E2E task app */
export async function openFreshE2EApp(page: Page) {
  await page.goto(E2E_URL)
  await page.evaluate(() => {
    const keys = Object.keys(localStorage)
    keys.forEach((k) => {
      if (k.startsWith('e2e_task')) localStorage.removeItem(k)
    })
  })
  await page.goto(E2E_URL)
}

/** Clear multi-step registration harness storage and reload */
export async function openFreshRegistrationWizard(page: Page) {
  await page.goto(E2E_REGISTRATION_URL)
  await page.evaluate(() => {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('e2e_reg_wizard')) localStorage.removeItem(k)
    })
  })
  await page.goto(E2E_REGISTRATION_URL)
}

export function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`
}
