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
              entity-type="view"
              :can-control-tasks="canControlTasks"
              :enabled-authentication="enabledAuthentication"
              :enabled-permissions="enabledPermissions" />
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
import { useFunctions } from '../../plugins/functions';
import { enabledAuthentication, enabledPermissions } from '@/app.config';
import { RelationType } from '../../common/interfaces';
import type { ViewAction } from '../../gen/management/types.gen';
import ViewHeader from '@/components/ViewHeader.vue';
import ViewOverview from '@/components/ViewOverview.vue';
import ViewRaw from '@/components/ViewRaw.vue';
import ViewHistoryTab from '@/components/ViewHistoryTab.vue';
import TaskManager from '@/components/TaskManager.vue';
import PermissionManager from '@/components/PermissionManager.vue';
import BreadcrumbsFromUrl from '@/components/BreadcrumbsFromUrl.vue';

const functions = useFunctions();
const route = useRoute();
const tab = ref('overview');
const viewId = ref('');
const myAccess = ref<ViewAction[]>([]);

const params = computed(() => ({
  id: (route.params as { id: string }).id,
  nsid: (route.params as { nsid: string }).nsid,
  vid: (route.params as { vid: string }).vid,
}));

const canReadPermissions = computed(() => myAccess.value.includes('read_assignments'));
const canGetTasks = computed(() => myAccess.value.includes('get_tasks'));
const canControlTasks = computed(() => myAccess.value.includes('control_tasks'));

const showPermissionsTab = computed(
  () => canReadPermissions.value && enabledAuthentication && enabledPermissions,
);
const showTasksTab = computed(
  () => canGetTasks.value || !enabledAuthentication || !enabledPermissions,
);

// Load view metadata and permissions on mount
onMounted(async () => {
  try {
    const view = await functions.loadView(params.value.id, params.value.nsid, params.value.vid);
    viewId.value = view.metadata['view-uuid'] || '';

    if (viewId.value) {
      const serverInfo = await functions.getServerInfo();
      if (serverInfo['authz-backend'] !== 'allow-all') {
        myAccess.value = await functions.getViewAccessById(viewId.value, params.value.id);
      }
    }
  } catch (error) {
    console.error('Failed to load view metadata:', error);
  }
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

.font-mono {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
}

.text-wrap {
  word-wrap: break-word;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
