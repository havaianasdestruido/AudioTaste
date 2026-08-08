"use strict";

/* ============================================================
   AudioTaste — main page (album discovery)
   Reads albums + their reviews from Supabase via the REST API,
   renders cards, and supports search / filter / sort.
   ============================================================ */

/* ---------- App state ---------- */

let albums = [];          // fetched albums, each row contains .reviews[]
let searchTerm = "";
let activeGenre = "all";
let sortBy = "rating-desc";
let refreshSeq = 0;       // bumped when a write re-fetches the dataset

/* ---------- DOM references ---------- */

const grid = document.getElementById("album-grid");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error-state");
const emptyEl = document.getElementById("empty-state");
const searchInput = document.getElementById("search-input");
const genreSelect = document.getElementById("genre-select");
const sortSelect = document.getElementById("sort-select");
const addAlbumBtn = document.getElementById("add-album-btn");
const modalOverlay = document.getElementById("modal-overlay");
const albumForm = document.getElementById("album-form");
const albumFormError = document.getElementById("album-form-error");
const genreList = document.getElementById("genre-list");
const toastRoot = document.getElementById("toast-root");

/* Supabase fields we request. The nested reviews(...) part is a
   PostgREST "embedded resource" — one request returns albums AND
   their reviews, demonstrating a relational JOIN via the API. */
const ALBUM_SELECT =
  "id,title,artist,release_year,genre,cover_url,description,plays,created_at," +
  "reviews(id,album_id,username,rating,review_text,created_at)";

/* ---------- Small helpers ---------- */

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function configReady() {
  return (
    !SUPABASE_URL.includes("YOUR-") && !SUPABASE_ANON_KEY.includes("YOUR-")
  );
}

function showBanner() {
  const banner = document.getElementById("config-banner");
  banner.classList.remove("hidden");
  banner.textContent =
    "Supabase credentials are not set. Open config.js and fill in SUPABASE_URL and SUPABASE_ANON_KEY, then run supabase/schema.sql in the Supabase SQL Editor.";
}

function toast(message, type = "success") {
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = (type === "error" ? "\u2715 " : "\u2713 ") + message;
  toastRoot.appendChild(el);
  setTimeout(() => {
    el.classList.add("leaving");
    el.addEventListener("animationend", () => el.remove());
  }, 3500);
}

function setError(message) {
  loadingEl.classList.add("hidden");
  grid.innerHTML = "";
  errorEl.classList.remove("hidden");
  errorEl.innerHTML =
    "<p><strong>Failed to load albums.</strong></p><p>" + esc(message) + "</p>";
}

/* ---------- REST request helpers ---------- */

async function apiRequest(path, options) {
  const res = await fetch(API.base + path, options);
  if (!res.ok) {
    let detail = res.status + " " + res.statusText;
    try {
      const err = await res.json();
      detail = err.message || err.details || detail;
    } catch (e) {
      /* response body was not JSON */
    }
    throw new Error(detail);
  }
  return res.status === 204 ? null : res.json();
}

const getJSON = (path) => apiRequest(path, { headers: API.headers });

/* ---------- Data cache (localStorage, stale-while-revalidate) ---------- */

const ALBUMS_CACHE_KEY = "albums";
const ALBUMS_CACHE_TTL = 5 * 60 * 1000; // 5 min

function cachedAlbums() {
  const v = DataCache.read(ALBUMS_CACHE_KEY, ALBUMS_CACHE_TTL);
  return Array.isArray(v) ? v : null;
}

function staleAlbums() {
  const v = DataCache.peek(ALBUMS_CACHE_KEY);
  return Array.isArray(v) ? v : null;
}

function storeAlbums(list) {
  DataCache.write(ALBUMS_CACHE_KEY, list);
}

function invalidateAlbums() {
  DataCache.remove(ALBUMS_CACHE_KEY);
}

/* ---------- Data: READ (GET /albums) ---------- */

async function fetchAlbums() {
  // GET request to the Supabase REST API.
  return getJSON(
    "/albums?select=" + encodeURIComponent(ALBUM_SELECT) + "&order=created_at.asc"
  );
}

/* ---------- Rating math ---------- */

function avgRating(reviews) {
  if (!reviews || reviews.length === 0) return null;
  const sum = reviews.reduce((total, r) => total + Number(r.rating), 0);
  return sum / reviews.length;
}

function fmtAvg(value) {
  return (Math.round(value * 10) / 10).toFixed(1);
}

