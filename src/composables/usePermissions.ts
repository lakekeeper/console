import { ref, computed, onMounted, watch } from 'vue';
import type {
  ProjectAction,
  WarehouseAction,
  NamespaceAction,
  ServerAction,
  RoleAction,
} from '@/gen/management/types.gen';
import { usePermissionStore } from '@/stores/permissions';
import { enabledAuthentication, enabledPermissions } from '@/app.config';
import type { Ref } from 'vue';

/**
 * Composable for managing server permissions
 * @param serverId - The server ID (can be a ref or static string)
 * @returns Reactive permission state and helper functions
 */
export function useServerPermissions(serverId: Ref<string> | string) {
  const permissionStore = usePermissionStore();
  const loading = ref(false);
  const permissions = ref<ServerAction[]>([]);

  const serverIdRef = computed(() => (typeof serverId === 'string' ? serverId : serverId.value));

  async function loadPermissions() {
    loading.value = true;
    try {
      permissions.value = await permissionStore.getServerPermissions(serverIdRef.value);
    } finally {
      loading.value = false;
    }
  }

  function hasPermission(action: ServerAction): boolean {
    return permissions.value.includes(action);
  }

  function hasAnyPermission(...actions: ServerAction[]): boolean {
    return actions.some((action) => permissions.value.includes(action));
  }

  function hasAllPermissions(...actions: ServerAction[]): boolean {
    return actions.every((action) => permissions.value.includes(action));
  }

  // Specific permission checks
  const canCreateProject = computed(() => hasPermission('create_project'));
  const canUpdateUsers = computed(() => hasPermission('update_users'));
  const canDeleteUsers = computed(() => hasPermission('delete_users'));
  const canListUsers = computed(() => hasPermission('list_users'));
  const canGrantAdmin = computed(() => hasPermission('grant_admin'));
  const canProvisionUsers = computed(() => hasPermission('provision_users'));
  const canReadAssignments = computed(() => hasPermission('read_assignments'));

  // UI visibility helpers that include auth checks
  const showPermissionsTab = computed(
    () => canReadAssignments.value && enabledAuthentication && enabledPermissions,
  );
  const showUsersTab = computed(() => canListUsers.value && enabledAuthentication);

  // Auto-load on mount
  onMounted(() => {
    if (serverIdRef.value) {
      loadPermissions();
    }
  });

  // Watch for ID changes
  watch(serverIdRef, (newId) => {
    if (newId) {
      loadPermissions();
    }
  });

  return {
    loading,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canCreateProject,
    canUpdateUsers,
    canDeleteUsers,
    canListUsers,
    canGrantAdmin,
    canProvisionUsers,
    canReadAssignments,
    showPermissionsTab,
    showUsersTab,
    refresh: loadPermissions,
  };
}

/**
 * Composable for managing role permissions
 * @param roleId - The role ID (can be a ref or static string)
 * @returns Reactive permission state and helper functions
 */
export function useRolePermissions(roleId: Ref<string> | string) {
  const permissionStore = usePermissionStore();
  const loading = ref(false);
  const permissions = ref<RoleAction[]>([]);

  const roleIdRef = computed(() => (typeof roleId === 'string' ? roleId : roleId.value));

  async function loadPermissions() {
    loading.value = true;
    try {
      permissions.value = await permissionStore.getRolePermissions(roleIdRef.value);
    } finally {
      loading.value = false;
    }
  }

  function hasPermission(action: RoleAction): boolean {
    return permissions.value.includes(action);
  }

  function hasAnyPermission(...actions: RoleAction[]): boolean {
    return actions.some((action) => permissions.value.includes(action));
  }

  function hasAllPermissions(...actions: RoleAction[]): boolean {
    return actions.every((action) => permissions.value.includes(action));
  }

  // Specific permission checks
  const canAssume = computed(() => hasPermission('assume'));
  const canGrantAssignee = computed(() => hasPermission('can_grant_assignee'));
  const canChangeOwnership = computed(() => hasPermission('can_change_ownership'));
  const canDelete = computed(() => hasPermission('delete'));
  const canUpdate = computed(() => hasPermission('update'));
  const canRead = computed(() => hasPermission('read'));
  const canReadAssignments = computed(() => hasPermission('read_assignments'));

  // UI visibility helpers that include auth checks
  const showPermissionsTab = computed(
    () => canReadAssignments.value && enabledAuthentication && enabledPermissions,
  );

  // Auto-load on mount
  onMounted(() => {
    if (roleIdRef.value) {
      loadPermissions();
    }
  });

  // Watch for ID changes
  watch(roleIdRef, (newId) => {
    if (newId) {
      loadPermissions();
    }
  });

  return {
    loading,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAssume,
    canGrantAssignee,
    canChangeOwnership,
    canDelete,
    canUpdate,
    canRead,
    canReadAssignments,
    showPermissionsTab,
    refresh: loadPermissions,
  };
}

/**
 * Composable for managing project permissions
 * @param projectId - The project ID (can be a ref or static string)
 * @returns Reactive permission state and helper functions
 */
