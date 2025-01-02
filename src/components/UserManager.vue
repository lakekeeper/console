<template>
  <v-data-table
    fixed-header
    :headers="headers"
    hover
    :items="users"
    :sort-by="[{ key: 'name', order: 'asc' }]">
    <template #item.actions="{ item }">
      <span v-for="(action, i) in item.actions" :key="i">
        <user-rename-dialog
          v-if="action == 'rename'"
          :id="item.id"
          :name="item.name"
          :status="props.status"
          @rename-user-name="renameUser"></user-rename-dialog>

        <v-icon v-else color="error" :disabled="!props.canDeleteUsers" @click="deleteUser(item)">
          mdi-delete-outline
        </v-icon>
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
      <div>No deleted tabulars in this namespace</div>
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue';
import { User } from '@/gen/management/types.gen';

import { Header } from '@/common/interfaces';
import { useFunctions } from '@/plugins/functions';
import { StatusIntent } from '@/common/enums';
const functions = useFunctions();

const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Email', key: 'email', align: 'start' },
  { title: 'Id', key: 'id', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);

const users: (User & { actions: any })[] = reactive([]);

const props = defineProps<{
  loadedUsers: User[];
  canDeleteUsers: boolean;
  status: StatusIntent;
}>();

const emit = defineEmits<{
  (e: 'deletedUser'): void;
  (e: 'renameUserName', user: { name: string; id: string }): void;
}>();

async function init() {
  users.splice(0, users.length);
  Object.assign(users, props.loadedUsers);

  for (const user of users) {
    user.actions = [];

    if (user['user-type'] === 'application') {
      user.actions.push('rename');
    }
    user.actions.push('delete');
  }
}

async function deleteUser(user: User) {
  try {
    await functions.deleteUser(user.id);
    emit('deletedUser');
  } catch (error) {
    console.error(error);
  }
}

onMounted(async () => {
  await init();
});

function renameUser(user: { name: string; id: string }) {
  emit('renameUserName', { name: user.name, id: user.id });
}
</script>
