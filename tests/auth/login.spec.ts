import { test, expect } from '@playwright/test';
import { login, clearSession } from '../_utils/auth';

// Test credentials from environment
const TEST_USER = {
  username: process.env.TEST_USERNAME || '',
  password: process.env.TEST_PASSWORD || '',
};

test.describe('Authentication Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Don't use saved auth state for login tests

  test('should successfully login with valid credentials', async ({ page }) => {
    // Perform login
    await login(page, TEST_USER);

    // Verify we're redirected to either home page (if bootstrapped) or bootstrap page (if not)
    await expect(page).toHaveURL(/\/$|\/ui\/$|\/ui\/bootstrap/);

    // Verify user is authenticated
    // Note: If on bootstrap page, app bar won't be visible (it's hidden during bootstrap)
    // So we check the URL is correct, which proves login succeeded
    const currentUrl = page.url();
    const isBootstrapped = !currentUrl.includes('bootstrap');

    if (isBootstrapped) {
      // If bootstrapped, verify app bar is visible
      const appBar = page.locator('.v-app-bar, [data-testid="app-bar"]').first();
      await expect(appBar).toBeVisible();
      console.log('✅ Login successful - redirected to home (server is bootstrapped)');
    } else {
      console.log('✅ Login successful - redirected to bootstrap (server not bootstrapped)');
    }
  });
});
