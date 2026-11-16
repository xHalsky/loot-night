# Changelog

One entry per build. Newest first. The design bible describes the current game; this file records how it got there.
Versions before 0.14.0 predate the repository (they exist only as published artifact versions and zips).

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
- `ROADMAP.md`: the build order, with priorities relabelled to match.

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
