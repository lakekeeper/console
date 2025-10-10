import { test, expect } from '@playwright/test';
import { login, clearSession } from '../utils/auth';

// Test credentials from environment
const TEST_USER = {
  username: process.env.TEST_USERNAME || '',
  password: process.env.TEST_PASSWORD || '',
};

test.describe('Authentication Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Don't use saved auth state for login tests

  test('should successfully login with valid credentials', async ({ page }) => {
    // Clear any existing session

    // Perform login
    await login(page, TEST_USER);

    // Verify we're on the home page
    await expect(page).toHaveURL(/\/$|\/ui\/$/);

    // Verify user is authenticated - check for user interface elements
    const appBar = page.locator('.v-app-bar, [data-testid="app-bar"]').first();
    await expect(appBar).toBeVisible();
  });
});
