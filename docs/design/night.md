# The night

## Now

**Flow of a night.** Title → 20:00 in the city (`startNight`) → dungeon floors, trips back to the city
any time between battles → the night ends → results screen → morning screen → next night.
The prototype always plays Monday.

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

**Morning screen.** Two columns: art on the left (she fell asleep in your shirt; from the foot of the bed,
bare soles out from under the blanket, breathing), summary and the next-night button on the right.
Auction listings pay out here in zł. **One reward per star** (`toMorning`): loot only comes from the game, so only
the RPG star pays in loot.
- **Deep: a chest:** one item from the normal drop table at tonight's deepest floor, into the bag; a full bag keeps
  it as the next night's first drop (the bag-full window takes it from there).
- **Unseen: Trust:** the next night starts with Goodwill +`STAR_UNSEEN_GOODWILL` (20), on top of what carries over
  (closer to the Raid pass at 40 and Forgiveness at 60).
- **Sweet: Breakfast:** she makes breakfast, sleep debt -`STAR_SWEET_DEBT` (1), so the next night starts less tired.
`S.g.carry` holds Trust and a waiting chest for the next night (saved).

**Tiredness.** The live form of sleep debt, a 0 to 100 meter on the YOU card (desk, bottom right).
- Start: `TIRED_BASE` + `TIRED_PER_DEBT` × sleep debt (10 + 3 per point).
- After 22:00 it rises `TIRED_PER_GAME_MIN` per in-game minute, only while the dungeon clock runs.
  A rested player reaches microsleeps around 00:30; one who stayed up to dawn starts the next night near 70.

| Tiredness | Effect (debuff icon I / II / III) |
|---|---|
| 30+ | Yawns blur the desk for 2 s, every `YAWN_EVERY_SEC` |
| 50+ | Microsleeps every 30 to 50 s: eyelids drift shut over 1.6 s. Any click or key snaps them open (that input does nothing else). Fully shut = black until you react; you can miss her shadow. |
| 70+ | Sluggish: phone timers 15% shorter, Flow builds 25% slower |
| 90+ | Wrecked (threshold exists; extra effect not built) |

Goblin Fuel lowers Tiredness and blocks microsleeps while the boost lasts (see [desk.md](desk.md)).

**Onboarding (the first night, #28).** No tutorial level and no walls of text; the first night teaches by
happening.
- **Title:** two lines (raid night, your girlfriend thinks you are doing spreadsheets; the RPG plays itself,
  your job is to listen, hide and keep everyone happy) and "turn the sound on".
- **How-to-hide card** (`howtoHtml`): opens when the first night starts and the night waits until "Got it"
  (or Esc / Enter). Four tiles, two lines each: 1 Listen (the sounds, the last-heard line, hold the door to
  peek), 2 Tab to Excel (footsteps: switch now, never wait for the handle), 3 Answer her (each visit wants
  something else), 4 Headset (the Zone, but you are deaf to her). The pause menu reopens it.
- **Tonight, a sticky note** (#42; drawn on the desk since 0.66, `tonightNote` in `render/page/desk.js`): stuck on
  the monitor's bottom edge over the middle of the taskbar (#49), always visible in the game and in Excel. Three handwritten lines, the night's goals, with a live mark each and no star ladder: "floor N"
  (! until a run reaches it, then ✓ for good), "don't get caught" (✓, ✗ once caught), "keep her happy" (✓ green or
  yellow, ! red); and when Sleep opens (⏻ 23:00+). Hover: each is a star that pays in the morning. Before this the stars first appeared on the results
  screen, so a new player knew the rules but not what a good night was.
- **Coach marks for the core loop** (`COACH` in `src/data/tips.ts`, `src/systems/coach.ts`, #42): the first
  footsteps, her first time in the doorway, the first phone, the first loot and the first boss wind-up get a
  callout next to the thing itself (a ring around it), and the game crawls at `COACH_SLOW` (a quarter speed)
  until the player does it: Tab, answering her, opening the phone, equipping, a skill. It also clears when the
  moment passes, after `COACH_MAX_SEC` real seconds, or with ✕. Once per save. A more important one bumps a
  less important one (footsteps > doorway > phone > wind-up > loot), and the bumped one comes back next time.
  Hidden while her caught screen is up.
- **First-time tips** (`TIPS` in `src/data/tips.ts`, `src/systems/tips.ts`): everything else gets one line from
  her or the guild chat (Magoo and Healero, your party) in the feed, pinned at its top for `TIP_PIN_SEC`. Once per
  save; a new game starts them over. Timed: her "I'm watching my show" (`TIP_HER_AT`) and the plan on the wall
  (`TIP_PLAN_AT`). On events: a pass, a catch, an end cue, the dog, a yawn, the headset, her bedtime, a peek,
  the first floor choice, the shower.
- **Labelled cues on the first night:** the her-note names the hallway cue of each visit type (`VISIT_CUE`) and,
  new, the cue that ends each activity (`END_HINT`: "The kettle clicked off. Tea, then maybe a snack run.").
  Later nights rely on the sound.
- Tests: `npx tsx test/tips.ts`, `python3 test/onboarding.py` (screens: `test/onb_*.png`), `python3 test/coach.py`
  (each coach mark, the crawl, clearing, the bump; screens: `test/coach_*.png`).

## Decisions

- **The goal on a sticky note, the core loop coached in place** (0.41, #42): the 0.39 onboarding taught how to
  hide but not what you play for, and its feed lines were easy to miss while the RPG scrolls. The note is
  diegetic (he wrote tonight's goals down) and lives on the desk because the right panel had no room: as a
  panel section it squeezed the feed to two lines and cut the party's stats. Coach marks slow the game
  instead of pausing it, so the first footsteps are still a timing lesson (press Tab while she walks), just a
  readable one. Rejected: a scripted tutorial level (teaches the script, not the listening); pausing on each
  coach mark (teaches acting on a frozen screen); a safe first visit (kept the first catch possible).
- **Onboarding by happening, not by a tutorial** (0.39): the slice is meant to be understood within 2 minutes
  without being told. One card for the one rule you cannot learn by watching (Excel up before the door
  opens), then each system explains itself once, in a friend's or her voice, when it first shows up. Tips go
  to the feed, pinned, because on-screen toasts would cover the game and the door. Rejected: a scripted first
  visit (it would teach the script, not the listening); the old title screen's eight bullets (nobody reads
  them before playing); tips that repeat every night (noise after the first night).

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

- Nights 2 to 7 with their own dungeon and rule, per-night 3rd-star challenges, star gates: [campaign.md](campaign.md), #3.
- Witching Hour after 01:00 as a reward side of staying up: [synergy.md](synergy.md).
- Save between nights exists for progress only (party, bag, city, debt); a night in progress is not saved.
