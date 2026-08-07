"use strict";

// Regenerate config.js at build time.
// Priority: Vercel project env vars (SUPABASE_URL, SUPABASE_ANON_KEY) ->
// local .env -> placeholders. Vercel injects env vars into the build
// command, so this runs before static files are published.

import { readFileSync, writeFileSync } from "node:fs";
import { renderConfig } from "./config-template.mjs";

const env = {};
for (const k of ["SUPABASE_URL", "SUPABASE_ANON_KEY"]) {
  if (process.env[k]) env[k] = process.env[k];
}

try {
  const lines = readFileSync(".env", "utf8").split("\n");
  for (const l of lines) {
    const t = l.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const k = t.slice(0, i).trim();
    if ((k === "SUPABASE_URL" || k === "SUPABASE_ANON_KEY") && !env[k]) {
      env[k] = t.slice(i + 1).trim();
    }
  }
} catch {
  /* no .env locally */
}

const url = env.SUPABASE_URL || "https://YOUR-PROJECT-URL.supabase.co";
const key = env.SUPABASE_ANON_KEY || "YOUR-PUBLIC-ANON-KEY";
writeFileSync("config.js", renderConfig(url, key));

if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
  console.log("config.js written with real Supabase credentials");
} else {
  console.warn("config.js written with PLACEHOLDERS — set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel project settings");
}
