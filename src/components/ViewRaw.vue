<template>
  <div>
    <div class="mb-4 mt-4">
      <v-btn
        size="small"
        variant="outlined"
        color="info"
        class="mr-8 ml-4"
        @click="depthRawRepresentation = 1"
        append-icon="mdi-collapse-all">
        Collapse
      </v-btn>
      <v-btn
        size="small"
        variant="outlined"
        color="success"
        class="mr-8"
        @click="depthRawRepresentation = depthRawRepresentationMax"
        append-icon="mdi-expand-all">
        Expand
      </v-btn>
      <v-btn
        size="small"
        variant="outlined"
        color="primary"
        @click="copyViewJson"
        prepend-icon="mdi-content-copy">
        Copy JSON
      </v-btn>
    </div>
    <div style="height: 65vh; overflow: auto">
      <vue-json-pretty
        :data="view"
        :deep="depthRawRepresentation"
        :theme="themeText"
        :showLineNumber="true"
        :virtual="false" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import { onMounted, ref, reactive, computed, watch } from 'vue';
import { useFunctions } from '@/plugins/functions';
import { useVisualStore } from '@/stores/visual';
import type { LoadViewResultReadable } from '@/gen/iceberg/types.gen';

const props = defineProps<{
  warehouseId: string;
  namespaceId: string;
  viewName: string;
}>();

const functions = useFunctions();
const visual = useVisualStore();

const depthRawRepresentation = ref(3);
const depthRawRepresentationMax = ref(1000);

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

const themeLight = computed(() => visual.themeLight);
const themeText = computed(() => (themeLight.value ? 'light' : 'dark'));

async function loadViewData() {
  try {
    Object.assign(
      view,
      await functions.loadView(props.warehouseId, props.namespaceId, props.viewName),
    );
    depthRawRepresentationMax.value = getMaxDepth(view);
  } catch (error) {
    console.error('Failed to load view data:', error);
  }
}

function getMaxDepth(obj: any): number {
  let maxDepth = 0;

  function findDepth(obj: any, depth: number) {
    if (typeof obj === 'object' && obj !== null) {
      depth++;
      if (depth > maxDepth) {
        maxDepth = depth;
      }
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          findDepth(obj[key], depth);
        }
      }
    }
  }

  findDepth(obj, 0);
  return maxDepth;
}

function copyViewJson() {
  try {
    const jsonString = JSON.stringify(view, null, 2);
    functions.copyToClipboard(jsonString);
  } catch (error) {
    console.error('Failed to copy view JSON:', error);
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
