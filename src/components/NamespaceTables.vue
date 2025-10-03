<template>
  <v-data-table
    height="65vh"
    items-per-page="50"
    :search="searchTbl"
    fixed-header
    :items-per-page-options="[
      { title: '50 items', value: 50 },
      { title: '100 items', value: 100 },
    ]"
    @update:options="paginationCheck($event)"
    :headers="headers"
    hover
    :items="loadedTables"
    :sort-by="[{ key: 'name', order: 'asc' }]">
    <template #top>
      <v-toolbar color="transparent" density="compact" flat>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="searchTbl"
          label="Filter results"
          prepend-inner-icon="mdi-filter"
          variant="underlined"
          hide-details
          clearable></v-text-field>
      </v-toolbar>
    </template>
    <template #item.name="{ item }">
      <td class="pointer-cursor" @click="routeToTable(item)">
        <span class="icon-text">
          <v-icon class="mr-2">mdi-table</v-icon>
          {{ item.name }}
        </span>
      </td>
    </template>
    <template #item.actions="{ item }">
      <DeleteDialog
        v-if="item.type === 'table'"
        :type="item.type"
        :name="item.name"
        @delete-table-with-options="deleteTableWithOptions($event, item)"></DeleteDialog>
    </template>
    <template #no-data>
      <div>No tables in this namespace</div>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFunctions } from '@/plugins/functions';
import type { Header, Options } from '@/common/interfaces';
import type { TableIdentifier } from '@/gen/iceberg/types.gen';

export type TableIdentifierExtended = TableIdentifier & {
  actions: string[];
  id: string;
  type: string;
};

const props = defineProps<{
  warehouseId: string;
  namespacePath: string;
}>();

const router = useRouter();
const functions = useFunctions();

const searchTbl = ref('');
const loadedTables: TableIdentifierExtended[] = reactive([]);
const paginationToken = ref('');

const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);

onMounted(loadTables);
watch(() => props.namespacePath, loadTables);

async function loadTables() {
  try {
    const loadedTablesTmp: TableIdentifierExtended[] = [];
    const data = await functions.listTables(props.warehouseId, props.namespacePath);
    Object.assign(loadedTablesTmp, data.identifiers);
    paginationToken.value = data['next-page-token'] || '';

    loadedTablesTmp.forEach((table) => {
      table.actions = ['delete'];
      table.type = 'table';
    });

    loadedTables.splice(0, loadedTables.length);
    Object.assign(loadedTables, loadedTablesTmp);
  } catch (error) {
    console.error(error);
  }
}

async function paginationCheck(option: Options) {
  if (loadedTables.length >= 10000) return;

  if (option.page * option.itemsPerPage == loadedTables.length && paginationToken.value != '') {
    const loadedTablesTmp: TableIdentifierExtended[] = [];
    const data = await functions.listTables(
      props.warehouseId,
      props.namespacePath,
      paginationToken.value,
    );
    Object.assign(loadedTablesTmp, data.identifiers);
    paginationToken.value = data['next-page-token'] || '';
    loadedTablesTmp.forEach((table) => {
      table.actions = ['delete'];
      table.type = 'table';
    });

    loadedTables.push(...loadedTablesTmp.flat());
  }
}

async function deleteTableWithOptions(e: any, item: TableIdentifierExtended) {
  try {
    await functions.dropTable(props.warehouseId, props.namespacePath, item.name, e);
    await loadTables();
  } catch (error) {
    console.error(`Failed to drop table-${item.name}`, error);
  }
}

async function routeToTable(item: TableIdentifierExtended) {
  router.push(
    `/warehouse/${props.warehouseId}/namespace/${props.namespacePath}/table/${encodeURIComponent(item.name)}`,
  );
}

defineExpose({
  loadTables,
});
</script>

<style scoped>
.pointer-cursor {
  cursor: pointer;
}

.icon-text {
  display: flex;
  align-items: center;
}
</style>
