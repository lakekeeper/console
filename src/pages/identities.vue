<template>
  <div class="ma-2">
    <v-tabs v-model="tab">
      <v-tab v-if="showUsersTab" value="users">Users</v-tab>
      <v-tab value="roles">Roles</v-tab>
    </v-tabs>
    <v-tabs-window v-model="tab" style="max-height: calc(100vh - 140px); overflow-y: auto">
      <v-tabs-window-item value="roles">
        <RoleDetail v-if="selectedRoleId" :role-id="selectedRoleId" :can-edit="canManageGrants" />
        <RoleManager v-else inline @select="selectRole" />
      </v-tabs-window-item>
      <v-tabs-window-item v-if="showUsersTab" value="users">
        <UserManager v-if="tab === 'users'" />
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  useServerPermissions,
  useRoleAuthorizerPermissions,
  useVisualStore,
} from '@lakekeeper/console-components';

const route = useRoute();
const router = useRouter();
const visual = useVisualStore();

const serverId = ref('');
const { showUsersTab } = useServerPermissions(serverId);
const tab = ref('roles');

// Role detail renders in-place (stay on the Roles tab) via a ?role query param.
const selectedRoleId = computed(() => (route.query.role as string) || '');
const { canManageGrants } = useRoleAuthorizerPermissions(selectedRoleId);

function selectRole(id: string) {
  router.push({ query: { ...route.query, tab: 'roles', role: id } });
}

onMounted(() => {
  serverId.value = visual.getServerInfo()['server-id'] || '';
  if (route.query.tab) tab.value = route.query.tab as string;
});
// Switching tab clears any selected role.
watch(tab, (t) => {
  router.replace({ query: { ...route.query, tab: t, role: undefined } });
});
</script>
