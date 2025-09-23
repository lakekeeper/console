<template>
  <v-container v-if="loading" class="fill-height">
    <v-responsive class="align-centerfill-height mx-auto" max-width="900">
      <v-row justify="center">
        <v-progress-circular
          class="mt-4"
          color="info"
          indeterminate
          :size="126"></v-progress-circular>
      </v-row>
    </v-responsive>
  </v-container>
  <span v-else>
    <v-row class="ml-1">
      <v-col>
        <BreadcrumbsFromUrl />
        <v-toolbar class="mb-4" color="transparent" density="compact" flat>
          <v-toolbar-title>
            <span class="text-subtitle-1">
              {{ namespaceId.split(String.fromCharCode(0x1f)).join('.') }}.{{ viewName }}
            </span>
          </v-toolbar-title>
          <template #prepend>
            <v-icon>mdi-table</v-icon>
          </template>
        </v-toolbar>
        <v-tabs v-model="tab">
          <v-tab value="overview" @click="loadTabData">overview</v-tab>
          <v-tab value="raw" @click="loadTabData">raw</v-tab>
          <v-tab value="details" @click="loadTabData">details</v-tab>
          <v-tab value="history" @click="loadTabData">history</v-tab>
          <v-tab
            v-if="enabledAuthentication && enabledPermissions"
            value="permissions"
            @click="loadTabData">
            Permissions
          </v-tab>
          <v-tab value="tasks" @click="loadTabData">tasks</v-tab>
        </v-tabs>
        <v-card style="max-height: 80vh; overflow: auto; min-height: 55vh">
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="overview">
              <v-toolbar color="transparent" density="compact" flat>
                <v-switch
                  v-model="recursiveDeleteProtection"
                  class="ml-4 mt-4"
                  color="info"
                  :label="
                    recursiveDeleteProtection
                      ? 'Recursive Delete Protection enabled'
                      : 'Recursive Delete Protection disabled'
                  "
                  @click="setProtection"></v-switch>
              </v-toolbar>
              <v-card-text>
                <v-row>
                  <v-col>
                    View SQL Statement:
                    <pre
                      class="language-sql"><code ref="codeRef" class="language-sql">{{ sqlStatement }}</code></pre>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-tabs-window-item>
            <v-tabs-window-item value="raw">
              <div class="mb-4 mt-4">
                <v-btn
                  size="small"
                  variant="outlined"
                  color="info"
                  class="mr-8 ml-4"
                  @click="depthRawRepresentation = 1"
                  append-icon="mdi-collapse-all">
                  Collapse
                </v-btn>
                <v-btn
                  size="small"
                  variant="outlined"
                  color="success"
                  class="mr-8"
                  @click="depthRawRepresentation = depthRawRepresentationMax"
                  append-icon="mdi-expand-all">
                  Expand
                </v-btn>
                <v-btn
                  size="small"
                  variant="outlined"
                  color="primary"
                  @click="copyViewJson"
                  prepend-icon="mdi-content-copy">
                  Copy JSON
                </v-btn>
              </div>
              <div style="height: 65vh; overflow: auto">
                <vue-json-pretty
                  :data="view"
                  :deep="depthRawRepresentation"
                  :theme="themeText"
                  :showLineNumber="true"
                  :virtual="false" />
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="details">
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
                              @click="
                                functions.copyToClipboard(view.metadata['view-uuid'])
                              "></v-btn>
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
                              @click="functions.copyToClipboard(view.metadata.location)"></v-btn>
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
                              @click="functions.copyToClipboard(view['metadata-location'])"></v-btn>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="view.metadata['current-version-id']">
                          <v-list-item-title>Current Version ID</v-list-item-title>
                          <v-list-item-subtitle>
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
                        <v-list-item
                          v-if="view.metadata.schemas && view.metadata.schemas.length > 0">
                          <v-list-item-title>Total Schemas</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ view.metadata.schemas.length }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="currentViewSchema">
                          <v-list-item-title>Current Schema Fields</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ currentViewSchema?.fields?.length || 0 }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item
                          v-if="view.metadata.versions && view.metadata.versions.length > 0">
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
                <v-row
                  v-if="
                    view.metadata.properties && Object.keys(view.metadata.properties).length > 0
                  ">
                  <v-col cols="12">
                    <v-card variant="outlined" class="mb-4">
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">mdi-cog-outline</v-icon>
                        View Properties
                      </v-card-title>
                      <v-divider></v-divider>
                      <v-card-text>
                        <v-row>
                          <v-col
                            v-for="(value, key) in view.metadata.properties"
                            :key="key"
                            cols="12"
                            md="6">
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
                              @click="
                                functions.copyToClipboard(String(currentViewVersion['version-id']))
                              "></v-btn>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="currentViewVersion['timestamp-ms']">
                          <v-list-item-title>Created</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ formatTimestamp(currentViewVersion['timestamp-ms']) }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item
                          v-if="
                            currentViewVersion.representations &&
                            currentViewVersion.representations[0]
                          ">
                          <v-list-item-title>SQL Query</v-list-item-title>
                          <v-list-item-subtitle class="d-flex align-center">
                            <span class="mr-2 font-mono text-wrap">
                              {{ currentViewVersion.representations[0].sql }}
                            </span>
                            <v-btn
                              icon="mdi-content-copy"
                              size="small"
                              variant="flat"
                              @click="
                                functions.copyToClipboard(currentViewVersion.representations[0].sql)
                              "></v-btn>
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
            </v-tabs-window-item>

            <v-tabs-window-item value="history">
              <v-card-text>
                <div class="d-flex align-center mb-4">
                  <v-icon class="mr-2">mdi-history</v-icon>
                  <span class="text-h6">View Evolution History</span>
                </div>

                <div v-if="versionHistory.length === 0" class="text-center pa-8">
                  <v-icon size="64" color="grey">mdi-eye-off-outline</v-icon>
                  <div class="text-subtitle-1 mt-2">No versions found</div>
                  <div class="text-body-2 text-medium-emphasis">
                    This view has no version history
                  </div>
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
                                  <v-icon
                                    v-bind="props"
                                    :size="index === 0 ? 16 : 14"
                                    color="white">
                                    {{ index === 0 ? 'mdi-check-circle' : 'mdi-eye' }}
                                  </v-icon>
                                </template>
                                {{ event.version['version-id'] }}
                              </v-tooltip>
                            </div>
                            <div
                              v-else-if="event.type === 'schema-change'"
                              style="
                                display: flex;
                                align-items: center;
                                justify-content: center;
                              ">
                              <v-tooltip location="top">
                                <template #activator="{ props }">
                                  <v-icon v-bind="props" size="12" color="white">
                                    mdi-table-cog
                                  </v-icon>
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
                                <v-chip
                                  size="x-small"
                                  color="primary"
                                  variant="flat"
                                  class="text-caption">
                                  {{ event.version.summary['engine-name'] }}
                                </v-chip>
                              </div>
                            </div>
                            <div v-else-if="event.type === 'schema-change'">
                              <div class="text-caption mb-1" style="color: #fb8c00">
                                Schema Change
                              </div>
                              <v-chip
                                size="x-small"
                                color="warning"
                                variant="flat"
                                class="text-caption">
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
                  <v-timeline
                    v-if="versionHistory.length > 0"
                    side="end"
                    density="compact"
                    class="pa-0">
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

                      <v-card
                        variant="outlined"
                        class="mb-4"
                        :data-version-id="version['version-id']">
                        <v-card-title class="d-flex align-center justify-space-between">
                          <div class="d-flex align-center">
                            <v-chip
                              v-if="index === 0"
                              size="small"
                              color="success"
                              variant="flat"
                              class="mr-2">
                              Current
                            </v-chip>
                            <span class="font-mono">Version {{ version['version-id'] }}</span>
                          </div>
                          <v-btn
                            icon="mdi-content-copy"
                            size="small"
                            variant="flat"
                            @click="functions.copyToClipboard(String(version['version-id']))"></v-btn>
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
                                      @click="functions.copyToClipboard(version.representations[0].sql)"></v-btn>
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
                                      <strong>Engine:</strong> {{ version.summary['engine-name'] }}
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
                                    }} fields)
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
            </v-tabs-window-item>

            <v-tabs-window-item v-if="canReadPermissions" value="permissions">
              <PermissionManager
                v-if="loaded"
                :status="assignStatus"
                :assignable-obj="permissionObject"
                :existing-permissions-from-obj="existingPermissions"
                :relation-type="permissionType"
                @permissions="assign" />
            </v-tabs-window-item>
            <v-tabs-window-item value="tasks">
              <TaskManager
                v-if="loaded && viewId"
                :warehouse-id="warehouseId"
                :table-id="viewId"
                entity-type="table" />
              <div v-else class="text-center pa-8">
                <v-progress-circular color="info" indeterminate :size="48"></v-progress-circular>
                <div class="text-subtitle-1 mt-2">Loading view information...</div>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </v-col>
    </v-row>
  </span>
