// This file is auto-generated by @hey-api/openapi-ts

import { type Options as ClientOptions, type TDataShape, type Client, urlSearchParamsBodySerializer } from '@hey-api/client-fetch';
import type { GetConfigData, GetConfigResponse, GetConfigError, GetTokenData, GetTokenResponse, GetTokenError, ListNamespacesData, ListNamespacesResponse2, ListNamespacesError, CreateNamespaceData, CreateNamespaceResponse2, CreateNamespaceError, DropNamespaceData, DropNamespaceResponse, DropNamespaceError, LoadNamespaceMetadataData, LoadNamespaceMetadataResponse, LoadNamespaceMetadataError, NamespaceExistsData, NamespaceExistsResponse, NamespaceExistsError, UpdatePropertiesData, UpdatePropertiesResponse, UpdatePropertiesError, ListTablesData, ListTablesResponse2, ListTablesError, CreateTableData, CreateTableResponse, CreateTableError, RegisterTableData, RegisterTableResponse, RegisterTableError, DropTableData, DropTableResponse, DropTableError, LoadTableData, LoadTableResponse, LoadTableError, TableExistsData, TableExistsResponse, TableExistsError, UpdateTableData, UpdateTableResponse, UpdateTableError, RenameTableData, RenameTableResponse, RenameTableError, ReportMetricsData, ReportMetricsResponse, ReportMetricsError, CommitTransactionData, CommitTransactionResponse, CommitTransactionError, ListViewsData, ListViewsResponse, ListViewsError, CreateViewData, CreateViewResponse, CreateViewError, DropViewData, DropViewResponse, DropViewError, LoadViewData, LoadViewResponse, LoadViewError, ViewExistsData, ViewExistsResponse, ViewExistsError, ReplaceViewData, ReplaceViewResponse, ReplaceViewError, RenameViewData, RenameViewError } from './types.gen';
import { client as _heyApiClient } from './client.gen';

export type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean> = ClientOptions<TData, ThrowOnError> & {
    /**
     * You can provide a client instance returned by `createClient()` instead of
     * individual options. This might be also useful if you want to implement a
     * custom client.
     */
    client?: Client;
    /**
     * You can pass arbitrary values through the `meta` object. This can be
     * used to access values that aren't defined as part of the SDK function.
     */
    meta?: Record<string, unknown>;
};

/**
 * List all catalog configuration settings
 *  All REST clients should first call this route to get catalog configuration properties from the server to configure the catalog and its HTTP client. Configuration from the server consists of two sets of key/value pairs.
 * - defaults -  properties that should be used as default configuration; applied before client configuration
 * - overrides - properties that should be used to override client configuration; applied after defaults and client configuration
 *
 * Catalog configuration is constructed by setting the defaults, then client- provided configuration, and finally overrides. The final property set is then used to configure the catalog.
 *
 * For example, a default configuration property might set the size of the client pool, which can be replaced with a client-specific setting. An override might be used to set the warehouse location, which is stored on the server rather than in client configuration.
 *
 * Common catalog configuration settings are documented at https://iceberg.apache.org/docs/latest/configuration/#catalog-properties
 */
export const getConfig = <ThrowOnError extends boolean = false>(options?: Options<GetConfigData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<GetConfigResponse, GetConfigError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/config',
        ...options
    });
};

/**
 * Get a token using an OAuth2 flow
 * Exchange credentials for a token using the OAuth2 client credentials flow or token exchange.
 *
 * This endpoint is used for three purposes -
 * 1. To exchange client credentials (client ID and secret) for an access token This uses the client credentials flow.
 * 2. To exchange a client token and an identity token for a more specific access token This uses the token exchange flow.
 * 3. To exchange an access token for one with the same claims and a refreshed expiration period This uses the token exchange flow.
 *
 * For example, a catalog client may be configured with client credentials from the OAuth2 Authorization flow. This client would exchange its client ID and secret for an access token using the client credentials request with this endpoint (1). Subsequent requests would then use that access token.
 *
 * Some clients may also handle sessions that have additional user context. These clients would use the token exchange flow to exchange a user token (the "subject" token) from the session for a more specific access token for that user, using the catalog's access token as the "actor" token (2). The user ID token is the "subject" token and can be any token type allowed by the OAuth2 token exchange flow, including a unsecured JWT token with a sub claim. This request should use the catalog's bearer token in the "Authorization" header.
 *
 * Clients may also use the token exchange flow to refresh a token that is about to expire by sending a token exchange request (3). The request's "subject" token should be the expiring token. This request should use the subject token in the "Authorization" header.
 */
