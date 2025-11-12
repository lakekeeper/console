#!/usr/bin/env node

/**
 * Script to update the dependencies page with current dependencies from:
 * - console/package.json
 * - console-components/package.json
 * - lakekeeper/Cargo.toml
 */

const fs = require('fs');
const path = require('path');

// Paths
const consoleDir = path.resolve(__dirname, '..');
const consoleComponentsDir = path.resolve(__dirname, '../../console-components');
const lakekeeperDir = path.resolve(__dirname, '../../lakekeeper');

const consolePackagePath = path.join(consoleDir, 'package.json');
const componentsPackagePath = path.join(consoleComponentsDir, 'package.json');
const cargoTomlPath = path.join(lakekeeperDir, 'Cargo.toml');
const dependenciesVuePath = path.join(consoleDir, 'src/pages/dependencies.vue');

console.log('📦 Reading package files...\n');

// Read package.json files
const consolePackage = JSON.parse(fs.readFileSync(consolePackagePath, 'utf8'));
const componentsPackage = JSON.parse(fs.readFileSync(componentsPackagePath, 'utf8'));

// Parse dependencies into arrays
function parseDependencies(deps) {
  if (!deps) return [];
  return Object.entries(deps)
    .map(([name, version]) => ({ name, version }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const consoleDeps = parseDependencies(consolePackage.dependencies);
const consoleDevDeps = parseDependencies(consolePackage.devDependencies);
const componentsDeps = parseDependencies(componentsPackage.dependencies);
const componentsDevDeps = parseDependencies(componentsPackage.devDependencies);
const componentsPeerDeps = parseDependencies(componentsPackage.peerDependencies);

console.log(`✅ Console dependencies: ${consoleDeps.length} runtime, ${consoleDevDeps.length} dev`);
console.log(
  `✅ Console Components: ${componentsDeps.length} runtime, ${componentsDevDeps.length} dev, ${componentsPeerDeps.length} peer`,
);

// Parse Cargo.toml
let rustDeps = [];
let rustVersion = 'unknown';
let wasmVersion = 'unknown';

if (fs.existsSync(cargoTomlPath)) {
  const cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');

  // Extract version
  const versionMatch = cargoContent.match(/^version\s*=\s*"([^"]+)"/m);
  if (versionMatch) rustVersion = versionMatch[1];

  // Extract rust-version
  const rustVersionMatch = cargoContent.match(/^rust-version\s*=\s*"([^"]+)"/m);
  if (rustVersionMatch) wasmVersion = rustVersionMatch[1];

  // Extract dependencies from [workspace.dependencies] section
  const depsSection = cargoContent.match(/\[workspace\.dependencies\]([\s\S]*?)(?=\n\[|$)/);
  if (depsSection) {
    const lines = depsSection[1].split('\n');
    for (const line of lines) {
      const match = line.match(/^(\w[\w-]*)\s*=\s*(.+)/);
      if (match) {
        const [, name, rest] = match;
        let version = '';
        let features = '';

        // Parse version and features
        if (rest.includes('{')) {
          const versionMatch = rest.match(/version\s*=\s*"([^"]+)"/);
          const featuresMatch = rest.match(/features\s*=\s*\[([^\]]+)\]/);
          version = versionMatch ? versionMatch[1] : 'git';
          if (featuresMatch) {
            features = featuresMatch[1].replace(/["']/g, '').replace(/,\s*/g, ', ');
          }
        } else {
          version = rest.replace(/["']/g, '').trim();
        }

        rustDeps.push({ name, version, features });
      }
    }
  }

  console.log(`✅ Rust dependencies: ${rustDeps.length} workspace deps`);
} else {
  console.warn('⚠️  Cargo.toml not found, skipping Rust dependencies');
}

// Generate Vue component code
const vueContent = `<template>
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
                <p class="text-body-2 mb-4">Version: ${consolePackage.version}</p>

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
                <p class="text-body-2 mb-4">Version: ${componentsPackage.version}</p>

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
                <p class="text-body-2 mb-4">Version: ${rustVersion} | Rust: ${wasmVersion}</p>

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
const consoleDeps = ${JSON.stringify(consoleDeps, null, 2)};

// Console Dev Dependencies
const consoleDevDeps = ${JSON.stringify(consoleDevDeps, null, 2)};

// Console Components Dependencies
const componentsDeps = ${JSON.stringify(componentsDeps, null, 2)};

const componentsDevDeps = ${JSON.stringify(componentsDevDeps, null, 2)};

const componentsPeerDeps = ${JSON.stringify(componentsPeerDeps, null, 2)};

// Rust Dependencies
const rustDeps = ${JSON.stringify(rustDeps, null, 2)};

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
`;

// Write the file
fs.writeFileSync(dependenciesVuePath, vueContent, 'utf8');

console.log(`\n✅ Updated ${dependenciesVuePath}`);
console.log('\n📊 Summary:');
console.log(`   Console: ${consoleDeps.length + consoleDevDeps.length} total dependencies`);
console.log(
  `   Components: ${componentsDeps.length + componentsDevDeps.length + componentsPeerDeps.length} total dependencies`,
);
console.log(`   Rust: ${rustDeps.length} workspace dependencies`);
console.log('\n✨ Done! The dependencies page has been updated.\n');
