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
import { extname, join, normalize, resolve, sep } from "node:path";
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
  let url;
  try {
    url = decodeURIComponent((req.url || "/").split("?")[0]);
  } catch {
    // Malformed percent-encoding must never crash the server (DoS).
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("bad request");
    return;
  }

  const SEC = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  };

  if (url === "/config.js") {
    res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store", ...SEC });
    res.end(configJs());
    return;
  }

  let rel = normalize(url === "/" ? "/index.html" : url).replace(/^([/\\])+/, "");
  // Never serve dotfiles (.env, .gitignore, .env.example, ...).
  if (rel.split(/[\\/]/).some((seg) => seg.startsWith("."))) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  if (rel.includes("..")) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  // Resolve and confirm the file stays inside ROOT (defense in depth).
  const file = resolve(ROOT, rel);
  if (file !== ROOT && !file.startsWith(ROOT + sep)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", ...SEC });
    res.end("404 not found");
    return;
  }
  const body = readFileSync(file);
  res.writeHead(200, {
    "Content-Type": MIME[extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
    ...SEC
  });
  res.end(body);
}).listen(PORT, () => {
  const mode = env.SUPABASE_ANON_KEY ? "from .env" : "PLACEHOLDER (fill .env!)";
  console.log("AudioTaste serving at http://localhost:" + PORT + "  (config.js: " + mode + ")");
});
