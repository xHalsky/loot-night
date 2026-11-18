# The night

## Now

**Flow of a night.** Title → 20:00 in the city (`startNight`) → dungeon floors, trips back to the city
any time between battles → the night ends → results screen → morning screen → next night.
The prototype always plays Monday.

**Two clocks.**

| Clock | Runs | Stops | Drives |
|---|---|---|---|
| Night clock | In the dungeon: 1 in-game hour per `SEC_PER_GAME_HOUR` (96 s), so bedtime comes after about 8 min and dawn after about 16. At `MENU_CLOCK_SPEED` (25%) while an item, the full-bag popup or the floor map is open. | In the city; city actions cost fixed minutes instead (`COST_*_MIN`). | Bedtime, dawn, sleep debt, Tiredness. |
| Threat time | Always while a night runs, on every screen. | Only the pause menu. | Her, interrupts, the dog, Mood drift, buff timers. |

While an item, the full-bag popup or the floor map is open, the fight also slows to
`BATTLE_MENU_SPEED` (30%) so the player can think. Threats keep full speed.

**How a night ends.**

| Ending | Trigger | Bag | Sleep debt |
|---|---|---|---|
| Sleep | Power button "Sleep" on the taskbar; allowed from `EARLIEST_SLEEP` (23:00), not mid-battle | Kept | +1 per 15 min past bedtime (01:00), −1 per 15 min before it |
| Dawn | Night clock reaches 06:00 | Kept | Set to the maximum (`SLEEP_DEBT_MAX`, 20) |
| Unplugged | Mood reaches 100 | Cheaper half lost | Same rule as Sleep |

Floor loot and pending drops go into the bag before the ending is applied.

**Stars** (the real-life score):
1. Survived (not unplugged).
2. Ended with Mood below red (`MOOD_RED`).
3. Never caught all night.

The RPG keeps its own record: the deepest floor ever reached.

**Results screen.** Stars, depth vs. record, sleep debt before and after, and near misses: floors short
of the record, Mood short of the 2nd star, catches, and the cheapest city building with the gold and
scraps still missing.

**Morning screen.** Two columns: art on the left (she fell asleep in your shirt; from the foot of the bed,
bare soles out from under the blanket, breathing), summary and the next-night button on the right.
Auction listings pay out here in zł.

**Tiredness.** The live form of sleep debt, a 0 to 100 meter in the YOU box.
- Start: `TIRED_BASE` + `TIRED_PER_DEBT` × sleep debt (10 + 3 per point).
- After 22:00 it rises `TIRED_PER_GAME_MIN` per in-game minute, only while the dungeon clock runs.
  A rested player reaches microsleeps around 00:30; one who stayed up to dawn starts the next night near 70.

| Tiredness | Effect (debuff icon I / II / III) |
|---|---|
| 30+ | Yawns blur the desk for 2 s, every `YAWN_EVERY_SEC` |
| 50+ | Microsleeps every 30 to 50 s: eyelids drift shut over 1.6 s. Any click or key snaps them open (that input does nothing else). Fully shut = black until you react; you can miss her shadow. |
| 70+ | Sluggish: phone timers 15% shorter, Flow builds 25% slower |
| 90+ | Wrecked (threshold exists; extra effect not built) |

Monster lowers Tiredness and blocks microsleeps while the boost lasts (see [desk.md](desk.md)).

**Onboarding (the first night, #28).** No tutorial level and no walls of text; the first night teaches by
happening.
- **Title:** two lines (raid night, your girlfriend thinks you are doing spreadsheets; the RPG plays itself,
  your job is to listen, hide and keep everyone happy) and "turn the sound on".
- **How-to-hide card** (`howtoHtml`): opens when the first night starts and the night waits until "Got it"
  (or Esc / Enter). Four tiles, two lines each: 1 Listen (the sounds, the last-heard line, hold the door to
  peek), 2 Tab to Excel (footsteps: switch now, never wait for the handle), 3 Answer her (each visit wants
  something else), 4 Headset (the Zone, but you are deaf to her). The pause menu reopens it.
- **Tonight, a sticky note on the desk** (`tonightHtml`, #42): left of the monitor stand, always visible in the
  game and in Excel. The three stars of the night with a live mark each: "★ plug stays in", "★★ she's happy",
  "★★★ not caught" (✓ on track, ! her Mood is red, ✗ lost for tonight), when Sleep opens (⏻ 23:00+) and
  "deeper = better loot". Hover: what each star means. Before this the stars first appeared on the results
  screen, so a new player knew the rules but not what a good night was.
- **Coach marks for the core loop** (`COACH` in `src/data/tips.ts`, `src/systems/coach.ts`, #42): the first
  footsteps, her first time in the doorway, the first phone, the first loot and the first boss wind-up get a
  callout next to the thing itself (a ring around it), and the game crawls at `COACH_SLOW` (a quarter speed)
  until the player does it: Tab, answering her, opening the phone, equipping, a skill. It also clears when the
  moment passes, after `COACH_MAX_SEC` real seconds, or with ✕. Once per save. A more important one bumps a
  less important one (footsteps > doorway > phone > wind-up > loot), and the bumped one comes back next time.
  Hidden during the jumpscare.
- **First-time tips** (`TIPS` in `src/data/tips.ts`, `src/systems/tips.ts`): everything else gets one line from
  her or the guild chat (Rafał and Jacek, your party) in the feed, pinned at its top for `TIP_PIN_SEC`. Once per
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

- **Earliest sleep 23:00.** Logging off at 20:00 used to earn 3 stars for free.
- **Tiredness replaced the sleep-debt effects table** (yawn at 4 debt, shorter timers at 8, and so on).
  A live meter makes even a little debt matter and gives the Monster a job.
- **Slow pace after the first playtest:** turns about every 3.3 s, battles about 15 s, nights about
  8 minutes to bedtime. The first pace was too fast to watch the door.
- Mood drifts up 1 every `MOOD_DRIFT_EVERY_SEC` (30 s, was 20 s) to suit the longer nights.

## Planned

- Nights 2 to 7 with their own dungeon and rule, per-night 3rd-star challenges, star gates: [campaign.md](campaign.md), #3.
- Witching Hour after 01:00 as a reward side of staying up: [synergy.md](synergy.md).
- Save between nights exists for progress only (party, bag, city, debt); a night in progress is not saved.
