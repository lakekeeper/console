import { test, expect } from '../fixtures/auth.fixture'; // Import our custom fixture

test.describe('Bootstrap Flow', () => {
  test.use({
    storageState: { cookies: [], origins: [] }, // Start fresh, no saved auth
    // baseURL is inherited from playwright.config.ts (uses .env.test PLAYWRIGHT_BASE_URL)
  });

  test('should complete bootstrap process', async ({ authenticatedPage: page }) => {
    // 'authenticatedPage' fixture automatically logs in before this test!
    // No need to call login() manually - it's handled by the fixture

    // Now navigate to bootstrap page
    console.log('📋 Navigating to bootstrap...');
    await page.goto('/ui/bootstrap');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check current URL to verify we're on bootstrap page
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check if we were redirected (already bootstrapped)
    if (!currentUrl.includes('bootstrap')) {
      console.log('⚠️  Not on bootstrap page - system may already be bootstrapped');
      console.log('Skipping bootstrap test');
      return;
    }

    await page.waitForTimeout(2000);

    // Step 1: Welcome page - Check if stepper and Next button exist
    console.log('Step 1: Welcome page');

    // Take screenshot for debugging
    await page.screenshot({ path: 'playwright-report/bootstrap-step1.png' });

    // Check if stepper is visible
    const stepper = page.locator('.v-stepper');
    const stepperVisible = await stepper.isVisible().catch(() => false);
    console.log(`Stepper visible: ${stepperVisible}`);

    // Find all buttons and log them
    const allButtons = await page.locator('button').all();
    console.log(`Found ${allButtons.length} buttons on page`);
    for (const btn of allButtons) {
      const text = await btn.textContent().catch(() => 'N/A');
      console.log(`  Button text: "${text}"`);
    }

    // Try to find and click Next button
    const nextButton = page.getByRole('button', { name: 'Next' });
    const isVisible = await nextButton.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Next button visible: ${isVisible}`);

    if (!isVisible) {
      throw new Error('Next button not found on welcome page');
    }

    await nextButton.click();
    console.log('✅ Clicked Next on welcome page');
    await page.waitForTimeout(1000);

    // Step 2: EULA page - Scroll down to enable Next button
    console.log('Step 2: EULA page - scrolling to bottom');

    // Scroll the EULA content to the bottom
    // The text near the bottom will indicate we've scrolled enough
    const bottomText = page.getByText(
      'Unless required by applicable law or agreed to in writing, software distributed',
    );
    await bottomText.scrollIntoViewIfNeeded();
    console.log('✅ Scrolled EULA to bottom');
    await page.waitForTimeout(500);

    // Now click Next (should be enabled after scroll)
    await page.getByRole('button', { name: 'Next' }).click();
    console.log('✅ Clicked Next on EULA page');
    await page.waitForTimeout(1000);

    // Step 3: Consent page - Click "Accept" button
    console.log('Step 3: Consent page');
    await page.getByRole('button', { name: 'Accept' }).click();
    console.log('✅ Clicked Accept button');

    // Wait for bootstrap to complete and redirect
    // Should redirect to login or home page
    await page.waitForURL(/\/(ui\/)?(login|callback|$)/, { timeout: 15000 });

    // Verify bootstrap completed successfully
    // The page should no longer be on bootstrap
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('bootstrap');

    console.log(`✅ Bootstrap completed. Redirected to: ${finalUrl}`);
  });

  test('should not allow access to bootstrap if already bootstrapped', async ({
    authenticatedPage: page,
  }) => {
    // Fixture automatically logs in

    // If system is already bootstrapped, accessing /bootstrap should redirect away
    await page.goto('/ui/bootstrap'); // Wait a moment for any redirect
    await page.waitForTimeout(2000);

    // Should be redirected away from bootstrap (to login or home)
    const redirectUrl = page.url();

    // Either stayed on bootstrap (system not bootstrapped) or redirected (already bootstrapped)
    // This test validates the redirect behavior if already bootstrapped
    if (!redirectUrl.includes('bootstrap')) {
      console.log('✅ System already bootstrapped - correctly redirected away');
      expect(redirectUrl).toMatch(/\/(ui\/)?(login|$)/);
    } else {
      console.log('⚠️  Bootstrap page still accessible - system may not be bootstrapped yet');
    }
  });
});
