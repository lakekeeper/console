<template>
  <v-data-table
    items-per-page="50"
    height="65vh"
    :search="searchDeleted"
    fixed-header
    :headers="headers"
    hover
    :items="loadedDeleted"
    :sort-by="[{ key: 'name', order: 'asc' }]"
    :items-per-page-options="[
      { title: '50 items', value: 50 },
      { title: '100 items', value: 100 },
    ]">
    <template #top>
      <v-toolbar color="transparent" density="compact" flat>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="searchDeleted"
          label="Filter results"
          prepend-inner-icon="mdi-filter"
          variant="underlined"
          hide-details
          clearable></v-text-field>
      </v-toolbar>
    </template>
    <template #item.name="{ item }">
      <span class="icon-text">
        <v-icon v-if="item.typ === 'table'" class="mr-2">mdi-table</v-icon>
        <v-icon v-else class="mr-2">mdi-view-grid-outline</v-icon>
        {{ item.name }}
      </span>
    </template>
    <template #item.deleted-at="{ item }">
      <v-tooltip location="top">
        <template #activator="{ props }">
          <span v-bind="props">
            {{
              formatDistanceToNow(parseISO(item['deleted-at']), {
                addSuffix: true,
              })
            }}
          </span>
        </template>
        {{ parseISO(item['deleted-at']) }}
      </v-tooltip>
    </template>
    <template #item.expiration-date="{ item }">
      <v-tooltip location="top">
        <template #activator="{ props }">
          <span v-bind="props">
            {{
              formatDistanceToNow(parseISO(item['expiration-date']), {
                addSuffix: true,
              })
            }}
          </span>
        </template>
        {{ parseISO(item['expiration-date']) }}
      </v-tooltip>
    </template>
    <template #item.actions="{ item }">
      <v-icon color="error" @click="undropTabular(item)">mdi-restore</v-icon>
    </template>
    <template #no-data>
      <div>No deleted tabulars in this namespace</div>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue';
import { useFunctions } from '@/plugins/functions';
import type { Header } from '@/common/interfaces';
import type { DeletedTabularResponse } from '@/gen/management/types.gen';
import { formatDistanceToNow, parseISO } from 'date-fns';

type DeletedTabularResponseExtended = DeletedTabularResponse & {
  actions: string[];
  type: string;
};

const props = defineProps<{
  warehouseId: string;
  namespacePath: string;
}>();

const functions = useFunctions();

const searchDeleted = ref('');
const loadedDeleted: DeletedTabularResponseExtended[] = reactive([]);
const loading = ref(false);
const namespaceId = ref('');

const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  {
    title: 'Deleted',
    key: 'deleted-at',
    align: 'start',
    value: (item: any) => formatDistanceToNow(parseISO(item['deleted-at']), { addSuffix: true }),
  },
  {
    title: 'Expires',
    key: 'expiration-date',
    align: 'start',
    value: (item: any) =>
      formatDistanceToNow(parseISO(item['expiration-date']), { addSuffix: true }),
  },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);

onMounted(loadNamespaceAndData);
watch(() => props.namespacePath, loadNamespaceAndData);

async function loadNamespaceAndData() {
  try {
    const namespace = await functions.loadNamespaceMetadata(props.warehouseId, props.namespacePath);
    namespaceId.value = namespace.properties?.namespace_id || '';
    await loadDeletedTabulars();
  } catch (error) {
    console.error('Failed to load namespace:', error);
  }
}

async function loadDeletedTabulars() {
  try {
    if (!namespaceId.value) return;

    const data = await functions.listDeletedTabulars(props.warehouseId, namespaceId.value);
    const loadedDeletedTmp: DeletedTabularResponseExtended[] = [];
    Object.assign(loadedDeletedTmp, data.tabulars);

    loadedDeletedTmp.forEach((item) => {
      item.actions = ['restore'];
      item.type = 'deleted';
    });

    loadedDeleted.splice(0, loadedDeleted.length);
    Object.assign(loadedDeleted, loadedDeletedTmp);
  } catch (error) {
    console.error(error);
  }
}

async function undropTabular(item: DeletedTabularResponseExtended) {
  try {
    loading.value = true;
    await functions.undropTabular(props.warehouseId, item.id, item.typ);
    await loadDeletedTabulars();
  } catch (error) {
    console.error(`Failed to undrop table-${item.name}`, error);
  } finally {
    loading.value = false;
  }
}

defineExpose({
  loadDeletedTabulars,
});
</script>

<style scoped>
.icon-text {
  display: flex;
  align-items: center;
}
</style>
