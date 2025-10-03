<template>
  <v-data-table
    height="60vh"
    :search="searchNamespace"
    fixed-header
    :headers="headers"
    hover
    items-per-page="50"
    :items="loadedWarehouseItems"
    :sort-by="[{ key: 'name', order: 'asc' }]"
    :items-per-page-options="[
      { title: '50 items', value: 50 },
      { title: '100 items', value: 100 },
    ]"
    @update:options="paginationCheckNamespace($event)">
    <template #top>
      <v-toolbar color="transparent" density="compact" flat>
        <v-switch
          v-model="recursiveDeleteProtection"
          class="ml-4 mt-4"
          color="info"
          :label="
            !protected
              ? 'Recursive Delete Protection disabled'
              : 'Recursive Delete Protection enabled'
          "
          @click="setProtection"></v-switch>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="searchNamespace"
          label="Filter results"
          prepend-inner-icon="mdi-filter"
          variant="underlined"
          hide-details
          clearable></v-text-field>
      </v-toolbar>
    </template>
    <template #item.name="{ item }">
      <td class="pointer-cursor" @click="routeToNamespace(item)">
        <span class="icon-text">
          <v-icon class="mr-2">mdi-folder</v-icon>
          {{ item.name }}
        </span>
      </td>
    </template>

    <template #item.actions="{ item }">
      <DialogDelete
        v-if="item.type === 'namespace' && canDelete"
        :type="item.type"
        :name="item.name"
        @delete-with-options="deleteNamespaceWithOptions($event, item)"></DialogDelete>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFunctions } from '@/plugins/functions';
import type { Header, Item, Options } from '@/common/interfaces';

const props = defineProps<{
  warehouseId: string;
  protected: boolean;
  canCreateNamespace: boolean;
  canDelete: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:protected', value: boolean): void;
  (e: 'namespace-updated'): void;
}>();

const router = useRouter();
const functions = useFunctions();

const searchNamespace = ref('');
const recursiveDeleteProtection = ref(props.protected);
const loadedWarehouseItems: Item[] = reactive([]);
const paginationTokenNamespace = ref('');

// Watch for prop changes to sync with local state
watch(
  () => props.protected,
  (newValue) => {
    recursiveDeleteProtection.value = newValue;
  },
);

// Load namespaces on mount
onMounted(() => {
  loadNamespaces();
});

const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);

async function loadNamespaces(parent?: string) {
  try {
    const { namespaces, ['next-page-token']: nextPageToken } = await functions.listNamespaces(
      props.warehouseId,
      parent,
    );

    paginationTokenNamespace.value = nextPageToken || '';

    if (namespaces) {
      const mappedItems: Item[] = namespaces.map((nsArray) => ({
        name: nsArray[nsArray.length - 1],
        type: 'namespace',
        parentPath: [...nsArray],
        actions: ['delete'],
      }));

      loadedWarehouseItems.splice(0, loadedWarehouseItems.length);
      Object.assign(loadedWarehouseItems, mappedItems);
    }
  } catch (error) {
    console.error(error);
  }
}

async function paginationCheckNamespace(option: Options) {
  if (loadedWarehouseItems.length >= 10000) return;

  if (
    option.page * option.itemsPerPage == loadedWarehouseItems.length &&
    paginationTokenNamespace.value != ''
  ) {
    const { namespaces, ['next-page-token']: nextPageToken } = await functions.listNamespaces(
      props.warehouseId,
      undefined,
      paginationTokenNamespace.value,
    );

    paginationTokenNamespace.value = nextPageToken || '';
    if (namespaces) {
      const mappedItems: Item[] = namespaces.map((nsArray) => ({
        name: nsArray[nsArray.length - 1],
        type: 'namespace',
        parentPath: [...nsArray],
        actions: ['delete'],
      }));

      loadedWarehouseItems.push(...mappedItems.flat());
    }
  }
}

async function setProtection() {
  try {
    await functions.setWarehouseProtection(props.warehouseId, !recursiveDeleteProtection.value);
    emit('update:protected', !recursiveDeleteProtection.value);
    emit('namespace-updated');
  } catch (error) {
    console.error(error);
  }
}

async function deleteNamespaceWithOptions(e: any, item: Item) {
  try {
    const res = await functions.dropNamespace(
      props.warehouseId,
      item.parentPath.join(String.fromCharCode(0x1f)),
      e,
    );
    if (res.error) throw res.error;

    await loadNamespaces();
    emit('namespace-updated');
  } catch (error: any) {
    console.error(`Failed to drop namespace-${item.name}  - `, error);
  }
}

async function routeToNamespace(item: Item) {
  const namespacePath = item.parentPath.join(String.fromCharCode(0x1f));
  router.push(`/warehouse/${props.warehouseId}/namespace/${namespacePath}`);
}

// Expose method for parent to trigger reload
defineExpose({
  loadNamespaces,
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
