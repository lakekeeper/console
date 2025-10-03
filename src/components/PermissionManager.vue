<template>
  <v-data-table
    fixed-header
    :headers="headers"
    hover
    :items="permissionRows"
    :sort-by="[{ key: 'name', order: 'asc' }]">
    <template #top>
      <v-toolbar color="transparent" density="compact" flat>
        <v-switch
          v-if="props.relationType === 'warehouse' || props.relationType === 'namespace'"
          v-model="isManagedAccess"
          class="ml-4 mt-4"
          color="info"
          :label="managedAccess"
          @click="switchManagedAccess"></v-switch>

        <v-spacer></v-spacer>
        <span class="icon-text">
          <AssignToRoleDialogSingle
            :status="assignStatus"
            :action-type="'grant'"
            :assignee="''"
            :assignments="existingAssignments"
            class="mr-2"
            :obj="props.assignableObj"
            :relation="props.relationType"
            @assignments="assign" />
        </span>
      </v-toolbar>
    </template>
    <template #item.name="{ item }">
      <span class="icon-text">
        <v-icon v-if="item.kind == 'user'" class="mr-2">mdi-account-circle-outline</v-icon>
        <v-icon v-else class="mr-2">mdi-account-box-multiple-outline</v-icon>
        {{ item.name }}
      </span>
    </template>
    <!--template v-slot:item.kind="{ item }">
      <td>
        <span class="icon-text">
          <v-icon class="mr-2" v-if="item.kind == 'user'"
            >mdi-account-circle-outline</v-icon
          >
          <v-icon class="mr-2" v-else>mdi-account-box-multiple-outline</v-icon>
        </span>
      </td>
    </template-->
    <template #item.type="{ item }">
      <AssignToRoleDialogSingle
        :status="assignStatus"
        :action-type="'edit'"
        :assignee="item.id"
        :assignments="existingAssignments"
        :obj="props.assignableObj"
        :relation="props.relationType"
        @assignments="assign" />
      <v-chip v-for="(t, i) in item.type" :key="i" class="mr-1" size="small">{{ t }}</v-chip>
    </template>
    <template #no-data>
      <AssignToRoleDialogSingle
        :status="assignStatus"
        :action-type="'assign'"
        :assignee="''"
        :assignments="existingAssignments"
        :obj="props.assignableObj"
        :relation="props.relationType"
        @assignments="assign" />
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
import { useFunctions } from '@/plugins/functions';
import { onMounted, reactive, computed, ref } from 'vue';

import { AssignmentCollection, Header, RelationType } from '@/common/interfaces';
import { StatusIntent } from '@/common/enums';

const functions = useFunctions();

const isManagedAccess = ref(false);
const isManagedAccessInherited = ref(false);
const headers: readonly Header[] = Object.freeze([
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Email', key: 'email', align: 'start' },
  { title: 'Roles', key: 'type', align: 'start', sortable: false },
]);

const permissionRows = reactive<
  { id: string; name: string; email: string; type: string[]; kind: string }[]
>([]);

// <!--false, true -> "Managed access enabled by parent"
// true, true -> "Managed access enabled"
// false, false -> "Managed access disabled"-->

const managedAccess = computed(() => {
  if (props.relationType === 'namespace') {
    return isManagedAccess.value && isManagedAccessInherited.value
      ? 'Managed access enabled'
      : !isManagedAccess.value && isManagedAccessInherited.value
        ? 'Managed access enabled by parent'
        : 'Managed access disabled';
  } else if (props.relationType === 'warehouse') {
    return isManagedAccess.value ? 'Managed access enabled' : 'Managed access disabled';
  } else {
    return 'Managed access not applicable';
  }
});

const props = withDefaults(
  defineProps<{
    assignableObj: {
      id: string;
      name: string;
    };
    relationType: RelationType;
    warehouseId?: string; // Required for table and view assignments
    status?: StatusIntent;
  }>(),
  {
    status: StatusIntent.INACTIVE,
  },
);

const emit = defineEmits<{
  (e: 'statusUpdate', status: StatusIntent): void;
}>();

// Internal state management
const loaded = ref(false);
const assignStatus = ref(StatusIntent.INACTIVE);
const existingAssignments = reactive<any[]>([]);

