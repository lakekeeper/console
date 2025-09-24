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
              {{ namespacePath.split(String.fromCharCode(0x1f)).join('.') }}
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
          <v-tab value="branch" @click="loadTabData">branch</v-tab>
          <v-tab
            v-if="enabledAuthentication && enabledPermissions"
            value="permissions"
            @click="loadTabData">
            Permissions
          </v-tab>
          <v-tab value="tasks" @click="loadTabData">tasks</v-tab>
        </v-tabs>
        <v-card style="max-height: 80vh; overflow: auto">
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
                  @click="copyTableJson"
                  prepend-icon="mdi-content-copy">
                  Copy JSON
                </v-btn>
              </div>
              <div style="height: 65vh; overflow: auto">
                <vue-json-pretty
                  :data="table"
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
                              @click="
                                functions.copyToClipboard(table.metadata['table-uuid'])
                              "></v-btn>
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
                              @click="functions.copyToClipboard(table.metadata.location)"></v-btn>
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
                        <v-list-item
                          v-if="table.metadata.schemas && table.metadata.schemas.length > 0">
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

                        <v-list-item
                          v-if="table.metadata.snapshots && table.metadata.snapshots.length > 0">
                          <v-list-item-title>Total Snapshots</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ table.metadata.snapshots.length }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item
                          v-if="
                            table.metadata['partition-specs'] &&
                            table.metadata['partition-specs'].length > 0
                          ">
                          <v-list-item-title>Partition Specs</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ table.metadata['partition-specs'].length }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item
                          v-if="
                            table.metadata['sort-orders'] &&
                            table.metadata['sort-orders'].length > 0
                          ">
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
                <v-row
                  v-if="
                    table.metadata.properties && Object.keys(table.metadata.properties).length > 0
                  ">
                  <v-col cols="12">
                    <v-card variant="outlined" class="mb-4">
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">mdi-cog-outline</v-icon>
                        Table Properties
                      </v-card-title>
                      <v-divider></v-divider>
                      <v-card-text>
                        <v-row>
                          <v-col
                            v-for="(value, key) in table.metadata.properties"
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

                <!-- Current Snapshot Details -->
                <v-row v-if="currentSnapshot">
                  <v-col cols="12">
                    <v-card variant="outlined">
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">mdi-camera-outline</v-icon>
                        Current Snapshot Details
                      </v-card-title>
                      <v-divider></v-divider>
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>Snapshot ID</v-list-item-title>
                          <v-list-item-subtitle class="d-flex align-center">
                            <span class="mr-2 font-mono">{{ currentSnapshot['snapshot-id'] }}</span>
                            <v-btn
                              icon="mdi-content-copy"
                              size="small"
                              variant="flat"
                              @click="
                                functions.copyToClipboard(String(currentSnapshot['snapshot-id']))
                              "></v-btn>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="currentSnapshot['timestamp-ms']">
                          <v-list-item-title>Timestamp</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ formatTimestamp(currentSnapshot['timestamp-ms']) }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="currentSnapshot.summary?.operation">
                          <v-list-item-title>Operation</v-list-item-title>
                          <v-list-item-subtitle>
                            <v-chip size="small" variant="outlined">
                              {{ currentSnapshot.summary.operation }}
                            </v-chip>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="currentSnapshot['manifest-list']">
                          <v-list-item-title>Manifest List</v-list-item-title>
                          <v-list-item-subtitle class="d-flex align-center">
                            <span class="mr-2 font-mono text-wrap">
                              {{ currentSnapshot['manifest-list'] }}
                            </span>
                            <v-btn
                              icon="mdi-content-copy"
                              size="small"
                              variant="flat"
                              @click="
                                functions.copyToClipboard(currentSnapshot['manifest-list'])
                              "></v-btn>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item v-if="currentSnapshot.summary">
                          <v-list-item-title>Summary</v-list-item-title>
                          <v-list-item-subtitle>
                            <v-row>
                              <v-col
                                v-for="(value, key) in currentSnapshot.summary"
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

            <v-tabs-window-item value="branch">
              <BranchVisualization :table="table" :snapshot-history="snapshotHistory" />
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
                v-if="loaded && tableId"
                :warehouse-id="warehouseId"
                :table-id="tableId"
                entity-type="table" />
              <div v-else class="text-center pa-8">
                <v-progress-circular color="info" indeterminate :size="48"></v-progress-circular>
                <div class="text-subtitle-1 mt-2">Loading table information...</div>
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
import { LoadTableResultReadable, StructField } from '../../gen/iceberg/types.gen';
import { TableAction, TableAssignment } from '../../gen/management/types.gen';
import { AssignmentCollection, RelationType } from '../../common/interfaces';
import { useVisualStore } from '../../stores/visual';
import { enabledAuthentication, enabledPermissions } from '@/app.config';
import { StatusIntent } from '@/common/enums';
import BranchVisualization from '@/components/BranchVisualization.vue';
const depthRawRepresentation = ref(3);
const depthRawRepresentationMax = ref(1000);

const recursiveDeleteProtection = ref(false);

const assignStatus = ref(StatusIntent.INACTIVE);

const functions = useFunctions();
const route = useRoute();
const tab = ref('overview');
const namespacePath = ref('');
const loading = ref(true);
const myAccess = reactive<TableAction[]>([]);
const canReadPermissions = ref(false);
const warehouseId = (route.params as { id: string }).id;
const namespaceId = (route.params as { nsid: string }).nsid;
const tableName = (route.params as { tid: string }).tid;
const tableId = ref('');
const table = reactive<LoadTableResultReadable>({
  metadata: {
    'format-version': 0,
    'table-uuid': '',
  },
});
const permissionType = ref<RelationType>('table');
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

