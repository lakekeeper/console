#!/bin/bash

echo "🔍 Checking test environment..."
echo ""

# Check prerequisites first
echo "=== Prerequisites ==="
PREREQS_OK=true

# Check Docker
if command -v docker &> /dev/null; then
  echo "✅ Docker is installed ($(docker --version | cut -d' ' -f3 | cut -d',' -f1))"
else
  echo "❌ Docker is not installed"
  echo "   Install from: https://www.docker.com/get-started"
  PREREQS_OK=false
fi

# Check Node.js
if command -v node &> /dev/null; then
  echo "✅ Node.js is installed ($(node --version))"
else
  echo "❌ Node.js is not installed"
  echo "   Install from: https://nodejs.org/"
  PREREQS_OK=false
fi

# Check npm
if command -v npm &> /dev/null; then
  echo "✅ npm is installed ($(npm --version))"
else
  echo "❌ npm is not installed"
  PREREQS_OK=false
fi

# Check Git
if command -v git &> /dev/null; then
  echo "✅ Git is installed ($(git --version | cut -d' ' -f3))"
else
  echo "❌ Git is not installed"
  PREREQS_OK=false
fi

# Check Cargo (for Lakekeeper backend)
if command -v cargo &> /dev/null; then
  echo "✅ Cargo/Rust is installed ($(cargo --version | cut -d' ' -f2))"
else
  echo "⚠️  Cargo/Rust is not installed (needed to run Lakekeeper backend)"
  echo "   Install from: https://rustup.rs/"
  PREREQS_OK=false
fi

echo ""

if [ "$PREREQS_OK" = false ]; then
  echo "❌ Missing prerequisites. Please install them first."
  echo "   See tests/SETUP.md for detailed instructions."
  echo ""
fi

# Check running services
echo "=== Running Services ==="
SERVICES_OK=true

# Check if Keycloak is running
echo "Checking Keycloak on port 30080..."
if curl -sf http://localhost:30080/health > /dev/null 2>&1; then
  echo "✅ Keycloak is running"
else
  echo "❌ Keycloak is not running on port 30080"
  echo "   Start with: docker start keycloak"
  SERVICES_OK=false
fi

# Check if Lakekeeper is running
echo "Checking Lakekeeper on port 8181..."
if curl -sf http://localhost:8181/health > /dev/null 2>&1 || curl -sf http://localhost:8181 > /dev/null 2>&1; then
  echo "✅ Lakekeeper is running"
else
  echo "❌ Lakekeeper is not running on port 8181"
  echo "   Start with: cd lakekeeper/crates/iceberg-catalog-bin && cargo run --all-features serve"
  SERVICES_OK=false
fi

# Check PostgreSQL
echo "Checking PostgreSQL on port 5432..."
if docker ps | grep -q postgres-16; then
  echo "✅ PostgreSQL is running"
else
  echo "❌ PostgreSQL is not running"
  echo "   Start with: docker start postgres-16"
  SERVICES_OK=false
fi

# Check OpenFGA
echo "Checking OpenFGA on port 35081..."
if docker ps | grep -q openfga; then
  echo "✅ OpenFGA is running"
else
  echo "❌ OpenFGA is not running"
  echo "   Start with: docker start openfga"
  SERVICES_OK=false
fi

echo ""

if [ "$SERVICES_OK" = true ]; then
  echo "✅ All services are ready! You can run tests now."
  exit 0
else
  echo "❌ Some services are not running. Please start them before running tests."
  echo ""
  echo "📖 See tests/SETUP.md for detailed setup instructions."
  exit 1
fi
