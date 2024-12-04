<template>
  <v-data-table
    :headers="headers"
    fixed-header
    hover
    :items="permissionRows"
    :sort-by="[{ key: 'name', order: 'asc' }]"
  >
    <template v-slot:top>
      <v-toolbar flat density="compact" color="transparent">
        <v-switch
          v-if="
            props.relationType === 'warehouse' ||
            props.relationType === 'namespace'
          "
          class="ml-4 mt-4"
          v-model="isManagedAccess"
          @click="switchManagedAccess"
          color="info"
          :label="managedAccess"
        ></v-switch>

        <v-spacer></v-spacer>
        <span class="icon-text">
          <AssignToRoleDialogSingle
            class="mr-2"
            :actionType="'grant'"
            :relation="props.relationType"
            :assignments="props.existingPermissionsFromObj"
            :assignee="''"
            :obj="props.assignableObj"
            @assignments="assign"
          />
        </span>
      </v-toolbar>
    </template>
    <template v-slot:item.kind="{ item }">
      <td>
        <span class="icon-text">
          <v-icon class="mr-2" v-if="item.kind == 'user'"
            >mdi-account-circle-outline</v-icon
          >
          <v-icon class="mr-2" v-else>mdi-account-box-multiple-outline</v-icon>
          {{ item.name }}</span
        >
      </td>
    </template>
    <template v-slot:item.type="{ item }">
      <AssignToRoleDialogSingle
        :actionType="'edit'"
        :relation="props.relationType"
        :assignments="props.existingPermissionsFromObj"
        :assignee="item.id"
        :obj="props.assignableObj"
        @assignments="assign"
      />
      <v-chip v-for="(t, i) in item.type" :key="i" size="small" class="mr-1">{{
        t
      }}</v-chip>
    </template>
    <template v-slot:no-data>
      <AssignToRoleDialogSingle
        :actionType="'assign'"
        :relation="props.relationType"
        :assignments="props.existingPermissionsFromObj"
        :assignee="''"
        :obj="props.assignableObj"
        @assignments="assign"
      />
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
import { useFunctions } from "@/plugins/functions";
import { onMounted, reactive } from "vue";

import {
  AssignmentCollection,
  Header,
  RelationType,
} from "@/common/interfaces";

const functions = useFunctions();

const isManagedAccess = ref(false);
const isManagedAccessInherited = ref(false);
const headers: readonly Header<any>[] = Object.freeze([
  { title: "Assignee Type", key: "kind", align: "start" },
  { title: "Name", key: "name", align: "start" },
  { title: "Email", key: "email", align: "start" },
  { title: "Roles", key: "type", align: "start", sortable: false },
]);

const permissionRows = reactive<
  { id: string; name: string; email: string; type: string[]; kind: string }[]
>([]);

// <!--false, true -> "Managed access enabled by parent"
// true, true -> "Managed access enabled"
// false, false -> "Managed access disabled"-->

const managedAccess = computed(() => {
  return isManagedAccess.value && isManagedAccessInherited.value
    ? "Managed access enabled"
    : !isManagedAccess.value && isManagedAccessInherited.value
    ? "Managed access enabled by parent"
    : "Managed access disabled";
});

const props = defineProps<{
  assignableObj: {
    id: string;
    name: string;
  };
  relationType: RelationType;
  existingPermissionsFromObj: AssignmentCollection;
}>();

const emit = defineEmits<{
  (
    e: "permissions",
    permissions: {
      del: AssignmentCollection;
      writes: AssignmentCollection;
    }
  ): void;
}>();

async function switchManagedAccess() {
  try {
    if (props.relationType === "warehouse") {
      await functions.setWarehouseManagedAccess(
        props.assignableObj.id,
        !isManagedAccess.value
      );
    }

    if (props.relationType === "namespace") {
      await functions.setNamespaceManagedAccess(
        props.assignableObj.id,
        !isManagedAccess.value
      );
    }
  } catch (error) {
    console.error(error);
  } finally {
    await loadManagedAccess();
  }
}

async function loadManagedAccess() {
  if (props.relationType === "warehouse") {
    isManagedAccess.value = await functions.getWarehouseById(
      props.assignableObj.id
    );
  }

  if (props.relationType === "namespace") {
    const isManaged = await functions.getNamespaceById(props.assignableObj.id);

    isManagedAccess.value = isManaged["managed-access"];
    isManagedAccessInherited.value = isManaged["managed-access-inherited"];
  }
}

async function init() {
  permissionRows.splice(0, permissionRows.length);
  await loadManagedAccess();

  for (const permission of props.existingPermissionsFromObj) {
    const serachUser: any = permission;

    if (serachUser.user) {
      const user = await functions.getUser(serachUser.user);
      const idx = permissionRows.findIndex((a) => a.id === user.id);
      if (user) {
        if (idx === -1) {
          permissionRows.push({
            id: user.id,
            name: user.name,
            email: user.email ?? "",
            type: [permission.type],
            kind: "user",
          });
        } else {
          permissionRows[idx].type.push(permission.type);
        }
      }
    } else {
      const role = await functions.getRole(serachUser.role);
      const idx = permissionRows.findIndex((a) => a.id === role.id);

      if (role) {
        if (idx === -1) {
          permissionRows.push({
            id: role.id,
            name: role.name,
            email: "",
            type: [permission.type],
            kind: "role",
          });
        } else {
          permissionRows[idx].type.push(permission.type);
        }
      }
    }
  }
}

async function assign(permissions: {
  del: AssignmentCollection;
  writes: AssignmentCollection;
}) {
  try {
    emit("permissions", {
      del: permissions.del,
      writes: permissions.writes,
    });
  } catch (error) {
    console.error(error);
  }
}

onMounted(async () => {
  await init();
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
