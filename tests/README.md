# E2E Testing with Playwright

This directory contains end-to-end tests for the Lakekeeper Console application using Playwright.

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install Playwright and all required dependencies.

### 2. Install Browsers

```bash
npx playwright install chromium
```

### 3. Configure Test Environment

Copy `.env.test` to `.env.test.local` and update with your test credentials:

```env
TEST_USERNAME=peter
TEST_PASSWORD=password
```

### 4. Start Required Services

Make sure the following services are running:

- **Lakekeeper Backend API**: `http://localhost:8181`
- **Keycloak**: `http://localhost:30080`
- **Test user configured in Keycloak realm**

## Running Tests

### Run all tests (headless)

```bash
npm test
```

### Run tests with browser visible

```bash
npm run test:headed
```

### Run tests in interactive UI mode

```bash
npm run test:ui
```

### Run tests in debug mode

```bash
npm run test:debug
```

### Generate test code using Codegen

```bash
npm run test:codegen
```

### Run specific test file

```bash
npx playwright test tests/auth/login.spec.ts
```

### Run tests matching a pattern

```bash
npx playwright test --grep "login"
```

## Test Structure

```
tests/
├── auth/
│   └── login.spec.ts          # Authentication flow tests
├── warehouse/
│   └── create.spec.ts         # Warehouse creation tests
├── utils/
│   └── auth.ts                # Authentication helper functions
└── README.md
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { login } from '../utils/auth';

test('my test', async ({ page }) => {
  // Login first
  await login(page, { username: 'peter', password: 'password' });

  // Navigate and interact
  await page.goto('/warehouses');
  await page.click('[data-testid="create-warehouse"]');

  // Assert
  await expect(page.locator('.warehouse-list')).toBeVisible();
});
```

### Using Authentication Helpers

```typescript
import { login, logout, isAuthenticated, clearSession } from '../utils/auth';

// Login
await login(page, { username: 'peter', password: 'password' });

// Logout
await logout(page);

// Check authentication status
const authenticated = await isAuthenticated(page);

// Clear session
await clearSession(page);
```

## Test Coverage

### Current Tests

- ✅ **Login flow** - Valid credentials, error handling
- ✅ **Logout flow** - Session clearing, redirect
- ✅ **Session persistence** - Page reload handling
- ✅ **Protected routes** - Unauthorized access

### Planned Tests

- ⏳ **Warehouse operations** - Create, edit, delete
- ⏳ **Namespace management** - CRUD operations
- ⏳ **Table operations** - View, manage tables
- ⏳ **Role management** - Create, assign roles
- ⏳ **User profile** - View and update profile
- ⏳ **Navigation** - All page accessibility

## Debugging

### View Test Report

After running tests:

```bash
npx playwright show-report
```

### Trace Viewer

View traces for failed tests:

```bash
npx playwright show-trace trace.zip
```

### Screenshots and Videos

Failed test artifacts are saved in `test-results/` directory.

## CI/CD

Tests are configured to run in CI with:

- Retries: 2 attempts on failure
- Parallel: Disabled in CI for stability
- Screenshots: On failure
- Video: On failure
- Trace: On first retry

## Best Practices

1. **Use data-testid attributes** for reliable selectors
2. **Clean up after tests** - logout, clear data
3. **Wait for network requests** before assertions
4. **Use page object pattern** for complex pages
5. **Keep tests independent** - don't rely on test order
6. **Use beforeEach/afterEach** for setup/teardown

## Troubleshooting

### Timeout Errors

If tests timeout waiting for elements:

- Increase timeout in `playwright.config.ts`
- Check if services are running
- Verify network connectivity

### Authentication Failures

- Verify test user exists in Keycloak
- Check credentials in `.env.test.local`
- Ensure Keycloak realm is configured correctly

### Element Not Found

- Add `data-testid` attributes to components
- Use more specific selectors
- Wait for element to be visible before interaction

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