</template>
<script lang="ts" setup>
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import { onMounted, reactive, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useFunctions } from '../../plugins/functions';
import TaskManager from '../../components/TaskManager.vue';
import { LoadViewResultReadable } from '../../gen/iceberg/types.gen';
import { TableAction, ViewAssignment } from '../../gen/management/types.gen';
import { AssignmentCollection, RelationType } from '../../common/interfaces';
import { useVisualStore } from '../../stores/visual';
import { enabledAuthentication, enabledPermissions } from '@/app.config';
import { StatusIntent } from '@/common/enums';

const functions = useFunctions();
const route = useRoute();
const tab = ref('overview');
const crumbPath = ref('');
const loading = ref(true);
const assignStatus = ref(StatusIntent.INACTIVE);

const depthRawRepresentation = ref(3);
const depthRawRepresentationMax = ref(1000);

const myAccess = reactive<TableAction[]>([]);

const permissionType = ref<RelationType>('view');

const permissionObject = reactive<any>({
  id: '',
  description: '',
  name: '',
});

const visual = useVisualStore();
const themeLight = computed(() => {
  return visual.themeLight;
});

const themeText = computed(() => {
  return themeLight.value ? 'light' : 'dark';
});

const warehouseId = (route.params as { id: string }).id;
const namespaceId = (route.params as { nsid: string }).nsid;
const viewName = (route.params as { vid: string }).vid;
const viewId = ref('');
const view = reactive<LoadViewResultReadable>({
  'metadata-location': '',
  metadata: {
    'view-uuid': '',
    'format-version': 0,
    location: '',
    'current-version-id': 0,
    versions: [],
    'version-log': [],
    schemas: [],
  },
});
const loaded = ref(false);
const existingPermissions = reactive<ViewAssignment[]>([]);
const canReadPermissions = ref(false);
const recursiveDeleteProtection = ref(false);

