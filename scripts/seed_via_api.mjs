"use strict";

// Seed the Supabase database via the REST API instead of the SQL Editor.
// Immune to the paste/truncation corruption that broke the big seed SQL.
//
// Prerequisites:
//   1. supabase/schema.sql already run in the SQL Editor (tables exist)
//   2. config.js filled in with real Project URL + anon key
//
// Usage:
//   node scripts/seed_via_api.mjs            # wipes + reseeds albums/reviews/scrobbles
//   node scripts/seed_via_api.mjs --no-reset # skip the DELETE phase
//
// Reads res/build/albums.json and res/build/scrobbles.json (output of
// scripts/parse_scrobbles.mjs). Uses only the anon key, so it exercises
// the exact same REST surface the browser app uses.

import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const RESET = !args.includes("--no-reset");
const USERNAME = args[0] && !args[0].startsWith("--") ? args[0] : "UltimateQuack";
const BATCH = 100;

/* ---------- config ---------- */
// Credentials come from .env (preferred). Falls back to config.js
// if .env is missing or still has placeholders.

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
const cfg = readFileSync("config.js", "utf8");
const URL = env.SUPABASE_URL || (cfg.match(/SUPABASE_URL\s*=\s*"([^"]+)"/) || [])[1];
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || (cfg.match(/SUPABASE_ANON_KEY\s*=\s*"([^"]+)"/) || [])[1];

// The service_role key bypasses RLS so we can write scrobbles (which are
// select-only for the anon key). It lives only in .env, never in the browser.
const ROLE = env.SUPABASE_SERVICE_ROLE_KEY ? "service_role (bypasses RLS)" : "anon (RLS applies)";

if (!URL || !KEY || KEY === "YOUR-PUBLIC-ANON-KEY" || KEY === "your-public-anon-key" || KEY === "your-service-role-key" || URL.includes("YOUR-PROJECT-URL")) {
  console.error("Fill in .env (Project URL + anon or service_role key) first, then rerun this script.");
  process.exit(1);
}

const H = {
  apikey: KEY,
  Authorization: "Bearer " + KEY,
  "Content-Type": "application/json"
};

const base = URL + "/rest/v1";
const get = (path) => fetch(base + path, { headers: H }).then(r => { if (!r.ok) throw new Error("GET " + path + " -> " + r.status); return r.json(); });
const del = async (path) => { const r = await fetch(base + path, { method: "DELETE", headers: H }); const body = await r.text(); if (!r.ok) throw new Error("DELETE " + path + " -> " + r.status + " " + body); }; 
const post = (path, body) => fetch(base + path, { method: "POST", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(body) }).then(async r => { if (!r.ok) throw new Error("POST " + path + " -> " + r.status + " " + (await r.text())); return r.json(); });

/* ---------- data ---------- */

const albums = JSON.parse(readFileSync("res/build/albums.json", "utf8"));
const scrobbles = JSON.parse(readFileSync("res/build/scrobbles.json", "utf8"));

const months = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
const iso = (ts) => {
  const m = ts.match(/^(\d{2}) ([A-Z][a-z]{2}) (\d{4}) (\d{2}):(\d{2})/);
  return m ? `${m[3]}-${months[m[2]]}-${m[1]}T${m[4]}:${m[5]}:00` : ts;
};

const maxPlays = albums[0].plays;
const ratingFor = (plays) => Math.round((3 + 7 * (plays / maxPlays)) * 10) / 10;
const times = (n) => "time" + (n === 1 ? "" : "s");

const chunk = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };

const albumPayloads = albums.map((a) => ({
  title: a.title,
  artist: a.artist,
  release_year: null,
  genre: null,
  cover_url: null,
  description: "Listened " + a.plays + " " + times(a.plays) + ". Top tracks: " + a.top_tracks.join(", ") + ".",
  plays: a.plays
}));

const reviewPayloads = (ids) => albums.map((a) => ({
  album_id: ids[a.artist + "\u0000" + a.title],
  username: USERNAME,
  rating: ratingFor(a.plays),
  review_text: "Listened " + a.plays + " " + times(a.plays) + " in my Last.fm history. Favorite tracks: " + a.top_tracks.slice(0, 3).join(", ") + ".",
  created_at: iso(a.first_seen)
}));

const scrobblePayloads = (ids) => scrobbles.map((s) => ({
  album_id: ids[s.artist + "\u0000" + s.title],
  artist: s.artist,
  title: s.title,
  track: s.track,
  scrobbled_at: iso(s.ts)
}));

async function postAll(table, payloads) {
  let done = 0;
  for (const batch of chunk(payloads, BATCH)) {
    await post("/" + table, batch);
    done += batch.length;
    console.log("  " + table + ": " + done + "/" + payloads.length);
  }
}

/* ---------- run ---------- */

(async () => {
  console.log("Connecting to " + URL + " using " + ROLE);
  const probe = await get("/albums?select=id&limit=1");
  console.log("Connection OK (albums currently: " + probe.length + ")");

  if (RESET) {
    console.log("Resetting tables (delete scrobbles -> reviews -> albums)...");
    await del("/scrobbles?id=neq.0");
    await del("/reviews?id=neq.0");
    await del("/albums?id=neq.0");
  }

  console.log("Inserting albums...");
  const albumIds = {};
  for (const batch of chunk(albumPayloads, BATCH)) {
    const inserted = await post("/albums", batch);
    for (const row of inserted) albumIds[row.artist + "\u0000" + row.title] = row.id;
    console.log("  albums: " + Object.keys(albumIds).length + "/" + albums.length);
  }
  if (Object.keys(albumIds).length !== albums.length) {
    console.error("WARN: inserted " + Object.keys(albumIds).length + " albums, expected " + albums.length);
  }

  console.log("Inserting reviews...");
  await postAll("reviews", reviewPayloads(albumIds));

  console.log("Inserting scrobbles...");
  await postAll("scrobbles", scrobblePayloads(albumIds));

  const count = async (path) => {
    const r = await fetch(base + path, { method: "HEAD", headers: { ...H, Prefer: "count=exact" } });
    if (!r.ok) throw new Error("HEAD " + path + " -> " + r.status);
    const range = r.headers.get("content-range") || "0-0/0";
    return parseInt(range.split("/")[1], 10);
  };
  const [albumsN, reviewsN, scrobblesN] = await Promise.all([
    count("/albums?select=id"),
    count("/reviews?select=id"),
    count("/scrobbles?select=id")
  ]);
  console.log("DONE. albums=" + albumsN + " reviews=" + reviewsN + " scrobbles=" + scrobblesN);
})().catch((e) => {
  console.error("FAILED: " + e.message);
  process.exit(1);
});
