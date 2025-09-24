<template>
  <v-card-text>
    <div class="d-flex align-center mb-4">
      <v-icon class="mr-2">mdi-history</v-icon>
      <span class="text-h6">View Evolution History</span>
    </div>

    <div v-if="versionHistory.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey">mdi-eye-off-outline</v-icon>
      <div class="text-subtitle-1 mt-2">No versions found</div>
      <div class="text-body-2 text-medium-emphasis">This view has no version history</div>
    </div>

    <!-- Interactive Timeline Overview -->
    <div v-if="versionHistory.length > 0" class="mb-6">
      <div class="text-subtitle-1 mb-3 d-flex align-center">
        <v-icon class="mr-2" size="small">mdi-timeline-clock-outline</v-icon>
        Timeline Overview
        <v-spacer></v-spacer>
        <v-chip size="small" variant="outlined" class="ml-2">
          {{ versionHistory.length }} versions
        </v-chip>
      </div>

      <v-card variant="outlined" class="pa-4">
        <div class="horizontal-timeline-container" style="overflow-x: auto">
          <v-timeline
            direction="horizontal"
            density="compact"
            class="pa-0"
            style="min-width: max-content">
            <v-timeline-item
              v-for="(event, index) in timelineEvents"
              :key="event.id"
              :dot-color="
                event.type === 'schema-change'
                  ? 'warning'
                  : event.type === 'version' && isInitialVersion(event.version)
                    ? 'purple'
                    : index === 0
                      ? 'success'
                      : 'info'
              "
              :size="event.type === 'schema-change' ? 'x-small' : 'small'"
              style="min-width: 200px">
              <template #icon>
                <div
                  v-if="event.type === 'version'"
                  style="
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  "
                  @click="scrollToVersion(event.version['version-id'])">
                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" :size="index === 0 ? 16 : 14" color="white">
                        {{ index === 0 ? 'mdi-check-circle' : 'mdi-eye' }}
                      </v-icon>
                    </template>
                    {{ event.version['version-id'] }}
                  </v-tooltip>
                </div>
                <div
                  v-else-if="event.type === 'schema-change'"
                  style="display: flex; align-items: center; justify-content: center">
                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" size="12" color="white">mdi-table-cog</v-icon>
                    </template>
                    Schema Change: {{ event.schemaId }}
                  </v-tooltip>
                </div>
              </template>

              <!-- Content directly under the icon -->
              <div
                class="text-center timeline-item-content"
                style="min-width: 180px; max-width: 180px">
                <div v-if="event.type === 'version'">
                  <div class="text-caption mb-1">
                    {{ formatTimelineDate(event.version['timestamp-ms']) }}
                  </div>
                  <div v-if="event.version.summary?.['engine-name']">
                    <v-chip size="x-small" color="primary" variant="flat" class="text-caption">
                      {{ event.version.summary['engine-name'] }}
                    </v-chip>
                  </div>
                </div>
                <div v-else-if="event.type === 'schema-change'">
                  <div class="text-caption mb-1" style="color: #fb8c00">Schema Change</div>
                  <v-chip size="x-small" color="warning" variant="flat" class="text-caption">
                    ID: {{ event.schemaId }}
                  </v-chip>
                </div>
              </div>
            </v-timeline-item>
          </v-timeline>
        </div>
      </v-card>
    </div>

    <div style="max-height: 60vh; overflow-y: auto" class="vertical-timeline-container">
      <v-timeline v-if="versionHistory.length > 0" side="end" density="compact" class="pa-0">
        <v-timeline-item
          v-for="(version, index) in versionHistory"
          :key="version['version-id']"
          :dot-color="index === 0 ? 'success' : 'info'"
          size="small"
          :data-version-id="version['version-id']">
          <template #icon>
            <v-icon v-if="index === 0" size="small">mdi-check-circle</v-icon>
            <v-icon v-else size="small">mdi-eye</v-icon>
          </template>

          <v-card variant="outlined" class="mb-4" :data-version-id="version['version-id']">
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-chip v-if="index === 0" size="small" color="success" variant="flat" class="mr-2">
                  Current
                </v-chip>
                <span class="font-mono">Version {{ version['version-id'] }}</span>
              </div>
              <v-btn
                icon="mdi-content-copy"
                size="small"
                variant="flat"
                @click="copyToClipboard(String(version['version-id']))"></v-btn>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-list density="compact">
                    <v-list-item>
                      <v-list-item-title>Timestamp</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ formatTimestamp(version['timestamp-ms']) }}
                      </v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item v-if="version['schema-id']">
                      <v-list-item-title>Schema ID</v-list-item-title>
                      <v-list-item-subtitle class="font-mono">
                        {{ version['schema-id'] }}
                        <v-chip
                          v-if="getSchemaChanges(version, index)"
                          size="x-small"
                          color="warning"
                          variant="flat"
                          class="ml-2">
                          Schema Changed
                        </v-chip>
                      </v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item v-if="version.representations && version.representations[0]">
                      <v-list-item-title>SQL Query</v-list-item-title>
                      <v-list-item-subtitle class="d-flex align-center">
                        <span class="mr-2 font-mono text-wrap" style="max-width: 300px">
                          {{ version.representations[0].sql }}
                        </span>
                        <v-btn
                          icon="mdi-content-copy"
                          size="small"
                          variant="flat"
                          @click="copyToClipboard(version.representations[0].sql)"></v-btn>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-col>

                <v-col cols="12" md="6">
                  <v-list density="compact">
                    <v-list-item v-if="version.summary">
                      <v-list-item-title>Engine Info</v-list-item-title>
                      <v-list-item-subtitle>
                        <div v-if="version.summary['engine-name']" class="mb-1">
                          <strong>Engine:</strong>
                          {{ version.summary['engine-name'] }}
                          {{ version.summary['engine-version'] }}
                        </div>
                        <div v-if="version.summary['iceberg-version']" class="text-caption">
                          {{ version.summary['iceberg-version'] }}
                        </div>
                      </v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item v-if="version.representations && version.representations[0]">
                      <v-list-item-title>SQL Dialect</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ version.representations[0].dialect || 'Not specified' }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-col>
              </v-row>

              <!-- Schema Changes -->
              <v-row v-if="getSchemaInfo(version['schema-id'])">
                <v-col cols="12">
                  <v-divider class="my-2"></v-divider>
                  <v-expansion-panels variant="accordion" class="mt-2">
                    <v-expansion-panel>
                      <v-expansion-panel-title class="text-subtitle-2">
                        <v-icon class="mr-2" size="small">mdi-table-cog</v-icon>
                        Schema Details ({{
                          getSchemaInfo(version['schema-id'])?.fields?.length || 0
                        }}
                        fields)
                        <v-chip
                          v-if="getSchemaChanges(version, index)"
                          size="x-small"
                          color="warning"
                          variant="flat"
                          class="ml-2">
                          Changed
                        </v-chip>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <div
                          class="schema-fields-container"
                          style="max-height: 300px; overflow-y: auto">
                          <v-list density="compact">
                            <v-list-item
                              v-for="field in getSchemaInfo(version['schema-id'])?.fields || []"
                              :key="field.id"
                              class="pa-1">
                              <template #prepend>
                                <v-icon
                                  :color="isFieldNew(field, version, index) ? 'success' : undefined"
                                  size="small">
                                  {{ getFieldIcon(field) }}
                                </v-icon>
                              </template>
                              <v-list-item-title
                                :class="
                                  isFieldNew(field, version, index)
                                    ? 'text-success font-weight-bold'
                                    : ''
                                ">
                                {{ field.name }}
                                <v-chip
                                  v-if="isFieldNew(field, version, index)"
                                  size="x-small"
                                  color="success"
                                  variant="flat"
                                  class="ml-2">
                                  New
                                </v-chip>
                              </v-list-item-title>
                              <v-list-item-subtitle>
                                {{ getFieldTypeString(field.type) }}
                                <span v-if="field.required" class="text-error ml-1">*</span>
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </div>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-timeline-item>
      </v-timeline>
    </div>
  </v-card-text>
