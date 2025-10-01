<template>
  <v-data-table
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
          v-model="searchUsers"
          label="Search users"
          prepend-inner-icon="mdi-magnify"
          placeholder="Type to search users"
          variant="underlined"
          hide-details
          clearable
          @update:model-value="searchUser"></v-text-field>
      </v-toolbar>
    </template>
    <template #item.actions="{ item }">
      <span v-for="(action, i) in item.actions" :key="i" class="mr-2">
        <user-rename-dialog
          v-if="action == 'rename'"
          :id="item.id"
          :name="item.name"
          :status="renameStatus"
          @rename-user-name="renameUser"></user-rename-dialog>
        <DialogDeleteConfirm
          v-else-if="action === 'delete'"
          type="user"
          :name="item.name"
          :disabled="!props.canDeleteUsers"
          @confirmed="deleteUser(item)" />
      </span>
    </template>

    <template #item.id="{ item }">
      <td>
        <span class="icon-text">
          {{ item.id }}
          <v-btn
            icon="mdi-content-copy"
            size="small"
            variant="flat"
            @click="functions.copyToClipboard(item.id)"></v-btn>
        </span>
      </td>
    </template>

    <template #item.name="{ item }">
      <td>
        <span class="icon-text">
          <v-icon v-if="item['user-type'] === 'application'" class="mr-2">
            mdi-robot-happy-outline
          </v-icon>
          <v-icon v-else class="mr-2">mdi-account-circle-outline</v-icon>
          {{ item.name }}
        </span>
      </td>
    </template>

    <template #no-data>
      <div>No users found</div>
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
import { User } from '@/gen/management/types.gen';
import { reactive, ref, onMounted } from 'vue';
import { Header } from '@/common/interfaces';
import { useFunctions } from '@/plugins/functions';
import { StatusIntent } from '@/common/enums';
import DialogDeleteConfirm from '@/components/dialogDeleteConfirm.vue';
import UserRenameDialog from '@/components/UserRenameDialog.vue';
const functions = useFunctions();

const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Email', key: 'email', align: 'start' },
  { title: 'Id', key: 'id', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);

const props = defineProps<{
  canDeleteUsers: boolean;
  status: StatusIntent;
  canListUsers: boolean;
}>();

const emit = defineEmits<{
  (e: 'deletedUser', user: User): void;
}>();

// Internal state for pagination
const loadedUsers: (User & { actions: string[] })[] = reactive([]);
const searchResults: (User & { actions: string[] })[] = reactive([]);
const paginationTokenUser = ref('');
const loading = ref(false);
const searchUsers = ref('');
const renameStatus = ref(StatusIntent.INACTIVE);

async function loadUsers() {
  if (!props.canListUsers) return;

  try {
    loading.value = true;
    loadedUsers.splice(0, loadedUsers.length);

    console.log('Initial load starting...');
    // Load more than the default display amount to always stay ahead
    const data = await functions.listUser(undefined, 100);

    // Directly assign the users array instead of using Object.assign
    const initialUsers = (data.users || []) as (User & { actions: string[] })[];
    loadedUsers.push(...initialUsers);

    if (data['next-page-token']) {
      paginationTokenUser.value = data['next-page-token'];
      console.log('Set initial pagination token:', data['next-page-token']);
    } else {
      paginationTokenUser.value = '';
      console.log('No initial pagination token');
    }

    loadedUsers.forEach((user) => {
      user.actions = [];
      if (user['user-type'] === 'application') {
        user.actions.push('rename');
      }
      user.actions.push('delete');
    });

    console.log('Initial load complete. Users loaded:', loadedUsers.length);
  } catch (error) {
    console.error('Error in loadUsers:', error);
  } finally {
    loading.value = false;
  }
}

async function searchUser(search: string) {
  try {
    searchResults.splice(0, searchResults.length);
    if (search === '') {
      // If search is empty, show the loaded users
      searchResults.push(...loadedUsers);
      return;
    }

    loading.value = true;
    const userSearchOutput = await functions.searchUser(search);

    // Add actions to search results
    const searchUsersWithActions = userSearchOutput.map((user: User) => ({
      ...user,
      actions: user['user-type'] === 'application' ? ['rename', 'delete'] : ['delete'],
    })) as (User & { actions: string[] })[];

    searchResults.push(...searchUsersWithActions);
  } catch (error) {
    console.error('Error searching users:', error);
  } finally {
    loading.value = false;
  }
}

