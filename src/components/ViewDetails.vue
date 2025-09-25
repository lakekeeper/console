<template>
  <v-card-text>
    <v-row>
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-information-outline</v-icon>
            View Information
          </v-card-title>
          <v-divider></v-divider>
          <v-list density="compact">
            <v-list-item>
              <v-list-item-title>View UUID</v-list-item-title>
              <v-list-item-subtitle class="d-flex align-center">
                <span class="mr-2 font-mono">{{ view.metadata['view-uuid'] }}</span>
                <v-btn
                  icon="mdi-content-copy"
                  size="small"
                  variant="flat"
                  @click="copyToClipboard(view.metadata['view-uuid'])"></v-btn>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>Format Version</v-list-item-title>
              <v-list-item-subtitle>
                {{ view.metadata['format-version'] }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="view.metadata.location">
              <v-list-item-title>Location</v-list-item-title>
              <v-list-item-subtitle class="d-flex align-center">
                <span class="mr-2 font-mono text-wrap">
                  {{ view.metadata.location }}
                </span>
                <v-btn
                  icon="mdi-content-copy"
                  size="small"
                  variant="flat"
                  @click="copyToClipboard(view.metadata.location)"></v-btn>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="view['metadata-location']">
              <v-list-item-title>Metadata Location</v-list-item-title>
              <v-list-item-subtitle class="d-flex align-center">
                <span class="mr-2 font-mono text-wrap">
                  {{ view['metadata-location'] }}
                </span>
                <v-btn
                  icon="mdi-content-copy"
                  size="small"
                  variant="flat"
                  @click="copyToClipboard(view['metadata-location'])"></v-btn>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="view.metadata['current-version-id']">
              <v-list-item-title>Current Version ID</v-list-item-title>
              <v-list-item-subtitle class="font-mono">
                {{ view.metadata['current-version-id'] }}
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
            <v-list-item v-if="view.metadata.schemas && view.metadata.schemas.length > 0">
              <v-list-item-title>Total Schemas</v-list-item-title>
              <v-list-item-subtitle>
                {{ view.metadata.schemas.length }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="currentSchemaInfo">
              <v-list-item-title>Current Schema Fields</v-list-item-title>
              <v-list-item-subtitle>
                {{ currentSchemaInfo?.fields?.length || 0 }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="view.metadata.versions && view.metadata.versions.length > 0">
              <v-list-item-title>Total Versions</v-list-item-title>
              <v-list-item-subtitle>
                {{ view.metadata.versions.length }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="currentViewVersion">
              <v-list-item-title>Current Schema ID</v-list-item-title>
              <v-list-item-subtitle>
                {{ currentViewVersion['schema-id'] }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Properties Section -->
    <v-row v-if="view.metadata.properties && Object.keys(view.metadata.properties).length > 0">
      <v-col cols="12">
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-cog-outline</v-icon>
            View Properties
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-row>
              <v-col v-for="(value, key) in view.metadata.properties" :key="key" cols="12" md="6">
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
    <v-row v-if="currentSchemaInfo?.fields && currentSchemaInfo.fields.length > 0">
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

    <!-- Current Version Details -->
    <v-row v-if="currentViewVersion">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-eye-outline</v-icon>
            Current Version Details
          </v-card-title>
          <v-divider></v-divider>
          <v-list density="compact">
            <v-list-item>
              <v-list-item-title>Version ID</v-list-item-title>
              <v-list-item-subtitle class="d-flex align-center">
                <span class="mr-2 font-mono">
                  {{ currentViewVersion['version-id'] }}
                </span>
                <v-btn
                  icon="mdi-content-copy"
                  size="small"
                  variant="flat"
                  @click="copyToClipboard(String(currentViewVersion['version-id']))"></v-btn>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="currentViewVersion['timestamp-ms']">
              <v-list-item-title>Created</v-list-item-title>
              <v-list-item-subtitle>
                {{ formatTimestamp(currentViewVersion['timestamp-ms']) }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item
              v-if="currentViewVersion.representations && currentViewVersion.representations[0]">
              <v-list-item-title>SQL Query</v-list-item-title>
              <v-list-item-subtitle class="d-flex align-center">
                <span class="mr-2 font-mono text-wrap">
                  {{ currentViewVersion.representations[0].sql }}
                </span>
                <v-btn
                  icon="mdi-content-copy"
                  size="small"
                  variant="flat"
                  @click="copyToClipboard(currentViewVersion.representations[0].sql)"></v-btn>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="currentViewVersion.summary">
              <v-list-item-title>Summary</v-list-item-title>
              <v-list-item-subtitle>
                <v-row>
                  <v-col
                    v-for="(value, key) in currentViewVersion.summary"
                    :key="key"
                    cols="12"
                    md="6">
                    <v-list-item class="pa-0" density="compact">
                      <v-list-item-title class="text-caption">
                        {{ key }}
                      </v-list-item-title>
                      <v-list-item-subtitle class="font-mono">
                        {{ value }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                </v-row>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFunctions } from '../plugins/functions';
import { transformFields } from '../common/schemaUtils';
import type { LoadViewResultReadable } from '../gen/iceberg/types.gen';

// Props
interface Props {
  view: LoadViewResultReadable;
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

const getCurrentViewVersion = () => {
  if (!props.view.metadata.versions || props.view.metadata.versions.length === 0) return null;
  return props.view.metadata.versions.find(
    (version: any) => version['version-id'] === props.view.metadata['current-version-id'],
  );
};

const getCurrentViewSchema = () => {
  if (!props.view.metadata.schemas || props.view.metadata.schemas.length === 0) return null;
  const currentVersion = getCurrentViewVersion();
  if (!currentVersion) return null;
  return props.view.metadata.schemas.find(
    (schema: any) => schema['schema-id'] === currentVersion['schema-id'],
  );
};

// Computed properties
const currentViewVersion = computed(() => getCurrentViewVersion());
const currentSchemaInfo = computed(() => getCurrentViewSchema());

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