function starsHTML(rating) {
  const pct = Math.max(0, Math.min(100, (rating / 10) * 100));
  return (
    '<div class="stars" aria-hidden="true">' +
    '<span class="stars-bg">\u2605\u2605\u2605\u2605\u2605</span>' +
    '<span class="stars-fill" style="width:' + pct.toFixed(1) + '%">' +
    "\u2605\u2605\u2605\u2605\u2605</span></div>"
  );
}

/* ---------- Generated cover art ---------- */

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function coverGradient(album) {
  const h = hashString(album.title + album.artist);
  const hue1 = h % 360;
  const hue2 = (hue1 + 60) % 360;
  return "linear-gradient(135deg, hsl(" + hue1 + ",65%,40%), hsl(" + hue2 + ",70%,28%))";
}

function initials(title) {
  const words = String(title).split(/\s+/).filter(Boolean);
  if (words.length === 0) return "AT";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function coverHTML(album) {
  const img = album.cover_url
    ? '<img src="' + esc(album.cover_url) + '" alt="Cover art for ' + esc(album.title) +
      '" loading="lazy" onerror="this.remove()">'
    : "";
  return (
    '<div class="album-cover" data-artist="' + esc(album.artist) + '" data-title="' + esc(album.title) +
    '" style="background:' + coverGradient(album) + '">' +
    '<span class="cover-initials">' + esc(initials(album.title)) + "</span>" +
    img +
    "</div>"
  );
}

/* ---------- Client-side album art (Last.fm + localStorage) ---------- */

// Covers missing from the DB are fetched in the browser, cached in
// localStorage, and injected into any .album-cover/.hero-cover element
// that has data-artist/data-title but no <img>. Non-blocking: gradients
// show until each cover resolves.

function coverCacheKey(artist, title) {
  return "at.cover." + hashString(artist + "\u0000" + title);
}

const Covers = {
  cached(artist, title) {
    try {
      const raw = localStorage.getItem(coverCacheKey(artist, title));
      if (!raw) return null;
      const j = JSON.parse(raw);
      return j.url || null;
    } catch {
      return null;
    }
  },
  store(artist, title, url, source) {
    try {
      localStorage.setItem(coverCacheKey(artist, title), JSON.stringify({ url, source: source || null, at: Date.now() }));
    } catch {
      /* storage full / private mode */
    }
  },
  async lookup(artist, title) {
    const singles = String(title).includes("Singles & Sessions");
    const p = new URLSearchParams({
      method: singles ? "artist.gettopalbums" : "album.getinfo",
      artist,
      api_key: LASTFM_API_KEY,
      format: "json"
    });
    if (!singles) p.set("album", title);
    const r = await fetch("https://ws.audioscrobbler.com/2.0/?" + p.toString());
    if (!r.ok) return null;
    const j = await r.json();
    if (j.error) return null;
    const list = singles
      ? j.topalbums && j.topalbums.album
      : j.album && [j.album];
    if (!list || !list.length) return null;
    for (const size of ["mega", "extralarge", "large"]) {
      const hit = list[0].image.find((i) => i.size === size && i["#text"]);
      if (hit) return hit["#text"];
    }
    return null;
  },
  async resolve(artist, title) {
    const cached = this.cached(artist, title);
    if (cached) return cached;
    const url = await this.lookup(artist, title);
    if (url) this.store(artist, title, url);
    return url;
  },
  hydrate(root) {
    if (!LASTFM_API_KEY || LASTFM_API_KEY.startsWith("YOUR-") || LASTFM_API_KEY.startsWith("your-")) return;
    root.querySelectorAll(".album-cover[data-artist], .hero-cover[data-artist]").forEach((el) => {
      if (el.querySelector("img")) return;
      const artist = el.getAttribute("data-artist");
      const title = el.getAttribute("data-title");
      this.resolve(artist, title).then((url) => {
        if (!url || !el.isConnected) return;
        const img = document.createElement("img");
        img.src = url;
        img.alt = "Cover art for " + title;
        img.loading = "lazy";
        img.onerror = () => img.remove();
        el.appendChild(img);
      });
    });
  }
};

/* ---------- Rendering ---------- */

function getFilteredAlbums() {
  const term = searchTerm.trim().toLowerCase();
  let list = albums.filter((a) => {
    const matchesTerm =
      !term ||
      a.title.toLowerCase().includes(term) ||
      a.artist.toLowerCase().includes(term);
    const matchesGenre =
      activeGenre === "all" || a.genre === activeGenre;
    return matchesTerm && matchesGenre;
  });

  const withAvg = list.map((a) => ({ ...a, avg: avgRating(a.reviews) }));

  switch (sortBy) {
    case "rating-desc":
      withAvg.sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
      break;
    case "rating-asc":
      withAvg.sort((a, b) => (a.avg ?? 11) - (b.avg ?? 11));
      break;
    case "newest":
      withAvg.sort((a, b) => (b.release_year ?? 0) - (a.release_year ?? 0));
      break;
    case "oldest":
      withAvg.sort((a, b) => (a.release_year ?? 9999) - (b.release_year ?? 9999));
      break;
    case "title":
      withAvg.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }
  return withAvg;
}

function cardHTML(album) {
  const year = album.release_year ? " " + esc(album.release_year) : "";
  const genre = album.genre ? " \u00b7 " + esc(album.genre) : "";
  const plays = album.plays
    ? " \u00b7 " + esc(album.plays) + " play" + (album.plays === 1 ? "" : "s")
    : "";
  const rating =
    album.avg !== null
      ? starsHTML(album.avg) + '<span class="card-score">' + fmtAvg(album.avg) + " / 10</span>"
      : '<span class="no-ratings">No ratings yet</span>';
  const reviewCount = album.reviews ? album.reviews.length : 0;

  return (
    '<article class="album-card">' +
    '<a href="pages/album.html?id=' + esc(album.id) + '">' + coverHTML(album) + "</a>" +
    '<div class="card-body">' +
    '<h3 class="card-title" title="' + esc(album.title) + '">' + esc(album.title) + "</h3>" +
    '<p class="card-artist">' + esc(album.artist) + "</p>" +
    '<p class="card-meta">' + (year || "") + genre + plays + "</p>" +
    '<div class="card-rating">' + rating + "</div>" +
    '<a class="btn btn-ghost btn-view" href="pages/album.html?id=' + esc(album.id) + '">' +
    "View Album" +
    (reviewCount > 0 ? " \u00b7 " + esc(reviewCount) + " review" + (reviewCount === 1 ? "" : "s") : "") +
    "</a>" +
    "</div></article>"
  );
}

function renderAlbums() {
  const list = getFilteredAlbums();
  loadingEl.classList.add("hidden");
  errorEl.classList.add("hidden");
  grid.innerHTML = list.map(cardHTML).join("");
  emptyEl.classList.toggle("hidden", list.length > 0);
  Covers.hydrate(grid);
}

function populateGenreOptions() {
  const genres = [...new Set(albums.map((a) => a.genre).filter(Boolean))].sort();
  genreSelect.innerHTML =
    '<option value="all">All Genres</option>' +
    genres.map((g) => '<option value="' + esc(g) + '">' + esc(g) + "</option>").join("");
  genreList.innerHTML = genres.map((g) => "<option value=\"" + esc(g) + "\"></option>").join("");
}

/* ---------- Toolbar events ---------- */

searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value;
  renderAlbums();
});

