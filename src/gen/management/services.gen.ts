// This file is auto-generated by @hey-api/openapi-ts

import { createClient, createConfig, type Options } from '@hey-api/client-fetch';
import type { BootstrapData, BootstrapError, BootstrapResponse, GetDefaultProjectError, GetDefaultProjectResponse, DeleteDefaultProjectError, DeleteDefaultProjectResponse, RenameDefaultProjectData, RenameDefaultProjectError, RenameDefaultProjectResponse, GetServerInfoError, GetServerInfoResponse, GetNamespaceByIdData, GetNamespaceByIdError, GetNamespaceByIdResponse, GetNamespaceAccessByIdData, GetNamespaceAccessByIdError, GetNamespaceAccessByIdResponse, GetNamespaceAssignmentsByIdData, GetNamespaceAssignmentsByIdError, GetNamespaceAssignmentsByIdResponse, UpdateNamespaceAssignmentsByIdData, UpdateNamespaceAssignmentsByIdError, UpdateNamespaceAssignmentsByIdResponse, SetNamespaceManagedAccessData, SetNamespaceManagedAccessError, SetNamespaceManagedAccessResponse, GetProjectAccessData, GetProjectAccessError, GetProjectAccessResponse2, GetProjectAssignmentsData, GetProjectAssignmentsError, GetProjectAssignmentsResponse2, UpdateProjectAssignmentsData, UpdateProjectAssignmentsError, UpdateProjectAssignmentsResponse, GetProjectAccessByIdData, GetProjectAccessByIdError, GetProjectAccessByIdResponse, GetProjectAssignmentsByIdData, GetProjectAssignmentsByIdError, GetProjectAssignmentsByIdResponse, UpdateProjectAssignmentsByIdData, UpdateProjectAssignmentsByIdError, UpdateProjectAssignmentsByIdResponse, GetRoleAccessByIdData, GetRoleAccessByIdError, GetRoleAccessByIdResponse, GetRoleAssignmentsByIdData, GetRoleAssignmentsByIdError, GetRoleAssignmentsByIdResponse, UpdateRoleAssignmentsByIdData, UpdateRoleAssignmentsByIdError, UpdateRoleAssignmentsByIdResponse, GetServerAccessData, GetServerAccessError, GetServerAccessResponse2, GetServerAssignmentsData, GetServerAssignmentsError, GetServerAssignmentsResponse2, UpdateServerAssignmentsData, UpdateServerAssignmentsError, UpdateServerAssignmentsResponse, GetTableAccessByIdData, GetTableAccessByIdError, GetTableAccessByIdResponse, GetTableAssignmentsByIdData, GetTableAssignmentsByIdError, GetTableAssignmentsByIdResponse, UpdateTableAssignmentsByIdData, UpdateTableAssignmentsByIdError, UpdateTableAssignmentsByIdResponse, GetViewAccessByIdData, GetViewAccessByIdError, GetViewAccessByIdResponse, GetViewAssignmentsByIdData, GetViewAssignmentsByIdError, GetViewAssignmentsByIdResponse, UpdateViewAssignmentsByIdData, UpdateViewAssignmentsByIdError, UpdateViewAssignmentsByIdResponse, GetWarehouseByIdData, GetWarehouseByIdError, GetWarehouseByIdResponse, GetWarehouseAccessByIdData, GetWarehouseAccessByIdError, GetWarehouseAccessByIdResponse, GetWarehouseAssignmentsByIdData, GetWarehouseAssignmentsByIdError, GetWarehouseAssignmentsByIdResponse, UpdateWarehouseAssignmentsByIdData, UpdateWarehouseAssignmentsByIdError, UpdateWarehouseAssignmentsByIdResponse, SetWarehouseManagedAccessData, SetWarehouseManagedAccessError, SetWarehouseManagedAccessResponse, CreateProjectData, CreateProjectError, CreateProjectResponse2, ListProjectsError, ListProjectsResponse2, GetProjectByIdData, GetProjectByIdError, GetProjectByIdResponse, DeleteProjectByIdData, DeleteProjectByIdError, DeleteProjectByIdResponse, RenameProjectByIdData, RenameProjectByIdError, RenameProjectByIdResponse, ListRolesData, ListRolesError, ListRolesResponse2, CreateRoleData, CreateRoleError, CreateRoleResponse, GetRoleData, GetRoleError, GetRoleResponse, UpdateRoleData, UpdateRoleError, UpdateRoleResponse, DeleteRoleData, DeleteRoleError, DeleteRoleResponse, SearchRoleData, SearchRoleError, SearchRoleResponse2, SearchUserData, SearchUserError, SearchUserResponse2, ListUserData, ListUserError, ListUserResponse, CreateUserData, CreateUserError, CreateUserResponse, GetUserData, GetUserError, GetUserResponse, UpdateUserData, UpdateUserError, UpdateUserResponse, DeleteUserData, DeleteUserError, DeleteUserResponse, ListWarehousesData, ListWarehousesError, ListWarehousesResponse2, CreateWarehouseData, CreateWarehouseError, CreateWarehouseResponse2, GetWarehouseData, GetWarehouseError, GetWarehouseResponse2, DeleteWarehouseData, DeleteWarehouseError, DeleteWarehouseResponse, ActivateWarehouseData, ActivateWarehouseError, ActivateWarehouseResponse, DeactivateWarehouseData, DeactivateWarehouseError, DeactivateWarehouseResponse, UpdateWarehouseDeleteProfileData, UpdateWarehouseDeleteProfileError, UpdateWarehouseDeleteProfileResponse, ListDeletedTabularsData, ListDeletedTabularsError, ListDeletedTabularsResponse2, RenameWarehouseData, RenameWarehouseError, RenameWarehouseResponse, UpdateStorageProfileData, UpdateStorageProfileError, UpdateStorageProfileResponse, UpdateStorageCredentialData, UpdateStorageCredentialError, UpdateStorageCredentialResponse, WhoamiError, WhoamiResponse } from './types.gen';

