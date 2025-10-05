<template>
  <v-row class="ml-1">
    <v-col>
      <BreadcrumbsFromUrl />

      <TableHeader :warehouse-id="params.id" :namespace-id="params.nsid" :table-name="params.tid" />

      <v-tabs v-model="tab">
        <v-tab value="overview">overview</v-tab>
        <v-tab value="raw">raw</v-tab>
        <v-tab value="branch">branch</v-tab>
        <v-tab v-if="showPermissionsTab" value="permissions">Permissions</v-tab>
        <v-tab v-if="showTasksTab" value="tasks">tasks</v-tab>
      </v-tabs>

      <v-card style="max-height: 80vh; overflow: auto">
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="overview">
            <TableOverview
              v-if="tab === 'overview'"
              :warehouse-id="params.id"
              :namespace-id="params.nsid"
              :table-name="params.tid" />
          </v-tabs-window-item>

          <v-tabs-window-item value="raw">
            <TableRaw
              v-if="tab === 'raw'"
              :warehouse-id="params.id"
              :namespace-id="params.nsid"
              :table-name="params.tid" />
          </v-tabs-window-item>

          <v-tabs-window-item value="branch">
            <TableBranch
              v-if="tab === 'branch'"
              :warehouse-id="params.id"
              :namespace-id="params.nsid"
              :table-name="params.tid" />
          </v-tabs-window-item>

          <v-tabs-window-item v-if="showPermissionsTab" value="permissions">
            <PermissionManager
              :object-id="tableId"
              :relation-type="RelationType.Table"
              :warehouse-id="params.id" />
          </v-tabs-window-item>

          <v-tabs-window-item v-if="showTasksTab" value="tasks">
            <TaskManager
              v-if="tableId"
              :warehouse-id="params.id"
              :table-id="tableId"
              entity-type="table" />
            <div v-else class="text-center pa-8">
              <v-progress-circular color="info" indeterminate :size="48"></v-progress-circular>
              <div class="text-subtitle-1 mt-2">Loading table information...</div>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-col>
  </v-row>
</template>
<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useFunctions } from '@lakekeeper/console-components';
import { RelationType } from '@/common/interfaces';
import { useTablePermissions } from '@lakekeeper/console-components';

const route = useRoute();
const functions = useFunctions();
const tab = ref('overview');
const tableId = ref('');

const params = computed(() => ({
  id: (route.params as { id: string }).id,
  nsid: (route.params as { nsid: string }).nsid,
  tid: (route.params as { tid: string }).tid,
}));

// Use composable for permissions
const { showPermissionsTab, showTasksTab } = useTablePermissions(tableId, params.value.id);

// Load table metadata on mount
onMounted(async () => {
  try {
    const table = await functions.loadTableCustomized(
      params.value.id,
      params.value.nsid,
      params.value.tid,
    );
    tableId.value = table.metadata['table-uuid'] || '';
  } catch (error) {
    console.error('Failed to load table metadata:', error);
  }
});
</script>
