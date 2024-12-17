<template>
  <v-tabs v-model="tab">
    <v-tab value="overview">overview</v-tab>
    <v-tab v-if="enabledAuthorization && enabledPermissions" value="permissions">Permissions</v-tab>
  </v-tabs>

  <v-card>
    <v-card-title>Role: {{ role.name }}</v-card-title>

    <v-card-subtitle>
      <div>Created At: {{ role['created-at'] }}</div>
      ID: {{ role.id }}
      <v-btn
        icon="mdi-content-copy"
        size="small"
        variant="flat"
        @click="functions.copyToClipboard(role.id)"></v-btn>
    </v-card-subtitle>
    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="overview">
        <v-card-text>
          <v-row>
            <v-col>
              <v-textarea
                v-model="role.description"
                label="Role description"
                placeholder="my role description"
                readonly
                style="max-width: 500px"></v-textarea>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn color="info" size="small" to="/roles" variant="outlined">Back</v-btn>
          <roleDialog
            v-if="role.name != ''"
            :action-type="'edit'"
            :role="role"
            @role-input="editRole" />
        </v-card-actions>
      </v-tabs-window-item>
      <v-tabs-window-item value="permissions">
        <PermissionManager
          v-if="loaded"
          :assignable-obj="role"
          :existing-permissions-from-obj="existingPermissions"
          :relation-type="type"
          @permissions="assign" />
      </v-tabs-window-item>
    </v-tabs-window>
  </v-card>
</template>
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { RoleAssignment } from '../../gen/management/types.gen';
import { useFunctions } from '../../plugins/functions';
import { AssignmentCollection, RelationType } from '../../common/interfaces';
import { enabledAuthorization, enabledPermissions } from '@/app.config';
import { useVisualStore } from '@/stores/visual';

const functions = useFunctions();
const route = useRoute();
const loaded = ref(true);
const params = computed(() => route.params as { id: string });
const tab = ref('overview');
const type = ref<RelationType>('role');
const visual = useVisualStore();

const permissions = reactive<
  { id: string; name: string; email: string; type: string[]; kind: string }[]
>([]);

const existingPermissions = reactive<RoleAssignment[]>([]);

const role = reactive<any>({
  id: '',
  description: '',
  name: '',
});

onMounted(async () => {
  await init();
});

const rolePermissions = reactive<RoleAssignment[]>([]);
async function init() {
  rolePermissions.splice(0, rolePermissions.length);
  permissions.splice(0, permissions.length);
  Object.assign(role, await functions.getRole(params.value.id));
  Object.assign(rolePermissions, await functions.getRoleAssignmentsById(params.value.id));

  existingPermissions.splice(0, existingPermissions.length);

  Object.assign(existingPermissions, rolePermissions);

  for (const permission of rolePermissions) {
    const serachUser: any = permission;

    if (serachUser.user) {
      const user = await functions.getUser(serachUser.user);
      const idx = permissions.findIndex((a) => a.id === user.id);
      if (user) {
        if (idx === -1) {
          permissions.push({
            id: user.id,
            name: user.name,
            email: user.email ?? '',
            type: [permission.type],
            kind: 'user',
          });
        } else {
          permissions[idx].type.push(permission.type);
        }
      }
    } else {
      const fetchedRole = await functions.getRole(serachUser.role);
      const idx = permissions.findIndex((a) => a.id === fetchedRole.id);

      if (fetchedRole) {
        if (idx === -1) {
          permissions.push({
            id: fetchedRole.id,
            name: fetchedRole.name,
            email: '',
            type: [permission.type],
            kind: 'role',
          });
        } else {
          permissions[idx].type.push(permission.type);
        }
      }
    }
  }
}

async function assign(permissionChanges: {
  del: AssignmentCollection;
  writes: AssignmentCollection;
}) {
  try {
    loaded.value = false;
    const del = permissionChanges.del as RoleAssignment[];
    const writes = permissionChanges.writes as RoleAssignment[];

    await functions.updateRoleAssignmentsById(params.value.id, del, writes);
    await init();
    loaded.value = true;
  } catch (error) {
    console.error(error);
  } finally {
    await init();
    loaded.value = true;
  }
}

async function editRole(roleIn: { name: string; description: string }) {
  await functions.updateRole(role.id, roleIn.name, roleIn.description);
  await init();
}
</script>