const currentVersionId = ref(0);
const sqlStatement = ref('');
async function loadTabData() {
  await init();
}

async function init() {
  const serverInfo = await functions.getServerInfo();

  loaded.value = false;
  existingPermissions.splice(0, existingPermissions.length);

  crumbPath.value = `${namespaceId}${String.fromCharCode(0x1f)}${viewName}`;

  Object.assign(view, await functions.loadView(warehouseId, namespaceId, viewName));

  viewId.value = view.metadata['view-uuid'];
  currentVersionId.value = view.metadata['current-version-id'] || 0;
  view.metadata.versions.forEach((version) => {
    if (version['version-id'] === currentVersionId.value) {
      sqlStatement.value = version.representations[0].sql;
    }
  });
  permissionObject.id = viewId.value;
  permissionObject.name = viewName;
  if (serverInfo['authz-backend'] != 'allow-all') {
    Object.assign(myAccess, await functions.getViewAccessById(viewId.value, warehouseId));
    await getProtection();

    canReadPermissions.value = !!myAccess.includes('read_assignments');

    Object.assign(
      existingPermissions,
      canReadPermissions.value
        ? await functions.getViewAssignmentsById(viewId.value, warehouseId)
        : [],
    );
  }

  depthRawRepresentationMax.value = getMaxDepth(view);
  
  // Process version history - sort by timestamp descending (newest first)
  versionHistory.splice(0, versionHistory.length);
  if (view.metadata.versions) {
    const sortedVersions = [...view.metadata.versions].sort((a, b) => {
      return (b['timestamp-ms'] || 0) - (a['timestamp-ms'] || 0);
    });
    versionHistory.push(...sortedVersions);
  }
  
  loaded.value = true;
}

onMounted(async () => {
  await init();
  loading.value = false;
});

function getMaxDepth(obj: any): number {
  let maxDepth = 0;

  function findDepth(obj: any, depth: number) {
    if (typeof obj === 'object' && obj !== null) {
      depth++;
      if (depth > maxDepth) {
        maxDepth = depth;
      }
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          findDepth(obj[key], depth);
        }
      }
    }
  }

  findDepth(obj, 0);
  return maxDepth;
}

async function assign(permissions: { del: AssignmentCollection; writes: AssignmentCollection }) {
  try {
    loaded.value = false;
    assignStatus.value = StatusIntent.STARTING;
    const del = permissions.del as ViewAssignment[];
    const writes = permissions.writes as ViewAssignment[];

    await functions.updateViewAssignmentsById(viewId.value, del, writes, warehouseId);
    assignStatus.value = StatusIntent.SUCCESS;
    loaded.value = true;
    await init();
  } catch (error) {
    assignStatus.value = StatusIntent.FAILURE;
    console.error(error);

    await init();
  }
}

async function getProtection() {
  try {
    recursiveDeleteProtection.value = (
      await functions.getViewProtection(warehouseId, viewId.value)
    ).protected;
  } catch (error) {
    console.error(error);
  }
}

