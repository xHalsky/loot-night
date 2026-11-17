# Screen, look and sound

## Now

**One screen, three columns**, base 1280 × 720, scaled to the window.

| Column | Shows |
|---|---|
| Left (her) | The webcam view (280 × 532): him low on the left, your door behind him (hold it to peek), the plan taped on the wall. Under it: the last-heard line, her note, the "before" row, her stats |
| Centre (desk) | The monitor (game, city, Excel, minigames), and below it the desk: keyboard and mouse centred on a mat, phone, headset, Monster fridge, cans; the bin behind the monitor. The dog and her desk visit overlay it. |
| Right (RPG) | Top to bottom: YOU (Noise, Tired), Feed, run progress (floor, checkpoint, Flow, Zone), Party (paper doll), Backpack |

**Monitor chrome.** A desktop taskbar under the screen: app buttons for Loot Night and Excel, the zł
wallet, the night clock with the bedtime note (red after 01:00), and the power button "Sleep" (from 23:00).
Buffs bar top right; city portal top left; skill bar along the bottom in the dungeon.

**The Feed** is an MMO chat window (General / Combat / Loot / Her tabs, timestamps, the last lines,
a fake "Press Enter to chat"). Game messages go here, never over the monitor.

**Three UI flavours.** Every element belongs to one world, so the player knows at a glance what it is for.

| World | Where | Look |
|---|---|---|
| Her | Webcam view, her note, her stats | Warm plum night, Patrick Hand handwriting, cream note cards, the blueprint as a taped sheet. Warnings turn amber, alarms red and shaking. |
| Real life | Desk, phone, Excel, taskbar, YOU box | Inter, flat panels, iOS and Windows conventions |
| RPG | Monitor game, right panel | Pixelify Sans, gold-trimmed headers, stone, parchment and leather |

**Art direction.** Placeholder art drawn in code, aiming at pixel anime (references: ZATO). Characters
(her, the guy, the dog) go through one pipeline in `src/ui/pixel.ts`: vector shapes rendered small, alpha
snapped to hard edges, a 1px dark outline (`#2e161c`), nearest-neighbour upscale; cel shading by a shadow
colour with the base shifted up-left. Her: big anime eyes (teal iris, heavy winged upper lashes, two
highlights), jagged bangs, long dark hair, a pink clip, cel-shaded clothes. Drawn at 1x at the door and
2x on the desk. Text always stays sharp on top.

**Audio** (`src/ui/audio.ts`, mix in `src/data/sounds.ts`, files in `src/assets/sfx/`). The stealth runs on
listening, so her sounds are the most important ones in the game.

- **Three buses:**
  - **apt:** her. The headset turns it down (`HEADSET_APT_VOLUME`) and low-passes it (`HEADSET_APT_LOWPASS`).
  - **game:** the RPG and the desk.
  - **loud:** the game through the speakers (boss slams, the enrage roar), never muffled.
- **Her by distance:** each of her sounds plays from her room. Volume and a wall low-pass come from
  `ROOM_DISTANCE` (`APT_ROOM_GAIN`, `APT_ROOM_LOWPASS`), so the TV next door is clear and the bedroom is faint.
  It is the same distance table that decides how much of your Noise reaches her.
- **Her activities:** a continuous loop while she is at it (TV, kettle rising towards the boil, shower), with
  extras on top (the laugh track; her breathing when asleep). The loop stops when the end cue starts (see
  [her.md](her.md)), when she moves and during visits.
- **Audio-first RPG events,** each recognisable with Excel covering the screen:

  | Event | Sound |
  |---|---|
  | Legendary | Fanfare with drums and sparkles |
  | Full bag | Thump, "nuh-uh" |
  | Goblin appears / caught / escapes | Giggle and coins / squeal / taunt, coins fading |
  | Hero down | Body thud, three sad notes |
  | Boss enrage | Roar |
  | Party wipe | Wah wah wah waaah, then the desk slam |

  Other rarities are bell pings that grow with rarity. Hits, abilities, level-ups and the UI stay chiptune.
- **Where the sounds come from** (`tools/sfx/make.py`, `python3 tools/sfx/make.py [cue...]`):
  - Kenney CC0 recordings (`tools/sfx/kenney/`): steps, door, latch, creaks, plates, tins, coins, impacts.
  - Seeded synthesis in Python for the rest: two-voice TV babble, laugh track, credits, kettle, shower, hair
    dryer, flush, tap, her voice and hums, phone vibration, the can, gulps, the dog, keys, the RPG cues.