export const client = createClient(createConfig());

/**
 * Creates the user in the catalog if it does not exist.
 * If the user exists, it updates the users' metadata from the token.
 * The token sent to this endpoint should have "profile" and "email" scopes.
 */
export const bootstrap = <ThrowOnError extends boolean = false>(options: Options<BootstrapData, ThrowOnError>) => {
    return (options?.client ?? client).post<BootstrapResponse, BootstrapError, ThrowOnError>({
        ...options,
        url: '/management/v1/bootstrap'
    });
};

/**
 * Get the default project
 */
export const getDefaultProject = <ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) => {
    return (options?.client ?? client).get<GetDefaultProjectResponse, GetDefaultProjectError, ThrowOnError>({
        ...options,
        url: '/management/v1/default-project'
    });
};

/**
 * Delete the default project
 */
export const deleteDefaultProject = <ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) => {
    return (options?.client ?? client).delete<DeleteDefaultProjectResponse, DeleteDefaultProjectError, ThrowOnError>({
        ...options,
        url: '/management/v1/default-project'
    });
};

/**
 * Rename the default project
 */
export const renameDefaultProject = <ThrowOnError extends boolean = false>(options: Options<RenameDefaultProjectData, ThrowOnError>) => {
    return (options?.client ?? client).post<RenameDefaultProjectResponse, RenameDefaultProjectError, ThrowOnError>({
        ...options,
        url: '/management/v1/default-project/rename'
    });
};

/**
 * Get information about the server
 */
export const getServerInfo = <ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) => {
    return (options?.client ?? client).get<GetServerInfoResponse, GetServerInfoError, ThrowOnError>({
        ...options,
        url: '/management/v1/info'
    });
};

/**
 * Get Authorization properties of a namespace
 */
export const getNamespaceById = <ThrowOnError extends boolean = false>(options: Options<GetNamespaceByIdData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetNamespaceByIdResponse, GetNamespaceByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/namespace/{namespace_id}'
    });
};

