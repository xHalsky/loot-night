# Tech

## Now

**Stack.** Vite + TypeScript (strict), no framework, no engine. `vite-plugin-singlefile` builds one
self-contained `dist/index.html` that runs from any static host or as a claude.ai artifact.

**Structure** (file map in `CLAUDE.md`):
- One game state `S.g`; the current night is `N()` (`src/core/state.ts`).
- A fixed 60 Hz loop (`src/core/loop.ts`) runs the systems in order; systems in `src/systems/` hold rules
  and never draw.
- `src/ui/` renders from state: canvas for the monitor, door, desk effects and Monster scene; DOM for
  panels and windows via HTML strings with a diff cache (`setHtml`), plus `updateWindowDynamics` for
  per-frame tweaks.
- Numbers in `src/config/tuning.ts`, content in `src/data/`.

**Input.** One action at a time (`n.action`); `n.switching` blocks input during alt-tab via a capture
listener; microsleeps swallow the first input.

**Save.** `localStorage` key `lootnight.save.v1`: progress only (heroes, bag, gold, scraps, zł, buildings,
sleep debt, cans, stars, record, pending listings, auto-salvage). Saved at night end, morning and on
building. A night in progress is not saved.

**Debug overlay** (F1): live state, time scale, spawn buttons for visits, interrupts and drops, meter setters.

**Tests.**
- `npx tsx test/sim.ts good` / `idle`: a headless bot plays one night and prints a JSON summary
  (depth, stars, catches, wakes). Run both on every balance change and note before/after in the changelog.
- `npx tsx test/alttab.ts`: the alt-tab timing acceptance test.
- `npx tsx test/autopilot.ts [trials]`: present vs. 40 s away at bosses and normal floors (wipes, party HP).
- Playwright scripts reach game state through `window.__lootnight.S` (a test hook in `main.ts`).
- `python3 test/*.py`: Playwright screenshot scripts (Chrome at `/usr/bin/google-chrome`).

## Decisions

- **No engine.** A browser gift that opens from one file; DOM is fine for menus, canvas for scenes.
- **Rules never draw, UI never owns rules**, so the headless bot can play the real game code.
- **One self-contained HTML file** so the build can be shared as an artifact link.

## Known debt

- Some content still lives in UI files (town chat phrases in `ui/town.ts`, cable colours and count in
  `systems/pets.ts`); move to `src/data/` and `tuning.ts` when touched.
- Unused leftovers: `FURNITURE` in `data/content.ts` (replaced by `data/city.ts`, kept for save migration
  only in `applyCity`).
- Tag pushes blocked from Claude sessions: #11.
