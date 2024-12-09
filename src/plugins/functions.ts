import { App } from "vue";
import { useUserStore } from "@/stores/user";
import { useVisualStore } from "@/stores/visual";
import * as env from "@/app.config";
import { globals } from "@/common/globals";

import * as mng from "@/gen/management/services.gen";
import * as ice from "@/gen/iceberg/services.gen";
import {
  CreateRoleRequest,
  CreateWarehouseRequest,
  CreateWarehouseResponse,
  GetNamespaceAuthPropertiesResponse,
  GetProjectResponse,
  GetWarehouseResponse,
  ListDeletedTabularsResponse,
  ListRolesResponse,
  ListWarehousesResponse,
  NamespaceAction,
  NamespaceAssignment,
  ProjectAction,
  ProjectAssignment,
  RenameProjectRequest,
  Role,
  RoleAction,
  RoleAssignment,
  SearchRoleResponse,
  SearchUserResponse,
  ServerAction,
  ServerAssignment,
  ServerInfo,
  StorageCredential,
  StorageProfile,
  TableAction,
  TableAssignment,
  TabularDeleteProfile,
  UpdateRoleRequest,
  User,
  ViewAction,
  ViewAssignment,
  WarehouseAction,
  WarehouseAssignment,
} from "@/gen/management/types.gen";
import {
  GetNamespaceResponse,
  ListTablesResponse,
  LoadTableResult,
  LoadViewResult,
  Namespace,
} from "@/gen/iceberg/types.gen";

import router from "@/router";
import { NamespaceResponse, Type } from "@/common/interfaces";

//General
function init() {
  const userStore = useUserStore();
  const access_token = userStore.user.access_token;

  mng.client.setConfig({
    baseUrl: env.icebergCatalogUrl,
  });

  mng.client.interceptors.request.use((request, options) => {
    request.headers.set("Authorization", `Bearer ${access_token}`);
    return request;
  });

  ice.client.setConfig({
    baseUrl: env.icebergCatalogUrl + "/catalog/",
  });

  ice.client.interceptors.request.use((request, options) => {
    request.headers.set("Authorization", `Bearer ${access_token}`);
    return request;
  });
}

function parseErrorText(errorText: string): { message: string; code: number } {
  let messageMatch = errorText.match(/: (.*) at/);
  const codeMatch = errorText.match(/: (.*):/);

  const message = messageMatch ? messageMatch[1] : errorText;
  const code = codeMatch ? parseInt(codeMatch[1]) : 0;

  return { message, code };
}

function handleError(error: any, functionError: Error) {
  try {
    if (error.message === "Failed to fetch") {
      if (window.location.pathname !== "/server-offline")
        router.push("/server-offline");

      return;
    }

    const functionName =
      functionError.stack
        ?.split("\n")[1]
        ?.trim()
        ?.split(" ")[1]
        .replace("Object.", "") || "unknown";

    setError(error, 3000, functionName, Type.ERROR);
  } catch (error: any) {
    if (
      typeof error === "string" &&
      error.includes("net::ERR_CONNECTION_REFUSED")
    ) {
      console.error("Connection refused");
    } else {
      console.error("Failed to handle error", error);
    }
  }
}

function setError(error: any, ttl: number, functionCaused: string, type: Type) {
  const visual = useVisualStore();
  try {
    let message = "";
    let code = 0;

    if (typeof error === "string") {
      const data = parseErrorText(error);
      message = data.message;
      code = data.code;
    } else {
      message = error?.error?.message || "An unknown error occurred";
      code = error?.error?.code;
    }

    if (code == 401) {
      router.push("/login");
    } else {
      visual.setSnackbarMsg({
        function: functionCaused,
        text: message,
        ttl: ttl,
        ts: Date.now(),
        type: type,
      });
    }
  } catch (error) {
    console.error("Failed to set error", error);
  }
}

function sendSnackbar(
  message: string,
  ttl: number,
  functionCaused: string,
  type: Type
) {
  const visual = useVisualStore();
  try {
    visual.setSnackbarMsg({
      function: functionCaused,
      text: message,
      ttl: ttl,
      ts: Date.now(),
      type: type,
    });
  } catch (error) {
    console.error("Failed to set error", error);
  }
}

