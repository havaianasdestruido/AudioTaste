-- ============================================================
-- AudioTaste — Supabase database setup
-- Run this ONCE in the Supabase SQL Editor:
--   Dashboard -> SQL Editor -> New query -> paste -> Run
-- Then run supabase/seed_scrobbles.sql to load the music.
--
-- WARNING: this script drops and recreates the tables, so any
-- existing data will be erased.
-- ============================================================

-- ---------- Tables ----------

drop table if exists public.scrobbles;
drop table if exists public.reviews;
drop table if exists public.albums;

create table public.albums (
  id           bigint generated always as identity primary key,
  title        text not null check (char_length(title) between 1 and 200),
  artist       text not null check (char_length(artist) between 1 and 200),
  release_year integer check (release_year is null or (release_year between 1900 and 2100)),
  genre        text check (genre is null or char_length(genre) <= 60),
  cover_url    text check (cover_url is null or cover_url ~* '^https://'),  -- optional: https link to cover art
  description  text,
  plays        integer not null default 0 check (plays >= 0),  -- scrobbles in the owner's history
  created_at   timestamptz not null default now()
);

create table public.reviews (
  id          bigint generated always as identity primary key,
  album_id    bigint not null references public.albums(id) on delete cascade,
  username    text not null check (char_length(username) between 1 and 80),
  rating      numeric(3,1) not null check (rating >= 0 and rating <= 10),
  review_text text not null check (char_length(review_text) between 1 and 2000),
  created_at  timestamptz not null default now()
);

-- Raw scrobbles, used by the "most popular in a date range" trends
-- feature. album_id links each scrobble to its album.
create table public.scrobbles (
  id           bigint generated always as identity primary key,
  album_id     bigint not null references public.albums(id) on delete cascade,
  artist       text not null,
  title        text not null,     -- album title
  track        text not null,
  scrobbled_at timestamp not null -- local time, no timezone (keeps date filters simple)
);

create index reviews_album_id_idx  on public.reviews (album_id);
create index scrobbles_album_id_idx on public.scrobbles (album_id);
create index scrobbles_at_idx      on public.scrobbles (scrobbled_at);

-- ---------- Row Level Security ----------
-- RLS is enabled. Because this app has no login system, the anonymous
-- (anon) key can SELECT and INSERT (Add Album / Submit Review). UPDATE and
-- DELETE are REVOKED: a public anon key must never be able to edit or wipe
-- existing rows. Scrobbles are read-only. Edit/Delete UI actions need an
-- authenticated path or a backend that uses the service role key, which
-- must NEVER be exposed in the browser.

alter table public.albums    enable row level security;
alter table public.reviews   enable row level security;
alter table public.scrobbles enable row level security;

create policy "albums_select_anon"   on public.albums    for select using (true);
create policy "albums_insert_anon"   on public.albums    for insert with check (true);

create policy "reviews_select_anon"  on public.reviews   for select using (true);
create policy "reviews_insert_anon"  on public.reviews   for insert with check (true);

create policy "scrobbles_select_anon" on public.scrobbles for select using (true);
