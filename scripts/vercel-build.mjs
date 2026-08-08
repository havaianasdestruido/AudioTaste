"use strict";

// Vercel production build:
//   1. generate config.js from env (as before)
//   2. minify every served HTML/CSS/JS/SVG and compress images
//   3. write the result to dist/ (gitignored) which Vercel publishes
//
// Source files are NEVER rewritten. Minification happens here, on the
// build machine, during deploy only.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";
import { transformSync } from "esbuild";
import { minify as minifyHtml } from "html-minifier-terser";
import { optimize as optimizeSvg } from "svgo";

const ROOT = process.cwd();
const OUT = join(ROOT, "dist");

const EXCLUDE = new Set([
  "node_modules",
  ".git",
  "dist",
  "logs",
  "scripts",
  "supabase",
  "res",
  ".vercel",
  "package.json",
  "package-lock.json",
  "vercel.json",
  ".gitignore",
  ".env.example"
]);

/* ---------- step 1: generate config.js ---------- */

execSync("node scripts/build-config.mjs", { cwd: ROOT, stdio: "inherit" });

/* ---------- step 2: clean output ---------- */

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

/* ---------- helpers ---------- */

function bytes(f) {
  return statSync(f).size;
}

async function jsMinify(src, file) {
  const r = transformSync(src, { loader: "js", minify: true, target: "es2017" });
  if (r.code.length > src.length) return src; // never grow a file
  return r.code;
}

async function cssMinify(src) {
  const r = transformSync(src, { loader: "css", minify: true });
  return r.code.length < src.length ? r.code : src;
}

async function htmlMinify(src) {
  const out = await minifyHtml(src, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true,
    collapseBooleanAttributes: true,
    minifyCSS: true,
    minifyJS: true
  });
  return out.length < src.length ? out : src;
}

async function svgMinify(src, file) {
  const r = optimizeSvg(src, { path: file });
  return r.data.length < src.length ? r.data : src;
}

async function imageMinify(src, dest, ext) {
  const sharp = (await import("sharp")).default;
  const img = sharp(src);
  let pipeline;
  if (ext === "png") pipeline = img.png({ palette: true });
  else if (ext === "jpg" || ext === "jpeg") pipeline = img.jpeg({ quality: 80, mozjpeg: true });
  else if (ext === "webp") pipeline = img.webp({ quality: 80 });
  else if (ext === "avif") pipeline = img.avif({ quality: 55 });
  else return null; // gif/ico/others: copy as-is
  await pipeline.toFile(dest);
  return bytes(dest);
}

/* ---------- step 3: walk, minify, copy ---------- */

const stats = { html: 0, css: 0, js: 0, svg: 0, img: 0, copied: 0, htmlSaved: 0, cssSaved: 0, jsSaved: 0, svgSaved: 0, imgSaved: 0 };

function destFor(abs) {
  const rel = relative(ROOT, abs);
  const dest = join(OUT, rel);
  mkdirSync(join(dest, ".."), { recursive: true });
  return dest;
}

async function handleFile(abs) {
  const name = abs.split(/[\\/]/).pop();
  if (name.startsWith(".")) return; // never ship dotfiles
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1).toLowerCase() : "";
  const dest = destFor(abs);
  const orig = bytes(abs);

  try {
    if (ext === "html") {
      const out = await htmlMinify(readFileSync(abs, "utf8"));
      writeFileSync(dest, out);
      stats.htmlSaved += orig - Buffer.byteLength(out);
      stats.html++;
    } else if (ext === "css") {
      const out = await cssMinify(readFileSync(abs, "utf8"));
      writeFileSync(dest, out);
      stats.cssSaved += orig - Buffer.byteLength(out);
      stats.css++;
    } else if (ext === "js" || ext === "mjs") {
      const out = await jsMinify(readFileSync(abs, "utf8"), abs);
      writeFileSync(dest, out);
      stats.jsSaved += orig - Buffer.byteLength(out);
      stats.js++;
    } else if (ext === "svg") {
      const out = await svgMinify(readFileSync(abs, "utf8"), abs);
      writeFileSync(dest, out);
      stats.svgSaved += orig - Buffer.byteLength(out);
      stats.svg++;
    } else if (["png", "jpg", "jpeg", "webp", "avif"].includes(ext)) {
      const before = orig;
      const after = await imageMinify(abs, dest, ext);
      if (after === null || after >= before) copyFileSync(abs, dest); // keep original if not smaller
      else stats.imgSaved += before - after;
      stats.img++;
    } else {
      copyFileSync(abs, dest);
      stats.copied++;
    }
  } catch (e) {
    // Never let one asset break the deploy: fall back to a plain copy.
    console.warn("  [minify] skipped " + relative(ROOT, abs) + ": " + e.message);
    try { copyFileSync(abs, dest); } catch {}
  }
}

async function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE.has(entry.name)) continue;
      await walk(abs);
    } else if (entry.isFile()) {
      if (EXCLUDE.has(entry.name)) continue;
      await handleFile(abs);
    }
  }
}

await walk(ROOT);

/* ---------- step 4: summary ---------- */

const fmt = (n) => n > 0 ? Math.max(1, Math.round(n / 1024)) + " KB" : "0 KB";
console.log("");
console.log("Build complete -> dist/");
console.log("  minified:  " + stats.html + " html  " + stats.css + " css  " + stats.js + " js  " + stats.svg + " svg  " + stats.img + " img");
console.log("  total saved: " + fmt(stats.htmlSaved + stats.cssSaved + stats.jsSaved + stats.svgSaved + stats.imgSaved));
