import * as env from '@/app.config';
import { globals } from '@/common/globals';
import { NamespaceResponse, Type } from '@/common/interfaces';
import * as ice from '@/gen/iceberg/sdk.gen';
import * as iceClient from '@/gen/iceberg/client.gen';
import {
  GetNamespaceResponse,
  ListTablesResponse,
  LoadTableResultReadable,
  LoadViewResultReadable,
  Namespace,
  PageToken,
} from '@/gen/iceberg/types.gen';
import JSONBig from 'json-bigint';

import * as mng from '@/gen/management/sdk.gen';
import * as mngClient from '@/gen/management/client.gen';
import {
  ControlTaskAction,
  ControlTasksRequest,
  CreateRoleRequest,
  CreateWarehouseRequest,
  CreateWarehouseResponse,
  GetEndpointStatisticsRequest,
  GetEndpointStatisticsResponse,
  GetNamespaceAuthPropertiesResponse,
  GetNamespaceProtectionResponse,
  GetProjectResponse,
  GetTaskDetailsResponse,
  GetWarehouseResponse,
  GetWarehouseStatisticsResponse,
  ListDeletedTabularsResponse,
  ListRolesResponse,
  ListTasksRequest,
  ListTasksResponse,
  ListWarehousesResponse,
  NamespaceAction,
  NamespaceAssignment,
  ProjectAction,
  ProjectAssignment,
  ProtectionResponse,
  PurgeQueueConfig,
  RenameProjectRequest,
  Role,
  RoleAction,
  RoleAssignment,
  SearchRoleResponse,
  SearchTabularRequest,
  SearchTabularResponse,
  SearchUserResponse,
  ServerAction,
  ServerAssignment,
  ServerInfo,
  SetWarehouseProtectionResponse,
  StorageCredential,
  StorageProfile,
  TableAction,
  TableAssignment,
  TabularDeleteProfile,
  TabularExpirationQueueConfig,
  TimeWindowSelector,
  UpdateRoleRequest,
  User,
  ViewAction,
  ViewAssignment,
  WarehouseAction,
  WarehouseAssignment,
  WarehouseFilter,
} from '@/gen/management/types.gen';

import router from '@/router';
import { useUserStore } from '@/stores/user';
import { useVisualStore } from '@/stores/visual';
import { App } from 'vue';

// General
function init() {
  const userStore = useUserStore();
  const visual = useVisualStore();
  const accessToken = userStore.user.access_token;

  mngClient.client.setConfig({
    baseUrl: icebergCatalogUrl(),
    headers: { 'x-project-id': visual.projectSelected['project-id'] },
  });

  mngClient.client.interceptors.request.use((request) => {
    request.headers.set('Authorization', `Bearer ${accessToken}`);
    return request;
  });

  iceClient.client.setConfig({
    baseUrl: icebergCatalogUrlSuffixed(),
  });

  iceClient.client.interceptors.request.use((request) => {
    request.headers.set('Authorization', `Bearer ${accessToken}`);
    return request;
  });
}

const icebergCatalogUrl = (): string => {
  let url = env.icebergCatalogUrl;

  if (url === '' || url === undefined) {
    url = `${location.protocol}//${location.hostname}${location.port ? `:${location.port}` : ''}`;
  }

  return url.substring(url.length - 1) === '/' ? url : `${url}/`;
};

const icebergCatalogUrlSuffixed = (): string => {
  return icebergCatalogUrl() + 'catalog/';
};

function parseErrorText(errorText: string): { message: string; code: number } {
  const messageMatch = errorText.match(/: (.*) at/);
  const codeMatch = errorText.match(/: (.*):/);

  const message = messageMatch ? messageMatch[1] : errorText;
  const code = codeMatch ? parseInt(codeMatch[1]) : 0;

  return { message, code };
}

function handleError(error: any, functionError: Error) {
  try {
    const functionName =
      functionError.stack?.split('\n')[1]?.trim()?.split(' ')[1]?.replace('Object.', '') ||
      'unknown';

    // Check if this is a task management related error
    const isTaskFunction = ['listTasks', 'getTaskDetails', 'controlTasks'].includes(functionName);

    // Don't redirect to server-offline for task management failures or if it's already marked as a task error
    if (error.message === 'Failed to fetch' && !isTaskFunction && !error.isTaskManagementError) {
      if (window.location.pathname !== '/server-offline') router.push('/server-offline');
      return;
    }

    // For task management errors, just log them without redirecting
    if (isTaskFunction || error.isTaskManagementError) {
      console.warn('Task management error (not redirecting):', error);
      return;
    }

    setError(error, 3000, functionName, Type.ERROR);
  } catch (newError: any) {
    if (typeof newError === 'string' && error.includes('net::ERR_CONNECTION_REFUSED')) {
      console.error('Connection refused');
    } else {
      console.error('Failed to handle error', newError);
    }
  }
}

function setError(error: any, ttl: number, functionCaused: string, type: Type) {
  const visual = useVisualStore();
  try {
    let message = '';
    let code = 0;
    if (typeof error === 'string') {
      const data = parseErrorText(error);
      message = data.message;
      code = data.code;
    } else {
      const api_error_type = error?.error?.type || '';
      const msg = error?.error?.message || 'An unknown error occurred';
      if (api_error_type !== '') {
        message = `${api_error_type}: ${msg}`;
      }
      code = error?.error?.code;
    }

    if (code === 401) {
      router.push('/login');
    } else {
      visual.setSnackbarMsg({
        function: functionCaused,
        text: message,
        ttl,
        ts: Date.now(),
        type,
      });
    }
  } catch (newError) {
    console.error('Failed to set error', newError);
  }
}

