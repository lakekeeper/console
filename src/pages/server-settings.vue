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
    <v-col cols="10">
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
            <v-row v-if="users.length === 0" justify="center">
              <v-progress-circular
                class="mt-4"
                color="info"
                indeterminate
                :size="126"></v-progress-circular>
            </v-row>
            <UserManager
              v-else
              :can-delete-users="canDeleteUsers"
              :loaded-users="users"
              :status="status"
              @deleted-user="listUser"
              @rename-user-name="renameUser" />
          </v-card>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { useVisualStore } from '@/stores/visual';
import { useFunctions } from '@/plugins/functions';
import { computed, onMounted, reactive, ref } from 'vue';
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

const users = reactive<User[]>([]);
const assignments = reactive<
  { id: string; name: string; email: string; type: string; kind: string }[]
>([]);

const existingAssignments = reactive<ServerAssignment[]>([]);

async function init() {
  permissionObject.id = visual.getServerInfo()['server-id'];

  await functions.getServerInfo();

  await getMyAccess();

  await Promise.all([listUser(), getServerAccess()]);
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

async function listUser() {
  try {
    if (!canListUsers.value) return;
    users.splice(0, users.length);

    Object.assign(users, await functions.listUser());
  } catch (error) {
    console.error(error);
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
    assignStatus.value = StatusIntent.FAILURE;
  } finally {
    await init();
    loaded.value = true;
  }
}

onMounted(async () => {
  await init();
});

const projectInfo = computed(() => {
  return visual.getServerInfo();
});

async function renameUser(user: { name: string; id: string }) {
  try {
    status.value = StatusIntent.STARTING;

    await functions.updateUserById(user.name, user.id);
    await listUser();
    status.value = StatusIntent.SUCCESS;
  } catch (error) {
    console.error(error);
  }
}
</script>
