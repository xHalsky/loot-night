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
- **Real life, step 3 (#54), 0.63.0 and 0.64.0:** the three stars and their morning rewards (night.md); the phone
  retune: the night script, one demand at a time, Speaker, Do Not Disturb (desk.md).
- **V8, the phone in your hand, 0.65.0;** **V3, the desk and monitor, 0.66.0:** the whole right screen round the game
  screen is drawn by the renderer from `render/deskView.ts` (desk.js `drawDeskLive`), lit by what the monitor shows;
  the desk's DOM (bezel, taskbar, keyboard, phone, the Tonight note, the YOU and feed cards) is gone (screen.md).
  Left as DOM for now: the pop-up windows, Excel's content (its step).
- **V5, the energy break, 0.68.0:** the five scenes ray-cast through their cameras over the dimmed right screen, on the
  game's own physics (desk.md, Goblin Fuel energy break); baked ahead in idle time.
- **V10, the morning, 0.72.0:** her CG by how the night ended, the caption and the summary with the stars' rewards,
  all the renderer's, from the game's numbers (night.md). The results card before it is still the build's.
- **V9, her windows, 0.71.0:** the cuddle break in her PC-98 window over the dimmed right screen, the plan as the
  page's pixel blueprint, from the game's current layout until V12 brings the new one (her.md).
- **V7, caught, 0.70.0:** her PC-98 portrait in the doorway over the whole frame, the text window with what the catch
  cost, the 0.8 s scare, then held until a click or a key (her.md, the caught screen).
- **V6, the dog and the cable fix, 0.69.0:** the shiba on the desk and over the screen's edge (an overlay canvas),
  NO SIGNAL on the monitor, the back of the monitor in the energy break's window (desk.md, the dog and the cables).
- **V4, her panel and his chair, 0.67.0:** the webcam stays the game's own drawing and is dithered onto the grid every
  webcam frame as the stills were baked; her PC-98 UI from `render/herView.ts`; his gaming chair in `ui/him.ts`
  (screen.md).

- **The 15-minute gate** (handoff step 1: the RPG alone must hold 15 minutes before step 3) moved to after the
  redesign (Paweł, 2026-11-24): it needs number tuning first. Step 3 starts without it.

## Approach

- **Each RPG system is reworked and drawn in the new look in the same step**, so the old RPG UI (`ui/monitor.ts`,
  `ui/dungeon.ts`, `ui/town.ts`, `ui/townMap.ts`, the side panel in `ui/panels.ts`) is never adapted only to be
  thrown away. Where a step can't wait for its new drawing, the old UI gets the smallest change that keeps it working.
  The RPG's old UI is gone (0.62.3); the same holds for real life from step 3: each area's old DOM goes when its
  new drawing lands.
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
| 6 | #52 1.6 and 1.7: marching order, auras, swaps, the Hook (§5d); Garrote | 0.56.0 |
| 7 | #52 1.8 and 1.9: loot rules, sets, legendaries; tuning to the pacing targets | 0.58.0 (loot rules), 0.59.0 (tuning) |
| 8 | V2: town (Ravenhold, §6) with #53 | 0.60.0: the trees, the Skill Tree tab and the tree screen; 0.61.0: the whole side panel in the renderer; 0.62.0: the town map in the renderer, services as Town-tab pages, party cards drag to reorder |
| 9 | #54: the three stars; the phone retune | 0.63.0, 0.64.0 |
| 10 | V8 (#73): the phone in your hand | 0.65.0 |
| 11 | V3 (#68): the desk and monitor round the game screen | 0.66.0 |
| 12 | V4 (#69): her panel and his chair | 0.67.0 |
| 13 | V5 (#70): the energy break | 0.68.0 |
| 14 | V6 (#71): the dog and the cable fix | 0.69.0 |
| 15 | V7 (#72): caught | 0.70.0 |
| 16 | V9 (#74): her windows (the cuddle break, the plan) | 0.71.0 |
| 17 | V10 (#75): the morning | 0.72.0 |
