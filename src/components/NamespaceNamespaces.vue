<template>
  <v-data-table
    height="65vh"
    items-per-page="50"
    :search="searchNamespace"
    fixed-header
    :headers="headers"
    hover
    :items="loadedNamespaces"
    :sort-by="[{ key: 'name', order: 'asc' }]"
    :items-per-page-options="[
      { title: '50 items', value: 50 },
      { title: '100 items', value: 100 },
    ]"
    @update:options="paginationCheck($event)">
    <template #top>
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
        <v-spacer></v-spacer>
        <v-text-field
          v-model="searchNamespace"
          label="Filter results"
          prepend-inner-icon="mdi-filter"
          variant="underlined"
          hide-details
          clearable></v-text-field>
        <addNamespaceDialog
          v-if="canCreateNamespace"
          :parent-path="namespacePath"
          :status-intent="addNamespaceStatus"
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
      <DialogDelete
        v-if="item.type === 'namespace'"
        :type="item.type"
        :name="item.name"
        @delete-with-options="deleteNamespaceWithOptions($event, item)"></DialogDelete>
    </template>
    <template #no-data>
      <addNamespaceDialog
        v-if="canCreateNamespace"
        :parent-path="namespacePath"
        :status-intent="StatusIntent.STARTING"
        @add-namespace="addNamespace" />
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFunctions } from '@/plugins/functions';
import { useNamespacePermissions } from '@/composables/usePermissions';
import type { Header, Item, Options } from '@/common/interfaces';
import { StatusIntent } from '@/common/enums';

const props = defineProps<{
  warehouseId: string;
  namespacePath: string;
}>();

const router = useRouter();
const functions = useFunctions();

const namespaceId = ref('');

onMounted(loadNamespaceAndData);
watch(() => props.namespacePath, loadNamespaceAndData);

async function loadNamespaceAndData() {
  try {
    const namespace = await functions.loadNamespaceMetadata(props.warehouseId, props.namespacePath);
    namespaceId.value = namespace.properties?.namespace_id || '';
    await Promise.all([loadNamespaces(), getProtection()]);
  } catch (error) {
    console.error('Failed to load namespace:', error);
  }
}

// Use namespace permissions composable
const { canCreateNamespace } = useNamespacePermissions(computed(() => namespaceId.value));

const searchNamespace = ref('');
const recursiveDeleteProtection = ref(false);
const addNamespaceStatus = ref<StatusIntent>(StatusIntent.INACTIVE);
const loadedNamespaces: Item[] = reactive([]);
const paginationToken = ref('');

const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);

async function loadNamespaces(parent?: string) {
  try {
    const { namespaces, ['next-page-token']: nextPageToken } = await functions.listNamespaces(
      props.warehouseId,
      parent || props.namespacePath,
    );

    paginationToken.value = nextPageToken || '';

    if (namespaces) {
      const mappedItems: Item[] = namespaces.map((nsArray) => ({
        name: nsArray[nsArray.length - 1],
        type: 'namespace',
        parentPath: [...nsArray],
        actions: ['delete'],
      }));

      loadedNamespaces.splice(0, loadedNamespaces.length);
      Object.assign(loadedNamespaces, mappedItems);
    }
  } catch (error) {
    console.error(error);
  }
}

async function paginationCheck(option: Options) {
  if (loadedNamespaces.length >= 10000) return;

  if (option.page * option.itemsPerPage == loadedNamespaces.length && paginationToken.value != '') {
    const { namespaces, ['next-page-token']: nextPageToken } = await functions.listNamespaces(
      props.warehouseId,
      props.namespacePath,
      paginationToken.value,
    );

    paginationToken.value = nextPageToken || '';
    if (namespaces) {
      const mappedItems: Item[] = namespaces.map((nsArray) => ({
        name: nsArray[nsArray.length - 1],
        type: 'namespace',
        parentPath: [...nsArray],
        actions: ['delete'],
      }));

      loadedNamespaces.push(...mappedItems.flat());
    }
  }
}

async function addNamespace(namespaceIdent: string[]) {
  addNamespaceStatus.value = StatusIntent.STARTING;
  try {
    const res = await functions.createNamespace(props.warehouseId, namespaceIdent);
    if (res.error) throw res.error;

    addNamespaceStatus.value = StatusIntent.SUCCESS;
    await loadNamespaces();
  } catch (error) {
    addNamespaceStatus.value = StatusIntent.FAILURE;
    console.error('Failed to create namespace:', error);
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
  } catch (error) {
    console.error(`Failed to drop namespace-${item.name}`, error);
  }
}

async function routeToNamespace(item: Item) {
  if (item.type !== 'namespace') return;

  const namespacePath =
    item.parentPath.length > 0 ? `${item.parentPath.join(String.fromCharCode(0x1f))}` : item.name;
  router.push(`/warehouse/${props.warehouseId}/namespace/${namespacePath}`);
}

async function getProtection() {
  try {
    if (!namespaceId.value) return;
    recursiveDeleteProtection.value = (
      await functions.getNamespaceProtection(props.warehouseId, namespaceId.value)
    ).protected;
  } catch (error) {
    console.error(error);
  }
}

async function setProtection() {
  try {
    if (!namespaceId.value) return;
    await functions.setNamespaceProtection(
      props.warehouseId,
      namespaceId.value,
      !recursiveDeleteProtection.value,
    );
    await getProtection();
  } catch (error) {
    console.error(error);
  }
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
