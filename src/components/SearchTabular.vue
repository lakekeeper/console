<template>
  <v-dialog v-model="dialog" max-width="900px" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-magnify</v-icon>
          Search Tables & Views
        </div>
        <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="searchQuery"
              label="Search for tables and views..."
              placeholder="Enter table or view name"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              clearable
              :loading="searching"
              @keyup.enter="performSearch"
              @click:clear="clearSearch"></v-text-field>
          </v-col>
          <v-col cols="12" md="4" class="d-flex align-center">
            <v-btn
              color="primary"
              :disabled="!searchQuery || searching"
              :loading="searching"
              @click="performSearch">
              <v-icon start>mdi-magnify</v-icon>
              Search
            </v-btn>
          </v-col>
        </v-row>

        <!-- Search Results -->
        <div v-if="hasSearched && !searching">
          <v-divider class="mb-4"></v-divider>

          <div v-if="errorMessage" class="text-center py-8">
            <v-icon size="64" color="error">mdi-alert-circle-outline</v-icon>
            <div class="text-h6 mt-2 text-error">{{ errorMessage }}</div>
            <div class="text-body-1 text-grey-lighten-1">
              Try again or adjust your search query.
            </div>
          </div>
          <div v-else-if="searchResults.length === 0" class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-table-search</v-icon>
            <div class="text-h6 mt-2 text-grey-lighten-1">No results found</div>
            <div class="text-body-1 text-grey-lighten-1">
              Try adjusting your search terms or check the spelling
            </div>
          </div>

          <v-data-table
            v-else
            :headers="headers"
            :items="formattedResults"
            :items-per-page="10"
            :items-per-page-options="[10, 25, 50]"
            hover
            density="compact"
            hide-default-footer
            class="mt-4">
            <template #item.name="{ item }">
              <div class="d-flex align-center">
                <v-icon :color="getTabularTypeColor(item.type)" class="mr-2">
                  {{ getTabularTypeIcon(item.type) }}
                </v-icon>
                <a
                  :href="getTabularRoute(item)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-decoration-none"
                  @click="closeDialog">
                  {{ item.name }}
                </a>
              </div>
            </template>

            <template #item.namespace="{ item }">
              {{ item.namespace }}
            </template>

            <template #item.distance="{ item }">
              <v-chip
                v-if="item.distance !== null && item.distance !== undefined"
                size="small"
                :color="getDistanceColor(item.distance)"
                variant="flat">
                {{ formatDistance(item.distance) }}
              </v-chip>
              <span v-else class="text-grey-lighten-1">—</span>
            </template>

            <template #item.actions="{ item }">
              <v-btn
                icon="mdi-open-in-new"
                size="small"
                variant="text"
                @click="openInNewTab(getTabularRoute(item))"></v-btn>
              <v-btn
                icon="mdi-content-copy"
                size="small"
                variant="text"
                @click="copyTabularId(item.id)"></v-btn>
            </template>
          </v-data-table>
        </div>

        <!-- Loading State -->
        <div v-if="searching" class="text-center py-8">
          <v-progress-circular color="primary" indeterminate :size="48"></v-progress-circular>
          <div class="text-subtitle-1 mt-2">Searching...</div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFunctions } from '@/plugins/functions';
import { useVisualStore } from '@/stores/visual';
import type { SearchTabular, SearchTabularRequest } from '@/gen/management/types.gen';
import { Type } from '@/common/interfaces';
import { baseUrlPrefix } from '@/app.config';

// Props
const props = defineProps<{
  warehouseId: string;
  modelValue: boolean;
}>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// Composables
const functions = useFunctions();
const visual = useVisualStore();

// Reactive data
const searchQuery = ref('');
const searching = ref(false);
const searchResults = ref<SearchTabular[]>([]);
const hasSearched = ref(false);
const errorMessage = ref('');

// Dialog control
const dialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

