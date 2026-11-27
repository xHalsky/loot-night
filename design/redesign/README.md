# Loot Night: the visual redesign, handed off (2026-11-24)

What the redesign chat made, for the builder. **The specs are in the project docs, not here:**

- `claude/loot-night-rpg-grid.md` (the grid doc): every size, place, colour and rule. Sections are cited below as §.
- `claude/loot-night-decisions.md`: Paweł's decisions, newest first. **It wins** over the grid doc, the grid doc
  wins over `claude/loot-night-handoff-redesign.md` (the gameplay handoff, Issues #52 to #58).
- `claude/loot-night-redesign-index.md`: what is ready, the build order, the changes to the handoff, what is open.
- `claude/loot-night-week-one.md`: the loop of a night and the seven nights (what each adds, the ramp, how each new
  thing is taught, the checks); approved for now, it fills the handoff's step 5.

Snapshots of those docs as of 2026-11-24 are here too (`grid-doc.md`, `decisions.md`, `INDEX.md`, `ISSUES-draft.md`,
`WEEK-ONE.md`);
the project's copies are the live ones. This folder is the reference that goes with them: the mockup page's code, every baked image as a PNG, the palettes,
and a still of every state the page shows. Suggested place in the repo: `design/redesign/` (next to
`design/mockups/`).

**All character art is a placeholder** (her, him, the heroes, enemies, portraits, icons, the caught faces, the
mornings): Paweł draws the final art. The mockups give sizes, places, palettes and rules. **Numbers in this code are
the mockup's** (timings, page demos): the game's numbers go in `src/config/tuning.ts`, and the decided ones are in the
decisions log and the grid doc.

## New since the 2026-11-20 package

- **Messages is a working app** (its contacts; her chat kept for good and scrollable; her photos in the thread and
  opened in a window beside the phone; The Boys' chat with Raid night?), **the idle phone picks up** to the home
  screen. No Gallery. §7f; stills `phone-in-hand`, `phone-on-desk__idle`.
- **Lean in and her timers, approved:** the view through your door, the plan change (the bathroom at the far end, the
  arch, the hall mirror; `ROOM_DISTANCE` swaps the bathroom and the bedroom), his back in the webcam, taught on
  Tuesday (three coach marks, How to hide's fifth tile). §7l, §7k; stills `lean-in__*`.
- **Week one** (`WEEK-ONE.md`): the schedule, Monday without Tiredness, the Shop from Monday, the Home app on
  Thursday, the weekend's attention set, no Custom Night (the week loops after Sunday; the endgame is TBD).
- **Week one's pieces, approved:** Billy's 20:00 voice note in The Boys' chat (the handoff's Hudzor
  voicemail), the replay morning ("Tuesday, again"), the snack run's Hide cans and plate, the tease visit and Eyes
  busy, the towel and wine requests, the waking meter, "come to bed" with Coming, babe, the lap sit. §7m; stills
  `week-one__*`.
- Draft Issues **V12** (lean in) and **V13** (week one's pieces) in `ISSUES-draft.md`.

## The page

Live: the "Loot Night Game Frame" artifact, https://claude.ai/artifact/9xDaK6XXC4VYYgivRajnwU. The controls on the
left pick the frame (full, desk + monitor, game screen), the RPG screen and its states, the desk moment, her panel, the
small pieces and the interruptions; the note under the frame describes the state on screen.

| File | What | Grid doc |
|---|---|---|
| `page/rpg-screens.html` | The built page, one file (fonts embedded). Open it in Chrome | |
| `page/shell.html` | The page itself: controls, the notes for every state, the draw loop | |
| `page/build.py` | Concatenates the modules (its ORDER) into `shell.html` and embeds the fonts → `rpg-screens.html` | |
| `page/harness.html` | Loads the modules one by one (for tests and stills) | |
| `engine.js` | The renderer: 640 × 360 grid, palette-index drawing, Bayer 8 × 8 dither, lights, the actor pass, Tiny5 / Silkscreen / Micro 5 / Jacquarda Bastarda 9 text | §1, §2, §3, §8 |
| `kit.js` | UI materials (plates, wells, mouldings, leather), item and skill icons | §2, §4 |
| `hud.js` | The battle HUD: corner overlay, buffs, the skill bar, the ultimate's well, enemy casts, Souls | §4, §5 |
| `dungeon.js`, `screens.js` | The crypt and the screens built on it (dungeon, battle, floor map, town) | §5, §6 |
| `chars.js`, `enemies.js` | The four heroes (Hixx §4b), the mob of six | §3, §4b, §4c |
| `pathicons.js`, `paths.js` | The route choice: path cards, forks, the margin note, the away hourglass, the icons | §5b |
| `ranks.js` | Run blessings, marching order, auras, swaps, the Hook, the tooltip card | §5c, §5d |
| `townkit.js`, `town.js` | Ravenhold, 16-bit | §6 |
| `townpanel.js`, `tree.js` | The town side panel's tabs and service pages; the skill trees | §6b, §6c |
| `desk.js` | The right screen: monitor, desk camera, keyboard, the YOU and feed cards, the desk phone | §7 |
| `win98.js`, `q4.js` | Windows 98 (taskbar, windows, buttons) and Q4, the Excel clicker | §7i |
| `cans_img.js`, `ebreak.js` | The Goblin Fuel can sprites; the energy break's five scenes | §7c |
| `dog.js`, `cables.js` | The shiba; the cable fix behind the monitor | §7d |
| `phone.js` | The phone OS (in your hand and on the desk), the home screen, Messages (her chat, her photos, The Boys' chat), Billy's voice note, Shop, Home app, battery | §7f, §7i, §7j, §7m |
| `her_img.js`, `her.js` | Her panel: the baked webcam views, her PC-98 UI (and her window for her moments), the gaming chair, him leaning to the crack, the lap sit over the battle | §7b, §7k, §7l, §7m |
| `caught_img.js`, `caught.js` | The caught scare | §7e |
| `cuddle.js`, `blueprint.js` | The cuddle break; the plan | §7g |
| `morning_img.js`, `morning.js` | The morning: the CGs and the summary (the replay too) | §7h, §7m |
| `small.js` | The Goblin Fuel inspect window, How to hide (five tiles on Tuesday), coach marks (lean in's three too), tooltips, pause, away (with its reason), the microsleep | §7k, §7l |
| `lean.js` | Lean in: the view through your door (one camera, cast column by column), her stand-in and her timers, the hall mirror, the red bar and the stops | §7l |
| `mono.js`, `textlab.js` | Explorations not taken (battle colour variants; bigger fonts): kept so the page runs | |
| `bake_her.py` | Bakes the webcam views from prototype screenshots | §7b |
| `tools/caught/` | The caught portraits: `gf_svg.js` (vector layers) → `render.js` (4×) → `compose.py` (PC-98 ramps) | §7e |
| `tools/morning/` | The mornings: `scene.html` (WebGL SDF ray-marcher) → `compose.py` (ramps, ink), `sole.js` + `project.py` (the soles) | §7h |

**To rebuild:** put the font files in a `fonts/` folder next to `page/` (see Fonts), then run `python3 build.py` in
`page/`. The built file already embeds them, so viewing needs nothing.

## art/ (baked images as PNG)

| Folder | Files | Notes | Grid doc |
|---|---|---|---|
| `webcam/` | `baked-chat/kettle/steps/shower.png` (148 × 266) | The webcam views as baked from the prototype (with the old plain chair back) | §7b |
| | `drawn-*.png`, `drawn-kettle-away.png` | What the page shows now: the gaming chair drawn over the bake, him sitting in it; away, the chair empty | §7k |
| | `drawn-lean-slit96/24.png`, `drawn-door-shut.png` | Leaning in: him turned in the chair, leaning to the crack, the slit 96 and 24; the door shut, him turned toward it (Tuesday's first chance) | §7l |
| `photos/` | `selfie-jersey.png`, `selfie-duvet.png` (180 × 240, her 16 colours) | Her two photos, code-drawn stand-ins for Paweł's; the thread shows a 74 × 54 crop (`PHOTO_CROP` in `phone.js`) | §7f |
| `caught/` | `caught-1st/2nd/3rd.png` (640 × 360, indexed PC-98) | One face per rung of the night's ladder | §7e |
| `morning/` | `morning-green/yellow/red/unplugged.png` (640 × 360, indexed PC-98) | One CG per way the night ended | §7h |
| `cans/` | `can76` (72 × 174, the inspect window and Open), `can38` (Shop card), `can15` (scene, Shop row), `st_*` (energy-break states), `wrap` (the label unrolled) | Goblin Fuel B "Chest Burst", transparent | §7c, §7k |

Not here: the room posters (NOCNA ZMIANA, GOBLIN FURY) were handed to Paweł as PNGs by the design chat; the page's
energy break still shows the older posters.

## palettes/

`palettes.json` (hex by slot name, with notes) and `palettes.png` (swatches): Moonwell 32 (the RPG; Flow's two
UI-only slots), Graphite (the desk; steel, ember and the Windows 98 blues as UI-only slots), PC-98 (her 16), the
blueprint's 4, and the EB index palette of the can sprites. Meanings: §8 and §7.

## stills/

168 stills: one 640 × 360 PNG (1×, exactly the grid) of every state the page shows, named `NNN__group__row__state.png` after the
page's controls (e.g. `047__small-pieces__windows__away-charging.png`). `00-default` is the page's default (the dungeon,
calm, her chat). Scale them by whole numbers only. Animated states are caught mid-loop; the page shows them moving.
The voice notes are caught once their transcript is whole. Lean in's states need an activity, so they are named
`lean-in__her-timer__<activity>__<stage>`, `lean-in__closer-framing__<activity>` and so on. `stills.txt` lists them
in order.

## Fonts

From Fontsource (OFL): Tiny5 (all body text, desk text is Tiny5 only), Silkscreen Bold (RPG headers and labels), Micro 5
(narrow), Jacquarda Bastarda 9 (map titles and floor numerals). Files as `build.py` names them, e.g.
`tiny5-latin-400-normal.woff2` from `@fontsource/tiny5`. Press Start 2P, VT323, Jersey 10 and DotGothic16 only feed the
page's text test (not taken: the text stays Tiny5).
