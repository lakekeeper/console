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
            <WarehouseNamespaces :warehouse-id="params.id" />
          </v-tabs-window-item>
          <v-tabs-window-item value="details">
            <WarehouseDetails :warehouse-id="params.id" />
          </v-tabs-window-item>
          <v-tabs-window-item v-if="showPermissionsTab" value="permissions">
            <PermissionManager :object-id="params.id" :relation-type="RelationType.Warehouse" />
          </v-tabs-window-item>
          <v-tabs-window-item v-if="showTasksTab" value="tasks">
            <TaskManager :warehouse-id="params.id" entity-type="warehouse" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useWarehousePermissions } from '@/composables/usePermissions';
import TaskManager from '../../components/TaskManager.vue';
import WarehouseNamespaces from '../../components/WarehouseNamespaces.vue';
import WarehouseDetails from '../../components/WarehouseDetails.vue';
import WarehouseHeader from '../../components/WarehouseHeader.vue';
import { RelationType } from '../../common/interfaces';
import { computed, ref } from 'vue';

const route = useRoute();
const tab = ref('namespaces');
const params = computed(() => route.params as { id: string });

// Use warehouse permissions composable for UI visibility
const { showPermissionsTab, showTasksTab } = useWarehousePermissions(params.value.id);
</script>
