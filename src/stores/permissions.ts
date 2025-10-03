import { defineStore } from 'pinia';
import { reactive } from 'vue';
import type {
  ProjectAction,
  WarehouseAction,
  NamespaceAction,
  ServerAction,
  RoleAction,
} from '@/gen/management/types.gen';
import { useFunctions } from '@/plugins/functions';
import { enabledAuthentication, enabledPermissions } from '@/app.config';

interface PermissionCache<T> {
  data: T[];
  timestamp: number;
  loading: boolean;
  error: Error | null;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export const usePermissionStore = defineStore('permissions', () => {
  const functions = useFunctions();

  // Cache storage
  const projectPermissions = reactive<Map<string, PermissionCache<ProjectAction>>>(new Map());
  const warehousePermissions = reactive<Map<string, PermissionCache<WarehouseAction>>>(new Map());
  const namespacePermissions = reactive<Map<string, PermissionCache<NamespaceAction>>>(new Map());
  const serverPermissions = reactive<Map<string, PermissionCache<ServerAction>>>(new Map());
  const rolePermissions = reactive<Map<string, PermissionCache<RoleAction>>>(new Map());

  // Check if auth/permissions are enabled
  const isAuthEnabled = () => enabledAuthentication && enabledPermissions;

  // Check if cache is valid
  const isCacheValid = <T>(cache: PermissionCache<T> | undefined): boolean => {
    if (!cache) return false;
    const now = Date.now();
    return now - cache.timestamp < CACHE_TTL;
  };

  // Server Permissions
  async function getServerPermissions(serverId: string): Promise<ServerAction[]> {
    // If auth is disabled, return all permissions
    if (!isAuthEnabled()) {
      return [
        'create_project',
        'update_users',
        'delete_users',
        'list_users',
        'grant_admin',
        'provision_users',
        'read_assignments',
      ] as ServerAction[];
    }

    const cached = serverPermissions.get(serverId);
    if (cached && isCacheValid(cached) && !cached.loading) {
      return cached.data;
    }

    // Set loading state
    if (!cached) {
      serverPermissions.set(serverId, {
        data: [],
        timestamp: 0,
        loading: true,
        error: null,
      });
    } else {
      cached.loading = true;
      cached.error = null;
    }

    try {
      const permissions = await functions.getServerAccess();
      serverPermissions.set(serverId, {
        data: permissions,
        timestamp: Date.now(),
        loading: false,
        error: null,
      });
      return permissions;
    } catch (error) {
      const cache = serverPermissions.get(serverId)!;
      cache.loading = false;
      cache.error = error as Error;
      console.error(`Failed to load server permissions for ${serverId}:`, error);
      return [];
    }
  }

  // Role Permissions
  async function getRolePermissions(roleId: string): Promise<RoleAction[]> {
    // If auth is disabled, return all permissions
    if (!isAuthEnabled()) {
      return [
        'assume',
        'can_grant_assignee',
        'can_change_ownership',
        'delete',
        'update',
        'read',
        'read_assignments',
      ] as RoleAction[];
    }

    const cached = rolePermissions.get(roleId);
    if (cached && isCacheValid(cached) && !cached.loading) {
      return cached.data;
    }

    // Set loading state
    if (!cached) {
      rolePermissions.set(roleId, {
        data: [],
        timestamp: 0,
        loading: true,
        error: null,
      });
    } else {
      cached.loading = true;
      cached.error = null;
    }

    try {
      const permissions = await functions.getRoleAccessById(roleId);
      rolePermissions.set(roleId, {
        data: permissions,
        timestamp: Date.now(),
        loading: false,
        error: null,
      });
      return permissions;
    } catch (error) {
      const cache = rolePermissions.get(roleId)!;
      cache.loading = false;
      cache.error = error as Error;
      console.error(`Failed to load role permissions for ${roleId}:`, error);
      return [];
    }
  }

  // Project Permissions
  async function getProjectPermissions(projectId: string): Promise<ProjectAction[]> {
    // If auth is disabled, return all permissions
    if (!isAuthEnabled()) {
      return [
        'create_warehouse',
        'list_warehouses',
        'create_role',
        'list_roles',
        'update_project',
      ] as ProjectAction[];
    }

    const cached = projectPermissions.get(projectId);
    if (cached && isCacheValid(cached) && !cached.loading) {
      return cached.data;
    }

    // Set loading state
    if (!cached) {
      projectPermissions.set(projectId, {
        data: [],
        timestamp: 0,
        loading: true,
        error: null,
      });
    } else {
      cached.loading = true;
      cached.error = null;
    }

    try {
      const permissions = await functions.getProjectAccessById(projectId);
      projectPermissions.set(projectId, {
        data: permissions,
        timestamp: Date.now(),
        loading: false,
        error: null,
      });
      return permissions;
    } catch (error) {
      const cache = projectPermissions.get(projectId)!;
      cache.loading = false;
      cache.error = error as Error;
      console.error(`Failed to load project permissions for ${projectId}:`, error);
      return [];
    }
  }

  // Warehouse Permissions
  async function getWarehousePermissions(warehouseId: string): Promise<WarehouseAction[]> {
    // If auth is disabled, return all permissions
    if (!isAuthEnabled()) {
      return [
        'create_namespace',
        'read_assignments',
        'modify_storage',
        'modify_storage_credential',
        'rename',
        'grant_create',
        'grant_modify',
        'get_all_tasks',
        'control_all_tasks',
      ] as WarehouseAction[];
    }

    const cached = warehousePermissions.get(warehouseId);
    if (cached && isCacheValid(cached) && !cached.loading) {
      return cached.data;
    }

    // Set loading state
    if (!cached) {
      warehousePermissions.set(warehouseId, {
        data: [],
        timestamp: 0,
        loading: true,
        error: null,
      });
    } else {
      cached.loading = true;
      cached.error = null;
    }

    try {
      const permissions = await functions.getWarehouseAccessById(warehouseId);
      warehousePermissions.set(warehouseId, {
        data: permissions,
        timestamp: Date.now(),
        loading: false,
        error: null,
      });
      return permissions;
    } catch (error) {
      const cache = warehousePermissions.get(warehouseId)!;
      cache.loading = false;
      cache.error = error as Error;
      console.error(`Failed to load warehouse permissions for ${warehouseId}:`, error);
      return [];
    }
  }

  // Namespace Permissions
  async function getNamespacePermissions(namespaceId: string): Promise<NamespaceAction[]> {
    // If auth is disabled, return all permissions
    if (!isAuthEnabled()) {
      return [
        'create_table',
        'create_namespace',
        'read_assignments',
        'get_all_tasks',
        'control_all_tasks',
      ] as NamespaceAction[];
    }

    const cached = namespacePermissions.get(namespaceId);
    if (cached && isCacheValid(cached) && !cached.loading) {
      return cached.data;
    }

    // Set loading state
    if (!cached) {
      namespacePermissions.set(namespaceId, {
        data: [],
        timestamp: 0,
        loading: true,
        error: null,
      });
    } else {
      cached.loading = true;
      cached.error = null;
    }

    try {
      const permissions = await functions.getNamespaceAccessById(namespaceId);
      namespacePermissions.set(namespaceId, {
        data: permissions,
        timestamp: Date.now(),
        loading: false,
        error: null,
      });
      return permissions;
    } catch (error) {
      const cache = namespacePermissions.get(namespaceId)!;
      cache.loading = false;
      cache.error = error as Error;
      console.error(`Failed to load namespace permissions for ${namespaceId}:`, error);
      return [];
    }
  }

  // Invalidate cache functions
  function invalidateServerPermissions(serverId: string) {
    serverPermissions.delete(serverId);
  }

  function invalidateRolePermissions(roleId: string) {
    rolePermissions.delete(roleId);
  }

  function invalidateProjectPermissions(projectId: string) {
    projectPermissions.delete(projectId);
  }

  function invalidateWarehousePermissions(warehouseId: string) {
    warehousePermissions.delete(warehouseId);
  }

  function invalidateNamespacePermissions(namespaceId: string) {
    namespacePermissions.delete(namespaceId);
  }

  function invalidateAllPermissions() {
    serverPermissions.clear();
    rolePermissions.clear();
    projectPermissions.clear();
    warehousePermissions.clear();
    namespacePermissions.clear();
  }

  // Get loading state
  function isServerLoading(serverId: string): boolean {
    return serverPermissions.get(serverId)?.loading ?? false;
  }

  function isRoleLoading(roleId: string): boolean {
    return rolePermissions.get(roleId)?.loading ?? false;
  }

  function isProjectLoading(projectId: string): boolean {
    return projectPermissions.get(projectId)?.loading ?? false;
  }

  function isWarehouseLoading(warehouseId: string): boolean {
    return warehousePermissions.get(warehouseId)?.loading ?? false;
  }

  function isNamespaceLoading(namespaceId: string): boolean {
    return namespacePermissions.get(namespaceId)?.loading ?? false;
  }

  return {
    // Getters
    getServerPermissions,
    getRolePermissions,
    getProjectPermissions,
    getWarehousePermissions,
    getNamespacePermissions,

    // Invalidation
    invalidateServerPermissions,
    invalidateRolePermissions,
    invalidateProjectPermissions,
    invalidateWarehousePermissions,
    invalidateNamespacePermissions,
    invalidateAllPermissions,

    // Loading state
    isServerLoading,
    isRoleLoading,
    isProjectLoading,
    isWarehouseLoading,
    isNamespaceLoading,

    // Auth check
    isAuthEnabled,
  };
});
