import { test, expect } from '../_fixtures/auth.fixture'; // Import our custom fixture

test.describe('Bootstrap Flow', () => {
  test.use({
    storageState: { cookies: [], origins: [] }, // Start fresh, no saved auth
    // baseURL is inherited from playwright.config.ts (uses .env.test PLAYWRIGHT_BASE_URL)
  });
  test('should complete bootstrap process', async ({ bootstrappedPage: page }) => {
    const redirectUrl = page.url();
    expect(redirectUrl).toMatch(/\/(ui\/)/);
    await page.getByRole('button').nth(3).click();
    await page.getByText('Logout').click();
  });
});
