<template>
  <v-tabs v-model="tab">
    <v-tab value="overview">overview</v-tab>
    <v-tab
      v-if="canReadAssignments && enabledAuthentication && enabledPermissions"
      value="permissions">
      Permissions
    </v-tab>
    <v-tab v-if="canListUsers && enabledAuthentication" value="users">users</v-tab>
  </v-tabs>
  <v-tabs-window v-model="tab">
    <v-tabs-window-item value="overview">
      <v-card>
        <ServerOverview />
      </v-card>
    </v-tabs-window-item>
    <v-tabs-window-item
      v-if="canReadAssignments && enabledAuthentication && enabledPermissions"
      value="permissions">
      <v-card>
        <PermissionManager
          v-if="enabledPermissions"
          :assignable-obj="permissionObject"
          :relation-type="permissionType" />
      </v-card>
    </v-tabs-window-item>
    <v-tabs-window-item v-if="canListUsers && enabledAuthentication" value="users">
      <v-card>
        <UserManager :can-delete-users="canDeleteUsers" :can-list-users="canListUsers" />
      </v-card>
    </v-tabs-window-item>
  </v-tabs-window>
</template>

<script lang="ts" setup>
import { useVisualStore } from '@/stores/visual';
import { useFunctions } from '@/plugins/functions';
import { computed, onMounted, reactive, ref } from 'vue';
import { ServerAction } from '@/gen/management/types.gen';
import { RelationType } from '@/common/interfaces';
import { enabledAuthentication, enabledPermissions } from '@/app.config';
import UserManager from '@/components/UserManager.vue';
import ServerOverview from '@/components/ServerOverview.vue';

const tab = ref('overview');
const visual = useVisualStore();
const functions = useFunctions();
const permissionType = ref<RelationType>('server');

const permissionObject = reactive<any>({
  id: '',
  description: '',
  name: 'Server',
});
const myAccess = reactive<ServerAction[]>([]);
const canReadAssignments = ref(false);
const canListUsers = ref(false);
const canDeleteUsers = ref(false);

const projectInfo = computed(() => {
  return visual.getServerInfo();
});

async function init() {
  await functions.getServerInfo();
  permissionObject.id = projectInfo.value['server-id'];
  await getMyAccess();
}

async function getMyAccess() {
  try {
    myAccess.splice(0, myAccess.length);
    Object.assign(myAccess, await functions.getServerAccess());
    checkPermission();
  } catch (error) {
    console.error(error);
  }
}

function checkPermission() {
  canReadAssignments.value = !!myAccess.includes('read_assignments');
  canListUsers.value = !!myAccess.includes('list_users');
  canDeleteUsers.value = !!myAccess.includes('delete_users');
}

onMounted(async () => {
  await init();
});
</script>
