# Quick Start - Running Tests

## Option 1: Automatic (Playwright starts dev server)

```bash
npm test
```

**Issues?** If webServer timeout occurs, use Option 2 or 3.

## Option 2: Manual Dev Server (Recommended)

### Step 1: Start dev server

```bash
npm run dev
# Wait for: ➜  Local:   http://localhost:3001/ui/
```

### Step 2: In another terminal, run tests

```bash
npm run test:manual
```

Or with browser visible:

```bash
SKIP_WEBSERVER=true npm run test:headed
```

## Option 3: Use Test Script (All-in-One)

```bash
npm run test:run
```

This script:

1. Starts dev server
2. Waits for it to be ready
3. Runs tests
4. Stops dev server

## Debug Tests

### See tests in browser

```bash
# Start dev server first
npm run dev

# Then in another terminal
SKIP_WEBSERVER=true npx playwright test --headed
```

### Use UI Mode (Best for debugging)

```bash
# Start dev server first
npm run dev

# Then in another terminal
SKIP_WEBSERVER=true npx playwright test --ui
```

### Run single test

```bash
# Start dev server first
npm run dev

# Then run specific test
SKIP_WEBSERVER=true npx playwright test tests/auth/login.spec.ts --headed
```

## Troubleshooting

### ❌ Timeout waiting for webServer

**Problem:** Playwright can't start dev server on port 3001

**Solution:**

1. Check if port is in use: `lsof -ti:3001`
2. Kill process: `kill -9 $(lsof -ti:3001)`
3. Use manual mode: `SKIP_WEBSERVER=true npm test`

### ❌ Tests hang and do nothing

**Problem:** Dev server running but tests not executing

**Solution:**

1. Stop all vite processes: `pkill -f vite`
2. Use the test script: `npm run test:run`
3. Or run manually (see Option 2 above)

### ❌ Login fails

**Problem:** Keycloak authentication error

**Check:**

1. Is Keycloak running? `curl http://localhost:30080/realms/iceberg`
2. Is backend running? `curl http://localhost:8181/management/v1/catalog/ping`
3. Are credentials correct in `.env.test`?
4. Is redirect URI configured in Keycloak?
   - Add: `http://localhost:3001/ui/callback`

## Environment Variables

Create `.env.test` with:

```env
PLAYWRIGHT_BASE_URL=http://localhost:3001
TEST_USERNAME=peter
TEST_PASSWORD=your_password
```

## Pre-flight Checklist

Before running tests:

- [ ] Keycloak running on localhost:30080
- [ ] Backend API running on localhost:8181
- [ ] Test user exists in Keycloak
- [ ] Port 3001 is available
- [ ] Redirect URI configured in Keycloak

## Quick Commands Reference

```bash
# List all tests
npx playwright test --list

# Run single test file
npm run test:run tests/auth/login.spec.ts

# Run tests matching pattern
npm run test:run --grep="login"

# View last test report
npx playwright show-report
```
