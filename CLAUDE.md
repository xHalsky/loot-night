# Loot Night: working rules

Birthday-gift browser game: a loot-heavy idle RPG on the monitor while the player hides it from his girlfriend
(stealth layer), mom, boss, dog and tiredness. Vite + TypeScript, built to one self-contained `dist/index.html`.

## Where things are

| What | Where |
|---|---|
| Every number (timings, odds, costs, damage) | `src/config/tuning.ts` (never hard-code a balance number elsewhere) |
| Build version | `src/config/version.ts` |
| Game state types + new-game state | `src/core/state.ts` |
| Rules (no drawing) | `src/systems/*.ts` |
| Drawing + DOM | `src/ui/*.ts`, `src/style.css`, `src/ios.css` |
| Content tables (enemies, items, lines) | `src/data/*.ts` |
| Old design mockups | `design/mockups/` |
| Tests | `test/` (see below) |

## Commands

    npm install
    npm run dev                      # play locally
    npm run build                    # single-file dist/index.html
    npx tsc                          # type check (must be clean)
    npx tsx test/sim.ts good         # headless bot plays one night, prints a JSON summary
    npx tsx test/sim.ts idle         # bot that never hides (should get caught)
    npx tsx test/alttab.ts           # alt-tab timing acceptance test
    python3 test/<name>.py           # Playwright screenshot scripts (Chrome at /usr/bin/google-chrome)

Debug overlay in game: F1.

## How a change goes in (every round)

1. **Backlog first.** Each request becomes or updates a GitHub Issue in xHalsky/loot-night
   (labels: feature, bug, art, balance, ui, tech; priority p1/p2/p3). Ideas that aren't scheduled stay open as `idea`.
2. **Build it.** Numbers in `tuning.ts`. Keep `npx tsc` clean.
3. **Verify.** Run the bot sims (good + idle) and screenshot the changed screens. A change that alters
   balance notes the before/after sim numbers in the changelog.
4. **Document.**
   - `CHANGELOG.md`: one entry per version (what changed and why, issue numbers).
   - Bump `src/config/version.ts` (shown on the title screen).
   - The design bible describes the game *as it is now*: edit the affected section in place, never append
     "round N" notes to it. Record the decision and rejected alternatives in that section.
5. **Commit** with the issue numbers (`Fixes #12`), tag the version (`git tag v0.15.0`), push.
6. **Publish** the build: claude.ai artifact slug `3ca28f2d-6c48-46ca-993c-0e84527c24de` (Loot Night – Night 1 prototype).

Only one session edits the design bible at a time; other sessions open Issues instead of editing it.

## Conventions

- Player-facing text: plain, short, funny where it fits. No em dashes.
- Characters (her, the guy, the dog) go through `src/ui/pixel.ts` (vector shapes → hard edges → 1px outline).
  They are placeholders for hand-made pixel sprites.
- Three UI flavours: RPG (Pixelify Sans, stone/parchment), real life (Inter, iOS phone, modern OS),
  her (Patrick Hand, warm, blueprint map).
- Every minigame window needs the grey/red close button (`.mg-close`); every interrupt must be escapable.
