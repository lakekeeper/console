<template>
  <v-container class="fill-height" v-if="loading">
    <v-responsive class="align-centerfill-height mx-auto" max-width="900">
      <v-row justify="center">
        <v-progress-circular
          class="mt-4"
          :size="126"
          indeterminate
          color="info"
        ></v-progress-circular>
      </v-row>

      ></v-responsive
    >
  </v-container>
  <span v-else>
    <v-row class="ml-1">
      <v-col>
        <v-toolbar flat density="compact" class="mb-4" color="transparent">
          <v-toolbar-title>
            <span class="text-subtitle-1">Roles </span>
          </v-toolbar-title>
          <template v-slot:prepend>
            <v-icon>mdi-account-box-multiple-outline</v-icon>
          </template>
          <v-spacer></v-spacer>
          <roleDialog @roleInput="roleInput" :actionType="'add'" />
        </v-toolbar>
        <v-data-table
          v-if="canListRoles"
          :headers="headers"
          fixed-header
          hover
          :items="roles"
          :sort-by="[{ key: 'name', order: 'asc' }]"
        >
          <template v-slot:item.name="{ item }">
            <td @click="getRole(item.id)" class="pointer-cursor">
              <span class="icon-text">
                <v-icon color="info" class="mr-2"
                  >mdi-account-box-multiple-outline</v-icon
                >
                {{ item.name }}</span
              >
            </td>
          </template>
          <template v-slot:item.actions="{ item }">
            <span icon-text>
              <v-icon
                :disabled="!myAccess.includes('delete')"
                class="mr-1"
                color="error"
                @click="deleteRole(item.id)"
                >mdi-delete-outline</v-icon
              >
            </span>
          </template>
          <template v-slot:no-data>
            <roleDialog
              v-if="myAccess.includes('create_role')"
              @roleInput="roleInput"
              :actionType="'add'"
            />
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </span>
</template>
<script lang="ts" setup>
import { onMounted, ref, reactive } from "vue";
import { useFunctions } from "../../plugins/functions";
import { ProjectAction, Role } from "../../gen/management/types.gen";
import router from "../../router";
import { Header } from "../../common/interfaces";

const functions = useFunctions();
const roles = ref<Role[]>([]);
const loading = ref(true);

const role = reactive({
  name: "",
  description: "",
});
const headers: readonly Header<any>[] = Object.freeze([
  { title: "Name", key: "name", align: "start" },
  { title: "Description", key: "description", align: "start" },
  { title: "Actions", key: "actions", align: "end", sortable: false },
]);

const isDialogActive = ref(false); // Declare the isDialogActive property
const myAccess = reactive<ProjectAction[]>([]);
const canListRoles = ref(false);
onMounted(async () => {
  try {
    await init();
    loading.value = false;
  } catch (error) {
    console.error(error);
  }
});

function getRole(id: string) {
  router.push(`/roles/${id}`);
}

async function init() {
  roles.value = [];
  Object.assign(myAccess, await functions.getProjectAccess());
  canListRoles.value = myAccess.includes("list_roles");
  Object.assign(roles.value, await functions.listRoles());
}

async function createRole() {
  try {
    await functions.createRole(role.name, role.description);
    isDialogActive.value = false;
    await init();
  } catch (error) {
    console.error(error);
  }
}

async function deleteRole(roleId: string) {
  try {
    await functions.deleteRole(roleId);

    isDialogActive.value = false;

    await init();
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
  roles.value.splice(0, roles.value.length);
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
