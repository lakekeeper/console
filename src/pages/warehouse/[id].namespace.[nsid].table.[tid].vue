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
          <v-tab
            v-if="enabledAuthentication && enabledPermissions"
            value="permissions"
            @click="loadTabData">
            Permissions
          </v-tab>
        </v-tabs>
        <v-card style="max-height: 75vh; overflow: auto">
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
                  @click="depthRawRepresentation = depthRawRepresentationMax"
                  append-icon="mdi-expand-all">
                  Expand
                </v-btn>
              </div>
              <vue-json-pretty
                :data="table"
                :deep="depthRawRepresentation"
                :theme="themeText"
                :showLineNumber="true"
                :virtual="true" />
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
import { LoadTableResultReadable, StructField } from '../../gen/iceberg/types.gen';
import { TableAction, TableAssignment } from '../../gen/management/types.gen';
import { AssignmentCollection, RelationType } from '../../common/interfaces';
import { useVisualStore } from '../../stores/visual';
import { enabledAuthentication, enabledPermissions } from '@/app.config';
import { StatusIntent } from '@/common/enums';
const depthRawRepresentation = ref(1);
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
    Object.assign(myAccess, await functions.getTableAccessById(tableId.value));
    await getProtection();
    canReadPermissions.value = !!myAccess.includes('read_assignments');

    existingPermissions.splice(0, existingPermissions.length);
    Object.assign(
      existingPermissions,
      canReadPermissions.value ? await functions.getTableAssignmentsById(tableId.value) : [],
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

    await functions.updateTableAssignmentsById(tableId.value, del, writes);
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
</script>

<style scoped>
.pointer-cursor {
  cursor: pointer;
}

.icon-text {
  display: flex;
  align-items: center;
}
</style>
