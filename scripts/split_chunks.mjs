"use strict";

// Split the aggregated albums dataset into N chunk files for the
// enrichment subagents. Each chunk keeps the same schema as albums.json.

import { readFileSync, writeFileSync } from "node:fs";

const albums = JSON.parse(readFileSync("res/build/albums.json", "utf8"));

// Clamp the chunk count to a sane range; NaN / 0 / negatives become 8.
const CHUNKS = Math.max(1, Math.min(Number(process.argv[2] || 8) || 8, albums.length));
const size = Math.ceil(albums.length / CHUNKS);

for (let i = 0; i < CHUNKS; i++) {
  const part = albums.slice(i * size, (i + 1) * size);
  writeFileSync("res/build/chunk_" + (i + 1) + ".json", JSON.stringify(part, null, 2));
  console.log("chunk_" + (i + 1) + ".json: " + part.length + " albums");
}
