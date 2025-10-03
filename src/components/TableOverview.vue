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

    <TableDetails :table="table" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { useFunctions } from '@/plugins/functions';
import TableDetails from './TableDetails.vue';
import type { LoadTableResultReadable } from '@/gen/iceberg/types.gen';

const props = defineProps<{
  warehouseId: string;
  namespaceId: string;
  tableName: string;
}>();

const functions = useFunctions();
const recursiveDeleteProtection = ref(false);
const tableId = ref('');

const table = reactive<LoadTableResultReadable>({
  metadata: {
    'format-version': 0,
    'table-uuid': '',
  },
});

onMounted(loadTableData);
watch(() => [props.warehouseId, props.namespaceId, props.tableName], loadTableData);

async function loadTableData() {
  try {
    Object.assign(
      table,
      await functions.loadTableCustomized(props.warehouseId, props.namespaceId, props.tableName),
    );
    tableId.value = table.metadata['table-uuid'];
    if (tableId.value) {
      await getProtection();
    }
  } catch (error) {
    console.error('Failed to load table data:', error);
  }
}

async function getProtection() {
  try {
    recursiveDeleteProtection.value = (
      await functions.getTableProtection(props.warehouseId, tableId.value)
    ).protected;
  } catch (error) {
    console.error(error);
  }
}

async function setProtection() {
  try {
    await functions.setTableProtection(
      props.warehouseId,
      tableId.value,
      !recursiveDeleteProtection.value,
    );
    await getProtection();
  } catch (error) {
    console.error(error);
  }
}

defineExpose({
  loadTableData,
});
</script>