genreSelect.addEventListener("change", (e) => {
  activeGenre = e.target.value;
  renderAlbums();
});

sortSelect.addEventListener("change", (e) => {
  sortBy = e.target.value;
  renderAlbums();
});

/* ---------- Trends: most popular in a date range ---------- */

const trendFrom = document.getElementById("trend-from");
const trendTo = document.getElementById("trend-to");
const trendGroup = document.getElementById("trend-group");
const trendApply = document.getElementById("trend-apply");
const trendClear = document.getElementById("trend-clear");
const trendsPanel = document.getElementById("trends-panel");
const trendsTitle = document.getElementById("trends-title");
const trendsSubtitle = document.getElementById("trends-subtitle");
const trendsList = document.getElementById("trends-list");

function fmtRangeDate(value) {
  const d = new Date(value + "T00:00:00");
  return isNaN(d) ? value : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function setTrendsVisible(on) {
  document.querySelector(".toolbar").classList.toggle("hidden", on);
  grid.classList.toggle("hidden", on);
  loadingEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
  errorEl.classList.add("hidden");
  trendsPanel.classList.toggle("hidden", !on);
  trendClear.classList.toggle("hidden", !on);
}

trendApply.addEventListener("click", runTrends);
trendClear.addEventListener("click", clearTrends);

function clearTrends() {
  setTrendsVisible(false);
  trendsList.innerHTML = "";
}

async function runTrends() {
  const from = trendFrom.value;
  const to = trendTo.value;
  if (!from || !to) {
    toast("Pick both a start and end date.", "error");
    return;
  }
  if (from > to) {
    toast("Start date must be before the end date.", "error");
    return;
  }

  setTrendsVisible(true);
  trendApply.disabled = true;
  trendsSubtitle.textContent = fmtRangeDate(from) + " \u2013 " + fmtRangeDate(to);
  trendsList.innerHTML =
    '<li class="empty-state" style="border:none;background:none">Loading scrobbles&hellip;</li>';

  try {
    // Count scrobbles per album inside the window.
    const rows = await fetchScrobblesInRange(from, to);
    const counts = new Map();
    for (const r of rows) counts.set(r.album_id, (counts.get(r.album_id) || 0) + 1);

    if (counts.size === 0) {
      trendsTitle.textContent = "Most popular";
      trendsList.innerHTML =
        '<li class="empty-state" style="border:none;background:none">No scrobbles in this period.</li>';
      return;
    }

    const albumsById = await fetchAlbumsByIds([...counts.keys()]);
    renderTrends(counts, albumsById, trendGroup.value);
  } catch (err) {
    trendsList.innerHTML = "";
    trendsSubtitle.textContent = "Could not load trends.";
    toast("Failed to load trends: " + err.message, "error");
  } finally {
    trendApply.disabled = false;
  }
}

async function fetchScrobblesInRange(from, to) {
  // Cache counts per date range (scrobbles only change via reseed).
  const key = "scrobbles." + from + "." + to;
  const fresh = DataCache.read(key, 10 * 60 * 1000);
  if (Array.isArray(fresh)) return fresh;
  try {
    const rows = await fetchScrobblesInRangeRaw(from, to);
    DataCache.write(key, rows);
    return rows;
  } catch (err) {
    const stale = DataCache.peek(key);
    if (Array.isArray(stale)) return stale;
    throw err;
  }
}

async function fetchScrobblesInRangeRaw(from, to) {
  const base =
    "/scrobbles?select=album_id" +
    "&scrobbled_at=gte." + encodeURIComponent(from + "T00:00:00") +
    "&scrobbled_at=lte." + encodeURIComponent(to + "T23:59:59");
  const STEP = 1000;
  let all = [];
  let offset = 0;

  while (true) {
    const res = await fetch(API.base + base, {
      headers: { ...API.headers, Range: offset + "-" + (offset + STEP - 1) }
    });
    if (!res.ok) {
      let detail = res.status + " " + res.statusText;
      try {
        const err = await res.json();
        detail = err.message || err.details || detail;
      } catch (e) {
        /* non-JSON error body */
      }
      throw new Error(detail);
    }
    const part = await res.json();
    if (!Array.isArray(part)) throw new Error("Unexpected response from server.");
    all = all.concat(part);
    // A partial page means we reached the end; no reliance on Content-Range.
    if (part.length < STEP) break;
    offset += STEP;
  }
  return all;
}

async function fetchAlbumsByIds(ids) {
  const rows = await getJSON(
    "/albums?select=" + encodeURIComponent(ALBUM_SELECT) +
      "&id=in.(" + ids.join(",") + ")"
  );
  const byId = new Map();
  for (const a of rows) byId.set(a.id, a);
  return byId;
}

function renderTrends(counts, albumsById, groupBy) {
  const byAlbum = [];
  for (const [id, n] of counts) {
    const album = albumsById.get(id);
    if (album) byAlbum.push({ album, n });
  }

  let list;
  if (groupBy === "artist") {
    const m = new Map();
    for (const { album, n } of byAlbum) {
      const cur = m.get(album.artist) || { artist: album.artist, n: 0, top: null, topPlays: -1 };
      cur.n += n;
      if (n > cur.topPlays) {
        cur.top = album;
        cur.topPlays = n;
      }
      m.set(album.artist, cur);
    }
    list = [...m.values()].sort((a, b) => b.n - a.n);
    trendsTitle.textContent = "Most popular artists";
  } else {
    list = byAlbum.sort((a, b) => b.n - a.n);
    trendsTitle.textContent = "Most popular albums";
  }

  const top = list.slice(0, 100);
  trendsList.innerHTML = top
    .map((e, i) => trendItemHTML(e, i + 1, groupBy))
    .join("");
  Covers.hydrate(trendsList);
}

function trendItemHTML(e, rank, groupBy) {
  if (groupBy === "artist") {
    return (
      '<li class="trend-item">' +
      '<span class="trend-rank">' + rank + "</span>" +
      '<div class="trend-info">' +
      '<span class="trend-title">' + esc(e.artist) + "</span>" +
      "</div>" +
      '<span class="trend-stats">' +
      '<span class="trend-plays">' + e.n + " play" + (e.n === 1 ? "" : "s") + "</span>" +
      "</span></li>"
    );
  }

  const a = e.album;
  const avg = avgRating(a.reviews);
  const rating =
    avg !== null
      ? starsHTML(avg) + '<span class="card-score">' + fmtAvg(avg) + " / 10</span>"
      : "";
  return (
    '<li class="trend-item">' +
    '<span class="trend-rank">' + rank + "</span>" +
    '<a class="trend-cover" href="pages/album.html?id=' + esc(a.id) + '">' + coverHTML(a) + "</a>" +
    '<div class="trend-info">' +
    '<a class="trend-title" href="pages/album.html?id=' + esc(a.id) + '">' + esc(a.title) + "</a>" +
    '<span class="trend-artist">' + esc(a.artist) + "</span>" +
    "</div>" +
    '<span class="trend-stats">' +
    '<span class="trend-plays">' + e.n + " play" + (e.n === 1 ? "" : "s") + "</span>" +
    rating +
    "</span></li>"
  );
}

/* ---------- Add album: CREATE (POST /albums) ---------- */

function openModal() {
  albumForm.reset();
  albumFormError.classList.add("hidden");
  modalOverlay.classList.remove("hidden");
  document.getElementById("f-title").focus();
}

function closeModal() {
  modalOverlay.classList.add("hidden");
}

addAlbumBtn.addEventListener("click", openModal);
document.getElementById("empty-add-btn").addEventListener("click", openModal);
document.getElementById("cancel-album-btn").addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

function validateAlbumForm() {
  const title = document.getElementById("f-title").value.trim();
  const artist = document.getElementById("f-artist").value.trim();
  if (!title) return "Album title is required.";
  if (!artist) return "Artist is required.";
  const year = document.getElementById("f-year").value.trim();
  if (year && (Number(year) < 1900 || Number(year) > 2100)) {
    return "Release year must be between 1900 and 2100.";
  }
  const cover = document.getElementById("f-cover").value.trim();
  if (cover && !/^https:\/\//i.test(cover)) {
    return "Cover image URL must start with https://";
  }
  return "";
}

albumForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const error = validateAlbumForm();
  if (error) {
    albumFormError.textContent = error;
    albumFormError.classList.remove("hidden");
    return;
  }

  const yearRaw = document.getElementById("f-year").value.trim();
  const payload = {
    title: document.getElementById("f-title").value.trim(),
    artist: document.getElementById("f-artist").value.trim(),
    release_year: yearRaw ? Number(yearRaw) : null,
    genre: document.getElementById("f-genre").value.trim() || null,
    cover_url: document.getElementById("f-cover").value.trim() || null,
    description: document.getElementById("f-desc").value.trim() || null
  };

  const submitBtn = document.getElementById("submit-album-btn");
  submitBtn.disabled = true;
  try {
    // POST request creates a new album row.
    await apiRequest("/albums", {
      method: "POST",
      headers: API_WRITE_HEADERS,
      body: JSON.stringify(payload)
    });
    closeModal();
    toast("Album added successfully.");
    refreshSeq++;
    try {
      albums = await fetchAlbums();
      storeAlbums(albums);
      populateGenreOptions();
      renderAlbums();
    } catch (err) {
      // The POST succeeded but the refresh failed: drop the cache so the
      // next page load refetches, and keep the current list until then.
      invalidateAlbums();
      toast("Album added, but could not refresh the list.", "error");
    }
  } catch (err) {
    albumFormError.textContent = "Failed to add album: " + err.message;
    albumFormError.classList.remove("hidden");
    toast("Failed to add album. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

/* ---------- Init ---------- */

async function init() {
  if (!configReady()) {
    loadingEl.classList.add("hidden");
    showBanner();
    return;
  }

  // Render from cache immediately; only hit the network when the
  // cache is missing or older than the TTL (stale-while-revalidate).
  const cached = cachedAlbums();
  const stale = cached ? null : staleAlbums();
  if (cached || stale) {
    albums = cached || stale;
    populateGenreOptions();
    renderAlbums();
  }
  if (cached) return;

  try {
    const seq = refreshSeq;
    const fresh = await fetchAlbums();
    if (seq !== refreshSeq) {
      loadingEl.classList.add("hidden"); // a write-owned refresh landed first
      return;
    }
    albums = fresh;
    storeAlbums(fresh);
    populateGenreOptions();
    renderAlbums();
  } catch (err) {
    // Keep showing the stale cache if one was rendered.
    if (!stale) setError(err.message);
  }
}

document.addEventListener("DOMContentLoaded", init);
