<template>
  <v-row class="ml-1">
    <v-col>
      <BreadcrumbsFromUrl />

      <ViewHeader :warehouse-id="params.id" :namespace-id="params.nsid" :view-name="params.vid" />

      <v-tabs v-model="tab">
        <v-tab value="overview">overview</v-tab>
        <v-tab value="raw">raw</v-tab>
        <v-tab value="history">history</v-tab>
        <v-tab v-if="showPermissionsTab" value="permissions">Permissions</v-tab>
        <v-tab v-if="showTasksTab" value="tasks">tasks</v-tab>
      </v-tabs>

      <v-card style="max-height: 80vh; overflow: auto; min-height: 55vh">
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="overview">
            <ViewOverview
              v-if="tab === 'overview'"
              :warehouse-id="params.id"
              :namespace-id="params.nsid"
              :view-name="params.vid" />
          </v-tabs-window-item>

          <v-tabs-window-item value="raw">
            <ViewRaw
              v-if="tab === 'raw'"
              :warehouse-id="params.id"
              :namespace-id="params.nsid"
              :view-name="params.vid" />
          </v-tabs-window-item>

          <v-tabs-window-item value="history">
            <ViewHistoryTab
              v-if="tab === 'history'"
              :warehouse-id="params.id"
              :namespace-id="params.nsid"
              :view-name="params.vid" />
          </v-tabs-window-item>

          <v-tabs-window-item v-if="showPermissionsTab" value="permissions">
            <PermissionManager
              :object-id="viewId"
              :relation-type="RelationType.View"
              :warehouse-id="params.id" />
          </v-tabs-window-item>

          <v-tabs-window-item v-if="showTasksTab" value="tasks">
            <TaskManager
              v-if="viewId"
              :warehouse-id="params.id"
              :view-id="viewId"
              entity-type="view" />
            <div v-else class="text-center pa-8">
              <v-progress-circular color="info" indeterminate :size="48"></v-progress-circular>
              <div class="text-subtitle-1 mt-2">Loading view information...</div>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-col>
  </v-row>
</template>
<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useFunctions } from '@lakekeeper/console-components';
import { RelationType } from '../../common/interfaces';
import { useViewPermissions } from '@lakekeeper/console-components';

const functions = useFunctions();
const route = useRoute();
const tab = ref('overview');
const viewId = ref('');

const params = computed(() => ({
  id: (route.params as { id: string }).id,
  nsid: (route.params as { nsid: string }).nsid,
  vid: (route.params as { vid: string }).vid,
}));

// Use composable for view permissions
const { showPermissionsTab, showTasksTab } = useViewPermissions(viewId, params.value.id);

// Load view metadata on mount
onMounted(async () => {
  try {
    const view = await functions.loadView(params.value.id, params.value.nsid, params.value.vid);
    viewId.value = view.metadata['view-uuid'] || '';
  } catch (error) {
    console.error('Failed to load view metadata:', error);
  }
});
</script>
