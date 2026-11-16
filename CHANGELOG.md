# Changelog

One entry per build. Newest first. The design bible describes the current game; this file records how it got there.
Versions before 0.14.0 predate the repository (they exist only as published artifact versions and zips).

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