/**
 * Get my access to a namespace
 */
export const getNamespaceAccessById = <ThrowOnError extends boolean = false>(options: Options<GetNamespaceAccessByIdData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetNamespaceAccessByIdResponse, GetNamespaceAccessByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/namespace/{namespace_id}/access'
    });
};

/**
 * Get user and role assignments for a namespace
 */
export const getNamespaceAssignmentsById = <ThrowOnError extends boolean = false>(options: Options<GetNamespaceAssignmentsByIdData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetNamespaceAssignmentsByIdResponse, GetNamespaceAssignmentsByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/namespace/{namespace_id}/assignments'
    });
};

/**
 * Update permissions for a namespace
 */
export const updateNamespaceAssignmentsById = <ThrowOnError extends boolean = false>(options: Options<UpdateNamespaceAssignmentsByIdData, ThrowOnError>) => {
    return (options?.client ?? client).post<UpdateNamespaceAssignmentsByIdResponse, UpdateNamespaceAssignmentsByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/namespace/{namespace_id}/assignments'
    });
};

/**
 * Set managed access property of a namespace
 */
export const setNamespaceManagedAccess = <ThrowOnError extends boolean = false>(options: Options<SetNamespaceManagedAccessData, ThrowOnError>) => {
    return (options?.client ?? client).post<SetNamespaceManagedAccessResponse, SetNamespaceManagedAccessError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/namespace/{namespace_id}/managed-access'
    });
};

/**
 * Get my access to the default project
 */
export const getProjectAccess = <ThrowOnError extends boolean = false>(options?: Options<GetProjectAccessData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetProjectAccessResponse2, GetProjectAccessError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/project/access'
    });
};

/**
 * Get user and role assignments of a project
 */
export const getProjectAssignments = <ThrowOnError extends boolean = false>(options?: Options<GetProjectAssignmentsData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetProjectAssignmentsResponse2, GetProjectAssignmentsError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/project/assignments'
    });
};

/**
 * Update permissions for the default project
 */
export const updateProjectAssignments = <ThrowOnError extends boolean = false>(options: Options<UpdateProjectAssignmentsData, ThrowOnError>) => {
    return (options?.client ?? client).post<UpdateProjectAssignmentsResponse, UpdateProjectAssignmentsError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/project/assignments'
    });
};

/**
 * Get my access to the default project
 */
export const getProjectAccessById = <ThrowOnError extends boolean = false>(options: Options<GetProjectAccessByIdData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetProjectAccessByIdResponse, GetProjectAccessByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/project/{project_id}/access'
    });
};

/**
 * Get user and role assignments to a project
 */
export const getProjectAssignmentsById = <ThrowOnError extends boolean = false>(options: Options<GetProjectAssignmentsByIdData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetProjectAssignmentsByIdResponse, GetProjectAssignmentsByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/project/{project_id}/assignments'
    });
};

/**
 * Update permissions for a project
 */
export const updateProjectAssignmentsById = <ThrowOnError extends boolean = false>(options: Options<UpdateProjectAssignmentsByIdData, ThrowOnError>) => {
    return (options?.client ?? client).post<UpdateProjectAssignmentsByIdResponse, UpdateProjectAssignmentsByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/project/{project_id}/assignments'
    });
};

/**
 * Get my access to the default project
 */
export const getRoleAccessById = <ThrowOnError extends boolean = false>(options: Options<GetRoleAccessByIdData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetRoleAccessByIdResponse, GetRoleAccessByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/role/{role_id}/access'
    });
};

/**
 * Get user and role assignments of a role
 */
export const getRoleAssignmentsById = <ThrowOnError extends boolean = false>(options: Options<GetRoleAssignmentsByIdData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetRoleAssignmentsByIdResponse, GetRoleAssignmentsByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/role/{role_id}/assignments'
    });
};

