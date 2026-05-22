#!/usr/bin/env node

/**
 * Script to update the dependencies page with current dependencies from:
 * - console/package.json
 * - console-components/package.json
 * - lakekeeper/Cargo.toml (fetched from GitHub main branch)
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const consoleDir = path.resolve(__dirname, '..');

const consolePackagePath = path.join(consoleDir, 'package.json');
// Read the installed library (whatever version the lockfile resolved to),
// not a sibling working copy that may be on a different version.
const componentsPackagePath = path.join(
  consoleDir,
  'node_modules/@lakekeeper/console-components/package.json',
);
const dependenciesJsonPath = path.join(consoleDir, 'src/assets/dependencies.json');

const CARGO_REPO_SSH = 'git@github.com:lakekeeper/lakekeeper.git';
const CARGO_REPO_BRANCH = 'main';

console.log('📦 Reading package files...\n');

// Read package.json files with existence checks
if (!fs.existsSync(consolePackagePath)) {
  console.error(`❌ Error: Console package.json not found`);
  console.error(`   Expected at: ${consolePackagePath}`);
  process.exit(1);
}

if (!fs.existsSync(componentsPackagePath)) {
  console.error(`❌ Error: Console Components package.json not found`);
  console.error(`   Expected at: ${componentsPackagePath}`);
  process.exit(1);
}

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

// Parse Cargo.toml (fetched from GitHub main branch)
function parseCargoToml(cargoContent) {
  let rustDeps = [];
  let rustVersion = 'unknown';
  let wasmVersion = 'unknown';

  const versionMatch = cargoContent.match(/^version\s*=\s*"([^"]+)"/m);
  if (versionMatch) rustVersion = versionMatch[1];

  const rustVersionMatch = cargoContent.match(/^rust-version\s*=\s*"([^"]+)"/m);
  if (rustVersionMatch) wasmVersion = rustVersionMatch[1];

  const depsSection = cargoContent.match(/\[workspace\.dependencies\]([\s\S]*?)(?=\n\[|$)/);
  if (depsSection) {
    const lines = depsSection[1].split('\n');
    for (const line of lines) {
      const match = line.match(/^(\w[\w-]*)\s*=\s*(.+)/);
      if (match) {
        const [, name, rest] = match;
        let version = '';
        let features = '';

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

  return { rustDeps, rustVersion, wasmVersion };
}

// Fetch Cargo.toml via shallow sparse SSH clone (uses local SSH key).
function fetchCargoTomlViaSsh(repoSsh, branch) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lke-cargo-'));
  try {
    execSync(
      `git clone --depth=1 --filter=blob:none --no-checkout --branch ${branch} --quiet ${repoSsh} ${tmpDir}`,
      { stdio: ['ignore', 'ignore', 'inherit'] },
    );
    execSync(`git -C ${tmpDir} checkout HEAD -- Cargo.toml`, {
      stdio: ['ignore', 'ignore', 'inherit'],
    });
    return fs.readFileSync(path.join(tmpDir, 'Cargo.toml'), 'utf8');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

let rustDeps = [];
let rustVersion = 'unknown';
let wasmVersion = 'unknown';

try {
  console.log(`📡 Cloning ${CARGO_REPO_SSH} (${CARGO_REPO_BRANCH}) via SSH`);
  const cargoContent = fetchCargoTomlViaSsh(CARGO_REPO_SSH, CARGO_REPO_BRANCH);
  ({ rustDeps, rustVersion, wasmVersion } = parseCargoToml(cargoContent));
  console.log(`✅ Rust dependencies: ${rustDeps.length} workspace deps (lakekeeper@main)`);
} catch (err) {
  console.warn(
    `⚠️  Failed to fetch Cargo.toml via SSH: ${err.message} — skipping Rust dependencies`,
  );
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

if (rustDeps.length === 0) {
  console.warn('━'.repeat(70));
  console.warn(
    '⚠️  WARNING: Rust dependencies are EMPTY in the generated JSON.\n' +
      '   The Cargo.toml clone likely failed. Do NOT commit this file as-is.\n' +
      '   Check SSH access to the lakekeeper repo and rerun.',
  );
  console.warn('━'.repeat(70));
}
