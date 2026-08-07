"use strict";

// Split the aggregated albums dataset into N chunk files for the
// enrichment subagents. Each chunk keeps the same schema as albums.json.

import { readFileSync, writeFileSync } from "node:fs";

const CHUNKS = Number(process.argv[2] || 8);

const albums = JSON.parse(readFileSync("res/build/albums.json", "utf8"));
const size = Math.ceil(albums.length / CHUNKS);

for (let i = 0; i < CHUNKS; i++) {
  const part = albums.slice(i * size, (i + 1) * size);
  writeFileSync("res/build/chunk_" + (i + 1) + ".json", JSON.stringify(part, null, 2));
  console.log("chunk_" + (i + 1) + ".json: " + part.length + " albums");
}
