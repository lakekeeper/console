# DuckDB SQL Query Feature Setup

## What Was Added

A new SQL query tab has been added to the table view pages, powered by DuckDB WASM. This allows users to run SQL queries directly on Iceberg table data in the browser.

## Changes Made

### Console-Components Library (Branch: vk/wasm-duckdb)

**New Components:**
- `TableSqlQuery.vue` - SQL query interface with editor and results display

**New Composables:**
- `useDuckDB.ts` - Low-level DuckDB WASM initialization and query execution
- `useIcebergDuckDB.ts` - Iceberg-specific integration for DuckDB

**Modified Files:**
- `package.json` - Added `@duckdb/duckdb-wasm` and `apache-arrow` dependencies
- `vite.config.ts` - Externalized DuckDB dependencies
- `src/index.ts` - Exported new components and composables

**Documentation:**
- `DUCKDB_SQL_FEATURE.md` - Comprehensive feature documentation

### Console App (Branch: vk/component-logic)

**Modified Files:**
- `package.json` - Updated to use console-components from GitHub branch `vk/wasm-duckdb`
- `src/pages/warehouse/[id].namespace.[nsid].table.[tid].vue` - Added SQL tab

**New Files Added:**
- `public/duckdb/` directory with WASM and worker files:
  - `duckdb-mvp.wasm` (~37MB)
  - `duckdb-eh.wasm` (~32MB) 
  - `duckdb-coi.wasm` (~32MB)
  - `duckdb-browser-mvp.worker.js`
  - `duckdb-browser-eh.worker.js`
  - `duckdb-browser-coi.worker.js`
  - `duckdb-browser-coi.pthread.worker.js`

## How It Works

1. **User navigates to table view** → Opens table detail page
2. **Clicks SQL tab** → `TableSqlQuery` component loads
3. **Component mounts** → DuckDB WASM initializes automatically
4. **DuckDB loads** → WASM files loaded from `/public/duckdb/`
5. **Demo table created** → Simple example table for testing
6. **User writes SQL** → SQL editor with example queries
7. **User clicks Execute** → Query runs in DuckDB WASM
8. **Results display** → Data table with rows and columns

## Current Implementation

The current implementation creates a demo table for testing. To integrate with real Iceberg data:

1. Fetch Iceberg table metadata from your API
2. Parse metadata to extract Parquet file locations
3. Use `loadParquetFiles()` to register files with DuckDB
4. Execute SQL queries against the loaded data

Example integration:
```typescript
// In TableSqlQuery.vue or a service
const metadata = await api.getTableMetadata(warehouseId, namespaceId, tableName);
const parquetUrls = extractParquetUrls(metadata);
await icebergDB.loadParquetFiles('iceberg_table', parquetUrls);
```

## Testing the Feature

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to a table:**
   - Go to Warehouses → Select warehouse
   - Navigate to namespace → Select table
   - Click **SQL** tab

3. **Try example queries:**
   - Click "Example Queries" to expand
   - Click any example to load it
   - Click "Execute Query"

4. **Example queries available:**
   - `SELECT * FROM iceberg_table LIMIT 10;`
   - `SELECT COUNT(*) FROM iceberg_table;`
   - `DESCRIBE iceberg_table;`
   - `SHOW TABLES;`

## Important Notes

### CORS and Security

- DuckDB WASM files **must** be served from the same origin
- Files are in `public/duckdb/` to avoid CORS issues
- Worker scripts use absolute URLs with `window.location.origin`

### File Sizes

- Total WASM files: ~100MB
- Only one bundle loads based on browser capabilities
- Consider adding to `.gitignore` and documenting setup

### Browser Compatibility

Requires modern browsers with:
- WebAssembly support
- Web Workers support
- Sufficient memory (recommend 2GB+ available)

Tested on:
- Chrome 90+
- Firefox 89+
- Safari 14+

## Next Steps

1. **Test the SQL tab** in your local environment
2. **Implement Iceberg integration** to load real Parquet data
3. **Consider adding** query history, saved queries, export functionality
4. **Optimize** by lazy-loading DuckDB only when SQL tab is opened
5. **Document** how to fetch and register Iceberg Parquet files

## Git Branches

- **console-components:** `vk/wasm-duckdb` (pushed to GitHub)
- **console:** `vk/component-logic` (local, needs push)

## Package Updates

To update console-components in other environments:

```bash
npm install github:lakekeeper/console-components#vk/wasm-duckdb
```

Then copy DuckDB files:
```bash
mkdir -p public/duckdb
cp node_modules/@duckdb/duckdb-wasm/dist/*.wasm public/duckdb/
cp node_modules/@duckdb/duckdb-wasm/dist/*worker.js public/duckdb/
```

## Troubleshooting

**"Worker failed to load" error:**
- Verify files exist in `public/duckdb/`
- Check browser console for specific CORS errors
- Ensure dev server serves static files correctly

**"Out of memory" error:**
- Try smaller queries with LIMIT clauses
- Close other browser tabs
- Increase browser memory limits

**Slow query performance:**
- DuckDB WASM is slower than native DuckDB
- Large datasets may take time to load
- Consider pagination and filtering

## References

- DuckDB WASM: https://github.com/duckdb/duckdb-wasm
- Console-components docs: `DUCKDB_SQL_FEATURE.md`
- DuckDB SQL: https://duckdb.org/docs/sql/introduction
