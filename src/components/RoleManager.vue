<template>
  <v-card>
    <v-toolbar class="mb-4" color="transparent" density="compact" flat>
      <v-toolbar-title>
        <span class="text-subtitle-1">Roles</span>
      </v-toolbar-title>
      <template #prepend>
        <v-icon>mdi-account-box-multiple-outline</v-icon>
      </template>
      <v-spacer></v-spacer>
      <RoleDialog v-if="canCreateRole" :action-type="'add'" @role-input="roleInput" />
    </v-toolbar>
    <v-data-table
      v-if="canListRoles"
      height="75vh"
      items-per-page="50"
      fixed-header
      :headers="headers"
      hover
      :items="searchResults"
      :sort-by="[{ key: 'name', order: 'asc' }]"
      :items-per-page-options="[
        { title: '25 items', value: 25 },
        { title: '50 items', value: 50 },
      ]"
      :loading="loading"
      @update:options="paginationCheck">
      <template #top>
        <v-toolbar color="transparent" density="compact" flat>
          <v-spacer></v-spacer>
          <v-text-field
            v-model="searchRoles"
            label="Search roles"
            prepend-inner-icon="mdi-magnify"
            placeholder="Type to search roles"
            variant="underlined"
            hide-details
            clearable
            @update:model-value="searchRole"></v-text-field>
        </v-toolbar>
      </template>
      <template #item.name="{ item }">
        <td class="pointer-cursor" @click="getRole(item.id)">
          <span class="icon-text">
            <v-icon class="mr-2" color="info">mdi-account-box-multiple-outline</v-icon>
            {{ item.name }}
          </span>
        </td>
      </template>
      <template #item.actions="{ item }">
        <DeleteConfirmDialog
          v-if="item.can_delete"
          type="role"
          :name="item.name"
          @confirmed="deleteRole(item.id)" />
      </template>
      <template #no-data>
        <RoleDialog v-if="canCreateRole" :action-type="'add'" @role-input="roleInput" />
      </template>
    </v-data-table>
    <div v-else>You don't have permission to list roles</div>
  </v-card>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useFunctions } from '@/plugins/functions';
import { Role } from '@/gen/management/types.gen';
import router from '@/router';
import { Header } from '@/common/interfaces';
import { useVisualStore } from '@/stores/visual';
import { useProjectPermissions } from '@/composables/usePermissions';

const functions = useFunctions();
const visual = useVisualStore();

interface ExtendedRole extends Role {
  can_delete?: boolean;
}

const loadedRoles = reactive<ExtendedRole[]>([]);
const searchResults = reactive<ExtendedRole[]>([]);
const paginationTokenRole = ref('');
const loading = ref(false);
const searchRoles = ref('');

const role = reactive({
  name: '',
  description: '',
});

const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Description', key: 'description', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);

const projectId = computed(() => visual.projectSelected['project-id']);

// Use composable for project permissions
const { canListRoles, canCreateRole } = useProjectPermissions(projectId);

// Helper function to batch-load permissions for roles
async function loadPermissionsForRoles(roles: ExtendedRole[]): Promise<void> {
  await Promise.all(
    roles.map(async (role) => {
      const roleAction = await functions.getRoleAccessById(role.id);
      role.can_delete = roleAction.includes('delete');
    }),
  );
}

onMounted(async () => {
  try {
    if (canListRoles.value) {
      await loadRoles();
      searchResults.push(...loadedRoles);
    }
  } catch (error) {
    console.error(error);
  }
});

function getRole(id: string) {
  router.push(`/roles/${id}`);
}

async function loadRoles() {
  try {
    loading.value = true;
    loadedRoles.splice(0, loadedRoles.length);

    const data = await functions.listRoles(101);
    const initialRoles = (data.roles || []) as ExtendedRole[];

    paginationTokenRole.value = data['next-page-token'] || '';

    // Batch-load delete permissions for all roles in parallel
    await loadPermissionsForRoles(initialRoles);

    loadedRoles.push(...initialRoles);
  } catch (error) {
    console.error('Error loading roles:', error);
  } finally {
    loading.value = false;
  }
}

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
async function searchRole(search: string | null) {
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Debounce search by 300ms
  searchTimeout = setTimeout(async () => {
    try {
      searchResults.splice(0, searchResults.length);

      // If search is empty, null, or only whitespace, show loaded roles
      if (!search || search.trim() === '') {
        searchResults.push(...loadedRoles);
        return;
      }

      loading.value = true;
      const roleSearchOutput = await functions.searchRole(search.trim());

      // Batch-load permissions for search results
      const searchRolesWithActions = roleSearchOutput.map((role) => ({ ...role }) as ExtendedRole);
      await loadPermissionsForRoles(searchRolesWithActions);

      searchResults.push(...searchRolesWithActions);
    } catch (error) {
      console.error('Error searching roles:', error);
    } finally {
      loading.value = false;
    }
  }, 300);
}

async function paginationCheck(option: any) {
  if (searchRoles.value !== '' || loadedRoles.length >= 10000) return;

  const itemsNeeded = option.page * option.itemsPerPage;
  const bufferSize = Math.max(option.itemsPerPage, 50);
  const shouldLoadMore = itemsNeeded + bufferSize > loadedRoles.length;

  if (shouldLoadMore && paginationTokenRole.value) {
    try {
      const data = await functions.listRoles(100, paginationTokenRole.value);
      const loadedRolesTmp: ExtendedRole[] = (data.roles || []) as ExtendedRole[];

      paginationTokenRole.value = data['next-page-token'] || '';

      // Batch-load permissions for newly loaded roles
      await loadPermissionsForRoles(loadedRolesTmp);

      loadedRoles.push(...loadedRolesTmp);

      if (searchRoles.value === '') {
        searchResults.push(...loadedRolesTmp);
      }
    } catch (error) {
      console.error('Error in pagination:', error);
    }
  }
}

async function createRole() {
  try {
    await functions.createRole(role.name, role.description);
    await loadRoles();
    searchResults.splice(0, searchResults.length);
    searchResults.push(...loadedRoles);
  } catch (error) {
    console.error(error);
  }
}

async function deleteRole(roleId: string) {
  try {
    await functions.deleteRole(roleId);

    // Remove from both arrays efficiently
    const loadedIndex = loadedRoles.findIndex((r) => r.id === roleId);
    if (loadedIndex !== -1) loadedRoles.splice(loadedIndex, 1);

    const searchIndex = searchResults.findIndex((r) => r.id === roleId);
    if (searchIndex !== -1) searchResults.splice(searchIndex, 1);
  } catch (error) {
    console.error(error);
  }
}

function roleInput(roleIn: { name: string; description: string }) {
  role.name = roleIn.name;
  role.description = roleIn.description;
  createRole();
}
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
