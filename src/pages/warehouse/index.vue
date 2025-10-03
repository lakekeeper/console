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
import { computed, onMounted, reactive, ref } from 'vue';
import { ProjectAction } from '@/gen/management/types.gen';
import { useFunctions } from '@/plugins/functions';
import { useVisualStore } from '@/stores/visual';
import { enabledAuthentication, enabledPermissions } from '@/app.config';

const functions = useFunctions();
const visual = useVisualStore();

const loading = ref(true);
const myAccess = reactive<ProjectAction[]>([]);

const canCreateWarehouse = computed(
  () => !enabledAuthentication || !enabledPermissions || myAccess.includes('create_warehouse'),
);
const canListWarehouses = computed(
  () => !enabledAuthentication || !enabledPermissions || myAccess.includes('list_warehouses'),
);

onMounted(async () => {
  if (!enabledAuthentication || !enabledPermissions) {
    loading.value = false;
    return;
  }

  try {
    const projectAccess = await functions.getProjectAccessById(
      visual.projectSelected['project-id'],
    );
    Object.assign(myAccess, projectAccess);
  } catch (err) {
    console.error('Failed to load warehouse permissions:', err);
  } finally {
    loading.value = false;
  }
});
</script>