async function fetchAssignments() {
  try {
    let assignments: any[] = [];

    if (props.relationType === 'server') {
      assignments = await functions.getServerAssignments();
    } else if (props.relationType === 'warehouse') {
      assignments = await functions.getWarehouseAssignmentsById(props.assignableObj.id);
    } else if (props.relationType === 'namespace') {
      assignments = await functions.getNamespaceAssignmentsById(props.assignableObj.id);
    } else if (props.relationType === 'table' && props.warehouseId) {
      assignments = await functions.getTableAssignmentsById(
        props.assignableObj.id,
        props.warehouseId,
      );
    } else if (props.relationType === 'view' && props.warehouseId) {
      assignments = await functions.getViewAssignmentsById(
        props.assignableObj.id,
        props.warehouseId,
      );
    }

    existingAssignments.splice(0, existingAssignments.length);
    Object.assign(existingAssignments, assignments);
    return assignments;
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return [];
  }
}

async function switchManagedAccess() {
  try {
    if (props.relationType === 'warehouse') {
      await functions.setWarehouseManagedAccess(props.assignableObj.id, !isManagedAccess.value);
    }

    if (props.relationType === 'namespace') {
      await functions.setNamespaceManagedAccess(props.assignableObj.id, !isManagedAccess.value);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await loadManagedAccess();
  }
}

async function loadManagedAccess() {
  if (props.relationType === 'warehouse') {
    isManagedAccess.value = await functions.getWarehouseById(props.assignableObj.id);
  }

  if (props.relationType === 'namespace') {
    const isManaged = await functions.getNamespaceById(props.assignableObj.id);

    isManagedAccess.value = isManaged['managed-access'];
    isManagedAccessInherited.value = isManaged['managed-access-inherited'];
  }
}

async function init() {
  console.log('PermissionManager: init called for', props.relationType, props.assignableObj.id);
  loaded.value = false;
  permissionRows.splice(0, permissionRows.length);
  await loadManagedAccess();

  const assignments = await fetchAssignments();
  console.log('PermissionManager: fetched assignments:', assignments);

  for (const permission of assignments) {
    const searchUser: any = permission;

    if (searchUser.user) {
      const user = await functions.getUser(searchUser.user);
      const idx = permissionRows.findIndex((a) => a.id === user.id);
      if (user) {
        if (idx === -1) {
          permissionRows.push({
            id: user.id,
            name: user.name,
            email: user.email ?? '',
            type: [permission.type],
            kind: 'user',
          });
        } else {
          permissionRows[idx].type.push(permission.type);
        }
      }
    } else {
      const role = await functions.getRole(searchUser.role);
      const idx = permissionRows.findIndex((a) => a.id === role.id);

      if (role) {
        if (idx === -1) {
          permissionRows.push({
            id: role.id,
            name: role.name,
            email: '',
            type: [permission.type],
            kind: 'role',
          });
        } else {
          permissionRows[idx].type.push(permission.type);
        }
      }
    }
  }

  loaded.value = true;
}

async function assign(permissions: { del: AssignmentCollection; writes: AssignmentCollection }) {
  console.log('PermissionManager: assign called', { permissions });
  try {
    loaded.value = false;
    assignStatus.value = StatusIntent.STARTING;
    emit('statusUpdate', StatusIntent.STARTING);

    // Handle different relation types
    if (props.relationType === 'server') {
      const del = permissions.del as any[];
      const writes = permissions.writes as any[];
      await functions.updateServerAssignments(del, writes);
    } else if (props.relationType === 'warehouse') {
      const del = permissions.del as any[];
      const writes = permissions.writes as any[];
      await functions.updateWarehouseAssignmentsById(props.assignableObj.id, del, writes);
    } else if (props.relationType === 'namespace') {
      const del = permissions.del as any[];
      const writes = permissions.writes as any[];
      await functions.updateNamespaceAssignmentsById(props.assignableObj.id, del, writes);
    } else if (props.relationType === 'table') {
      const del = permissions.del as any[];
      const writes = permissions.writes as any[];
      if (!props.warehouseId) {
        throw new Error('warehouseId is required for table assignments');
      }
      await functions.updateTableAssignmentsById(
        props.assignableObj.id,
        del,
        writes,
        props.warehouseId,
      );
    } else if (props.relationType === 'view') {
      const del = permissions.del as any[];
      const writes = permissions.writes as any[];
      if (!props.warehouseId) {
        throw new Error('warehouseId is required for view assignments');
      }
      await functions.updateViewAssignmentsById(
        props.assignableObj.id,
        del,
        writes,
        props.warehouseId,
      );
    }

    console.log('PermissionManager: assignment successful, reloading data');
    assignStatus.value = StatusIntent.SUCCESS;
    emit('statusUpdate', StatusIntent.SUCCESS);
    await init(); // Reload the data
  } catch (error) {
    console.error(error);
    assignStatus.value = StatusIntent.FAILURE;
    emit('statusUpdate', StatusIntent.FAILURE);
  } finally {
    loaded.value = true;
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
