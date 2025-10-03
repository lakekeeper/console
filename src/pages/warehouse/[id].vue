<template>
  <v-container v-if="loading" class="fill-height">
    <v-responsive class="align-centerfill-height mx-auto" max-width="900">
      <v-row justify="center">
        <v-progress-circular
          class="mt-4"
          color="info"
          indeterminate
          :size="126"></v-progress-circular>
      </v-row>
    </v-responsive>
  </v-container>
  <span v-else>
    <v-row class="ml-1">
      <v-col>
        <BreadcrumbsFromUrl />

        <WarehouseHeader
          :warehouse="selectedWarehouse"
          :can-create-namespace="canCreateNamespace"
          @warehouse-updated="handleWarehouseUpdated"
          @open-search="showSearchDialog = true" />

        <v-tabs v-model="tab" density="compact">
          <v-tab density="compact" value="namespaces">namespaces</v-tab>
          <v-tab v-if="showPermissionsTab" density="compact" value="permissions">permissions</v-tab>
          <v-tab density="compact" value="details">Details</v-tab>
          <v-tab v-if="showTasksTab" density="compact" value="tasks">Tasks</v-tab>
        </v-tabs>
        <v-card>
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="namespaces">
              <WarehouseNamespaces
                ref="namespacesComponent"
                :warehouse-id="params.id"
                :protected="selectedWarehouse.protected"
                :can-create-namespace="canCreateNamespace"
                :can-delete="canDelete"
                @update:protected="selectedWarehouse.protected = $event"
                @namespace-updated="handleWarehouseUpdated" />
            </v-tabs-window-item>
            <v-tabs-window-item value="details">
              <WarehouseDetails :warehouse="selectedWarehouse" />
            </v-tabs-window-item>
            <v-tabs-window-item v-if="showPermissionsTab" value="permissions">
              <PermissionManager :object-id="params.id" :relation-type="RelationType.Warehouse" />
            </v-tabs-window-item>
            <v-tabs-window-item v-if="showTasksTab" value="tasks">
              <TaskManager
                :warehouse-id="params.id"
                entity-type="warehouse"
                :can-control-tasks="canControlAllTasks" />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </v-col>
    </v-row>

    <!-- Search Modal -->
    <SearchTabular v-model="showSearchDialog" :warehouse-id="params.id" />
  </span>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useFunctions } from '../../plugins/functions';
import { useWarehousePermissions } from '@/composables/usePermissions';
import TaskManager from '../../components/TaskManager.vue';
import SearchTabular from '../../components/SearchTabular.vue';
import WarehouseNamespaces from '../../components/WarehouseNamespaces.vue';
import WarehouseDetails from '../../components/WarehouseDetails.vue';
import WarehouseHeader from '../../components/WarehouseHeader.vue';
import { RelationType } from '../../common/interfaces';
import { computed, onMounted, ref, reactive } from 'vue';
import type { GetWarehouseResponse } from '@/gen/management/types.gen';
import { useVisualStore } from '../../stores/visual';

const functions = useFunctions();
const route = useRoute();
const visual = useVisualStore();

const tab = ref('namespaces');
const loading = ref(true);
const showSearchDialog = ref(false);
const namespacesComponent = ref<InstanceType<typeof WarehouseNamespaces>>();

const selectedWarehouse = reactive<GetWarehouseResponse>({
  'delete-profile': { type: 'hard' },
  id: '',
  name: '',
  'project-id': '',
  status: 'active',
  'storage-profile': {
    type: 's3',
    bucket: '',
    'key-prefix': '',
    'assume-role-arn': '',
    endpoint: '',
    region: '',
    'path-style-access': null,
    'sts-role-arn': '',
    'sts-enabled': false,
    flavor: undefined,
  },
  protected: false,
});

const params = computed(() => route.params as { id: string });

// Use warehouse permissions composable
const { canCreateNamespace, canDelete, canControlAllTasks, showPermissionsTab, showTasksTab } =
  useWarehousePermissions(params.value.id);

async function loadWarehouse() {
  const whResponse = await functions.getWarehouse(params.value.id);
  if (whResponse) {
    Object.assign(selectedWarehouse, whResponse);
    visual.wahrehouseName = whResponse.name;
    visual.whId = whResponse.id;
  }
}

async function handleWarehouseUpdated() {
  await loadWarehouse();
  namespacesComponent.value?.loadNamespaces();
}

onMounted(async () => {
  loading.value = true;
  try {
    await loadWarehouse();
  } catch (error) {
    console.error('Failed to load warehouse:', error);
  } finally {
    loading.value = false;
  }
});
</script>
