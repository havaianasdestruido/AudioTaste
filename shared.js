"use strict";

/* ============================================================
   AudioTaste — shared data cache (localStorage)
   Loaded before the page scripts. Server responses (albums,
   reviews, scrobble counts) are cached under "at.data.*" with a
   TTL so pages render instantly and only re-fetch stale data.
   Cover art lives under "at.cover.*" and is untouched here.
   ============================================================ */

const DataCache = {
  PREFIX: "at.data.",

  // Return the cached value if present and younger than ttlMs,
  // otherwise null. Pass ttlMs = null to ignore freshness.
  read(key, ttlMs) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      if (!raw) return null;
      const j = JSON.parse(raw);
      if (!j || !("value" in j)) return null;
      // Clamp the stored timestamp to now so a tampered future "at" can
      // never make the TTL expire in the distant future.
      const at = Math.min(Number.isFinite(j.at) ? j.at : 0, Date.now());
      if (ttlMs != null && Date.now() - at > ttlMs) return null;
      return j.value;
    } catch {
      return null;
    }
  },

  // Read regardless of age (for stale-while-revalidate).
  peek(key) {
    return this.read(key, null);
  },

  // Read the value together with its stored timestamp.
  peekRaw(key) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      if (!raw) return null;
      const j = JSON.parse(raw);
      if (!j || !("value" in j)) return null;
      return { at: Number.isFinite(j.at) ? j.at : 0, value: j.value };
    } catch {
      return null;
    }
  },

  write(key, value, at) {
    try {
      localStorage.setItem(
        this.PREFIX + key,
        JSON.stringify({ at: at !== undefined ? at : Date.now(), value })
      );
    } catch {
      /* storage full / private mode */
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch {
      /* ignore */
    }
  }
};
