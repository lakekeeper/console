<template>
  <v-data-table
    :headers="headers"
    fixed-header
    hover
    :items="users"
    :sort-by="[{ key: 'name', order: 'asc' }]"
  >
    <template v-slot:item.actions="{ item }">
      <span v-for="(action, i) in item.actions" :key="i">
        <user-rename-dialog
          v-if="action == 'rename'"
          :name="item.name"
          :id="item.id"
          :status="props.status"
          @rename-user-name="renameUser"
        ></user-rename-dialog>

        <v-icon
          v-else
          :disabled="!props.canDeleteUsers"
          @click="deleteUser(item)"
          color="error"
          >mdi-delete-outline</v-icon
        >
      </span>
    </template>

    <template v-slot:item.name="{ item }">
      <td>
        <span class="icon-text">
          <v-icon class="mr-2" v-if="item['user-type'] === 'application'"
            >mdi-robot-happy-outline</v-icon
          >
          <v-icon class="mr-2" v-else>mdi-account-circle-outline</v-icon>
          {{ item.name }}</span
        >
      </td>
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
import { StatusIntent } from "@/common/enums";
const functions = useFunctions();

const headers: readonly Header<any>[] = Object.freeze([
  { title: "Name", key: "name", align: "start" },
  { title: "Email", key: "email", align: "start" },
  { title: "Email", key: "email", align: "start" },
  { title: "Actions", key: "actions", align: "end", sortable: false },
]);

const users: (User & { actions: any })[] = reactive([]);

const props = defineProps<{
  loadedUsers: User[];
  canDeleteUsers: boolean;
  status: StatusIntent;
}>();

const emit = defineEmits<{
  (e: "deleted-user"): void;
  (e: "rename-user-name", user: { name: string; id: string }): void;
}>();

async function init() {
  users.splice(0, users.length);
  Object.assign(users, props.loadedUsers);

  for (const user of users) {
    user.actions = [];

    if (user["user-type"] === "application") {
      user.actions.push("rename");
    }
    user.actions.push("delete");
  }
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

function renameUser(user: { name: string; id: string }) {
  emit("rename-user-name", { name: user.name, id: user.id });
}
</script>
