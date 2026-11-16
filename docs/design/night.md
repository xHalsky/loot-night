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

## Decisions

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
