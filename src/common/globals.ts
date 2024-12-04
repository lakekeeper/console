import {
  NamespaceAction,
  ProjectAction,
  RoleAction,
  ServerAction,
  TableAction,
  ViewAction,
  WarehouseAction,
} from "@/gen/management/types.gen";

const serverActions: ServerAction[] = [
  "create_project",
  "update_users",
  "delete_users",
  "list_users",
  "grant_admin",
  "provision_users",
  "read_assignments",
];

const projectActions: ProjectAction[] = [
  "create_warehouse",
  "delete",
  "rename",
  "list_warehouses",
  "create_role",
  "list_roles",
  "search_roles",
  "read_assignments",
  "grant_role_creator",
  "grant_create",
  "grant_describe",
  "grant_modify",
  "grant_select",
  "grant_project_admin",
  "grant_security_admin",
  "grant_data_admin",
];

const warehouseActions: WarehouseAction[] = [
  "create_namespace",
  "delete",
  "modify_storage",
  "modify_storage_credential",
  "get_config",
  "get_metadata",
  "list_namespaces",
  "include_in_list",
  "deactivate",
  "activate",
  "rename",
  "list_deleted_tabulars",
  "read_assignments",
  "grant_create",
  "grant_describe",
  "grant_modify",
  "grant_select",
  "grant_pass_grants",
  "grant_manage_grants",
  "change_ownership",
];

const namespaceActions: NamespaceAction[] = [
  "create_table",
  "create_view",
  "create_namespace",
  "delete",
  "update_properties",
  "get_metadata",
  "read_assignments",
  "grant_create",
  "grant_describe",
  "grant_modify",
  "grant_select",
  "grant_pass_grants",
  "grant_manage_grants",
];

const tableActions: TableAction[] = [
  "drop",
  "write_data",
  "read_data",
  "get_metadata",
  "commit",
  "rename",
  "read_assignments",
  "grant_pass_grants",
  "grant_manage_grants",
  "grant_describe",
  "grant_select",
  "grant_modify",
  "change_ownership",
];

const viewActions: ViewAction[] = [
  "drop",
  "commit",
  "get_metadata",
  "rename",
  "read_assignments",
  "grant_pass_grants",
  "grant_manage_grants",
  "grant_describe",
  "grant_modify",
  "change_ownership",
];

const roleActions: RoleAction[] = [
  "assume",
  "can_grant_assignee",
  "can_change_ownership",
  "delete",
  "update",
  "read",
  "read_assignments",
];

export const globals = {
  serverActions,
  projectActions,
  warehouseActions,
  namespaceActions,
  tableActions,
  viewActions,
  roleActions,
};

export default globals;