//Server
async function getServerInfo(): Promise<ServerInfo> {
  try {
    const client = mng.client;

    const visualStore = useVisualStore();

    const { data, error } = await mng.getServerInfo({ client });
    if (error) throw error;

    visualStore.setProjectCatalog(data as ServerInfo);

    return data as ServerInfo;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function bootstrapServer(): Promise<boolean> {
  try {
    const client = mng.client;

    const { error } = await mng.bootstrap({
      client,
      body: { "accept-terms-of-use": true },
    });
    if (error) throw error;

    return true;
  } catch (error: any) {
    console.error("Failed to bootstrap server", error);
    handleError(error, new Error());
    return error;
  }
}

//Project
async function loadProjectList(): Promise<GetProjectResponse[]> {
  try {
    const { data, error } = await mng.listProjects({ client: mng.client });
    if (error) throw error;

    if (data) {
      useVisualStore().setProjectList(data.projects || []);

      //auto select project
      for (const proj of data.projects || []) {
        Object.assign(useVisualStore().projectSelected, proj);
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
      client: mng.client,
      path: { project_id: projectId },
    });
    if (error) throw error;

    if (data === undefined) {
      throw new Error("Failed to get project by ID");
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
      client: mng.client,
      body: { "project-name": name },
    });
    if (error) throw error;

    return data?.["project-id"] ?? "";
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}
async function deleteProjectById(projectId: string): Promise<boolean> {
  try {
    const { error } = await mng.deleteProjectById({
      client: mng.client,
      path: { project_id: projectId },
    });
    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function renameProjectById(
  body: RenameProjectRequest,
  projectId: string
): Promise<boolean> {
  try {
    const { error } = await mng.renameProjectById({
      client: mng.client,
      body: body,
      path: { project_id: projectId },
    });
    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

//Warehouse
async function listWarehouses(): Promise<ListWarehousesResponse> {
  try {
    const client = mng.client;

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
    const client = mng.client;

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

async function createWarehouse(
  wh: CreateWarehouseRequest
): Promise<CreateWarehouseResponse> {
  try {
    init();

    const client = mng.client;

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

async function deleteWarehouse(whId: string) {
  try {
    init();

    const client = mng.client;

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
  pageToken?: string
): Promise<ListDeletedTabularsResponse> {
  try {
    const client = mng.client;

    const { data, error } = await mng.listDeletedTabulars({
      client,
      path: { warehouse_id: id },
      query: {
        namespaceId: namespaceId,
        pageSize: pageSizeNumber,
        pageToken: pageToken,
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

    const client = mng.client;

    await mng.renameWarehouse({
      client,
      body: { "new-name": name },
      path: {
        warehouse_id: whId,
      },
    });

    // if (data.error) throw new Error(data.error);

    return true;
  } catch (error: any) {
    console.error("Failed to rename warehouse", error);
    handleError(error, new Error());
    throw error;
  }
}

async function updateStorageCredential(
  whId: string,
  storageCredentials: StorageCredential
) {
  try {
    init();

    const client = mng.client;

    const { data, error } = await mng.updateStorageCredential({
      client,
      body: { "new-storage-credential": storageCredentials },
      path: {
        warehouse_id: whId,
      },
    });
    if (error) throw error;
    sendSnackbar(
      "Storage Credential Updated",
      3000,
      "updateStorageCredential",
      Type.SUCCESS
    );

    return data;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}
async function updateStorageProfile(
  whId: string,
  storageCredentials: StorageCredential,
  storageProfile: StorageProfile
) {
  try {
    init();

    const client = mng.client;

    await mng.updateStorageProfile({
      client,
      body: {
        "storage-profile": storageProfile,
        "storage-credential": storageCredentials,
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

async function updateWarehouseDeleteProfile(
  whId: string,
  deleteProfile: TabularDeleteProfile
) {
  try {
    init();

    const client = mng.client;

    await mng.updateWarehouseDeleteProfile({
      client,
      body: {
        "delete-profile": deleteProfile,
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

    const client = mng.client;

    const { data, error } = await mng.getWarehouseById({
      client,

      path: {
        warehouse_id: warehouseId,
      },
    });
    if (error) throw error;

    return data?.["managed-access"] ?? false;
  } catch (error) {
    handleError(error, new Error());
    throw error;
  }
}

//Namespace
async function listNamespaces(
  id: string,
  parentNS?: string
): Promise<NamespaceResponse> {
  try {
    const client = ice.client;
    const { data, error } = await ice.listNamespaces({
      client,
      path: {
        prefix: id,
      },
      query: { parent: parentNS, returnUuids: true },
    });

    if (error) throw error;

    const namespaces = data.namespaces as Namespace[];
    const namespaceUuids = data["namespace-uuids"] as string[];
    const namespaceMap: Record<string, string> = {};

    namespaces.forEach((namespaceArray, index) => {
      const namespace = namespaceArray.join(".");
      const uuid = namespaceUuids[index];
      namespaceMap[namespace] = uuid;
    });

    return { namespaceMap, namespaces };
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function loadNamespaceMetadata(
  id: string,
  namespace: string
): Promise<GetNamespaceResponse> {
  try {
    const client = ice.client;
    const { data, error } = await ice.loadNamespaceMetadata({
      client,
      path: { namespace: namespace, prefix: id },
      query: { returnUuids: true },
    });

    if (error) throw error;

    data as GetNamespaceResponse;

    return data;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function createNamespace(id: string, namespace: Namespace) {
  try {
    const client = ice.client;
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

async function dropNamespace(id: string, ns: string) {
  try {
    const client = ice.client;
    const { data, error } = await ice.dropNamespace({
      client,
      path: {
        prefix: id,
        namespace: ns,
      },
    });
    if (error) throw error;

    return data;
  } catch (error: any) {
    handleError(error, new Error());
    console.error("Failed to drop namespace", error);
    return error;
  }
}

async function getNamespaceById(
  namespaceId: string
): Promise<GetNamespaceAuthPropertiesResponse> {
  try {
    init();

    const client = mng.client;

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

//Table
async function listTables(
  id: string,
  ns?: string
): Promise<ListTablesResponse> {
  try {
    const client = ice.client;
    const { data, error } = await ice.listTables({
      client,
      path: {
        prefix: id,
        namespace: ns ?? "",
      },
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
  tableName: string
): Promise<LoadTableResult> {
  try {
    const client = ice.client;
    const { data, error } = await ice.loadTable({
      client,
      path: {
        prefix: warehouseId,
        namespace: namespacePath,
        table: tableName,
      },
    });
    if (error) throw error;

    return data as LoadTableResult;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function dropTable(
  warehouseId: string,
  namespacePath: string,
  tableName: string
): Promise<boolean> {
  try {
    const client = ice.client;
    const { error } = await ice.dropTable({
      client,
      path: {
        prefix: warehouseId,
        namespace: namespacePath,
        table: tableName,
      },
    });
    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

//View
async function listViews(id: string, ns?: string): Promise<ListTablesResponse> {
  try {
    const client = ice.client;
    const { data, error } = await ice.listViews({
      client,
      path: {
        prefix: id,
        namespace: ns ?? "",
      },
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
  viewName: string
): Promise<LoadViewResult> {
  try {
    const client = ice.client;
    const { data, error } = await ice.loadView({
      client,
      path: {
        prefix: warehouseId,
        namespace: namespacePath,
        view: viewName,
      },
    });
    if (error) throw error;

    return data as LoadViewResult;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function dropView(
  warehouseId: string,
  namespacePath: string,
  viewName: string
): Promise<boolean> {
  try {
    const client = ice.client;
    const { error } = await ice.dropView({
      client,
      path: {
        prefix: warehouseId,
        namespace: namespacePath,
        view: viewName,
      },
    });
    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

//Assignments
async function getWarehouseAssignmentsById(
  warehouse_id: string
): Promise<WarehouseAssignment[]> {
  try {
    if (!env.enabledAuthorization) return [];
    init();

    const client = mng.client;

    const { data, error } = await mng.getWarehouseAssignmentsById({
      client,
      path: {
        warehouse_id: warehouse_id,
      },
    });

    if (error) throw error;

    const assignments = (data ?? {})["assignments"] as WarehouseAssignment[];

    return assignments;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateWarehouseAssignmentsById(
  warehouse_id: string,
  deletes: WarehouseAssignment[],
  writes: WarehouseAssignment[]
): Promise<boolean> {
  try {
    init();

    const client = mng.client;

    const { error } = await mng.updateWarehouseAssignmentsById({
      client,
      body: { deletes: deletes, writes: writes },
      path: {
        warehouse_id: warehouse_id,
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
  warehouse_id: string,
  managedAccess: boolean
): Promise<boolean> {
  try {
    init();

    const client = mng.client;

    const { error } = await mng.setWarehouseManagedAccess({
      client,
      body: { "managed-access": managedAccess },
      path: {
        warehouse_id: warehouse_id,
      },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getRoleAssignmentsById(
  role_id: string
): Promise<RoleAssignment[]> {
  try {
    if (!env.enabledAuthorization) return [];

    init();

    const client = mng.client;

    const { data, error } = await mng.getRoleAssignmentsById({
      client,
      path: {
        role_id: role_id,
      },
    });

    if (error) throw error;

    const assignments = ((data ?? {})["assignments"] as RoleAssignment[]) ?? [];

    return assignments;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateRoleAssignmentsById(
  role_id: string,
  deletes: RoleAssignment[],
  writes: RoleAssignment[]
): Promise<boolean> {
  try {
    init();

    const client = mng.client;

    const { error } = await mng.updateRoleAssignmentsById({
      client,
      body: { deletes: deletes, writes: writes },
      path: {
        role_id: role_id,
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
    if (!env.enabledAuthorization) return [];

    init();

    const client = mng.client;
    const { data, error } = await mng.getServerAssignments({
      client,
    });

    if (error) throw error;

    const assignments =
      ((data ?? {})["assignments"] as ServerAssignment[]) ?? [];
    return assignments;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateServerAssignments(
  deletes: ServerAssignment[],
  writes: ServerAssignment[]
): Promise<boolean> {
  try {
    init();

    const client = mng.client;

    const { error } = await mng.updateServerAssignments({
      client,
      body: { deletes: deletes, writes: writes },
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
    if (!env.enabledAuthorization) return [];

    init();

    const client = mng.client;
    const { data, error } = await mng.getProjectAssignments({
      client,
    });

    if (error) throw error;

    const assignments =
      ((data ?? {})["assignments"] as ProjectAssignment[]) ?? [];
    return assignments;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateProjectAssignments(
  deletes: ProjectAssignment[],
  writes: ProjectAssignment[]
): Promise<boolean> {
  try {
    init();

    const client = mng.client;

    const { error } = await mng.updateProjectAssignments({
      client,
      body: { deletes: deletes, writes: writes },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getNamespaceAssignmentsById(
  ns_id: string
): Promise<NamespaceAssignment[]> {
  try {
    if (!env.enabledAuthorization) return [];

    init();

    const client = mng.client;
    const { data, error } = await mng.getNamespaceAssignmentsById({
      client,
      path: {
        namespace_id: ns_id,
      },
    });

    if (error) throw error;

    const assignments =
      ((data ?? {})["assignments"] as NamespaceAssignment[]) ?? [];
    return assignments;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateNamespaceAssignmentsById(
  ns_id: string,
  deletes: NamespaceAssignment[],
  writes: NamespaceAssignment[]
): Promise<boolean> {
  try {
    init();

    const client = mng.client;

    const { error } = await mng.updateNamespaceAssignmentsById({
      client,
      body: { deletes: deletes, writes: writes },
      path: {
        namespace_id: ns_id,
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
  managedAccess: boolean
): Promise<boolean> {
  try {
    init();

    const client = mng.client;

    const { error } = await mng.setNamespaceManagedAccess({
      client,
      body: { "managed-access": managedAccess },
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
  table_id: string
): Promise<TableAssignment[]> {
  try {
    if (!env.enabledAuthorization) return [];

    init();

    const client = mng.client;
    const { data, error } = await mng.getTableAssignmentsById({
      client,
      path: {
        table_id: table_id,
      },
    });

    if (error) throw error;

    const assignments =
      ((data ?? {})["assignments"] as TableAssignment[]) ?? [];
    return assignments;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateTableAssignmentsById(
  table_id: string,
  deletes: TableAssignment[],
  writes: TableAssignment[]
): Promise<boolean> {
  try {
    init();

    const client = mng.client;

    const { error } = await mng.updateTableAssignmentsById({
      client,
      body: { deletes: deletes, writes: writes },
      path: {
        table_id: table_id,
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
  view_id: string
): Promise<ViewAssignment[]> {
  try {
    if (!env.enabledAuthorization) return [];

    init();

    const client = mng.client;
    const { data, error } = await mng.getViewAssignmentsById({
      client,
      path: {
        view_id: view_id,
      },
    });

    if (error) throw error;

    const assignments = ((data ?? {})["assignments"] as ViewAssignment[]) ?? [];
    return assignments;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateViewAssignmentsById(
  view_id: string,
  deletes: ViewAssignment[],
  writes: ViewAssignment[]
): Promise<boolean> {
  try {
    init();

    const client = mng.client;

    const { error } = await mng.updateViewAssignmentsById({
      client,
      body: { deletes: deletes, writes: writes },
      path: {
        view_id: view_id,
      },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

//User
async function createUser() {
  try {
    init();

    const client = mng.client;

    const { data, error } = await mng.createUser({
      client,
      body: { "update-if-exists": true },
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

    const client = mng.client;

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

async function searchUser(searchUser: string): Promise<User[]> {
  try {
    init();

    const client = mng.client;

    const { data, error } = await mng.searchUser({
      client,
      body: { search: searchUser },
    });

    if (error) throw error;

    return ((data as SearchUserResponse) ?? []).users as User[];
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getUser(user_id: string): Promise<User> {
  try {
    init();

    const client = mng.client;

    const { data, error } = await mng.getUser({
      client,
      path: {
        id: user_id,
      },
    });

    if (error) throw error;

    return data as User;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function deleteUser(user_id: string): Promise<boolean> {
  try {
    init();

    const client = mng.client;

    const { error } = await mng.deleteUser({
      client,
      path: {
        id: user_id,
      },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function listUser(): Promise<User[]> {
  try {
    init();

    const client = mng.client;

    const { data, error } = await mng.listUser({
      client,
    });

    if (error) throw error;

    return data?.users as User[];
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateUserById(name: string, userId: string): Promise<boolean> {
  try {
    init();

    const client = mng.client;

    const { error } = await mng.updateUser({
      client,
      body: {
        name: name,
        user_type: "application",
      },
      path: {
        id: userId,
      },
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

//Roles
async function searchRole(searchRole: string): Promise<Role[]> {
  try {
    init();

    const visual = useVisualStore();
    const client = mng.client;

    const { data, error } = await mng.searchRole({
      client,
      body: {
        "project-id": visual.projectSelected["project-id"] || "",
        search: searchRole,
      },
    });

    if (error) throw error;

    return ((data as SearchRoleResponse) ?? []).roles as Role[];
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function listRoles(
  pageSize?: number,
  pageToken?: string
): Promise<Role[]> {
  try {
    init();
    const visual = useVisualStore();

    const client = mng.client;

    const { data, error } = await mng.listRoles({
      client,
      query: {
        pageSize: pageSize,
        pageToken: pageToken,
        projectId: visual.projectSelected["project-id"],
      },
    });

    if (error) throw error;

    return ((data as ListRolesResponse) ?? []).roles as Role[];
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getRole(roleId: string): Promise<Role> {
  try {
    init();

    const client = mng.client;

    const { data, error } = await mng.getRole({
      client,
      path: { id: roleId },
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

    const client = mng.client;
    const visual = useVisualStore();

    const body: CreateRoleRequest = {
      name: name,
      description: description || "",
      "project-id": visual.projectSelected["project-id"],
    };

    const { data, error } = await mng.createRole({
      client,
      body: body,
    });

    if (error) throw error;

    return data as Role;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function updateRole(
  roleId: string,
  name: string,
  description?: string
): Promise<Role> {
  try {
    init();

    const client = mng.client;

    const body: UpdateRoleRequest = {
      name: name,
      description: description || "",
    };

    const { data, error } = await mng.updateRole({
      client,
      body: body,
      path: { id: roleId },
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

    const client = mng.client;

    await mng.deleteRole({
      client,
      path: { id: roleId },
    });

    return true;
  } catch (error: any) {
    console.error("Failed to delete role", error);
    handleError(error, new Error());
    throw error;
  }
}

//Access

async function getServerAccess(): Promise<ServerAction[]> {
  try {
    if (!env.enabledAuthorization)
      return globals.serverActions as ServerAction[];
    init();

    const client = mng.client;

    const { data, error } = await mng.getServerAccess({
      client,
    });

    if (error) throw error;

    const actions = (data ?? {})["allowed-actions"] as ServerAction[];

    return actions;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getProjectAccess(): Promise<ProjectAction[]> {
  try {
    if (!env.enabledAuthorization)
      return globals.projectActions as ProjectAction[];
    init();

    const client = mng.client;

    const { data, error } = await mng.getProjectAccess({
      client,
    });

    if (error) throw error;

    const actions = (data ?? {})["allowed-actions"] as ProjectAction[];

    return actions;
  } catch (error: any) {
    handleError(error, new Error());
    throw error;
  }
}

async function getWarehouseAccessById(
  warehouse_id: string
): Promise<WarehouseAction[]> {
  try {
    if (!env.enabledAuthorization)
      return globals.warehouseActions as WarehouseAction[];
    init();

    const client = mng.client;

    const { data, error } = await mng.getWarehouseAccessById({
      client,
      path: {
        warehouse_id: warehouse_id,
      },
    });

    if (error) throw error;

    const actions = (data ?? {})["allowed-actions"] as WarehouseAction[];

    return actions;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}
async function getNamespaceAccessById(
  namespace_id: string
): Promise<NamespaceAction[]> {
  try {
    if (!env.enabledAuthorization)
      return globals.namespaceActions as NamespaceAction[];
    init();

    const client = mng.client;

    const { data, error } = await mng.getNamespaceAccessById({
      client,
      path: {
        namespace_id: namespace_id,
      },
    });

    if (error) throw error;

    const actions = (data ?? {})["allowed-actions"] as NamespaceAction[];

    return actions;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function getTableAccessById(table_id: string): Promise<TableAction[]> {
  try {
    if (!env.enabledAuthorization) return globals.tableActions as TableAction[];

    init();

    const client = mng.client;

    const { data, error } = await mng.getTableAccessById({
      client,
      path: {
        table_id: table_id,
      },
    });

    if (error) throw error;

    const actions = (data ?? {})["allowed-actions"] as TableAction[];

    return actions;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function getViewAccessById(view_id: string): Promise<ViewAction[]> {
  try {
    if (!env.enabledAuthorization) return globals.viewActions as ViewAction[];
    init();

    const client = mng.client;

    const { data, error } = await mng.getViewAccessById({
      client,
      path: {
        view_id: view_id,
      },
    });

    if (error) throw error;

    const actions = (data ?? {})["allowed-actions"] as ViewAction[];

    return actions;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

async function getRoleAccessById(role_id: string): Promise<RoleAction[]> {
  try {
    if (!env.enabledAuthorization) return globals.roleActions as RoleAction[];
    init();

    const client = mng.client;

    const { data, error } = await mng.getRoleAccessById({
      client,
      path: {
        role_id: role_id,
      },
    });

    if (error) throw error;

    const actions = (data ?? {})["allowed-actions"] as RoleAction[];

    return actions;
  } catch (error: any) {
    handleError(error, new Error());
    return error;
  }
}

//internal
function copyToClipboard(text: string) {
  const visual = useVisualStore();

  navigator.clipboard.writeText(text).then(
    () => {
      const msg = `Copied to clipboard: ${text}`;

      visual.setSnackbarMsg({
        function: "copyToClipboard",
        text: msg,
        ttl: 3000,
        ts: Date.now(),
        type: Type.SUCCESS,
      });
    },
    (err) => {
      const msg = `Failed to copy: ${err}`;
      visual.setSnackbarMsg({
        function: "copyToClipboard",
        text: msg,
        ttl: 3000,
        ts: Date.now(),
        type: Type.ERROR,
      });
    }
  );
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
    getServerAccess,
    getNamespaceAssignmentsById,
    updateNamespaceAssignmentsById,
    loadNamespaceMetadata,
    listViews,
    listDeletedTabulars,
    getTableAccessById,
    loadTable,
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
  };
}

export default {
  install: (app: App) => {
    const functions = useFunctions();
    app.provide("functions", functions);
    app.config.globalProperties.$functions = functions;
  },
};
