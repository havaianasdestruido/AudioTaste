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
  "id,title,artist,release_year,genre,cover_url,description,created_at," +
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
    '<div class="album-cover" style="background:' + coverGradient(album) + '">' +
    '<span class="cover-initials">' + esc(initials(album.title)) + "</span>" +
    img +
    "</div>"
  );
}

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
  const year = album.release_year ? " " + album.release_year : "";
  const genre = album.genre ? " \u00b7 " + esc(album.genre) : "";
  const rating =
    album.avg !== null
      ? starsHTML(album.avg) + '<span class="card-score">' + fmtAvg(album.avg) + " / 10</span>"
      : '<span class="no-ratings">No ratings yet</span>';
  const reviewCount = album.reviews ? album.reviews.length : 0;

  return (
    '<article class="album-card">' +
    '<a href="pages/album.html?id=' + album.id + '">' + coverHTML(album) + "</a>" +
    '<div class="card-body">' +
    '<h3 class="card-title" title="' + esc(album.title) + '">' + esc(album.title) + "</h3>" +
    '<p class="card-artist">' + esc(album.artist) + "</p>" +
    '<p class="card-meta">' + (year || "") + genre + "</p>" +
    '<div class="card-rating">' + rating + "</div>" +
    '<a class="btn btn-ghost btn-view" href="pages/album.html?id=' + album.id + '">' +
    "View Album" +
    (reviewCount > 0 ? " \u00b7 " + reviewCount + " review" + (reviewCount === 1 ? "" : "s") : "") +
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
    albums = await fetchAlbums();
    populateGenreOptions();
    renderAlbums();
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
  try {
    albums = await fetchAlbums();
    populateGenreOptions();
    renderAlbums();
  } catch (err) {
    setError(err.message);
  }
}

document.addEventListener("DOMContentLoaded", init);
