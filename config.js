// ============================================================
// AudioTaste — Supabase connection settings
// ------------------------------------------------------------
// SETUP:
// 1. Create a project at https://supabase.com
// 2. Open: Project Settings -> API
// 3. Copy the "Project URL" and the public "anon" key into the
//    two constants below, then save this file.
// 4. Run supabase/schema.sql in the SQL Editor to create the
//    albums and reviews tables (see supabase/schema.sql).
//
// SECURITY: only the PUBLIC anon key may ever live in browser
// code. Never expose the service_role key.
// ============================================================

const SUPABASE_URL = "https://YOUR-PROJECT-URL.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-PUBLIC-ANON-KEY";

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
