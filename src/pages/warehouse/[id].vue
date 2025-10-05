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
              :object-id="params.id"
              :relation-type="RelationType.Warehouse"
              :warehouse-id="params.id" />
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
import { RelationType, useFunctions } from '@lakekeeper/console-components';
import { computed, ref, onMounted } from 'vue';

const route = useRoute();
const functions = useFunctions();
const tab = ref('namespaces');
const params = computed(() => route.params as { id: string });

// Inline permissions check for warehouse
const warehouseId = computed(() => params.value.id);
const showPermissionsTab = ref(false);
const showTasksTab = ref(false);

onMounted(async () => {
  try {
    // Check if user has permission to view permissions tab
    const actions = await functions.getWarehouseAccessById(warehouseId.value);
    showPermissionsTab.value = actions.includes('can-view-warehouse-permissions' as any);
    showTasksTab.value = actions.includes('can-manage-warehouse-tasks' as any);
  } catch (error) {
    console.error('Failed to load warehouse permissions:', error);
  }
});

const permissions = computed(() => ({
  showPermissionsTab: showPermissionsTab.value,
  showTasksTab: showTasksTab.value,
}));
</script>
