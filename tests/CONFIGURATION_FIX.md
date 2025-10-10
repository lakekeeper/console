# Playwright Configuration Fix

## Issue

Tests were failing with timeout error:

```
Error: Timed out waiting 60000ms from config.webServer.
```

## Root Cause

Playwright configuration had **incorrect port number**:

- **Expected**: Port 5173 (default Vite port)
- **Actual**: Port 3001 (configured in vite.config.mts)

## Changes Made

### 1. Updated `playwright.config.ts`

```typescript
// Changed from
baseURL: 'http://localhost:5173';
webServer: {
  url: 'http://localhost:5173';
}

// Changed to
baseURL: 'http://localhost:3001';
webServer: {
  url: 'http://localhost:3001';
}
```

Also increased timeout to 2 minutes:

```typescript
webServer: {
  timeout: 120 * 1000, // 2 minutes
}
```

### 2. Updated `.env.test`

```env
PLAYWRIGHT_BASE_URL=http://localhost:3001
VITE_OIDC_REDIRECT_URI=http://localhost:3001/ui/callback
```

## Verification

1. **Check port in use**:

   ```bash
   lsof -ti:3001
   ```

2. **Start dev server manually**:

   ```bash
   npm run dev
   # Should show: http://localhost:3001/ui/
   ```

3. **Run tests**:
   ```bash
   npm run test:headed
   ```

## Important Notes

- Your Vite server is configured to use **port 3001** (in `vite.config.mts`)
- Playwright will automatically start and stop the dev server
- If port 3001 is in use, tests will fail - stop other processes first
- Make sure Keycloak redirect URIs include `http://localhost:3001/ui/callback`

## Keycloak Configuration

Add this redirect URI to your Keycloak client:

```
http://localhost:3001/ui/callback
```

Navigate to: Keycloak Admin Console → Clients → lakekeeper → Settings → Valid Redirect URIs

## Running Tests

```bash
# Run all tests (headless)
npm test

# Run with browser visible
npm run test:headed

# Run in UI mode
npm run test:ui
```
