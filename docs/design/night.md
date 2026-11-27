# The night

## Now

**Flow of a night.** Title → 20:00 in the city (`startNight`) → dungeon floors, trips back to the city
any time between battles → the night ends → results screen → morning screen → next night.

**The week** (#56; `T.NIGHT_SCHEDULE`, `systems/week.ts`; spec `claude/loot-night-week-one.md`, approved for now
2026-11-24, numbers to tune after the playtests). Nights are weekdays. `S.g.day` is the night you are on (0 = the first
Monday, saved): any ending but the plug moves on to the next; **unplugged, you play the same night again** ("Tuesday,
again"), RPG progress kept; `nightsPlayed` counts every night played. Each night brings its things and everything from
earlier nights stays on. What is not in yet does not happen and is not shown: no hint before its night (`on('dog')`).

| Night | Comes in | Visits | She goes to bed | The night ends |
|---|---|---|---|---|
| Monday | Her routine; the party of four (Hixx from night 1, [dungeon.md](dungeon.md)); peeks and snack runs (a plate: no cans to find yet); Q4; picking up the phone: the Shop (Silent keys, Flowers), her chat | x1 | stays up | 01:00, as a Sleep (no Tiredness yet) |
| Tuesday | Chat visits; the headset (Zone); her leaning into your face after a pass; Tiredness, and the night runs past 01:00; the Ergo chair; **lean in**, her yoga (the night opens with it) and the hall mirror in the Shop ([her.md](her.md)) | x1.2 | stays up | dawn |
| Wednesday | The phone rings: the courier, Mom, the boss; Messages: Text her and Raid night? | x1.2 | stays up | dawn |
| Thursday | The dog (first at 90 s, then every 120 to 180 s); cuddle visits; the boys' call (once); the Goblin Fuel (the Drink button, 3 cans topped up each night, snack runs look for them; the Fuel, the fridge and the chew in the Shop); the smart home: the battery, Charge, the Home app and its devices ([desk.md](desk.md)) | x1.2 | stays up | dawn |
| Friday | She goes to bed: her sheet mask before it, the waking meter, her texts (one in three with a selfie), the good-night walk-by; the Witching Hour after 01:00; "come to bed" after 01:00 with Coming, babe ([her.md](her.md)) | x1.2 | 00:00 | dawn |
| Saturday | The weekend: she's off and wants you: 1 to 2 tease visits (look at her); her shower is a bath, and not a break (the phone and the dog go on); "Babe, towel!" and "Babe, bring my wine?"; at Goodwill 70 a chat visit is her on your lap ([her.md](her.md)) | x1.4 | 01:00 | dawn |
| Sunday | The weekend, more: 2 to 3 tease visits | x1.6 | 01:00 | dawn |

- **Visits x** scales her odds at each activity's end, the shortest and longest gap between visits
  (`DOOR_MIN_GAP_SEC`, `DOOR_MAX_GAP_SEC` divided by it) and how fast she gets through her things (not the shower).
- **Monday's 01:00** ends the night as a Sleep (the run banked, no sleep debt), mid-battle too; the feed warns
  `BEDTIME_WARN_MIN` (15) before. Sleep still opens at 23:00.
- **After Sunday** (week two is TBD, Paweł): the week starts again with everything on and nothing new tonight; each
  weekday keeps its own visits, dog and boys; she goes to bed every night (`WEEK_TWO_BED` 00:00 on weeknights, 01:00 on
  the weekend); Monday runs to dawn.
- **The night's name** is everywhere: the feed's 20:00 line, How to hide, the phone's date and her chat's separators,
  the results ("TUESDAY · RESULTS"), the morning ("Tue 07:40", "Start Tuesday night"; after the plug UNPLUGGED, what
  it cost and "Tuesday, again"), the title ("Continue · Tuesday", read from the save).
- **The boys at 20:00** (grid doc 7m; `data/voice.ts`): every night of week one the phone rises into your hand while
  the night waits, at The Boys' chat. The boys are **Billy, Mike and Lance** (#102, #109; their characters are Hudzor,
  Hixx and Arkbishop, the cast of 2026-11-27): **Billy** is loud and panicky (he calls, he opens the chats), **Mike** the
  calm organizer (he posts the raid time), **Lance** dry and deadpan, a few words a line. They call **Age of Judgment**
  (the RPG's name in the fiction, #102) "aoj". Their lines riff on 80s and 90s action films and old MMOs and arena
  shooters (an inside joke for Paweł's friends) and read as plain gamer talk without them: no film, character or game is
  named, and a quote is kept exact only up to five words. **The first Monday** is their chat, live (`FIRST_CHAT`), paced
  to **the launch** (#127, below): five bubbles, one at a time, each after the name and three hopping dots, arriving at
  2.6, 10.2, 21.4, 26.4 and 35.4 s (`CHAT_LAUNCH_AT`, 1.6 s of dots each, `CHAT_LAUNCH_TYPING`; a soft tick as each
  lands): Billy's realm is up, patch notes he didn't read, 11 sharp, "careful with her tonight"; Lance's "would you
  like to know more?"; Mike's tip (Tab before the door opens). Until 38 s the pill reads "Age of Judgment is loading"
  with the percentage, dim and not a button, and Let's go, Esc, Enter, the home bar and the close box do nothing.
  **The boys always text, never send voice notes**
  (#108): **from Tuesday** it is the same live chat, three bubbles (one from each, `NIGHT_CHAT`) naming tonight's new
  things in their chat voice; after the plug the boys react the same way (Billy "game over man. GAME OVER.", "tuesday again
  then.", Lance "all that loot, gone like tears in rain", Mike's Tab tip; `replayChat`), under "Tuesday, again". These
  nights' chats are paced to the launch from the login (below): their bubbles spread evenly from 25.4 to 35.4 s
  (`CHAT_LOGIN_FROM`, `CHAT_LOGIN_TO`; three bubbles at 25.4, 30.4 and 35.4, the replay's four at 25.4, 28.7, 32.1 and
  35.4), each after its 1.6 s of dots, and the pill is "Age of Judgment is loading" until 38 s. The button (or the home
  bar, the close box, a click outside the phone, Esc, Enter) puts the phone down; How to hide follows on a night with a
  new tile, then tonight's stars; then the night starts. The message stays in The Boys' chat until the next call. Week
  two has no chat (nothing new): the phone comes up with only the loading pill and Let's go while the login plays.
- **The launch** (#127, the v2 redesign; [aoj-world.md](aoj-world.md) §6 to §7b; `systems/launch.ts`,
  the screens `render/page/aoj.js` and `logos.js`, the sound `ui/launchSound.ts`): before the first night the PC
  launches Age of Judgment on the monitor for 38 s (`LAUNCH_SEC`) while the boys' first chat comes in. Not interactive:
  it sets the mood. One clock for the monitor, the chat and the sound: T starts when the chat comes up and stops while
  paused; the night's clock waits all through it. The beats: Windows 98 and the Age of Judgment icon (the broken halo)
  double-clicked (0 to 3.2 s); the engine's start-up lines (to 6.2); **Halsky Labs**, the publisher, its mark Paweł's
  logo as a two-tone pixel mark (`HALSKY_MARK`, `tools/halsky_mark.py` from `design/v2/assets/`; to 10.6);
  **Procrastination Studios**, the developer (to 15; both logos redrawn for #133: each holds once it is in and the
  next screen fades in over it, dithered, `LAUNCH_XFADE` in `aoj.js`); the title, rain and lightning over the fallen
  angel, the halo forged, JUDGMENT struck (to 23); the login, "dutch" and nine stars typed, Log in (to 31); logging in
  and the world loading (to 38). Then the town fades in from black (dithered, 0.9 s, `LAUNCH_FADE_SEC`) and the feed
  gets "Welcome to Age of Judgment. Have fun, don't get caught." (empty before). **The whole launch on the first Monday
  only; every night after it starts from the login** (Paweł; replays, "Monday, again" included, and week two too;
  `voiceNote`'s `launch`: `full` or `login`): T starts at 23 (`LAUNCH_LOGIN_AT`), the login fades in from black
  (dithered, 0.6 s, `LAUNCH_LOGIN_FADE_SEC`), and the last 15 s play to 38 with their sound (only the cues from 23 on;
  the theme from its offset there and the rain, both faded in over 1.5 s, `LAUNCH_LOGIN_SOUND_FADE_SEC`). F1's "Skip
  the launch" goes straight to its end and stops its sound; the bot sims and `test/` skip it. Its sound and music: [screen.md](screen.md), Audio.
- **The boys' chat between the calls** (#109; `data/boys.ts`, `systems/boys.ts`): moments of the night post a line (or
  a short exchange) in The Boys' chat, grey, quiet (no banner, no sound, no effect on play), kept until the next call
  or 20:00 chat: the raid invite on the night's first trip down (or one of its exchanges; "it's 20:15" only near
  20:15), a wipe (a trash wipe adds the starter slime), a crit that kills from full HP, a mage crit on the boss's
  killing blow, a crit kill or a combo ("impressive."), Backstab, a boss fight starting and a boss down, a call you
  didn't take, an Appraiser reveal that is nobody's upgrade, an upgrade or a legendary landing in the bag, a cheap
  Auction listing, a tree node bought, a clean tab-out, her on her way, the party low, a clean banked run, a damage buff
  (the Raid buff, the Shrine), the sugar crash, your first yawn, Raid night? open, Raid night? after 23:00; and, with
  no moment of their own, the odd line in the dungeon. Spaced: `BOYS_GAP_SEC` (40 s) between posts, `BOYS_SAME_GAP_SEC`
  (240 s) for the same moment, a few once a night; the thread keeps `BOYS_THREAD_MAX` (30). Rejected: a banner or a
  feed line for them (the phone and the feed carry what wants you; these are flavour you find when you look).
- **The first chance** (`first` in the schedule, week one): her first visit tonight is the night's new type, within
  `VISIT_FIRST_DELAY_SEC` (35 s), never a fake-out, and safe. Tuesday a chat visit: caught on it, she lets it go ("Raid
  night? Fine. Just this once.": no catch, no Mood, no Goodwill spent). Thursday a snack run: cans in sight, she points
  at them and takes none, and the plate is still yours. The coach marks are the build's (the footsteps, her at the
  door, the phone, the headset); lean in's three come with lean in.
- **F1** has a button per night (it restarts the night at 20:00 with that night's rules).

**Measured** (`DAY=n npx tsx test/sim.ts good`, 16 seeds a night; demands = the visits she came in on, phone events and
the dog before 01:00, as the week doc's model counts them):

| | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Demands before 01:00 | 3.8 | 3.6 | 6.8 | 10.2 | 9.9 | 10.1 | 11.3 |
| Seconds apart (the model) | 101 (97) | 115 (81) | 50 (48) | 40 (34) | 37 (38) | 32 (27) | 33 (24) |
| Good bot, one night: stars, caught | 3, 0 | 3, 0 | 3, 0 | 3, 0 | 3, 0 | 3, 0 | 3, 0 |
| Good bot, the week in a row (`campaign.py 8 7`, 0.86): stars | 3.00 | 2.88 | 3.00 | 2.88 | 2.62 | 2.50 | 2.62 |
| Idle bot (0.85): caught, unplugged of 8 | 1.9, 0 | 3.9, 8 | 3.8, 8 | 0.8, 0 | 1.3, 1 | 1.9, 4 | 1.1, 7 |

Measured 0.85 (requests from the bathroom count as demands; Tuesday and Wednesday 16 more nights at 0.85). Tuesday is
the model's outlier on purpose: the night opens with her yoga, lean in's first chance, and no visit comes while it
lasts, so her first visit is about a minute later. Wednesday to Friday sit within about 20% of the model; the weekend
is the hardest stretch, 32 and 31 s apart against the model's 27 and 24: the tease
(0.81, 1.3 and 1.7 looked-at teases a night) and the bath that is no break (0.82). Up to 0.81 the sim's `HOME=1`
switch was always on (the shell's own `$HOME`), so Thursday on ran with every device bought; the table is without them.
The good bot always answers her sweetly, and each sweet pass can buy 60 s of calm (her lean), which takes the edge off
the weekend.
Tests: `npx tsx test/week.ts`, `python3 test/week.py` (screens `test/shots/week_*.png`).

**Two clocks.**

| Clock | Runs | Stops | Drives |
|---|---|---|---|
| Night clock | In the dungeon: 1 in-game hour per `SEC_PER_GAME_HOUR` (96 s), so bedtime comes after about 8 min and dawn after about 16. At `MENU_CLOCK_SPEED` (25%) while the floor map is open (the party waits at the stairs). | In the city; city actions cost fixed minutes instead (`COST_*_MIN`). | Bedtime, dawn, sleep debt, Tiredness. |
| Threat time | Always while a night runs, on every screen. | Only the pause menu. | Her, interrupts, the dog, Mood drift, buff timers. |

An item window or the full-bag popup slows nothing (#49): gearing is part of the juggle, done with the fight in
view, and her threats keep full speed either way.

**How a night ends.**

| Ending | Trigger | A run still going | Bag | Sleep debt |
|---|---|---|---|---|
| Sleep | Power button "Sleep" on the taskbar; allowed from `EARLIEST_SLEEP` (23:00), not mid-battle | Banked, floor loot included | Kept | +1 per 15 min past bedtime (01:00), −1 per 15 min before it |
| Dawn | Night clock reaches 06:00 | Lost like a wipe (Souls kept) | Kept | Set to the maximum (`SLEEP_DEBT_MAX`, 20) |
| Unplugged | Mood reaches 100 | Lost like a wipe (Souls kept) | Then the cheaper half of the rest is lost | Same rule as Sleep |

Pending drops go into the bag before the ending is applied. While a run is going, the feed warns 15 game minutes
before dawn and when Mood reaches red ([dungeon.md](dungeon.md), runs).

**Stars: three goals, a star each, no ladder** (#54, 3.1; `endNight`). Unplugged gets none.
- **Deep:** any run tonight reached tonight's floor, `max(STAR_DEEP_MIN, record + STAR_DEEP_OFFSET)` (3 and 0),
  fixed when the night starts (`n.deepTarget`). The greed star: it asks you to push the dungeon.
- **Unseen:** never caught tonight. A forgiven catch (Goodwill) or an excuse she bought doesn't count.
- **Sweet:** her Mood ends below `MOOD_RED`.

The RPG keeps its own record: the deepest floor ever reached, which raises the next night's Deep target.

**Results screen.** The three stars by name (Deep with tonight's floor), lit or not; depth vs. record, sleep
debt before and after, and near misses: "Deep: N floors short of tonight's target", Sweet's Mood short,
Unseen's catches, and the cheapest city building with the gold and Souls still missing.

**Morning screen** (grid doc 7h). A PC-98 dating-sim CG of her asleep over the whole frame, in her panel's 16 colours,
picked by how the night ended (`morningScene`): green, asleep face down under the thick duvet, her feet out at the
foot end; yellow, turned away with one foot out and her phone lit on your pillow; red, asleep on the couch wrapped
in the duvet, the TV the only light; unplugged, the empty bed, her clip on her pillow and a note on yours. The caption
in a night-plum window at the bottom; the summary in her beige paper window on the right: what the auction house sold,
Wallet, Gold, Sleep debt and Best stars, LAST NIGHT's three stars with the reward each earned or "missed", what Q4
paid ("Q4 last night: +$N", [desk.md](desk.md)), the
sleep-debt line, and her pink button for the next night (Enter and Esc too). The CGs are baked placeholders until
Paweł's stills. Auction listings pay out here in dollars. **One reward per star** (`toMorning`): loot only comes from the game, so only
the RPG star pays in loot.
- **Deep: a chest:** one item from the normal drop table at tonight's deepest floor, into the bag; a full bag keeps
  it as the next night's first drop (the bag-full window takes it from there).
- **Unseen: Trust:** the next night starts with Goodwill +`STAR_UNSEEN_GOODWILL` (20), on top of what carries over
  (closer to the Raid pass at 40 and Forgiveness at 60).
- **Sweet: Breakfast:** she makes breakfast, sleep debt -`STAR_SWEET_DEBT` (1), so the next night starts less tired.
  The morning shows its picture under the summary (#94): her at the stove in your shirt, a photo with "Breakfast" under
  it (a code stand-in until Paweł's still).
`S.g.carry` holds Trust and a waiting chest for the next night (saved).

**Tiredness.** The live form of sleep debt, a 0 to 100 meter on the YOU card (desk, bottom right).
- Start: `TIRED_BASE` + `TIRED_PER_DEBT` × sleep debt (10 + 3 per point).
- After 22:00 it rises `TIRED_PER_GAME_MIN` per in-game minute, only while the dungeon clock runs.
  A rested player reaches microsleeps around 00:30; one who stayed up to dawn starts the next night near 70.

| Tiredness | Effect (debuff icon I / II / III) |
|---|---|
| 30+ | Yawns blur the desk for 2 s, every `YAWN_EVERY_SEC` |
| 50+ | Microsleeps every 30 to 50 s: eyelids drift shut over 1.6 s, an almond closing from top and bottom, warm where the light comes through them, the view greying toward them. Any click or key snaps them open (that input does nothing else). Fully shut = dark with one faint seam, "zzz..." and "click or press any key", until you react; you can miss her shadow. |
| 70+ | Sluggish: phone timers 15% shorter, Flow builds 25% slower |
| 90+ | Wrecked (threshold exists; extra effect not built) |

Goblin Fuel lowers Tiredness and blocks microsleeps while the boost lasts (see [desk.md](desk.md)).

**Onboarding (the first night, #28).** No tutorial level and no walls of text; the first night teaches by
happening.
- **Title:** two lines (raid night, your girlfriend thinks you are doing spreadsheets; the RPG plays itself,
  your job is to listen, hide and keep everyone happy) and "turn the sound on".
- **The cards before the night** (the renderer's glass card over the dimmed frame, grid doc 7k; `howtoGame` in
  `main.ts`; #124). **The first Monday shows four, one area each**, and the night waits until the last one's "Got it"
  (Enter: the next card, "Next" on the others; Esc skips them all; "1 of 4" in the corner). The pause menu's **How to
  play** opens all four on any night. A later night with a new tile shows How to hide and Tonight. Each card has a
  kicker, a title (Jersey 10, [screen.md](screen.md)), its tiles (a small picture, a number, a name, one to three
  sentences) and a foot, **and every line on a card is about that card's area only** (Paweł, #124: the old How to hide
  mixed a snack run that said nothing about what to do, a door peek tacked onto listening, and the party's controls in
  her foot).
  1. **Your party** · "The party fights by itself.": Runs (down through the Dungeon Portal, the party fights on its
     own, pick the next floor on the map), Skills (each hero's under the fight, the lit ones' keys 1, Z, Q or A; grey
     is locked or has nothing to hit, #123), Loot (drops where enemies fall, the front hero picks them up, the green
     arrow and right-click, class gear), Bank it (the town portal banks the run; a wipe loses its loot and gold).
     Foot: the city (Merchant for gold, Salvage Forge for Souls, buildings and skills; each trip 15 minutes).
  2. **How to hide** · "Hide the game before she sees it.": Listen (where she is by sound, the last-heard line,
     footsteps mean she is coming), Tab to Excel (now, never wait for the handle; seen = caught), Peek (until lean in
     replaces it on Tuesday: hold the door, the wider the more she sees you), What she wants (each visit's hallway cue
     and its answer: Monday a peek and a snack run, which only looks at the desk, so you take the plate; Tuesday the
     chat; Thursday the cans and the cuddle), then the Headset and Lean in from Tuesday. Foot: her patience (the
     hearts): it wears thin, a visit you get through wins some back, a catch costs a lot and weakens the party, and
     at none she pulls the plug and the night starts over. Tonight's new tiles are framed gold with "new tonight":
     the headset, lean in and What she wants (the chat) on Tuesday, What she wants on Thursday.
  3. **Your job** · "Excel is your cover. It pays, too.": Your cover (Tab or the taskbar; the party fights on without
     your skills), Work (Sum or Space, the Fill cell's corner, Sort x2, Hustle up to x3 right after you tab in), Spend
     (macros, and the Shop on your phone). Foot: busy while she peeks, she leaves sooner; idle, she lingers and asks.
     This is where Excel's pay is taught since Lance's line left the first chat (0.91.2).
  4. **Tonight** · "Three stars make a good night.": Floor N (reach it in any run tonight: a chest with an item in
     the morning), Don't get caught (tomorrow starts with `STAR_UNSEEN_GOODWILL` more Goodwill), Keep her happy (log
     off before the tag by her name says furious: she makes you breakfast). Foot: stars count when you log off with
     Sleep on the taskbar from 23:00; on Monday the night also ends by itself at 01:00, the run banked; a pulled plug
     gives none.
- **Coach marks for the core loop** (`COACH` in `src/data/tips.ts`, `src/systems/coach.ts`, #42): the first
  footsteps, her first time in the doorway, the first phone, the first loot and the first boss wind-up get a
  callout next to the thing itself, and the game crawls at `COACH_SLOW` (a quarter speed). The renderer draws them
  one way everywhere (grid doc 7k): a marching gold ring round the target and a copper one 1 px out, a glass callout
  with a gold top row, a gold wedge toward the target, "The game crawls until you do it." and a close box; the
  pointer goes through to the target, except on the callout. The crawl lasts until the player does it: Tab, answering her, opening the phone, equipping, a skill. It also clears when the
  moment passes, after `COACH_MAX_SEC` real seconds, or with ✕. Once per save. A more important one bumps a
  less important one (footsteps > doorway > phone > wind-up > loot), and the bumped one comes back next time.
  Hidden while her caught screen is up.
- **First-time tips** (`TIPS` in `src/data/tips.ts`, `src/systems/tips.ts`): everything else gets one line from
  her or the guild chat (Hudzor and Arkbishop, your party; the feed's tag is the name alone) in the feed, pinned at its top for `TIP_PIN_SEC`. Once per
  save; a new game starts them over. Timed: her "I'm watching my show" (`TIP_HER_AT`) and the plan on the wall
  (`TIP_PLAN_AT`). On events: a pass, a catch, an end cue, the dog, a yawn, the headset, her bedtime, a peek,
  the first floor choice, the shower.
- **Labelled cues on the first night:** the her-note names the hallway cue of each visit type (`VISIT_CUE`; a snack
  run's says to take the plate: there are no cans on Monday, #124) and,
  new, the cue that ends each activity (`END_HINT`: "The kettle clicked off. Tea, then maybe a snack run.").
  Later nights rely on the sound.
- Tests: `npx tsx test/tips.ts`, `python3 test/onboarding.py` (screens: `test/onb_*.png`), `python3 test/coach.py`
  (each coach mark, the crawl, clearing, the bump; screens: `test/coach_*.png`).

## Decisions

- **The studio logos hold, and the next screen fades in over them** (0.100.0, #133; Paweł, 2026-11-27): a logo that
  animates out spends its last second taking itself apart; one that holds lets you read it, and the dithered fade
  carries you to the next. Halsky Labs was redrawn with an 80s Japanese studio-gear flair (a wide heavy face in banded
  chrome, a red rule and a LABS badge like a rack unit's, a power-on line, a raster scan, a fly-in that locks with an
  orchestra stab), Procrastination Studios made professional and sleek (a thin ring and hourglass, a spaced
  SemiBold wordmark, a copper rule): its joke stays in the name, the tagline and one late letter, not in a wobbly
  badge. Rejected: keeping Sora and Fredoka (too soft for either), a real brand's lettering or stripes (original only).

- **The launch has its own clock, and holds the night** (#127, Paweł's v2 redesign, approved 2026-11-27): one T for the
  monitor, the chat and the sound, started when the chat comes up, stopped by pause, running in real seconds (not the
  game's time scale), so the bubbles, the beats and the music never drift apart. Nothing starts the night before 38 s,
  and the close box is hidden: the 38 s are the waiting the night already did while the chat was up, and the launch is
  there to set the mood. Rejected: letting Let's go cut it short (the boys' last line and the theme's downbeat would be
  skipped by most players); drawing it as a video (it is the renderer's code, palette-exact, and stays editable). The
  sims never run it; F1 skips it.
- **From the login every night after the first Monday** (0.99.1, #127; Paweł, 2026-11-27): the whole 38 s every night
  would wear thin, and none at all would lose the ritual of logging in to the boys' chat. The login's 15 s carry it:
  the same clock from T 23, the chat spread over it, the theme picked up at its offset (just before bar 2) and faded
  in. Replays and week two too (the spec's call, for Paweł's review). Week two has no chat, so its phone shows only
  the pill and Let's go: the night still waits for the login (rejected: letting the night run under the login, with
  the monitor showing it and her visits already coming).
- **The goal before the night, the core loop coached in place** (0.41, #42; the card since 0.88, #101): the 0.39
  onboarding taught how to hide but not what you play for, and its feed lines were easy to miss while the RPG scrolls.
  From 0.41 to 0.87 tonight's goals were a sticky note on the monitor. It was unreadable at 1x and, enlarged to 2x
  (0.87), broke the main visual rule (one resolution: [screen.md](screen.md)), so it went (Paweł, 2026-11-27): the
  goals are a card after How to hide, in its look, a sentence each with what the star pays. Rejected: keeping a live
  goal list on screen (the desk has no room for it at 1x); the note at 2x. Coach marks slow the game
  instead of pausing it, so the first footsteps are still a timing lesson (press Tab while she walks), just a
  readable one. Rejected: a scripted tutorial level (teaches the script, not the listening); pausing on each
  coach mark (teaches acting on a frozen screen); a safe first visit (kept the first catch possible).
- **Four cards on the first Monday, one area each** (0.94, #124; Paweł: the two cards weren't enough for the first
  night, and some lines were pieced together from different areas). The party, How to hide, the job and Tonight; every
  line on a card belongs to its area, and the facts were checked against the rules (a snack run only checks the desk,
  so the old "Plates clinking: a snack run" sent players to Excel for nothing). Rejected: more tiles on the two
  cards (a card per area reads faster), a fifth card for the city (one foot covers what the first night needs), and
  teaching the floor map, the Merchant and the skill tree on their own cards (their first-time tips and screens do it
  in place).
- **Onboarding by happening, not by a tutorial** (0.39): the slice is meant to be understood within 2 minutes
  without being told. One card for the one rule you cannot learn by watching (Excel up before the door
  opens), then each system explains itself once, in a friend's or her voice, when it first shows up. Tips go
  to the feed, pinned, because on-screen toasts would cover the game and the door. Rejected: a scripted first
  visit (it would teach the script, not the listening); the old title screen's eight bullets (nobody reads
  them before playing); tips that repeat every night (noise after the first night).

- **The morning in the redesign's look** (0.72, V10 #75): the page's morning draws from the game's numbers and lines
  (`render/morningView.ts`), never its sample text: the Tiredness the sleep debt leads to comes from `TIRED_BASE` and
  `TIRED_PER_DEBT`, the rewards from the star tuning, the chest's name from the item rolled. It shows the time and no
  day, and the button reads "Start night N": every night is Monday until the week (#56) names them, and "Tue 07:40" over
  "Start Monday night" would contradict itself. The results screen stays as it is between the night and the morning:
  the redesign has no results screen, and its numbers (depth against the record, near misses, the appraiser's
  waiting items) have no place on the morning's summary. Rejected: folding the results into the morning (no room in
  the summary without dropping the near misses); the page's day and night names now.
- **The week, with what the build has** (0.77, #56). The schedule is the week doc's, as data, so it can be edited
  without code. My calls, for Paweł to check: Make her tea and the towel (the handoff's Tuesday door moves, which the
  week doc dropped for lean in) came in on Thursday in 0.77 and 0.78, standing in for the smart home's bubble tea and
  door seal, which replaced them there in 0.79; "her on the desk after a pass" (Tuesday) is the build's lean into your face, the lap
  sit is #59's Saturday; Monday's 01:00 is a Sleep, not a forced end, so a rule nobody told you can't cost you a run;
  new games start with no cans; week two keeps everything on as a placeholder. The visit multiplier also speeds her
  routine: with Noise her odds were already near certain at each activity's end, so gaps and odds alone gave Sunday
  +25% instead of +60%. Rejected: tea and the towel on Tuesday (the week doc gives it to lean in) or dropped now
  (Thursday would have nothing to prevent with until step 6); replaying week one's rules in week two (easy with a
  week of RPG growth); one `SATURDAY_VISIT_MULT` (the handoff's: the week doc wants a ramp).
- **Nothing offers what is not on yet** (0.88, #103; Paweł after the first playtest: "why can't I put on headphones
  on night 1?"). The headset stays Tuesday's (Monday teaches listening; the headset trades hearing for Zone, which only
  makes sense once you know her sounds; decided 2026-11-27). What was wrong was Monday showing it anyway: the icon by
  his head, the head as a button with its tip, H lit on the desk keyboard. Before Tuesday none of them shows. Rejected:
  the headset from Monday (Tuesday loses one of its new things, and night 1 teaches two opposite things).
- **Taught the night it unlocks** (0.78, #56; the week doc 2b, grid doc 7m). The boys' chat is on the phone, in
  The Boys' chat, because everything on the phone happens inside it (decided 2026-11-24); it comes before How to hide
  so the night opens with the friends and the card only shows when there is a new tile. **Always text** (0.89.1, #108;
  Paweł: the boys always use their chat): Billy's voice note (a waveform and a transcript) from Tuesday and after the
  plug became their chat bubbles, like Monday's. Rejected: keeping the voice note for the nights that teach (the boys
  read as a group chat, and one format is one thing to learn). Tuesday's note opens
  with the night that runs to dawn ("no curfew tonight", since Hixx is in from night 1, #96), then lean in. The first chance is a
  scripted first visit of the night's new type, and safe as a let-go catch, so the first chat visit teaches by
  happening and a slow Tab can't cost the night. Rejected: a transcript bubble by the desk phone (the handoff's:
  outside the phone); a note in week two (nothing new to say); making the whole first visit a crawl (the coach
  marks already crawl the footsteps and her first time at the door).
- **Coach marks and tooltips in the redesign's look** (0.74, V11 #76). Coach marks are the game talking, so one look
  everywhere; their targets are the renderer's own rectangles (the DOM stand-ins they used to anchor on stay only for
  the tests). Tooltips follow the pointer's world; the RPG's card is drawn inside the battle area and the panel because
  its leather is lit by their light, and a free-floating copy would not match. Items keep the DOM card until the side
  panel's item details are redrawn (with the RPG's pieces, not real life's). Rejected: one tooltip look for everything
  (the grid doc's rule: real life is glass, the PC is Windows 98, hers are hers).
- **Pause, How to hide and the microsleep in the redesign's look** (0.73, V11 #76, grid doc 7k). Pause blacks out the
  whole frame (so it can't be used to peek) under a glass card with Resume (Esc) and How to hide. The How-to card's
  tiles are tonight's (the week, 0.77). The lids draw over a picture of the frame: closing at 20 fps (a per-pixel pass over the whole frame), shut only when
  the zzz changes. Rejected: the page's Tuesday card now (lean in isn't in the game yet).
- **Stars that reward greed** (0.63, #54; Paweł's brief from testing v0.48): the old ladder (survive, then Mood, then
  not caught) paid nothing for going deep, so the safe night and the greedy night scored the same. Now the RPG has
  its own star (Deep) and every star pays something the next night needs. Rejected: Deep counting only the run you
  end on (a wipe after a deep run would erase it); loot for Unseen or Sweet (loot only comes from the game, money
  rule 2026-11-19); a star for surviving (dawn and Sleep both survive; unplugged already gets none).
- **Earliest sleep 23:00.** Logging off at 20:00 used to earn 3 stars for free.
- **Tiredness replaced the sleep-debt effects table** (yawn at 4 debt, shorter timers at 8, and so on).
  A live meter makes even a little debt matter and gives the Goblin Fuel a job.
- **Slow pace after the first playtest:** turns about every 3.3 s, battles about 15 s, nights about
  8 minutes to bedtime. The first pace was too fast to watch the door.
- Mood drifts up 1 every `MOOD_DRIFT_EVERY_SEC` (30 s, was 20 s) to suit the longer nights.

## Planned

- Week two and the endgame: TBD (Paweł).
- Save between nights exists for progress only (party, bag, city, debt); a night in progress is not saved.
