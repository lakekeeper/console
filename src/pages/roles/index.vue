<template>
  <v-container v-if="loading" class="fill-height">
    <v-responsive class="align-centerfill-height mx-auto" max-width="900">
      <v-row justify="center">
        <v-progress-circular
          class="mt-4"
          color="info"
          indeterminate
          :size="126"></v-progress-circular>
      </v-row>

      >
    </v-responsive>
  </v-container>
  <span v-else>
    <v-row class="ml-1">
      <v-col>
        <v-toolbar class="mb-4" color="transparent" density="compact" flat>
          <v-toolbar-title>
            <span class="text-subtitle-1">Roles</span>
          </v-toolbar-title>
          <template #prepend>
            <v-icon>mdi-account-box-multiple-outline</v-icon>
          </template>
          <v-spacer></v-spacer>
          <roleDialog :action-type="'add'" @role-input="roleInput" />
        </v-toolbar>
        <v-data-table
          v-if="canListRoles"
          fixed-header
          :headers="headers"
          hover
          :items="roles"
          :sort-by="[{ key: 'name', order: 'asc' }]">
          <template #item.name="{ item }">
            <td class="pointer-cursor" @click="getRole(item.id)">
              <span class="icon-text">
                <v-icon class="mr-2" color="info">mdi-account-box-multiple-outline</v-icon>
                {{ item.name }}
              </span>
            </td>
          </template>
          <template #item.actions="{ item }">
            <span icon-text>
              <v-icon
                class="mr-1"
                color="error"
                :disabled="!item.can_delete"
                @click="deleteRole(item.id)">
                mdi-delete-outline
              </v-icon>
            </span>
          </template>
          <template #no-data>
            <roleDialog
              v-if="myAccess.includes('create_role')"
              :action-type="'add'"
              @role-input="roleInput" />
          </template>
        </v-data-table>
        <div v-else>You don't have permission to list roles</div>
      </v-col>
    </v-row>
  </span>
</template>
<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { useFunctions } from '../../plugins/functions';
import { ProjectAction, Role } from '../../gen/management/types.gen';
import router from '../../router';
import { Header } from '../../common/interfaces';
import { useVisualStore } from '@/stores/visual';

const functions = useFunctions();
interface ExtendedRole extends Role {
  can_delete?: boolean;
}

const roles = reactive<ExtendedRole[]>([]);
const loading = ref(true);
const missAccessPermission = ref(true);

const role = reactive({
  name: '',
  description: '',
});
const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Description', key: 'description', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);

const isDialogActive = ref(false); // Declare the isDialogActive property
const myAccess = reactive<ProjectAction[]>([]);
const canListRoles = ref(false);

const visual = useVisualStore();

onMounted(async () => {
  try {
    Object.assign(
      myAccess,
      await functions.getProjectAccessById(visual.projectSelected['project-id']),
    );
    canListRoles.value = myAccess.includes('list_roles');
    if (canListRoles.value) await listRoles();
    loading.value = false;
  } catch (error) {
    missAccessPermission.value = false;
    console.error(error);
  }
});

function getRole(id: string) {
  router.push(`/roles/${id}`);
}

async function listRoles() {
  try {
    roles.splice(0, roles.length);
    const r = await functions.listRoles();

    Object.assign(roles, r);

    for (const role of roles) {
      const roleAction = await functions.getRoleAccessById(role.id);
      role.can_delete = roleAction.includes('delete');
    }
  } catch (error) {
    missAccessPermission.value = false;
    console.error('Failed to load data:', error);
  }
}

async function createRole() {
  try {
    await functions.createRole(role.name, role.description);
    isDialogActive.value = false;
    await listRoles();
  } catch (error) {
    console.error(error);
  }
}

async function deleteRole(roleId: string) {
  try {
    await functions.deleteRole(roleId);

    isDialogActive.value = false;

    await listRoles();
  } catch (error) {
    console.error(error);
  }
}

function roleInput(roleIn: { name: string; description: string }) {
  role.name = roleIn.name;
  role.description = roleIn.description;

  createRole();
}

onUnmounted(() => {
  roles.splice(0, roles.length);
  loading.value = true;
});
</script>

<style scoped>
.pointer-cursor {
  cursor: pointer;
}

.icon-text {
  display: flex;
  align-items: center;
}
</style>
