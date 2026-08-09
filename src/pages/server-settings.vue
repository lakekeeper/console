<template>
  <div class="pa-4">
    <h1 class="text-h6 mb-4 d-flex align-center ga-2">
      <v-icon>mdi-cog</v-icon>
      Server settings
    </h1>
    <v-tabs v-model="tab">
      <v-tab value="overview">overview</v-tab>
      <v-tab v-if="showPermissionsTab" value="permissions">permissions</v-tab>
    </v-tabs>
    <v-tabs-window v-model="tab" style="max-height: calc(100vh - 140px); overflow-y: auto">
      <v-tabs-window-item
        value="overview"
        :transition="tabsReady ? undefined : false"
        :reverse-transition="tabsReady ? undefined : false">
        <ServerOverview v-if="tab === 'overview'" />
      </v-tabs-window-item>
      <v-tabs-window-item
        v-if="showPermissionsTab"
        value="permissions"
        :transition="tabsReady ? undefined : false"
        :reverse-transition="tabsReady ? undefined : false">
        <PermissionManager
          v-if="tab === 'permissions' && serverId"
          :objectId="serverId"
          :relationType="permissionType" />
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script lang="ts" setup>
import {
  useFunctions,
  RelationType,
  useServerAuthorizerPermissions,
} from '@lakekeeper/console-components';
import { nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const tab = ref('overview');
const functions = useFunctions();

// Keep the tab-switch transition off for the first render only — a `?tab=`
// deep link can land straight on a non-default tab with no prior tab to
// transition from, which confuses v-window's transition bookkeeping.
const tabsReady = ref(false);
onMounted(() => {
  nextTick(() => {
    tabsReady.value = true;
  });
});

const serverId = ref('');

// Use the server permissions composable
const { showPermissionsTab } = useServerAuthorizerPermissions(serverId);

const permissionType = RelationType.Server;

async function init() {
  const serverInfo = await functions.getServerInfo();
  serverId.value = serverInfo['server-id'];
}

onMounted(async () => {
  if (route.query.tab) {
    tab.value = route.query.tab as string;
  }
  await init();
});

watch(tab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } });
});
</script>
