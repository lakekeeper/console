<template>
  <BranchVisualization :table="table" :snapshot-history="snapshotHistory" />
</template>

<script setup lang="ts">
import { reactive, onMounted, watch } from 'vue';
import { useFunctions } from '@/plugins/functions';
import BranchVisualization from './BranchVisualization.vue';
import type { LoadTableResultReadable, Snapshot } from '@/gen/iceberg/types.gen';

const props = defineProps<{
  warehouseId: string;
  namespaceId: string;
  tableName: string;
}>();

const functions = useFunctions();

const table = reactive<LoadTableResultReadable>({
  metadata: {
    'format-version': 0,
    'table-uuid': '',
  },
});

const snapshotHistory = reactive<Snapshot[]>([]);

onMounted(loadTableData);
watch(() => [props.warehouseId, props.namespaceId, props.tableName], loadTableData);

async function loadTableData() {
  try {
    Object.assign(
      table,
      await functions.loadTableCustomized(props.warehouseId, props.namespaceId, props.tableName),
    );

    // Process snapshot history - sort by timestamp descending (newest first)
    snapshotHistory.splice(0, snapshotHistory.length);
    if (table.metadata.snapshots) {
      const sortedSnapshots = [...table.metadata.snapshots].sort((a, b) => {
        return (b['timestamp-ms'] || 0) - (a['timestamp-ms'] || 0);
      });
      snapshotHistory.push(...sortedSnapshots);
    }
  } catch (error) {
    console.error('Failed to load table data:', error);
  }
}

defineExpose({
  loadTableData,
});
</script>
