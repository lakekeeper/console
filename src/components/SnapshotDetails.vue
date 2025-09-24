<template>
  <v-card variant="outlined">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-camera-outline</v-icon>
      {{ title || 'Snapshot Details' }}
    </v-card-title>
    <v-divider></v-divider>
    
    <v-card-text v-if="!snapshot" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1">mdi-camera-off-outline</v-icon>
      <div class="text-h6 mt-2 text-grey-lighten-1">No snapshot available</div>
    </v-card-text>

    <v-list v-else density="compact">
      <!-- Snapshot ID -->
      <v-list-item>
        <v-list-item-title>Snapshot ID</v-list-item-title>
        <v-list-item-subtitle class="d-flex align-center">
          <span class="mr-2 font-mono">{{ snapshot['snapshot-id'] }}</span>
          <v-btn
            icon="mdi-content-copy"
            size="small"
            variant="flat"
            @click="copyToClipboard(String(snapshot['snapshot-id']))">
          </v-btn>
        </v-list-item-subtitle>
      </v-list-item>

      <!-- Sequence Number -->
      <v-list-item v-if="snapshot['sequence-number']">
        <v-list-item-title>Sequence Number</v-list-item-title>
        <v-list-item-subtitle>
          {{ snapshot['sequence-number'] }}
        </v-list-item-subtitle>
      </v-list-item>

      <!-- Schema ID -->
      <v-list-item v-if="snapshot['schema-id']">
        <v-list-item-title>Schema ID</v-list-item-title>
        <v-list-item-subtitle>
          {{ snapshot['schema-id'] }}
        </v-list-item-subtitle>
      </v-list-item>

      <!-- Timestamp -->
      <v-list-item v-if="snapshot['timestamp-ms']">
        <v-list-item-title>Timestamp</v-list-item-title>
        <v-list-item-subtitle>
          {{ formatTimestamp(snapshot['timestamp-ms']) }}
        </v-list-item-subtitle>
      </v-list-item>

      <!-- Parent Snapshot -->
      <v-list-item v-if="snapshot['parent-snapshot-id']">
        <v-list-item-title>Parent Snapshot</v-list-item-title>
        <v-list-item-subtitle class="d-flex align-center">
          <span class="mr-2 font-mono">{{ snapshot['parent-snapshot-id'] }}</span>
          <v-btn
            icon="mdi-content-copy"
            size="small"
            variant="flat"
            @click="copyToClipboard(String(snapshot['parent-snapshot-id']))">
          </v-btn>
        </v-list-item-subtitle>
      </v-list-item>

      <!-- Operation -->
      <v-list-item v-if="snapshot.summary?.operation">
        <v-list-item-title>Operation</v-list-item-title>
        <v-list-item-subtitle>
          <v-chip 
            :color="getOperationColor(snapshot.summary.operation)"
            size="small" 
            variant="flat">
            {{ snapshot.summary.operation }}
          </v-chip>
        </v-list-item-subtitle>
      </v-list-item>

      <!-- Manifest List -->
      <v-list-item v-if="snapshot['manifest-list']">
        <v-list-item-title>Manifest List</v-list-item-title>
        <v-list-item-subtitle class="d-flex align-center">
          <span class="mr-2 font-mono text-wrap">
            {{ snapshot['manifest-list'] }}
          </span>
          <v-btn
            icon="mdi-content-copy"
            size="small"
            variant="flat"
            @click="copyToClipboard(snapshot['manifest-list'])">
          </v-btn>
        </v-list-item-subtitle>
      </v-list-item>

      <!-- Summary -->
      <v-list-item v-if="snapshot.summary && showSummary">
        <v-list-item-title class="d-flex align-center justify-space-between">
          <span>Summary</span>
          <v-btn
            :icon="summaryExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            size="small"
            variant="text"
            @click="summaryExpanded = !summaryExpanded">
          </v-btn>
        </v-list-item-title>
        <v-list-item-subtitle>
          <v-expand-transition>
            <div v-show="summaryExpanded">
              <v-row class="mt-2">
                <v-col
                  v-for="(value, key) in snapshot.summary"
                  :key="key"
                  cols="12"
                  md="6">
                  <v-list-item class="pa-2" density="compact" variant="tonal" rounded>
                    <v-list-item-title class="text-caption font-weight-medium">
                      {{ formatSummaryKey(String(key)) }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="font-mono">
                      {{ formatSummaryValue(value) }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-col>
              </v-row>
            </div>
          </v-expand-transition>
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useFunctions } from '../plugins/functions';

// Props
interface Props {
  snapshot?: any;
  title?: string;
  showSummary?: boolean;
}

withDefaults(defineProps<Props>(), {
  showSummary: true
});

// Composables
const functions = useFunctions();

// Reactive state
const summaryExpanded = ref(false);

// Methods
const copyToClipboard = (text: string) => {
  functions.copyToClipboard(text);
};

const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

const formatSummaryKey = (key: string): string => {
  return key
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatSummaryValue = (value: any): string => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  if (typeof value === 'number') {
    // Format large numbers with commas
    if (value >= 1000) {
      return value.toLocaleString();
    }
    return value.toString();
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'string') {
    // Check if it's a timestamp
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return new Date(value).toLocaleString();
    }
    return value;
  }
  
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  
  return String(value);
};

const getOperationColor = (operation: string): string => {
  const operationColors: Record<string, string> = {
    'append': 'success',
    'overwrite': 'warning',
    'delete': 'error',
    'replace': 'primary',
    'merge': 'info',
    'optimize': 'secondary',
    'expire': 'orange',
    'compact': 'teal'
  };
  
  return operationColors[operation?.toLowerCase()] || 'default';
};
</script>

<style scoped>
.font-mono {
  font-family: 'Roboto Mono', monospace;
}
</style>