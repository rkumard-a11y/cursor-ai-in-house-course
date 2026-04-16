import type { Page } from '@playwright/test'

/**
 * Base page object — shared navigation and utilities for the demo app.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string) {
    await this.page.goto(path)
  }
}
