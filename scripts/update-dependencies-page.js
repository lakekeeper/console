#!/usr/bin/env node

/**
 * Script to update the dependencies page with current dependencies from:
 * - console/package.json
 * - console-components/package.json
 * - lakekeeper/Cargo.toml
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const consoleDir = path.resolve(__dirname, '..');
const consoleComponentsDir = path.resolve(__dirname, '../../console-components');
const lakekeeperDir = path.resolve(__dirname, '../../lakekeeper');

const consolePackagePath = path.join(consoleDir, 'package.json');
const componentsPackagePath = path.join(consoleComponentsDir, 'package.json');
const cargoTomlPath = path.join(lakekeeperDir, 'Cargo.toml');
const dependenciesJsonPath = path.join(consoleDir, 'src/data/dependencies.json');

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

// Create dependencies data object
const dependenciesData = {
  console: {
    version: consolePackage.version,
    dependencies: consoleDeps,
    devDependencies: consoleDevDeps,
  },
  components: {
    version: componentsPackage.version,
    dependencies: componentsDeps,
    devDependencies: componentsDevDeps,
    peerDependencies: componentsPeerDeps,
  },
  rust: {
    version: rustVersion,
    rustVersion: wasmVersion,
    dependencies: rustDeps,
  },
};

// Write JSON file
const jsonDir = path.dirname(dependenciesJsonPath);
if (!fs.existsSync(jsonDir)) {
  fs.mkdirSync(jsonDir, { recursive: true });
}
fs.writeFileSync(dependenciesJsonPath, JSON.stringify(dependenciesData, null, 2), 'utf8');

console.log(`\n✅ Updated ${dependenciesJsonPath}`);
console.log('\n📊 Summary:');
console.log(`   Console: ${consoleDeps.length + consoleDevDeps.length} total dependencies`);
console.log(
  `   Components: ${componentsDeps.length + componentsDevDeps.length + componentsPeerDeps.length} total dependencies`,
);
console.log(`   Rust: ${rustDeps.length} workspace dependencies`);
console.log('\n✨ Done! The dependencies page has been updated.\n');