/**
 * Update permissions for a role
 */
export const updateRoleAssignmentsById = <ThrowOnError extends boolean = false>(options: Options<UpdateRoleAssignmentsByIdData, ThrowOnError>) => {
    return (options?.client ?? client).post<UpdateRoleAssignmentsByIdResponse, UpdateRoleAssignmentsByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/role/{role_id}/assignments'
    });
};

/**
 * Get my access to the server
 */
export const getServerAccess = <ThrowOnError extends boolean = false>(options?: Options<GetServerAccessData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetServerAccessResponse2, GetServerAccessError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/server/access'
    });
};

/**
 * Get user and role assignments of the server
 */
export const getServerAssignments = <ThrowOnError extends boolean = false>(options?: Options<GetServerAssignmentsData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetServerAssignmentsResponse2, GetServerAssignmentsError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/server/assignments'
    });
};

/**
 * Update permissions for this server
 */
export const updateServerAssignments = <ThrowOnError extends boolean = false>(options: Options<UpdateServerAssignmentsData, ThrowOnError>) => {
    return (options?.client ?? client).post<UpdateServerAssignmentsResponse, UpdateServerAssignmentsError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/server/assignments'
    });
};

/**
 * Get my access to a table
 */
export const getTableAccessById = <ThrowOnError extends boolean = false>(options: Options<GetTableAccessByIdData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetTableAccessByIdResponse, GetTableAccessByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/table/{table_id}/access'
    });
};

/**
 * Get user and role assignments for a table
 */
export const getTableAssignmentsById = <ThrowOnError extends boolean = false>(options: Options<GetTableAssignmentsByIdData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetTableAssignmentsByIdResponse, GetTableAssignmentsByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/table/{table_id}/assignments'
    });
};

/**
 * Update permissions for a table
 */
export const updateTableAssignmentsById = <ThrowOnError extends boolean = false>(options: Options<UpdateTableAssignmentsByIdData, ThrowOnError>) => {
    return (options?.client ?? client).post<UpdateTableAssignmentsByIdResponse, UpdateTableAssignmentsByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/table/{table_id}/assignments'
    });
};

/**
 * Get my access to a view
 */
export const getViewAccessById = <ThrowOnError extends boolean = false>(options: Options<GetViewAccessByIdData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetViewAccessByIdResponse, GetViewAccessByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/view/{view_id}/access'
    });
};

/**
 * Get user and role assignments for a view
 */
export const getViewAssignmentsById = <ThrowOnError extends boolean = false>(options: Options<GetViewAssignmentsByIdData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetViewAssignmentsByIdResponse, GetViewAssignmentsByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/view/{view_id}/assignments'
    });
};

/**
 * Update permissions for a view
 */
export const updateViewAssignmentsById = <ThrowOnError extends boolean = false>(options: Options<UpdateViewAssignmentsByIdData, ThrowOnError>) => {
    return (options?.client ?? client).post<UpdateViewAssignmentsByIdResponse, UpdateViewAssignmentsByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/view/{view_id}/assignments'
    });
};

/**
 * Get Authorization properties of a warehouse
 */
export const getWarehouseById = <ThrowOnError extends boolean = false>(options: Options<GetWarehouseByIdData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetWarehouseByIdResponse, GetWarehouseByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/warehouse/{warehouse_id}'
    });
};

/**
 * Get my access to a warehouse
 */
export const getWarehouseAccessById = <ThrowOnError extends boolean = false>(options: Options<GetWarehouseAccessByIdData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetWarehouseAccessByIdResponse, GetWarehouseAccessByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/warehouse/{warehouse_id}/access'
    });
};

/**
 * Get user and role assignments for a warehouse
 */
export const getWarehouseAssignmentsById = <ThrowOnError extends boolean = false>(options: Options<GetWarehouseAssignmentsByIdData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetWarehouseAssignmentsByIdResponse, GetWarehouseAssignmentsByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/warehouse/{warehouse_id}/assignments'
    });
};

