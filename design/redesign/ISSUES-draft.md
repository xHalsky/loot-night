# Loot Night: draft Issues for the visual redesign

Drafts for xHalsky/loot-night, **approved by Paweł on 2026-11-24**: the build chat files them as written (this chat
can't write to the repo; from a cloud session use REST, as `CLAUDE.md` says). Thirteen new Issues (V1 to V13), in build order, and six comments for the gameplay Issues #52 to #57, whose steps
now carry their visuals. Specs: `claude/loot-night-rpg-grid.md` (§), decisions: `claude/loot-night-decisions.md` (wins),
overview: `claude/loot-night-redesign-index.md`. Mockups: the Game Frame page (its controls are named in each Issue)
and `design/redesign/stills/` from the handoff package. All character art is a code-drawn stand-in until Paweł's.

---

## V1. Redesign: the 640 × 360 grid, the palettes and the renderer

Labels: `art`, `tech`, `p1`

Everything else sits on this. Mockup: the page's View controls; still `00-default`.

- [ ] One internal grid, 640 × 360, for the whole game, UI and text; whole-number scales only (×2 720p and Steam Deck,
      ×3 1080p, ×4 1440p, ×6 4K), letterbox anything else (§1).
- [ ] Palette-index drawing with three palettes: Moonwell 32 (the RPG), Graphite (the desk, real life), PC-98 (her);
      UI-only slots kept out of the dither (Flow's two, steel, ember, the Windows 98 blues) (§8, §7; `palettes.json`).
- [ ] Bayer 8 × 8 ordered dither for the world; UI palette-exact; dark text never sits on a dither (§2).
- [ ] Fonts at their pixel-exact sizes: Tiny5 for all body text (desk text is Tiny5 only), Silkscreen Bold for RPG
      headers, Micro 5 where narrow, Jacquarda Bastarda 9 for map titles and floor numerals (§1).
- [ ] UI materials: bronze plates lit from the top left, recessed wells, carved mouldings, leather, soft cast shadows
      (§2). The actor separation pass: fill light, value lift, rim, outline, halo (§3).
- [ ] Meaning colours hold everywhere: gold the next action and money, crimson danger, moss success and zł, her pink,
      Zone cyan, Flow yellow (§8).

Done when: the frame renders crisp at ×2 and ×3 with all three palettes, and matches still `00-default`.

## V2. Redesign: the RPG screens (dungeon, battle, town) in Moonwell 32

Labels: `art`, `ui`, `p1`

Mockup: Screen (Dungeon, Battle, Town), Battle; stills `00-default` to `007`.

- [ ] The battle area 334 × 232 (band 64, picture 142, skill bar 26) and the side panel 140 × 232 (§1, §5).
- [ ] The skill bar: four heroes in marching order, each a portrait with its class outline, an HP tube, **two skill
      wells and the ultimate's gilded well** (gold frame, crest and gem, the key on a gold tab; ready, cooldown and
      locked states) (§5).
- [ ] Skill icons on class tiles (knight steel, Garrote cloak, mage violet, priest gilded) (§4); states: cooldown, combo,
      answer, queued, blocked, autocast loop (§5).
- [ ] The corner overlay, buffs, the curio card, HP bars, mark tags, **enemy casts as the name with a cast bar under
      it**, loot lying in its rarity light with the beam (§5).
- [ ] The heroes, Garrote (§4b) and the mob of six in two fodder lanes (§4c), drawn back to front (§3); the crypt.
- [ ] Ravenhold, 16-bit: masonry, roofs per trade, cobbles, moon shadows, the diegetic signs and hover halos (§6).
- [ ] The floor map's vellum, ink and roundels (§5; the route choice itself is #52).

## V3. Redesign: the desk and the monitor (real life)

Labels: `art`, `ui`, `p2`

Mockup: Frame: Desk + monitor; Desk and room: Moment; stills `023` to `027`.

- [ ] Graphite, a dark room lit almost only by the monitor; the desk's light sampled from the screen (§7).
- [ ] One camera for the desk (eye at the monitor's top edge); the keyboard as 3D caps; the phone lying flat through
      the camera (§7).
- [ ] The bezel with the webcam module; the Windows 98 taskbar (§7, §7i); the Tonight note in a ballpoint slant.
- [ ] Keys backlit in what they drive: 1 2 3 steel, Z X C ember, Q W E violet, A S D gold, Tab Excel green, H cyan,
      **G moss** (Goblin Fuel; dark with no cans).
- [ ] The YOU card (Tired, Zone, the Drink button with the can's 6 × 13 icon and a **G** keycap) and the feed card (§7).
- [ ] The Zone aura round the bezel.

## V4. Redesign: her panel and his chair

Labels: `art`, `ui`, `p2`

Mockup: Her: Panel; Small pieces: Away; stills `028` to `030`, `047`.

- [ ] The webcam view per state (chat, kettle, footsteps, shower), baked from the prototype, dithered (§7b,
      `bake_her.py`, `art/webcam/`).
- [ ] **His chair is a black and grey gaming chair** in Paweł's reference shape (no logos): one tall back with an
      arched top, bolsters, a quilted lumbar; in the webcam it is wider than him and its bolsters wrap his shoulders, so
      he sits in it (§7k). In code: replace the CHAIR polygon in `src/ui/him.ts` with this shape (front here, back on
      the desk), drawn before him; away, draw only the chair. No new baked images.
- [ ] The headset glyph on the wall, lit cyan when it's on; his glasses grey-green under Excel.
- [ ] The PC-98 UI: Babe and her mood pill, the last-heard line, her note window, the buttons, Patience, Caught,
      Goodwill, Noise (§7b).

## V5. Redesign: the energy break

Labels: `art`, `p2`

Mockup: Interruptions: Energy break 1 to 5; stills `059` to `063`. Builds on #61 and #62.

- [ ] The desk-glass window with step pills (done moss, now gold, to come dim) over the dimmed right screen (§7c).
- [ ] One camera per scene; the drawer, the can on its spot, Open, the drink (him side-on, the liquid as one body),
      the toss with last nights' misses (§7c).
- [ ] The Goblin Fuel can sprites at their sizes (`art/cans/`).

## V6. Redesign: the dog and the cable fix

Labels: `art`, `p2`

Mockup: Interruptions: Dog; stills `064` to `073`.

- [ ] The shiba in his own slots, his tail as the meter, every moment from the spec (§7d).
- [ ] NO SIGNAL as the monitor's message box; the cable fix behind the monitor with the plugs facing their sockets,
      connectors at 1.3× (§7d).

## V7. Redesign: caught

Labels: `art`, `p2`

Mockup: Her: Caught; stills `031` to `033`.

- [ ] Her PC-98 portrait in your doorway, one face per rung of the night's ladder, the hallway light (§7e).
- [ ] The text window: her name on a pink tab, WE NEED TO TALK., what the catch costs; the 0.8 s scare (§7e).

## V8. Redesign: the phone

Labels: `art`, `ui`, `p2`

Mockup: Interruptions: Phone in hand, Phone on desk; stills `074` to `110` (her chat, the photo and the idle phone are
on the page; their stills come with the next package). Goes with #54.

- [ ] One night-mode OS at the game's pixel size: status bar, avatars, bubbles, **every reply a gold button**, gold
      timers, the home bar (§7f).
- [ ] In your hand: 124 × 252 over the heroes' side, rising from the bottom, no hand (§7f).
- [ ] On the desk: the screen as a texture through the desk's camera; who it is by colour (Mom copper, the courier steel
      blue, The Boys violet, the boss white, her pink), not readable text; face down silent with a cool glow (§7f).
- [ ] **Picking up the idle phone:** pointed at, it wakes with a gold "pick up" chip; clicked, it opens the home screen:
      a row of apps (Messages, Shop, Home; more later), the battery widget on top; no Gallery (§7f).
- [ ] **Messages:** the contacts (avatar, name, time, last line, her unread count in her pink); tap one to open the chat;
      a minigame opens its chat straight away (§7f).
- [ ] **Her chat:** kept for good across the nights, day separators, scrolls a bubble at a time (no bubble cut), a
      thumb and a back-to-newest chip; Text her at the bottom (§7f).
- [ ] **The Boys' chat:** the last minigame's exchange; Raid night? at the bottom, dim with a lock and why (§7f).
- [ ] **Her photos:** a 76 × 56 crop of the photo in the thread (nothing scaled); a new one's 60 s in gold, then "Babe
      unsent a photo."; tapped, the whole photo (180 × 240, her 16 colours) in a desk-glass window beside the phone,
      over the dimmed right screen; close box, Esc or a click outside; Goodwill +5 the first time (§7f).
- [ ] Her avatar without glasses.

## V9. Redesign: her windows (the cuddle break, the plan)

Labels: `art`, `p2`

Mockup: Her: Cuddle, Plan; stills `034` to `039`.

- [ ] The cuddle break in her PC-98 window: the heart's stitches, warmth filling it, her breath ring, too fast (§7g).
- [ ] The plan as a pixel blueprint with its four blues, the crack's wedge, never marking her (§7g).

## V10. Redesign: the morning

Labels: `art`, `p2`

Mockup: Her: Morning; stills `040` to `043`.

- [ ] One CG per ending in her 16 colours (`art/morning/`; placeholders until Paweł's stills) (§7h).
- [ ] The summary in her beige paper window, the caption window, the stars and their rewards (§7h).

## V11. Redesign: the small pieces

Labels: `ui`, `art`, `p2`

Mockup: Small pieces; stills `044` to `058`.

- [ ] **The Goblin Fuel inspect window:** opens once, the first time you have cans; the can at full size, what it does,
      the cans you have, Drink G and Later (§7k).
- [ ] **How to hide:** one tile per thing on tonight, the new ones framed gold "new tonight" (Tuesday: five tiles, the
      headset and Lean in new); from pause too (§7k).
- [ ] **Coach marks:** the six, one look everywhere (a marching gold ring round the target, a glass callout with a gold
      top, "The game crawls until you do it.") (§7k), plus lean in's three on Tuesday: the door, the first lean, her first
      tell (week one 2b).
- [ ] **Tooltips:** desk glass on the desk, Windows 98's yellow on the PC, her paper on her panel, the RPG's card
      (§5c) in the game (§7k).
- [ ] **Pause:** the whole frame black, Resume (Esc) and How to hide (§7k).
- [ ] **Away from the PC:** the right screen dims, his empty gaming chair in the webcam and on the desk, the card with
      the seconds left (§7k).
- [ ] **The microsleep:** the lids close as an almond, warm at their edge; shut, "zzz..." and "click or press any key"
      (§7k).

## V12. Redesign: lean in and her timers (fan-service steps 7 and 12)

Labels: `art`, `ui`, `feature`, `p2`

Approved 2026-11-24. Mockup: the page's Lean in rows; canvas row O. Spec: §7l; when it unlocks and how it's taught:
`claude/loot-night-week-one.md` 2b.

- [ ] The plan change: the bathroom at the hallway's far end (a 77 cm pocket door), the bedroom off the hallway, the arch
      into the living room, the hall mirror; `ui/plan.ts`, `door.ts` and the Home app follow; `ROOM_DISTANCE` swaps the
      bathroom (far) and the bedroom (middle) (§7l, decisions 2026-11-23).
- [ ] The view: one camera at his eye behind the gap, the slit 24 to 160 px, the lean through 1 2 3 and the mirror, the
      closer framing (a longer lens, drawn again), the door in Graphite, her flat in her 16 colours plus the desk's
      darks; cast the room once per lean position, redraw only what moves (§7l).
- [ ] Her timers drawn in the scene, three stages each (yoga, the couch, the bath, the kitchen, the sheet mask); her tell;
      the red bar with its eye; "Enjoying the view?" (§7l).
- [ ] The webcam: him turned in the chair, leaning to the crack, the same man from behind (hair, ear, glasses' arm, the
      sweat drop) (§7l).
- [ ] Taught on Tuesday: the voice note's lines, the Lean in tile in How to hide, her yoga first, three coach marks, the
      first lean safe for 6 s, the first tell crawling until you let go (week one 2b, §7k).

## V13. Redesign: week one's pieces

Labels: `ui`, `art`, `p2`

Approved 2026-11-24. Mockup: the page's Week one rows. Spec: §7m. Goes with #56 and #59.

- [ ] Danny's 20:00 voice note in The Boys' chat (the phone in your hand while the night waits): the waveform filling
      gold, the transcript a line at a time, Got it; one per night, and one for a replay (§7m).
- [ ] The replay morning: UNPLUGGED, what it cost, "Tuesday, again" (§7m, §7h).
- [ ] Her window for her moments (the chat's window): the snack run's plate, the tease visit, the towel and the wine,
      asleep with the waking meter, "come to bed" with Coming, babe, the lap sit's questions (§7m).
- [ ] The skill bar's blocked plate for Eyes busy and She has the mouse; the eye pointer over the webcam; Hide cans on
      the Drink button; the away card's reason (§7m).
- [ ] The lap sit over the battle's left third (a stand-in until Paweł's art) (§7m).

---

## Comments for the gameplay Issues

**#52 (the RPG):** The look of this step is decided: the route choice (§5b), run blessings (§5c), marching order and
swaps (§5d); mockups on the Floor map and Battle controls. Changes from the decisions log: three slots per hero (two
skills and the ultimate; drop each tree's second unlock with its rule pair and autocast: Rally, Storm, Revive,
Pickpocket); the ultimate on 3, C, E, D; enemy casts as the name with a cast bar; Flow yellow; a curio offers its
bargain and "Leave it".

**#53 (trees and town):** The look is decided: the town side panel with its tabs and services in the panel (§6b), the
trees as constellations (§6c). Changes: 17 nodes per tree, 15 at most (stat nodes on the way to everything); costs for
now stat 20, unlock 40, rule 40, autocast 60, ultimate 120 Souls × (1 + 0.15 × nodes bought); Souls one pool; the
build's own numbers for buildings, selling and identifying.

**#54 (stars and the phone):** The phone's look is V8 (§7f): everything happens inside the phone, touch only, and on
the desk who it is shows by colour. Changes: Messages is a working app (its contacts; a minigame opens its chat; The Boys' chat
shows the last minigame's exchange with Raid night? at its bottom); her thread is kept for good and scrolls; her
photos open in a window beside the phone; there is no Gallery; tapping the idle phone opens the home screen with its apps.

**#55 (Q4 and the Shop):** The look is decided (§7i): Windows 98, not XP; Q4 in a maximised Excel window with its four
toys and the Macros pane; the Shop on the phone with For you, For her and Home. Numbers for now: AutoSum 0.4 zł, a cell
0.15, a pivot turn 1.2, × 1.25 a title, macros base × 1.5^level, Power Query +100% a level; Flowers 49 zł, Goblin Fuel
29 zł for four (8 in the drawer). The drink key is G. Open: late złoty need a sink or a soft cap.

**#56 (the week):** How to hide shows only tonight's tiles, the new one framed gold with "new tonight" (§7k). No Custom
Night (Paweł): drop the sliders, presets, reward multiplier and badge. After Sunday the week starts again at Monday ("Sunday and after"
goes from `NIGHT_SCHEDULE`); the nights keep counting; the endgame is TBD. Sunday ramps up like Saturday (her weekend off, she
wants attention); week two is TBD. The schedule for week one: `claude/loot-night-week-one.md` (approved for now, 2026-11-24): put it
in `NIGHT_SCHEDULE` with `VISIT_MULT` per night; Monday without Tiredness and ending at 01:00; the Home app and the battery
from Thursday (not with the phone on Wednesday); the fan-service steps on their nights.

**#57 (the smart home):** The look is decided (§7j): the battery widget and Charge, the Home app (the flat as room
tiles, never her), a device's sheet, low and dead. Changes: battery costs doubled (calls and texts 2%, vacuum 20%,
speakers 10%, TV cast 8%, door seal 4% a toggle, bubble tea 6%); the speakers are a pair; the TV cast is always
tappable and does nothing outside the credits; Charge dim at 100%.
