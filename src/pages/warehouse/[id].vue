<template>
  <v-row class="ml-1">
    <v-col>
      <BreadcrumbsFromUrl />

      <WarehouseHeader :warehouse-id="params.id" />

      <v-tabs v-model="tab" density="compact">
        <v-tab density="compact" value="namespaces">namespaces</v-tab>
        <v-tab density="compact" value="details">Details</v-tab>
        <v-tab density="compact" value="sql">SQL</v-tab>
        <v-tab v-if="showTasksTab" density="compact" value="tasks">Tasks</v-tab>
        <v-tab v-if="showPermissionsTab" density="compact" value="permissions">permissions</v-tab>
      </v-tabs>
      <v-card>
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="namespaces">
            <WarehouseNamespaces v-if="tab === 'namespaces'" :warehouse-id="params.id" />
          </v-tabs-window-item>
          <v-tabs-window-item value="details">
            <WarehouseDetails v-if="tab === 'details'" :warehouse-id="params.id" />
          </v-tabs-window-item>
          <v-tabs-window-item value="sql">
            <WarehouseSqlQuery
              v-if="tab === 'sql'"
              :warehouse-id="params.id"
              :warehouse-name="warehouseName"
              :catalog-url="catalogUrl"
              :use-fresh-token="true" />
          </v-tabs-window-item>
          <v-tabs-window-item value="permissions">
            <PermissionManager
              v-if="tab === 'permissions'"
              :objectId="warehouseId"
              :relationType="RelationType.Warehouse"
              :warehouseId="warehouseId" />
          </v-tabs-window-item>
          <v-tabs-window-item value="tasks">
            <TaskManager v-if="tab === 'tasks'" :warehouse-id="params.id" entity-type="warehouse" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import {
  RelationType,
  useWarehousePermissions,
  useFunctions,
} from '@lakekeeper/console-components';
import { computed, ref, onMounted } from 'vue';

const route = useRoute();
const functions = useFunctions();
const tab = ref('namespaces');
const warehouseName = ref<string | undefined>(undefined);

// Get catalog URL from environment variable
const catalogUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_APP_ICEBERG_CATALOG_URL || 'http://localhost:8181';
  return `${baseUrl}/catalog`;
});

// const userStore = useUserStore();
const params = computed(() => route.params as { id: string });

// Use warehouse ID as a computed ref
const warehouseId = computed(() => params.value.id);

// Use warehouse permissions composable
// const permissions = useWarehousePermissions(warehouseId);
const { showPermissionsTab, showTasksTab } = useWarehousePermissions(warehouseId);

// Load warehouse data
async function loadWarehouse() {
  try {
    const wh = await functions.getWarehouse(params.value.id);
    warehouseName.value = wh.name;
  } catch (error) {
    console.error('Failed to load warehouse:', error);
    warehouseName.value = undefined;
  }
}

onMounted(() => {
  loadWarehouse();
});

// // Refresh permissions when user logs in (not on token renewal)
// watch(
//   () => userStore.getUser(),
//   (newUser, oldUser) => {
//     // Only refresh on initial login (oldUser was null/undefined)
//     // Don't refresh on token renewal (both exist but token changed)
//     if (newUser && !oldUser) {
//       permissions.refresh();
//     }
//   },
// );
</script>
