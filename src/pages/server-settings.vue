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
  <v-row>
    <v-col>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="overview">
          <v-card class="ml-2">
            <v-list-item class="mb-12" two-line>
              <div class="text-overline mb-4">Server Information</div>
              <v-list-item-title class="text-h7 mb-1">
                Server ID: {{ projectInfo['server-id'] }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <div>Server Version: {{ projectInfo.version }}</div>
                <div>Bootstraped: {{ projectInfo.bootstrapped }}</div>
                <div>Authenticated by: {{ projectInfo['authz-backend'] }}</div>
                <div v-if="projectInfo['aws-system-identities-enabled']">
                  AWS system identities:
                  {{ projectInfo['aws-system-identities-enabled'] ? 'enabled' : 'disabled' }}
                </div>

                <div v-if="projectInfo['azure-system-identities-enabled']">
                  Azure system identities:
                  {{ projectInfo['azure-system-identities-enabled'] ? 'enabled' : 'disabled' }}
                </div>
                <div v-if="projectInfo['gcp-system-identities-enabled']">
                  GCP system identities:
                  {{ projectInfo['gcp-system-identities-enabled'] ? 'enabled' : 'disabled' }}
                </div>
                <div
                  v-if="
                    !projectInfo['aws-system-identities-enabled'] &&
                    !projectInfo['azure-system-identities-enabled'] &&
                    !projectInfo['gcp-system-identities-enabled']
                  ">
                  No system identities are used
                </div>
              </v-list-item-subtitle>
            </v-list-item>
          </v-card>
        </v-tabs-window-item>
        <v-tabs-window-item
          v-if="canReadAssignments && enabledAuthentication && enabledPermissions"
          value="permissions">
          <v-card>
            <PermissionManager
              v-if="loaded && enabledPermissions"
              :status="assignStatus"
              :assignable-obj="permissionObject"
              :existing-permissions-from-obj="existingAssignments"
              :relation-type="permissionType"
              @permissions="assign" />
          </v-card>
        </v-tabs-window-item>
        <v-tabs-window-item v-if="canListUsers && enabledAuthentication" value="users">
          <v-card>
            <v-progress-linear v-if="tab === 'users' && !usersLoaded" indeterminate />
            <UserManager
              v-if="usersLoaded"
              :can-delete-users="canDeleteUsers"
              :loaded-users="loadedUsers"
              :status="status"
              @deleted-user="handleUserDeleted"
              @rename-user-name="renameUser"
              @pagination-check="paginationCheckUsers" />
          </v-card>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { useVisualStore } from '@/stores/visual';
import { useFunctions } from '@/plugins/functions';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ServerAction, ServerAssignment, User } from '@/gen/management/types.gen';
import { AssignmentCollection, RelationType } from '@/common/interfaces';
import { enabledAuthentication, enabledPermissions } from '@/app.config';
import { StatusIntent } from '@/common/enums';

const tab = ref('overview');
const visual = useVisualStore();
const functions = useFunctions();
const serverAssignments = reactive<ServerAssignment[]>([]);
const loaded = ref(true);
const permissionType = ref<RelationType>('server');
const status = ref(StatusIntent.INACTIVE);
const usersLoaded = ref(false);

const permissionObject = reactive<any>({
  id: '',
  description: '',
  name: 'Server',
});
const myAccess = reactive<ServerAction[]>([]);
const canReadAssignments = ref(false);
const canListUsers = ref(false);
const canCreateProject = ref(false);
const canDeleteUsers = ref(false);
const canGrantAdmin = ref(false);
const canProvisionUsers = ref(false);
const canUpdateUsers = ref(false);
const assignStatus = ref(StatusIntent.INACTIVE);

const loadedUsers: (User & { actions: string[] })[] = reactive([]);
const paginationTokenUser = ref('');

const assignments = reactive<
  { id: string; name: string; email: string; type: string; kind: string }[]
>([]);

const existingAssignments = reactive<ServerAssignment[]>([]);

async function init() {
  permissionObject.id = visual.getServerInfo()['server-id'];

  await functions.getServerInfo();

  await getMyAccess();

  // Only load server access, not users - users will be loaded when tab is clicked
  await getServerAccess();
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
  canCreateProject.value = !!myAccess.includes('create_project');
  canDeleteUsers.value = !!myAccess.includes('delete_users');
  canGrantAdmin.value = !!myAccess.includes('grant_admin');
  canProvisionUsers.value = !!myAccess.includes('provision_users');
  canUpdateUsers.value = !!myAccess.includes('update_users');
}

