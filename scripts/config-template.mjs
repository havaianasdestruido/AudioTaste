"use strict";

// Shared renderer for config.js, used by scripts/serve.mjs (local dev,
// from .env) and scripts/build-config.mjs (Vercel build, from env vars).
export function renderConfig(url, key) {
  return `// ============================================================
// AudioTaste - Supabase connection settings
// GENERATED from environment variables. Do not edit by hand.
//   local dev : scripts/serve.mjs  (from .env)
//   Vercel    : scripts/build-config.mjs (from project env vars)
// ============================================================

const SUPABASE_URL = ${JSON.stringify(url)};
const SUPABASE_ANON_KEY = ${JSON.stringify(key)};

// Common pieces for every REST request to the Supabase API.
const API = {
  base: SUPABASE_URL + "/rest/v1",
  headers: {
    apikey: SUPABASE_ANON_KEY,
    Authorization: "Bearer " + SUPABASE_ANON_KEY,
    "Content-Type": "application/json"
  }
};

// Headers that ask Supabase to return the affected rows, which is
// handy for POST/PATCH/DELETE so we can read back what changed.
const API_WRITE_HEADERS = {
  ...API.headers,
  Prefer: "return=representation"
};
`;
}
