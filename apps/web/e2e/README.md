# E2E Tests (Playwright)

This directory contains end-to-end tests for the KKTC Gallery web application using Playwright.

## Setup

Playwright is already installed as a dev dependency. Browser binaries are NOT installed by default.

## Running Tests

From `apps/web/`:

```bash
# Run all E2E tests
pnpm test:e2e

# Run a specific test file
pnpm test:e2e smoke.spec.ts

# Run tests in headed mode (see browser)
pnpm test:e2e --headed

# Run tests in debug mode
pnpm test:e2e --debug
```

## Configuration

- **Config file:** `playwright.config.ts` in root of `apps/web/`
- **Base URL:** http://localhost:3000
- **Browser:** Chromium only
- **Timeout:** 30 seconds per test
- **Retries:** 0 (local), 2 (CI)

The dev server will start automatically when running tests.

## Test Structure

- `smoke.spec.ts` - Basic smoke tests to verify core functionality:
  - Login page loads successfully
  - Login form contains required fields
  - Unauthenticated users can access login page

## Adding New Tests

Create new test files matching the pattern `*.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/path');
    // Add assertions
  });
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging](https://playwright.dev/docs/debug)
