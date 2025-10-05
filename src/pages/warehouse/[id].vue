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
import { useWarehousePermissions, RelationType } from '@lakekeeper/console-components';
import { computed, ref } from 'vue';

const route = useRoute();
const tab = ref('namespaces');
const params = computed(() => route.params as { id: string });

// Use warehouse permissions composable for UI visibility
const warehouseId = computed(() => params.value.id);
const permissions = useWarehousePermissions(warehouseId);
</script>
