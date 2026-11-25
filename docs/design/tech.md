# Tech

## Now

**Stack.** Vite + TypeScript (strict), no framework, no engine. `vite-plugin-singlefile` builds one
self-contained `dist/index.html` that runs from any static host or as a claude.ai artifact.

**Structure** (file map in `CLAUDE.md`):
- One game state `S.g`; the current night is `N()` (`src/core/state.ts`).
- A fixed 60 Hz loop (`src/core/loop.ts`) runs the systems in order; systems in `src/systems/` hold rules
  and never draw.
- `src/ui/` renders from state: canvas for the monitor, door, desk effects and Goblin Fuel scene; DOM for
  panels and windows via HTML strings with a diff cache (`setHtml`), plus `updateWindowDynamics` for
  per-frame tweaks.
- Numbers in `src/config/tuning.ts`, content in `src/data/`.
- `src/render/`: the redesign's renderer (V1, #66). The mockup page's modules (`src/render/page/`, copied from
  `design/redesign/page/` and edited from here on) share one scope as they did on the page: the `pagekit` plugin in
  `vite.config.ts` concatenates them in the order of `page/ORDER` with `facade.js` at the end into one module,
  `virtual:pagekit`. The game reaches it only through `PK` (types in `pagekit.d.ts`). It draws into palette-index
  buffers on the CPU (Moonwell 32, Graphite, PC-98; Bayer 8 × 8 dither; UI palette-exact) and hands back canvases
  at grid size. `grid.ts` holds the 640 × 360 grid and its whole-number scale. `rpgView.ts` reads the game into a view
  model (no rules), `liveRpg.ts` draws it into `#rpgArea` at 30 fps and turns clicks and hovers into the game's
  actions through the hit regions the renderer returns (grid px). The panel goes the same way into `#spArea`, the phone in your hand
  (`phoneView.ts`) into `#phHand`, her panel (`herView.ts`; the webcam canvas `#doorCanvas` stays drawn, hidden, and is
  dithered onto the grid at 15 fps) into `#herArea`, and the right screen round the game screen (`deskView.ts`) into
  `#rsArea` under them all: 15 fps, built on one frame and lit on the next, both on frames the battle area and the panel
  skip (`liveDrewAt`), because a whole desk costs about 7 ms on the CPU. The energy break (`ui/monsterScene.ts` gives
  the view, the renderer's `PK.ebMap` the cameras) goes into `#ebArea` over the whole right screen at 30 fps, its
  scenes baked ahead in `requestIdleCallback` time; under it the battle area and the desk draw four times a second.

**Input.** One action at a time (`n.action`); `n.switching` blocks input during alt-tab via a capture
listener; microsleeps swallow the first input.

**Save.** `localStorage` key `lootnight.save.v2` (v1 saves start fresh since 0.51): progress only (heroes, bag, gold, scraps, zł, buildings,
sleep debt, cans, stars, record, pending listings, auto-salvage). Saved at night end, morning and on
building. A night in progress is not saved.

**Debug overlay** (F1): live state, time scale, Real life on/off (#52: nobody home, no Tiredness, Noise, Mood or night
clock), live pacing numbers (`systems/pacing.ts`), spawn buttons for visits, interrupts and drops, meter setters,
and "Redesign frame": the mockup's frame (Dungeon, Battle, Map, Town, Q4) drawn by the renderer over the game.

**Tests.**
- `npx tsx test/sim.ts good` / `idle`: a headless bot plays one night and prints a JSON summary
  (depth, stars, catches, wakes). Run both on every balance change and note before/after in the changelog.
- `npx tsx test/alttab.ts`: the alt-tab timing acceptance test.
- `npx tsx test/noise.ts`: Noise by distance and masking (shower vs. next door).
- `npx tsx test/autopilot.ts [trials]`: three players at the same fight (smart: answers the boss wind-up;
  spam: skills on cooldown; away: 40 s on Excel). Reports wipes, the lowest party HP during the fight, close
  calls (survived under 25%) and fight length.
- `python3 test/boss.py`: screenshot of the boss cast bar.
- Playwright scripts reach game state through `window.__lootnight.S` (a test hook in `main.ts`).
- `python3 test/*.py`: Playwright screenshot scripts (Chrome at `/usr/bin/google-chrome`).
- `node test/pkcheck/build.mjs && python3 test/pkcheck/check.py`: builds the renderer alone and compares its default
  frame with `design/redesign/stills/00-default`; prints ms per frame. `node test/pkcheck/dups.mjs`: names declared
  twice at the top level of the page modules (a module can't redeclare them; the page's later one won).
- `python3 test/her_native.py`, `test/her_redesign.py`: her art at game pixels, and the scenes being redrawn.

## Decisions

- **No engine.** A browser gift that opens from one file; DOM is fine for menus, canvas for scenes.
- **Rules never draw, UI never owns rules**, so the headless bot can play the real game code.
- **One self-contained HTML file** so the build can be shared as an artifact link.
- **The redesign's renderer is the mockup's own code** (V1, 0.50): the page was approved state by state, so its
  drawing code is the spec. It comes in nearly verbatim and is wired to game state through the facade, area by area
  (V2 onward). Rejected: redrawing every screen in TypeScript (weeks of work to reach what the page already draws);
  turning the 13,000 lines into ES modules with imports (they share mutable globals such as `W`, `MAT`, `CLIP`, so
  every write would need a setter). The three names the page declared twice (`skull`, `flame`, `wrapTiny`) keep the
  page's behaviour: the later one wins, the earlier is renamed `*_shadowed`.

## Known debt

- Some content still lives outside `src/data/` (cable colours and count in `systems/pets.ts`); move to
  `src/data/` and `tuning.ts` when touched.
- The RPG's old drawing (DOM side panel, town windows, canvas town, sprites) went in 0.62.3. Unused exports left
  in rules and real-life code (`healParty`, `anyBoss`, `moodLabel`, a few layout constants) go when touched.
- Tag pushes blocked from Claude sessions: #11.
- The renderer draws on the CPU: in headless Chrome (2 cores) the full frame takes 50 to 70 ms and the RPG screen
  about 22 ms. Before it drives the game every frame (V2), static parts need caching or a lower redraw rate.
- The page modules are plain JS (no type checks); the facade's types are hand-written.