async function setProtection() {
  try {
    await functions.setViewProtection(warehouseId, viewId.value, !recursiveDeleteProtection.value);
    await getProtection();
  } catch (error) {
    console.error(error);
  }
}

function copyViewJson() {
  try {
    const jsonString = JSON.stringify(view, null, 2);
    functions.copyToClipboard(jsonString);
  } catch (error) {
    console.error('Failed to copy view JSON:', error);
  }
}

// Helper functions for details tab
function formatTimestamp(timestampMs: number): string {
  if (!timestampMs) return '';
  const date = new Date(timestampMs);
  return date.toLocaleString();
}

function getCurrentViewVersion() {
  if (!view.metadata.versions || view.metadata.versions.length === 0) return null;
  return view.metadata.versions.find(
    (version) => version['version-id'] === view.metadata['current-version-id'],
  );
}

function getCurrentViewSchema() {
  if (!view.metadata.schemas || view.metadata.schemas.length === 0) return null;
  const currentVersion = getCurrentViewVersion();
  if (!currentVersion) return null;
  return view.metadata.schemas.find(
    (schema) => schema['schema-id'] === currentVersion['schema-id'],
  );
}

// Computed properties for safe access
const currentViewVersion = computed(() => getCurrentViewVersion());
const currentViewSchema = computed(() => getCurrentViewSchema());

// Version history computed properties and functions
const versionHistory = reactive<any[]>([]);

// Create timeline events that include both versions and schema changes
const timelineEvents = computed(() => {
  const events: Array<{
    type: 'version' | 'schema-change';
    version?: any;
    schemaId?: number;
    timestampMs: number;
    id: string;
  }> = [];

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

function isInitialVersion(version: any): boolean {
  if (!versionHistory.length) return false;
  // The initial version is the one with the earliest timestamp (last in the sorted array)
  const oldestVersion = versionHistory[versionHistory.length - 1];
  return version['version-id'] === oldestVersion['version-id'];
}

function scrollToVersion(versionId: number) {
  console.log('Scrolling to version:', versionId);

  // Find the container first
  const container = document.querySelector('.vertical-timeline-container') as HTMLElement;

  if (!container) {
    console.log('Vertical timeline container not found');
    return;
  }

  // Find the specific card element within the vertical timeline container
  const element = container.querySelector(`[data-version-id="${versionId}"]:not(.v-timeline-item)`) as HTMLElement;

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
        classList: Array.from(el.classList)
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
}

function formatTimelineDate(timestampMs: number): string {
  if (!timestampMs) return '';
  const date = new Date(timestampMs);
  return (
    date.toLocaleDateString() +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
}

// Helper functions for history tab
function getSchemaInfo(schemaId: number) {
  if (!view.metadata.schemas || view.metadata.schemas.length === 0) return null;
  return view.metadata.schemas.find((schema) => schema['schema-id'] === schemaId);
}

function getSchemaChanges(version: any, index: number): boolean {
  if (index === versionHistory.length - 1) return false; // Last version, no previous to compare
  const nextVersion = versionHistory[index + 1];
  return version['schema-id'] !== nextVersion['schema-id'];
}

function isFieldNew(field: any, version: any, index: number): boolean {
  if (index === versionHistory.length - 1) return false; // Last version, all fields are "original"

  const nextVersion = versionHistory[index + 1];
  const nextSchemaInfo = getSchemaInfo(nextVersion['schema-id']);

  if (!nextSchemaInfo || !nextSchemaInfo.fields) return true;

  // Check if this field existed in the previous schema
  return !nextSchemaInfo.fields.some((prevField: any) => prevField.id === field.id);
}

function getFieldIcon(field: any): string {
  const fieldType = getFieldTypeString(field.type);
  if (fieldType.includes('string')) return 'mdi-alphabetical';
  if (fieldType.includes('int')) return 'mdi-numeric';
  if (fieldType.includes('long') || fieldType.includes('double')) return 'mdi-decimal';
  if (fieldType.includes('array') || fieldType.includes('list')) return 'mdi-format-list-group';
  if (fieldType.includes('struct')) return 'mdi-code-braces';
  return 'mdi-pound-box-outline';
}

function getFieldTypeString(type: any): string {
  if (typeof type === 'string') return type;
  if (typeof type === 'object') {
    if (type.type === 'struct') return 'struct';
    if (type.type === 'list') return `list<${getFieldTypeString(type.element)}>`;
    if (type.type === 'map')
      return `map<${getFieldTypeString(type.key)}, ${getFieldTypeString(type.value)}>`;
    return type.type || 'unknown';
  }
  return 'unknown';
}
</script>

<style scoped>
.pointer-cursor {
  cursor: pointer;
}

.icon-text {
  display: flex;
  align-items: center;
}

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
