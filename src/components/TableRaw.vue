<template>
  <div>
    <div class="mb-4 mt-4">
      <v-btn
        size="small"
        variant="outlined"
        color="info"
        class="mr-8 ml-4"
        @click="depth = 1"
        append-icon="mdi-collapse-all">
        Collapse
      </v-btn>
      <v-btn
        size="small"
        variant="outlined"
        color="success"
        class="mr-8"
        @click="depth = maxDepth"
        append-icon="mdi-expand-all">
        Expand
      </v-btn>
      <v-btn
        size="small"
        variant="outlined"
        color="primary"
        @click="copyTableJson"
        prepend-icon="mdi-content-copy">
        Copy JSON
      </v-btn>
    </div>
    <div style="height: 65vh; overflow: auto">
      <vue-json-pretty
        :data="table"
        :deep="depth"
        :theme="themeText"
        :showLineNumber="true"
        :virtual="false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useFunctions } from '@/plugins/functions';
import { useVisualStore } from '@/stores/visual';
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import type { LoadTableResultReadable } from '@/gen/iceberg/types.gen';

const props = defineProps<{
  warehouseId: string;
  namespaceId: string;
  tableName: string;
}>();

const functions = useFunctions();
const visual = useVisualStore();

const depth = ref(3);
const maxDepth = ref(1000);

const table = reactive<LoadTableResultReadable>({
  metadata: {
    'format-version': 0,
    'table-uuid': '',
  },
});

const themeLight = computed(() => visual.themeLight);
const themeText = computed(() => (themeLight.value ? 'light' : 'dark'));

onMounted(loadTableData);
watch(() => [props.warehouseId, props.namespaceId, props.tableName], loadTableData);

async function loadTableData() {
  try {
    Object.assign(
      table,
      await functions.loadTableCustomized(props.warehouseId, props.namespaceId, props.tableName),
    );
    maxDepth.value = getMaxDepth(table);
  } catch (error) {
    console.error('Failed to load table data:', error);
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

function copyTableJson() {
  try {
    const jsonString = JSON.stringify(table, null, 2);
    functions.copyToClipboard(jsonString);
  } catch (error) {
    console.error('Failed to copy table JSON:', error);
  }
}

defineExpose({
  loadTableData,
});
</script>