- **Files:** mono MP3s, every one-shot loudness-matched so `MIX` is the mix. Through-wall sounds are 24 kHz
  / 32 kbps, the rest 32 kHz / 48 kbps. 72 files inlined into the build (about 560 KB of the 928 KB file).
  Loops carry 0.25 s of wrap-around on each side, so MP3 padding never makes a gap.
- **Your own recordings:** a file in `src/assets/sfx/own/` named after a cue (`step.mp3`, or `step_0.mp3`,
  `step_1.mp3` for variants) replaces that cue. The F1 debug panel has a sound board with every cue.
- `python3 test/sound.py` (Chrome): every file decodes, loop points, loops following her, the headset.

**Title screen** shows `PROTOTYPE v<version>` from `src/config/version.ts`.

**The webcam view** (`src/ui/door.ts`, him in `src/ui/him.ts`, #36). The left panel is what the webcam on top of
his monitor sees (a small webcam sits on the monitor bezel so the framing reads). Him, low on the left, facing
the camera in a gaming chair; your door behind him at the same size as before (the perspective is faked by
the floor running toward the camera). He may overlap only the door frame: never the doorway, the crack (the
door's right edge), the light gap under the door or her toes. While peeking he turns toward the door (the back
of his head). The key screenshot is her in the doorway behind his face: both read at once.
- **The plan on the wall** (#35): the blueprint is a sheet taped to the wall by the door. Click it (the cursor
  turns to a magnifier) and it opens large over the panel: the same plan with the dashed line of sight and no
  marker for her, plus a line on which rooms are next to yours. The game keeps running. Close with ✕, Esc or a
  click outside.
- **Under the view:** the last-heard line (hidden while she stands in the doorway), her note, the "before" row
  (hidden during a visit: every action is "too late" then) and her stats.

## Decisions

- **Webcam view instead of the blueprint panel** (0.35): the blueprint's jobs moved out (the last sound to one
  line, peeking to the crack, the layout to the sheet on the wall), and the 190 px it took went to his face, so
  later his reactions and status (#37, #38) can show what the player's character feels. Rejected: keeping the
  blueprint smaller next to his face (two pictures fighting in 280 px); a separate face box under the door
  (the face and her in the doorway would not read as one scene).
- **The door moved right, not smaller**: it keeps its size so her and the toes stay readable; the left strip
  holds the plan, and he sits under it.
- **The shower panel became his daydream** (0.35): it lived over the map. Now, while she showers and you can
  hear it, a thought bubble rises from his head with the frosted cabin. It hides when peeking, during visits and
  when she moves, so it never covers the crack or her. Rejected: dropping it (the crack already shows a frosted
  shape, but small); showing it on the plan overlay (the plan must stay a plain map).

- **The door gets the most space in the left column**: it is where the eye candy and the threat live.
- **Feed in the right panel** replaced an older CITY / SKILLS box; messages over the monitor hid the game.
- **Three flavours** (playtest 4): mixing RPG and real-life styles made it unclear what belonged where.
- **Code-drawn placeholders** keep iteration fast; final sprites replace them later without logic changes.
- **Audio sources (0.33):** Kenney CC0 recordings where one exists, seeded synthesis baked to files for the rest.
  Rejected:
  - Generated tones at runtime: they undersold the listening game.
  - Only recordings: none of the reachable CC0 packs has a TV, a kettle, a shower, a dog or a phone on a desk.
  - Waiting for hand-recorded files: kept open through `own/` instead.
- **MP3, not Ogg or Opus:** every browser decodes it, older Safari included. The cost is encoder padding, which the
  loop pad absorbs.
- **The RPG stays chiptune:** it is a game on a monitor, and the contrast makes her real sounds stand out.
  Only the five audio-first events got designed sounds.
- **Size:** the build grows to 928 KB, still one file that loads instantly. Lower bitrates were not worth it:
  through-wall sounds are already 32 kbps.

## Planned

- Hand-made pixel sprites for all characters and the dungeon: #5.
- Background music: #32 (must stay under her sounds and duck at the door).
