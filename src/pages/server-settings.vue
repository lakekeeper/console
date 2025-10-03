<template>
  <v-tabs v-model="tab">
    <v-tab value="overview">overview</v-tab>
    <v-tab v-if="showPermissionsTab" value="permissions">permissions</v-tab>
    <v-tab v-if="showUsersTab" value="users">users</v-tab>
  </v-tabs>
  <v-tabs-window v-model="tab">
    <v-tabs-window-item value="overview">
      <ServerOverview />
    </v-tabs-window-item>
    <v-tabs-window-item v-if="showPermissionsTab" value="permissions">
      <PermissionManager :object-id="serverId" :relation-type="permissionType" />
    </v-tabs-window-item>
    <v-tabs-window-item v-if="showUsersTab" value="users">
      <UserManager :can-delete-users="canDeleteUsers" :can-list-users="canListUsers" />
    </v-tabs-window-item>
  </v-tabs-window>
</template>

<script lang="ts" setup>
import { useFunctions } from '@/plugins/functions';
import { computed, onMounted, reactive, ref } from 'vue';
import { ServerAction } from '@/gen/management/types.gen';
import { RelationType } from '@/common/interfaces';
import { enabledAuthentication, enabledPermissions } from '@/app.config';

const tab = ref('overview');
const functions = useFunctions();

const serverId = ref('');

const myAccess = reactive<ServerAction[]>([]);
const canReadAssignments = ref(false);
const canListUsers = ref(false);
const canDeleteUsers = ref(false);

// Computed properties for better performance and readability
const permissionType = computed<RelationType>(() => 'server');

const showPermissionsTab = computed(
  () => canReadAssignments.value && enabledAuthentication && enabledPermissions,
);

const showUsersTab = computed(() => canListUsers.value && enabledAuthentication);

async function init() {
  const serverInfo = await functions.getServerInfo();
  serverId.value = serverInfo['server-id'];
  await getMyAccess();
}

async function getMyAccess() {
  try {
    myAccess.splice(0, myAccess.length);
    const serverAccess = await functions.getServerAccess();
    myAccess.push(...serverAccess);

    // Set permissions in one go
    canReadAssignments.value = myAccess.includes('read_assignments');
    canListUsers.value = myAccess.includes('list_users');
    canDeleteUsers.value = myAccess.includes('delete_users');
  } catch (error) {
    console.error(error);
  }
}

onMounted(async () => {
  await init();
});
</script>
