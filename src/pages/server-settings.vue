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
import { onMounted, ref } from 'vue';
import { RelationType } from '@/common/interfaces';
import { useServerPermissions } from '@/composables/usePermissions';

const tab = ref('overview');
const functions = useFunctions();

const serverId = ref('');

// Use the server permissions composable
const { canListUsers, canDeleteUsers, showPermissionsTab, showUsersTab } =
  useServerPermissions(serverId);

const permissionType = RelationType.Server;

async function init() {
  const serverInfo = await functions.getServerInfo();
  serverId.value = serverInfo['server-id'];
}

onMounted(async () => {
  await init();
});
</script>
