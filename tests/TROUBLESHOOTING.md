# Playwright Test Troubleshooting Guide

## Common Issues and Solutions

### 1. ❌ Timeout waiting for webServer

**Error:**

```
Error: Timed out waiting 60000ms from config.webServer.
```

**Causes:**

- Wrong port configured in `playwright.config.ts`
- Dev server already running on that port
- Dev server fails to start

**Solutions:**

✅ **Check your Vite port:**

```bash
# Look in vite.config.mts for:
server: {
  port: 3001  # Your actual port
}
```

✅ **Verify port is available:**

```bash
lsof -ti:3001  # Replace 3001 with your port
```

✅ **Kill processes using the port:**

```bash
pkill -f "vite"
# or
kill -9 $(lsof -ti:3001)
```

✅ **Start dev server manually to test:**

```bash
npm run dev
# Check what port it actually starts on
```

---

### 2. ❌ Tests fail at login

**Error:**

```
TimeoutError: page.waitForSelector: Timeout 30000ms exceeded
```

**Causes:**

- Keycloak not running
- Wrong credentials
- Missing redirect URI in Keycloak

**Solutions:**

✅ **Verify Keycloak is running:**

```bash
curl http://localhost:30080/realms/iceberg
```

✅ **Check credentials in `.env.test`:**

```env
TEST_USERNAME=peter
TEST_PASSWORD=password
```

✅ **Add redirect URI to Keycloak:**

- Go to: Keycloak Admin → Clients → lakekeeper → Settings
- Add to "Valid Redirect URIs":
  ```
  http://localhost:3001/ui/callback
  ```

✅ **Verify user exists in Keycloak:**

- Go to: Keycloak Admin → Users
- Search for test user (e.g., "peter")

---

### 3. ❌ Session storage not found

**Error:**

```
expect(received).toBeTruthy()
Received: false
```

**Causes:**

- OIDC authentication not completing
- Session not persisting
- Wrong storage key names

**Solutions:**

✅ **Check browser console in headed mode:**

```bash
npm run test:headed
# Watch for OIDC errors in browser console
```

✅ **Debug with UI mode:**

```bash
npm run test:ui
# Step through test to see where it fails
```

✅ **Verify session storage keys:**

```typescript
// In test, add:
const keys = await page.evaluate(() => Object.keys(sessionStorage));
console.log('Session keys:', keys);
```

---

### 4. ❌ Element not found

**Error:**

```
Error: locator.click: Target closed
```

**Causes:**

- Element selector changed
- Element not visible yet
- Wrong timing

**Solutions:**

✅ **Use more specific selectors:**

```typescript
// Instead of:
await page.click('button');

// Use:
await page.click('[data-testid="create-warehouse"]');
```

✅ **Wait for element:**

```typescript
await page.waitForSelector('[data-testid="warehouse-list"]');
await page.click('[data-testid="create-warehouse"]');
```

✅ **Use Codegen to get selectors:**

```bash
npm run test:codegen
# Click on elements to see suggested selectors
```

---

### 5. ❌ API requests failing

**Error:**

```
404 Not Found: /management/v1/warehouse
```

**Causes:**

- Backend API not running
- Wrong API URL
- Authentication header missing

**Solutions:**

✅ **Verify backend is running:**

```bash
curl http://localhost:8181/management/v1/catalog/ping
```

✅ **Check API URL in env:**

```env
VITE_MANAGEMENT_API_URL=http://localhost:8181
```

✅ **Wait for API response:**

```typescript
await page.waitForResponse(
  (response) => response.url().includes('/warehouse') && response.status() === 200,
);
```

---

## Debugging Techniques

### 1. Run in Headed Mode

```bash
npm run test:headed
```

See what's happening in the browser.

### 2. Use UI Mode

```bash
npm run test:ui
```

Step through tests, inspect DOM, see network requests.

### 3. Debug Mode

```bash
npm run test:debug
```

Pause execution, inspect state.

### 4. Add Screenshots

```typescript
await page.screenshot({ path: 'debug.png' });
```

### 5. Add Console Logs

```typescript
const text = await page.locator('.error').textContent();
console.log('Error message:', text);
```

### 6. View Trace

```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### 7. View HTML Report

```bash
npx playwright show-report
```

---

## Pre-flight Checklist

Before running tests:

- [ ] Keycloak is running on port 30080
- [ ] Backend API is running on port 8181
- [ ] Test user exists in Keycloak
- [ ] Port 3001 is available (no dev server running)
- [ ] `.env.test` has correct credentials
- [ ] Keycloak has correct redirect URIs
- [ ] npm dependencies are installed
- [ ] Playwright browsers are installed

---

## Quick Fixes

### Reset Everything

```bash
# Kill all processes
pkill -f "vite"
pkill -f "node"

# Clear test artifacts
rm -rf test-results/ playwright-report/

# Reinstall
npm install
npx playwright install chromium

# Run tests
npm test
```

### Check Services

```bash
# Check Keycloak
curl http://localhost:30080/realms/iceberg/.well-known/openid-configuration

# Check Backend
curl http://localhost:8181/management/v1/catalog/ping

# Check Frontend (after starting)
curl http://localhost:3001/ui/
```

### Update Selectors

```bash
# Generate new test with current selectors
npm run test:codegen
```

---

## Getting Help

1. **View test report**: `npx playwright show-report`
2. **Check trace**: `npx playwright show-trace [trace-file]`
3. **Run single test**: `npx playwright test tests/auth/login.spec.ts`
4. **Grep for specific test**: `npx playwright test --grep "login"`
5. **See full output**: `npx playwright test --reporter=line`