function sendSnackbar(message: string, ttl: number, functionCaused: string, type: Type) {
  const visual = useVisualStore();
  try {
    visual.setSnackbarMsg({
      function: functionCaused,
      text: message,
      ttl,
      ts: Date.now(),
      type,
    });
  } catch (error) {
    console.error('Failed to set error', error);
  }
}

// Server
async function getServerInfo(): Promise<ServerInfo> {
  try {
    const client = mngClient.client;

    const visualStore = useVisualStore();

    const { data, error } = await mng.getServerInfo({ client });
    if (error) throw error;

    visualStore.setServerInfo(data as ServerInfo);

    return data as ServerInfo;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function bootstrapServer(): Promise<boolean> {
  try {
    const client = mngClient.client;

    const { error } = await mng.bootstrap({
      client,
      body: { 'accept-terms-of-use': true },
    });
    if (error) throw error;

    return true;
  } catch (error: any) {
    console.error('Failed to bootstrap server', error);
    handleError(error, new Error());
    return error;
  }
}

// Project
async function loadProjectList(): Promise<GetProjectResponse[]> {
  try {
    const visual = useVisualStore();
    const { data, error } = await mng.listProjects({ client: mngClient.client });
    if (error) throw error;

    if (data) {
      visual.setProjectList(data.projects || []);

      // auto select project if no one is already selected
      if (!visual.projectSelected['project-id']) {
        for (const proj of data.projects || []) {
          Object.assign(useVisualStore().projectSelected, proj);
        }
      }
    }

    return data?.projects || [];
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getProjectById(projectId: string): Promise<GetProjectResponse> {
  try {
    const { data, error } = await mng.getProjectById({
      client: mngClient.client,
      path: { project_id: projectId },
    });
    if (error) throw error;

    if (data === undefined) {
      throw new Error('Failed to get project by ID');
    }

    return data;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function createProject(name: string): Promise<string> {
  try {
    const { data, error } = await mng.createProject({
      client: mngClient.client,
      body: { 'project-name': name },
    });
    if (error) throw error;

    return data?.['project-id'] ?? '';
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}
async function deleteProjectById(projectId: string): Promise<boolean> {
  try {
    const { error } = await mng.deleteProjectById({
      client: mngClient.client,
      path: { project_id: projectId },
    });
    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function renameProjectById(body: RenameProjectRequest, projectId: string): Promise<boolean> {
  try {
    const { error } = await mng.renameProjectById({
      client: mngClient.client,
      body,
      path: { project_id: projectId },
    });
    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getEndpointStatistics(
  warehouseFilter: WarehouseFilter,
  range_specifier?: null | TimeWindowSelector,
  status_codes?: Array<number> | null,
): Promise<GetEndpointStatisticsResponse> {
  try {
    init();

    const getEndpointStatisticsRequest: GetEndpointStatisticsRequest = {
      'range-specifier': range_specifier || null,
      warehouse: warehouseFilter,
      'status-codes': status_codes || null,
    };

    const client = mngClient.client;

    const { data, error } = await mng.getEndpointStatistics({
      client,
      body: getEndpointStatisticsRequest,
    });
    if (error) throw error;

    return data as GetEndpointStatisticsResponse;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}

// Warehouse
async function listWarehouses(): Promise<ListWarehousesResponse> {
  try {
    const client = mngClient.client;

    const { data, error } = await mng.listWarehouses({ client });

    const wh = data as ListWarehousesResponse;
    if (error) throw error;

    return wh;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getWarehouse(id: string): Promise<GetWarehouseResponse> {
  try {
    const client = mngClient.client;

    const { data, error } = await mng.getWarehouse({
      client,
      path: { warehouse_id: id },
    });
    if (error) throw error;

    return data as GetWarehouseResponse;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function createWarehouse(wh: CreateWarehouseRequest): Promise<CreateWarehouseResponse> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.createWarehouse({
      client,
      body: wh,
    });
    if (error) throw error;

    return data as CreateWarehouseResponse;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}

async function getWarehouseStatistics(
  whId: string,
  page_size?: number,
  page_token?: string,
): Promise<GetWarehouseStatisticsResponse> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getWarehouseStatistics({
      client,
      path: {
        warehouse_id: whId,
      },
      query: {
        page_size: page_size,
        page_token: page_token,
      },
    });
    if (error) throw error;

    return data as GetWarehouseStatisticsResponse;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}

async function deleteWarehouse(whId: string) {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.deleteWarehouse({
      client,
      path: {
        warehouse_id: whId,
      },
    });
    if (error) throw error;

    return data;
  } catch (error) {
    handleError(error, new Error());
    return error;
  }
}

async function listDeletedTabulars(
  id: string,
  namespaceId: string,
  pageSizeNumber?: number,
  pageToken?: string,
): Promise<ListDeletedTabularsResponse> {
  try {
    const client = mngClient.client;

    const { data, error } = await mng.listDeletedTabulars({
      client,
      path: { warehouse_id: id },
      query: {
        namespaceId,
        pageSize: pageSizeNumber,
        pageToken,
      },
    });
    if (error) throw error;

    return data as ListDeletedTabularsResponse;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function renameWarehouse(whId: string, name: string): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    await mng.renameWarehouse({
      client,
      body: { 'new-name': name },
      path: {
        warehouse_id: whId,
      },
    });

    // if (data.error) throw new Error(data.error);

    return true;
  } catch (error: any) {
    console.error('Failed to rename warehouse', error);
    handleError(error, new Error());
    throw error;
  }
}

async function updateStorageCredential(whId: string, storageCredentials: StorageCredential) {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.updateStorageCredential({
      client,
      body: { 'new-storage-credential': storageCredentials },
      path: {
        warehouse_id: whId,
      },
    });
    if (error) throw error;
    sendSnackbar('Storage Credential Updated', 3000, 'updateStorageCredential', Type.SUCCESS);

    return data;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}
async function updateStorageProfile(
  whId: string,
  storageCredentials: StorageCredential,
  storageProfile: StorageProfile,
) {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.updateStorageProfile({
      client,
      body: {
        'storage-profile': storageProfile,
        'storage-credential': storageCredentials,
      },
      path: {
        warehouse_id: whId,
      },
    });
    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateWarehouseDeleteProfile(whId: string, deleteProfile: TabularDeleteProfile) {
  try {
    init();

    const client = mngClient.client;

    await mng.updateWarehouseDeleteProfile({
      client,
      body: {
        'delete-profile': deleteProfile,
      },
      path: {
        warehouse_id: whId,
      },
    });

    return true;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}

async function getWarehouseById(warehouseId: string): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getWarehouseById({
      client,

      path: {
        warehouse_id: warehouseId,
      },
    });
    if (error) throw error;

    return data?.['managed-access'] ?? false;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}

async function setWarehouseProtection(
  warehouseId: string,
  protected_state: boolean,
): Promise<SetWarehouseProtectionResponse> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.setWarehouseProtection({
      client,

      path: {
        warehouse_id: warehouseId,
      },
      body: {
        protected: protected_state,
      },
    });
    if (error) throw error;

    return data;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}

// Namespace
async function listNamespaces(
  id: string,
  parentNS?: string,
  page_token?: PageToken,
): Promise<NamespaceResponse> {
  try {
    const client = iceClient.client;
    const { data, error } = await ice.listNamespaces({
      client,
      path: {
        prefix: id,
      },
      query: {
        parent: parentNS,
        returnUuids: true,
        pageToken: page_token || undefined,
        pageSize: 100,
      },
    });

    if (error) throw error;

    const namespaces = data.namespaces as Namespace[];
    const namespaceUuids = data['namespace-uuids'] as string[];
    const namespaceMap: Record<string, string> = {};

    namespaces.forEach((namespaceArray, index) => {
      const namespace = namespaceArray.join('.');
      namespaceMap[namespace] = namespaceUuids[index];
    });

    return { namespaceMap, namespaces, 'next-page-token': data['next-page-token'] ?? undefined };
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function loadNamespaceMetadata(id: string, namespace: string): Promise<GetNamespaceResponse> {
  try {
    const client = iceClient.client;
    const { data, error } = await ice.loadNamespaceMetadata({
      client,
      path: { namespace, prefix: id },
      query: { returnUuid: true },
    });

    if (error) throw error;

    return data as GetNamespaceResponse;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function createNamespace(id: string, namespace: Namespace) {
  try {
    const client = iceClient.client;
    const { data, error } = await ice.createNamespace({
      client,
      path: {
        prefix: id,
      },
      body: { namespace },
    });
    if (error) throw error;

    return data;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function dropNamespace(id: string, ns: string, options?: NamespaceAction) {
  try {
    const client = iceClient.client;
    const { data, error } = await ice.dropNamespace({
      client,
      path: {
        prefix: id,
        namespace: ns,
      },
      query: options as { force?: boolean; recursive?: boolean; purge?: boolean } | undefined,
    });
    if (error) throw error;
    handleSuccess('dropNamespace', 'Namespace deleted successfully');

    return data;
  } catch (error: any) {
    handleError(error, new Error());
    console.error('Failed to drop namespace', error);
    return error;
  }
}

async function getNamespaceById(namespaceId: string): Promise<GetNamespaceAuthPropertiesResponse> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getNamespaceById({
      client,

      path: {
        namespace_id: namespaceId,
      },
    });
    if (error) throw error;

    return data as GetNamespaceAuthPropertiesResponse;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}

async function getNamespaceProtection(
  warehouseId: string,
  namespaceId: string,
): Promise<ProtectionResponse> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getNamespaceProtection({
      client,

      path: {
        warehouse_id: warehouseId,
        namespace_id: namespaceId,
      },
    });
    if (error) throw error;

    return data as GetNamespaceProtectionResponse;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}

async function setNamespaceProtection(
  warehouseId: string,
  namespaceId: string,
  protected_state: boolean,
): Promise<ProtectionResponse> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.setNamespaceProtection({
      client,

      path: {
        warehouse_id: warehouseId,
        namespace_id: namespaceId,
      },
      body: {
        protected: protected_state,
      },
    });
    if (error) throw error;

    return data;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}

// Table
async function listTables(
  id: string,
  ns?: string,
  pageToken?: PageToken,
): Promise<ListTablesResponse> {
  try {
    const client = iceClient.client;
    const { data, error } = await ice.listTables({
      client,
      path: {
        prefix: id,
        namespace: ns ?? '',
      },
      query: { pageToken: pageToken || undefined, pageSize: 1000 },
    });
    if (error) throw error;

    return data as ListTablesResponse;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function loadTable(
  warehouseId: string,
  namespacePath: string,
  tableName: string,
): Promise<LoadTableResultReadable> {
  try {
    const client = iceClient.client;
    const { data, error } = await ice.loadTable({
      client,
      path: {
        prefix: warehouseId,
        namespace: namespacePath,
        table: tableName,
      },
    });
    if (error) throw error;

    return data as LoadTableResultReadable;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function loadTableCustomized(warehouseId: string, namespacePath: string, tableName: string) {
  try {
    const userStore = useUserStore();
    const accessToken = userStore.user.access_token;

    const response = await fetch(
      `${icebergCatalogUrlSuffixed()}v1/${warehouseId}/namespaces/${namespacePath}/tables/${tableName}`,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Error fetching table data: ${response.statusText}`);
    }
    const textData = await response.text();
    const JSONBigString = JSONBig({ storeAsString: true });
    const data = JSONBigString.parse(textData);
    // const data = JSON.parse(textData, (key, value) => {
    //   // If the value is a large number (potentially snapshot-id), convert it to BigInt
    //   if (typeof value === 'number' && value > Number.MAX_SAFE_INTEGER) {

    //     return String(BigInt(value)); // Convert to BigInt to preserve precision
    //   }
    //   return value;
    // });

    return data;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function dropTable(
  warehouseId: string,
  namespacePath: string,
  tableName: string,
  options?: { purgeRequested?: boolean; force?: boolean } | undefined,
): Promise<boolean> {
  try {
    const client = iceClient.client;
    const { error } = await ice.dropTable({
      client,
      path: {
        prefix: warehouseId,
        namespace: namespacePath,
        table: tableName,
      },
      query: options,
    });
    if (error) throw error;

    handleSuccess('Drop Table', 'Table deleted successfully');

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getTableProtection(
  warehouseId: string,
  tableId: string,
): Promise<ProtectionResponse> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getTableProtection({
      client,

      path: {
        warehouse_id: warehouseId,
        table_id: tableId,
      },
    });
    if (error) throw error;

    return data as GetNamespaceProtectionResponse;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}

async function setTableProtection(
  warehouseId: string,
  tableId: string,
  protected_state: boolean,
): Promise<ProtectionResponse> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.setTableProtection({
      client,

      path: {
        warehouse_id: warehouseId,
        table_id: tableId,
      },
      body: {
        protected: protected_state,
      },
    });
    if (error) throw error;

    return data;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}

// View
async function listViews(
  id: string,
  ns?: string,
  page_token?: PageToken,
): Promise<ListTablesResponse> {
  try {
    const client = iceClient.client;
    const { data, error } = await ice.listViews({
      client,
      path: {
        prefix: id,
        namespace: ns ?? '',
      },
      query: { pageToken: page_token || '', pageSize: 1000 },
    });
    if (error) throw error;

    return data as ListTablesResponse;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function loadView(
  warehouseId: string,
  namespacePath: string,
  viewName: string,
): Promise<LoadViewResultReadable> {
  try {
    const client = iceClient.client;
    const { data, error } = await ice.loadView({
      client,
      path: {
        prefix: warehouseId,
        namespace: namespacePath,
        view: viewName,
      },
    });
    if (error) throw error;

    return data as LoadViewResultReadable;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function dropView(
  warehouseId: string,
  namespacePath: string,
  viewName: string,
  options?: { force?: boolean } | undefined,
) {
  try {
    const client = iceClient.client;
    const { data, error } = await ice.dropView({
      client,
      path: {
        prefix: warehouseId,
        namespace: namespacePath,
        view: viewName,
      },
      query: options,
    });

    if (error) throw error;
    handleSuccess('drop View', 'View deleted successfully');

    return data;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getViewProtection(warehouseId: string, viewId: string): Promise<ProtectionResponse> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getViewProtection({
      client,

      path: {
        warehouse_id: warehouseId,
        view_id: viewId,
      },
    });
    if (error) throw error;

    return data as GetNamespaceProtectionResponse;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}

async function setViewProtection(
  warehouseId: string,
  viewId: string,
  protected_state: boolean,
): Promise<ProtectionResponse> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.setViewProtection({
      client,

      path: {
        warehouse_id: warehouseId,
        view_id: viewId,
      },
      body: {
        protected: protected_state,
      },
    });
    if (error) throw error;

    return data;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}

// Tabular
async function undropTabular(warehouseId: string, id: string, type: 'table' | 'view') {
  try {
    const client = mngClient.client;
    const { error } = await mng.undropTabulars({
      client,
      body: { targets: [{ id, type }] },
      path: {
        warehouse_id: warehouseId,
      },
    });

    if (error) throw error;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

// Assignments
async function getWarehouseAssignmentsById(warehouseId: string): Promise<WarehouseAssignment[]> {
  try {
    const visual = useVisualStore();
    const authOff = visual.getServerInfo()['authz-backend'] === 'allow-all' ? true : false;

    if (!env.enabledAuthentication || authOff) return [];
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getWarehouseAssignmentsById({
      client,
      path: {
        warehouse_id: warehouseId,
      },
    });

    if (error) throw error;

    return (data ?? {}).assignments as WarehouseAssignment[];
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateWarehouseAssignmentsById(
  warehouseId: string,
  deletes: WarehouseAssignment[],
  writes: WarehouseAssignment[],
): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    const { error } = await mng.updateWarehouseAssignmentsById({
      client,
      body: { deletes, writes },
      path: {
        warehouse_id: warehouseId,
      },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function setWarehouseManagedAccess(
  warehouseId: string,
  managedAccess: boolean,
): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    const { error } = await mng.setWarehouseManagedAccess({
      client,
      body: { 'managed-access': managedAccess },
      path: {
        warehouse_id: warehouseId,
      },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getRoleAssignmentsById(roleId: string): Promise<RoleAssignment[]> {
  try {
    const visual = useVisualStore();
    const authOff = visual.getServerInfo()['authz-backend'] === 'allow-all' ? true : false;

    if (!env.enabledAuthentication || authOff) return [];

    init();

    const client = mngClient.client;

    const { data, error } = await mng.getRoleAssignmentsById({
      client,
      path: {
        role_id: roleId,
      },
    });

    if (error) throw error;

    return ((data ?? {}).assignments as RoleAssignment[]) ?? [];
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateRoleAssignmentsById(
  roleId: string,
  deletes: RoleAssignment[],
  writes: RoleAssignment[],
): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    const { error } = await mng.updateRoleAssignmentsById({
      client,
      body: { deletes, writes },
      path: {
        role_id: roleId,
      },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getServerAssignments(): Promise<ServerAssignment[]> {
  try {
    const visual = useVisualStore();
    const authOff = visual.getServerInfo()['authz-backend'] === 'allow-all' ? true : false;

    if (!env.enabledAuthentication || authOff) return [];

    init();

    const client = mngClient.client;
    const { data, error } = await mng.getServerAssignments({
      client,
    });

    if (error) throw error;

    const assignments = ((data ?? {}).assignments as ServerAssignment[]) ?? [];
    return assignments;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateServerAssignments(
  deletes: ServerAssignment[],
  writes: ServerAssignment[],
): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    const { error } = await mng.updateServerAssignments({
      client,
      body: { deletes, writes },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getProjectAssignments(): Promise<ProjectAssignment[]> {
  try {
    const visual = useVisualStore();
    const authOff = visual.getServerInfo()['authz-backend'] === 'allow-all' ? true : false;

    if (!env.enabledAuthentication || authOff) return [];

    init();

    const client = mngClient.client;
    const { data, error } = await mng.getProjectAssignments({
      client,
    });

    if (error) throw error;

    const assignments = ((data ?? {}).assignments as ProjectAssignment[]) ?? [];
    return assignments;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateProjectAssignments(
  deletes: ProjectAssignment[],
  writes: ProjectAssignment[],
): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    const { error } = await mng.updateProjectAssignments({
      client,
      body: { deletes, writes },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getNamespaceAssignmentsById(namespaceId: string): Promise<NamespaceAssignment[]> {
  try {
    const visual = useVisualStore();
    const authOff = visual.getServerInfo()['authz-backend'] === 'allow-all' ? true : false;

    if (!env.enabledAuthentication || authOff) return [];

    init();

    const client = mngClient.client;
    const { data, error } = await mng.getNamespaceAssignmentsById({
      client,
      path: {
        namespace_id: namespaceId,
      },
    });

    if (error) throw error;

    const assignments = ((data ?? {}).assignments as NamespaceAssignment[]) ?? [];
    return assignments;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateNamespaceAssignmentsById(
  namespaceId: string,
  deletes: NamespaceAssignment[],
  writes: NamespaceAssignment[],
): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    const { error } = await mng.updateNamespaceAssignmentsById({
      client,
      body: { deletes, writes },
      path: {
        namespace_id: namespaceId,
      },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function setNamespaceManagedAccess(
  namespaceId: string,
  managedAccess: boolean,
): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    const { error } = await mng.setNamespaceManagedAccess({
      client,
      body: { 'managed-access': managedAccess },
      path: {
        namespace_id: namespaceId,
      },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getTableAssignmentsById(
  tableId: string,
  warehouseId: string,
): Promise<TableAssignment[]> {
  try {
    const visual = useVisualStore();
    const authOff = visual.getServerInfo()['authz-backend'] === 'allow-all' ? true : false;

    if (!env.enabledAuthentication || authOff) return [];

    init();

    const client = mngClient.client;
    const { data, error } = await mng.getTableAssignmentsById({
      client,
      path: {
        table_id: tableId,
        warehouse_id: warehouseId,
      },
    });

    if (error) throw error;

    const assignments = ((data ?? {}).assignments as TableAssignment[]) ?? [];
    return assignments;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateTableAssignmentsById(
  tableId: string,
  deletes: TableAssignment[],
  writes: TableAssignment[],
  warehouseId: string,
): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    const { error } = await mng.updateTableAssignmentsById({
      client,
      body: { deletes, writes },
      path: {
        table_id: tableId,
        warehouse_id: warehouseId,
      },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getViewAssignmentsById(
  viewId: string,
  warehouseId: string,
): Promise<ViewAssignment[]> {
  try {
    const visual = useVisualStore();
    const authOff = visual.getServerInfo()['authz-backend'] === 'allow-all' ? true : false;

    if (!env.enabledAuthentication || authOff) return [];

    init();

    const client = mngClient.client;
    const { data, error } = await mng.getViewAssignmentsById({
      client,
      path: {
        view_id: viewId,
        warehouse_id: warehouseId,
      },
    });

    if (error) throw error;

    return ((data ?? {}).assignments as ViewAssignment[]) ?? [];
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateViewAssignmentsById(
  viewId: string,
  deletes: ViewAssignment[],
  writes: ViewAssignment[],
  warehouseId: string,
): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    const { error } = await mng.updateViewAssignmentsById({
      client,
      body: { deletes, writes },
      path: {
        view_id: viewId,
        warehouse_id: warehouseId,
      },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

// User
async function createUser() {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.createUser({
      client,
      body: { 'update-if-exists': true },
    });
    if (error) throw error;

    return data;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function whoAmI() {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.whoami({
      client,
    });
    if (error) throw error;

    return data;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function searchUser(search: string): Promise<User[]> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.searchUser({
      client,
      body: { search },
    });

    if (error) throw error;

    return ((data as SearchUserResponse) ?? []).users as User[];
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function searchTabular(
  warehouseId: string,
  request: SearchTabularRequest,
): Promise<SearchTabularResponse> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.searchTabular({
      client,
      path: {
        warehouse_id: warehouseId,
      },
      body: request,
    });

    if (error) throw error;

    return (data as SearchTabularResponse) ?? { tabulars: [] };
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getUser(userId: string): Promise<User> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getUser({
      client,
      path: {
        user_id: userId,
      },
    });

    if (error) throw error;

    return data as User;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function deleteUser(userId: string): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    const { error } = await mng.deleteUser({
      client,
      path: {
        user_id: userId,
      },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function listUser(
  pageToken?: string,
  pageSize?: number,
): Promise<{ users: User[]; 'next-page-token'?: string }> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.listUser({
      client,
      query: {
        pageToken: pageToken || undefined,
        pageSize: pageSize || 50,
      },
    });

    if (error) throw error;

    return {
      users: data?.users as User[],
      'next-page-token': data?.['next-page-token'] || undefined,
    };
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateUserById(name: string, userId: string): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    const { error } = await mng.updateUser({
      client,
      body: {
        name,
        'user-type': 'application',
      },
      path: {
        user_id: userId,
      },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

// Roles
async function searchRole(search: string): Promise<Role[]> {
  try {
    init();

    const visual = useVisualStore();
    const client = mngClient.client;

    const { data, error } = await mng.searchRole({
      client,
      body: {
        'project-id': visual.projectSelected['project-id'] || '',
        search,
      },
    });

    if (error) throw error;

    return ((data as SearchRoleResponse) ?? []).roles as Role[];
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function listRoles(pageSize?: number, pageToken?: string): Promise<ListRolesResponse> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.listRoles({
      client,
      query: {
        pageSize,
        pageToken,
      },
    });

    if (error) throw error;

    return (data as ListRolesResponse) ?? { roles: [] };
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getRole(roleId: string): Promise<Role> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getRole({
      client,
      path: { role_id: roleId },
    });

    if (error) throw error;

    return data as Role;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function createRole(name: string, description?: string): Promise<Role> {
  try {
    init();

    const client = mngClient.client;
    const visual = useVisualStore();

    const body: CreateRoleRequest = {
      name,
      description: description || '',
      'project-id': visual.projectSelected['project-id'],
    };

    const { data, error } = await mng.createRole({
      client,
      body,
    });

    if (error) throw error;

    return data as Role;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateRole(roleId: string, name: string, description?: string): Promise<Role> {
  try {
    init();

    const client = mngClient.client;

    const body: UpdateRoleRequest = {
      name,
      description: description || '',
    };

    const { data, error } = await mng.updateRole({
      client,
      body,
      path: { role_id: roleId },
    });

    if (error) throw error;

    return data as Role;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function deleteRole(roleId: string): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    await mng.deleteRole({
      client,
      path: { role_id: roleId },
    });

    return true;
  } catch (error: any) {
    console.error('Failed to delete role', error);
    handleError(error, new Error());
    throw error;
  }
}

// Tasks

async function getTaskQueueConfigTabularExpiration(
  warehouseId: string,
): Promise<TabularExpirationQueueConfig> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getTaskQueueConfigTabularExpiration({
      client,
      path: { warehouse_id: warehouseId },
    });

    if (error) throw error;

    return data as TabularExpirationQueueConfig;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function setTaskQueueConfigTabularExpiration(
  warehouseId: string,
  config: TabularExpirationQueueConfig,
): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    const { error } = await mng.setTaskQueueConfigTabularExpiration({
      client,
      path: { warehouse_id: warehouseId },
      body: config,
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getTaskQueueConfigTabularPurge(warehouseId: string): Promise<PurgeQueueConfig> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getTaskQueueConfigTabularPurge({
      client,
      path: { warehouse_id: warehouseId },
    });

    if (error) throw error;

    return data as PurgeQueueConfig;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function setTaskQueueConfigTabularPurge(
  warehouseId: string,
  config: PurgeQueueConfig,
): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    const { error } = await mng.setTaskQueueConfigTabularPurge({
      client,
      path: { warehouse_id: warehouseId },
      body: config,
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getTaskDetails(
  warehouseId: string,
  taskId: string,
): Promise<GetTaskDetailsResponse> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getTaskDetails({
      client,
      path: { warehouse_id: warehouseId, task_id: taskId },
    });

    if (error) throw error;

    return data as GetTaskDetailsResponse;
  } catch (error: any) {
    // Handle CORS preflight failures and 404 errors gracefully without redirecting to server-offline
    if (
      error?.response?.status === 404 ||
      error?.status === 404 ||
      error?.message?.includes('CORS') ||
      error?.message?.includes('preflight') ||
      error?.message?.includes('OPTIONS') ||
      (error?.name === 'TypeError' && error?.message?.includes('fetch'))
    ) {
      const taskError = new Error(
        `Task details not found: ${error?.message || 'Task not found or CORS issue'}`,
      );
      (taskError as any).response = { status: 404 };
      (taskError as any).isTaskManagementError = true;
      throw taskError;
    }

    handleError(error, new Error());
    throw error;
  }
}

async function controlTasks(
  warehouseId: string,
  action: ControlTaskAction,
  taskIds: string[],
): Promise<boolean> {
  try {
    init();

    const client = mngClient.client;

    const body: ControlTasksRequest = {
      action,
      'task-ids': taskIds,
    };

    const { error } = await mng.controlTasks({
      client,
      path: { warehouse_id: warehouseId },
      body,
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    // Handle CORS preflight failures and 404 errors gracefully without redirecting to server-offline
    if (
      error?.response?.status === 404 ||
      error?.status === 404 ||
      error?.message?.includes('CORS') ||
      error?.message?.includes('preflight') ||
      error?.message?.includes('OPTIONS') ||
      (error?.name === 'TypeError' && error?.message?.includes('fetch'))
    ) {
      const taskError = new Error(
        `Task control not available: ${error?.message || 'Endpoint not found or CORS issue'}`,
      );
      (taskError as any).response = { status: 404 };
      (taskError as any).isTaskManagementError = true;
      throw taskError;
    }

    handleError(error, new Error());
    throw error;
  }
}

async function listTasks(
  warehouseId: string,
  request: ListTasksRequest,
): Promise<ListTasksResponse> {
  try {
    init();

    const client = mngClient.client;

    const { data, error } = await mng.listTasks({
      client,
      path: { warehouse_id: warehouseId },
      body: request,
    });

    if (error) throw error;

    return data as ListTasksResponse;
  } catch (error: any) {
    // Handle CORS preflight failures and 404 errors gracefully without redirecting to server-offline
    if (
      error?.response?.status === 404 ||
      error?.status === 404 ||
      error?.message?.includes('CORS') ||
      error?.message?.includes('preflight') ||
      error?.message?.includes('OPTIONS') ||
      (error?.name === 'TypeError' && error?.message?.includes('fetch'))
    ) {
      // Create a meaningful 404 error that won't trigger redirect
      const taskError = new Error(
        `Task management not available: ${error?.message || 'Endpoint not found or CORS issue'}`,
      );
      (taskError as any).response = { status: 404 };
      (taskError as any).isTaskManagementError = true;
      throw taskError;
    }

    // For other errors, use the standard error handling
    handleError(error, new Error());
    throw error;
  }
}

// Access

async function getServerAccess(): Promise<ServerAction[]> {
  try {
    const visual = useVisualStore();
    const authOff = visual.getServerInfo()['authz-backend'] === 'allow-all' ? true : false;

    if (!env.enabledAuthentication || authOff) return globals.serverActions as ServerAction[];

    init();

    const client = mngClient.client;

    const { data, error } = await mng.getServerAccess({
      client,
    });

    if (error) throw error;

    const actions = (data ?? {})['allowed-actions'] as ServerAction[];

    return actions;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getProjectAccess(): Promise<ProjectAction[]> {
  try {
    const visual = useVisualStore();
    const authOff = visual.getServerInfo()['authz-backend'] === 'allow-all' ? true : false;

    if (!env.enabledAuthentication || authOff) return globals.projectActions as ProjectAction[];
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getProjectAccess({ client });

    if (error) throw error;

    const actions = (data ?? {})['allowed-actions'] as ProjectAction[];

    return actions;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getProjectAccessById(projectId: string): Promise<ProjectAction[]> {
  try {
    const visual = useVisualStore();
    const authOff = visual.getServerInfo()['authz-backend'] === 'allow-all' ? true : false;

    if (!env.enabledAuthentication || authOff) return globals.projectActions as ProjectAction[];
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getProjectAccessById({
      client,
      path: { project_id: projectId },
    });

    if (error) throw error;

    const actions = (data ?? {})['allowed-actions'] as ProjectAction[];

    return actions;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getWarehouseAccessById(warehouseId: string): Promise<WarehouseAction[]> {
  try {
    const visual = useVisualStore();
    const authOff = visual.getServerInfo()['authz-backend'] === 'allow-all' ? true : false;

    if (!env.enabledAuthentication || authOff) return globals.warehouseActions as WarehouseAction[];
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getWarehouseAccessById({
      client,
      path: {
        warehouse_id: warehouseId,
      },
    });

    if (error) throw error;

    const actions = (data ?? {})['allowed-actions'] as WarehouseAction[];

    return actions;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}
async function getNamespaceAccessById(namespaceId: string): Promise<NamespaceAction[]> {
  try {
    const visual = useVisualStore();
    const authOff = visual.getServerInfo()['authz-backend'] === 'allow-all' ? true : false;

    if (!env.enabledAuthentication || authOff) return globals.namespaceActions as NamespaceAction[];
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getNamespaceAccessById({
      client,
      path: {
        namespace_id: namespaceId,
      },
    });

    if (error) throw error;

    const actions = (data ?? {})['allowed-actions'] as NamespaceAction[];

    return actions;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function getTableAccessById(tableId: string, warehouseId: string): Promise<TableAction[]> {
  try {
    const visual = useVisualStore();
    const authOff = visual.getServerInfo()['authz-backend'] === 'allow-all' ? true : false;

    if (!env.enabledAuthentication || authOff) return globals.tableActions as TableAction[];

    init();

    const client = mngClient.client;

    const { data, error } = await mng.getTableAccessById({
      client,
      path: {
        table_id: tableId,
        warehouse_id: warehouseId,
      },
    });

    if (error) throw error;

    const actions = (data ?? {})['allowed-actions'] as TableAction[];

    return actions;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function getViewAccessById(viewId: string, warehouseId: string): Promise<ViewAction[]> {
  try {
    const visual = useVisualStore();
    const authOff = visual.getServerInfo()['authz-backend'] === 'allow-all' ? true : false;

    if (!env.enabledAuthentication || authOff) return globals.viewActions as ViewAction[];
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getViewAccessById({
      client,
      path: {
        view_id: viewId,
        warehouse_id: warehouseId,
      },
    });

    if (error) throw error;

    const actions = (data ?? {})['allowed-actions'] as ViewAction[];

    return actions;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function getRoleAccessById(roleId: string): Promise<RoleAction[]> {
  try {
    const visual = useVisualStore();
    const authOff = visual.getServerInfo()['authz-backend'] === 'allow-all' ? true : false;

    if (!env.enabledAuthentication || authOff) return globals.roleActions as RoleAction[];
    init();

    const client = mngClient.client;

    const { data, error } = await mng.getRoleAccessById({
      client,
      path: {
        role_id: roleId,
      },
    });

    if (error) throw error;

    const actions = (data ?? {})['allowed-actions'] as RoleAction[];

    return actions;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}
function handleSuccess(functionName: string, msg: string) {
  const visual = useVisualStore();

  visual.setSnackbarMsg({
    function: functionName,
    text: msg,
    ttl: 3000,
    ts: Date.now(),
    type: Type.SUCCESS,
  });
}
// internal
function copyToClipboard(text: string) {
  const visual = useVisualStore();
  const t = `${text}`;

  setTimeout(() => {
    navigator.clipboard.writeText(t).then(
      () => {
        const msg = `Copied to clipboard: ${t.substring(0, 20)}...`;

        visual.setSnackbarMsg({
          function: 'copyToClipboard',
          text: msg,
          ttl: 3000,
          ts: Date.now(),
          type: Type.SUCCESS,
        });
      },
      (err) => {
        console.error('failed', err);
        const msg = `Failed to copy: ${err} ${t}`;
        visual.setSnackbarMsg({
          function: 'copyToClipboard',
          text: msg,
          ttl: 3000,
          ts: Date.now(),
          type: Type.ERROR,
        });
      },
    );
  });
}

export function useFunctions() {
  init();
  return {
    getServerInfo,
    loadProjectList,
    listWarehouses,
    getWarehouse,
    listNamespaces,
    createNamespace,
    listTables,
    dropNamespace,
    setError,
    createUser,
    bootstrapServer,
    createWarehouse,
    deleteWarehouse,
    getProjectAccess,
    getWarehouseAccessById,
    getNamespaceAccessById,
    getWarehouseAssignmentsById,
    updateWarehouseAssignmentsById,
    searchRole,
    searchTabular,
    listRoles,
    deleteRole,
    getRole,
    createRole,
    updateRole,
    getRoleAssignmentsById,
    updateRoleAssignmentsById,
    getUser,
    searchUser,
    copyToClipboard,
    whoAmI,
    getServerAssignments,
    updateServerAssignments,
    icebergCatalogUrl,
    icebergCatalogUrlSuffixed,
    getServerAccess,
    getNamespaceAssignmentsById,
    updateNamespaceAssignmentsById,
    loadNamespaceMetadata,
    listViews,
    listDeletedTabulars,
    getTableAccessById,
    loadTable,
    loadTableCustomized,
    loadView,
    getViewAccessById,
    updateTableAssignmentsById,
    updateViewAssignmentsById,
    getTableAssignmentsById,
    getViewAssignmentsById,
    getProjectAssignments,
    updateProjectAssignments,
    getRoleAccessById,
    renameWarehouse,
    updateStorageCredential,
    updateStorageProfile,
    updateWarehouseDeleteProfile,
    dropView,
    dropTable,
    listUser,
    deleteUser,
    createProject,
    renameProjectById,
    deleteProjectById,
    setWarehouseManagedAccess,
    setNamespaceManagedAccess,
    getNamespaceById,
    getWarehouseById,
    getProjectById,
    updateUserById,
    undropTabular,
    getWarehouseStatistics,
    getEndpointStatistics,
    setWarehouseProtection,
    setNamespaceProtection,
    getNamespaceProtection,
    getTableProtection,
    setTableProtection,
    setViewProtection,
    getViewProtection,
    getProjectAccessById,
    // Task functions
    getTaskQueueConfigTabularExpiration,
    setTaskQueueConfigTabularExpiration,
    getTaskQueueConfigTabularPurge,
    setTaskQueueConfigTabularPurge,
    getTaskDetails,
    controlTasks,
    listTasks,
  };
}

export default {
  install: (app: App) => {
    const functions = useFunctions();
    app.provide('functions', functions);
    app.config.globalProperties.$functions = functions;
  },
};
