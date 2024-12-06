<template>
  <v-tabs v-model="tab">
    <v-tab value="overview">overview</v-tab>
    <v-tab value="permissions" v-if="canReadAssignments && enabledAuthorization"
      >Permissions
    </v-tab>
    <v-tab value="users" v-if="canListUsers && enabledAuthorization"
      >users</v-tab
    >
  </v-tabs>
  <v-row>
    <v-col cols="10">
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="overview">
          <v-card class="ml-2">
            <v-list-item two-line class="mb-12">
              <div class="text-overline mb-4">Server Information</div>
              <v-list-item-title class="text-h7 mb-1">
                Server ID: {{ projectInfo["server-id"] }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <div>Server Version: {{ projectInfo.version }}</div>
                <div>Bootstraped: {{ projectInfo.bootstrapped }}</div>
                <div>Authenticated by: {{ projectInfo["authz-backend"] }}</div>
              </v-list-item-subtitle>
            </v-list-item>
          </v-card>
        </v-tabs-window-item>
        <v-tabs-window-item
          value="permissions"
          v-if="canReadAssignments && enabledAuthorization"
        >
          <v-card>
            <PermissionManager
              v-if="loaded"
              :assignableObj="permissionObject"
              :relationType="permissionType"
              :existingPermissionsFromObj="existingAssignments"
              @permissions="assign"
            />
          </v-card>
        </v-tabs-window-item>
        <v-tabs-window-item
          value="users"
          v-if="canListUsers && enabledAuthorization"
        >
          <v-card>
            <v-row justify="center" v-if="users.length === 0">
              <v-progress-circular
                class="mt-4"
                :size="126"
                indeterminate
                color="info"
              ></v-progress-circular>
            </v-row>
            <UserManager
              v-else
              :loadedUsers="users"
              :status="status"
              :can-delete-users="canDeleteUsers"
              @deleted-user="listUser"
              @rename-user-name="renameUser"
            />
          </v-card>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { useVisualStore } from "@/stores/visual";
import { useFunctions } from "@/plugins/functions";
import { onMounted, ref, reactive, computed } from "vue";
import {
  ServerAction,
  ServerAssignment,
  User,
} from "@/gen/management/types.gen";
import { AssignmentCollection, RelationType } from "@/common/interfaces";
import { enabledAuthorization } from "@/app.config";
import { StatusIntent } from "@/common/enums";

const tab = ref("overview");
const visual = useVisualStore();
const functions = useFunctions();
const serverAssignments = reactive<ServerAssignment[]>([]);
const loaded = ref(true);
const permissionType = ref<RelationType>("server");
const status = ref(StatusIntent.INACTIVE);

const permissionObject = reactive<any>({
  id: "",
  description: "",
  name: "Server",
});
const myAccess = reactive<ServerAction[]>([]);
const canReadAssignments = ref(false);
const canListUsers = ref(false);
const canCreateProject = ref(false);
const canDeleteUsers = ref(false);
const canGrantAdmin = ref(false);
const canProvisionUsers = ref(false);
const canUpdateUsers = ref(false);

const users = reactive<User[]>([]);

const assignments = reactive<
  { id: string; name: string; email: string; type: string; kind: string }[]
>([]);

const existingAssignments = reactive<ServerAssignment[]>([]);

async function init() {
  permissionObject.id = visual.projectInfo["server-id"];

  await functions.getServerInfo();

  await getMyAccess();

  Promise.all([listUser(), getServerAccess()]);
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
  canReadAssignments.value = myAccess.includes("read_assignments")
    ? true
    : false;

  canListUsers.value = myAccess.includes("list_users") ? true : false;
  canCreateProject.value = myAccess.includes("create_project") ? true : false;
  canDeleteUsers.value = myAccess.includes("delete_users") ? true : false;
  canGrantAdmin.value = myAccess.includes("grant_admin") ? true : false;
  canProvisionUsers.value = myAccess.includes("provision_users") ? true : false;
  canUpdateUsers.value = myAccess.includes("update_users") ? true : false;
}

async function listUser() {
  try {
    if (!canListUsers.value) return;
    users.splice(0, users.length);
    console.log("server-settings", users);
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
      canReadAssignments.value ? await functions.getServerAssignments() : []
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
            email: user.email ?? "",
            type: assignment.type,
            kind: "user",
          });
        }
      } else {
        const role = await functions.getRole(searchUser.role);
        if (role) {
          assignments.push({
            id: role.id,
            name: role.name,
            email: "",
            type: assignment.type,
            kind: "role",
          });
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function assign(assignments: {
  del: AssignmentCollection;
  writes: AssignmentCollection;
}) {
  try {
    loaded.value = false;
    const del = assignments.del as ServerAssignment[]; // Define 'del' variable
    const writes = assignments.writes as ServerAssignment[]; // Define 'del' variable

    await functions.updateServerAssignments(del, writes);
    await init();
    loaded.value = true;
  } catch (error) {
    console.error(error);
  } finally {
    await init();
    loaded.value = true;
  }
}

onMounted(async () => {
  await init();
});

const projectInfo = computed(() => {
  return visual.projectInfo;
});

async function renameUser(user: { name: string; id: string }) {
  try {
    status.value = StatusIntent.STARTING;
    console.log("server-settings", user);
    await functions.updateUserById(user.name, user.id);
    await listUser();
    status.value = StatusIntent.SUCCESS;
  } catch (error) {
    console.error(error);
  }
}
</script>
