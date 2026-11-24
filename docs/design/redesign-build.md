# The redesign build: how the handoff comes into the game

Working notes for the builder while the redesign handoff (#52 to #58, V1 to V13) goes in. The specs are elsewhere:
`design/redesign/grid-doc.md` (§), `design/redesign/decisions.md` (wins), `docs/design/handoff-redesign.md` (the
gameplay steps). This file says how the build gets there and where it stands. It goes once the handoff is in.

## Now

- **V1 (#66), 0.50.0:** the 640 × 360 grid at whole-number scales; the mockup page's code as the renderer
  (`src/render/`, tech.md); F1 "Redesign frame" shows the mockup's frame over the game.
- **#52 1.1 and 1.2, 0.51.0:** real life off, pacing numbers, real-time combat, three slots with the ultimate,
  no autopilot penalties, Flow speed, compounding numbers (dungeon.md). The old skill bar shows the third well as the
  ultimate's charge until V2 draws it.
- **V2, the battle area, 0.52.0:** the dungeon (walk, battle, curio, loot) is drawn by the renderer from the game
  (dungeon.md). The old canvas and its DOM overlays stand down there; the town and the floor map are still old.
- **#52 1.3 and 1.4, 0.53.0:** packs of six on screen with a reserve, drops per kill, no loot pause, runs from a
  checkpoint picker, unbanked loot, wipes that lose the run, Souls. The run card and the floor picker are on the
  old town drawing until V2 reaches the town.
- **#52 1.5b, 0.54.0:** run blessings from curios (dungeon.md).

## Approach

- **Each RPG system is reworked and drawn in the new look in the same step**, so the old RPG UI (`ui/monitor.ts`,
  `ui/dungeon.ts`, `ui/town.ts`, `ui/townMap.ts`, the side panel in `ui/panels.ts`) is never adapted only to be
  thrown away. Where a step can't wait for its new drawing, the old UI gets the smallest change that keeps it working.
- **The renderer stays the page's code.** New drawing for live state goes in `src/render/page/live.js` (in `ORDER`
  after the page's modules): functions that take a view model and reuse the page's pieces (`drawDungeon`, the rigs,
  `hpBar`, `markTag`, `windup`, `skillBar`, `curioWindow`, `sidePanel`...). `src/render/rpgView.ts` builds the view
  model from `S.g` / `N()`. Clicks and hovers come back as hit regions in grid pixels.
- **Character art stays a stand-in** (Paweł draws it all): enemies the page has no rig for are drawn with the
  nearest rig and options until his sprites land.

## Steps and status

| Step | What | Status |
|---|---|---|
| 1 | #52 1.1 and 1.2: real life off (F1), pacing numbers; real-time attack timers; two skills and the ultimate (3, E, D), ultimate charge, no autopilot skill use, Flow speed, exponential numbers | 0.51.0 |
| 2 | V2: the battle area drawn by the renderer from game state (walk, battle, curio, loot, corner, buffs, skill bar), clicks through hit regions | 0.52.0 |
| 3 | #52 1.3 and 1.4: floors with packs of six in two lanes, pickup during the walk; runs, checkpoints, wipes, unbanked loot, Souls | 0.53.0 |
| 4 | V2: the side panel (party, gear, stats, bag, footer): moved to step 8, with #53's tabs (Town, Inventory, Skill Tree), so the panel is redrawn once | later |
| 5 | #52 1.5 and 1.5b with the floor map (§5b): path cards, features, conditions, the away hourglass; run blessings (§5c) | 0.54.0 (blessings), 0.55.0 (route choice) |
| 6 | #52 1.6 and 1.7: marching order, auras, swaps, the Hook (§5d); Garrote | next |
| 7 | #52 1.8 and 1.9: loot rules, sets, legendaries; tuning to the pacing targets | |
| 8 | V2: town (Ravenhold, §6) with #53 | |
