import { Namespace, PageToken } from '@/gen/iceberg/types.gen';
import {
  AdlsProfile,
  AzCredential,
  GcsCredential,
  GcsProfile,
  NamespaceAssignment,
  ProjectAssignment,
  RoleAssignment,
  S3Credential,
  S3Profile,
  ServerAssignment,
  HdfsProfile,
  TableAssignment,
  ViewAssignment,
  WarehouseAssignment,
  HdfsCredential,
} from '@/gen/management/types.gen';

export interface Project {
  'project-id': string;
  'project-name': string;
}

export interface Data {
  projects: Project[];
}

// export interface StorageProfile {
//   type: string;
//   bucket: string;
//   "key-prefix": string;
//   "assume-role-arn": string | null;
//   endpoint: string;
//   region: string;
//   "path-style-access": boolean;
// }

// export interface Warehouse {
//   id: string;
//   name: string;
//   "project-id": string;
//   "storage-profile": StorageProfile;
//   status: string;
// }

export interface Namespaces {
  namespaces: string[][];
}

export interface Table {
  namespace: string[];
  name: string;
}

export interface Tables {
  identifiers: Table[];
}

export interface TreeItem {
  id: string;
  projectId?: string;
  whId?: string;
  nsId?: string;
  itemType: string;
  title: string;
  children?: TreeItem[];
}

export interface TreeItems {
  items: TreeItem[];
}

export interface User {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_expires_at: number;
  email: string;
  preferred_username: string;
  family_name: string;
  given_name: string;
}
export interface ProjectCatalog {
  version: string;
  bootstrapped: boolean;
  'server-id': string;
  'default-project-id': string;
  'authz-backend': string;
}

export enum Type {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success',
}
export interface SnackbarMsg {
  function?: string;
  text: string;
  ttl: number;
  ts: number;
  type: Type;
}

export interface NamespaceResponse {
  namespaceMap: Record<string, string>;
  namespaces: Namespace[];
  'next-page-token': PageToken;
}

export type RelationType =
  | 'role'
  | 'project'
  | 'server'
  | 'warehouse'
  | 'namespace'
  | 'view'
  | 'table';

export type AssignmentCollection =
  | RoleAssignment[]
  | ServerAssignment[]
  | ProjectAssignment[]
  | WarehouseAssignment[]
  | NamespaceAssignment[]
  | TableAssignment[]
  | ViewAssignment[];

export interface Item {
  name: string;
  id?: string;
  type: string;
  parentPath: string[];
  actions: string[];
}

export interface Breadcrumb {
  title: string;
  disabled?: boolean;
  href?: string;
}

type CustomStringType =
  | (string & {})
  | 'data-table-group'
  | 'data-table-select'
  | 'data-table-expand';

export interface Header {
  readonly key?: CustomStringType;
  readonly title?: string;
  readonly align?: 'end' | 'center' | 'start';
}

export interface WarehousObject {
  'storage-profile':
    | (S3Profile & { type: string })
    | (AdlsProfile & { type: string })
    | (GcsProfile & { type: string })
    | (HdfsProfile & { type: string });
  'storage-credential':
    | (S3Credential & { type: string })
    | (AzCredential & { type: string })
    | (HdfsCredential & { type: string })
    | (GcsCredential & { type: string });
}

export type Options = {
  page: number;
  itemsPerPage: number;
  sortBy: [
    {
      key: string;
      order: string;
    },
  ];
  groupBy: [];
};
