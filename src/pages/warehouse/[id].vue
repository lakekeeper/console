<template>
  <v-row class="ml-1">
    <v-col>
      <BreadcrumbsFromUrl />

      <WarehouseHeader :warehouse-id="params.id" />

      <v-tabs v-model="tab" density="compact">
        <v-tab density="compact" value="namespaces">namespaces</v-tab>
        <v-tab density="compact" value="details">Details</v-tab>
        <v-tab v-if="permissions.showTasksTab" density="compact" value="tasks">Tasks</v-tab>
        <v-tab v-if="permissions.showPermissionsTab" density="compact" value="permissions">
          permissions
        </v-tab>
      </v-tabs>
      <v-card>
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="namespaces">
            <WarehouseNamespaces :warehouse-id="params.id" />
          </v-tabs-window-item>
          <v-tabs-window-item value="details">
            <WarehouseDetails :warehouse-id="params.id" />
          </v-tabs-window-item>
          <v-tabs-window-item value="permissions">
            <PermissionManager
              v-if="warehouseId && tab === 'permissions'"
              :key="`perm-${warehouseId}-${tab}`"
              :objectId="warehouseId"
              :relationType="RelationType.Warehouse"
              :warehouseId="warehouseId" />
            <div v-else-if="!warehouseId" class="text-center pa-8">
              <v-progress-circular color="info" indeterminate :size="48"></v-progress-circular>
              <div class="text-subtitle-1 mt-2">Loading warehouse information...</div>
            </div>
          </v-tabs-window-item>
          <v-tabs-window-item value="tasks">
            <TaskManager :warehouse-id="params.id" entity-type="warehouse" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { RelationType, useWarehousePermissions } from '@lakekeeper/console-components';
import { computed, ref, watch } from 'vue';

const route = useRoute();
const tab = ref('namespaces');
const params = computed(() => route.params as { id: string });

// Use warehouse ID as a computed ref
const warehouseId = computed(() => params.value.id);

// Use warehouse permissions composable
const permissions = useWarehousePermissions(warehouseId);

// Refresh permissions when switching to permissions tab
watch(tab, (newTab) => {
  if (newTab === 'permissions' && permissions.refresh) {
    permissions.refresh();
  }
});
</script>
