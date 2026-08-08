"use strict";

// Parse a Last.fm scrobble CSV (artist,album,track,timestamp) and
// aggregate it into per-album records with play counts and top tracks.
//
// Applies a play-count threshold (default 5): albums with fewer plays
// are dropped so "trash" one-off scrobbles never reach the app.
//
// Usage: node scripts/parse_scrobbles.mjs [MIN_PLAYS]
// Outputs:
//   res/build/albums.json    kept albums (>= MIN_PLAYS plays), plays desc
//   res/build/scrobbles.json all scrobbles belonging to kept albums

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const MIN_PLAYS = Number(process.argv[2] || 5);

// Artists excluded entirely (scrobbles dropped, no albums emitted).
// Matching is case-insensitive on the artist name.
const BLACKLISTED_ARTISTS = ["r u s s e l b u c k"];
// Normalize whitespace so internal double-spaces / NBSP can't bypass.
const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
const isBlacklisted = (artist) =>
  BLACKLISTED_ARTISTS.some((b) => norm(artist) === norm(b));

const RAW = readFileSync("res/UltimateQuack.csv");

let text;
try {
  text = new TextDecoder("utf-8", { fatal: true }).decode(RAW);
} catch {
  text = new TextDecoder("latin1").decode(RAW);
}

function splitCSV(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else if (c === '"') {
      inQ = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
const rows = [];
let malformed = 0;
const seen = new Set(); // dedupe exact duplicate scrobbles (artist+album+track+ts)
for (const line of lines) {
  const f = splitCSV(line).map((s) => s.trim());
  if (f.length !== 4 || !f[3]) {
    malformed++;
    continue;
  }
  if (isBlacklisted(f[0])) continue; // blacklisted artist dropped entirely
  const dedupeKey = f[0] + "\u0000" + f[1] + "\u0000" + f[2] + "\u0000" + f[3];
  if (seen.has(dedupeKey)) continue;
  seen.add(dedupeKey);
  rows.push({ artist: f[0], album: f[1], track: f[2], ts: f[3] });
}

const map = new Map();
for (const r of rows) {
  const key = r.artist + "\u0000" + r.album;
  if (!map.has(key)) {
    map.set(key, {
      artist: r.artist,
      title: r.album,
      plays: 0,
      first: r.ts,
      last: r.ts,
      firstMs: Date.parse(r.ts),
      lastMs: Date.parse(r.ts),
      tracks: new Map()
    });
  }
  const e = map.get(key);
  e.plays++;
  const ms = Date.parse(r.ts);
  if (Number.isFinite(ms) && ms < e.firstMs) { e.firstMs = ms; e.first = r.ts; }
  if (Number.isFinite(ms) && ms > e.lastMs) { e.lastMs = ms; e.last = r.ts; }
  e.tracks.set(r.track, (e.tracks.get(r.track) || 0) + 1);
}

const albums = [...map.values()]
  .map((e) => {
    const top = [...e.tracks.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t]) => t);
    // Scrobbles without an album tag are grouped under a
    // per-artist "Singles & Sessions" pseudo-album.
    const title = e.title.trim() || e.artist + " \u2014 Singles & Sessions";
    return {
      artist: e.artist,
      title,
      plays: e.plays,
      first_seen: e.first,
      last_seen: e.last,
      top_tracks: top
    };
  })
  .sort((a, b) => b.plays - a.plays);

const keptAlbums = albums.filter((a) => a.plays >= MIN_PLAYS);
const keptKeys = new Set(keptAlbums.map((a) => a.artist + "\u0000" + a.title));
const scrobbles = rows
  .filter((r) => {
    const title = r.album.trim() || r.artist + " \u2014 Singles & Sessions";
    return keptKeys.has(r.artist + "\u0000" + title);
  })
  .map((r) => ({
    artist: r.artist,
    title: r.album.trim() || r.artist + " \u2014 Singles & Sessions",
    track: r.track,
    ts: r.ts
  }));

mkdirSync("res/build", { recursive: true });
writeFileSync("res/build/albums.json", JSON.stringify(keptAlbums, null, 2));
writeFileSync("res/build/scrobbles.json", JSON.stringify(scrobbles, null, 2));

console.log("ROWS_PARSED=" + rows.length);
console.log("MALFORMED=" + malformed);
console.log("MIN_PLAYS=" + MIN_PLAYS);
console.log("ALBUMS_ALL=" + albums.length);
console.log("ALBUMS_KEPT=" + keptAlbums.length);
console.log("SCROBBLES_KEPT=" + scrobbles.length);
console.log("ARTISTS_KEPT=" + new Set(keptAlbums.map((a) => a.artist)).size);
console.log("TOP_PLAYS=" + keptAlbums[0]?.plays);
console.log("MIN_KEPT_PLAYS=" + keptAlbums[keptAlbums.length - 1]?.plays);
