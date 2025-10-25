<template>
  <v-tabs v-model="tab">
    <v-tab value="overview">overview</v-tab>
    <v-tab v-if="showPermissionsTab" value="permissions">permissions</v-tab>
    <v-tab v-if="showUsersTab" value="users">users</v-tab>
  </v-tabs>
  <v-tabs-window v-model="tab">
    <v-tabs-window-item value="overview">
      <ServerOverview v-if="tab === 'overview'" />
    </v-tabs-window-item>
    <v-tabs-window-item v-if="showPermissionsTab" value="permissions">
      <PermissionManager
        v-if="tab === 'permissions' && serverId"
        :objectId="serverId"
        :relationType="permissionType" />
    </v-tabs-window-item>
    <v-tabs-window-item v-if="showUsersTab" value="users">
      <UserManager v-if="tab === 'users'" />
    </v-tabs-window-item>
  </v-tabs-window>
</template>

<script lang="ts" setup>
import { useFunctions, RelationType, useServerPermissions } from '@lakekeeper/console-components';
import { onMounted, ref } from 'vue';

const tab = ref('overview');
const functions = useFunctions();

const serverId = ref('');

// Use the server permissions composable
const { showPermissionsTab, showUsersTab } = useServerPermissions(serverId);

const permissionType = RelationType.Server;

async function init() {
  const serverInfo = await functions.getServerInfo();
  serverId.value = serverInfo['server-id'];
}

onMounted(async () => {
  await init();
});
</script>
