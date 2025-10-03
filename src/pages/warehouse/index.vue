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
        <v-breadcrumbs :items="['warehouses']"></v-breadcrumbs>
        <WarehouseManager
          :can-create-warehouse="canCreateWarehouse"
          :can-list-warehouses="canListWarehouses" />
      </v-col>
    </v-row>
  </span>
</template>

<script lang="ts" setup>
import { useProjectPermissions } from '@/composables/usePermissions';
import { useVisualStore } from '@/stores/visual';
import { computed } from 'vue';

const visual = useVisualStore();

const projectId = computed(() => visual.projectSelected['project-id']);
const { loading, canCreateWarehouse, canListWarehouses } = useProjectPermissions(projectId);
</script>
