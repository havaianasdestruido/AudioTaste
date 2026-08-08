-- ============================================================
-- AudioTaste — lockdown migration (no data wipe)
-- Apply this to a LIVE database WITHOUT dropping the tables.
-- It revokes anonymous UPDATE/DELETE on albums and reviews and
-- adds CHECK constraints, so the public anon key can only read
-- and insert. Run once in the Supabase SQL Editor.
--
-- NOTE: after this, the app's Edit/Delete album and Edit/Delete
-- review features will return 403 (they used the anon key). Add
-- Album and Submit Review keep working. Restore full CRUD only
-- through an authenticated path or the service role key.
--
-- If instead you are setting up from scratch, the same rules are
-- baked into supabase/schema.sql.
-- ============================================================

-- 1. Drop permissive anon UPDATE/DELETE policies
drop policy if exists "albums_update_anon" on public.albums;
drop policy if exists "albums_delete_anon" on public.albums;
drop policy if exists "reviews_update_anon" on public.reviews;
drop policy if exists "reviews_delete_anon" on public.reviews;

-- 2. Enforce input constraints (see supabase/schema.sql for the
--    matching inline definitions)
alter table public.albums
  add constraint albums_title_length
    check (char_length(title) between 1 and 200);
alter table public.albums
  add constraint albums_artist_length
    check (char_length(artist) between 1 and 200);
alter table public.albums
  add constraint albums_year_range
    check (release_year is null or (release_year between 1900 and 2100));
alter table public.albums
  add constraint albums_genre_length
    check (genre is null or char_length(genre) <= 60);
alter table public.albums
  add constraint albums_cover_https
    check (cover_url is null or cover_url ~* '^https://');
alter table public.albums
  add constraint albums_plays_nonneg
    check (plays >= 0);
alter table public.reviews
  add constraint reviews_username_length
    check (char_length(username) between 1 and 80);
alter table public.reviews
  add constraint reviews_text_length
    check (char_length(review_text) between 1 and 2000);
