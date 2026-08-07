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

INSERT INTO public.reviews (album_id, username, rating, review_text, created_at)
SELECT a.id, s.username, s.rating, s.review_text, s.created_at
FROM (VALUES
  ('Frizk — Singles & Sessions', 'Frizk', 'UltimateQuack', 10, 'Listened 382 times in my Last.fm history. Favorite tracks: Select Your Car!, I Wish It Were Colder, Tryondas Galaxy.', '01 Apr 2026 21:05'::timestamptz),
  ('fur:trash — Singles & Sessions', 'fur:trash', 'UltimateQuack', 6.2, 'Listened 172 times in my Last.fm history. Favorite tracks: anesthetic, funnycore twerkhouse, bitingmynails / bitingmylips.', '05 Apr 2026 18:42'::timestamptz),
  ('MAILPUP — Singles & Sessions', 'MAILPUP', 'UltimateQuack', 5.7, 'Listened 146 times in my Last.fm history. Favorite tracks: HEWWO KITTY! >:3c, LET ME MAIL YOUR PACKAGE, WASP RAVE.', '02 Apr 2026 17:56'::timestamptz),
  ('usedcvnt — Singles & Sessions', 'usedcvnt', 'UltimateQuack', 5.1, 'Listened 113 times in my Last.fm history. Favorite tracks: i need 2 feel reality, first love theory, disappearing until i feel better.', '01 Apr 2026 14:06'::timestamptz),
  ('SPARKLEWOLF RADIO — Singles & Sessions', 'SPARKLEWOLF RADIO', 'UltimateQuack', 4.8, 'Listened 100 times in my Last.fm history. Favorite tracks: the music that plays in my dumb little critter brain, retroslop!, YOU THINK YOU CAN WIN WITH THAT BOARD?!.', '02 Jun 2026 15:59'::timestamptz),
  ('ida deerz — Singles & Sessions', 'ida deerz', 'UltimateQuack', 4.6, 'Listened 88 times in my Last.fm history. Favorite tracks: 8080 West, over it now!, Changes.', '03 Jun 2026 18:25'::timestamptz),
  ('GNB CHILI — Singles & Sessions', 'GNB CHILI', 'UltimateQuack', 4.6, 'Listened 86 times in my Last.fm history. Favorite tracks: anything 2, Tropical Nights, Bleeding.', '01 Apr 2026 13:52'::timestamptz),
  ('r u s s e l b u c k — Singles & Sessions', 'r u s s e l b u c k', 'UltimateQuack', 4.5, 'Listened 83 times in my Last.fm history. Favorite tracks: b-b-BASS DOWN LOW, FLY WITH ME, HERE FOR A GOOD TIME NOT A LONG TIME.', '02 Apr 2026 21:03'::timestamptz),
  ('David Wojciechowski and Victor Fritzsche — Singles & Sessions', 'David Wojciechowski and Victor Fritzsche', 'UltimateQuack', 4.5, 'Listened 83 times in my Last.fm history. Favorite tracks: Soft Rain, Puzzle, Airplane.', '01 Jun 2026 21:38'::timestamptz),
  ('Vertigoaway — Singles & Sessions', 'Vertigoaway', 'UltimateQuack', 4.5, 'Listened 81 times in my Last.fm history. Favorite tracks: drowning timeline of the wavelength, truly another track where someone pisses herself, the happenstance occurs in an unseemingly manner power withheld above all else dont think to hard.', '03 Jun 2026 15:46'::timestamptz),
  ('goreshit — Singles & Sessions', 'goreshit', 'UltimateQuack', 4.2, 'Listened 67 times in my Last.fm history. Favorite tracks: death of the candy raver, banfield''s crazy fingers, crunch bunch car crash.', '07 May 2026 21:35'::timestamptz),
  ('MUITO BASTANTE AURA', 'allendo051', 'UltimateQuack', 4.1, 'Listened 60 times in my Last.fm history. Favorite tracks: AMOSTRADINHA, LÁ ELE, MAKITA.', '01 Aug 2026 00:02'::timestamptz),
  ('Bobbing — Singles & Sessions', 'Bobbing', 'UltimateQuack', 4.1, 'Listened 60 times in my Last.fm history. Favorite tracks: Threat Level Midnight, Near Death Bossa Nova, Hypemanda Mk I.', '04 Apr 2026 16:21'::timestamptz),
  ('PatoFlamejanteTV — Singles & Sessions', 'PatoFlamejanteTV', 'UltimateQuack', 4, 'Listened 52 times in my Last.fm history. Favorite tracks: Ammateur, Roommate, Sore Point.', '06 Jul 2026 15:36'::timestamptz),
  ('suburban daredevil', 'wifiskeleton', 'UltimateQuack', 3.9, 'Listened 49 times in my Last.fm history. Favorite tracks: whore, my twenty first reason </3, i keep calling ... (w/ jaydes).', '28 Jun 2026 12:18'::timestamptz),
  ('GLITTER IN THE BIG CITY!', 'SPARKLEWOLF RADIO', 'UltimateQuack', 3.8, 'Listened 46 times in my Last.fm history. Favorite tracks: PARTY LIEK ITS 2012!, WHY DO THEY FEAR WHAT THEY CAN''T SEE?, ABYSSAL HEART.', '01 Jul 2026 17:07'::timestamptz),
  ('eightiesheadachetape — Singles & Sessions', 'eightiesheadachetape', 'UltimateQuack', 3.8, 'Listened 46 times in my Last.fm history. Favorite tracks: what we did in the desert, the bowling alley, labyrinth.', '02 Apr 2026 16:14'::timestamptz),
  ('PASSENGERPRINCESS', 'passengerprincess', 'UltimateQuack', 3.8, 'Listened 44 times in my Last.fm history. Favorite tracks: CREDIT CARD, PREY, 4K CARPET.', '01 Jul 2026 17:12'::timestamptz),
  ('Toby Fox — Singles & Sessions', 'Toby Fox', 'UltimateQuack', 3.8, 'Listened 42 times in my Last.fm history. Favorite tracks: Cyber Battle, Quiet Autumn, Queen.', '01 Apr 2026 21:36'::timestamptz),
  ('hybrid monster machines of the lesser spotted bastard', 'goreshit', 'UltimateQuack', 3.6, 'Listened 32 times in my Last.fm history. Favorite tracks: death of the candy raver, the eternal march of the bastard squad, total fucking stabbage.', '15 Jul 2026 18:36'::timestamptz),
  ('Valve Studio Orchestra — Singles & Sessions', 'Valve Studio Orchestra', 'UltimateQuack', 3.6, 'Listened 32 times in my Last.fm history. Favorite tracks: The Art of War, Dapper Cadaver, It Hates Me So Much.', '13 Apr 2026 14:48'::timestamptz),
  ('bandcamp archiver guy — Singles & Sessions', 'bandcamp archiver guy', 'UltimateQuack', 3.5, 'Listened 30 times in my Last.fm history. Favorite tracks: AZRAEL-II - MiKU MUST DiE, MAILPUP - LET ME MAIL YOUR PACKAGE, MAILPUP - HARDER DADDY.', '02 Apr 2026 17:55'::timestamptz),
  ('internet brainrot', 'tdstr', 'UltimateQuack', 3.5, 'Listened 27 times in my Last.fm history. Favorite tracks: ode to brostep, everyydiie, the youtube poop movement.', '02 Aug 2026 14:54'::timestamptz),
  ('eel valley — Singles & Sessions', 'eel valley', 'UltimateQuack', 3.5, 'Listened 26 times in my Last.fm history. Favorite tracks: flowers, dead to me, the lake.', '23 May 2026 22:11'::timestamptz),
  ('Crystal Castles — Singles & Sessions', 'Crystal Castles', 'UltimateQuack', 3.4, 'Listened 24 times in my Last.fm history. Favorite tracks: Vanished, Transgender, Kerosene.', '07 Apr 2026 12:31'::timestamptz),
  ('Sutured Self', 'Deerxing', 'UltimateQuack', 3.3, 'Listened 17 times in my Last.fm history. Favorite tracks: Another Form, IV Drip, Forager.', '06 Jul 2026 16:35'::timestamptz),
  ('passengerprincess — Singles & Sessions', 'passengerprincess', 'UltimateQuack', 3.3, 'Listened 17 times in my Last.fm history. Favorite tracks: VENOMOUS, PREY, TUMMY.', '02 Jun 2026 21:34'::timestamptz),
  ('AURAMUNDO', 'allendo051', 'UltimateQuack', 3.3, 'Listened 16 times in my Last.fm history. Favorite tracks: MODO SICKO SEVEN, AURAAAAAAAAAAA, VBUCKS.', '25 May 2026 22:49'::timestamptz),
  ('Blue Hour Mind', 'Frizk', 'UltimateQuack', 3.3, 'Listened 16 times in my Last.fm history. Favorite tracks: I Wish It Were Colder, By The Trees, Select Your Car!.', '16 Jun 2026 20:42'::timestamptz),
  ('Hellripper — Singles & Sessions', 'Hellripper', 'UltimateQuack', 3.3, 'Listened 16 times in my Last.fm history. Favorite tracks: Coronach, Sculptor''s Cave, The Art of Resurrection.', '04 Apr 2026 21:21'::timestamptz),
  ('xaptiox — Singles & Sessions', 'xaptiox', 'UltimateQuack', 3.3, 'Listened 16 times in my Last.fm history. Favorite tracks: soup, ariaMATH - xaptiox.', '01 Apr 2026 14:19'::timestamptz),
  ('Aphex Twin — Singles & Sessions', 'Aphex Twin', 'UltimateQuack', 3.3, 'Listened 16 times in my Last.fm history. Favorite tracks: Petiatil Cx Htdui, CIRCLONT6A, fz pseudotimestretch+e+3 [138.85].', '01 Apr 2026 14:16'::timestamptz),
  ('sixwing — Singles & Sessions', 'sixwing', 'UltimateQuack', 3.3, 'Listened 15 times in my Last.fm history. Favorite tracks: choke it out!, tearing meat, it''s ok.', '08 Apr 2026 16:42'::timestamptz),
  ('6arelyhuman — Singles & Sessions', '6arelyhuman', 'UltimateQuack', 3.3, 'Listened 15 times in my Last.fm history. Favorite tracks: 6arelyhuman - Party Like The 80''s (w/ asteria & kets4eki) [Official Lyric Video], 6arelyhuman - Faster N Harder (Official Audio), 6arelyhuman - DDR (Dance Dance Revolution) [Official Music Video].', '26 Mar 2026 21:45'::timestamptz),
  ('Tabby — Singles & Sessions', 'Tabby', 'UltimateQuack', 3.3, 'Listened 14 times in my Last.fm history. Favorite tracks: YEAR OF THE NAUGHTY FOX, NEWGROUNDS HITMAN, VEGETARIAN.', '02 Jun 2026 22:31'::timestamptz),
  ('68+1 — Singles & Sessions', '68+1', 'UltimateQuack', 3.3, 'Listened 14 times in my Last.fm history. Favorite tracks: here I am, your eyes.', '01 Apr 2026 14:36'::timestamptz),
  ('verti & rains'' trek through the hexd landscape', 'Vertigoaway', 'UltimateQuack', 3.2, 'Listened 13 times in my Last.fm history. Favorite tracks: lake of shadows-dry spell, ritual rave, crashed.', '12 Jun 2026 21:36'::timestamptz),
  ('opal', 'LulaMoon', 'UltimateQuack', 3.2, 'Listened 12 times in my Last.fm history. Favorite tracks: crescent, gen3mlp (feat. robin''s ghost), ears perk up (feat. CREEPYSUSIE).', '04 Jul 2026 17:22'::timestamptz),
  ('I', 'Crystal Castles', 'UltimateQuack', 3.2, 'Listened 12 times in my Last.fm history. Favorite tracks: Tell Me What to Swallow, Black Panther, Reckless.', '18 Jun 2026 20:16'::timestamptz),
  ('FANSERVICE', 'MAILPUP', 'UltimateQuack', 3.2, 'Listened 11 times in my Last.fm history. Favorite tracks: DANCING WITH SOLVEIG, HARDER DADDY, FEED YOUR LOCAL MAILPUP.', '01 Jul 2026 21:44'::timestamptz),
  ('Something Evil Will Happen OST Vol. 1', 'sorakai', 'UltimateQuack', 3.2, 'Listened 11 times in my Last.fm history. Favorite tracks: Unbreakable, Watch Your Step, Blam-Oh!.', '27 May 2026 23:35'::timestamptz),
  ('lovefool', 'wifiskeleton', 'UltimateQuack', 3.2, 'Listened 10 times in my Last.fm history. Favorite tracks: back to my day job, lovefool demo, sleep through youre alarms your not well.', '30 Jul 2026 20:57'::timestamptz),
  ('pony', 'wifiskeleton', 'UltimateQuack', 3.2, 'Listened 10 times in my Last.fm history. Favorite tracks: pony, Bipolar, im a monster in your real life.', '28 Jun 2026 12:19'::timestamptz),
  ('MAILPUP', 'MAILPUP', 'UltimateQuack', 3.2, 'Listened 10 times in my Last.fm history. Favorite tracks: MY DOG RUNS ON SOYLENT, HEWWO! ÒwÓ, MYSPACE BANGER 3008.', '04 Jul 2026 01:31'::timestamptz),
  ('strxwberrymilk — Singles & Sessions', 'strxwberrymilk', 'UltimateQuack', 3.2, 'Listened 10 times in my Last.fm history. Favorite tracks: The Sky Is Purple, Pink Skirts Are Really Sweet, Parking Stress.', '15 May 2026 01:04'::timestamptz),
  ('No Agreements — Singles & Sessions', 'No Agreements', 'UltimateQuack', 3.2, 'Listened 10 times in my Last.fm history. Favorite tracks: GnB Chili - Save Me, GnB Chili - Save Me (Disavowed).', '01 Apr 2026 14:31'::timestamptz),
  ('Monarch of Monsters', 'Vylet Pony', 'UltimateQuack', 3.2, 'Listened 9 times in my Last.fm history. Favorite tracks: Pest, Sludge, Princess Cuckoo.', '04 Jul 2026 15:58'::timestamptz),
  ('gali.inveraph//THE WELL', 'Vertigoaway', 'UltimateQuack', 3.2, 'Listened 9 times in my Last.fm history. Favorite tracks: the well, the vile spawn-aborted, fullbright.', '12 Jun 2026 20:49'::timestamptz),
  ('hikikomori days', 'Shoebill', 'UltimateQuack', 3.1, 'Listened 8 times in my Last.fm history. Favorite tracks: zOmfg RAVE HARD, improvised mashcore, Dancecore Dirtbag.', '02 Aug 2026 15:44'::timestamptz),
  ('Love Letter To My World', 'strxwberrymilk', 'UltimateQuack', 3.1, 'Listened 8 times in my Last.fm history. Favorite tracks: Meteor feat. Meeno Wave, MP40 (Rawlin'' Mix), Music First feat. all due & onacide.', '25 Jun 2026 21:35'::timestamptz),
  ('goretrance 9', 'goreshit', 'UltimateQuack', 3.1, 'Listened 8 times in my Last.fm history. Favorite tracks: scotch cherries, goretrance 9 (get happy or get fucked ''97), hot as balls.', '19 Jun 2026 21:41'::timestamptz),
  ('The College Dropout', 'Kanye West', 'UltimateQuack', 3.1, 'Listened 8 times in my Last.fm history. Favorite tracks: Get Em High, Never Let Me Down, Jesus Walks.', '01 Jun 2026 00:03'::timestamptz),
  ('ソルス — Singles & Sessions', 'ソルス', 'UltimateQuack', 3.1, 'Listened 8 times in my Last.fm history. Favorite tracks: Yung Lain - Ciel.', '01 Apr 2026 14:28'::timestamptz),
  ('Missing Music — Singles & Sessions', 'Missing Music', 'UltimateQuack', 3.1, 'Listened 8 times in my Last.fm history. Favorite tracks: Emray - About 10 Hours of making Breakcore.', '01 Apr 2026 14:50'::timestamptz),
  ('Edwin Rosen — Singles & Sessions', 'Edwin Rosen', 'UltimateQuack', 3.1, 'Listened 8 times in my Last.fm history. Favorite tracks: Die Sterne, Edwin Rosen - Vertigo, Die Sonne in deinem Zimmer.', '01 Apr 2026 13:57'::timestamptz),
  ('tasanee — Singles & Sessions', 'tasanee', 'UltimateQuack', 3.1, 'Listened 8 times in my Last.fm history. Favorite tracks: crystal castles - suffocation.', '01 Apr 2026 13:47'::timestamptz),
  ('Snuffles — Singles & Sessions', 'Snuffles', 'UltimateQuack', 3.1, 'Listened 8 times in my Last.fm history. Favorite tracks: THIS THOUGHT - Frizk & snuffles.', '01 Apr 2026 13:44'::timestamptz),
  ('MARCELINHO CYBERJAMS', 'Marcelinho MeteBala', 'UltimateQuack', 3.1, 'Listened 7 times in my Last.fm history. Favorite tracks: Spellbound/Cheiro de Pika feat. MC Sapato, CyberBruxaria feat. BRVXO, Marcelo Mizer.', '06 Jul 2026 16:18'::timestamptz),
  ('Explorers Of The Internet — Singles & Sessions', 'Explorers Of The Internet', 'UltimateQuack', 3.1, 'Listened 7 times in my Last.fm history. Favorite tracks: Lois, Lil Jon has trouble with his math test, Drum? And Bass.', '05 Jun 2026 01:17'::timestamptz),
  ('hkmori — Singles & Sessions', 'hkmori', 'UltimateQuack', 3.1, 'Listened 7 times in my Last.fm history. Favorite tracks: 0xff.', '02 Apr 2026 17:20'::timestamptz),
  ('Akiba — Singles & Sessions', 'Akiba', 'UltimateQuack', 3.1, 'Listened 7 times in my Last.fm history. Favorite tracks: MOOGCiTY.', '02 Apr 2026 16:11'::timestamptz),
  ('S777N — Singles & Sessions', 'S777N', 'UltimateQuack', 3.1, 'Listened 7 times in my Last.fm history. Favorite tracks: s777n - remains of a corrupted file.', '01 Apr 2026 14:25'::timestamptz),
  ('FEM&M — Singles & Sessions', 'FEM&M', 'UltimateQuack', 3.1, 'Listened 7 times in my Last.fm history. Favorite tracks: Pinata Break, Love Zombie, Beep Beep Bag.', '06 Apr 2026 21:47'::timestamptz),
  ('stm — Singles & Sessions', 'stm', 'UltimateQuack', 3.1, 'Listened 7 times in my Last.fm history. Favorite tracks: runaway girl.', '01 Apr 2026 14:04'::timestamptz),
  ('Floral Shoppe', 'Macintosh Plus', 'UltimateQuack', 3.1, 'Listened 6 times in my Last.fm history. Favorite tracks: ECCOと悪寒ダイビング, HIDDEN PATHWAYイルミナティ, 地理.', '15 Jul 2026 18:53'::timestamptz),
  ('gnb', 'goreshit', 'UltimateQuack', 3.1, 'Listened 6 times in my Last.fm history. Favorite tracks: hold my hand, unnatural, lonely.', '19 Jun 2026 19:15'::timestamptz),
  ('Forgotten Arcade', 'Frizk', 'UltimateQuack', 3.1, 'Listened 6 times in my Last.fm history. Favorite tracks: Bright Stuff, Flashback, Real Fellas.', '16 Jun 2026 20:45'::timestamptz),
  ('II', 'Crystal Castles', 'UltimateQuack', 3.1, 'Listened 6 times in my Last.fm history. Favorite tracks: Empathy, Year of Silence, Baptism.', '18 Jun 2026 21:59'::timestamptz),
  ('fur:core VII (puppy radio 24/7)', 'fur:trash', 'UltimateQuack', 3.1, 'Listened 6 times in my Last.fm history. Favorite tracks: old money bitch, hound down, scene kweenz.', '10 Jun 2026 16:55'::timestamptz),
  ('621 gecs — Singles & Sessions', '621 gecs', 'UltimateQuack', 3.1, 'Listened 6 times in my Last.fm history. Favorite tracks: Femboifoxxx, femboifoxxx (ALIXI remix), femboifoxxx (loud equals funny vip).', '05 Jun 2026 01:10'::timestamptz),
  ('BGM for an Game that Doesn''t Exists', 'PatoFlamejanteTV', 'UltimateQuack', 3.1, 'Listened 6 times in my Last.fm history. Favorite tracks: Would You?, Roommate, Ammateur.', '06 Jun 2026 15:35'::timestamptz),
  ('theuppermostinlife — Singles & Sessions', 'theuppermostinlife', 'UltimateQuack', 3.1, 'Listened 6 times in my Last.fm history. Favorite tracks: Ftlframe - Subterranean Loner.', '02 Apr 2026 17:32'::timestamptz),
  ('IX Fall$ — Singles & Sessions', 'IX Fall$', 'UltimateQuack', 3.1, 'Listened 6 times in my Last.fm history. Favorite tracks: IX FALL$ - buried yet so frail.', '01 Apr 2026 14:33'::timestamptz),
  ('Kyra — Singles & Sessions', 'Kyra', 'UltimateQuack', 3.1, 'Listened 6 times in my Last.fm history. Favorite tracks: Romantic 2.', '01 Apr 2026 14:00'::timestamptz),
  ('prod.jk8 — Singles & Sessions', 'prod.jk8', 'UltimateQuack', 3.1, 'Listened 6 times in my Last.fm history. Favorite tracks: Japan.', '01 Apr 2026 13:55'::timestamptz),
  ('Return Of The Rave', 'Spongebob Squarewave', 'UltimateQuack', 3.1, 'Listened 5 times in my Last.fm history. Favorite tracks: Doomerz, I Want It THAT Way, Witney Riddim.', '12 Jul 2026 21:46'::timestamptz),
  ('Mashcore Punishment', 'DJKurara', 'UltimateQuack', 3.1, 'Listened 5 times in my Last.fm history. Favorite tracks: Wake Heart Breakcore, Reason Of Dance, Clarity The Big Boss.', '12 Jul 2026 16:41'::timestamptz),
  ('Idaidaida II', 'ida deerz', 'UltimateQuack', 3.1, 'Listened 5 times in my Last.fm history. Favorite tracks: 8080 West, make it make sense!, 5mg EEn (ft. phimtown & foxparkk).', '01 Jul 2026 16:58'::timestamptz),
  ('wifiskeleton — Singles & Sessions', 'wifiskeleton', 'UltimateQuack', 3.1, 'Listened 5 times in my Last.fm history. Favorite tracks: demo #6 (everybody hates fiona), 32gigs of tranny porn, local.', '28 Jun 2026 12:41'::timestamptz),
  ('THE RETURN OF SPARKLEWOLF RADIO', 'SPARKLEWOLF RADIO', 'UltimateQuack', 3.1, 'Listened 5 times in my Last.fm history. Favorite tracks: MARBLE HORNETS, retroslop!, SPANK YOUR LOCAL SPARKLEWOLF!.', '12 Jun 2026 20:29'::timestamptz),
  ('theSpackster — Singles & Sessions', 'theSpackster', 'UltimateQuack', 3.1, 'Listened 5 times in my Last.fm history. Favorite tracks: cookies n'' cream, RK9, camelCase.', '09 Jun 2026 21:44'::timestamptz),
  ('Not a Furry Album Cover', 'Betu', 'UltimateQuack', 3.1, 'Listened 5 times in my Last.fm history. Favorite tracks: Falling Apart, Cry On My Own, Rudy Knows.', '07 Jun 2026 00:29'::timestamptz),
  ('BGM for an Game that Doesn''t Exists', 'de PatoFlamejanteTV', 'UltimateQuack', 3.1, 'Listened 5 times in my Last.fm history. Favorite tracks: Would You?, Time, Roommate.', '12 Apr 2026 12:13'::timestamptz),
  ('LCONDATRACK — Singles & Sessions', 'LCONDATRACK', 'UltimateQuack', 3.1, 'Listened 5 times in my Last.fm history. Favorite tracks: LCONDATRACK - HERE WE GO AGAIN.', '01 Apr 2026 14:02'::timestamptz),
  ('Fishcracks — Singles & Sessions', 'Fishcracks', 'UltimateQuack', 3.1, 'Listened 5 times in my Last.fm history. Favorite tracks: Fishcracks - Slumber Party.', '06 Apr 2026 15:48'::timestamptz)
) AS s(title, artist, username, rating, review_text, created_at)
JOIN public.albums a ON a.artist = s.artist AND a.title = s.title;
