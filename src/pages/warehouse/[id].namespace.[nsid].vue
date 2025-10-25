<template>
  <v-row class="ml-1">
    <v-col>
      <BreadcrumbsFromUrl />

      <NamespaceHeader :warehouse-id="params.id" :namespace-path="params.nsid" />

      <v-tabs v-model="tab">
        <v-tab value="namespaces">namespaces</v-tab>
        <v-tab value="tables">tables</v-tab>
        <v-tab value="views">views</v-tab>
        <v-tab value="deleted">deleted</v-tab>
        <v-tab v-if="showPermissionsTab" value="permissions">Permissions</v-tab>
      </v-tabs>

      <v-card>
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="namespaces">
            <NamespaceNamespaces
              v-if="tab === 'namespaces'"
              :warehouse-id="params.id"
              :namespace-path="params.nsid" />
          </v-tabs-window-item>

          <v-tabs-window-item value="tables">
            <div class="pa-4">
              <div class="d-flex justify-end mb-4">
                <TableCreate
                  :warehouse-id="params.id"
                  :namespace-id="namespacePath"
                  :catalog-url="catalogUrl"
                  :storage-type="storageType"
                  @created="onTableCreated" />
              </div>
              <NamespaceTables
                v-if="tab === 'tables'"
                :warehouse-id="params.id"
                :namespace-path="params.nsid"
                :key="tableListKey" />
            </div>
          </v-tabs-window-item>

          <v-tabs-window-item value="views">
            <NamespaceViews
              v-if="tab === 'views'"
              :warehouse-id="params.id"
              :namespace-path="params.nsid" />
          </v-tabs-window-item>

          <v-tabs-window-item value="deleted">
            <NamespaceDeleted
              v-if="tab === 'deleted'"
              :warehouse-id="params.id"
              :namespace-path="params.nsid" />
          </v-tabs-window-item>

          <v-tabs-window-item v-if="showPermissionsTab" value="permissions">
            <PermissionManager
              v-if="tab === 'permissions'"
              :objectId="namespaceId"
              :relationType="RelationType.Namespace" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-col>
  </v-row>
</template>
<script lang="ts" setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  useFunctions,
  useNamespacePermissions,
  RelationType,
} from '@lakekeeper/console-components';

const route = useRoute();
const functions = useFunctions();
const tab = ref('namespaces');
const namespaceId = ref('');
const lastNamespaceRequest = ref(0);
const tableListKey = ref(0);
const storageType = ref<string | undefined>(undefined);

// Get catalog URL from environment variable
const catalogUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_APP_ICEBERG_CATALOG_URL || 'http://localhost:8181';
  return `${baseUrl}/catalog`;
});

const params = computed(() => ({
  id: (route.params as { id: string }).id,
  nsid: (route.params as { nsid: string }).nsid,
}));

// Convert URL-encoded namespace path to dot-separated format
// In the URL, namespace levels are separated by %1F (Unit Separator, ASCII 31)
// When decoded from the route param, it becomes the actual \x1F character
// e.g., "finance\x1Fsub" -> "finance.sub"
const namespacePath = computed(() => {
  return params.value.nsid.replace(/\x1F/g, '.');
});

async function loadNamespaceMetadata() {
  const { id, nsid } = params.value;
  const requestToken = ++lastNamespaceRequest.value;
  // Clear stale namespace id so downstream consumers don't operate on the previous namespace
  namespaceId.value = '';
  storageType.value = undefined;
  try {
    // Load warehouse to get storage type
    const warehouse = await functions.getWarehouse(id);
    if (requestToken !== lastNamespaceRequest.value) {
      return;
    }
    if (warehouse['storage-profile']?.type) {
      storageType.value = warehouse['storage-profile'].type;
    }
    console.log('Namespace page loaded warehouse:', {
      warehouseId: id,
      storageProfileType: warehouse['storage-profile']?.type,
      storageType: storageType.value,
    });

    const namespace = await functions.loadNamespaceMetadata(id, nsid);
    if (requestToken !== lastNamespaceRequest.value) {
      return;
    }
    namespaceId.value = namespace.properties?.namespace_id || '';
  } catch (error) {
    console.error('Failed to load namespace metadata:', error);
    if (requestToken === lastNamespaceRequest.value) {
      namespaceId.value = '';
      storageType.value = undefined;
    }
  }
}

// Handle table creation - force refresh of table list
function onTableCreated(tableName: string) {
  console.log('Table created:', tableName);
  tableListKey.value++; // Increment key to force re-render of NamespaceTables
}

// Load namespace metadata on mount to get namespaceId for permissions
onMounted(loadNamespaceMetadata);

// Reload when route params change
watch(
  () => [params.value.id, params.value.nsid],
  () => loadNamespaceMetadata(),
  { immediate: false },
);

const { showPermissionsTab } = useNamespacePermissions(namespaceId);
</script>
