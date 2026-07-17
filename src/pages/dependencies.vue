<template>
  <div class="deps-page">
    <div class="deps-inner">
      <!-- Hero -->
      <header class="deps-hero">
        <p class="deps-eyebrow">Transparency</p>
        <h1 class="deps-title">Dependencies</h1>
      </header>

      <!-- Controls -->
      <div class="deps-controls">
        <v-select
          v-model="selectedSource"
          :items="selectItems"
          label="Package"
          density="comfortable"
          hide-details
          class="deps-select"></v-select>

        <v-text-field
          v-model="search"
          label="Search"
          prepend-inner-icon="mdi-magnify"
          density="comfortable"
          clearable
          hide-details
          class="deps-search"></v-text-field>

        <p class="deps-count">{{ visibleCount }} of {{ filteredItems.length }}</p>
      </div>

      <!-- Table -->
      <div class="deps-table-wrap">
        <v-data-table-virtual
          :headers="headers"
          :items="filteredItems"
          :search="search"
          height="640"
          fixed-header
          density="comfortable"
          hover
          item-value="rowKey"
          class="deps-table">
          <template #item.name="{ item }">
            <code class="dep-mono dep-name">{{ item.name }}</code>
          </template>

          <template #item.version="{ item }">
            <div class="dep-version">
              <span class="dep-mono dep-version-text" :title="item.fullVersion">
                {{ shortVersion(item.version) }}
              </span>
              <span v-if="item.features" class="dep-mono dep-features">{{ item.features }}</span>
            </div>
          </template>

          <template #item.type="{ item }">
            <v-chip
              :color="chipColor(item.typeKey)"
              size="small"
              variant="tonal"
              class="dep-mono dep-chip">
              {{ item.type }}
            </v-chip>
          </template>

          <template #no-data>
            <div class="deps-empty">No dependencies match your filters.</div>
          </template>
        </v-data-table-virtual>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import dependenciesData from '../assets/dependencies.json' with { type: 'json' };

interface DepEntry {
  name: string;
  version: string;
  features?: string;
}

interface Row {
  rowKey: string;
  name: string;
  version: string;
  fullVersion: string;
  source: string;
  sourceKey: string;
  type: string;
  typeKey: string;
  features?: string;
}

// Data-driven group config: order + labels. Only groups present in the JSON render.
const JS_GROUPS = [
  { key: 'console', label: 'Console' },
  { key: 'components', label: 'Console components' },
  { key: 'consolePlusComponents', label: 'Console+ components' },
  { key: 'consolePlus', label: 'Console+' },
];
const RUST_GROUPS = [
  { key: 'rust', label: 'Lakekeeper (Rust)' },
  { key: 'rustPlus', label: 'Lakekeeper+ (Rust)' },
];
const JS_TYPES = [
  { arr: 'dependencies', type: 'Runtime', typeKey: 'runtime' },
  { arr: 'devDependencies', type: 'Dev', typeKey: 'dev' },
  { arr: 'peerDependencies', type: 'Peer', typeKey: 'peer' },
];

const data = dependenciesData as Record<string, any>;

const presentGroups = [...JS_GROUPS, ...RUST_GROUPS].filter((g) => data[g.key]);

// Flatten every dependency into a single row list.
const allRows: Row[] = [];
for (const g of JS_GROUPS) {
  const group = data[g.key];
  if (!group) continue;
  for (const t of JS_TYPES) {
    const list: DepEntry[] = group[t.arr] || [];
    for (const dep of list) {
      allRows.push({
        rowKey: `${g.key}:${t.typeKey}:${dep.name}`,
        name: dep.name,
        version: dep.version,
        fullVersion: dep.version,
        source: g.label,
        sourceKey: g.key,
        type: t.type,
        typeKey: t.typeKey,
      });
    }
  }
}
for (const g of RUST_GROUPS) {
  const group = data[g.key];
  if (!group) continue;
  const list: DepEntry[] = group.dependencies || [];
  for (const dep of list) {
    allRows.push({
      rowKey: `${g.key}:workspace:${dep.name}`,
      name: dep.name,
      version: dep.version,
      fullVersion: dep.version,
      source: g.label,
      sourceKey: g.key,
      type: 'Workspace',
      typeKey: 'workspace',
      features: dep.features || undefined,
    });
  }
}

