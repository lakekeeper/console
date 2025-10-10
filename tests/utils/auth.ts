import { Page, expect } from '@playwright/test';

export interface AuthCredentials {
  username: string;
  password: string;
}

/**
 * Performs OIDC login flow through Keycloak
 */
export async function login(page: Page, credentials: AuthCredentials) {
  const { username, password } = credentials;

  // Navigate to the app - should show login page
  await page.goto('/');

  // Check if we're already on the app (authenticated)
  const alreadyAuthenticated = await page
    .locator('[data-testid="user-menu"], .v-app-bar')
    .first()
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (alreadyAuthenticated) {
    return; // Already logged in
  }

  // Look for login button on LoginPage component
  const loginButton = page
    .locator('button:has-text("Login"), button:has-text("Sign In"), [data-testid="login-button"]')
    .first();

  const loginButtonVisible = await loginButton.isVisible({ timeout: 5000 }).catch(() => false);

  if (loginButtonVisible) {
    // Click the login button to redirect to Keycloak
    await loginButton.click();

    // Wait for Keycloak login page to load
    await page.waitForTimeout(1000);
  }

  // Now we should be on Keycloak - fill in the form
  const keycloakFormVisible = await page
    .locator('#kc-form-login, input[name="username"], input[id="username"]')
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (keycloakFormVisible) {
    // Fill in Keycloak login form
    // Try multiple possible selectors for username field
    const usernameSelector = await page
      .locator('input[name="username"]')
      .or(page.locator('#username'))
      .or(page.locator('input[id="username"]'))
      .first();

    await usernameSelector.waitFor({ state: 'visible', timeout: 5000 });
    await usernameSelector.fill(username);

    // Try multiple possible selectors for password field
    const passwordSelector = await page
      .locator('input[name="password"]')
      .or(page.locator('#password'))
      .or(page.locator('input[id="password"]'))
      .first();

    await passwordSelector.waitFor({ state: 'visible', timeout: 5000 });
    await passwordSelector.fill(password);

    // Submit the form - try multiple submit button selectors
    const submitButton = await page
      .locator('input[type="submit"]')
      .or(page.locator('button[type="submit"]'))
      .or(page.locator('#kc-login'))
      .or(page.locator('input[name="login"]'))
      .first();

    await submitButton.click();

    // Wait for redirect back to app after successful login
    await page.waitForURL(/\/(ui\/)?callback/, { timeout: 10000 });

    // Wait for final redirect - could be home page OR bootstrap page if not yet bootstrapped
    await page.waitForURL(/\/$|\/ui\/$|\/ui\/bootstrap/, { timeout: 10000 });
  }

  // Note: We don't verify app bar visibility here because if system is not bootstrapped,
  // user will be on bootstrap page which hides the app bar
  // Individual tests can verify authentication as needed
}

/**
 * Performs logout
 */
export async function logout(page: Page) {
  // Look for user menu or logout button
  const userMenu = page
    .locator('[data-testid="user-menu"], .v-app-bar .v-btn:has-text("peter"), .v-app-bar .v-avatar')
    .first();

  if (await userMenu.isVisible({ timeout: 5000 })) {
    await userMenu.click();

    // Click logout in dropdown
    const logoutButton = page
      .locator(
        '[data-testid="logout-button"], .v-list-item:has-text("Logout"), button:has-text("Logout")',
      )
      .first();
    await logoutButton.click();
  } else {
    // Navigate directly to logout
    await page.goto('/ui/logout');
  }

  // Wait for redirect to login page
  await page.waitForURL(/\/ui\/login/, { timeout: 10000 });

  // Verify session storage is cleared
  const hasAuth = await page.evaluate(() => {
    const keys = Object.keys(sessionStorage);
    return keys.some((key) => key.includes('oidc') || key.includes('user'));
  });

  expect(hasAuth).toBeFalsy();
}

/**
 * Check if user is already authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const hasAuth = await page.evaluate(() => {
    const keys = Object.keys(sessionStorage);
    return keys.some((key) => key.includes('oidc') || key.includes('user'));
  });

  return hasAuth;
}

/**
 * Clear all session storage
 */
export async function clearSession(page: Page) {
  try {
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  } catch (error) {
    // If we can't clear storage (e.g., page hasn't navigated yet), that's fine
    // The page is already in a clean state
    console.log('Note: Could not clear storage (page may not be loaded yet)');
  }
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout: 15000 },
  );
}