interface TreeItem {
  id: number;
  title: string;
  datatype: string;
  required: boolean;
  children?: TreeItem[];
}

const schemaFields = reactive<StructField[]>([]);
const schemaFieldsTransformed = reactive<TreeItem[]>([]);
const currentSchema = ref(0);
const existingPermissions = reactive<TableAssignment[]>([]);
const loaded = ref(false);
const snapshotHistory = reactive<any[]>([]);

async function init() {
  loaded.value = false;
  const serverInfo = await functions.getServerInfo();

  namespacePath.value = `${namespaceId}${String.fromCharCode(0x1f)}${tableName}`;
  Object.assign(table, await functions.loadTableCustomized(warehouseId, namespaceId, tableName));

  tableId.value = table.metadata['table-uuid'];
  currentSchema.value = table.metadata['current-schema-id'] || 0;

  permissionObject.id = tableId.value;
  permissionObject.name = tableName;
  if (serverInfo['authz-backend'] != 'allow-all') {
    Object.assign(myAccess, await functions.getTableAccessById(tableId.value, warehouseId));
    await getProtection();
    canReadPermissions.value = !!myAccess.includes('read_assignments');

    existingPermissions.splice(0, existingPermissions.length);
    Object.assign(
      existingPermissions,
      canReadPermissions.value
        ? await functions.getTableAssignmentsById(tableId.value, warehouseId)
        : [],
    );
  }
  loaded.value = true;

  schemaFields.splice(0, schemaFields.length);
  if (table.metadata.schemas) {
    table.metadata.schemas.forEach((schema) => {
      if (schema['schema-id'] === currentSchema.value) {
        for (const field of schema.fields) {
          schemaFields.push(field);
        }
        schemaFieldsTransformed.splice(0, schemaFieldsTransformed.length);
        schemaFieldsTransformed.push(...transformFields(schemaFields));
      }
    });
  }

  // Process snapshot history - sort by timestamp descending (newest first)
  snapshotHistory.splice(0, snapshotHistory.length);
  if (table.metadata.snapshots) {
    const sortedSnapshots = [...table.metadata.snapshots].sort((a, b) => {
      return (b['timestamp-ms'] || 0) - (a['timestamp-ms'] || 0);
    });
    snapshotHistory.push(...sortedSnapshots);
  }

  depthRawRepresentationMax.value = getMaxDepth(table);
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

function isStructType(type: any): type is { type: 'struct'; fields: StructField[] } {
  return type && type.type === 'struct' && Array.isArray(type.fields);
}

function isListType(type: any): type is { type: 'list'; element: any } {
  return type && type.type === 'list' && type.element;
}

function transformFields(fields: StructField[]): TreeItem[] {
  return fields.map((field) => {
    let title = field.name;
    let datatype = typeof field.type === 'string' ? field.type : '';

    if (typeof field.type === 'object') {
      if (isStructType(field.type)) {
        datatype = 'struct';
      } else if (isListType(field.type)) {
        datatype = 'array';
      }
    }
    title = `${title} (${datatype})`;

    const item: TreeItem = {
      id: field.id,
      title,
      datatype,
      required: field.required,
    };

    if (typeof field.type === 'object') {
      if (isStructType(field.type)) {
        item.children = transformFields(field.type.fields);
      } else if (isListType(field.type) && isStructType(field.type.element)) {
        item.children = transformFields(field.type.element.fields);
      }
    }

    return item;
  });
}

async function assign(permissions: { del: AssignmentCollection; writes: AssignmentCollection }) {
  try {
    loaded.value = false;
    assignStatus.value = StatusIntent.STARTING;
    const del = permissions.del as TableAssignment[];
    const writes = permissions.writes as TableAssignment[];

    await functions.updateTableAssignmentsById(tableId.value, del, writes, warehouseId);
    assignStatus.value = StatusIntent.SUCCESS;
    loaded.value = true;
    await init();
  } catch (error) {
    console.error(error);

    assignStatus.value = StatusIntent.FAILURE;

    await init();
  }
}

async function loadTabData() {
  await init();
}

async function getProtection() {
  try {
    recursiveDeleteProtection.value = (
      await functions.getTableProtection(warehouseId, tableId.value)
    ).protected;
  } catch (error) {
    console.error(error);
  }
}

async function setProtection() {
  try {
    await functions.setTableProtection(
      warehouseId,
      tableId.value,
      !recursiveDeleteProtection.value,
    );
    await getProtection();
  } catch (error) {
    console.error(error);
  }
}

// Helper functions for details tab
function formatTimestamp(timestampMs: number): string {
  if (!timestampMs) return '';
  const date = new Date(timestampMs);
  return date.toLocaleString();
}

function getCurrentSchema() {
  if (!table.metadata.schemas || table.metadata.schemas.length === 0) return null;
  return table.metadata.schemas.find((schema) => schema['schema-id'] === currentSchema.value);
}

function getCurrentSnapshot() {
  if (!table.metadata.snapshots || table.metadata.snapshots.length === 0) return null;
  return table.metadata.snapshots.find(
    (snapshot) => snapshot['snapshot-id'] === table.metadata['current-snapshot-id'],
  );
}

function copyTableJson() {
  try {
    const jsonString = JSON.stringify(table, null, 2);
    functions.copyToClipboard(jsonString);
  } catch (error) {
    console.error('Failed to copy table JSON:', error);
  }
}

// Computed properties for safe access
const currentSnapshot = computed(() => getCurrentSnapshot());
const currentSchemaInfo = computed(() => getCurrentSchema());
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
</style>
