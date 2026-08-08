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
  title        text not null,
  artist       text not null,
  release_year integer,
  genre        text,
  cover_url    text,              -- optional: https:// link to cover art
  description  text,
  plays        integer not null default 0,  -- scrobbles in the owner's history
  created_at   timestamptz not null default now()
);

create table public.reviews (
  id          bigint generated always as identity primary key,
  album_id    bigint not null references public.albums(id) on delete cascade,
  username    text not null,
  rating      numeric(3,1) not null check (rating >= 0 and rating <= 10),
  review_text text not null,
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
