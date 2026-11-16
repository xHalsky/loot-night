# Screen, look and sound

## Now

**One screen, three columns**, base 1280 × 720, scaled to the window.

| Column | Shows |
|---|---|
| Left (her) | The door (280 × 396, the eye-candy window), the blueprint, her stats |
| Centre (desk) | The monitor (game, city, Excel, minigames), and below it the desk: keyboard and mouse centred on a mat, phone, headset, Monster fridge, cans; the bin behind the monitor. The dog and her desk visit overlay it. |
| Right (RPG) | Top to bottom: YOU (Noise, Looks busy, Tired), Feed, run progress (floor, checkpoint, Flow, Zone), Party (paper doll), Backpack |

**Monitor chrome.** A desktop taskbar under the screen: app buttons for Loot Night and Excel, the zł
wallet, the night clock with the bedtime note (red after 01:00), and the power button "Sleep" (from 23:00).
Buffs bar top right; city portal top left; skill bar along the bottom in the dungeon.

**The Feed** is an MMO chat window (General / Combat / Loot / Her tabs, timestamps, the last lines,
a fake "Press Enter to chat"). Game messages go here, never over the monitor.

**Three UI flavours.** Every element belongs to one world, so the player knows at a glance what it is for.

| World | Where | Look |
|---|---|---|
| Her | Door, blueprint, her stats | Warm plum night, Patrick Hand handwriting, cream note cards, blueprint map. Warnings turn amber, alarms red and shaking. |
| Real life | Desk, phone, Excel, taskbar, YOU box | Inter, flat panels, iOS and Windows conventions |
| RPG | Monitor game, right panel | Pixelify Sans, gold-trimmed headers, stone, parchment and leather |

**Art direction.** Placeholder art drawn in code, aiming at pixel anime (references: ZATO). Characters
(her, the guy, the dog) go through one pipeline in `src/ui/pixel.ts`: vector shapes rendered small, alpha
snapped to hard edges, a 1px dark outline (`#2e161c`), nearest-neighbour upscale; cel shading by a shadow
colour with the base shifted up-left. Her: big anime eyes (teal iris, heavy winged upper lashes, two
highlights), jagged bangs, long dark hair, a pink clip, cel-shaded clothes. Drawn at 1x at the door and
2x on the desk. Text always stays sharp on top.

**Audio.** Generated tones and noise via Web Audio (`src/ui/audio.ts`): steps, handle, door, sting,
loot per rarity, vibrations, kettle/TV/flush/shower, monitor relay click. The headset muffles apartment
sounds (low-pass, `HEADSET_APT_VOLUME`).

**Title screen** shows `PROTOTYPE v<version>` from `src/config/version.ts`.

## Decisions

- **The door gets the most space in the left column**: it is where the eye candy and the threat live.
- **Feed in the right panel** replaced an older CITY / SKILLS box; messages over the monitor hid the game.
- **Three flavours** (playtest 4): mixing RPG and real-life styles made it unclear what belonged where.
- **Code-drawn placeholders** keep iteration fast; final sprites replace them later without logic changes.

## Planned

- Hand-made pixel sprites for all characters and the dungeon: #5.
- Real sound effects and music: #13.
- Audio-first loot cues (every important RPG event readable by ear): [synergy.md](synergy.md).