async function handleUserDeleted(deletedUser: User) {
  // Remove the deleted user from the loaded users array to preserve pagination
  const index = loadedUsers.findIndex((user) => user.id === deletedUser.id);
  if (index !== -1) {
    loadedUsers.splice(index, 1);
  }
}

async function paginationCheckUsers(option: any) {
  if (loadedUsers.length >= 10000) return;

  // Check if we're at or near the end of loaded data and have more data to load
  const currentlyDisplayed = option.page * option.itemsPerPage;
  const isNearEnd = currentlyDisplayed >= loadedUsers.length - option.itemsPerPage;

  if (isNearEnd && paginationTokenUser.value != '') {
    const data = await functions.listUser(paginationTokenUser.value);

    // Directly assign the users array and cast to the proper type
    const loadedUsersTmp: (User & { actions: string[] })[] = (data.users || []) as (User & {
      actions: string[];
    })[];
    paginationTokenUser.value = data['next-page-token'] || '';

    loadedUsersTmp.forEach((user) => {
      user.actions = [];
      if (user['user-type'] === 'application') {
        user.actions.push('rename');
      }
      user.actions.push('delete');
    });

    loadedUsers.push(...loadedUsersTmp);
  }
}

async function listUsers() {
  try {
    if (!canListUsers.value) return;
    loadedUsers.splice(0, loadedUsers.length);

    const data = await functions.listUser();

    // Directly assign the users array instead of using Object.assign
    const initialUsers = (data.users || []) as (User & { actions: string[] })[];
    loadedUsers.push(...initialUsers);

    if (data['next-page-token']) {
      paginationTokenUser.value = data['next-page-token'];
    } else {
      paginationTokenUser.value = '';
    }

    loadedUsers.forEach((user) => {
      user.actions = [];
      if (user['user-type'] === 'application') {
        user.actions.push('rename');
      }
      user.actions.push('delete');
    });
  } catch (error) {
    console.error('Error in listUsers:', error);
  }
}

async function getServerAccess() {
  try {
    serverAssignments.splice(0, serverAssignments.length);
    assignments.splice(0, assignments.length);

    Object.assign(
      serverAssignments,
      canReadAssignments.value ? await functions.getServerAssignments() : [],
    );

    existingAssignments.splice(0, existingAssignments.length);
    Object.assign(existingAssignments, serverAssignments);

    for (const assignment of serverAssignments) {
      const searchUser: any = assignment;

      if (searchUser.user) {
        const user = await functions.getUser(searchUser.user);

        if (user) {
          assignments.push({
            id: user.id,
            name: user.name,
            email: user.email ?? '',
            type: assignment.type,
            kind: 'user',
          });
        }
      } else {
        const role = await functions.getRole(searchUser.role);
        if (role) {
          assignments.push({
            id: role.id,
            name: role.name,
            email: '',
            type: assignment.type,
            kind: 'role',
          });
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function assign(item: { del: AssignmentCollection; writes: AssignmentCollection }) {
  try {
    loaded.value = false;
    assignStatus.value = StatusIntent.STARTING;
    const del = item.del as ServerAssignment[]; // Define 'del' variable
    const writes = item.writes as ServerAssignment[]; // Define 'del' variable

    await functions.updateServerAssignments(del, writes);
    assignStatus.value = StatusIntent.SUCCESS;
    await init();
    loaded.value = true;
  } catch (error) {
    console.error(error);

    assignStatus.value = StatusIntent.FAILURE;
  } finally {
    await init();
    loaded.value = true;
  }
}

onMounted(async () => {
  await init();
});

// Watch for tab changes and load users when users tab is selected
watch(tab, async (newTab) => {
  if (newTab === 'users' && !usersLoaded.value && canListUsers.value) {
    await listUsers();
    usersLoaded.value = true;
  }
});

const projectInfo = computed(() => {
  return visual.getServerInfo();
});

async function renameUser(user: { name: string; id: string }) {
  try {
    status.value = StatusIntent.STARTING;

    await functions.updateUserById(user.name, user.id);
    // Refresh the user list after rename
    await listUsers();
    status.value = StatusIntent.SUCCESS;
  } catch (error) {
    console.error(error);
  }
}
</script>