</template>

<script setup lang="ts">
import { computed, reactive, onMounted } from 'vue';
import { useFunctions } from '../plugins/functions';

// Types
interface TimelineEvent {
  type: 'version' | 'schema-change';
  version?: any;
  schemaId?: number;
  timestampMs: number;
  id: string;
}

// Props
interface Props {
  view: any;
}

const props = defineProps<Props>();

// Composables
const functions = useFunctions();

// Data
const versionHistory = reactive<any[]>([]);

// Methods
const copyToClipboard = (text: string) => {
  functions.copyToClipboard(text);
};

const formatTimestamp = (timestampMs: number): string => {
  if (!timestampMs) return '';
  const date = new Date(timestampMs);
  return date.toLocaleString();
};

const formatTimelineDate = (timestampMs: number): string => {
  if (!timestampMs) return '';
  const date = new Date(timestampMs);
  return (
    date.toLocaleDateString() +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
};

// Computed properties
const timelineEvents = computed((): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  // Add all versions as events
  versionHistory.forEach((version, index) => {
    // Check if this version introduces a new schema (compared to the previous version)
    if (index < versionHistory.length - 1) {
      const prevVersion = versionHistory[index + 1]; // Previous in time (next in array since sorted desc)
      if (version['schema-id'] !== prevVersion['schema-id']) {
        // Add schema change event before this version
        events.push({
          type: 'schema-change',
          schemaId: version['schema-id'],
          timestampMs: version['timestamp-ms'] - 1, // Slightly before the version
          id: `schema-${prevVersion['schema-id']}-${version['schema-id']}`,
        });
      }
    }

    // Add the version event
    events.push({
      type: 'version',
      version,
      timestampMs: version['timestamp-ms'],
      id: `version-${version['version-id']}`,
    });
  });

  // Sort events by timestamp (descending, newest first)
  return events.sort((a, b) => b.timestampMs - a.timestampMs);
});

