# Loot Night: the visual redesign, index (for the builder)

Where the redesign stands, in one place. The redesign decides the look (palette, fonts, frames, art, layout on the
640 × 360 grid) and the screens the gameplay handoff added; it was mocked up on the Game Frame page and every part was
approved by Paweł (2026-11-18 to 2026-11-20).

**Read in this order of precedence:** `claude/loot-night-decisions.md` (wins) > `claude/loot-night-rpg-grid.md` (the
grid doc, cited as §) > `claude/loot-night-handoff-redesign.md` (the gameplay handoff, Issues #52 to #58).

- **The page:** https://claude.ai/artifact/9xDaK6XXC4VYYgivRajnwU ("Loot Night Game Frame"): every state, live; the note
  under the frame describes the state on screen.
- **The handoff package** (`loot-night-redesign-handoff-2026-11-24.zip`, given to Paweł; for the repo at
  `design/redesign/`, replacing the 2026-11-20 one): the page's code, every baked image as a PNG, the palettes, 168
  stills (one per page state) and a README that matches
  each file to its § here.
- **Issues** for the visual redesign: `claude/loot-night-redesign-issues.md`, **approved 2026-11-24**: V1 to V13 and the
  comments for #52 to #57, for the build chat to file.

## What's ready

| Area | Spec | Page controls | Goes with |
|---|---|---|---|
| The grid (640 × 360, whole-number scales), the renderer (palette index, Bayer 8 × 8), text (Tiny5) | §1, §8 | View | V1 |
| UI materials, actor separation | §2, §3 | | V1, V2 |
| Skill icons, the skill bar (two skills and the ultimate), the ultimate's gilded well, enemy casts | §4, §5 | Battle | V2, #52 |
| The heroes (Garrote §4b), the mob of six (§4c), the crypt | §4b, §4c, §5 | Dungeon, Battle | V2 |
| The route choice: the floor map, path cards, features and conditions, the away hourglass | §5b | Floor map | #52 |
| Run blessings | §5c | Battle: Run blessings; Dungeon | #52 |
| Marching order, auras, swaps, the Hook | §5d | Battle: Swap, Hook | #52 |
| Ravenhold, 16-bit | §6 | Town | V2 |
| The town side panel: Town, Inventory, Skill Tree; services in the panel | §6b | Town panel | #53 |
| Skill trees (17 nodes, the constellation) | §6c | Tree | #53 |
| The desk and the monitor (Graphite, one camera, the keyboard, the YOU and feed cards) | §7 | Desk and room | V3 |
| Her panel (the webcam, her PC-98 UI) | §7b | Her: Panel | V4 |
| The energy break | §7c | Interruptions: Energy break | V5 |
| The dog and the cable fix | §7d | Interruptions: Dog | V6 |
| Caught | §7e | Her: Caught | V7 |
| The phone, in your hand and on the desk; her chat (kept for good, scrollable) and her photos in a window beside it; picking up the idle phone | §7f | Phone in hand (Home screen, Her chat, Photo opened), Phone on desk (Idle) | V8, #54 |
| Her windows: the cuddle break, the plan | §7g | Her: Cuddle, Plan | V9 |
| The morning | §7h | Her: Morning | V10 |
| Windows 98, Q4 (Excel), the Shop | §7i | Q4 (Excel); Phone: Home screen, Shop | #55 |
| The smart home and the battery | §7j | Phone: Home app, Battery; Phone on desk: Low battery, Dead | #57 |
| The small pieces: the Goblin Fuel inspect window, How to hide, coach marks, tooltips, pause, away (the gaming chair), the microsleep | §7k | Small pieces | V11, #56 |
| Lean in and her timers: the view through your door, the stops, the slit, the closer framing, the red bar, the hall mirror, his back in the webcam; the plan change (the bathroom at the far end, the arch, `ROOM_DISTANCE` swapped); taught on Tuesday | §7l | Lean in | fan-service steps 7 and 12 (#59) |
| Week one: the loop of a night and the seven nights (what each adds, the ramp, the checks) | `claude/loot-night-week-one.md` | | #56, #59 |
| Week one's pieces: Danny's 20:00 voice note, the replay morning, her moment window (the plate, the tease visit, the towel and wine, asleep, come to bed with Coming, babe, the lap sit), Eyes busy, Hide cans, the away card's reason, the lap sit over the battle | §7m | Week one | V13, #56, #59 |

## Build order

1. **V1, the grid and the renderer,** then **V2, the RPG screens** in the new look: everything else sits on them. They
   can go in before #52 or alongside its step 1.
2. **The gameplay steps in their order (#52 to #58), each with its visuals:** #52 the route choice, blessings and ranks
   (§5b to §5d); #53 the town tabs and trees (§6b, §6c); #54 the phone (§7f); #55 Windows 98, Q4 and the Shop (§7i);
   #56 the week (How to hide per night, §7k); #57 the smart home and the battery (§7j).
3. **The real-life areas (V3 to V11)** in any order: each stands on its own once V1 is in.

## Changes to the handoff (from the decisions log, which wins)

**Step 1 (#52), the RPG:**
- **Three slots per hero: two skills and the ultimate.** Skill 3 goes, and with it each tree's second unlock, its rule
  pair and its autocast (Rally, Storm, Revive, Pickpocket). The ultimate takes the third key (3, C, E, D); 4, V, R, F
  stay dark.
- The Rogue is **Garrote**, second in marching order. The battle shows 4 heroes and a mob of six (fodder in two lanes,
  the lieutenant or boss behind); the rest wait off screen.
- An enemy's cast is **its name with a cast bar under it** (no plate). **Flow is yellow** (`#eadf3a`, UI-only).
- A curio offers its bargain and "Leave it" (the Potion cart's "Pay 12 g" is gone).

**Step 2 (#53), trees and town:**
- Each tree has **17 nodes, 15 at most:** stat nodes on the way to everything (two gate skill 2, one before each rule
  pair and autocast, three climb to the ultimate; the last raises the aura).
- **Costs for now:** stat 20, unlock 40, rule 40, autocast 60, ultimate 120 Souls, each × (1 + 0.15 × nodes bought in
  that tree). **Souls are one pool** for the four trees and the buildings.
- Buildings, selling and identifying use the build's own numbers; only epics and legendaries drop unidentified.
- **No pop-up windows in town:** services open in the side panel's Town tab.

**Step 3 (#54), stars and the phone:** stars Deep, Unseen, Sweet and their morning rewards; everything on the phone
happens inside the phone; the phone is touch only; on the desk who it is shows by colour, not text.
- **Messages is a working app:** its contacts; tap one to see the chat; a minigame opens its chat straight away. Her
  thread is kept for good across the nights and scrolls (a bubble at a time); The Boys' chat shows the last minigame's
  exchange with Raid night? at its bottom; the other interrupts stay one-time minigames. Her photos sit in her thread and
  open in a normal window beside the phone (the only exception to "everything inside the phone"). **No Gallery.**
- **The idle phone is clickable:** pick it up and it opens the home screen with its apps: Messages (her chat), Shop,
  Home; more apps later.

**Step 4 (#55), Q4 and the Shop:**
- **Windows 98, not XP.**
- **Q4 numbers for now:** AutoSum 0.4 zł, a filled cell 0.15, a pivot turn 1.2; each title × 1.25; macros cost base ×
  1.5^level (Intern 20, AutoFill 60, VLOOKUP 150, Conditional Formatting 300, Pivot macro 800, Power Query 4,000); Power
  Query adds +100% a level.
- **Shop:** Flowers 49 zł; Goblin Fuel 29 zł for four cans, the drawer holds 8; the New phone drains the battery 40%
  slower; her gifts in a For her tab. **The drink key is G.**

**Step 5 (#56), the week:** How to hide shows only tonight's tiles; the new one is framed gold with "new tonight". **No
Custom Night** (Paweł): we set the rules, no sliders for the player; the sliders, presets, multiplier and badge go.
**After Sunday the week starts again** at Monday (Paweł); the nights keep counting; the endgame is TBD. **Sunday ramps
up like Saturday** (her weekend off, she wants attention; details TBD); week two is TBD. **Week one first:** the loop and the
seven nights are `claude/loot-night-week-one.md`, **approved for now** (2026-11-24; tuned after the playtests): Monday
the one night without Tiredness, the Shop from Monday, the Home app and the battery on Thursday, the weekend's attention
set, "Coming, babe".

**Step 6 (#57), the smart home and the battery:**
- **Battery costs doubled for now:** a call or text answered 2%, vacuum 20%, speakers 10%, TV cast 8%, door seal 4% a
  toggle, bubble tea 6%; a charge +40% for 15 s away (the empty chair). Checked: a typical night charges once, a heavy
  one twice, the New phone removes charging.
- The speakers are **a pair** (kitchen and bath). The **TV cast is always tappable**; outside the credits it does
  nothing. **Charge is dim at 100%.** The Home app never shows her.

**Small pieces:** the Goblin Fuel inspect window opens once, the first time you have cans; away from the PC shows his
empty gaming chair in the webcam and on the desk; his chair is that gaming chair in every webcam state (§7k).

## Still open

**Not designed yet** (needed before their steps are built):
- **The title screen, designed last** (Paweł). (Custom Night is dropped.)
- **#59, the fan-service pass:** her art (poses, him turning, the stills) is Paweł's. (Her photos are done: her chat,
  §7f. The Gallery is dropped.)

**Gameplay, after the redesign** (Paweł): late złoty (a sink or a soft cap); her gifts' trade-offs other than the fluffy
socks; new things to buy once Q4 outruns the Shop (about Friday; once the loop proves fun); week two and the endgame (TBD); skill and node names
(placeholders); filing the fan-service Issues (#59).

**On the page:** the room posters (NOCNA ZMIANA, GOBLIN FURY) wait for their PNGs; everything else on the page now
follows the decisions.

**The webcam's chair in the build is code:** `src/ui/him.ts` already draws him and a plain chair as vector shapes; the
gaming chair replaces its CHAIR polygon (§7k), drawn before him and wrapping his shoulders; away, only the chair.
