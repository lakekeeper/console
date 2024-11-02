update-openapi:
    curl -o openapi/management-open-api.yaml https://raw.githubusercontent.com/lakekeeper/lakekeeper/refs/heads/main/openapi/management-open-api.yaml

generate-management-client:
    npx @hey-api/openapi-ts -i openapi/management-open-api.yaml -o src/gen -c @hey-api/client-fetch

