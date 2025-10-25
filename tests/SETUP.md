# E2E Test Environment Setup

This guide explains how to set up the complete environment for running E2E tests **locally**. For CI/CD (GitHub Actions), tests run automatically - see `.github/workflows/e2e-tests.yml`.

## Prerequisites (Local Development Only)

- Docker installed and running
- Rust and Cargo installed (for Lakekeeper)
- Node.js and npm installed
- Git

## One-Time Setup

### 1. Clone Lakekeeper Repository

```bash
# Clone the lakekeeper repo (sibling to console repo)
cd ..
git clone git@github.com:lakekeeper/lakekeeper.git
cd lakekeeper
```

### 2. Start Docker Services

```bash
# Remove any existing containers
docker rm --force postgres-16 openfga keycloak

# Start PostgreSQL
docker run -d --name postgres-16 -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  postgres:16.4 -c "max_connections=10000"

# Start OpenFGA
docker run -d --name openfga \
  -p 35080:8080 -p 35081:8081 -p 35300:3000 \
  openfga/openfga run

# Start Keycloak
docker run -d \
  --name keycloak \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  -v $(pwd)/examples/access-control-simple/keycloak/realm.json:/opt/keycloak/data/import/realm.json \
  -p 30080:8080 \
  quay.io/keycloak/keycloak:26.0.7 \
  start-dev --metrics-enabled=true --health-enabled=true --import-realm --verbose --log-level=INFO --features=token-exchange
```

### 3. Set Environment Variables

```bash
export LAKEKEEPER__AUTHZ_BACKEND=openfga
export LAKEKEEPER__OPENFGA__ENDPOINT=http://localhost:35081
export LAKEKEEPER__PG_ENCRYPTION_KEY=abc
export LAKEKEEPER__PG_DATABASE_URL_READ=postgresql://postgres:postgres@localhost/postgres
export LAKEKEEPER__PG_DATABASE_URL_WRITE=postgresql://postgres:postgres@localhost/postgres
export LAKEKEEPER__BASE_URI=http://localhost:8181
export LAKEKEEPER__OPENID_PROVIDER_URI=http://localhost:30080/realms/iceberg
export LAKEKEEPER__OPENID_AUDIENCE=lakekeeper
export LAKEKEEPER__LISTEN_PORT=8181
export LAKEKEEPER__UI__OPENID_CLIENT_ID="lakekeeper"
export LAKEKEEPER__ALLOW_ORIGIN=*
```

### 4. Wait for Keycloak to be Ready

```bash
# Wait for Keycloak health check
until curl -sf http://localhost:30080/health > /dev/null; do
  echo "Waiting for Keycloak..."
  sleep 2
done
echo "✓ Keycloak is ready"
```

### 5. Start Lakekeeper

```bash
# Navigate to the Lakekeeper binary crate
cd crates/iceberg-catalog-bin

# Run migrations
cargo run --all-features migrate

# Start the server
cargo run --all-features serve
```

Wait for the build and server to start (you'll see log messages indicating it's ready).

### 6. Bootstrap Lakekeeper UI

1. Open browser to http://localhost:8181
2. Click "Proceed"
3. Scroll down and click "Agree" to accept the EULA
4. This creates the initial admin user

## Daily Test Workflow

Once you've done the one-time setup, this is what you need each day:

### 1. Start Docker Services

```bash
docker start postgres-16 openfga keycloak

# Wait for Keycloak
until curl -sf http://localhost:30080/health > /dev/null; do
  echo "Waiting for Keycloak..."
  sleep 2
done
```

### 2. Start Lakekeeper (in lakekeeper repo)

```bash
# Set environment variables (same as above)
export LAKEKEEPER__AUTHZ_BACKEND=openfga
export LAKEKEEPER__OPENFGA__ENDPOINT=http://localhost:35081
export LAKEKEEPER__PG_ENCRYPTION_KEY=abc
export LAKEKEEPER__PG_DATABASE_URL_READ=postgresql://postgres:postgres@localhost/postgres
export LAKEKEEPER__PG_DATABASE_URL_WRITE=postgresql://postgres:postgres@localhost/postgres
export LAKEKEEPER__BASE_URI=http://localhost:8181
export LAKEKEEPER__OPENID_PROVIDER_URI=http://localhost:30080/realms/iceberg
export LAKEKEEPER__OPENID_AUDIENCE=lakekeeper
export LAKEKEEPER__LISTEN_PORT=8181
export LAKEKEEPER__UI__OPENID_CLIENT_ID="lakekeeper"
export LAKEKEEPER__ALLOW_ORIGIN=*

# Start server
cd crates/iceberg-catalog-bin
cargo run --all-features serve
```

### 3. Run Tests (in console repo)

```bash
cd /path/to/console
npm test -- --headed
```

Playwright will automatically start the frontend dev server on port 5001.

## Service Ports

- **Frontend (dev)**: http://localhost:3001
- **Frontend (test)**: http://localhost:5001
- **Lakekeeper API**: http://localhost:8181
- **Keycloak**: http://localhost:30080
- **PostgreSQL**: localhost:5432
- **OpenFGA**:
  - API: http://localhost:35081
  - HTTP: http://localhost:35080
  - Playground: http://localhost:35300

## Test User Credentials

Defined in `.env.test`:

- **Username**: peter
- **Password**: iceberg

## Troubleshooting

### Keycloak not starting

```bash
docker logs keycloak
```

### Lakekeeper connection errors

- Ensure PostgreSQL is running: `docker ps | grep postgres-16`
- Ensure OpenFGA is running: `docker ps | grep openfga`
- Check environment variables are set

### Tests can't authenticate

- Verify Keycloak is accessible: `curl http://localhost:30080/health`
- Verify test user exists in Keycloak realm
- Check `.env.test` has correct credentials

### Port conflicts

- Check what's running on each port: `lsof -i :8181`
- Stop conflicting services or change ports

## CI/CD (GitHub Actions)

Tests also run automatically in GitHub Actions on pull requests and pushes to main/develop branches.

**What's automated in CI:**

- ✅ PostgreSQL, OpenFGA, and Keycloak start automatically as Docker services
- ✅ Lakekeeper backend is cloned, built, and started automatically
- ✅ Frontend dev server starts automatically via Playwright webServer
- ✅ All tests run headlessly (no browser UI)
- ✅ Test reports and screenshots uploaded as artifacts

**What's different in CI:**

- Uses hardcoded test credentials (peter/iceberg)
- No manual bootstrap needed
- Runs on every PR automatically
- Isolated environment per test run

See `.github/workflows/e2e-tests.yml` for the full CI configuration.
