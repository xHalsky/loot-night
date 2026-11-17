# Changelog

One entry per build. Newest first. The design bible describes the current game; this file records how it got there.
Versions before 0.14.0 predate the repository (they exist only as published artifact versions and zips).

## 0.29.0 (2026-11-17)

Synergy, part 1 of 3 (#29): cross-layer echoes and payouts.

- **RPG → life:** a legendary makes him yell "LET'S GOOOO" (Noise +15, +5 into the headset mic; she asks "what
  was that??" if she can hear). A boss below 25% HP is ENRAGED: Flow builds x1.5 for the fight, and alt-tabbing
  out of it resets Flow. A wipe makes him slam the desk (Noise +10) and the dog comes over.
- **Life → RPG:** a good cuddle gives **Loved** (+15% damage, +10% crit for the next fight). Tired 70+ makes
  the party **Drowsy**: 10% of hero hits miss ("zzz"). Every catch now brings Guilt, not only the second.
- **The dog pays:** petting him mostly on his favourite spot gives **Good Boy** (loot goblins x2 for 60 s).
  Cables back in within 6 s restore your Flow.
- Party buffs can last "the next fight" (Loved) and add crit. New buff icons: Loved, Good Boy.
- `test/echoes.ts`: 14 checks pass. Sims (10 good runs): depth 9.9, visits 4.7, wakes 2.1, 0 catches,
  average Noise 34 (28 in 0.28: the yells and desk slams). Not tuned yet; the balance pass (#2) owns it.

## 0.28.0 (2026-11-17)

- **Two new calls** (#23), both short dialogues on the phone:
  - **Courier** (until 22:00, at most 2 a night): talk him into leaving the parcel with a neighbour (two
    steps, three replies each, one wrong word and he leaves). The parcel is a rare-or-better item in your
    bag. Ignored or declined: the parcel is lost, nothing else.
  - **The Boys** (group call, at most 3 a night): they are on speaker, Noise every second the call is open.
    Decline them politely twice for a **Raid buff** (party +20% damage, +10% speed, 30 s); a rude reply makes
    them louder, two and they hang up. Ignored: Discord rings on the PC at full volume (Noise +30). Declined:
    group chat spam (Noise +15). With the headset on it all goes into your ears: no Noise.
- Interrupts are now weighted (Mom 3, boss 3, courier 2, the boys 2) with per-night caps. Calls share the
  ringing, decline and face-down rules Mom had. F1: Courier and Boys buttons.
- Party buffs are one list now (curio buffs, the raid buff), each with its own icon and duration, and they
  count down in town too.
- `test/calls.ts`: 14 checks pass. Sims (10 good runs): depth 9.5, visits 5.0, wakes 1.7, 0 catches; the bot
  answers both calls (2 couriers and 3 group calls a night). Idle still unplugged and caught.

## 0.27.0 (2026-11-17)

- **Pre-emptive actions** (#19): verbs used before she comes, to shape her next visit. The framework: hands
  busy or away from the desk (empty chair, reckless autopilot, a visit then sees whatever is on screen), a
  hidden condition on where she is (wrong = backfire), half effect the 2nd time a night, suspicion on the 3rd
  (her next visit is a check). A calm (no visits) ends if you get loud. Debug: F1 → Calm +30s.
  - **Text her** (tap the idle phone, 3 s): her next visit waits 40 s, Mood -5, and her reply tells you what
    she is doing. On her way somewhere: she comes to chat. Shower: chat after.
  - **Make her tea** (door panel, 15 s away): Mood -15, 60 s calm; watching TV she asks you to stay for one
    episode (60 s more away, 120 s calm). Kitchen: a long hug. Hallway: she glances at your screen.
  - **Towel under the door** (door panel, toggle): your Noise reaches her 40% quieter, she gets up 30% less
    often; you lose the light under the door and her steps are half as loud, and she asks about it every visit.
- Tea calm cut from the plan's 2 min to 60 s and the episode's 4 min to 120 s: at the planned numbers a bot
  using tea and the episode twice a night got 0 to 1 visits.
- Sims, 10 good runs each: no actions depth 9.7, visits 5.1, wakes 2.1 (batch-to-batch range 3.6 to 5.1);
  tea and episode twice a night, 1.0 visits, depth 5.4, 0.7 wipes; tea but declining the episode, 3.3 visits,
  depth 8.8. `test/preemptive.ts`: 21 checks pass. Idle still unplugged.

## 0.26.0 (2026-11-17)

- **Curios in the corridor** (#30), the RPG's third verb. On battle floors, 1 or 2 walks stop at a curio with
  two choices, each costing something from real life: locked strongbox (pick 8 s quiet / smash, Noise +25),
  overdue mailbox (gold, a rare or a late fee), energy-drink shrine (offer a real can from the desk for a big
  buff / pray, coin flip), snoring troll (sneak 6 s on the RPG screen, alt-tab wakes him / fight a mini-boss),
  guild bank vault (a free rare; Rafał reads the log later and sulks), vending machine (pay gold / kick it).
  The party waits 7 s, then walks past; ✕ leaves. Away, the party does the loud thing half the time.
- New buffs on the monitor: Monster blessing, Small blessing, Late fee, Rafał sulks.
- Sims, 10 good runs (quiet choices): depth 9.6, 0 catches, visits 4.6, wakes 1.1, Noise 27 (0.25: 5.0, 2.2,
  29). Always the loud choice: visits 5.8, wakes 3.1, Noise 44. Idle still unplugged and caught.

## 0.25.0 (2026-11-17)

RPG depth, part 3 of 3 (#27, done).

- **Special affixes**, at most one per item, named by its suffix:
  - Real-life (epic, legendary): of Peace (hear her steps through the headset), of Quick Fingers (alt-tab 30%
    faster), of Five More Minutes (Tiredness 20% slower), of Infinite Excuses (once a night a catch becomes a
    pass), of the Night Owl (Noise wakes her 30% slower), of Many Cans (cans hide themselves on a Snack run).
  - Cross-system (rare and up), a stat while something in real life is true: Headset Hero (crit, headset on),
    Caffeine (speed, Monster), Library Voice (attack, Noise under 30), Sweet Talker (attack, Mood green),
    Good Boy (luck for 60 s after petting the dog), Spreadsheet Warrior (3 gold per kill on Excel).
  - Roll rates: rares 30% cross; epics 35% real-life, 45% cross; every legendary has one. Hidden until
    identified. Pink and teal tooltip lines; cross-system lines say Active or Inactive.
- Random name suffixes that now are real affixes (Five More Minutes, Night Owl, Infinite Excuses) left the
  random pool, so a name never promises an effect it does not have.
- `test/affixes.ts`: roll rates and that the effects switch on. Sims unchanged (the bot does not equip):
  8 good runs depth 9.6, 0 catches, visits 5.0, wakes 2.2. Alt-tab test 200/200 both ways.

## 0.24.0 (2026-11-17)

RPG depth, part 2 of 3 (#27).

- **Three enemies that each ask for a different answer**: The Auditor (floor 2+) heals his friends; Frost now
  goes for a healer first. Tax Shelter (3+) takes 25% damage until a Bash breaks its shield; Bash now goes for
  a shield before the front enemy. Junk Mail (4+) is a swarm of 5 envelopes: one per single hit, all of them
  per Fire. The first meeting with each shows a line on what it wants.
- **A boss per checkpoint floor**: 5 the Bailiff (FINAL NOTICE, as before), 10 the Loan Shark (a loan every 3rd
  action brings a friend; a friend still standing is refinanced: full HP, harder hits), 15 the Landlord (a
  deposit shield Bash breaks; EVICTION on the most hurt hero, 90% of their HP; Taunt or Ward). Then around
  again. Cast bar text and red answer pulses per boss; the node map names the boss.
- When a boss dies, the enemies still standing run.
- **Two maps**: Cursed Floor (heals do half, every drop one rarity better, violet fog) and Goblin Den (a goblin
  after every battle, catching one is loud).
- Node map: names under the nodes, descriptions on hover, so six paths fit. Fixed: the Treasure Vault said 6
  items, it drops 5.
- Autopilot test (lowest party HP, careful / spam, 10 to 12 trials): floor-5 Bailiff 69% / 67%; floor-10 Loan
  Shark 52% / 62%, 1 to 3 wipes in 12 (was the Bailiff: 62% / 56%, 0 wipes); floor-15 Landlord 60% / 55%;
  40 s away wipes on all three. Normal floor 8, 40 s away: 4/12 wipes, 22% HP (was 2/15).
- Sims, 20 good runs averaged: depth 9.5-9.7, 0 catches, visits 5.2 (0.23: 3.9-4.7), wakes 2.5-2.9 (1.7-1.9),
  average Noise 32 (28). Battle Noise is unchanged; the bot reaches the floor-10 boss at bedtime and its longer
  fight runs into the sleep phase (night ends about 01:35, was 01:07). Left for the balance pass (#2).

## 0.23.0 (2026-11-17)

RPG depth, part 1 of 3 (#27).

- **Third skill per hero**: Rally (knight, key 3: every hero acts now, +25% damage for 6 s), Storm (mage, E:
  6 bolts at random enemies), Revive (healer, D: a downed hero back at 50%, otherwise a 50% heal on the most
  hurt). Unlocks moved to levels 1 / 3 / 5, so one night reaches the whole kit (level 3 before the first boss).
  Ultimates stay locked as "later nights".
- **Ability marks**: Bash Staggers (Fire x2), Frost Chills (Bash shatters x2.5), the healer's Smite Judges
  (skill hits on it heal), Taunt marks enemies Taunted (with Ward up, half their hits bounce back). Tags above
  the enemies' HP bars; a skill that would cash in a mark glows gold on the bar with a badge (x2, x2.5, ↩).
  Tooltips colour the mark words.
- Judged pays off only on skill hits. Healing off auto attacks made 40 s on Excel safe (floor 8: 0 wipes and
  44% HP), which undid the reckless autopilot.
- Noise per cast 4 → 3.5; Storm and Rally count as one noisy moment. The Bailiff 1100 → 1700 HP.
- Sims, 10 good runs averaged (before → after): depth 9.6 → 9.6, visits 4.5 → 3.8, wakes 2.0 → 1.3, average
  Noise 26 → 26, 0 catches. Idle still unplugged and caught.
- Autopilot test, lowest party HP (before → after): floor-5 boss smart 67% → 69%, spam 72% → 66%, fight
  33-37 s → 44-56 s; floor-10 boss smart 5/15 wipes, 22% → 0 wipes, 62%; spam 3/15, 43% → 0, 56%;
  40 s away still wipes on every boss; normal floor 8 away 2/15 wipes, 18% → 2/15, 22%.

## 0.22.0 (2026-11-17)

- **Her activity predicts the next visit type** (#18). The type now depends on what she was doing: TV → Chat
  or Cuddle, tea → Snack run, bathroom or phone → Peek, shower → Cuddle or Peek. 25% of the time it ignores
  that (`VISIT_RANDOM`), and Cuddle is still only drawn while she is green. Replaces the shuffled deck
  (`VISIT_DECK` is gone). `test/predict.ts` prints the odds.
- **Activity end cues**: 3.5 s before she moves, each activity gets its own sound: TV credits, kettle whistle
  and click, running tap, hair dryer, the phone goodbye jingle. The phone used to be silent, so it was the one
  activity you could not follow. Cues come from her room, so distance and the headset mute them.
- Sims (2 good, 1 idle): good bot 3 stars, floor 9-10, 0 catches, 0 wipes; idle still caught and unplugged.
  Alt-tab test 200/200 both ways; noise test passes. No balance numbers moved.

## 0.21.0 (2026-11-16)

- **Power level** (#31). Every item has a power (item level × rarity, the scale that sets its stats); a hero's
  Power (◆) is the average of their 6 slots, empty = 0. Shown on the portraits next to the level, in the equip
  window, on every slot and bag item, and in tooltips as the change for the selected hero ("◆ Power 3 → 33").
  A hero under 85% of the party's best gets a pulsing red "!" on the portrait.
- **Rebuilt equip window**: Power in the title, power per slot, and a stat block (HP, ATK, ARM, SPD, CRIT,
  LUCK) with the gear share in green. Bag slots show item power instead of sell value (value is in the tooltip).
- Feed and doll slightly shorter to fit. No balance change.

## 0.20.0 (2026-11-16)

- **Looks busy is gone.** Excel on screen when she looks is a pass. The meter made players fill a bar they
  did not watch, and it caught players who switched in time (the alt-tab lag ate the time Excel needed to fill
  it). The reckless autopilot now carries the cost of hiding. The Excel Tetris stays, optional, for overtime gold.
- The boss's message no longer pays Looks busy: answering it pays a 40 gold overtime bonus and keeps him quiet
  for 150 s; flipping the phone on him makes him ping again in 20-30 s.
- Removed: the Looks busy rows (YOU box, her stats), Busy in Excel's status bar (now the night's overtime pay),
  the Busy 100 debug button, the Alibi stacks plan.
- Sims (4 good, 2 idle): good bot 3 stars, floor 5-10, 0-1 wipes, **0 catches** (was caught in about 1 night in 3);
  idle still caught and unplugged. Alt-tab test unchanged (200/200 both ways).
- Designed: curios in the corridor as the RPG's third verb (#30, `dungeon.md`), slotted after RPG depth.

## 0.19.0 (2026-11-16)

- **Skill tooltips.** Hover a skill: what it does with this hero's real numbers, cooldown, Noise, and when to use
  it; locked skills show their unlock level. Hover a portrait: the hero's role and auto attack. Replaces the
  browser's slow native title, which often did not show at all because the bar redraws every frame.
- During a boss wind-up, the answering skills (Taunt, Ward, Bash unless braced) pulse red.
- Skill numbers moved from the battle code into `src/data/heroes.ts` (one source for effect and tooltip).
  No balance change.

## 0.18.0 (2026-11-16)

- **Bosses make you sweat** (#2). The Bailiff now winds up FINAL NOTICE every 2nd action: a boss cast bar at
  the top of the screen and a rising rumble you can hear from Excel, then 60% max HP to every hero. Answers:
  Bash interrupts (after which he is braced and the next one cannot be interrupted), Ward halves it, Taunt pulls
  it onto the knight. Bailiff 850/24 → 1100/28.
- `test/autopilot.ts` now runs three players per fight and reports the lowest party HP during it (the old
  end-of-fight HP hid the danger: a boss kill levels the party up and heals it). Floor-10 boss, skills on
  cooldown: lowest HP 58% → 49%, close calls appear, no wipes. Floor-5 boss: 76-84% → 66-70%. Away: always wipes.
- Sims (4 good, 2 idle): good bot 3 stars, floor 5-12, 0-1 wipes; idle unchanged. Alt-tab test unchanged.
- Slice criterion changed: 3 visit types over two nights, not one; few visits per night is intended.

## 0.17.0 (2026-11-16)

- **Three new visit types** (#12, Monday set). Each wants a different answer:
  - **Snack run** (plates clinking): she never looks at the screen; she checks the desk for Monster cans.
    Click the cans during the footsteps to hide them, then take the plate (party +20% HP). Cans in sight: one
    is confiscated.
  - **Chat** (humming): Excel up and headset off, then 3 quick questions while you stay on Excel (and the
    reckless autopilot runs).
  - **Cuddle** (slow slippers, only when she is happy): "Come here" starts a cuddle minigame (follow her breathing
    around a heart, slowly); "One sec, babe" costs Mood. The party keeps the safe autopilot while you cuddle.
- Visit types come from a shuffled deck (Peek x2, Snack, Chat, Cuddle), so a short night still shows variety.
- First night: the her-note names each hallway cue. Plate prop and new faces at the door. New sounds: plates,
  humming, slower slipper steps.
- Debug panel: spawn a Snack, Chat or Cuddle visit. New `test/visits.py` screenshots. `test/alttab.ts` now forces Peeks.
- Sims (4 good, 2 idle): good bot 2-3 stars, floor 5-10, 0-1 wipes, 0-2 catches, 1-5 visits covering all types;
  idle still unplugged. Finding for #2: a Peek can catch a player who switched on the earliest cue if Looks
  busy started low (the lag eats the Excel time); and nights only get 2 to 4 visits before bed.

## 0.16.0 (2026-11-16)

- **Noise by distance and masking** (#17). Your Noise reaches her x2 from the living room, kitchen and hallway,
  x1 from the bathroom, x0.5 from the bedroom; the TV masks a further half and the shower masks it all.
  Heard Noise drives her chance to come to your door and makes her finish activities early. Never shown.
  Not applied while she sleeps (the bed phase keeps its own tuning).
- New `test/noise.ts`: boss kill during her shower 35% → 35% door chance; while she makes tea next door 35% → 85%.
- Sims (4 good, 2 idle): good bot 3 stars, floor 10, 0-1 wipes, 1-8 visits (high variance; the bot does not use
  her location yet). Idle unchanged. Alt-tab test unchanged.
- Removed the unused `VISIT_NOISE_SPEEDUP` constant.

## 0.15.0 (2026-11-16)

- **Reckless autopilot** (#15). Leaving the game is now dangerous: while you are on Excel, mid-switch, in a
  minigame or have the cables out, nobody holds aggro, the healer waits until 35%, the party pulls without
  resting and careless pulls give the enemies the first hit. Party chat complains in the Feed, and the
  Loot Night taskbar button flashes orange when the party is in trouble. Forced situations (her on your desk,
  the monitor she turned off) keep the old safe autopilot.
- The Bailiff is stronger (700 HP / 16 atk → 850 / 24): a floor-5 boss never threatened an absent player.
- New `test/autopilot.ts`. 40 s away, 20 trials each: boss floor 5 wipes 0 → 16, boss floor 10 3 → 20,
  normal floor 3 stays 0 (party HP 75% → 65%), normal floor 8 1 → 2 (53% → 32%).
- Sims (3 good, 2 idle runs): good bot before: 2-3 stars, floor 10, 0 wipes. After: 3 stars, floor 9-10,
  0-1 wipes per night (it hides on Excel mid-fight and now pays for it). Idle unchanged (unplugged, floor 3).
  Alt-tab test unchanged (200/200 both ways).
- Option A for the Raid pass written into `preemptive.md` (Goodwill only pays for the Raid pass; 2.5 real min).
- Test hook `window.__lootnight` for Playwright scripts.

## 0.14.1 (2026-11-16)

- **Design bible moved into the repo** as `docs/design/`, one file per system, rewritten to describe the
  current build (Now / Decisions / Planned). The old claude.ai doc had 13 appended playtest rounds on top of
  outdated sections. Unbuilt designs (campaign, synergy pass) are kept as clearly marked plans. Fixes #1.
- New backlog issues for designed-but-unbuilt parts: more visits and interrupts (#12), real audio (#13),
  synergy pass (#14).
- Code comments point to the new bible files. No gameplay change.
- Recovered the unbuilt prompts from the "Apartment map and switch costs" chat into the bible and backlog:
  reckless autopilot (#15), alt-tab crash (#16), Noise by distance (#17), activity predicts visit type (#18),
  pre-emptive actions (#19, #20, `preemptive.md`), wandering merchant (#21), eye-candy moments (#22,
  `eye-candy.md`), plus idea issues #23 to #25. #12 is now visit types only.
- Decisions: no wandering merchant (#21 closed), Doorframe visit cut, alt-tab crash parked as an idea (#16):
  lag plus reckless autopilot should be enough.
- Synergy pass split: slice set (#29, plus marks/affixes in #27, audio cues in #13, upgrade-per-night in #2)
  and arc set (#14). Audit table of what feeds what added to `synergy.md`. Raid pass becomes a pre-emptive action.
- `ROADMAP.md`: Monday slice first (with done criteria), then a longer arc with an ending and endless free play,
  final sprites after the slice. New issues: art style sheet (#26), RPG depth (#27), onboarding (#28).

## 0.14.0 (2026-11-16)

- **Alt-tab lag.** Every switch between the game and Excel takes a random 1.0–2.5 s (`ALT_TAB_LAG_SEC`) and plays an
  old-Windows fullscreen mode switch: frozen tearing frame, teal desktop with the window shrinking and smearing,
  black mode change with a monitor OSD, blocky arrival. No input during it; she sees the screen you switched *from*.
  Door-handle stage shortened to 0.9 s so a handle-cue switch always fails and a hallway-cue switch always passes
  (`test/alttab.ts`: 200/200 each).
- Phone leaves the desk while it is in your hand.
- Version number on the title screen; title help text updated for alt-tab and the Monster break.
- Repository created; mockups moved to `design/mockups/`.

## 0.13 (2026-11-15) — round 13

- Skills cast instantly on click/key, no global cooldown. Auto attack has no button; keys start at 1 / Q / A.
- Grey circle with red X on every minigame window.
- Desk phone shows the full iOS incoming-call screen; tap red declines at once, tap elsewhere picks up.
- Loot drops where each enemy died, bounces, shines more; party walks faster while loot is on the floor.
- Monster-scene guy redrawn (fringe, back spikes, headset round the neck).
- Balance: bot depth by bedtime rose from 5–7 to ~10 floors with instant skills.

## 0.12 — round 12

- Phone is iOS throughout (in hand: iPhone proportions; lock screen, Face ID, incoming call, in-call, iMessage threads).
- Messages arrive in bursts of 1–3, one short buzz + one lock-screen banner each; calls keep the long buzz.
- Every phone screen can be left (Put down, Decline, end call, back chevron, home bar).
- WoW-style buff/debuff squares top-right of the game screen with timers.
- Right panel order: You, Feed, run progress, Party, Bag.

## 0.11 — round 11

- Dungeon as a dark 2.5D cave diorama: torch light travels with the party, fog at the far end, foreground parallax.
- Camera acts: dolly on walk, push-in on fights, pull-back on heavy hits, shake on crits, slow zoom on legendaries.
- Loot on the floor with rarity beams; the front hero collects it, bag slot flashes.
- Item lock (L), auto-salvage below blue, bag grows to 18 slots.
- Her: higher fidelity, grounded at the door, situational expressions + reaction bubble; desk pose redrawn.
- Peek cloud shrinks onto her over ~7 s; dog visible chest-up from the floor; headset Zone aura; morning screen fits.

## 0.10 — round 10

- Pixel-anime pipeline for characters; her redrawn with outfits by activity, barefoot moments (lean visit, toes
  under the door, morning bed), frosted shower silhouette.
- First-person "she sits on your desk" scene; Infinity Engine skill bar on the dungeon screen; feed moved right.
- Shiba with a body; 9-type randomized cable minigame; 2026 phone proportions; vibration instead of ringtones.

## 0.9 — round 9

- Desk layout pass, headset/Monster art, bin in the back; slingshot toss (later replaced by a free fling).
- Taller door, square blueprint, your stats moved to the right panel.
- New: the dog (pet him or he knocks the cables out), the cable fix, she sits on your desk (sweet-talk her off).

## 0.8 — round 8

- MMO chat feed; phone declines (flip face-down, decline calls); roaming town NPCs with chat bubbles.
- Keyboard/mouse art; Monster rebuilt (free grab, one-click open, drink close-up, physics toss into a bin).
- Blueprint floor plan with no exact position; hold-to-peek door with detection risk.

## 0.7 — round 7

- MMO city hub on the monitor with clickable services and buildable plots; Slay the Spire-style floor map.
- Monster close-ups and a can pile; team renamed Paweł, Rafał, Jacek.

## 0.1–0.6 — prototype and early rounds

- Night 1 prototype: RPG idler, girlfriend visits (FNAF-style telegraph), Excel cover, phone interrupts,
  Monster, tiredness, sleep debt, stars. Early rounds slowed pacing, replaced "hold Space to listen" with the
  headset/Zone trade-off, added the Mom reading phase, rarity colours, tooltips, paper doll, three UI flavours.
