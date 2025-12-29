// Worker wrapper to help DuckDB find the WASM file
// This sets up the correct base path before importing the actual worker

// Get the base URL from the worker's location
// Use the full path including any base path prefix (e.g., /ui/)
const url = new URL(self.location.href);
const baseUrl = url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/'));

// Import the actual DuckDB worker
importScripts(`${baseUrl}/duckdb/duckdb-browser-eh.worker.js`);
