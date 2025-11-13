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
                <p class="text-body-2 mb-4">Version: {{ dependenciesData.console.version }}</p>

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
                <p class="text-body-2 mb-4">Version: {{ dependenciesData.components.version }}</p>

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
                <p class="text-body-2 mb-4">
                  Version: {{ dependenciesData.rust.version }} | Rust:
                  {{ dependenciesData.rust.rustVersion }}
                </p>

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
import dependenciesData from '../data/dependencies.json' with { type: 'json' };

const tab = ref('console');
const rustSearch = ref('');

// Extract dependencies from imported JSON
const consoleDeps = dependenciesData.console.dependencies;
const consoleDevDeps = dependenciesData.console.devDependencies;
const componentsDeps = dependenciesData.components.dependencies;
const componentsDevDeps = dependenciesData.components.devDependencies;
const componentsPeerDeps = dependenciesData.components.peerDependencies;
const rustDeps = dependenciesData.rust.dependencies;

const filteredRustDeps = computed(() => {
  if (!rustSearch.value) return rustDeps;
  const search = rustSearch.value.toLowerCase();
  return rustDeps.filter((dep: any) => dep.name.toLowerCase().includes(search));
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