/**
 * Update permissions for a project
 */
export const updateWarehouseAssignmentsById = <ThrowOnError extends boolean = false>(options: Options<UpdateWarehouseAssignmentsByIdData, ThrowOnError>) => {
    return (options?.client ?? client).post<UpdateWarehouseAssignmentsByIdResponse, UpdateWarehouseAssignmentsByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/warehouse/{warehouse_id}/assignments'
    });
};

/**
 * Set managed access property of a warehouse
 */
export const setWarehouseManagedAccess = <ThrowOnError extends boolean = false>(options: Options<SetWarehouseManagedAccessData, ThrowOnError>) => {
    return (options?.client ?? client).post<SetWarehouseManagedAccessResponse, SetWarehouseManagedAccessError, ThrowOnError>({
        ...options,
        url: '/management/v1/permissions/warehouse/{warehouse_id}/managed-access'
    });
};

/**
 * Create a new project
 */
export const createProject = <ThrowOnError extends boolean = false>(options: Options<CreateProjectData, ThrowOnError>) => {
    return (options?.client ?? client).post<CreateProjectResponse2, CreateProjectError, ThrowOnError>({
        ...options,
        url: '/management/v1/project'
    });
};

/**
 * List all projects the requesting user has access to
 */
export const listProjects = <ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) => {
    return (options?.client ?? client).get<ListProjectsResponse2, ListProjectsError, ThrowOnError>({
        ...options,
        url: '/management/v1/project-list'
    });
};

/**
 * Get a specific project by id
 */
export const getProjectById = <ThrowOnError extends boolean = false>(options: Options<GetProjectByIdData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetProjectByIdResponse, GetProjectByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/project/{project_id}'
    });
};

/**
 * Delete the default project
 */
export const deleteProjectById = <ThrowOnError extends boolean = false>(options: Options<DeleteProjectByIdData, ThrowOnError>) => {
    return (options?.client ?? client).delete<DeleteProjectByIdResponse, DeleteProjectByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/project/{project_id}'
    });
};

/**
 * Rename project by id
 */
export const renameProjectById = <ThrowOnError extends boolean = false>(options: Options<RenameProjectByIdData, ThrowOnError>) => {
    return (options?.client ?? client).post<RenameProjectByIdResponse, RenameProjectByIdError, ThrowOnError>({
        ...options,
        url: '/management/v1/project/{project_id}/rename'
    });
};

/**
 * List roles in a project
 */
export const listRoles = <ThrowOnError extends boolean = false>(options?: Options<ListRolesData, ThrowOnError>) => {
    return (options?.client ?? client).get<ListRolesResponse2, ListRolesError, ThrowOnError>({
        ...options,
        url: '/management/v1/role'
    });
};

/**
 * Create a new role
 */
export const createRole = <ThrowOnError extends boolean = false>(options: Options<CreateRoleData, ThrowOnError>) => {
    return (options?.client ?? client).post<CreateRoleResponse, CreateRoleError, ThrowOnError>({
        ...options,
        url: '/management/v1/role'
    });
};

/**
 * Get a role
 */
export const getRole = <ThrowOnError extends boolean = false>(options: Options<GetRoleData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetRoleResponse, GetRoleError, ThrowOnError>({
        ...options,
        url: '/management/v1/role/{id}'
    });
};

/**
 * Update a role
 */
export const updateRole = <ThrowOnError extends boolean = false>(options: Options<UpdateRoleData, ThrowOnError>) => {
    return (options?.client ?? client).post<UpdateRoleResponse, UpdateRoleError, ThrowOnError>({
        ...options,
        url: '/management/v1/role/{id}'
    });
};

/**
 * Delete role
 * All permissions of the role are permanently removed.
 */
export const deleteRole = <ThrowOnError extends boolean = false>(options: Options<DeleteRoleData, ThrowOnError>) => {
    return (options?.client ?? client).delete<DeleteRoleResponse, DeleteRoleError, ThrowOnError>({
        ...options,
        url: '/management/v1/role/{id}'
    });
};

