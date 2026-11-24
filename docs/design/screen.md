# Screen, look and sound

## Now

**One screen, monitor first** (#49) on **one 640 × 360 pixel grid** (V1, #66; grid doc §1), shown at a whole number
of device pixels per grid pixel (×2 720p and the Steam Deck, ×3 1080p, ×4 1440p, ×6 4K) and letterboxed in anything
else (`src/render/grid.ts`). The DOM parts are still laid out at ×2 (1280 × 720, sizes in `src/ui/layout.ts`, all
even) while they move onto the grid; the redesign's renderer (`src/render/`, tech.md) draws at grid size.

| Zone | Where | Shows |
|---|---|---|
| Left: webcam and her | 0 to 296, full height | The webcam view (296 × 532): his dark room, him at the bottom, your door behind him (hold it to peek), the plan on the wall. His head is the headset button. Under it: the last-heard line, her note, the pre-emptive buttons, her stats (Patience and Caught, Goodwill, Noise, Waking up after midnight) |
| Monitor | the desk's top: a 968 × 518 bezel with a webcam on its top edge | The game screen (948 × 464) and, under it, the OS taskbar (30 px) |
| · Battle area | the game screen's left 668 px (334 × 232 on the grid) | In the dungeon, drawn by the redesign's renderer (V2, [dungeon.md](dungeon.md)): the band (64) with the curio card, the picture (142), the skill bar (26), the corner, the portal, the buffs. The city and the floor map are still the old drawing (668 × 464, see [city.md](city.md)) with their DOM overlays. Item windows and minigame windows stay on top |
| · Side panel | the game screen's right 280 px, full height | Dungeon: party cards, the selected hero's gear and stats, the bag with its Treasury row, gold, scraps and record. City: the build list, the "Enter the dungeon" button, the bag (the services are the buildings on the map) |
| Desk | under the monitor, 192 px | The phone (drawn 1.38x, running off the bottom edge), the keyboard, mat and mouse (1.5x, top rows only), tonight's sticky note stuck on the bezel's bottom edge. The YOU card and the feed card sit bottom right. The dog rises over the desk edge; her desk visit covers the battle area |

**Everything RPG is on the monitor.** Excel, the monitor going off and the alt-tab switch hide all of it, the
side panel included. Real life stays: her panel, the desk, the YOU card and the feed.

**The corner, not a top bar.** The game has no top bar: "Shadow Crypt · floor 4 · battle 1/3" (plus the floor's
map and "boss floor") and "Flow x1.4" with a small bar sit in the battle's top-left corner, 10 px at about 70%,
on no plate. Each time Flow passes a step of `FLOW_GLOW_STEP` (0.5) the Flow text brightens, grows and glows gold
for `FLOW_GLOW_SEC`. The town portal button sits under it. The city's corner reads "Ravenhold · town".

**The side panel** (140 × 232 on the grid, drawn by the redesign's renderer since 0.61: `livePanelAll` in
`src/render/page/live.js` from the view in `src/render/rpgView.ts`; grid doc §5, §6b). In the dungeon: four party cards
(portrait in the class outline, short name, "Lv5", power, a thin XP line, a red "!" when a hero falls behind; no HP);
click one to select it, drop an item on one to equip it. The selected hero: an engraved strip ("KNIGHTENSTEIN Knight
◆44"), a 3 × 2 gear grid (weapon, helm, armor / boots, ring, trinket; power in the corner) and the six stats with the
gear's share. The bag: "BAG 7/18" and the AUTO salvage switch in its header, 6 × 3 slots, then the Treasury row (the
building opens 2 per level, the rest show a lock). A cell: the rarity light, the icon, its power, NEW, a lock, a
green ▲ when it is an upgrade for someone, dashes when it is unbanked, a gold frame when picked. The footer: gold ·
Souls, and the deepest floor ever. In town three tabs over it (Town: the build list, the way down and the bag;
Inventory: as in the dungeon; Skill Tree: [trees.md](trees.md)). Drag from the bag onto a gear slot or a card to
equip, from a slot onto the bag to unequip; right-click equips on the selected hero (or unequips); hover for the
tooltip; L locks. HP shows only on the battle sprites and the skill-bar portraits.

**Item windows** (details of a clicked item, the bag-full popup) open over the side panel's top block (the party and
gear, or the city menu), so the bag below stays clickable and the battle stays in view. They are still DOM, over the
panel's canvas, until the redesign draws them. Details: name, rarity, slot,
item level and power, the affixes in two columns, and one Equip button per hero with the power change (▲ +4).
They slow nothing: the fight and the clock keep going while you look (#49).

**Loot pickup.** When the front hero walks over a drop, its name flies up from where it lay, in its rarity colour on
a dark outline (`LOOT_FLY_SEC`; legendaries `LOOT_FLY_LEGENDARY_SEC`); a batch is spaced `LOOT_FLY_STAGGER_SEC`
apart and fanned sideways. Its bag slot shines with a NEW badge for `BAG_NEW_SEC`, and a LOOT line goes to the feed.

**The YOU card** (real life, bottom right of the desk): Tired (violet, a mark where yawning starts,
`TIRED_YAWN`) and Zone (cyan, the headset's colour), and the **Goblin Fuel button** (key M): the can count and
"Drink · M". It glows amber only from `TIRED_YAWN` while a can is left and no boost runs (time to top up). During
a visit's footsteps it reads "Hide the cans" (no glow); after hiding, "Hidden" until she leaves; greyed with no cans
or while your hands are busy. Boost and crash stay in the buffs.

**The feed card**, under it: the last six lines, newest on top, older ones fading, two lines at most each. Each line
has its time and a tag for whose it is: YOU, LOOT (in the rarity colour), HER, PHONE, GAME, EXCEL, DOG, NIGHT,
PARTY, GUILD, or a friend's name (MAGOO, HEALERO). A first-time tip is pinned on top while it lasts. No header, no tabs.

**Monitor chrome.** The taskbar under the screen: app buttons for Loot Night and Excel ("Tab = switch"), the zł
wallet, the night clock (red with "witching hour" after 01:00) and the power button "Sleep" (from 23:00). The
Loot Night button flashes when the party is in trouble while you are away. Buffs: top right of the battle area.

**Three UI flavours.** Every element belongs to one world, so the player knows at a glance what it is for.

| World | Where | Look |
|---|---|---|
| Her | Webcam view, her note, her stats | Warm plum night, Patrick Hand handwriting, cream note cards, the blueprint as a taped sheet. Warnings turn amber, alarms red and shaking. |
| Real life | Desk, phone, Excel, taskbar, YOU card, feed | Inter, flat panels, iOS and Windows conventions |
| RPG | The game screen: battle, overlays, side panel | Pixelify Sans, gold-trimmed headers, stone, parchment and leather |

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

**Title screen** shows `PROTOTYPE v<version>` from `src/config/version.ts`, a two-line pitch and "turn the sound
on". The first night opens with the how-to-hide card ([night.md](night.md), Onboarding).

**The webcam view** (`src/ui/door.ts`, him in `src/ui/him.ts`; #36, #40). Laid out for 280 px and centred in the
296 px column; the walls and floor run on to the edges. The left panel is what the webcam on
top of his monitor sees (a small webcam sits on the monitor bezel so the framing reads). His room is dark:
black and grey walls, floor and door. The only warm light is hers: the gap under the door, the hallway in the
crack, her in the doorway. Him: centred at the bottom, a bust, so his hair stays just below the light gap. Your
door behind him, centred in the frame above him, at the same size as before (the perspective is faked by the
floor running toward the camera).
He never covers the doorway, the crack (the door's right edge), the light gap under the door or her toes. While
peeking he turns toward the door (the back of his head). The key screenshot is her in the doorway with him in
front, below her: both read at once.
- **His look** (#40): a silhouette, near black with a grey rim and a soft backlight, and glasses that catch the
  screen and shine white (with a soft bloom tinted by what is on the monitor: cool for the game, green-white for
  Excel). No eyes and no mouth: mysterious and stoic, the serious one in a comedy anime. The face only breaks
  for the embarrassing moments, and then it goes all the way (comedy anime emotes).
- **His face** (`src/systems/him.ts` rules, `src/ui/him.ts` art; #37, #38). Automatic, no emote button. Like
  the face in Doom's status bar, it shows what is going on without a meter. Reactions win over status.

  | Moment | His face | Stoic or emote |
  |---|---|---|
  | Nothing happening | Silhouette, shining glasses | Stoic |
  | She comes in | A wobbly mouth and a big sweat drop, head turned to her | Emote |
  | Pass / she leaves happy | A small exhale puff (lingers `HIS_RELIEF_SEC`) | Stoic |
  | Caught | Glasses become popping eyes, mouth wide open, sweat everywhere, before the jumpscare | Emote |
  | Cuddle ask, lean visit, good night | Glasses fog pink, blush lines, steam from his head | Emote |
  | Chat answers | Good: a grin. Meh: a short flat line. Rude: a smirk and a glint on his glasses | Small |
  | Snack offered / taken | The grin | Emote |
  | Epic or better drop (`HIS_GRIN_RARITY`) | A wide, slightly evil grin and a glint, for `HIS_GRIN_SEC` | Emote |
  | A new sound of her | His head and glasses turn to its side for `HIS_FLICK_SEC` (`ROOM_LOOK`: the living room left; the hallway, kitchen, bathroom and bedroom right, the sides the crack shows them on). Not with the headset on: that is what the headset costs | Stoic |
  | Tired (`TIRED_YAWN`+) | The glasses dim and sit lower; he yawns with the yawn (mouth wide) | Stoic / emote |
  | Microsleep (`TIRED_MICROSLEEP`+) | Nods off: glasses slide down his nose, eyes shut above them, head drops, "z" (seen while the lids close) | Emote |
  | Full Zone | Hands steepled in front of his face, a glint, a purple glow | Stoic |
  | Goblin Fuel boost | Jittery | Stoic |
  | Headset worn | On his head, a cyan strip on each cup (the Zone's colour) | Gear |

  Art: one head pose; the emotes and the glasses as layers on the silhouette; gear as separate layers, so a
  real-life upgrade (#4) is one more layer. `python3 test/him.py` shoots every row.
- **His head is the headset button** (#49): click it (or press H). A small headset icon beside his head is always
  there, grey when off and cyan when on. Hover: a cyan ring and "Click: headset on (H)" under his head (never over
  the door). A coach mark teaches it after your first passed visit, unless you found the headset first.
- **The plan on the wall** (#35, #41): only the corner of a blue sheet taped to the wall shows, coming in from the
  left edge of the frame; that corner is the click area. Click it (the cursor
  turns to a magnifier) and it opens large over the panel: the same plan with the dashed line of sight and no
  marker for her, plus a line on which rooms are next to yours. The game keeps running. Close with ✕, Esc or a
  click outside.
- **Under the view:** fixed slots that never move (#46): the last-heard line (18 px; blank while she stands in
  the doorway), her note (60 px, two lines), the pre-emptive buttons (30 px; hidden during a visit, when her note
  may grow into its space for a chat question and its replies) and her stats, 17 px rows: Patience and Caught,
  Goodwill, Noise (amber; once she is asleep a mark at `WAKE_NOISE_FLOOR`, the Noise that wakes her; no mark
  before, since what reaches her depends on where she is), and Waking up after midnight. An empty slot keeps its
  space, so Patience and Goodwill are always in the same place. `python3 test/herpanel.py` checks ten states.

**Tooltips** carry only what you need to decide, because the screen is dense and a tooltip covers part of it:
what it is, what it does in one line, and a cost, an unlock level or the one comparison that matters (an
item: ▲ / ▼ power for the selected hero). Never formulas, prices, control hints or "use it when" advice;
the click panels and the design docs hold the detail. `python3 test/tooltips.py` hovers each kind.

## Decisions

- **Monitor first** (0.45, #49): the right RPG panel is gone and every RPG element lives on a bigger monitor, with a
  side panel inside the game screen (as in Loop Hero), so the game you hide is one thing on one screen, and Excel
  hides all of it. The left column grew to 296 px. Rejected: keeping the right panel (two places to look for the
  RPG, and the game on the monitor stayed small); a PC tower with a sensor screen and a second monitor (both
  smaller screens, more set dressing to read); one card for YOU and the feed (less room for the feed).
- **No top bar in the game** (0.45): floor, battle and Flow are glanced at, not read, so they became a quiet corner
  overlay and the side panel runs full height. Flow's step-up glow tells you it grew without a number to watch.
- **No cans, fridge or headset on the desk** (0.45): the Goblin Fuel button (M) and his head (H) do their jobs, and the
  desk got room for a bigger phone and keyboard. The snack run's rule stays: the button turns into "Hide the cans"
  during the footsteps. Rejected: keeping the cans for the snack-run tell (the button carries it).
- **HP only on the sprites and the skill-bar portraits** (0.45): one value in one place; the party cards show what
  you decide gear with (level, power, "needs gear").
- **Item windows over the party block, and they slow nothing** (0.46, #49): the fight used to slow to 30% while one
  was open, a crutch from when the bag sat in a separate panel and looking at it meant looking away; it also let you
  slow a boss fight on purpose. Now the window covers only the party and gear (its Equip buttons replace them), the
  bag stays clickable for the bag-full swap, and the battle stays in view. Rejected: the top right of the battle
  area (0.45; it covered the boss's cast bar); pausing the fight (gearing is meant to be part of the juggle).
- **Her desk visit covers the battle area only** (0.45): the side panel stays usable, as the right panel was.
- **Sizes on an even grid** (0.45): every layout number is even, so a 640 × 360 pixel-art version can scale by 2.
- **Whole-number scales only, letterboxed** (0.50, V1): a fractional scale smears the 1 px outlines and the dither.
  The scale is counted in device pixels, so a laptop at 125% OS zoom still gets exact pixels. Rejected: a 960 × 540
  grid for bigger text (no whole-number scale at 1440p or on the Steam Deck; decisions 2026-11-20); filling the
  window at any scale (it was the old behaviour).

- **Fixed slots under the webcam** (0.44, #46): the stats jumped up whenever the last-heard line or the
  "before" row hid (a catch, a visit), so your eye lost Patience exactly when it mattered. Every row now has a
  fixed slot; a long note is clamped to two lines, a visit note with replies uses the empty "before" slot.
  Rejected: moving the stats above the note (the note is the thing to read first); shrinking the webcam.

- **Tooltips trimmed to the crucial** (0.42, #43): they had grown to 8 to 12 lines (formulas, auto attacks, stat
  lines, prices, control hints, backfires, repeat rules) and covered the door, the skill bar or the bag. Now 2
  to 6 lines. Rejected: a "more info" key (one more thing to learn); smaller text (the pixel font is already at
  its smallest readable size).

- **Webcam view instead of the blueprint panel** (0.35): the blueprint's jobs moved out (the last sound to one
  line, peeking to the crack, the layout to the sheet on the wall), and the 190 px it took went to his face, so
  later his reactions and status (#37, #38) can show what the player's character feels. Rejected: keeping the
  blueprint smaller next to his face (two pictures fighting in 280 px); a separate face box under the door
  (the face and her in the doorway would not read as one scene).
- **A stoic silhouette, not a cartoon face** (0.37, #40, replaces the cel-shaded face of 0.35 to 0.36): the
  shining glasses make him mysterious and leave the jokes to the emotes, so an embarrassing moment lands
  harder. Centred at the bottom instead of low on the left: the eye goes to him first, and below the door he
  still never covers her. The dark grey room keeps her warm world the only colour. Rejected: the goofy
  full-colour face (every reaction felt equally loud); visible eyes behind the glasses (they break the
  mystery); a coloured hoodie (reads as a costume, not a silhouette).
- **His face reacts by itself** (0.36): no emote button, because the player's hands are busy and the face is
  for reading the moment, not for input. His reactions to her sounds stop under the headset, so the face also
  teaches what the headset costs. Rejected: a face that mirrors her Mood (her hearts already do that); a big
  expression set (six or so plus gear layers keeps the hand-made sprites in #5 cheap).
- **The door stays centred and at full size** (0.38, #41): her, the crack and her toes are what the panel is
  for, so the door keeps its size and sits in the middle, lined up with him. The plan only needs to be found
  and clicked, so just its corner shows at the left edge. Rejected: the door moved right to fit a whole plan
  sheet on the wall (0.35 to 0.37: an off-centre frame for a picture you only open).
- **The shower panel became his daydream** (0.35): it lived over the map. Now, while she showers and you can
  hear it, a thought bubble rises from his head with the frosted cabin. It hides when peeking, during visits and
  when she moves, so it never covers the crack or her. Rejected: dropping it (the crack already shows a frosted
  shape, but small); showing it on the plan overlay (the plan must stay a plain map).

- **The door gets the most space in the left column**: it is where the eye candy and the threat live.
- **The feed is a card on the desk** (0.45, #49; was an MMO chat window with tabs in the right panel): game messages
  never go over the monitor, which would hide the game. Tags replaced the tabs: one column to read, whose line it is at
  a glance. Rejected: tabs (nobody switched them); a header (space for one more line).
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
