import { test as base, Page } from '@playwright/test';
import { login } from '../_utils/auth';

// Test credentials from environment
const TEST_USER = {
  username: process.env.TEST_USERNAME || 'peter',
  password: process.env.TEST_PASSWORD || 'iceberg',
};

// Define fixture types
type AuthFixtures = {
  authenticatedPage: Page;
  bootstrappedPage: Page;
};

// Extend base test with custom fixtures
export const test = base.extend<AuthFixtures>({
  // authenticatedPage fixture - automatically logs in before test
  authenticatedPage: async ({ page }, use: (page: Page) => Promise<void>) => {
    // Setup: Login before the test
    await login(page, TEST_USER);

    // Provide the authenticated page to the test
    await use(page);

    // Teardown: Could logout here if needed
    // await logout(page);
  },

  // bootstrappedPage fixture - logs in AND ensures server is bootstrapped
  bootstrappedPage: async ({ page }, use: (page: Page) => Promise<void>) => {
    // Setup: Login first
    await login(page, TEST_USER);

    // Check if we landed on bootstrap page (server not bootstrapped)
    const currentUrl = page.url();

    if (currentUrl.includes('/ui/bootstrap')) {
      console.log('🔧 Server not bootstrapped - performing bootstrap...');

      // Step 1: Click Next on welcome page
      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(1000);

      // Step 2: Scroll EULA and click Next
      const bottomText = page.getByText(
        'Unless required by applicable law or agreed to in writing, software distributed',
      );
      await bottomText.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: 'Next' }).click();
      await page.waitForTimeout(1000);

      // Step 3: Accept
      await page.getByRole('button', { name: 'Accept' }).click();

      // Wait for bootstrap to complete and redirect
      await page.waitForURL(/\/$|\/ui\/$/, { timeout: 15000 });
      console.log('✅ Bootstrap completed');
    } else {
      console.log('✅ Server already bootstrapped');
    }

    // Provide the bootstrapped page to the test
    await use(page);

    // Teardown: Could logout here if needed
  },
});

export { expect } from '@playwright/test';