/**
 * Search for roles (Fuzzy)
 */
export const searchRole = <ThrowOnError extends boolean = false>(options: Options<SearchRoleData, ThrowOnError>) => {
    return (options?.client ?? client).post<SearchRoleResponse2, SearchRoleError, ThrowOnError>({
        ...options,
        url: '/management/v1/search/role'
    });
};

/**
 * Search for users (Fuzzy)
 */
export const searchUser = <ThrowOnError extends boolean = false>(options: Options<SearchUserData, ThrowOnError>) => {
    return (options?.client ?? client).post<SearchUserResponse2, SearchUserError, ThrowOnError>({
        ...options,
        url: '/management/v1/search/user'
    });
};

/**
 * List users
 */
export const listUser = <ThrowOnError extends boolean = false>(options?: Options<ListUserData, ThrowOnError>) => {
    return (options?.client ?? client).get<ListUserResponse, ListUserError, ThrowOnError>({
        ...options,
        url: '/management/v1/user'
    });
};

/**
 * Creates the user in the catalog if it does not exist.
 * If the user exists, it updates the users' metadata from the token.
 * The token sent to this endpoint should have "profile" and "email" scopes.
 */
export const createUser = <ThrowOnError extends boolean = false>(options: Options<CreateUserData, ThrowOnError>) => {
    return (options?.client ?? client).post<CreateUserResponse, CreateUserError, ThrowOnError>({
        ...options,
        url: '/management/v1/user'
    });
};

/**
 * Get a user by ID
 */
export const getUser = <ThrowOnError extends boolean = false>(options: Options<GetUserData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetUserResponse, GetUserError, ThrowOnError>({
        ...options,
        url: '/management/v1/user/{id}'
    });
};

/**
 * Update details of a user. Replaces the current details with the new details.
 * If a field is not provided, it is set to `None`.
 */
export const updateUser = <ThrowOnError extends boolean = false>(options: Options<UpdateUserData, ThrowOnError>) => {
    return (options?.client ?? client).put<UpdateUserResponse, UpdateUserError, ThrowOnError>({
        ...options,
        url: '/management/v1/user/{id}'
    });
};

/**
 * Delete user
 * All permissions of the user are permanently removed and need to be re-added
 * if the user is re-registered.
 */
export const deleteUser = <ThrowOnError extends boolean = false>(options: Options<DeleteUserData, ThrowOnError>) => {
    return (options?.client ?? client).delete<DeleteUserResponse, DeleteUserError, ThrowOnError>({
        ...options,
        url: '/management/v1/user/{id}'
    });
};

/**
 * List all warehouses in a project
 * By default, this endpoint does not return deactivated warehouses.
 * To include deactivated warehouses, set the `include_deactivated` query parameter to `true`.
 */
export const listWarehouses = <ThrowOnError extends boolean = false>(options?: Options<ListWarehousesData, ThrowOnError>) => {
    return (options?.client ?? client).get<ListWarehousesResponse2, ListWarehousesError, ThrowOnError>({
        ...options,
        url: '/management/v1/warehouse'
    });
};

/**
 * Create a new warehouse.
 * Create a new warehouse in the given project. The project
 * of a warehouse cannot be changed after creation.
 * The storage configuration is validated by this method.
 */
export const createWarehouse = <ThrowOnError extends boolean = false>(options: Options<CreateWarehouseData, ThrowOnError>) => {
    return (options?.client ?? client).post<CreateWarehouseResponse2, CreateWarehouseError, ThrowOnError>({
        ...options,
        url: '/management/v1/warehouse'
    });
};

/**
 * Get a warehouse by ID
 */
export const getWarehouse = <ThrowOnError extends boolean = false>(options: Options<GetWarehouseData, ThrowOnError>) => {
    return (options?.client ?? client).get<GetWarehouseResponse2, GetWarehouseError, ThrowOnError>({
        ...options,
        url: '/management/v1/warehouse/{warehouse_id}'
    });
};

