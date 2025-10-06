<template>
  <v-row class="ml-1">
    <v-col>
      <BreadcrumbsFromUrl />

      <WarehouseHeader :warehouse-id="params.id" />

      <v-tabs v-model="tab" density="compact">
        <v-tab density="compact" value="namespaces">namespaces</v-tab>
        <v-tab density="compact" value="details">Details</v-tab>
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
import { RelationType, useWarehousePermissions } from '@lakekeeper/console-components';
import { computed, ref } from 'vue';

const route = useRoute();
const tab = ref('namespaces');
// const userStore = useUserStore();
const params = computed(() => route.params as { id: string });

// Use warehouse ID as a computed ref
const warehouseId = computed(() => params.value.id);

// Use warehouse permissions composable
// const permissions = useWarehousePermissions(warehouseId);
const { showPermissionsTab, showTasksTab } = useWarehousePermissions(warehouseId);
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