export function useProjectPermissions(projectId: Ref<string> | string) {
  const permissionStore = usePermissionStore();
  const loading = ref(false);
  const permissions = ref<ProjectAction[]>([]);

  const projectIdRef = computed(() =>
    typeof projectId === 'string' ? projectId : projectId.value,
  );

  async function loadPermissions() {
    loading.value = true;
    try {
      permissions.value = await permissionStore.getProjectPermissions(projectIdRef.value);
    } finally {
      loading.value = false;
    }
  }

  function hasPermission(action: ProjectAction): boolean {
    return permissions.value.includes(action);
  }

  function hasAnyPermission(...actions: ProjectAction[]): boolean {
    return actions.some((action) => permissions.value.includes(action));
  }

  function hasAllPermissions(...actions: ProjectAction[]): boolean {
    return actions.every((action) => permissions.value.includes(action));
  }

  // Specific permission checks
  const canCreateWarehouse = computed(() => hasPermission('create_warehouse'));
  const canListWarehouses = computed(() => hasPermission('list_warehouses'));
  const canCreateRole = computed(() => hasPermission('create_role'));
  const canListRoles = computed(() => hasPermission('list_roles'));
  const canSearchRoles = computed(() => hasPermission('search_roles'));
  const canReadAssignments = computed(() => hasPermission('read_assignments'));

  // Auto-load on mount
  onMounted(() => {
    if (projectIdRef.value) {
      loadPermissions();
    }
  });

  // Watch for ID changes
  watch(projectIdRef, (newId) => {
    if (newId) {
      loadPermissions();
    }
  });

  return {
    loading,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canCreateWarehouse,
    canListWarehouses,
    canCreateRole,
    canListRoles,
    canSearchRoles,
    canReadAssignments,
    refresh: loadPermissions,
  };
}

/**
 * Composable for managing warehouse permissions
 * @param warehouseId - The warehouse ID (can be a ref or static string)
 * @returns Reactive permission state and helper functions
 */
export function useWarehousePermissions(warehouseId: Ref<string> | string) {
  const permissionStore = usePermissionStore();
  const loading = ref(false);
  const permissions = ref<WarehouseAction[]>([]);

  const warehouseIdRef = computed(() =>
    typeof warehouseId === 'string' ? warehouseId : warehouseId.value,
  );

  async function loadPermissions() {
    loading.value = true;
    try {
      permissions.value = await permissionStore.getWarehousePermissions(warehouseIdRef.value);
    } finally {
      loading.value = false;
    }
  }

  function hasPermission(action: WarehouseAction): boolean {
    return permissions.value.includes(action);
  }

  function hasAnyPermission(...actions: WarehouseAction[]): boolean {
    return actions.some((action) => permissions.value.includes(action));
  }

  function hasAllPermissions(...actions: WarehouseAction[]): boolean {
    return actions.every((action) => permissions.value.includes(action));
  }

  // Specific permission checks
  const canCreateNamespace = computed(() => hasPermission('create_namespace'));
  const canDelete = computed(() => hasPermission('delete'));
  const canReadPermissions = computed(() => hasPermission('read_assignments'));
  const canModifyWarehouse = computed(() =>
    hasAnyPermission(
      'modify_storage',
      'modify_storage_credential',
      'rename',
      'grant_create',
      'grant_modify',
    ),
  );
  const canGetAllTasks = computed(() => hasPermission('get_all_tasks'));
  const canControlAllTasks = computed(() => hasPermission('control_all_tasks'));
  const canModifyStorage = computed(() => hasPermission('modify_storage'));
  const canModifyCredentials = computed(() => hasPermission('modify_storage_credential'));
  const canRename = computed(() => hasPermission('rename'));

  // UI visibility helpers that include auth checks
  const showPermissionsTab = computed(
    () => canReadPermissions.value && enabledAuthentication && enabledPermissions,
  );
  const showTasksTab = computed(
    () => canGetAllTasks.value || !enabledAuthentication || !enabledPermissions,
  );

  // Auto-load on mount
  onMounted(() => {
    if (warehouseIdRef.value) {
      loadPermissions();
    }
  });

  // Watch for ID changes
  watch(warehouseIdRef, (newId) => {
    if (newId) {
      loadPermissions();
    }
  });

  return {
    loading,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canCreateNamespace,
    canDelete,
    canReadPermissions,
    canModifyWarehouse,
    canGetAllTasks,
    canControlAllTasks,
    canModifyStorage,
    canModifyCredentials,
    canRename,
    showPermissionsTab,
    showTasksTab,
    refresh: loadPermissions,
  };
}

/**
 * Composable for managing namespace permissions
 * @param namespaceId - The namespace ID (can be a ref or static string)
 * @returns Reactive permission state and helper functions
 */
export function useNamespacePermissions(namespaceId: Ref<string> | string) {
  const permissionStore = usePermissionStore();
  const loading = ref(false);
  const permissions = ref<NamespaceAction[]>([]);

  const namespaceIdRef = computed(() =>
    typeof namespaceId === 'string' ? namespaceId : namespaceId.value,
  );

  async function loadPermissions() {
    loading.value = true;
    try {
      permissions.value = await permissionStore.getNamespacePermissions(namespaceIdRef.value);
    } finally {
      loading.value = false;
    }
  }

  function hasPermission(action: NamespaceAction): boolean {
    return permissions.value.includes(action);
  }

  function hasAnyPermission(...actions: NamespaceAction[]): boolean {
    return actions.some((action) => permissions.value.includes(action));
  }

  function hasAllPermissions(...actions: NamespaceAction[]): boolean {
    return actions.every((action) => permissions.value.includes(action));
  }

  // Specific permission checks
  const canCreateTable = computed(() => hasPermission('create_table'));
  const canCreateNamespace = computed(() => hasPermission('create_namespace'));
  const canReadPermissions = computed(() => hasPermission('read_assignments'));
  const canCreateView = computed(() => hasPermission('create_view'));
  const canGetMetadata = computed(() => hasPermission('get_metadata'));

  // Auto-load on mount
  onMounted(() => {
    if (namespaceIdRef.value) {
      loadPermissions();
    }
  });

  // Watch for ID changes
  watch(namespaceIdRef, (newId) => {
    if (newId) {
      loadPermissions();
    }
  });

  return {
    loading,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canCreateTable,
    canCreateNamespace,
    canReadPermissions,
    canCreateView,
    canGetMetadata,
    refresh: loadPermissions,
  };
}
