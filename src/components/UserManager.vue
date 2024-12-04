<template>
  <v-data-table
    :headers="headers"
    fixed-header
    hover
    :items="props.loadedUsers"
    :sort-by="[{ key: 'name', order: 'asc' }]"
  >
    <template v-slot:item.actions="{ item }">
      <v-icon
        :disabled="!props.canDeleteUsers"
        @click="deleteUser(item)"
        color="error"
        >mdi-delete-outline</v-icon
      >
    </template>
    <template v-slot:no-data>
      <div>No deleted tabulars in this namespace</div>
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { User } from "@/gen/management/types.gen";

import { Header } from "@/common/interfaces";
import { useFunctions } from "@/plugins/functions";
const functions = useFunctions();

const headers: readonly Header<any>[] = Object.freeze([
  { title: "Name", key: "name", align: "start" },
  { title: "Email", key: "email", align: "start" },
  { title: "Email", key: "email", align: "start" },
  { title: "Actions", key: "actions", align: "end", sortable: false },
]);
// {
//     "name": "Peter Cold",
//     "email": "peter@example.com",
//     "id": "oidc~f1616ed0-18d8-48ea-9fb3-832f42db0b1b",
//     "user-type": "human",
//     "last-updated-with": "create-endpoint",
//     "created-at": "2024-12-01T14:13:05.974528Z",
//     "updated-at": "2024-12-01T14:48:52.949102Z"
// }

const users: (User & { actions: any })[] = reactive([]);

const props = defineProps<{
  loadedUsers: User[];
  canDeleteUsers: boolean;
}>();

const emit = defineEmits<{
  (e: "deleted-user"): void;
}>();

async function init() {
  users.splice(0, users.length);
  Object.assign(users, props.loadedUsers);
  users.every((user) => {
    user.actions = ["delete"];
  });
}

async function deleteUser(user: User) {
  try {
    await functions.deleteUser(user.id);
    emit("deleted-user");
  } catch (error) {
    console.error(error);
  }
}

onMounted(async () => {
  await init();
});
</script>
