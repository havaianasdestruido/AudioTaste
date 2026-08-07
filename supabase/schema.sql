-- ============================================================
-- AudioTaste — Supabase database setup
-- Run this ONCE in the Supabase SQL Editor:
--   Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- WARNING: this script drops and recreates the tables, so any
-- existing data will be erased.
-- ============================================================

-- ---------- Tables ----------

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

create index reviews_album_id_idx on public.reviews(album_id);

-- ---------- Row Level Security ----------
-- RLS is enabled. Because this app has no login system, we add
-- permissive policies so the anonymous (anon) key can read, insert,
-- update and delete. In a real application you would restrict writes
-- to authenticated users or the service role only, and you would
-- NEVER expose the service role key in the browser.

alter table public.albums  enable row level security;
alter table public.reviews enable row level security;

create policy "albums_select_anon"  on public.albums  for select using (true);
create policy "albums_insert_anon"  on public.albums  for insert with check (true);
create policy "albums_update_anon"  on public.albums  for update using (true);
create policy "albums_delete_anon"  on public.albums  for delete using (true);

create policy "reviews_select_anon" on public.reviews for select using (true);
create policy "reviews_insert_anon" on public.reviews for insert with check (true);
create policy "reviews_update_anon" on public.reviews for update using (true);
create policy "reviews_delete_anon" on public.reviews for delete using (true);

-- ---------- Seed data ----------

insert into public.albums (title, artist, release_year, genre, description) values
  ('To Pimp a Butterfly', 'Kendrick Lamar', 2015, 'Hip-Hop',
   'A genre-defining concept album blending jazz, funk and soul with sharp social commentary.'),
  ('Abbey Road', 'The Beatles', 1969, 'Rock',
   'The Beatles'' final studio album, famous for its side-two medley and the zebra-crossing cover.'),
  ('Thriller', 'Michael Jackson', 1982, 'Pop',
   'The best-selling album of all time, packed with iconic singles.'),
  ('Kind of Blue', 'Miles Davis', 1959, 'Jazz',
   'The definitive modal jazz record and a gateway into the genre.'),
  ('Rumours', 'Fleetwood Mac', 1977, 'Rock',
   'A soft-rock classic written amid band turmoil; nearly every track is a hit.'),
  ('OK Computer', 'Radiohead', 1997, 'Alternative',
   'A landmark album of paranoia and technology that reshaped alternative rock.'),
  ('Nevermind', 'Nirvana', 1991, 'Grunge',
   'Brought grunge to the mainstream and changed rock forever.'),
  ('Illmatic', 'Nas', 1994, 'Hip-Hop',
   'A flawless debut full of vivid street poetry and stellar production.');

insert into public.reviews (album_id, username, rating, review_text) values
  ((select id from public.albums where title = 'To Pimp a Butterfly'), 'BeatFreak', 10.0,
   'A masterpiece. The jazz influences and storytelling are unmatched.'),
  ((select id from public.albums where title = 'To Pimp a Butterfly'), 'SampleQueen', 9.0,
   'Incredible production and songwriting. It took a few listens to fully appreciate.'),
  ((select id from public.albums where title = 'Abbey Road'), 'VinylGhost', 9.5,
   'The medley on side two is pure genius.'),
  ((select id from public.albums where title = 'Thriller'), 'GrooveMaster', 8.0,
   'Every single is iconic, though a couple of tracks feel a bit dated now.'),
  ((select id from public.albums where title = 'Kind of Blue'), 'JazzCat', 10.0,
   'Timeless. So What is one of the most beautiful tracks ever recorded.'),
  ((select id from public.albums where title = 'Rumours'), 'DreamsAndDrama', 8.5,
   'Songs about heartbreak that somehow feel uplifting.'),
  ((select id from public.albums where title = 'OK Computer'), 'RadioheadFan', 9.0,
   'Paranoid Android alone is worth the price of the record.'),
  ((select id from public.albums where title = 'Nevermind'), 'GrungeKid', 7.5,
   'Great energy, though the production is a little too polished.'),
  ((select id from public.albums where title = 'Illmatic'), 'NYStateMind', 10.0,
   'Pure hip-hop. Every verse is quotable.');
