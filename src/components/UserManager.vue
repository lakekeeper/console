<template>
  <v-data-table
    height="75vh"
    items-per-page="50"
    fixed-header
    :headers="headers"
    hover
    :items="loadedUsers"
    :sort-by="[{ key: 'name', order: 'asc' }]"
    :items-per-page-options="[
      { title: '25 items', value: 25 },
      { title: '50 items', value: 50 },
    ]"
    @update:options="$emit('paginationCheck', $event)">
    <template #item.actions="{ item }">
      <span v-for="(action, i) in item.actions" :key="i" class="mr-2">
        <user-rename-dialog
          v-if="action == 'rename'"
          :id="item.id"
          :name="item.name"
          :status="props.status"
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

import { Header } from '@/common/interfaces';
import { useFunctions } from '@/plugins/functions';
import { StatusIntent } from '@/common/enums';
import DialogDeleteConfirm from '@/components/dialogDeleteConfirm.vue';
const functions = useFunctions();

const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Email', key: 'email', align: 'start' },
  { title: 'Id', key: 'id', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]);

const props = defineProps<{
  loadedUsers: (User & { actions: string[] })[];
  canDeleteUsers: boolean;
  status: StatusIntent;
}>();

const emit = defineEmits<{
  (e: 'deletedUser', user: User): void;
  (e: 'renameUserName', user: { name: string; id: string }): void;
  (e: 'paginationCheck', options: any): void;
}>();

async function deleteUser(user: User) {
  try {
    await functions.deleteUser(user.id);
    emit('deletedUser', user);
  } catch (error) {
    console.error(error);
  }
}

function renameUser(user: { name: string; id: string }) {
  emit('renameUserName', user);
}
</script>
