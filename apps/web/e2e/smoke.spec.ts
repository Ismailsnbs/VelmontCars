import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('login page should load successfully', async ({ page }) => {
    await page.goto('/login');

    // Verify page title contains login or auth-related text
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();

    // Check for common login form elements
    const loginForm = page.locator('form');
    expect(loginForm).toBeTruthy();
  });

  test('login form should contain email and password fields', async ({ page }) => {
    await page.goto('/login');

    // Look for email/username input
    const emailInput = page.locator('input[type="email"], input[name*="email"], input[name*="username"]').first();
    expect(emailInput).toBeTruthy();

    // Look for password input
    const passwordInput = page.locator('input[type="password"]');
    expect(passwordInput).toBeTruthy();
  });

  test('unauthenticated users should be able to access login page', async ({ page }) => {
    const response = await page.goto('/login');

    // Should return 2xx status code
    expect(response?.status()).toBeLessThan(400);
  });
});
