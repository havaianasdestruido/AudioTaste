"use strict";

// Fetch album cover art: Spotify first, Last.fm as fallback.
// Results are cached on disk in res/build/covers/ so reruns are free.
//
// Designed for fan-out: run several processes in parallel, one per index
// range, each writing its own chunk cache file. Then merge everything:
//
//   node scripts/fetch_covers.mjs                     # fetch all albums (serial)
//   node scripts/fetch_covers.mjs --from 0 --to 15    # fetch one slice (fan-out worker)
//   node scripts/fetch_covers.mjs --merge             # union caches -> albums.json
//   node scripts/fetch_covers.mjs --merge --db        # same, then PATCH cover_url to Supabase
//
// Credentials come from .env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET,
// LASTFM_API_KEY (see .env.example). If Spotify keys are absent, Last.fm
// is used alone. Caches live under res/build/ (gitignored).

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const fromIdx = argNum("--from");
const toIdx = argNum("--to"); // exclusive
const DO_MERGE = args.includes("--merge");
const DO_DB = args.includes("--db");

const COVERS_DIR = "res/build/covers";
const CACHE_FILE = COVERS_DIR + "/cache.json";
const ALBUMS_FILE = "res/build/albums.json";

function argNum(name) {
  const i = args.indexOf(name);
  return i >= 0 ? parseInt(args[i + 1], 10) : undefined;
}