// Helper functions
const isInitialVersion = (version: any): boolean => {
  if (!versionHistory.length) return false;
  // The initial version is the one with the earliest timestamp (last in the sorted array)
  const oldestVersion = versionHistory[versionHistory.length - 1];
  return version['version-id'] === oldestVersion['version-id'];
};

const scrollToVersion = (versionId: number) => {
  console.log('Scrolling to version:', versionId);

  // Find the container first
  const container = document.querySelector('.vertical-timeline-container') as HTMLElement;

  if (!container) {
    console.log('Vertical timeline container not found');
    return;
  }

  // Find the specific card element within the vertical timeline container
  const element = container.querySelector(
    `[data-version-id="${versionId}"]:not(.v-timeline-item)`,
  ) as HTMLElement;

  console.log('Found container:', container);
  console.log('Found element:', element);

  if (element) {
    // Get the actual card element (should be a div with v-card classes)
    const cardElement = (element.closest('.v-card') || element) as HTMLElement;

    // Calculate element's position relative to container
    const elementTop = cardElement.offsetTop;
    const containerHeight = container.clientHeight;
    const elementHeight = cardElement.offsetHeight;

    // Calculate target scroll position to center the element
    const targetScrollTop = elementTop - containerHeight / 2 + elementHeight / 2;

    console.log('Container height:', containerHeight);
    console.log('Element top offset:', elementTop);
    console.log('Element height:', elementHeight);
    console.log('Target scroll position:', targetScrollTop);

    // Scroll to the calculated position
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    });

    // Add a brief highlight effect
    cardElement.classList.add('snapshot-highlight');
    setTimeout(() => {
      cardElement.classList.remove('snapshot-highlight');
    }, 2000);
  } else {
    console.log('No card element found with version ID:', versionId);
    // Debug: Show all elements with data-version-id in the container
    const allElements = container.querySelectorAll('[data-version-id]');
    console.log(
      'All version elements found in container:',
      Array.from(allElements).map((el) => ({
        id: el.getAttribute('data-version-id'),
        tagName: el.tagName,
        classList: Array.from(el.classList),
      })),
    );

    // Fallback: try any element with the version ID in the container
    const fallbackElement = container.querySelector(
      `[data-version-id="${versionId}"]`,
    ) as HTMLElement;
    if (fallbackElement) {
      console.log('Using fallback element');
      fallbackElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }
};

