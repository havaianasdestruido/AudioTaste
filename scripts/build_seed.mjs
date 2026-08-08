"use strict";

// Generate supabase/seed_*.sql files from res/build/albums.json and
// res/build/scrobbles.json (output of scripts/parse_scrobbles.mjs).
//
// Files (run IN ORDER in the Supabase SQL Editor, one file = one query):
//   seed_01_albums.sql            - albums table rows
//   seed_02_reviews.sql           - one review per album from the owner
//   seed_03_scrobbles_a.sql ...   - scrobbles linked to albums via JOIN
//
// Each file is kept small (< 60 KB) on purpose: the Supabase SQL Editor
// can silently corrupt/truncate large pastes, which previously produced
// errors like `relation "GLITTER" does not exist`. If one file fails,
// fix it and re-run only that file (albums must exist first).
//
// Usage: node scripts/build_seed.mjs [username] [scrobble_batch_size]
//   username           reviewer shown on reviews (default UltimateQuack)
//   scrobble_batch_size  rows per seed_03 file (default 400)
//
// Enrichment fields (release_year, genre, cover_url) are emitted as NULL
// here; re-run scripts/enrich_albums.mjs once implemented to fill them.

import { readFileSync, writeFileSync } from "node:fs";

const USERNAME = process.argv[2] || "UltimateQuack";
const BATCH = parseInt(process.argv[3] || "400", 10);

const albums = JSON.parse(readFileSync("res/build/albums.json", "utf8"));
const scrobbles = JSON.parse(readFileSync("res/build/scrobbles.json", "utf8"));

const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

const maxPlays = albums[0].plays;
// Only the single most-played album gets a perfect 10.0; every other
// album is rated in (4, 10) scaled by its play count.
const ratingFor = (plays) =>
  plays === maxPlays ? 10.0 : Math.round((4.1 + 5.8 * (plays / maxPlays)) * 10) / 10;

const times = (n) => "time" + (n === 1 ? "" : "s");

const header = `-- ============================================================
-- AudioTaste — scrobble-based seed data (GENERATED FILE)
-- Do not edit by hand. Regenerate with:
--   node scripts/parse_scrobbles.mjs
--   node scripts/build_seed.mjs
--
-- Run order (one file per SQL Editor query, after schema.sql):
--   1. seed_01_albums.sql
--   2. seed_02_reviews.sql
--   3. seed_03_scrobbles_*.sql (in filename order)
--
-- Assumes the albums/reviews/scrobbles tables are EMPTY.
-- Owner username: ${USERNAME}
-- ============================================================

`;

/* ---------- seed_01: albums ---------- */

const albumRows = albums
  .map((a) => {
    const desc =
      "Listened " + a.plays + " " + times(a.plays) + ". Top tracks: " + a.top_tracks.join(", ") + ".";
    return (
      "  (" + q(a.title) + ", " + q(a.artist) + ", NULL, NULL, NULL, " + q(desc) + ", " + a.plays + ")"
    );
  })
  .join(",\n");

writeFileSync(
  "supabase/seed_01_albums.sql",
  header +
    "INSERT INTO public.albums (title, artist, release_year, genre, cover_url, description, plays) VALUES\n" +
    albumRows +
    ";\n"
);

/* ---------- seed_02: reviews ---------- */

const reviewRows = albums
  .map((a) => {
    const fav = a.top_tracks.slice(0, 3).join(", ");
    const text =
      "Listened " + a.plays + " " + times(a.plays) + " in my Last.fm history. Favorite tracks: " + fav + ".";
    return (
      "  (" + q(a.title) + ", " + q(a.artist) + ", " + q(USERNAME) + ", " +
      ratingFor(a.plays) + ", " + q(text) + ", " + q(a.first_seen) + "::timestamptz)"
    );
  })
  .join(",\n");

writeFileSync(
  "supabase/seed_02_reviews.sql",
  header +
    "INSERT INTO public.reviews (album_id, username, rating, review_text, created_at)\n" +
    "SELECT a.id, s.username, s.rating, s.review_text, s.created_at\n" +
    "FROM (VALUES\n" +
    reviewRows +
    "\n) AS s(title, artist, username, rating, review_text, created_at)\n" +
    "JOIN public.albums a ON a.artist = s.artist AND a.title = s.title;\n"
);

/* ---------- seed_03_*: scrobbles in batches ---------- */

const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

chunk(scrobbles, BATCH).forEach((batch, i) => {
  // a, b, ..., z, aa, ab, ... (never falls back to punctuation)
  const letter = i < 26
    ? String.fromCharCode(97 + i)
    : String.fromCharCode(97 + Math.floor(i / 26) - 1) + String.fromCharCode(97 + (i % 26));
  const rows = batch
    .map((s) =>
      "  (" + q(s.title) + ", " + q(s.artist) + ", " + q(s.track) + ", " + q(s.ts) + "::timestamp)"
    )
    .join(",\n");
  writeFileSync(
    "supabase/seed_03_scrobbles_" + letter + ".sql",
    header +
      "INSERT INTO public.scrobbles (album_id, artist, title, track, scrobbled_at)\n" +
      "SELECT a.id, s.artist, s.title, s.track, s.scrobbled_at\n" +
      "FROM (VALUES\n" +
      rows +
      "\n) AS s(title, artist, track, scrobbled_at)\n" +
      "JOIN public.albums a ON a.artist = s.artist AND a.title = s.title;\n"
  );
});

console.log("ALBUM_ROWS=" + albums.length);
console.log("REVIEW_ROWS=" + albums.length);
console.log("SCROBBLE_ROWS=" + scrobbles.length);
console.log("SCROBBLE_FILES=" + Math.ceil(scrobbles.length / BATCH));
console.log("WROTE seed_01_albums.sql, seed_02_reviews.sql, seed_03_scrobbles_*.sql");