function loadEnv() {
  try {
    const env = readFileSync(".env", "utf8");
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Spotify is OFF by default. To enable it, set ENABLE_SPOTIFY=1 in .env
// AND provide SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET.
const HAS_SPOTIFY = env.ENABLE_SPOTIFY === "1" && env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET &&
  !env.SPOTIFY_CLIENT_ID.startsWith("your-") && !env.SPOTIFY_CLIENT_SECRET.startsWith("your-");
const HAS_LASTFM = env.LASTFM_API_KEY && !env.LASTFM_API_KEY.startsWith("your-");

/* ---------- cache ---------- */

function loadCache(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(file, cache) {
  mkdirSync(COVERS_DIR, { recursive: true });
  writeFileSync(file, JSON.stringify(cache, null, 2));
}

/* ---------- Spotify ---------- */

let spotifyToken = null;
async function spotifyTokenGet() {
  if (spotifyToken) return spotifyToken;
  const cred = Buffer.from(env.SPOTIFY_CLIENT_ID + ":" + env.SPOTIFY_CLIENT_SECRET).toString("base64");
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + cred,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  if (!r.ok) throw new Error("spotify token " + r.status + " " + (await r.text()).slice(0, 120));
  const j = await r.json();
  spotifyToken = j.access_token;
  return spotifyToken;
}

async function spotifyCover(artist, album) {
  const token = await spotifyTokenGet();
  // Pseudo-albums ("Artist — Singles & Sessions") don't exist on Spotify;
  // search the artist and take their top album's art instead.
  const q = encodeURIComponent(album.includes("Singles & Sessions") ? artist : artist + " " + album);
  const r = await fetch("https://api.spotify.com/v1/search?q=" + q + "&type=album&limit=1", {
    headers: { Authorization: "Bearer " + token }
  });
  if (r.status === 429) throw new Error("spotify rate limited");
  if (!r.ok) return null;
  const j = await r.json();
  const item = j.albums && j.albums.items && j.albums.items[0];
  if (!item || !item.images || !item.images.length) return null;
  return item.images[0].url;
}

/* ---------- Last.fm ---------- */

async function lastfmCover(artist, album) {
  // Pseudo-albums ("Artist — Singles & Sessions") don't exist on Last.fm;
  // take the artist's most-listened album art instead.
  const method = album.includes("Singles & Sessions") ? "artist.gettopalbums" : "album.getinfo";
  const params = new URLSearchParams({
    method,
    artist,
    api_key: env.LASTFM_API_KEY,
    format: "json"
  });
  if (method === "album.getinfo") params.set("album", album);
  const r = await fetch("https://ws.audioscrobbler.com/2.0/?" + params.toString());
  if (!r.ok) return null;
  const j = await r.json();
  if (j.error === 29) throw new Error("lastfm rate limited");
  const list = method === "album.getinfo" ? j.album && [j.album] : j.topalbums && j.topalbums.album;
  if (!list || !list.length) return null;
  for (const size of ["mega", "extralarge", "large"]) {
    const found = list[0].image.find((i) => i.size === size && i["#text"]);
    if (found) return found["#text"];
  }
  return null;
}

/* ---------- fetch one album ---------- */

async function coverFor(artist, album) {
  if (HAS_SPOTIFY) {
    const url = await spotifyCover(artist, album);
    if (url) return { url, source: "spotify" };
  }
  if (HAS_LASTFM) {
    const url = await lastfmCover(artist, album);
    if (url) return { url, source: "lastfm" };
  }
  return null;
}

/* ---------- fetch mode (one slice per process) ---------- */

async function runFetch() {
  if (!HAS_SPOTIFY && !HAS_LASTFM) {
    console.error("Fill in LASTFM_API_KEY (and/or SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET) in .env first.");
    process.exit(1);
  }
  const albums = JSON.parse(readFileSync(ALBUMS_FILE, "utf8"));
  const start = fromIdx ?? 0;
  const end = toIdx ?? albums.length;
  const slice = albums.slice(start, end);

  const chunkFile = COVERS_DIR + "/cache_" + start + "_" + end + ".json";
  const chunk = loadCache(chunkFile); // resume a partially done slice
  const canonical = loadCache(CACHE_FILE);

  console.log("COVERS: [" + start + "," + end + ") = " + slice.length + " albums, resume=" + Object.keys(chunk).length +
    " providers=" + (HAS_SPOTIFY ? "spotify" : "") + (HAS_SPOTIFY && HAS_LASTFM ? "+" : "") + (HAS_LASTFM ? "lastfm" : ""));

  let fetched = 0, skipped = 0, failed = 0;
  for (let i = 0; i < slice.length; i++) {
    const a = slice[i];
    const key = a.artist + "\u0000" + a.title;
    if (chunk[key] !== undefined || canonical[key] !== undefined) { skipped++; continue; }
    let result = null;
    try {
      result = await coverFor(a.artist, a.title);
      chunk[key] = result;
      fetched++;
      if (result) console.log("  OK  " + (result.source === "spotify" ? "S" : "L") + " " + a.artist + " - " + a.title);
      else { failed++; console.log("  MISS " + a.artist + " - " + a.title); }
    } catch (e) {
      const msg = String(e.message);
      console.log("  ERR " + a.artist + " - " + a.title + ": " + msg);
      if (msg.includes("rate limited")) { console.log("  ...waiting 15s for rate limit"); await sleep(15000); }
    }
    await sleep(150); // be polite to both APIs
  }

  saveCache(chunkFile, chunk);
  console.log("DONE [" + start + "," + end + ") fetched=" + fetched + " skipped=" + skipped + " failed=" + failed + " saved=" + chunkFile);
}

/* ---------- merge mode ---------- */

async function runMerge() {
  const union = loadCache(CACHE_FILE);
  let files = [];
  try { files = readdirSync(COVERS_DIR); } catch { /* none yet */ }
  for (const f of files) {
    if (!f.startsWith("cache_") || !f.endsWith(".json")) continue;
    const incoming = loadCache(join(COVERS_DIR, f));
    for (const [k, v] of Object.entries(incoming)) {
      if (v !== null || union[k] === undefined) union[k] = v; // nulls never overwrite a found URL
    }
  }
  saveCache(CACHE_FILE, union);

  const albums = JSON.parse(readFileSync(ALBUMS_FILE, "utf8"));
  let withCover = 0;
  for (const a of albums) {
    const hit = union[a.artist + "\u0000" + a.title];
    a.cover_url = hit && hit.url ? hit.url : null;
    a.cover_source = hit && hit.url ? hit.source : null;
    if (a.cover_url) withCover++;
  }
  writeFileSync(ALBUMS_FILE, JSON.stringify(albums, null, 2));
  console.log("MERGED covers=" + withCover + "/" + albums.length + " cache_entries=" + Object.keys(union).length);

  if (DO_DB) await updateDb(albums);
}

async function updateDb(albums) {
  const base = env.SUPABASE_URL + "/rest/v1";
  const H = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
    "Content-Type": "application/json"
  };
  const r = await fetch(base + "/albums?select=id,artist,title,cover_url", { headers: H });
  if (!r.ok) throw new Error("GET albums -> " + r.status);
  const rows = await r.json();
  const map = new Map(rows.map((x) => [x.artist + "\u0000" + x.title, x]));

  let patched = 0, skipped = 0;
  for (const a of albums) {
    const row = map.get(a.artist + "\u0000" + a.title);
    if (!row) { skipped++; continue; }
    const newVal = a.cover_url || null;
    if ((row.cover_url || null) === newVal) continue;
    const p = await fetch(base + "/albums?id=eq." + row.id, {
      method: "PATCH",
      headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({ cover_url: newVal })
    });
    if (!p.ok) throw new Error("PATCH album " + row.id + " -> " + p.status);
    patched++;
  }
  console.log("DB: patched cover_url on " + patched + " albums (unmatched=" + skipped + ")");
}

/* ---------- run ---------- */

if (DO_MERGE) {
  runMerge().catch((e) => { console.error("MERGE FAILED: " + e.message); process.exit(1); });
} else {
  runFetch().catch((e) => { console.error("FETCH FAILED: " + e.message); process.exit(1); });
}