const getSchemaInfo = (schemaId: number) => {
  if (!props.view.metadata.schemas || props.view.metadata.schemas.length === 0) return null;
  return props.view.metadata.schemas.find((schema: any) => schema['schema-id'] === schemaId);
};

const getSchemaChanges = (version: any, index: number): boolean => {
  if (index === versionHistory.length - 1) return false; // Last version, no previous to compare
  const nextVersion = versionHistory[index + 1];
  return version['schema-id'] !== nextVersion['schema-id'];
};

const isFieldNew = (field: any, version: any, index: number): boolean => {
  if (index === versionHistory.length - 1) return false; // Last version, all fields are "original"

  const nextVersion = versionHistory[index + 1];
  const nextSchemaInfo = getSchemaInfo(nextVersion['schema-id']);

  if (!nextSchemaInfo || !nextSchemaInfo.fields) return true;

  // Check if this field existed in the previous schema
  return !nextSchemaInfo.fields.some((prevField: any) => prevField.id === field.id);
};

const getFieldIcon = (field: any): string => {
  const fieldType = getFieldTypeString(field.type);
  if (fieldType.includes('string')) return 'mdi-alphabetical';
  if (fieldType.includes('int')) return 'mdi-numeric';
  if (fieldType.includes('long') || fieldType.includes('double')) return 'mdi-decimal';
  if (fieldType.includes('array') || fieldType.includes('list')) return 'mdi-format-list-group';
  if (fieldType.includes('struct')) return 'mdi-code-braces';
  return 'mdi-pound-box-outline';
};

const getFieldTypeString = (type: any): string => {
  if (typeof type === 'string') return type;
  if (typeof type === 'object') {
    if (type.type === 'struct') return 'struct';
    if (type.type === 'list') return `list<${getFieldTypeString(type.element)}>`;
    if (type.type === 'map')
      return `map<${getFieldTypeString(type.key)}, ${getFieldTypeString(type.value)}>`;
    return type.type || 'unknown';
  }
  return 'unknown';
};

// Initialize version history when component is mounted or view changes
const initializeVersionHistory = () => {
  // Clear existing data
  versionHistory.splice(0, versionHistory.length);

  // Process version history - sort by timestamp descending (newest first)
  if (props.view.metadata.versions) {
    const sortedVersions = [...props.view.metadata.versions].sort((a: any, b: any) => {
      return (b['timestamp-ms'] || 0) - (a['timestamp-ms'] || 0);
    });
    versionHistory.push(...sortedVersions);
  }
};

// Watch for changes in view prop
onMounted(() => {
  initializeVersionHistory();
});

// Re-initialize when view changes
const reinitialize = () => {
  initializeVersionHistory();
};

// Expose reinitialize method for parent component if needed
defineExpose({
  reinitialize,
});
</script>

<style scoped>
.font-mono {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
}

.text-wrap {
  word-wrap: break-word;
  word-break: break-all;
  white-space: pre-wrap;
}

.timeline-bubble-avatar {
  transition: all 0.2s ease;
}

.timeline-bubble-avatar:hover {
  transform: scale(1.1);
}

.snapshot-highlight {
  animation: highlight-pulse 2s ease-in-out;
}

.vertical-timeline-container {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  padding: 8px;
}

.horizontal-timeline-container {
  max-width: 100%;
  scrollbar-width: thin;
}

.horizontal-timeline-container::-webkit-scrollbar {
  height: 6px;
}

.horizontal-timeline-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.horizontal-timeline-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.horizontal-timeline-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

.timeline-item-content {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

@keyframes highlight-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0.1);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}
</style>