export const getToken = <ThrowOnError extends boolean = false>(options?: Options<GetTokenData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).post<GetTokenResponse, GetTokenError, ThrowOnError>({
        ...urlSearchParamsBodySerializer,
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/oauth/tokens',
        ...options,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...options?.headers
        }
    });
};

/**
 * List namespaces, optionally providing a parent namespace to list underneath
 * List all namespaces at a certain level, optionally starting from a given parent namespace. If table accounting.tax.paid.info exists, using 'SELECT NAMESPACE IN accounting' would translate into `GET /namespaces?parent=accounting` and must return a namespace, ["accounting", "tax"] only. Using 'SELECT NAMESPACE IN accounting.tax' would translate into `GET /namespaces?parent=accounting%1Ftax` and must return a namespace, ["accounting", "tax", "paid"]. If `parent` is not provided, all top-level namespaces should be listed.
 */
export const listNamespaces = <ThrowOnError extends boolean = false>(options: Options<ListNamespacesData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<ListNamespacesResponse2, ListNamespacesError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces',
        ...options
    });
};

/**
 * Create a namespace
 * Create a namespace, with an optional set of properties. The server might also add properties, such as `last_modified_time` etc.
 */
export const createNamespace = <ThrowOnError extends boolean = false>(options: Options<CreateNamespaceData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<CreateNamespaceResponse2, CreateNamespaceError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Drop a namespace from the catalog. Namespace must be empty.
 */
export const dropNamespace = <ThrowOnError extends boolean = false>(options: Options<DropNamespaceData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).delete<DropNamespaceResponse, DropNamespaceError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}',
        ...options
    });
};

/**
 * Load the metadata properties for a namespace
 * Return all stored metadata properties for a given namespace
 */
export const loadNamespaceMetadata = <ThrowOnError extends boolean = false>(options: Options<LoadNamespaceMetadataData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<LoadNamespaceMetadataResponse, LoadNamespaceMetadataError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}',
        ...options
    });
};

/**
 * Check if a namespace exists
 * Check if a namespace exists. The response does not contain a body.
 */
export const namespaceExists = <ThrowOnError extends boolean = false>(options: Options<NamespaceExistsData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).head<NamespaceExistsResponse, NamespaceExistsError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}',
        ...options
    });
};

/**
 * Set or remove properties on a namespace
 * Set and/or remove properties on a namespace. The request body specifies a list of properties to remove and a map of key value pairs to update.
 * Properties that are not in the request are not modified or removed by this call.
 * Server implementations are not required to support namespace properties.
 */
export const updateProperties = <ThrowOnError extends boolean = false>(options: Options<UpdatePropertiesData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<UpdatePropertiesResponse, UpdatePropertiesError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}/properties',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * List all table identifiers underneath a given namespace
 * Return all table identifiers under this namespace
 */
export const listTables = <ThrowOnError extends boolean = false>(options: Options<ListTablesData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<ListTablesResponse2, ListTablesError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}/tables',
        ...options
    });
};

/**
 * Create a table in the given namespace
 * Create a table or start a create transaction, like atomic CTAS.
 *
 * If `stage-create` is false, the table is created immediately.
 *
 * If `stage-create` is true, the table is not created, but table metadata is initialized and returned. The service should prepare as needed for a commit to the table commit endpoint to complete the create transaction. The client uses the returned metadata to begin a transaction. To commit the transaction, the client sends all create and subsequent changes to the table commit route. Changes from the table create operation include changes like AddSchemaUpdate and SetCurrentSchemaUpdate that set the initial table state.
 */
export const createTable = <ThrowOnError extends boolean = false>(options: Options<CreateTableData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<CreateTableResponse, CreateTableError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}/tables',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Register a table in the given namespace using given metadata file location
 * Register a table using given metadata file location.
 */
export const registerTable = <ThrowOnError extends boolean = false>(options: Options<RegisterTableData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<RegisterTableResponse, RegisterTableError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}/register',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Drop a table from the catalog
 * Remove a table from the catalog
 */
export const dropTable = <ThrowOnError extends boolean = false>(options: Options<DropTableData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).delete<DropTableResponse, DropTableError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}/tables/{table}',
        ...options
    });
};

/**
 * Load a table from the catalog
 * Load a table from the catalog.
 *
 * The response contains both configuration and table metadata. The configuration, if non-empty is used as additional configuration for the table that overrides catalog configuration. For example, this configuration may change the FileIO implementation to be used for the table.
 *
 * The response also contains the table's full metadata, matching the table metadata JSON file.
 *
 * The catalog configuration may contain credentials that should be used for subsequent requests for the table. The configuration key "token" is used to pass an access token to be used as a bearer token for table requests. Otherwise, a token may be passed using a RFC 8693 token type as a configuration key. For example, "urn:ietf:params:oauth:token-type:jwt=<JWT-token>".
 */
