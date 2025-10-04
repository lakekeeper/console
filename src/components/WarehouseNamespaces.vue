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
            !recursiveDeleteProtection
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
        <NamespaceAddDialog
          v-if="canCreateNamespace"
          :parent-path="''"
          :status-intent="createNamespaceStatus"
          @add-namespace="addNamespace" />
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
      <DeleteDialog
        v-if="item.type === 'namespace' && canDelete"
        :type="item.type"
        :name="item.name"
        @delete-with-options="deleteNamespaceWithOptions($event, item)"></DeleteDialog>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFunctions } from '@/plugins/functions';
import { useWarehousePermissions } from '@lakekeeper/console-components';
import type { Header, Item, Options } from '@/common/interfaces';
import { StatusIntent } from '@/common/enums';

const props = defineProps<{
  warehouseId: string;
}>();

const emit = defineEmits<{
  (e: 'namespace-updated'): void;
}>();

const router = useRouter();
const functions = useFunctions();

// Use warehouse permissions composable
const { canDelete, canCreateNamespace } = useWarehousePermissions(props.warehouseId);

const searchNamespace = ref('');
const recursiveDeleteProtection = ref(false);
const createNamespaceStatus = ref<StatusIntent>(StatusIntent.INACTIVE);
const loadedWarehouseItems: Item[] = reactive([]);
const paginationTokenNamespace = ref('');

// Load namespaces and warehouse protection status on mount
onMounted(() => {
  loadWarehouse();
  loadNamespaces();
});

// Reload when warehouse ID changes
watch(
  () => props.warehouseId,
  () => {
    loadWarehouse();
    loadNamespaces();
  },
);

const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);

async function addNamespace(namespace: string[]) {
  createNamespaceStatus.value = StatusIntent.STARTING;
  try {
    const res = await functions.createNamespace(props.warehouseId, namespace);
    if (res.error) throw res.error;

    createNamespaceStatus.value = StatusIntent.SUCCESS;
    await loadNamespaces();
    emit('namespace-updated');
  } catch (error) {
    createNamespaceStatus.value = StatusIntent.FAILURE;
    console.error('Failed to create namespace:', error);
  }
}

async function loadWarehouse() {
  try {
    const whResponse = await functions.getWarehouse(props.warehouseId);
    if (whResponse) {
      recursiveDeleteProtection.value = whResponse.protected;
    }
  } catch (error) {
    console.error('Failed to load warehouse:', error);
  }
}

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
    recursiveDeleteProtection.value = !recursiveDeleteProtection.value;
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
