# E2E (Playwright)

End-to-end tests live at the **repository root**: `tests/e2e/*.spec.ts`.

**Page Object Model**: shared page classes live in `tests/e2e/pages/` (see `tests/e2e/pages/README.md`).

From repo root (with dev server or CI webServer):

```bash
npm run test:e2e
```

Or use the wrapper:

```bash
./qa-automation/tests/e2e/run-playwright.sh
```