export const loadTable = <ThrowOnError extends boolean = false>(options: Options<LoadTableData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<LoadTableResponse, LoadTableError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}/tables/{table}',
        ...options
    });
};

/**
 * Check if a table exists
 * Check if a table exists within a given namespace. The response does not contain a body.
 */
export const tableExists = <ThrowOnError extends boolean = false>(options: Options<TableExistsData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).head<TableExistsResponse, TableExistsError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}/tables/{table}',
        ...options
    });
};

/**
 * Commit updates to a table
 * Commit updates to a table.
 *
 * Commits have two parts, requirements and updates. Requirements are assertions that will be validated before attempting to make and commit changes. For example, `assert-ref-snapshot-id` will check that a named ref's snapshot ID has a certain value.
 *
 * Updates are changes to make to table metadata. For example, after asserting that the current main ref is at the expected snapshot, a commit may add a new child snapshot and set the ref to the new snapshot id.
 *
 * Create table transactions that are started by createTable with `stage-create` set to true are committed using this route. Transactions should include all changes to the table, including table initialization, like AddSchemaUpdate and SetCurrentSchemaUpdate. The `assert-create` requirement is used to ensure that the table was not created concurrently.
 */
export const updateTable = <ThrowOnError extends boolean = false>(options: Options<UpdateTableData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<UpdateTableResponse, UpdateTableError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}/tables/{table}',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Rename a table from its current name to a new name
 * Rename a table from one identifier to another. It's valid to move a table across namespaces, but the server implementation is not required to support it.
 */
export const renameTable = <ThrowOnError extends boolean = false>(options: Options<RenameTableData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<RenameTableResponse, RenameTableError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/tables/rename',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Send a metrics report to this endpoint to be processed by the backend
 */
export const reportMetrics = <ThrowOnError extends boolean = false>(options: Options<ReportMetricsData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<ReportMetricsResponse, ReportMetricsError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}/tables/{table}/metrics',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Commit updates to multiple tables in an atomic operation
 */
export const commitTransaction = <ThrowOnError extends boolean = false>(options: Options<CommitTransactionData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<CommitTransactionResponse, CommitTransactionError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/transactions/commit',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * List all view identifiers underneath a given namespace
 * Return all view identifiers under this namespace
 */
export const listViews = <ThrowOnError extends boolean = false>(options: Options<ListViewsData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<ListViewsResponse, ListViewsError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}/views',
        ...options
    });
};

/**
 * Create a view in the given namespace
 * Create a view in the given namespace.
 */
export const createView = <ThrowOnError extends boolean = false>(options: Options<CreateViewData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<CreateViewResponse, CreateViewError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}/views',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Drop a view from the catalog
 * Remove a view from the catalog
 */
export const dropView = <ThrowOnError extends boolean = false>(options: Options<DropViewData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).delete<DropViewResponse, DropViewError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}/views/{view}',
        ...options
    });
};

/**
 * Load a view from the catalog
 * Load a view from the catalog.
 *
 * The response contains both configuration and view metadata. The configuration, if non-empty is used as additional configuration for the view that overrides catalog configuration.
 *
 * The response also contains the view's full metadata, matching the view metadata JSON file.
 *
 * The catalog configuration may contain credentials that should be used for subsequent requests for the view. The configuration key "token" is used to pass an access token to be used as a bearer token for view requests. Otherwise, a token may be passed using a RFC 8693 token type as a configuration key. For example, "urn:ietf:params:oauth:token-type:jwt=<JWT-token>".
 */
export const loadView = <ThrowOnError extends boolean = false>(options: Options<LoadViewData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<LoadViewResponse, LoadViewError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}/views/{view}',
        ...options
    });
};

/**
 * Check if a view exists
 * Check if a view exists within a given namespace. This request does not return a response body.
 */
export const viewExists = <ThrowOnError extends boolean = false>(options: Options<ViewExistsData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).head<ViewExistsResponse, ViewExistsError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}/views/{view}',
        ...options
    });
};

/**
 * Replace a view
 * Commit updates to a view.
 */
export const replaceView = <ThrowOnError extends boolean = false>(options: Options<ReplaceViewData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<ReplaceViewResponse, ReplaceViewError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/namespaces/{namespace}/views/{view}',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Rename a view from its current name to a new name
 * Rename a view from one identifier to another. It's valid to move a view across namespaces, but the server implementation is not required to support it.
 */
export const renameView = <ThrowOnError extends boolean = false>(options: Options<RenameViewData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<unknown, RenameViewError, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/v1/{prefix}/views/rename',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};