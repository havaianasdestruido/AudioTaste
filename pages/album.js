"use strict";

/* ============================================================
   AudioTaste — album detail page
   Demonstrates full CRUD on one album and its reviews:
     GET    album + reviews
     POST   create a review
     PATCH  update a review / update the album
     DELETE remove a review / remove the album
   ============================================================ */

/* ---------- State ---------- */

const params = new URLSearchParams(location.search);
const albumId = params.get("id");
let album = null; // current album with .reviews[]

const ALBUM_SELECT =
  "id,title,artist,release_year,genre,cover_url,description,created_at," +
  "reviews(id,album_id,username,rating,review_text,created_at)";

/* ---------- DOM references ---------- */

const loadingEl = document.getElementById("loading");
const notFoundEl = document.getElementById("not-found");
const heroEl = document.getElementById("album-hero");
const reviewsTitleEl = document.getElementById("reviews-title");
const formCardEl = document.getElementById("review-form-card");
const reviewsListEl = document.getElementById("reviews-list");
const noReviewsEl = document.getElementById("no-reviews");
const reviewForm = document.getElementById("review-form");
const reviewFormError = document.getElementById("review-form-error");
const toastRoot = document.getElementById("toast-root");
const editOverlay = document.getElementById("edit-modal-overlay");

/* ---------- Small helpers ---------- */

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function formatDate(iso) {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function avgRating(reviews) {
  if (!reviews || reviews.length === 0) return null;
  const sum = reviews.reduce((t, r) => t + Number(r.rating), 0);
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

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function coverGradient(a) {
  const h = hashString(a.title + a.artist);
  return "linear-gradient(135deg, hsl(" + (h % 360) + ",65%,40%), hsl(" + ((h + 60) % 360) + ",70%,28%))";
}

function initials(title) {
  const words = String(title).split(/\s+/).filter(Boolean);
  if (words.length === 0) return "AT";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/* ---------- REST request helper ---------- */

async function apiRequest(path, options) {
  const res = await fetch(API.base + path, options);
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
  return res.status === 204 ? null : res.json();
}

/* ---------- Data: READ (GET /albums?id=eq.X) ---------- */

async function fetchAlbum() {
  // One GET request, but the reviews are embedded as a related resource.
  const rows = await apiRequest(
    "/albums?id=eq." + encodeURIComponent(albumId) +
      "&select=" + encodeURIComponent(ALBUM_SELECT),
    { headers: API.headers }
  );
  return rows && rows.length > 0 ? rows[0] : null;
}

/* ---------- Rendering ---------- */

function render() {
  if (!album) return;
  heroEl.innerHTML = buildHeroHTML();
  heroEl.classList.remove("hidden");
  formCardEl.classList.remove("hidden");
  reviewsTitleEl.classList.remove("hidden");
  renderReviews();
}

function buildHeroHTML() {
  const year = album.release_year ? " " + album.release_year : "";
  const genre = album.genre ? " \u00b7 " + esc(album.genre) : "";
  const avg = avgRating(album.reviews);
  const count = album.reviews ? album.reviews.length : 0;
  const coverImg = album.cover_url
    ? '<img src="' + esc(album.cover_url) + '" alt="Cover art for ' + esc(album.title) +
      '" onerror="this.remove()">'
    : "";
  const ratingBox =
    avg !== null
      ? '<div class="hero-rating">' + starsHTML(avg) +
        '<span class="big-score">' + fmtAvg(avg) + ' / 10</span>' +
        '<span class="review-count">' + count + " review" + (count === 1 ? "" : "s") + "</span></div>"
      : '<div class="hero-rating"><span class="review-count">No ratings yet</span></div>';

  return (
    '<div class="hero-cover" style="background:' + coverGradient(album) + '">' +
    '<span class="cover-initials">' + esc(initials(album.title)) + "</span>" + coverImg +
    "</div>" +
    '<div class="hero-info">' +
    "<h1>" + esc(album.title) + "</h1>" +
    '<p class="artist">' + esc(album.artist) + "</p>" +
    '<p class="hero-meta">' + (year || "Unknown year") + genre + "</p>" +
    (album.description
      ? '<p class="hero-description">' + esc(album.description) + "</p>"
      : "") +
    ratingBox +
    '<div class="admin-actions">' +
    '<button class="btn btn-ghost btn-sm" id="edit-album-btn">Edit Album</button>' +
    '<button class="btn btn-danger btn-sm" id="delete-album-btn">Delete Album</button>' +
    "</div>" +
    "</div>"
  );
}

function reviewHTML(review) {
  const date = formatDate(review.created_at);
  return (
    '<div class="review" id="review-' + review.id + '">' +
    '<div class="review-head">' +
    '<span class="user">' + esc(review.username) + "</span>" +
    (date ? '<span class="review-date">' + date + "</span>" : "") +
    '<span class="review-rating">' + starsHTML(Number(review.rating)) +
    '<span class="score">' + fmtAvg(Number(review.rating)) + " / 10</span></span>" +
    "</div>" +
    '<p class="review-text">' + esc(review.review_text) + "</p>" +
    '<div class="review-actions">' +
    '<button class="btn-link" data-edit="' + review.id + '">Edit</button>' +
    '<button class="btn-link danger" data-del="' + review.id + '">Delete</button>' +
    "</div>" +
    "</div>"
  );
}

function renderReviews() {
  const reviews = album.reviews || [];
  reviewsListEl.innerHTML = reviews.map(reviewHTML).join("");
  reviewsListEl.classList.toggle("hidden", reviews.length === 0);
  noReviewsEl.classList.toggle("hidden", reviews.length > 0);
}

/* ---------- Review form: CREATE (POST /reviews) ---------- */

function validateReview(rating, text, username) {
  if (!username) return "Username is required.";
  if (rating === "" || rating === null || isNaN(Number(rating))) {
    return "Rating is required.";
  }
  const num = Number(rating);
  if (num < 0 || num > 10) return "Rating must be between 0 and 10.";
  if (!text.trim()) return "Review text is required.";
  return "";
}

reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("r-username").value.trim();
  const rating = document.getElementById("r-rating").value;
  const text = document.getElementById("r-text").value.trim();

  const error = validateReview(rating, text, username);
  if (error) {
    reviewFormError.textContent = error;
    reviewFormError.classList.remove("hidden");
    return;
  }
  reviewFormError.classList.add("hidden");

  const submitBtn = document.getElementById("submit-review-btn");
  submitBtn.disabled = true;
  try {
    // POST request creates a new review row.
    await apiRequest("/reviews", {
      method: "POST",
      headers: API_WRITE_HEADERS,
      body: JSON.stringify({
        album_id: album.id,
        username,
        rating: Number(rating),
        review_text: text
      })
    });
    // Remember the username for the next time.
    localStorage.setItem("audiotaste_username", username);
    reviewForm.reset();
    document.getElementById("r-username").value = username;
    toast("Review submitted successfully.");
    await reload();
  } catch (err) {
    reviewFormError.textContent = "Failed to submit review: " + err.message;
    reviewFormError.classList.remove("hidden");
    toast("Failed to submit review. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

/* ---------- Edit / delete reviews (event delegation) ---------- */

reviewsListEl.addEventListener("click", (e) => {
  const editBtn = e.target.closest("[data-edit]");
  const delBtn = e.target.closest("[data-del]");
  if (editBtn) startEditReview(Number(editBtn.dataset.edit));
  if (delBtn) deleteReview(Number(delBtn.dataset.del));
});

function startEditReview(reviewId) {
  const review = (album.reviews || []).find((r) => r.id === reviewId);
  if (!review) return;
  const node = document.getElementById("review-" + reviewId);
  if (!node) return;

  node.innerHTML =
    '<div class="review-edit">' +
    '<label>Rating (0.0 – 10.0)' +
    '<input type="number" id="edit-rating-' + reviewId + '" min="0" max="10" step="0.1" value="' + review.rating + '"></label>' +
    '<label>Review<textarea id="edit-text-' + reviewId + '" rows="4" maxlength="2000">' +
    esc(review.review_text) + "</textarea></label>" +
    '<p class="form-error hidden" id="edit-error-' + reviewId + '"></p>' +
    '<div class="edit-actions">' +
    '<button class="btn btn-primary btn-sm" id="save-review-' + reviewId + '">Save</button>' +
    '<button class="btn btn-ghost btn-sm" id="cancel-review-' + reviewId + '">Cancel</button>' +
    "</div></div>";

  document.getElementById("save-review-" + reviewId).addEventListener("click", async () => {
    const rating = document.getElementById("edit-rating-" + reviewId).value;
    const text = document.getElementById("edit-text-" + reviewId).value.trim();
    const error = validateReview(rating, text, review.username);
    const errEl = document.getElementById("edit-error-" + reviewId);
    if (error) {
      errEl.textContent = error;
      errEl.classList.remove("hidden");
      return;
    }
    errEl.classList.add("hidden");
    await saveReview(reviewId, Number(rating), text);
  });

  document.getElementById("cancel-review-" + reviewId).addEventListener("click", renderReviews);
}

/* ---------- UPDATE review (PATCH /reviews?id=eq.X) ---------- */

async function saveReview(reviewId, rating, text) {
  const btn = document.getElementById("save-review-" + reviewId);
  if (btn) btn.disabled = true;
  try {
    // PATCH request updates only the provided fields.
    await apiRequest("/reviews?id=eq." + reviewId, {
      method: "PATCH",
      headers: API_WRITE_HEADERS,
      body: JSON.stringify({ rating, review_text: text })
    });
    toast("Review updated successfully.");
    await reload();
  } catch (err) {
    const errEl = document.getElementById("edit-error-" + reviewId);
    if (errEl) {
      errEl.textContent = "Failed to update: " + err.message;
      errEl.classList.remove("hidden");
    }
    toast("Failed to update review.", "error");
  }
}

/* ---------- DELETE review (DELETE /reviews?id=eq.X) ---------- */

async function deleteReview(reviewId) {
  if (!confirm("Delete this review permanently?")) return;
  try {
    // DELETE request removes the row.
    await apiRequest("/reviews?id=eq." + reviewId, {
      method: "DELETE",
      headers: API_WRITE_HEADERS
    });
    toast("Review deleted.");
    await reload();
  } catch (err) {
    toast("Failed to delete review: " + err.message, "error");
  }
}

/* ---------- Edit / delete album (admin) ---------- */

heroEl.addEventListener("click", (e) => {
  if (e.target.id === "edit-album-btn") openEditModal();
  if (e.target.id === "delete-album-btn") deleteAlbum();
});

function openEditModal() {
  document.getElementById("e-title").value = album.title;
  document.getElementById("e-artist").value = album.artist;
  document.getElementById("e-year").value = album.release_year ?? "";
  document.getElementById("e-genre").value = album.genre ?? "";
  document.getElementById("e-cover").value = album.cover_url ?? "";
  document.getElementById("e-desc").value = album.description ?? "";
  document.getElementById("edit-form-error").classList.add("hidden");
  editOverlay.classList.remove("hidden");
}

document.getElementById("cancel-edit-btn").addEventListener("click", () => {
  editOverlay.classList.add("hidden");
});
editOverlay.addEventListener("click", (e) => {
  if (e.target === editOverlay) editOverlay.classList.add("hidden");
});

document.getElementById("edit-album-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("edit-form-error");
  const title = document.getElementById("e-title").value.trim();
  const artist = document.getElementById("e-artist").value.trim();
  if (!title || !artist) {
    errEl.textContent = "Title and artist are required.";
    errEl.classList.remove("hidden");
    return;
  }
  const year = document.getElementById("e-year").value.trim();
  if (year && (Number(year) < 1900 || Number(year) > 2100)) {
    errEl.textContent = "Release year must be between 1900 and 2100.";
    errEl.classList.remove("hidden");
    return;
  }
  errEl.classList.add("hidden");

  const saveBtn = document.getElementById("save-edit-btn");
  saveBtn.disabled = true;
  try {
    // PATCH request updates the album row.
    await apiRequest("/albums?id=eq." + album.id, {
      method: "PATCH",
      headers: API_WRITE_HEADERS,
      body: JSON.stringify({
        title,
        artist,
        release_year: year ? Number(year) : null,
        genre: document.getElementById("e-genre").value.trim() || null,
        cover_url: document.getElementById("e-cover").value.trim() || null,
        description: document.getElementById("e-desc").value.trim() || null
      })
    });
    editOverlay.classList.add("hidden");
    toast("Album updated successfully.");
    await reload();
  } catch (err) {
    errEl.textContent = "Failed to update album: " + err.message;
    errEl.classList.remove("hidden");
    toast("Failed to update album.", "error");
  } finally {
    saveBtn.disabled = false;
  }
});

/* ---------- DELETE album (DELETE /albums?id=eq.X) ---------- */

async function deleteAlbum() {
  if (!confirm('Delete "' + album.title + '" and all of its reviews permanently?')) return;
  try {
    // Deleting the album also removes its reviews (on delete cascade).
    await apiRequest("/albums?id=eq." + album.id, {
      method: "DELETE",
      headers: API_WRITE_HEADERS
    });
    toast("Album deleted.");
    setTimeout(() => (location.href = "../index.html"), 800);
  } catch (err) {
    toast("Failed to delete album: " + err.message, "error");
  }
}

/* ---------- Reload & init ---------- */

async function reload() {
  album = await fetchAlbum();
  render();
}

async function init() {
  if (!albumId) {
    loadingEl.classList.add("hidden");
    notFoundEl.classList.remove("hidden");
    return;
  }
  try {
    album = await fetchAlbum();
    if (!album) {
      loadingEl.classList.add("hidden");
      notFoundEl.classList.remove("hidden");
      return;
    }
    loadingEl.classList.add("hidden");
    const saved = localStorage.getItem("audiotaste_username");
    if (saved) document.getElementById("r-username").value = saved;
    render();
  } catch (err) {
    loadingEl.classList.add("hidden");
    notFoundEl.classList.remove("hidden");
    notFoundEl.querySelector("p").textContent = "Could not load this album: " + err.message;
  }
}

document.addEventListener("DOMContentLoaded", init);
