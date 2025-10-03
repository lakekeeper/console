<template>
  <v-toolbar color="transparent" density="compact" flat>
    <v-toolbar-title>
      <span class="text-subtitle-1">
        {{ warehouse.name }}

        <v-chip size="small" color="secondary" label class="ma-2">
          <v-icon icon="mdi-table" start></v-icon>
          number of tables: {{ stats['number-of-tables'] }}
        </v-chip>
        <v-chip size="small" color="primary" label class="ma-2">
          <v-icon icon="mdi-view-grid-outline" start></v-icon>
          number of views: {{ stats['number-of-views'] }}
        </v-chip>
        <StatisticsDialog :stats="[stats]"></StatisticsDialog>
      </span>
    </v-toolbar-title>
    <template #prepend>
      <v-icon>mdi-database</v-icon>
    </template>
    <v-spacer></v-spacer>

    <WarehouseActionsMenu
      :process-status="processStatus"
      :warehouse="warehouse"
      @close="$emit('close')"
      @rename-warehouse="$emit('rename-warehouse', $event)"
      @update-credentials="$emit('update-credentials', $event)"
      @update-delprofile="$emit('update-delprofile', $event)"
      @update-profile="$emit('update-profile', $event)" />
    <v-btn
      prepend-icon="mdi-magnify"
      class="mr-2"
      size="small"
      variant="outlined"
      @click="$emit('open-search')"
      aria-label="Search tables and views">
      Search Warehouse
    </v-btn>
    <addNamespaceDialog
      v-if="canCreateNamespace"
      :parent-path="''"
      :status-intent="createNamespaceStatus"
      @add-namespace="addNamespace" />
  </v-toolbar>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useFunctions } from '@/plugins/functions';
import type { GetWarehouseResponse } from '@/gen/management/types.gen';
import { StatusIntent } from '@/common/enums';

const props = defineProps<{
  warehouse: GetWarehouseResponse;
  stats: {
    'number-of-tables': number;
    'number-of-views': number;
    timestamp: string;
    'updated-at': string;
  };
  processStatus: string;
  canCreateNamespace: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'rename-warehouse', name: string): void;
  (e: 'update-credentials', credentials: any): void;
  (e: 'update-delprofile', profile: any): void;
  (e: 'update-profile', profile: any): void;
  (e: 'open-search'): void;
  (e: 'namespace-created'): void;
}>();

const functions = useFunctions();
const createNamespaceStatus = ref<StatusIntent>(StatusIntent.INACTIVE);

async function addNamespace(namespace: string[]) {
  try {
    createNamespaceStatus.value = StatusIntent.STARTING;
    const res = await functions.createNamespace(props.warehouse.id, namespace);
    if (res.error) throw res.error;
    createNamespaceStatus.value = StatusIntent.SUCCESS;

    // Emit event to parent to trigger refresh
    emit('namespace-created');
  } catch (error) {
    createNamespaceStatus.value = StatusIntent.FAILURE;
    console.error(error);
  }
}
</script>
