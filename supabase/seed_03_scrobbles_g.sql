-- ============================================================
-- AudioTaste — scrobble-based seed data (GENERATED FILE)
-- Do not edit by hand. Regenerate with:
--   node scripts/parse_scrobbles.mjs
--   node scripts/build_seed.mjs
--
-- Run order (one file per SQL Editor query, after schema.sql):
--   1. seed_01_albums.sql
--   2. seed_02_reviews.sql
--   3. seed_03_scrobbles_*.sql (in filename order)
--
-- Assumes the albums/reviews/scrobbles tables are EMPTY.
-- Owner username: UltimateQuack
-- ============================================================

INSERT INTO public.scrobbles (album_id, artist, title, track, scrobbled_at)
SELECT a.id, s.artist, s.title, s.track, s.scrobbled_at
FROM (VALUES
  ('prod.jk8 — Singles & Sessions', 'prod.jk8', 'Japan', '27 Mar 2026 11:48'::timestamp),
  ('Fishcracks — Singles & Sessions', 'Fishcracks', 'Fishcracks - Slumber Party', '27 Mar 2026 00:30'::timestamp),
  ('stm — Singles & Sessions', 'stm', 'runaway girl', '27 Mar 2026 00:28'::timestamp),
  ('GNB CHILI — Singles & Sessions', 'GNB CHILI', 'Tropical Nights', '27 Mar 2026 00:25'::timestamp),
  ('Edwin Rosen — Singles & Sessions', 'Edwin Rosen', 'Die Sterne', '27 Mar 2026 00:18'::timestamp),
  ('LCONDATRACK — Singles & Sessions', 'LCONDATRACK', 'LCONDATRACK - HERE WE GO AGAIN', '27 Mar 2026 00:14'::timestamp),
  ('tasanee — Singles & Sessions', 'tasanee', 'crystal castles - suffocation', '27 Mar 2026 00:10'::timestamp),
  ('Snuffles — Singles & Sessions', 'Snuffles', 'THIS THOUGHT - Frizk & snuffles', '27 Mar 2026 00:07'::timestamp),
  ('Kyra — Singles & Sessions', 'Kyra', 'Romantic 2', '27 Mar 2026 00:05'::timestamp),
  ('No Agreements — Singles & Sessions', 'No Agreements', 'GnB Chili - Save Me (Disavowed)', '27 Mar 2026 00:00'::timestamp),
  ('usedcvnt — Singles & Sessions', 'usedcvnt', 'i need 2 feel reality', '26 Mar 2026 22:45'::timestamp),
  ('Frizk — Singles & Sessions', 'Frizk', 'Bitrate', '26 Mar 2026 22:22'::timestamp),
  ('6arelyhuman — Singles & Sessions', '6arelyhuman', '6arelyhuman - Party Like The 80''s (w/ asteria & kets4eki) [Official Lyric Video]', '26 Mar 2026 22:06'::timestamp),
  ('6arelyhuman — Singles & Sessions', '6arelyhuman', '6arelyhuman - Faster N Harder (Official Audio)', '26 Mar 2026 22:04'::timestamp),
  ('6arelyhuman — Singles & Sessions', '6arelyhuman', '6arelyhuman - DDR (Dance Dance Revolution) [Official Music Video]', '26 Mar 2026 22:03'::timestamp),
  ('6arelyhuman — Singles & Sessions', '6arelyhuman', '6arelyhuman - CR4CK HOUSE (Official Audio)', '26 Mar 2026 22:01'::timestamp),
  ('6arelyhuman — Singles & Sessions', '6arelyhuman', '6arelyhuman asteria - BLOODBATH (Official Music Video)', '26 Mar 2026 21:59'::timestamp),
  ('6arelyhuman — Singles & Sessions', '6arelyhuman', '6arelyhuman - Party Like The 80''s (w/ asteria & kets4eki) [Official Lyric Video]', '26 Mar 2026 21:56'::timestamp),
  ('6arelyhuman — Singles & Sessions', '6arelyhuman', '6arelyhuman - Faster N Harder (Official Audio)', '26 Mar 2026 21:54'::timestamp),
  ('6arelyhuman — Singles & Sessions', '6arelyhuman', '6arelyhuman - DDR (Dance Dance Revolution) [Official Music Video]', '26 Mar 2026 21:53'::timestamp),
  ('6arelyhuman — Singles & Sessions', '6arelyhuman', '6arelyhuman - CR4CK HOUSE (Official Audio)', '26 Mar 2026 21:51'::timestamp),
  ('6arelyhuman — Singles & Sessions', '6arelyhuman', '6arelyhuman asteria - BLOODBATH (Official Music Video)', '26 Mar 2026 21:48'::timestamp),
  ('6arelyhuman — Singles & Sessions', '6arelyhuman', '6arelyhuman - Party Like The 80''s (w/ asteria & kets4eki) [Official Lyric Video]', '26 Mar 2026 21:46'::timestamp),
  ('6arelyhuman — Singles & Sessions', '6arelyhuman', '6arelyhuman - Faster N Harder (Official Audio)', '26 Mar 2026 21:45'::timestamp)
) AS s(title, artist, track, scrobbled_at)
JOIN public.albums a ON a.artist = s.artist AND a.title = s.title;
