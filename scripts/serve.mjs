"use strict";

// Tiny static file server for AudioTaste.
// Serves config.js generated LIVE from .env, so the app reads the same
// keys as the seed script — no manual copying into config.js.
//
// Usage:  node scripts/serve.mjs            (http://localhost:8080)
//         PORT=3000 node scripts/serve.mjs
//
// Keep open in a terminal while you work on the app.

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { renderConfig } from "./config-template.mjs";

const PORT = parseInt(process.env.PORT || "8080", 10);
const ROOT = process.cwd();

function loadEnv() {
  try {
    const env = readFileSync(join(ROOT, ".env"), "utf8");
    return Object.fromEntries(
      env
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#") && l.includes("="))
        .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
    );
  } catch {
    return {};
  }
}

const env = loadEnv();

// config.js served to the browser, values injected from .env.
function configJs() {
  const url = env.SUPABASE_URL || "https://YOUR-PROJECT-URL.supabase.co";
  const key = env.SUPABASE_ANON_KEY || "YOUR-PUBLIC-ANON-KEY";
  return renderConfig(url, key, env.LASTFM_API_KEY);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

createServer((req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);

  if (url === "/config.js") {
    res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" });
    res.end(configJs());
    return;
  }

  let rel = normalize(url === "/" ? "/index.html" : url).replace(/^([/\\])+/, "");
  if (rel.includes("..")) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  const file = join(ROOT, rel);
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 not found");
    return;
  }
  const body = readFileSync(file);
  res.writeHead(200, { "Content-Type": MIME[extname(file).toLowerCase()] || "application/octet-stream" });
  res.end(body);
}).listen(PORT, () => {
  const mode = env.SUPABASE_ANON_KEY ? "from .env" : "PLACEHOLDER (fill .env!)";
  console.log("AudioTaste serving at http://localhost:" + PORT + "  (config.js: " + mode + ")");
});
