<template>
  <ViewHistory v-if="loaded" :view="view" />
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive, watch } from 'vue';
import { useFunctions } from '@/plugins/functions';
import ViewHistory from './ViewHistory.vue';
import type { LoadViewResultReadable } from '@/gen/iceberg/types.gen';

const props = defineProps<{
  warehouseId: string;
  namespaceId: string;
  viewName: string;
}>();

const functions = useFunctions();
const loaded = ref(false);

const view = reactive<LoadViewResultReadable>({
  'metadata-location': '',
  metadata: {
    'view-uuid': '',
    'format-version': 0,
    location: '',
    'current-version-id': 0,
    versions: [],
    'version-log': [],
    schemas: [],
  },
});

async function loadViewData() {
  try {
    loaded.value = false;
    Object.assign(
      view,
      await functions.loadView(props.warehouseId, props.namespaceId, props.viewName),
    );
    loaded.value = true;
  } catch (error) {
    console.error('Failed to load view data:', error);
    loaded.value = true;
  }
}

// Watch for prop changes
watch(
  () => [props.warehouseId, props.namespaceId, props.viewName],
  () => {
    loadViewData();
  },
);

onMounted(() => {
  loadViewData();
});

defineExpose({
  loadViewData,
});
</script>