async function paginationCheck(option: any) {
  // If there's a search query, don't do pagination - search handles its own results
  if (searchUsers.value !== '') {
    return;
  }

  if (loadedUsers.length >= 10000) return;

  // Always stay ahead by loading more data when we're getting close to the end
  // Load more when we need more items than currently loaded, ensuring we always have a buffer
  const itemsNeeded = option.page * option.itemsPerPage;
  const bufferSize = Math.max(option.itemsPerPage, 50); // Always maintain at least 50 item buffer
  const shouldLoadMore = itemsNeeded + bufferSize > loadedUsers.length;

  console.log('Pagination check:', {
    page: option.page,
    itemsPerPage: option.itemsPerPage,
    itemsNeeded,
    bufferSize,
    loadedUsersLength: loadedUsers.length,
    shouldLoadMore,
    hasToken: !!paginationTokenUser.value,
    token: paginationTokenUser.value,
  });

  if (shouldLoadMore && paginationTokenUser.value !== '') {
    try {
      console.log('Loading more users...');
      const data = await functions.listUser(paginationTokenUser.value, 100);

      // Directly assign the users array and cast to the proper type
      const loadedUsersTmp: (User & { actions: string[] })[] = (data.users || []) as (User & {
        actions: string[];
      })[];
      paginationTokenUser.value = data['next-page-token'] || '';

      console.log(
        'Loaded',
        loadedUsersTmp.length,
        'more users. New token:',
        paginationTokenUser.value,
      );

      loadedUsersTmp.forEach((user) => {
        user.actions = [];
        if (user['user-type'] === 'application') {
          user.actions.push('rename');
        }
        user.actions.push('delete');
      });

      loadedUsers.push(...loadedUsersTmp);

      // If no search is active, also update search results
      if (searchUsers.value === '') {
        searchResults.push(...loadedUsersTmp);
      }

      console.log('Total users now:', loadedUsers.length);
    } catch (error) {
      console.error('Error in pagination:', error);
    }
  } else {
    console.log(
      'Pagination condition not met - shouldLoadMore:',
      shouldLoadMore,
      'hasToken:',
      !!paginationTokenUser.value,
    );
  }
}

async function deleteUser(user: User) {
  try {
    await functions.deleteUser(user.id);

    // Remove the deleted user from both loaded users and search results arrays
    const loadedIndex = loadedUsers.findIndex((u) => u.id === user.id);
    if (loadedIndex !== -1) {
      loadedUsers.splice(loadedIndex, 1);
    }

    const searchIndex = searchResults.findIndex((u) => u.id === user.id);
    if (searchIndex !== -1) {
      searchResults.splice(searchIndex, 1);
    }

    emit('deletedUser', user);
  } catch (error) {
    console.error(error);
  }
}

async function renameUser(user: { name: string; id: string }) {
  try {
    renameStatus.value = StatusIntent.STARTING;
    await functions.updateUserById(user.name, user.id);
    renameStatus.value = StatusIntent.SUCCESS;

    // Update the user in both loaded users and search results arrays
    const loadedUserIndex = loadedUsers.findIndex((u) => u.id === user.id);
    if (loadedUserIndex !== -1) {
      loadedUsers[loadedUserIndex].name = user.name;
    }

    const searchUserIndex = searchResults.findIndex((u) => u.id === user.id);
    if (searchUserIndex !== -1) {
      searchResults[searchUserIndex].name = user.name;
    }
  } catch (error) {
    console.error(error);
    renameStatus.value = StatusIntent.FAILURE;
  }
}

// Load users when component mounts
onMounted(async () => {
  if (props.canListUsers) {
    await loadUsers();
    // Initialize search results with loaded users
    searchResults.push(...loadedUsers);
  }
});

// Expose loadUsers function for parent component to call if needed
defineExpose({
  loadUsers,
});
</script>