const headers = [
  { title: 'Package', key: 'name', width: '45%' },
  { title: 'Version', key: 'version', width: '20%' },
  { title: 'Source', key: 'source', width: '22%' },
  { title: 'Type', key: 'type', width: '13%' },
] as const;

const selectedSource = ref<string>('all');
const search = ref('');

const selectItems = computed(() => [
  { title: `All packages (${allRows.length})`, value: 'all' },
  ...presentGroups.map((g) => ({ title: g.label, value: g.key })),
]);

// Dropdown filters rows by sourceKey *before* the table; the search box drives
// the table's own :search.
const filteredItems = computed(() =>
  selectedSource.value === 'all'
    ? allRows
    : allRows.filter((r) => r.sourceKey === selectedSource.value),
);

// Mirror the table's built-in search (substring across the visible column keys)
// so the "X of Y" count reflects what the table actually shows.
const visibleCount = computed(() => {
  const q = search.value?.trim().toLowerCase();
  if (!q) return filteredItems.value.length;
  return filteredItems.value.filter((r) =>
    [r.name, r.version, r.source, r.type].some((v) => v.toLowerCase().includes(q)),
  ).length;
});

const CHIP_COLORS: Record<string, string> = {
  runtime: 'success',
  dev: 'info',
  peer: 'warning',
  workspace: 'error',
};
function chipColor(typeKey: string): string {
  return CHIP_COLORS[typeKey] ?? 'info';
}

// npm allows long git/URL specs that would blow out the cell — shorten for display.
function shortVersion(v: string): string {
  if (!v) return '';
  const hash = v.indexOf('#');
  if (hash !== -1) return v.slice(hash + 1).replace(/^semver:/, '') || 'git';
  if (/^(github:|git[+@]|https?:\/\/)/.test(v)) {
    const m = v.match(/v?\d+\.\d+\.\d+[\w.-]*/);
    return m ? m[0] : 'git';
  }
  return v;
}
</script>

<style scoped>
.deps-page {
  --dep-mono: 'JetBrains Mono', ui-monospace, 'Roboto Mono', SFMono-Regular, Menlo, monospace;
  font-family: 'Inter', 'Roboto', sans-serif;
  background-color: rgb(var(--v-theme-background));
  min-height: 100%;
  padding: 40px 24px 64px;
}

.deps-inner {
  max-width: 1120px;
  margin: 0 auto;
}

/* Hero */
.deps-eyebrow {
  font-family: var(--dep-mono);
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 0.72rem;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
  margin: 0 0 6px;
}

.deps-title {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

/* Controls */
.deps-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin: 28px 0 20px;
}

.deps-select {
  flex: 0 1 280px;
  max-width: 280px;
}

.deps-search {
  flex: 1 1 320px;
  min-width: 220px;
}

.deps-count {
  margin: 0 0 0 auto;
  font-family: var(--dep-mono);
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  white-space: nowrap;
}

/* Table shell */
.deps-table-wrap {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 14px;
  overflow: hidden;
  background-color: rgb(var(--v-theme-surface-light));
}

.deps-table {
  background-color: transparent;
}

/* Solid header so virtualized rows don't bleed through while scrolling. */
.deps-table :deep(thead th) {
  background-color: rgb(var(--v-theme-surface-light)) !important;
  font-family: var(--dep-mono) !important;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.7rem !important;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

/* Cells */
.dep-mono {
  font-family: var(--dep-mono);
}

.dep-name {
  font-size: 0.85rem;
  color: rgb(var(--v-theme-on-surface));
  background: transparent;
  padding: 0;
}

.dep-version {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.dep-version-text {
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.dep-features {
  font-size: 0.68rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin-top: 2px;
}

.dep-chip {
  font-size: 0.64rem !important;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.deps-empty {
  padding: 48px 16px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* Responsive: stack controls full-width on narrow viewports. */
@media (max-width: 640px) {
  .deps-controls {
    gap: 12px;
  }
  .deps-select,
  .deps-search {
    flex: 1 1 100%;
    max-width: 100%;
  }
  .deps-count {
    margin-left: 0;
  }
}
</style>
