# Page Object Model (E2E)

Playwright specs in `tests/e2e/` use small **page objects** under `tests/e2e/pages/` to keep selectors and flows in one place.

## Conventions

- **`BasePage`**: shared helpers (`goto`, future cookie/session helpers).
- **Feature pages**: one class per major UI area (e.g. `ProductCatalogPage` for `/?view=products`).
- **Locators**: expose `getByRole` / `getByTestId` accessors instead of raw strings scattered across specs.
- **Imports**: `import { ProductCatalogPage } from './pages'` from sibling specs.

## Adding a page

1. Create `YourFeaturePage.ts` extending `BasePage`.
2. Add `open()` (or `expectLoaded()`) that asserts critical elements.
3. Export from `index.ts`.
4. Use the class in specs: `const pageObj = new YourFeaturePage(page)`.

## Running E2E

From the repository root (dev server is started by Playwright when needed):

```bash
npm run test:e2e
```

JUnit for the QA dashboard is written to `qa-automation/reports/raw/playwright-junit.xml` (see `playwright.config.ts`).
