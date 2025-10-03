<template>
  <v-data-table
    items-per-page="50"
    height="65vh"
    :search="searchView"
    fixed-header
    :headers="headers"
    hover
    :items="loadedViews"
    :sort-by="[{ key: 'name', order: 'asc' }]"
    :items-per-page-options="[
      { title: '50 items', value: 50 },
      { title: '100 items', value: 100 },
    ]"
    @update:options="paginationCheck($event)">
    <template #item.name="{ item }">
      <td class="pointer-cursor" @click="routeToView(item)">
        <span class="icon-text">
          <v-icon class="mr-2">mdi-view-grid-outline</v-icon>
          {{ item.name }}
        </span>
      </td>
    </template>
    <template #top>
      <v-toolbar color="transparent" density="compact" flat>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="searchView"
          label="Filter results"
          prepend-inner-icon="mdi-filter"
          variant="underlined"
          hide-details
          clearable></v-text-field>
      </v-toolbar>
    </template>
    <template #item.actions="{ item }">
      <DeleteDialog
        v-if="item.type === 'view'"
        :type="item.type"
        :name="item.name"
        @delete-view-with-options="deleteViewWithOptions($event, item)"></DeleteDialog>
    </template>
    <template #no-data>
      <div>No views in this namespace</div>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFunctions } from '@/plugins/functions';
import type { Header, Options } from '@/common/interfaces';
import type { TableIdentifier } from '@/gen/iceberg/types.gen';

export type ViewIdentifierExtended = TableIdentifier & {
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

const searchView = ref('');
const loadedViews: ViewIdentifierExtended[] = reactive([]);
const paginationToken = ref('');

const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);

onMounted(loadViews);
watch(() => props.namespacePath, loadViews);

async function loadViews() {
  try {
    const loadedViewsTmp: ViewIdentifierExtended[] = [];
    const data = await functions.listViews(props.warehouseId, props.namespacePath);
    Object.assign(loadedViewsTmp, data.identifiers);
    paginationToken.value = data['next-page-token'] || '';

    loadedViewsTmp.forEach((view) => {
      view.actions = ['delete'];
      view.type = 'view';
    });

    loadedViews.splice(0, loadedViews.length);
    Object.assign(loadedViews, loadedViewsTmp);
  } catch (error) {
    console.error(error);
  }
}

async function paginationCheck(option: Options) {
  if (loadedViews.length >= 10000) return;

  if (option.page * option.itemsPerPage == loadedViews.length && paginationToken.value != '') {
    const loadedViewsTmp: ViewIdentifierExtended[] = [];
    const data = await functions.listViews(
      props.warehouseId,
      props.namespacePath,
      paginationToken.value,
    );
    Object.assign(loadedViewsTmp, data.identifiers);
    paginationToken.value = data['next-page-token'] || '';
    loadedViewsTmp.forEach((view) => {
      view.actions = ['delete'];
      view.type = 'view';
    });

    loadedViews.push(...loadedViewsTmp.flat());
  }
}

async function deleteViewWithOptions(e: any, item: ViewIdentifierExtended) {
  try {
    await functions.dropView(props.warehouseId, props.namespacePath, item.name, e);
    await loadViews();
  } catch (error) {
    console.error(`Failed to drop view-${item.name}`, error);
  }
}

async function routeToView(item: ViewIdentifierExtended) {
  router.push(
    `/warehouse/${props.warehouseId}/namespace/${props.namespacePath}/view/${encodeURIComponent(item.name)}`,
  );
}

defineExpose({
  loadViews,
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
