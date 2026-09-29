<template>
  <div class="pa-4">
    <h1 class="text-h6 mb-4 d-flex align-center ga-2">
      <v-icon>mdi-account-multiple</v-icon>
      Identities
    </h1>
    <div v-if="!permsSettled" class="d-flex justify-center pa-8">
      <v-progress-circular color="primary" indeterminate :size="48"></v-progress-circular>
    </div>
    <template v-else>
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
    </template>
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

const serverId = ref(visual.getServerInfo()['server-id'] || '');
const { showUsersTab, loading: permsLoading } = useServerPermissions(serverId);
// The tabs must not render before the server permissions are known: with an empty
// permission set the Users tab is absent and v-tabs would force-select Roles,
// clobbering an explicit ?tab=users from the URL on a page refresh.
const permsSettled = ref(false);
watch(permsLoading, (loading) => {
  if (!loading) permsSettled.value = true;
});
const tab = ref((route.query.tab as string) || 'users');

// Role detail renders in-place (stay on the Roles tab) via a ?role query param.
const selectedRoleId = computed(() => (route.query.role as string) || '');
const { canManageGrants } = useRoleAuthorizerPermissions(selectedRoleId);

function selectRole(id: string) {
  router.push({ query: { ...route.query, tab: 'roles', role: id } });
}

onMounted(() => {
  if (!serverId.value) serverId.value = visual.getServerInfo()['server-id'] || '';
  // Nothing in flight (no server id, so no permission request was started).
  if (!permsLoading.value) permsSettled.value = true;
});
// Default to the Users tab; fall back to Roles only if the user lacks Users access.
// Guarded against the empty-serverId window so it never flips to Roles and back.
watch([permsLoading, showUsersTab], () => {
  if (route.query.tab) return;
  if (permsLoading.value || !serverId.value) return;
  tab.value = showUsersTab.value ? 'users' : 'roles';
});
// Switching tab clears any selected role.
watch(tab, (t) => {
  if (t === route.query.tab) return;
  router.replace({ query: { ...route.query, tab: t, role: undefined } });
});
</script>
