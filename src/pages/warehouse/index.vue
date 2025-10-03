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
          :can-create-warehouse="myAccess.includes('create_warehouse')"
          :can-list-warehouses="myAccess.includes('list_warehouses')" />
      </v-col>
    </v-row>
  </span>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref, onUnmounted } from 'vue';
import { ProjectAction } from '@/gen/management/types.gen';
import { useFunctions } from '@/plugins/functions';
import { useVisualStore } from '@/stores/visual';

const functions = useFunctions();
const loading = ref(true);
const myAccess = reactive<ProjectAction[]>([]);
const visual = useVisualStore();

onMounted(async () => {
  try {
    visual.whId = '';
    visual.wahrehouseName = '';
    Object.assign(
      myAccess,
      await functions.getProjectAccessById(visual.projectSelected['project-id']),
    );
    loading.value = false;
  } catch (err: any) {
    console.error('Failed to load data:', err);
  }
});

onUnmounted(() => {
  visual.whId = '';
  visual.wahrehouseName = '';
  loading.value = true;
});
</script>