/**
 * Delete a warehouse by ID
 */
export const deleteWarehouse = <ThrowOnError extends boolean = false>(options: Options<DeleteWarehouseData, ThrowOnError>) => {
    return (options?.client ?? client).delete<DeleteWarehouseResponse, DeleteWarehouseError, ThrowOnError>({
        ...options,
        url: '/management/v1/warehouse/{warehouse_id}'
    });
};

/**
 * Activate a warehouse
 */
export const activateWarehouse = <ThrowOnError extends boolean = false>(options: Options<ActivateWarehouseData, ThrowOnError>) => {
    return (options?.client ?? client).post<ActivateWarehouseResponse, ActivateWarehouseError, ThrowOnError>({
        ...options,
        url: '/management/v1/warehouse/{warehouse_id}/activate'
    });
};

/**
 * Deactivate a warehouse
 */
export const deactivateWarehouse = <ThrowOnError extends boolean = false>(options: Options<DeactivateWarehouseData, ThrowOnError>) => {
    return (options?.client ?? client).post<DeactivateWarehouseResponse, DeactivateWarehouseError, ThrowOnError>({
        ...options,
        url: '/management/v1/warehouse/{warehouse_id}/deactivate'
    });
};

/**
 * Update the Deletion Profile (soft-delete) of a warehouse.
 */
export const updateWarehouseDeleteProfile = <ThrowOnError extends boolean = false>(options: Options<UpdateWarehouseDeleteProfileData, ThrowOnError>) => {
    return (options?.client ?? client).post<UpdateWarehouseDeleteProfileResponse, UpdateWarehouseDeleteProfileError, ThrowOnError>({
        ...options,
        url: '/management/v1/warehouse/{warehouse_id}/delete-profile'
    });
};

/**
 * List soft-deleted tabulars
 * List all soft-deleted tabulars in the warehouse that are visible to you.
 */
export const listDeletedTabulars = <ThrowOnError extends boolean = false>(options: Options<ListDeletedTabularsData, ThrowOnError>) => {
    return (options?.client ?? client).get<ListDeletedTabularsResponse2, ListDeletedTabularsError, ThrowOnError>({
        ...options,
        url: '/management/v1/warehouse/{warehouse_id}/deleted-tabulars'
    });
};

/**
 * Rename a warehouse
 */
export const renameWarehouse = <ThrowOnError extends boolean = false>(options: Options<RenameWarehouseData, ThrowOnError>) => {
    return (options?.client ?? client).post<RenameWarehouseResponse, RenameWarehouseError, ThrowOnError>({
        ...options,
        url: '/management/v1/warehouse/{warehouse_id}/rename'
    });
};

/**
 * Update the storage profile of a warehouse including its storage credential.
 */
export const updateStorageProfile = <ThrowOnError extends boolean = false>(options: Options<UpdateStorageProfileData, ThrowOnError>) => {
    return (options?.client ?? client).post<UpdateStorageProfileResponse, UpdateStorageProfileError, ThrowOnError>({
        ...options,
        url: '/management/v1/warehouse/{warehouse_id}/storage'
    });
};

/**
 * Update the storage credential of a warehouse. The storage profile is not modified.
 * This can be used to update credentials before expiration.
 */
export const updateStorageCredential = <ThrowOnError extends boolean = false>(options: Options<UpdateStorageCredentialData, ThrowOnError>) => {
    return (options?.client ?? client).post<UpdateStorageCredentialResponse, UpdateStorageCredentialError, ThrowOnError>({
        ...options,
        url: '/management/v1/warehouse/{warehouse_id}/storage-credential'
    });
};

/**
 * Get the currently authenticated user
 */
export const whoami = <ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) => {
    return (options?.client ?? client).get<WhoamiResponse, WhoamiError, ThrowOnError>({
        ...options,
        url: '/management/v1/whoami'
    });
};