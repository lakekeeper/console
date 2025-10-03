<template>
  <v-card-text>
    <v-row>
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-information-outline</v-icon>
            Table Information
          </v-card-title>
          <v-divider></v-divider>
          <v-list density="compact">
            <v-list-item>
              <v-list-item-title>Table UUID</v-list-item-title>
              <v-list-item-subtitle class="d-flex align-center">
                <span class="mr-2 font-mono">{{ table.metadata['table-uuid'] }}</span>
                <v-btn
                  icon="mdi-content-copy"
                  size="small"
                  variant="flat"
                  @click="copyToClipboard(table.metadata['table-uuid'])"></v-btn>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>Format Version</v-list-item-title>
              <v-list-item-subtitle>
                {{ table.metadata['format-version'] }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="table.metadata.location">
              <v-list-item-title>Location</v-list-item-title>
              <v-list-item-subtitle class="d-flex align-center">
                <span class="mr-2 font-mono text-wrap">
                  {{ table.metadata.location }}
                </span>
                <v-btn
                  icon="mdi-content-copy"
                  size="small"
                  variant="flat"
                  @click="copyToClipboard(table.metadata.location)"></v-btn>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="table.metadata['last-updated-ms']">
              <v-list-item-title>Last Updated</v-list-item-title>
              <v-list-item-subtitle>
                {{ formatTimestamp(table.metadata['last-updated-ms']) }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="table.metadata['current-schema-id']">
              <v-list-item-title>Current Schema ID</v-list-item-title>
              <v-list-item-subtitle>
                {{ table.metadata['current-schema-id'] }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="table.metadata['current-snapshot-id']">
              <v-list-item-title>Current Snapshot ID</v-list-item-title>
              <v-list-item-subtitle class="font-mono">
                {{ table.metadata['current-snapshot-id'] }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-table-cog</v-icon>
            Schema Information
          </v-card-title>
          <v-divider></v-divider>
          <v-list density="compact">
            <v-list-item v-if="table.metadata.schemas && table.metadata.schemas.length > 0">
              <v-list-item-title>Total Schemas</v-list-item-title>
              <v-list-item-subtitle>
                {{ table.metadata.schemas.length }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="currentSchemaInfo">
              <v-list-item-title>Current Schema Fields</v-list-item-title>
              <v-list-item-subtitle>
                {{ currentSchemaInfo?.fields?.length || 0 }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="table.metadata.snapshots && table.metadata.snapshots.length > 0">
              <v-list-item-title>Total Snapshots</v-list-item-title>
              <v-list-item-subtitle>
                {{ table.metadata.snapshots.length }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item
              v-if="
                table.metadata['partition-specs'] && table.metadata['partition-specs'].length > 0
              ">
              <v-list-item-title>Partition Specs</v-list-item-title>
              <v-list-item-subtitle>
                {{ table.metadata['partition-specs'].length }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item
              v-if="table.metadata['sort-orders'] && table.metadata['sort-orders'].length > 0">
              <v-list-item-title>Sort Orders</v-list-item-title>
              <v-list-item-subtitle>
                {{ table.metadata['sort-orders'].length }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Properties Section -->
    <v-row v-if="table.metadata.properties && Object.keys(table.metadata.properties).length > 0">
      <v-col cols="12">
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-cog-outline</v-icon>
            Table Properties
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-row>
              <v-col v-for="(value, key) in table.metadata.properties" :key="key" cols="12" md="6">
                <v-list-item class="pa-0">
                  <v-list-item-title class="text-body-2 font-weight-medium">
                    {{ key }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="font-mono text-wrap">
                    {{ value }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Schema Tree View Section -->
    <v-row>
      <v-col cols="12">
        <v-expansion-panels class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-file-tree</v-icon>
                Schema Fields
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-treeview :items="schemaFieldsTransformed" open-on-click>
                <template #prepend="{ item }">
                  <v-icon v-if="item.datatype == 'string'" size="small">mdi-alphabetical</v-icon>
                  <v-icon v-else-if="item.datatype == 'int'" size="small">mdi-numeric</v-icon>
                  <v-icon
                    v-else-if="item.datatype == 'long' || item.datatype == 'double'"
                    size="small">
                    mdi-decimal
                  </v-icon>
                  <v-icon v-else-if="item.datatype == 'array'" size="small">
                    mdi-format-list-group
                  </v-icon>
                  <v-icon v-else size="small">mdi-pound-box-outline</v-icon>
                </template>
                <template #append="{ item }">
                  <span>
                    <span v-if="item.required" style="font-size: 0.575rem">required</span>
                    <v-icon v-if="item.required" color="error" size="x-small">mdi-asterisk</v-icon>
                  </span>
                </template>
              </v-treeview>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

    <!-- Current Snapshot Details -->
    <v-row v-if="currentSnapshot">
      <v-col cols="12">
        <TableSnapshotDetails :snapshot="currentSnapshot" title="Current Snapshot Details" />
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFunctions } from '../plugins/functions';
import TableSnapshotDetails from './TableSnapshotDetails.vue';
import { transformFields } from '../common/schemaUtils';
import type { LoadTableResultReadable, Snapshot } from '../gen/iceberg/types.gen';

// Props
interface Props {
  table: LoadTableResultReadable;
}

const props = defineProps<Props>();

// Composables
const functions = useFunctions();

// Methods
const copyToClipboard = (text: string) => {
  functions.copyToClipboard(text);
};

const formatTimestamp = (timestampMs: number): string => {
  if (!timestampMs) return '';
  const date = new Date(timestampMs);
  return date.toLocaleString();
};

const getCurrentSchema = () => {
  if (!props.table.metadata.schemas || props.table.metadata.schemas.length === 0) return null;
  return props.table.metadata.schemas.find(
    (schema) => schema['schema-id'] === props.table.metadata['current-schema-id'],
  );
};

const getCurrentSnapshot = (): Snapshot | null => {
  if (!props.table.metadata.snapshots || props.table.metadata.snapshots.length === 0) return null;
  return (
    props.table.metadata.snapshots.find(
      (snapshot: Snapshot) =>
        snapshot['snapshot-id'] === props.table.metadata['current-snapshot-id'],
    ) || null
  );
};

// Computed properties
const currentSnapshot = computed(() => getCurrentSnapshot());
const currentSchemaInfo = computed(() => getCurrentSchema());

const schemaFieldsTransformed = computed(() => {
  if (!currentSchemaInfo.value?.fields) return [];
  return transformFields(currentSchemaInfo.value.fields);
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
</style>
