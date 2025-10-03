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
          v-if="
            props.relationType === RelationType.Warehouse ||
            props.relationType === RelationType.Namespace
          "
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
            :obj="assignableObj"
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
        :obj="assignableObj"
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
        :obj="assignableObj"
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
  if (props.relationType === RelationType.Namespace) {
    return isManagedAccess.value && isManagedAccessInherited.value
      ? 'Managed access enabled'
      : !isManagedAccess.value && isManagedAccessInherited.value
        ? 'Managed access enabled by parent'
        : 'Managed access disabled';
  } else if (props.relationType === RelationType.Warehouse) {
    return isManagedAccess.value ? 'Managed access enabled' : 'Managed access disabled';
  } else {
    return 'Managed access not applicable';
  }
});

const props = withDefaults(
  defineProps<{
    objectId: string;
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
  (e: 'objectLoaded', obj: { id: string; name: string }): void;
}>();

// Internal state management
const loaded = ref(false);
const assignStatus = ref(StatusIntent.INACTIVE);
const existingAssignments = reactive<any[]>([]);
const assignableObj = reactive<{ id: string; name: string }>({
  id: '',
  name: '',
});

async function loadObjectData() {
  try {
    let objData: any = null;

    if (props.relationType === RelationType.Server) {
      objData = await functions.getServerInfo();
      assignableObj.id = objData['server-id'];
      assignableObj.name = 'Server';
    } else if (props.relationType === RelationType.Warehouse) {
      objData = await functions.getWarehouse(props.objectId);
      assignableObj.id = objData.id;
      assignableObj.name = objData.name;
    } else if (props.relationType === RelationType.Namespace) {
      // For namespace, we only have the ID, use it directly
      assignableObj.id = props.objectId;
      assignableObj.name = props.objectId; // Namespace display name is the ID
    } else if (props.relationType === RelationType.Table) {
      // For tables, we get basic info from the table list
      assignableObj.id = props.objectId;
      assignableObj.name = props.objectId; // Tables don't have a separate get endpoint
    } else if (props.relationType === RelationType.View) {
      // For views, we get basic info from the view list
      assignableObj.id = props.objectId;
      assignableObj.name = props.objectId; // Views don't have a separate get endpoint
    } else if (props.relationType === RelationType.Project) {
      objData = await functions.getProjectById(props.objectId);
      assignableObj.id = objData['project-id'];
      assignableObj.name = objData['project-name'];
    } else if (props.relationType === RelationType.Role) {
      objData = await functions.getRole(props.objectId);
      assignableObj.id = objData.id;
      assignableObj.name = objData.name;
    }

    emit('objectLoaded', { id: assignableObj.id, name: assignableObj.name });
  } catch (error) {
    console.error('Error loading object data:', error);
  }
}

async function fetchAssignments() {
  try {
    let assignments: any[] = [];

    if (props.relationType === RelationType.Server) {
      assignments = await functions.getServerAssignments();
    } else if (props.relationType === RelationType.Warehouse) {
      assignments = await functions.getWarehouseAssignmentsById(assignableObj.id);
    } else if (props.relationType === RelationType.Namespace) {
      assignments = await functions.getNamespaceAssignmentsById(assignableObj.id);
    } else if (props.relationType === RelationType.Table && props.warehouseId) {
      assignments = await functions.getTableAssignmentsById(assignableObj.id, props.warehouseId);
    } else if (props.relationType === RelationType.View && props.warehouseId) {
      assignments = await functions.getViewAssignmentsById(assignableObj.id, props.warehouseId);
    } else if (props.relationType === RelationType.Project) {
      assignments = await functions.getProjectAssignments();
    } else if (props.relationType === RelationType.Role) {
      assignments = await functions.getRoleAssignmentsById(assignableObj.id);
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
    if (props.relationType === RelationType.Warehouse) {
      await functions.setWarehouseManagedAccess(assignableObj.id, !isManagedAccess.value);
    }

    if (props.relationType === RelationType.Namespace) {
      await functions.setNamespaceManagedAccess(assignableObj.id, !isManagedAccess.value);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await loadManagedAccess();
  }
}

async function loadManagedAccess() {
  if (props.relationType === RelationType.Warehouse) {
    const managedAccess = await functions.getWarehouseById(assignableObj.id);
    isManagedAccess.value = managedAccess;
  }

  if (props.relationType === RelationType.Namespace) {
    const isManaged = await functions.getNamespaceById(assignableObj.id);

    isManagedAccess.value = isManaged['managed-access'];
    isManagedAccessInherited.value = isManaged['managed-access-inherited'];
  }
}

async function init() {
  console.log('PermissionManager: init called for', props.relationType, assignableObj.id);
  loaded.value = false;
  permissionRows.splice(0, permissionRows.length);

  await loadObjectData();
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
    if (props.relationType === RelationType.Server) {
      const del = permissions.del as any[];
      const writes = permissions.writes as any[];
      await functions.updateServerAssignments(del, writes);
    } else if (props.relationType === RelationType.Warehouse) {
      const del = permissions.del as any[];
      const writes = permissions.writes as any[];
      await functions.updateWarehouseAssignmentsById(assignableObj.id, del, writes);
    } else if (props.relationType === RelationType.Namespace) {
      const del = permissions.del as any[];
      const writes = permissions.writes as any[];
      await functions.updateNamespaceAssignmentsById(assignableObj.id, del, writes);
    } else if (props.relationType === RelationType.Table) {
      const del = permissions.del as any[];
      const writes = permissions.writes as any[];
      if (!props.warehouseId) {
        throw new Error('warehouseId is required for table assignments');
      }
      await functions.updateTableAssignmentsById(assignableObj.id, del, writes, props.warehouseId);
    } else if (props.relationType === RelationType.View) {
      const del = permissions.del as any[];
      const writes = permissions.writes as any[];
      if (!props.warehouseId) {
        throw new Error('warehouseId is required for view assignments');
      }
      await functions.updateViewAssignmentsById(assignableObj.id, del, writes, props.warehouseId);
    } else if (props.relationType === RelationType.Project) {
      const del = permissions.del as any[];
      const writes = permissions.writes as any[];
      await functions.updateProjectAssignments(del, writes);
    } else if (props.relationType === RelationType.Role) {
      const del = permissions.del as any[];
      const writes = permissions.writes as any[];
      await functions.updateRoleAssignmentsById(assignableObj.id, del, writes);
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
