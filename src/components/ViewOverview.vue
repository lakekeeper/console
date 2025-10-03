<template>
  <div>
    <v-toolbar color="transparent" density="compact" flat>
      <v-switch
        v-model="recursiveDeleteProtection"
        class="ml-4 mt-4"
        color="info"
        :label="
          recursiveDeleteProtection
            ? 'Recursive Delete Protection enabled'
            : 'Recursive Delete Protection disabled'
        "
        @click="setProtection"></v-switch>
    </v-toolbar>
    <v-card-text>
      <ViewDetails v-if="loaded" :view="view" />
    </v-card-text>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive, watch } from 'vue';
import { useFunctions } from '@/plugins/functions';
import ViewDetails from './ViewDetails.vue';
import type { LoadViewResultReadable } from '@/gen/iceberg/types.gen';

const props = defineProps<{
  warehouseId: string;
  namespaceId: string;
  viewName: string;
}>();

const functions = useFunctions();
const loaded = ref(false);
const recursiveDeleteProtection = ref(false);
const viewId = ref('');

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
    viewId.value = view.metadata['view-uuid'];

    if (viewId.value) {
      await getProtection();
    }

    loaded.value = true;
  } catch (error) {
    console.error('Failed to load view data:', error);
    loaded.value = true;
  }
}

async function getProtection() {
  try {
    recursiveDeleteProtection.value = (
      await functions.getViewProtection(props.warehouseId, viewId.value)
    ).protected;
  } catch (error) {
    console.error('Failed to get protection status:', error);
  }
}

async function setProtection() {
  try {
    await functions.setViewProtection(
      props.warehouseId,
      viewId.value,
      !recursiveDeleteProtection.value,
    );
    await getProtection();
  } catch (error) {
    console.error('Failed to set protection:', error);
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
