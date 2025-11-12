<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4">Project Dependencies</h1>
        
        <v-tabs v-model="tab" color="primary">
          <v-tab value="console">Console (Frontend)</v-tab>
          <v-tab value="components">Console Components (Library)</v-tab>
          <v-tab value="backend">Lakekeeper (Backend - Rust)</v-tab>
        </v-tabs>

        <v-card class="mt-4">
          <v-tabs-window v-model="tab">
            <!-- Console Dependencies -->
            <v-tabs-window-item value="console">
              <v-card-text>
                <h2 class="text-h5 mb-4">Console Application</h2>
                <p class="text-body-2 mb-4">Version: 0.10.2</p>

                <v-expansion-panels class="mb-4">
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <div class="d-flex align-center">
                        <v-icon class="mr-2" color="success">mdi-package-variant</v-icon>
                        <strong>Runtime Dependencies ({{ consoleDeps.length }})</strong>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-list density="compact">
                        <v-list-item
                          v-for="dep in consoleDeps"
                          :key="dep.name"
                          class="dependency-item">
                          <template v-slot:prepend>
                            <v-icon size="small">mdi-circle-small</v-icon>
                          </template>
                          <v-list-item-title>
                            <code>{{ dep.name }}</code>
                          </v-list-item-title>
                          <v-list-item-subtitle>{{ dep.version }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-expansion-panel-text>
                  </v-expansion-panel>

                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <div class="d-flex align-center">
                        <v-icon class="mr-2" color="info">mdi-tools</v-icon>
                        <strong>Dev Dependencies ({{ consoleDevDeps.length }})</strong>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-list density="compact">
                        <v-list-item
                          v-for="dep in consoleDevDeps"
                          :key="dep.name"
                          class="dependency-item">
                          <template v-slot:prepend>
                            <v-icon size="small">mdi-circle-small</v-icon>
                          </template>
                          <v-list-item-title>
                            <code>{{ dep.name }}</code>
                          </v-list-item-title>
                          <v-list-item-subtitle>{{ dep.version }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-text>
            </v-tabs-window-item>

            <!-- Console Components Dependencies -->
            <v-tabs-window-item value="components">
              <v-card-text>
                <h2 class="text-h5 mb-4">Console Components Library</h2>
                <p class="text-body-2 mb-4">Version: 0.2.4</p>

                <v-expansion-panels class="mb-4">
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <div class="d-flex align-center">
                        <v-icon class="mr-2" color="success">mdi-package-variant</v-icon>
                        <strong>Runtime Dependencies ({{ componentsDeps.length }})</strong>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-list density="compact">
                        <v-list-item
                          v-for="dep in componentsDeps"
                          :key="dep.name"
                          class="dependency-item">
                          <template v-slot:prepend>
                            <v-icon size="small">mdi-circle-small</v-icon>
                          </template>
                          <v-list-item-title>
                            <code>{{ dep.name }}</code>
                          </v-list-item-title>
                          <v-list-item-subtitle>{{ dep.version }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-expansion-panel-text>
                  </v-expansion-panel>

                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <div class="d-flex align-center">
                        <v-icon class="mr-2" color="info">mdi-tools</v-icon>
                        <strong>Dev Dependencies ({{ componentsDevDeps.length }})</strong>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-list density="compact">
                        <v-list-item
                          v-for="dep in componentsDevDeps"
                          :key="dep.name"
                          class="dependency-item">
                          <template v-slot:prepend>
                            <v-icon size="small">mdi-circle-small</v-icon>
                          </template>
                          <v-list-item-title>
                            <code>{{ dep.name }}</code>
                          </v-list-item-title>
                          <v-list-item-subtitle>{{ dep.version }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-expansion-panel-text>
                  </v-expansion-panel>

                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <div class="d-flex align-center">
                        <v-icon class="mr-2" color="warning">mdi-link-variant</v-icon>
                        <strong>Peer Dependencies ({{ componentsPeerDeps.length }})</strong>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-list density="compact">
                        <v-list-item
                          v-for="dep in componentsPeerDeps"
                          :key="dep.name"
                          class="dependency-item">
                          <template v-slot:prepend>
                            <v-icon size="small">mdi-circle-small</v-icon>
                          </template>
                          <v-list-item-title>
                            <code>{{ dep.name }}</code>
                          </v-list-item-title>
                          <v-list-item-subtitle>{{ dep.version }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-text>
            </v-tabs-window-item>

            <!-- Rust Dependencies -->
            <v-tabs-window-item value="backend">
              <v-card-text>
                <h2 class="text-h5 mb-4">Lakekeeper Backend (Rust)</h2>
                <p class="text-body-2 mb-4">Version: 0.10.3 | Rust: 1.87.0</p>

                <v-expansion-panels>
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <div class="d-flex align-center">
                        <v-icon class="mr-2" color="error">mdi-language-rust</v-icon>
                        <strong>Workspace Dependencies ({{ rustDeps.length }})</strong>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-text-field
                        v-model="rustSearch"
                        label="Search dependencies"
                        prepend-inner-icon="mdi-magnify"
                        clearable
                        density="compact"
                        class="mb-4"></v-text-field>

                      <v-list density="compact">
                        <v-list-item
                          v-for="dep in filteredRustDeps"
                          :key="dep.name"
                          class="dependency-item">
                          <template v-slot:prepend>
                            <v-icon size="small">mdi-circle-small</v-icon>
                          </template>
                          <v-list-item-title>
                            <code>{{ dep.name }}</code>
                          </v-list-item-title>
                          <v-list-item-subtitle>
                            {{ dep.version }}
                            <span v-if="dep.features" class="text-caption ml-2">
                              (features: {{ dep.features }})
                            </span>
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-text>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const tab = ref('console');
const rustSearch = ref('');

// Console Dependencies (Runtime)
const consoleDeps = [
  {
    "name": "@lakekeeper/console-components",
    "version": "github:lakekeeper/console-components#pr-1486"
  },
  {
    "name": "@mdi/font",
    "version": "7.4.47"
  },
  {
    "name": "json-bigint",
    "version": "^1.0.0"
  },
  {
    "name": "oidc-client-ts",
    "version": "^3.3.0"
  },
  {
    "name": "pinia-plugin-persistedstate-2",
    "version": "^2.0.32"
  },
  {
    "name": "vue",
    "version": "^3.5.22"
  },
  {
    "name": "vue-json-pretty",
    "version": "^2.6.0"
  },
  {
    "name": "vuetify",
    "version": "^3.10.8"
  }
];

// Console Dev Dependencies
const consoleDevDeps = [
  {
    "name": "@eslint/js",
    "version": "^9.14.0"
  },
  {
    "name": "@playwright/test",
    "version": "^1.56.0"
  },
  {
    "name": "@tsconfig/node22",
    "version": "^22.0.0"
  },
  {
    "name": "@types/node",
    "version": "^22.19.0"
  },
  {
    "name": "@vitejs/plugin-vue",
    "version": "^5.1.4"
  },
  {
    "name": "@vue/eslint-config-typescript",
    "version": "^14.1.3"
  },
  {
    "name": "@vue/tsconfig",
    "version": "^0.8.1"
  },
  {
    "name": "dotenv",
    "version": "^17.2.3"
  },
  {
    "name": "eslint",
    "version": "^9.39.1"
  },
  {
    "name": "eslint-config-prettier",
    "version": "^10.1.8"
  },
  {
    "name": "eslint-plugin-prettier",
    "version": "^5.5.4"
  },
  {
    "name": "eslint-plugin-vue",
    "version": "^10.5.1"
  },
  {
    "name": "pinia",
    "version": "^3.0.3"
  },
  {
    "name": "prettier",
    "version": "^3.6.2"
  },
  {
    "name": "typescript",
    "version": "~5.9.3"
  },
  {
    "name": "typescript-eslint",
    "version": "^8.46.3"
  },
  {
    "name": "unplugin-auto-import",
    "version": "^0.17.6"
  },
  {
    "name": "unplugin-fonts",
    "version": "^1.1.1"
  },
  {
    "name": "unplugin-vue-components",
    "version": "^0.28.0"
  },
  {
    "name": "unplugin-vue-router",
    "version": "^0.16.1"
  },
  {
    "name": "vite",
    "version": "^5.4.21"
  },
  {
    "name": "vite-plugin-vue-layouts",
    "version": "^0.11.0"
  },
  {
    "name": "vite-plugin-vuetify",
    "version": "^2.0.3"
  },
  {
    "name": "vue-eslint-parser",
    "version": "^10.2.0"
  },
  {
    "name": "vue-router",
    "version": "^4.6.3"
  },
  {
    "name": "vue-tsc",
    "version": "^3.1.3"
  }
];

// Console Components Dependencies
const componentsDeps = [
  {
    "name": "@codemirror/commands",
    "version": "^6.10.0"
  },
  {
    "name": "@codemirror/lang-sql",
    "version": "^6.10.0"
  },
  {
    "name": "@codemirror/state",
    "version": "^6.5.2"
  },
  {
    "name": "@codemirror/view",
    "version": "^6.38.6"
  },
  {
    "name": "@duckdb/duckdb-wasm",
    "version": "^1.31.1-dev1.0"
  },
  {
    "name": "@wdns/vue-code-block",
    "version": "^2.3.5"
  },
  {
    "name": "apache-arrow",
    "version": "^21.1.0"
  },
  {
    "name": "chart.js",
    "version": "^4.4.9"
  },
  {
    "name": "codemirror",
    "version": "^6.0.2"
  },
  {
    "name": "date-fns",
    "version": "^4.1.0"
  },
  {
    "name": "vue-chartjs",
    "version": "^5.3.2"
  }
];

const componentsDevDeps = [
  {
    "name": "@eslint/js",
    "version": "^9.37.0"
  },
  {
    "name": "@hey-api/client-fetch",
    "version": "^0.13.1"
  },
  {
    "name": "@hey-api/openapi-ts",
    "version": "^0.87.0"
  },
  {
    "name": "@types/chart.js",
    "version": "^2.9.41"
  },
  {
    "name": "@types/json-bigint",
    "version": "^1.0.4"
  },
  {
    "name": "@vitejs/plugin-vue",
    "version": "^5.0.0"
  },
  {
    "name": "eslint",
    "version": "^9.37.0"
  },
  {
    "name": "eslint-config-prettier",
    "version": "^10.1.8"
  },
  {
    "name": "eslint-plugin-prettier",
    "version": "^5.5.4"
  },
  {
    "name": "eslint-plugin-vue",
    "version": "^10.5.1"
  },
  {
    "name": "globals",
    "version": "^16.5.0"
  },
  {
    "name": "jest",
    "version": "^29.0.0"
  },
  {
    "name": "json-bigint",
    "version": "^1.0.0"
  },
  {
    "name": "oidc-client-ts",
    "version": "^3.3.0"
  },
  {
    "name": "pinia",
    "version": "^3.0.3"
  },
  {
    "name": "pinia-plugin-persistedstate-2",
    "version": "^2.0.31"
  },
  {
    "name": "prettier",
    "version": "^3.6.2"
  },
  {
    "name": "sass",
    "version": "^1.0.0"
  },
  {
    "name": "typescript",
    "version": "^5.0.0"
  },
  {
    "name": "typescript-eslint",
    "version": "^8.45.0"
  },
  {
    "name": "vite",
    "version": "^5.4.21"
  },
  {
    "name": "vite-plugin-vuetify",
    "version": "^2.1.1"
  },
  {
    "name": "vue-eslint-parser",
    "version": "^10.2.0"
  },
  {
    "name": "vue-json-pretty",
    "version": "^2.6.0"
  },
  {
    "name": "vue-router",
    "version": "^4.5.1"
  },
  {
    "name": "vue-tsc",
    "version": "^3.1.3"
  }
];

const componentsPeerDeps = [
  {
    "name": "vue",
    "version": "^3.5.16"
  },
  {
    "name": "vuetify",
    "version": "^3.8.7"
  }
];

// Rust Dependencies
const rustDeps = [
  {
    "name": "unicase",
    "version": "2.8.1",
    "features": ""
  },
  {
    "name": "anyhow",
    "version": "^1.0",
    "features": ""
  },
  {
    "name": "assert-json-diff",
    "version": "2.0.2",
    "features": ""
  },
  {
    "name": "async-channel",
    "version": "2.3.1",
    "features": ""
  },
  {
    "name": "async-compression",
    "version": "^0.4",
    "features": "tokio, gzip"
  },
  {
    "name": "async-nats",
    "version": "0.44.0",
    "features": ""
  },
  {
    "name": "async-stream",
    "version": "0.3.6",
    "features": ""
  },
  {
    "name": "async-trait",
    "version": "0.1.89",
    "features": ""
  },
  {
    "name": "aws-config",
    "version": "1.8.5",
    "features": "behavior-version-latest"
  },
  {
    "name": "aws-sdk-sts",
    "version": "1.82.0",
    "features": ""
  },
  {
    "name": "aws-smithy-async",
    "version": "1.2.5",
    "features": ""
  },
  {
    "name": "aws-smithy-http",
    "version": "0.62.3",
    "features": ""
  },
  {
    "name": "aws-smithy-http-client",
    "version": "1.0.6",
    "features": ""
  },
  {
    "name": "aws-smithy-runtime-api",
    "version": "1.8.7",
    "features": ""
  },
  {
    "name": "axum",
    "version": "0.8.1",
    "features": ""
  },
  {
    "name": "axum-extra",
    "version": "0.10.0",
    "features": ""
  },
  {
    "name": "axum-macros",
    "version": "0.5.0",
    "features": ""
  },
  {
    "name": "axum-prometheus",
    "version": "0.9.0",
    "features": "http-listener"
  },
  {
    "name": "azure_core",
    "version": "0.21.0",
    "features": ""
  },
  {
    "name": "azure_identity",
    "version": "0.21.0",
    "features": ""
  },
  {
    "name": "azure_storage",
    "version": "0.21.0",
    "features": ""
  },
  {
    "name": "azure_storage_blobs",
    "version": "0.21.0",
    "features": ""
  },
  {
    "name": "azure_storage_datalake",
    "version": "0.21.0",
    "features": ""
  },
  {
    "name": "base64",
    "version": "0.22.1",
    "features": ""
  },
  {
    "name": "bytes",
    "version": "1.10",
    "features": ""
  },
  {
    "name": "chrono",
    "version": "^0.4",
    "features": ""
  },
  {
    "name": "cloudevents-sdk",
    "version": "0.8.0",
    "features": ""
  },
  {
    "name": "derive_more",
    "version": "^2.0.0",
    "features": "from, debug"
  },
  {
    "name": "fastrand",
    "version": "2.3.0",
    "features": ""
  },
  {
    "name": "figment",
    "version": "^0.10",
    "features": "env"
  },
  {
    "name": "figment_file_provider_adapter",
    "version": "0.1.1",
    "features": ""
  },
  {
    "name": "flate2",
    "version": "^1.0",
    "features": ""
  },
  {
    "name": "futures",
    "version": "^0.3",
    "features": ""
  },
  {
    "name": "fxhash",
    "version": "0.2.1",
    "features": ""
  },
  {
    "name": "gcloud-token",
    "version": "1.0.0",
    "features": ""
  },
  {
    "name": "google-cloud-auth",
    "version": "1.1",
    "features": ""
  },
  {
    "name": "google-cloud-token",
    "version": "1.0",
    "features": ""
  },
  {
    "name": "google-cloud-storage",
    "version": "1.1",
    "features": ""
  },
  {
    "name": "headers",
    "version": "^0.4",
    "features": ""
  },
  {
    "name": "heck",
    "version": "0.5.0",
    "features": ""
  },
  {
    "name": "hostname",
    "version": "0.4.0",
    "features": ""
  },
  {
    "name": "http",
    "version": "1.3.1",
    "features": ""
  },
  {
    "name": "http-body-util",
    "version": "^0.1",
    "features": ""
  },
  {
    "name": "iceberg",
    "version": "git",
    "features": ""
  },
  {
    "name": "iso8601",
    "version": "0.6.2",
    "features": ""
  },
  {
    "name": "itertools",
    "version": "0.14.0",
    "features": ""
  },
  {
    "name": "jwks_client_rs",
    "version": "0.5.1",
    "features": ""
  },
  {
    "name": "lazy-regex",
    "version": "3.2.0",
    "features": "lite"
  },
  {
    "name": "lazy_static",
    "version": "^1.4",
    "features": ""
  },
  {
    "name": "limes",
    "version": "0.2.2",
    "features": "kubernetes, axum, rustls-tls"
  },
  {
    "name": "maplit",
    "version": "1.0.2",
    "features": ""
  },
  {
    "name": "middle",
    "version": "0.3",
    "features": "tonic"
  },
  {
    "name": "mockall",
    "version": "0.13.0",
    "features": ""
  },
  {
    "name": "moka",
    "version": "^0.12",
    "features": "future"
  },
  {
    "name": "paste",
    "version": "1.0.15",
    "features": ""
  },
  {
    "name": "percent-encoding",
    "version": "2.3.1",
    "features": ""
  },
  {
    "name": "pretty_assertions",
    "version": "~1.4",
    "features": ""
  },
  {
    "name": "quick-xml",
    "version": "0.38.3",
    "features": "serialize"
  },
  {
    "name": "rdkafka",
    "version": "git",
    "features": ""
  },
  {
    "name": "reqwest",
    "version": "^0.12",
    "features": ""
  },
  {
    "name": "serde",
    "version": "^1.0",
    "features": "rc"
  },
  {
    "name": "serde_derive",
    "version": "^1.0",
    "features": ""
  },
  {
    "name": "serde_json",
    "version": "^1.0",
    "features": "raw_value"
  },
  {
    "name": "serde_norway",
    "version": "0.9.42",
    "features": ""
  },
  {
    "name": "serde_with",
    "version": "^3.4",
    "features": ""
  },
  {
    "name": "similar",
    "version": "2.6.0",
    "features": ""
  },
  {
    "name": "sqlx",
    "version": "0.8.6",
    "features": ""
  },
  {
    "name": "strum",
    "version": "0.27.0",
    "features": "derive"
  },
  {
    "name": "strum_macros",
    "version": "0.27.0",
    "features": ""
  },
  {
    "name": "thiserror",
    "version": "2.0.0",
    "features": ""
  },
  {
    "name": "time",
    "version": "0.3.36",
    "features": ""
  },
  {
    "name": "tokio",
    "version": "1.41",
    "features": ""
  },
  {
    "name": "tokio-util",
    "version": "^0.7",
    "features": ""
  },
  {
    "name": "tower",
    "version": "^0.5",
    "features": ""
  },
  {
    "name": "tower-http",
    "version": "^0.6",
    "features": ""
  },
  {
    "name": "tracing",
    "version": "^0.1",
    "features": "attributes"
  },
  {
    "name": "tracing-subscriber",
    "version": "0.3.18",
    "features": "env-filter, json"
  },
  {
    "name": "tryhard",
    "version": "0.5.1",
    "features": ""
  },
  {
    "name": "typed-builder",
    "version": "^0.22.0",
    "features": ""
  },
  {
    "name": "url",
    "version": "^2.5",
    "features": "serde"
  },
  {
    "name": "urlencoding",
    "version": "^2.1",
    "features": ""
  },
  {
    "name": "utoipa",
    "version": "5.4.0",
    "features": ""
  },
  {
    "name": "utoipa-swagger-ui",
    "version": "9.0.2",
    "features": "axum"
  },
  {
    "name": "uuid",
    "version": "^1.6",
    "features": "serde, v4, v5, v7"
  },
  {
    "name": "veil",
    "version": "0.2.0",
    "features": ""
  },
  {
    "name": "tracing-test",
    "version": "0.2.5",
    "features": ""
  }
];

const filteredRustDeps = computed(() => {
  if (!rustSearch.value) return rustDeps;
  const search = rustSearch.value.toLowerCase();
  return rustDeps.filter((dep) => dep.name.toLowerCase().includes(search));
});
</script>

<style scoped>
.dependency-item {
  border-left: 2px solid rgba(0, 0, 0, 0.05);
}

code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.875rem;
}
</style>
