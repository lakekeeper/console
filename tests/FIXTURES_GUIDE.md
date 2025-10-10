# Playwright Fixtures vs Python Fixtures

## Comparison of Approaches

### Python (pytest) Fixtures

```python
@pytest.fixture
def authenticated_browser(browser):
    """Fixture that logs in before test"""
    login(browser, "peter", "iceberg")
    yield browser
    # teardown code here

def test_something(authenticated_browser):
    """Test automatically gets authenticated browser"""
    authenticated_browser.goto("/dashboard")
    # browser is already logged in!
```

### JavaScript/Playwright - Three Approaches

#### 1. Direct Call (Simple, but repetitive)

```typescript
test('my test', async ({ page }) => {
  await login(page, TEST_USER); // Manual call in every test
  await page.goto('/dashboard');
});
```

**Pros:** Simple, explicit
**Cons:** Repetitive, easy to forget

---

#### 2. beforeEach Hook (Most common)

```typescript
test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Runs automatically before EACH test in this describe block
    await login(page, TEST_USER);
  });

  test('test 1', async ({ page }) => {
    // Already logged in!
    await page.goto('/dashboard');
  });

  test('test 2', async ({ page }) => {
    // Already logged in!
    await page.goto('/settings');
  });
});
```

**Pros:** Simple, no extra files needed
**Cons:** Only works within describe block, can't be shared across files

---

#### 3. Custom Fixture (Most like Python, best for reusability)

```typescript
// In tests/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';
import { login } from '../utils/auth';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Setup: Login before test
    await login(page, { username: 'peter', password: 'iceberg' });

    // Provide authenticated page to test
    await use(page);

    // Teardown: Optional cleanup
    // await logout(page);
  },
});

export { expect } from '@playwright/test';

// In your test file
import { test, expect } from '../fixtures/auth.fixture';

test('my test', async ({ authenticatedPage: page }) => {
  // Page is already authenticated!
  await page.goto('/dashboard');
});
```

**Pros:**

- Most reusable (like Python fixtures)
- Can be imported anywhere
- Clear separation of concerns
- Supports setup AND teardown

**Cons:**

- Requires extra file
- Slightly more complex

---

## Which to Use?

### Use **Direct Call** when:

- One-off tests
- Explicit control needed
- Very simple scenarios

### Use **beforeEach** when:

- All tests in a describe block need same setup
- Simple, contained test suites
- Don't need to share across files

### Use **Custom Fixture** when:

- Need to reuse across multiple test files (like Python's conftest.py)
- Complex setup/teardown logic
- Want type safety and autocomplete
- Building a test framework

---

## Our Project Structure

We use **all three** approaches where appropriate:

- **auth.fixture.ts** - Provides `authenticatedPage` fixture (reusable)
- **beforeEach** in some test files for file-specific setup
- **Direct calls** in login.spec.ts (testing login itself)

Example usage in bootstrap.spec.ts:

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test('bootstrap', async ({ authenticatedPage: page }) => {
  // Automatically logged in via fixture!
  await page.goto('/ui/bootstrap');
  // ... rest of test
});
```
