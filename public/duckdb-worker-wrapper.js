// Worker wrapper to help DuckDB find the WASM file
// This sets up the correct base path before importing the actual worker

// Get the base URL from the worker's location
const baseUrl = self.location.origin;

// Import the actual DuckDB worker
importScripts(`${baseUrl}/duckdb/duckdb-browser-eh.worker.js`);
