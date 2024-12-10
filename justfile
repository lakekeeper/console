update-openapi:
    curl -o openapi/management-open-api.yaml https://raw.githubusercontent.com/lakekeeper/lakekeeper/refs/heads/main/openapi/management-open-api.yaml

generate-management-client:
    npx @hey-api/openapi-ts -i openapi/management-open-api.yaml -o src/gen/management -c @hey-api/client-fetch

generate-iceberg-client:
    npx @hey-api/openapi-ts -i openapi/rest-catalog-open-api.yaml -o src/gen/iceberg -c @hey-api/client-fetch

# Run ESLint with auto-fix
fix-lint:
    npm run lint

# Run type checking
check-types:
    vue-tsc --noEmit

# Dev server with hot reload
dev:
    npm run dev

# Build the project
build:
    npm run build

# Format all files
format:
    npm run format

# Check if files are formatted correctly (no changes)
check-format:
    npm run format:check

# Run all checks including formatting
check-all: check-format check-types fix-lint

fix-all: format fix-lint