// Table headers
const headers = [
  { title: 'Name', key: 'name', align: 'start' as const },
  { title: 'Namespace', key: 'namespace', align: 'start' as const },
  { title: 'Type', key: 'type', align: 'start' as const },
  { title: 'Match Score', key: 'distance', align: 'center' as const, sortable: true },
  { title: 'Actions', key: 'actions', align: 'end' as const, sortable: false },
];

// Format results for the table
const formattedResults = computed(() => {
  return searchResults.value.map((result) => ({
    id: result['tabular-id'].id,
    name: result['tabular-name'],
    namespace: result['namespace-name'].join('.'),
    type: result['tabular-id'].type,
    distance: result.distance,
    raw: result,
  }));
});

// Methods
async function performSearch() {
  if (!searchQuery.value?.trim()) return;

  searching.value = true;
  errorMessage.value = '';

  try {
    const searchRequest: SearchTabularRequest = {
      search: searchQuery.value.trim(),
    };

    const response = await functions.searchTabular(props.warehouseId, searchRequest);
    searchResults.value = response.tabulars || [];
    hasSearched.value = true;

    visual.setSnackbarMsg({
      function: 'searchTabular',
      text: `Found ${searchResults.value.length} result(s)`,
      ttl: 3000,
      ts: Date.now(),
      type: Type.SUCCESS,
    });
  } catch (error: any) {
    console.error('Search failed:', error);
    errorMessage.value = error.message || 'Search failed. Please try again.';
    searchResults.value = [];
    hasSearched.value = true;

    visual.setSnackbarMsg({
      function: 'searchTabular',
      text: 'Search failed. Please try again.',
      ttl: 5000,
      ts: Date.now(),
      type: Type.ERROR,
    });
  } finally {
    searching.value = false;
  }
}

function clearSearch() {
  searchQuery.value = '';
  searchResults.value = [];
  hasSearched.value = false;
  errorMessage.value = '';
}

function closeDialog() {
  dialog.value = false;
}

function openInNewTab(route: string) {
  window.open(route, '_blank', 'noopener,noreferrer');
  closeDialog();
}

function getTabularTypeColor(type: string): string {
  switch (type) {
    case 'table':
      return 'blue';
    case 'view':
      return 'green';
    default:
      return 'grey';
  }
}

function getTabularTypeIcon(type: string): string {
  switch (type) {
    case 'table':
      return 'mdi-table';
    case 'view':
      return 'mdi-view-grid-outline';
    default:
      return 'mdi-help-circle-outline';
  }
}

function getTabularRoute(item: any) {
  // Match the exact same pattern as the router: ${env.baseUrlPrefix}/ui/
  const routerBase = `${baseUrlPrefix}/ui/`;
  // Convert namespace dots to the special separator character (0x1F) and encode it
  const namespaceWithSeparator = item.namespace.replace(/\./g, String.fromCharCode(0x1f));
  const baseRoute = `${routerBase}warehouse/${props.warehouseId}/namespace/${encodeURIComponent(namespaceWithSeparator)}`;
  return `${baseRoute}/${item.type}/${encodeURIComponent(item.name)}`;
}

function getDistanceColor(distance: number | undefined): string {
  if (!distance && distance !== 0) return 'grey';
  if (distance <= 0.2) return 'success';
  if (distance <= 0.5) return 'warning';
  return 'error';
}

function formatDistance(distance: number | undefined): string {
  if (!distance && distance !== 0) return 'N/A';
  const percentage = Math.round((1 - distance) * 100);
  return `${percentage}%`;
}

function copyTabularId(id: string) {
  functions.copyToClipboard(id);
  visual.setSnackbarMsg({
    function: 'copyTabularId',
    text: 'Tabular ID copied to clipboard',
    ttl: 2000,
    ts: Date.now(),
    type: Type.SUCCESS,
  });
}
</script>

<style scoped>
.v-data-table {
  border-radius: 8px;
}

.v-chip {
  font-weight: 500;
}

.router-link {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

.router-link:hover {
  text-decoration: underline !important;
}
</style>
