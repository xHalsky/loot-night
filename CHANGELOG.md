# Changelog

One entry per build. Newest first. The design bible describes the current game; this file records how it got there.
Versions before 0.14.0 predate the repository (they exist only as published artifact versions and zips).

## 0.91.1 (2026-11-27)

- **A gentler shake** (#114; Paweł: too much and too long): the wrong-class shake, in its square and in hand, is now
  four 1 px hops over 0.2 s (was six hops of 2 then 1 px over 0.35 s). `WRONG_CLASS_SHAKE_HOPS` is new.
- **Its slot lights when you pick it up** (#114): held on a bag item for `PICKUP_HOLD_SEC` (0.12 s), or dragging it,
  the matching slot in the selected hero's gear gets a thin ring with its corners left out: gold, or crimson when he
  can't wear it. An open item window closes when you pick another item up, so the slots show. A quick click still
  just selects. `test/classgear.py` covers both.

## 0.91.0 (2026-11-27)

- **Class gear** (#113; Paweł: per-class weapons and armour, trinkets shared). Weapons, helms and armor now belong to
  one class and only that hero can wear them; boots, rings and trinkets fit anyone. A weapon, helm or armor drop is
  for a hero in the party, evenly (a legendary or set piece: its own hero). Each class has its own words and its own
  bag icon per slot: the knight's swords, helms and plate (steel); the rogue's daggers, hoods and leathers; the mage's
  staffs, circlets and robes (purple, 3 new icons); the priest's maces, mitres and vestments (gold and cream, 3 new
  icons); the leathers are new too. Cloth and leather never get Iron, Bronze or Steel. An empty weapon, helm or armor
  slot shows the selected hero's own shape.
- **The wrong class, on the item itself**: with a hero selected who can't wear it, the item's square gets a crimson
  ring under the pointer, and the item in your hand wears it once picked up (its square stays empty while it is in
  hand; the ring goes over the card of a hero who can wear it). Right-click: it shakes in its square. Dragged onto his
  slot or card: it shakes in your hand, and let go it flies back to its square and shakes there. The feed says "Mage
  only: Dutch (Knight) can't use it."; the tooltip names the class ("Rare Mage Weapon") and says the same line instead
  of the Power change. Anything let go where it can't go now flies back to its square (it used to vanish). Numbers:
  `WRONG_CLASS_SHAKE_SEC`, `WRONG_CLASS_SHAKE_PX`, `GHOST_RETURN_SEC`.
- The ▲ upgrade arrow, the boys' "upgrade" line, the item window's Equip buttons, the Appraiser's "For ..." line and
  both bots count only heroes who can wear it.
- Old saves: worn gear becomes its wearer's class (renamed when its word isn't his); a legendary or set piece is its
  hero's (worn by someone else, it goes back to the bag); bag items go by their word.
- Balance (good bot): night 1 (32 nights each) equips 32 to 28, slots filled 20.5 to 18.2 of 24, gear's share of
  attack 38% to 33% and of HP 27% to 23%; depth 6.2 to 6.1, wipes 0.16 both. Four nights (8 campaigns): depth 6.1 / 8.8
  / 9.2 / 9.0 before, 6.2 / 8.8 / 11.0 / 11.0 after.
- Reverses the 0.58 decision against class-locked gear (docs/design/loot.md). `test/loot.ts` (the pool, names, the
  equip rule, old saves), `test/classgear.py` (ring, shakes, flight back), `test/ghost.py` updated.

## 0.90.3 (2026-11-27)

- **Caught blips are eyes** (#112; Paweł: not hearts on the GF UI): the three Caught marks on her panel are now a 7 x 5
  eye (white with a crimson iris when spent, a dim plum outline while free). Patience keeps its hearts, and so does her
  name tab on the Caught screen. Same slots, nothing else moved. Rejected: a red heart (still a heart), a skull (too
  harsh for her panel).

## 0.90.2 (2026-11-27)

- **A dragged item looks like itself** (#111; Paweł: it showed the generic slot icon): picked up from the bag or a gear
  slot, the item under the pointer is its own cell, copied from the side panel as drawn (its icon, rarity light, power,
  the upgrade arrow) and shown at the grid's pixel (x2 on the stage). The old DOM icon by slot stays only as a fallback.
  `test/ghost.py`.

## 0.90.1 (2026-11-27)

- **Position, not rank** (#110; Paweł: it is the order in the formation): the hero tooltips ("Position 1", "Home
  positions 2 to 4", "Position 1, out of position"), the hero card over a sprite, the enemy casts ("Hook · position 4",
  "Shove · position 1", "EXECUTE · position 4"), the EXECUTE feed line, the Brute's first-meet line ("back one
  position"), Cleaving Bash's rule ("positions 1 and 2"), and the code: `systems/positions.ts`, the page's
  `positions.js`, `HOME_POSITIONS`, `OUT_OF_POSITION_MULT`, `POS_X`, `positionOf`, `outOfPosition`, `positionMult`;
  `test/positions.ts` and `test/positions.py` (were `ranks`). The Q4 job ladder keeps its saved `rank` (a title). No
  change to play or to saves.

## 0.90.0 (2026-11-27)

- **The boys' voices and lines** (#109; Paweł): Billy loud and panicky (the 20:00 message, the replay, the call),
  Mike the calm organizer (the raid time), Lance dry and deadpan; they call Age of Judgment "aoj". Their lines riff
  on 80s and 90s action films, old MMOs and arena shooters and read as plain gamer talk without them (nothing named,
  quotes of five words at most). Monday's 20:00 chat is Billy's realm-is-up message with Lance's and Mike's tips; the
  replay is Billy's "game over man. GAME OVER." and Lance's tears in rain; Lance's other 20:00 lines are cut down to
  his few words. Still text, not voice notes (#108).
- **The boys' call:** Billy calls with one of four openers, then Mike or Lance. The polite, shouting and rude replies
  stay, with GET TO THE CHOPPER and "I'll be back. Maybe." added; misses and Noise work as before.
- **The boys' chat between the calls** (`data/boys.ts`, `systems/boys.ts`): moments of the night post a line or a short
  exchange in The Boys' chat (a wipe, a boss, a crit kill, Backstab, a combo, drops, the Appraiser, her on her way, a
  clean tab-out, the party low, the sugar crash, your first yawn, Raid night?...); two lines with no moment come now
  and then in the dungeon. Quiet: no banner, no sound, no effect on play. Spaced by `BOYS_GAP_SEC` (40 s) and
  `BOYS_SAME_GAP_SEC` (240 s), some once a night; the thread keeps 30 lines. The full pool and its triggers are in the
  decisions doc.
- `test/boys.ts`: who says what, their style (lowercase, no dashes, no old names), the call's replies, the pacing.

## 0.89.1 (2026-11-27)

- **The boys always text** (#108; Paweł: never voice messages): Tuesday to Sunday's 20:00 message and their reaction
  after the plug ("Tuesday, again") are their chat now, like Monday's: a bubble at a time after the name and the typing
  dots, one from each of Billy, Mike and Lance, same words as before, and Let's go. Billy's voice note (the waveform
  and its transcript) is gone from the game; the chat stays in The Boys' thread as before. Data: `NIGHT_CHAT` and
  `replayChat` in `data/voice.ts`.

## 0.89.0 (2026-11-27)

- **The cast of 2026-11-27** (#107; Paweł: the heroes are the friends' characters now, and Dutch is a nod to his film
  hero): Knightenstein is **Dutch** (the Knight, you), Garrote **Hixx** (the Rogue, Mike's), Magoo **Hudzor** (the Mage,
  Billy's), Healero **Arkbishop** (the Priest, Lance's). Display names only: stats, skills, keys, colours, art and
  balance are unchanged (the good and idle sims run clean).
- **Every place a hero is named shows his class** (Knight, Rogue, Mage, Priest), from one table (`HERO_NAME`,
  `HERO_CLASS` in `heroes.ts`) that the renderer reads too (`PK.heroNames`, so the page's own tables never drift).
  Cards and tooltips: the name, then the class in the class colour (a new `c` line in the RPG's tooltip card; the
  rank moved to the note). In a line of text: "Hudzor (Mage)" (feed lines, the aura and set lines, the skill tree's
  hint, "+4 power for Dutch (Knight)"). Strips: "ARKBISHOP Priest" (the party tab, and now the Skill Tree tab). The
  item window's Equip buttons put the class under the name; the Appraiser's reveal says whose a legendary or set piece
  is on its own row, "For Hixx (Rogue)". The name stands alone where there is no room: the party cards, the feed's
  speaker tags, Heist's and the EXECUTE warning's feed lines.
- **Ids kept** (saves and art key on them): the hero ids `knight`, `rogue`, `mage`, `healer` (`priest` on the page),
  and the still images' file names in `design/redesign/stills/`. An old save loads with the new names
  (`test/cast.py` checks it). The phone's unused `magoo` avatar key is `hudzor` now.
- **The boys' first chat** matches the cast: Mike's line is about Hixx's daggers, Lance's about Arkbishop being ready
  since lunch.
- **Docs:** the design bible, the handoff package (`design/redesign/`, where Danny and Kuba are now Billy and Lance, as
  in the game since 0.88), the UI inventory and the Project docs; the decisions doc has the cast table.
- `test/cast.py`: every screen that names a hero, and an old save.

## 0.88.2 (2026-11-27)

- **Big headings in a font drawn at their size** (#106; Paweł: a bigger heading can afford more pixels): Jersey 10
  (Fontsource, OFL) at its native size, 10 px capitals like the doubled Tiny5 but with 1-pixel detail. Her name
  "Babe", How to hide's and tonight's stars' titles (back to their size and sentence case after 0.88.1's small caps),
  THE PLAN, WE NEED TO TALK., Cuddle break, Morning and its numbers, the phone's caller names, Shop, Home, Messages and
  the Home app's devices, Goblin Fuel, Paused. Kept doubled: the phone's lock clock, battery %, 0%, the boss's sum and
  the microsleep's zzz (the size is the point there). Rejected: Pixelify Sans (off the grid).

## 0.88.1 (2026-11-27)

- **More of the screen at 1x** (the one-resolution rule; Paweł: down to 1x where it stays readable): How to hide's and
  tonight's stars' titles, the phone's app titles (Shop, Home, Messages) and the "?!" in the Answer her picture. Headings
  at 1x are Silkscreen bold (`silkb`, small caps); the "?!" is crimson (pink was too faint at 1x). The rest of the 2x
  headings are listed in #106 for a call one by one.

## 0.88.0 (2026-11-27)

Playtest fixes, round 2 (Paweł).

- **The Tonight note is gone** (#101): at 2x it broke the main visual rule, one resolution (now written down in
  `screen.md`). Tonight's three stars are a card after How to hide, in its look: Floor N, Don't get caught, Keep her
  happy, a picture and one sentence each (what it takes, what it pays), Sleep's time and the plug in the foot. Got it on
  How to hide (or Enter) opens it; Esc skips both. The heart is drawn at 1x, not a blown-up sprite.
- **The boys are Billy, Mike and Lance** (#102; Danny and Kuba before): an Aliens in-joke. Garrote is Lance's.
- **Monday opens with their chat, live** (#102): six bubbles from all three, one at a time after typing dots, about
  6 s in all with a soft tick each, stoked to finally play **Age of Judgment**. "Let's go" works from the start. From
  Tuesday it is still Billy's voice note. The chat stays in The Boys.
- **The RPG is Age of Judgment** in the fiction (#102): the taskbar button (wider, so "Age of Judgment · Tab" fits),
  the desktop icon, the feed's welcome, the tooltip. The title screen keeps the game's title.
- **No headset on Monday** (#103): it stays Tuesday's (decided 2026-11-27), and Monday no longer offers it: no icon by
  his head, no head button, H dark on the desk keyboard.
- **The headset's tooltip is the shared one** (#103): her panel's paper card ("Headset" and what it does), not a CSS
  ring and an Inter label. No element uses a browser `title` tooltip any more.
- **The phone's close box is pixel art** (#104): the grey disc with the red cross, drawn by the renderer at 12 × 12
  grid px. **A click outside the phone closes it**, unless it lands on the RPG or on something with an action.
- **Real money is dollars** (#105): "$50", "+$1.3", "$249"; the same numbers (balance and saves untouched; the save
  field is still `zl`). The Auction House sells for real money.
- No rule changes: sims as 0.87 (good bot Monday 3 stars, idle bot caught). Tests: `week.ts`, `week.py`, `stars.py`,
  `small.py` follow the chat and the second card; `note.py` is gone.

## 0.87.2 (2026-11-26)

- **The playtest build on GitHub Pages** (#100): https://xhalsky.github.io/loot-night/ for close friends. A push to
  the `playtest` branch builds and deploys it (`.github/workflows/pages.yml`: Node 22, `npm ci`, `npx tsc`,
  `npm run build`, deploy `dist/`); main never deploys. To release, fast-forward `playtest` to main.
- Before the repo goes public, its full history (116 commits) was scanned for secrets with gitleaks 8.28 and a grep
  of every diff: nothing (gitleaks' 3 hits are the save key names).
- `docs/playtest.md`: the link and "send the version number from the title screen with every bug report".
  `tech.md` had the save key as v2: it is `lootnight.save.v3` (since 0.80), and it stays that way during the playtest.
- Pages' Source must be GitHub Actions: the first time it was "Deploy from a branch" (main), which published the
  repo's raw root (the dev `index.html`, which does not run). The `github-pages` environment must allow the
  `playtest` branch (GitHub creates it allowing only main).
- No game changes.

## 0.87.1 (2026-11-26)

- **Garrote attacks with both daggers** (#97, Paweł): on Stab and Backstab the near hand cuts up and forward, and a
  beat later the far hand comes over the top from behind his hood and cuts down and forward; the two smears cross in
  an X. Drawing only, no rule changes. `test/swing.py` adds a close-up of him (`test/shots/swing_garrote.png`).

## 0.87.0 (2026-11-26)

First playtest fixes (Paweł, Monday night).

- **The front hero walks over the loot** (#95): nobody runs ahead for it any more. The drops come toward the party
  with the floor and whoever walks in front picks each one up at his feet; after the floor's last fight the party
  still walks forward, out of the floor, over the drops, then the map. The looter's run (`LOOTER_RUN_PX`, 0.62.2) is
  gone; the walk's paces are in tuning (`WALK_PACE`, `WALK_HURRY_PACE`).
- **Garrote from night 1** (#96): the party is Knight, Garrote, Mage, Healer from Monday. A save without him gets him
  at the next night (lowest level, second in line, a feed line). Tuesday's 'rogue' is gone and Danny's Tuesday note
  opens with "no curfew tonight. play till you drop lol". Nobody's role line says "picks up the loot" now.
- **Melee hits swing the weapon** (#97, `SWING_SEC` 0.42 s): the Knight's Slash and Bash take the sword off his
  shoulder, over the top and down at the enemy; Garrote's Stab and Backstab cut up and forward with the dagger. Both
  leave a bright smear. Casts and the ranged heroes keep the lunge.
- **The Tonight note is readable, and a click takes it off** (#98): Tiny5 at 2x on a bigger note (134 × 66 grid px),
  right of the lit skill keys; the ⏻ 23:00+ line went (the Sleep button says it). A click peels it off for good
  (saved), its tooltip goes with it, the feed says the stars still count.
- **Curios stand in the corridor** (#99): one comes into view off the right edge, the party walks up to it and stops,
  and after the choice walks on past it (it goes by behind them, its glow dimmed) before the next fight. About 4 s a
  curio (`CURIO_ENTER_X`, `CURIO_STOP_X`, `CURIO_GONE_X`, `CURIO_PACE`).
- Sims, 12 nights a day, good bot, before → after: Monday depth 5.67 → 6.00, wipes 0.25 → 0, stars 3 → 3; Tuesday
  depth 6.75 → 6.67, wipes 0.33 → 0.08. Idle bot: Monday caught 2.4 a night, Tuesday 4. The week (8 a day, good):
  3 stars and no catches every day, seconds between demands 92, 115, 58, 44, 45, 31, 29. The week in a row
  (`campaign.py 8 7`): stars 3.00, 2.75, 2.75, 3.00, 2.62, 2.62, 2.62, no catches, depth 5.6 to 12.9 (0.86: 3.00,
  2.88, 3.00, 2.88, 2.62, 2.50, 2.62).
- Tests: `test/walk.py` (was `looter.py`: the walk over the loot, the walk out, a curio coming up and going by),
  `test/swing.py`, `test/note.py`; `ranks.ts`, `week.ts`, `week.py`, `loot.ts`, `echoes.ts` updated for four heroes.

## 0.86.0 (2026-11-26)

- **The mornings' Breakfast** (fan-service step 9, #94): with the Sweet star, the morning shows its picture under the
  summary, a photo of her at the stove in your shirt (a code stand-in until Paweł's still). The four mornings' CGs were
  already one per ending.
- **Her in the cuddle break** (fan-service step 11, #87): her face on your shoulder in the window's corner, one
  expression per warmth step: calm, eyes closed, a blush and a smile, asleep (a stand-in).
- **The fan-service pass is built** (#59): steps 1 to 5 and 7 to 13 (step 6, the Gallery, was dropped 2026-11-20).
  `docs/design/eye-candy.md` gets the content survey: every moment, what is shown, the outfit and pose, and the answer it
  implies (General Mature Content, no nudity, no sexual content; the RPG's fantasy violence), and the store-facing notes
  (key art, capsule alternatives, trailer beats, what stays out of store art).
- With this, everything planned before the playtests is in (#59, V12, V13): the backlog before Paweł's tests is empty.
- No rule changes: sims as 0.85. The week in a row (`campaign.py 8 7`): stars 3.00, 2.88, 3.00, 2.88, 2.62, 2.50, 2.62,
  no catches (0.80: 3.00, 2.88, 3.00, 2.75, 2.62, 2.75, 2.62).

## 0.85.0 (2026-11-26)

- **Lean in** (fan-service steps 7 and 12, V12 #77; grid doc 7l). From Tuesday, hold your door past 0.6 s and the
  right screen is his view through the crack (the page's raytraced view): the mouse leans through 1 the kitchen, 2 the
  bathroom, 3 the living room and the hall mirror, the wheel opens the door a notch (two quick notches creak, Noise
  +8), the right button looks closer. Eyes busy the whole time; in the webcam he turns round and leans to the crack.
- **Her timers** drawn in the scene, three stages each: yoga (new, from Tuesday), the couch (her TV), the bath (ajar),
  the kitchen (her tea), the sheet mask (new, Friday on, once before bed).
- **She can see you:** from where she sits she glances at your door every 5 to 12 s, her tell first (let go), then the
  red bar fills while she looks, faster the wider the slit (x1 to x2.5), x1.5 closer, x2 in the mirror. Full: "Enjoying
  the view?", never a catch: Goodwill 40+ she blushes (+10), below she teases (Mood +5).
- **The hall mirror** (199 zł, the Shop's Home tab): round the corner past stop 3; her steam fogs it for 20 s.
- **The plan change:** the bathroom at the hallway's far end (a pocket door), the bedroom off the hallway, the arch into
  the living room, the mirror's wall; the plan, the crack's corner and the Home app follow; who hears you follows the
  rooms (the bathroom x0.5, the bedroom x1).
- **Taught on Tuesday:** Danny's note names it, How to hide's fifth tile, the night opens with her yoga (no visit while
  it lasts), three coach marks (the door, the slit, her first tell, which waits till you let go), the first lean safe
  for 6 s.
- V13 (#78) is complete with this: the voice note, the replay morning, her moment windows, the blocked plates, the eye
  pointer, Hide cans, the away card's reason, the lap sit.
- Sims (16 a night, good bot): seconds between demands Mon 101, Tue 115 (her opening yoga holds her first visit off,
  by design), Wed 50, Thu 40, Fri 37, Sat 32, Sun 33; stars 3, no catches. Idle bot: unplugged every Tuesday and
  Wednesday, 4 and 7 of 8 on the weekend.
- Tests: `npx tsx test/lean.ts`, `python3 test/lean.py` (screens `test/shots/lean_*.png`); week, asks updated.

## 0.84.0 (2026-11-26)

- **What she wears** (fan-service step 3, #90). Her outfit comes from what she was doing: a knit sweater and socks on
  the couch, your hoodie and slippers in the kitchen, the cream tee otherwise, the towel from the water; home from work
  (weekdays before 21:00) her work blouse with the collar undone; on her phone in the bedroom after 23:30 her pajama
  shorts. **Her feet change her footsteps:** slippers louder and heard 2 s earlier, socks quieter and only from the
  hallway; the light gap under the door shows her socks.
- **Gifts for her** (fan-service step 4, #91): the Shop's For her sells the Fluffy socks (79 zł: silent steps), Knee
  socks (99: steps 2 s later), Fury tee (129: a catch costs half the Mood, she peeks more), Pajama set (149: bed 30
  min earlier from Friday, the waking meter 25% faster) and Cat-ear hoodie (199: one more tease a night, any night,
  looking pays x1.5). One per slot (feet, top) a night, the newest the night after you buy it, then at random;
  Goodwill +20 the first time she wears one. Trade-offs as Paweł chose (2026-11-26).
- **Selfies** (fan-service step 5, #92): from Friday one in three of her texts after midnight carries a photo (the
  mirror selfie in your jersey, or in her gift; under the duvet). Tap the crop in her chat and the photo opens beside
  the phone (hands busy; close, Esc or click outside), Goodwill +5 the first time; not opened in 60 s, "Babe unsent a
  photo."
- Her new clothes sit on her panel's PC-98 colours (pastels between two of them read see-through after the dither); the
  bust's sheen only on light cloth.
- F1: Selfie. Sims (16 a night, good bot): seconds between demands Mon 108, Tue 95, Wed 53, Thu 38, Fri 41, Sat 34,
  Sun 34; stars 3, no catches. Idle bot unplugged every Tuesday, Wednesday and Sunday, 3 to 4 of 8 Thursday to Saturday.
- Tests: `npx tsx test/wardrobe.ts`, `npx tsx test/selfies.ts`, `python3 test/wardrobe.py`, `python3 test/selfies.py`.

## 0.83.0 (2026-11-26)

- **On your lap** (fan-service step 10, #86). From Saturday, at Goodwill 70 or more, her chat visit is a lap sit: she
  hums her way over, then sits on your lap facing the monitor to watch you play. No check (KEEP PLAYING). The back of
  her head and her shoulder cover the battle's left third (the renderer's lap layer over the frame) and in the webcam
  she sits on his lap. Three questions about the game ("Which one is you? The one with the shield?"), 10 s each, the
  chat's sweet / meh / rude and its Mood and Goodwill. Ignore one and she takes your mouse: "You stopped talking to
  me. My turn!", SHE HAS THE MOUSE on the skill bar for 3 s or till you answer her. "ooh, shiny" on rare or better
  drops. Up after the three or 20 s.
- F1: Lap sit. The good sim bot answers her sweetly (`laps`, `gwEnd` in its summary). Single-night sims start at
  Goodwill 0, so lap sits are rare there (Sunday 1 in 8 nights started one, at Goodwill 87 to 100); weekend sims
  otherwise as 0.82 (30 and 31 s between demands, stars 3, no catches).
- Tests: `npx tsx test/lapsit.ts`, `python3 test/lapsit.py` (screens `test/shots/lapsit_*.png`).

## 0.82.0 (2026-11-26)

- **Her bath** (fan-service, #88). On Saturday and Sunday her shower is a bath, 120 to 150 s after 21:30 (most nights
  by about 22:00): the tap as she fills it, her music through the door (lo-fi chords, a soft beat, the water moving;
  louder when the door is ajar, half her baths), the drain gurgling as its end. It is not a break: the phone and the
  dog go on (the shower stays the week's safe window); only her visits wait, and the doorbell waits for her to get out.
  Her music covers your Noise x0.35, x0.7 with the door ajar.
- **"Babe, bring my wine?"** (#88): half her baths, 25 to 60 s in. **"Babe, towel!"** (#93): half her showers and
  baths from Saturday, as she gets out. Her window (BABE, WINE? / BABE, TOWEL!, 15 s, one pink answer): bring it, 12
  or 10 s away from the PC (the away card says why: "Bringing her wine"), Goodwill +15 and her thank-you; ignore it
  and she gets it herself, Mood +10, by way of your door in her towel, dripping (a Peek: catch rules apply). Back
  early from the away card counts as ignoring her. One demand at a time: she asks only when nothing else has you.
- **Her voice:** a new sound, `babe` (four lines: the tease's "babe?", "baaabe.", "babe, towel!", "babe, wine?"),
  plus `bath` and `drain`, baked in `tools/sfx/make.py`.
- A pill's tooltip now goes when the pill does (it stayed on her panel under a still pointer).
- F1: Bath, Towel!, Wine? buttons. The good sim bot brings them (`asks`, `baths` in its summary); requests count as
  demands.
- **Sim fix:** `HOME=1` was always on (the shell's own `$HOME`), so from 0.79 Thursday to Sunday ran with every device
  bought. Now only `HOME=1` buys them.
- Sims (16 a night, good bot, without devices): seconds between demands Mon 102, Tue 92, Wed 57, Thu 42, Fri 40,
  Sat 32, Sun 31 (0.81 with devices: 105, 98, 57, 40, 39, 36, 34); stars 3, no catches. A first try with the bath
  as a second shelter (real life waiting as in the shower) took the weekend to 41 and 44 s, easier than Thursday.
  Idle bot: unplugged every Saturday and Sunday.
- Tests: `npx tsx test/asks.ts`, `python3 test/asks.py` (screens `test/shots/asks_*.png`).

## 0.81.0 (2026-11-26)

- **Her tease visit** (fan-service step 1, #85). Weekends: 1 to 2 on Saturday, 2 to 3 on Sunday. No footsteps, just a
  soft "babe?", and she leans in your doorway because she wants you. Her window turns pink (HER, a dotted rose line,
  three hearts). Point at the webcam view (an eye cursor) with the game on screen to look at her: he turns to her,
  the skill bar reads EYES BUSY (no skills, no Flow building) and Goodwill rises (4 a second, a +N tag on its bar);
  3 s of looking and she blows you a kiss. Ignore her and she asks once more ("Baaabe."), then leaves pouting, Mood
  +10. Excel counts as ignoring. Never a catch. She is scheduled (first at 50 to 90 s, then 70 to 110 s apart, when
  real life is free) and comes up to 40 s early for a boss wind-up or a legendary on the floor, the one demand that
  may land on a wind-up.
- **Come to bed** (step 2, #89). From Friday, once a night after 01:10 to 01:45, she gets up half asleep in your
  hoodie: COME TO BED, the seconds in the corner and **Coming, babe** (ends the night like Sleep at that hour, even
  mid-battle, on the green morning; Sweet still goes by her Mood). Looking pays x2, ignoring costs x1.5.
- F1: Tease and Come to bed buttons. The good sim bot looks at her (`teases` in its summary).
- Sims (16 a night, good bot): Saturday 9.4 to 10.6 demands before 01:00, 41 to 36 s apart (the model 27); Sunday
  10.7 to 11.4, 37 to 34 (24); 1.3 and 1.6 looked-at teases a night; stars 3, no catches. Idle bot: 2 to 3 teases,
  each a pout. Weekdays unchanged. Rolled odds (first try) gave 0.25 a Saturday, so the teases went on a schedule.
- Tests: `npx tsx test/tease.ts`, `python3 test/tease.py` (screens `test/shots/tease_*.png`).

## 0.80.0 (2026-11-26)

- **The playtest build** (step 7, #58, the last step of the redesign handoff). The title says PLAYTEST BUILD, the
  version and the night you are on; its pitch says the week ("one night at a time, Monday to Sunday") instead of
  promising Mom, the boss and the dog on the first night.
- **Fresh saves for testers:** the save key goes to `v3` and the old keys are cleared, so everyone starts on Monday,
  also someone who played an earlier build (the `v2` key dated from 0.51, before the week, Q4 and the battery).
- Debug stays off by default, and Real life off stays only in the F1 panel, never saved (both already so).
- `docs/playtest.md` follows the week: Monday and Tuesday (about 20 minutes), what each night holds, the visit tally
  as Peek, Snack run and Chat (cuddles come Thursday), "Start Tuesday night" on the morning.
- `test/week.py` checks the title and that an old save is gone. No change to the game's rules: sims as 0.79.

## 0.79.0 (2026-11-25)

- **The phone battery** (step 6, #57; grid doc 7j), from Thursday: 100% every night; each call or text you answer
  takes 2%, each device its own. The home screen's battery widget has **Charge · 15 s away** (the empty chair, +40%;
  dim at 100%). At 20% and 10% the desk phone wakes crimson; at 0% it's dead: black in your hand with only Charge
  it, nothing reaches it, so Mom calls your girlfriend and the boys ring Discord on the PC. The New phone (2,999 zł)
  now sells: everything drains 40% slower.
- **The Home app:** your flat as room tiles with the devices you installed (never her), a sheet per device with its
  battery before and after: the **Robot vacuum** (20%; in her room or next door she goes to stop it, next visit 45 s
  later; rests 3 min), the **Speakers** in the kitchen and the bath (10%; a timer, next visit 30 s later; the 3rd a
  night annoys her), the **TV cast** (8%; at her show's credits, one more episode; the 3rd time she notices), the
  **Door seal** (4% a toggle; the towel's effect and downside), and **Bubble tea** (25 zł, 6%; the doorbell 2 min
  later, then no visits for 2 min; twice a night). The Shop has a **Home** tab for the devices.
- **Make her tea and the towel are gone:** bubble tea and the door seal replace them, so her panel has no buttons.
- My readings where the spec is silent: the speakers rest 60 s and the TV cast 90 s; asleep or in the shower she
  ignores the devices; a doorbell wakes her a bit if she's asleep; the Home app shows the build's flat until lean in.
- `test/home.ts`, `test/home.py` (next to stills 103, 113 to 120, 133, 134); the sim's `HOME=1` bot installs every
  device: Thursday to Sunday it uses the vacuum 1.1 to 1.4 times, the speakers 2 to 2.5, the TV cast about 2, one bubble
  tea, charges 0.1 to 0.6 times and never dies; 3 stars, caught 0. Without devices the sims are as 0.78 (good: 3
  stars, caught 0 every night).

## 0.78.0 (2026-11-25)

- **Danny's 20:00 voice note** (step 5, #56; V13, #78; grid doc 7m): every night of week one the phone comes into your
  hand at The Boys' chat while the night waits. His voice note plays (the waveform fills gold), the transcript comes in
  line by line, naming tonight's new things in his chat voice; Got it (or Esc, Enter, the home bar) puts the phone
  down, then How to hide on a night with a new tile. After the plug it's the replay's note: "F. she pulled the plug",
  under "Tuesday, again". The note stays in The Boys' chat. Week two has none.
- **Each night's first chance, early and safe:** Tuesday her first visit is a chat (caught on it, she lets it go once:
  "Raid night? Fine. Just this once."), Thursday a snack run (cans in sight, she points at them and takes none).
- The snack run says "Made you a plate. Eat something, babe." (V13).
- Sims (16 seeds a night, demands before 01:00, seconds apart against the model): Monday 3.7, 105 s (97); Tuesday 4.2,
  98 (81); Wednesday 7.0, 57 (48); Thursday 10.8, 40 (34); Friday 9.5, 39 (38); Saturday 9.4, 41 (27); Sunday 10.7,
  37 (24). Good bot 3 stars, caught 0 every night; idle unplugged every Tuesday and Wednesday, as in 0.77.
- `test/week.ts` and `test/week.py` check the notes and the first chances. With 0.77 this completes step 5 (#56).

## 0.77.0 (2026-11-25)

- **The week** (step 5, #56; `NIGHT_SCHEDULE` in tuning, `systems/week.ts`; the week doc approved for now). Nights
  are weekdays, and each brings its things: **Monday** her routine, peeks and snack runs, Q4 and the Shop, and it
  ends at 01:00 as a Sleep (no Tiredness yet); **Tuesday** chat visits, the headset, Garrote, her leaning into your
  face after a pass, Tiredness and the night past 01:00; **Wednesday** the phone rings, Text her and Raid night?;
  **Thursday** the dog, cuddles, the boys' call, the Goblin Fuel, tea and the towel; **Friday** she goes to bed at
  00:00, the Witching Hour; **Saturday and Sunday** she's off (to bed at 01:00) and comes more often (x1.4, x1.6;
  her #59 moments come here). Before its night nothing hints at a thing: no YOU card on Monday, no Drink button
  before Thursday, the Shop lists what is in.
- **Unplugged, you play the same night again** ("Tuesday, again"): the renderer's replay morning says what the plug
  cost. Any other ending moves on. After Sunday the week starts again with everything on (week two is TBD).
- **The night's name everywhere:** the 20:00 line, How to hide, the phone, the results, the morning ("Tue 07:40",
  "Start Tuesday night"), the title ("Continue · Tuesday", now read from the save: it said "night 1" after a reload).
- **How to hide** opens on the first Monday and on a night with a new tile, with tonight's tiles: three on Monday
  (filling the card), the headset new on Tuesday, Answer her new on Thursday (the cans and the cuddle).
- How often she comes scales with the night: her odds, the gaps between visits and her pace.
- F1 has a button per night. `test/week.ts`, `test/week.py`; the tests start on Friday (`window.__lnDay`), where
  everything the build has is on. Sims now play Monday unless `DAY=n`, and report demands and seconds apart.
- Sims (16 seeds a night; demands before 01:00 and seconds apart, the week doc's model in brackets): Monday 3.6, 101 s
  (97); Tuesday 3.9, 91 (81); Wednesday 7.4, 57 (48); Thursday 8.9, 43 (34); Friday 11.7, 33 (38); Saturday 9.5, 42
  (27); Sunday 10.4, 38 (24): the weekend waits for #59's tease visits and bath. Good bot 3 stars and caught 0 every
  night alone; the week in a row 3.00, 2.88, 3.00, 2.75, 2.62, 2.75, 2.62 stars. Before (everything on, every night
  Monday): good 3 stars, caught 0. Idle bot unplugged on every Tuesday and Wednesday, 1 in 8 on Monday (peeks only),
  mostly reaching dawn from Thursday as before.

## 0.76.0 (2026-11-25)

- **The Shop app** (step 4.6, #55; grid doc 7i and 7f): the phone's home screen has the Shop next to Messages. Spend
  the złoty Q4 pays on real-life things, with the phone in your hand (hands busy). **For you:** Goblin Fuel (29 zł,
  four cans for the drawer, up to its 8), Dog chew (29, his next visit 2 min later, once a night), Silent keys (249,
  Q4 makes half the Noise), Mini fridge (599, the energy break starts at a cold can on the desk), Ergo chair (899,
  Tiredness builds 15% slower), New phone (2,999, *soon*: the battery comes with step 6). **For her:** Flowers (49,
  +20 Goodwill at once, once a night); the gifts she wears come with #59. What you keep is saved.
- The Goblin Fuel inspect window says where more cans come from ("More in the Shop: 29 zł for four.", from the
  tuning). The free top-up to 3 cans a night stays until the week (#56).
- `test/shop.py` buys everything with the real mouse next to stills 103, 111 and 112. No change to a night without
  buying: sims as 0.75 (good 3 stars, caught 0, avg Noise 23, Q4 46 zł; idle 3 stars, caught 0, in its usual 0 to 3
  catches spread). Fixes #55.

## 0.75.0 (2026-11-25)

- **Q4: Excel is your job now** (step 4, #55; grid doc 7i). The spreadsheet Tetris is gone; Excel is a maximised
  Windows 98 "Q4_report_FINAL_v3.xls" that pays złoty on every action, with its own sound, a "+N zł" pop and an
  animation: AutoSum (the big Σ or Space; now and then BALANCED, x5), the fill flick (drag the corner down: further
  and faster fill more cells), Sort (everything x2 for 5 s, then a cooldown), the pivot spinner from Analyst (grab it
  and fling it; every turn pays). The Macros pane sells automation that earns all night, in the RPG and the town too:
  Intern, AutoFill, VLOOKUP, Conditional Formatting, Pivot macro, Power Query.
- **Titles come fast** (Intern to Director by lifetime złoty, each x1.25 on Q4), each with Excel's "Congrats on your
  promotion!" dialog and confetti; Q4 is saved across nights and the morning shows what it paid.
- **Hustle:** right after alt-tabbing in, the toys pay up to x3, falling to x1 over 15 s; it recharges in the RPG.
- **Looking busy:** on a Peek, with Excel up, acting in Q4 makes her leave sooner; sit idle 3 s and she waits, her
  note asking "What are you working on?". It never catches you by itself. Every toy action makes a little Noise.
- Healero's first-time tip explains it. Numbers are grid doc 7i's (to be tuned in playtests). Sims (good bot now
  works in Excel during her visits, two AutoSums a second): before, good 3 stars, caught 0, avg Noise 19 to 36;
  after, good 3 stars, caught 0, avg Noise 53 to 77, Q4 13 to 50 zł a night; idle as before (it never opens Excel).
- `test/q4.py` plays every toy, the dialog, a macro and looking busy next to stills 004 and 011 to 014.

## 0.74.0 (2026-11-25)

- **The small pieces, second half** (V11, #76; grid doc 7k):
  - **Coach marks:** one look everywhere, drawn by the renderer: a marching gold ring round the thing (a copper one
    outside it), a glass callout with a gold top, a gold wedge pointing at it, "The game crawls until you do it." and a
    close box. The pointer goes through to the thing; only the callout takes clicks.
  - **Tooltips in the look of where the pointer is:** the desk's glass on the desk (Goblin Fuel's lists what it does,
    the crash and the cans in the drawer), Windows 98's yellow on the taskbar, her paper on her panel and the cuddle
    window, the RPG's leather card on skills, heroes and plain lines in the game screen (drawn by the battle area and
    the panel). Item tooltips keep their DOM card for now (they go with the side panel's item details).
- The loot coach mark says "a green arrow" (Tiny5 has no ▲). The DOM coach mark and its CSS are gone. `test/tips.py`
  hovers each look next to stills 072 to 074; `test/coach.py` closes its mark with the real mouse. UI only: sims as
  before. With this, real life is in the new look (V3 to V11).

## 0.73.0 (2026-11-25)

- **The small pieces, first half** (V11, #76; grid doc 7k), all drawn by the renderer now:
  - **Pause:** the whole frame black under a glass card, Resume (Esc) and How to hide.
  - **How to hide:** the glass card over the dimmed frame, "Monday, 20:00", a picture for each of tonight's four tiles,
    Got it (Esc and Enter too); the pause card opens it again.
  - **The microsleep:** the lids close as an almond from top and bottom, warm where the light comes through, the
    view greying toward them; shut, "zzz..." and "click or press any key".
  - **Away from the PC** (making her tea): the right screen dims, your gaming chair stands empty in front of the desk
    (and in the webcam), a glass card with what you are doing, the seconds left and a moss bar; her "Stay for one
    episode?" is on the card with Stay and Back to the PC; the close box comes back early.
  - **The Goblin Fuel inspect window** (new): once per save, the first time you get tired enough to yawn or reach for
    the drink: the can at full size, what it does (from the tuning), the cans in the drawer, Drink (G) or Later.
- `MONSTER_DRAWER` (8): the drawer's slots in the inspect window. The DOM pause, How-to card, eyelids and away layer
  and their CSS are gone. `test/small.py` plays them all next to stills 062 to 065, 075 and 076. The old scripts'
  `act` helper sends an action when its DOM button is gone; `test/preemptive.py` and `test/calls.py` (broken since V2
  and V8, covered by `her.py`, `small.py` and `phone.py`) are deleted. UI only: sims as before.

## 0.72.0 (2026-11-25)

- **The morning is the redesign's** (V10, #75; grid doc 7h). A PC-98 dating-sim CG of her asleep fills the frame,
  one per way the night ended: green, face down under the thick duvet with her feet out at the foot end; yellow,
  turned away, one foot out, her phone lit on your pillow; red, on the couch wrapped in the duvet with the TV the
  only light; unplugged, the empty bed with her clip on her pillow and the note on yours. The caption sits in a
  night-plum window; the summary in her beige paper window: the auction house, Wallet, Gold, Sleep debt, Best stars,
  LAST NIGHT's stars with what each paid, the sleep-debt line, and her pink button. Enter and Esc start the night too.
  The CGs are placeholders until Paweł's stills.
- **The game's numbers, not the page's sample.** Tiredness from the sleep debt, the rewards and the chest's item are
  the game's; the button says "Start night N" and the clock shows no day until the week (#56) names the nights.
- The results card before the morning is unchanged (the redesign has none). The old morning card, its vector bed art
  (`drawHerBed`) and their CSS are gone. `test/morning.py` ends four nights four ways next to stills 040 to 043.
  UI only: sims as before.

## 0.71.0 (2026-11-25)

- **The cuddle break is the redesign's** (V9, #74; grid doc 7g). Her window, night plum with her name on a pink tab,
  over the dimmed right screen. Her breath is a small heart in a ring that breathes with her, going once round a big
  heart: its line is stitches ahead of her and fills pink behind. On her breath the ring goes solid and hearts float
  up; too fast turns it crimson with "too fast!". Warmth fills the big heart (a cold checker, purple, then pink past
  60%) and the bar, whose 60% mark wears a little heart that lights once you pass it. Your hand is the cursor.
- **Same rules, same numbers.** The rules stay in `systems/cuddle.ts` in the old window's units; the new window draws
  the heart at exactly half size, so the ring (17 px) and "too fast" (450 px/s) are the old 34 and 900.
- **The plan is a pixel blueprint** over her panel, everything behind it dimmed: chalk walls, door swings, pencil
  furniture, the crack's wedge, 1 2 3 in her pink, YOU in gold, masking tape and a curled corner. It shows the game's
  apartment as it is now; the page's new layout (bathroom at the far end) comes with V12 (#77), with the hearing
  and the crack that go with it. The layout is now data in `ui/plan.ts`. ✕, Esc or a click off it close it.
- The DOM cuddle window, the plan's SVG sheet, `#winLayer` and their CSS are gone. `test/herwin.py` plays both with the
  real mouse next to stills 034 to 039; `test/visits.py` (broken since V4, covered by `her.py` and `herwin.py`) is
  deleted; `test/dog.py` no longer depends on which favourite spot the dice pick. UI only: sims as before.

## 0.70.0 (2026-11-25)

- **Caught is the redesign's** (V7, #72; grid doc 7e). The generic pixel face is gone: she stands in your doorway,
  backlit by the hallway, a late PC-98 dating-sim portrait over the whole frame, one face per rung of the night's
  ladder (a stern glare; glasses blank white and her face in shadow; furious, the hallway lit red). The PC-98 text
  window: her name on a pink tab, WE NEED TO TALK., what the catch cost, a blinking ▼. The 0.8 s scare is the page's:
  a white flash, an interlaced punch-in, a shake that settles.
- **The line says what really happened**, from the rules and `tuning.ts`: Guilt is on every rung, so the 1st reads
  "Caught 1 of 3 tonight · Flow reset · Guilt: the party deals 10% less for 30 s", the 4th "Caught 4 · ...". Her
  panel's Caught tooltip no longer says three catches unplug the PC (the 3rd turns the monitor off; the PC goes when
  her Mood fills).
- **It holds so you can read it** (`CAUGHT_HOLD_SEC` 3.2 s after the scare). A click or a key after the scare puts it
  away; clicks and keys while it is up never reach the game (no stray alt-tab). Nothing under it draws while it covers
  the frame, so the scare runs at full frame rate.
- `test/caught.py` gets caught three (and four) times with real peeks, next to stills 031 to 033. UI only: sims as
  before.

## 0.69.0 (2026-11-25)

- **The dog and the cable fix are the redesign's** (V6, #71; grid doc 7d). The renderer's shiba jumps up and rests his
  head and paws on the desk edge in front of the keyboard; his ears rise in front of the taskbar (an overlay over the
  screen's bottom edge). The first time, a card says "stroke his head, gently". Over his head the cursor is the pixel
  hand; stroking gives hearts (on his favourite spot: eyes shut, tongue out), too fast gives "gently!" and ears back.
  Petted happy he licks your hand and lies down; a Good Boy leaves the lucky sock on the desk while its buff lasts;
  ignored he lies down offended ("hmph"); the slam jolts the desk with a BONK.
- **NO SIGNAL and the back of the monitor.** The monitor shows the redesign's NO SIGNAL; after the slam the back of
  the monitor opens in the energy break's window: the cables, the ports, the legend and the Flow countdown. The fast
  fix (`CABLE_FAST_SEC`) now counts from the window showing (`CABLE_SHOW_SEC` 1.3 s after the slam), not from the
  slam. The window's close box hides it; a click on the screen brings it back (the cables stay out until fixed).
- **Petting in grid pixels.** The old desk canvas measured strokes in 2x pixels; the numbers were converted, not
  retuned: `DOG_FAST` 2200 → 1100, `DOG_PET_RATE` 0.0032 → 0.0064 (the bots' strokes too). Sims as before: good
  3 stars, caught 0; idle within its usual spread.
- The old desk canvas (`#deskFx`) and its dog and cable painter in `ui/deskFx.ts` are gone (the file keeps her lap
  scene). `test/dog.py` plays the dog and the cable fix with the real mouse next to stills 082 to 091.

## 0.68.0 (2026-11-25)

- **The energy break is the redesign's** (V5, #70; grid doc 7c). The desk's glass window opens over the right screen,
  which dims behind it: "Energy break", the close box, five step pills, the step's line. Each scene is ray-cast through
  its own camera, as the mockup: the desk and the drawer from above its edge (the mouse, the mug, the receipt, the
  pedestal), the can standing on its spot from the front left, the drink close on him from his left (the monitor with
  the game on its glass, the moonlit blinds), the throw from his chair into a dark corner with the mesh bin and last
  nights' misses lying round it. The can is the pixel sprite at every size.
- **On the game's own physics.** The drink's particles and the throw's rigid cans are unchanged; the renderer draws
  them where the physics has them (the can 1:1 at his lips, its drink one level body that sloshes with the tilt; the
  throw on the bin's plane). Pulling the drawer, dragging the can and lifting the tab follow the hand in the new
  pictures. The cursor is the game's pixel hand (open, grabbing).
- **No stalls.** A scene's static part is up to 0.7 s of ray casting on a slow machine, so the break bakes its scenes
  ahead in the browser's idle time during the night (about a minute on a slow machine, each drawer pull past the
  first only the drawer's part). The break draws at 30 fps and the right screen behind it four times a second.
  Frame times outside the break as 0.67.
- The DOM window and its 34 CSS rules are gone; the old canvas painter in `ui/monsterScene.ts` is replaced by its view
  for the renderer. `test/ebreak.py` plays the five steps with the real mouse and Space next to stills 077 to 081;
  the old browser tests of the break are deleted (`test/pour.ts` and `test/toss.ts` still test the physics). UI only:
  sims as before.

## 0.67.0 (2026-11-25)

- **Her panel is the redesign's** (V4, #69; grid doc 7b). The renderer draws the whole left column as one picture:
  the webcam view on top, her PC-98 UI under it ("Babe" and her mood pill, the last-heard line, her note, the two pink
  buttons, Patience, Caught, Goodwill, Noise). Her windows take the same look: a chat question with your three
  answers, the snack run's plate, the cuddle ask, and ASLEEP with the waking meter.
- **The webcam is the game's own drawing, dithered live.** Every webcam frame comes down 2x in linear light and is
  dithered the way the redesign's stills were baked: his room in the desk's Graphite, her side (the doorway, the
  crack, the light under the door, the daydream) in the PC-98 colours. So every state keeps moving: her walking down
  the hallway, the crack you hold open, her in the doorway. It runs at 15 fps, a webcam's own rate.
- **His gaming chair** (Paweł's reference shape, no logos): one tall back with an arched top, bolsters that wrap his
  shoulders, a seam over the lumbar, black with grey piping. Making her tea, the chair stands empty. Under Excel his
  glasses go grey-green; the headset icon on the wall moved 5 px right for the wider chair.
- "Hold the door to peek" moved from the door into the door's tooltip (unreadable at grid size).
- The DOM panel is gone (`herHeadHtml`, `doorInfoHtml` and their helpers, 103 CSS rules; a selector check over the
  game's screens found none in use). A DOM stand-in over her note anchors the "she is at your door" coach mark.
- `test/her.py`: nine states next to stills 028 to 030, with real clicks on her answers, the plate and Make her tea.
  `test/onboarding.py` reads her note and the feed's pinned tip from the game (they are drawn now); the old DOM panel
  tests are deleted. UI only: sims as before (good: 3 stars, caught 0; idle: 0 to 3 catches, the same spread as 0.66).

## 0.66.0 (2026-11-24)

- **The desk and the monitor are the redesign's** (V3, #68; grid doc §7). The renderer draws the whole right screen
  round the game screen as one picture: the thin bezel with the webcam module, the Win98 taskbar (Start, Loot Night,
  Excel, Sleep, zł, the clock), the keyboard with the skill keys lit in their colours, the phone lying on the desk,
  the Tonight note, the YOU card and the feed card. What the monitor shows lights the desk and the keys: the battle,
  the town, Excel or the monitor off.
- **The phone on the desk** is the same OS as in your hand, seen lying down: a call in the caller's colours with the
  "pick up · 8 s" chip, banners for texts, the back with a cool glow when face down. Tap to pick up, swipe 45 px to
  turn it face down, and its red **Decline** works on the desk.
- **The drink key is G** (decisions 2026-11-19), with its keycap on the Drink button and the G key lit.
- **Fix: Decline in your hand counted as ignoring** since 0.65 (Mom called your girlfriend, Mood +10). It is a
  decline again: Mood +3 and she calls back once.
- The desk's DOM is gone: the bezel, the taskbar, the keyboard and mouse, the 3D phone, the sticky note and both
  cards, `ui/peripherals.ts`, the hold-to-decline (nothing drove it), and 161 CSS rules (a selector check over the
  game's screens found none in use). A DOM stand-in over the phone only anchors the coach mark.
- The desk draws at 15 fps in two halves on the frames the battle area and the panel skip: a whole desk costs about
  7 ms on the CPU, which at 20 fps on any frame dropped a frame in three (frame times now as 0.65).
- `test/desk.py`: the desk in eight states, with real clicks on the taskbar, the phone, Decline and Drink, and a
  contact sheet. `test/coach.py`, `test/goodwill.py`, `test/phone.py` and `test/stars.py` follow the drawn desk; the old
  DOM phone's tests are deleted. UI and one fix only: sims as 0.64 (good: 3 stars, caught 0; idle: caught).

## 0.65.0 (2026-11-24)

- **The phone in your hand is the redesign's phone** (V8, #73; grid doc 7f). The renderer draws it (124 × 252 on the
  grid at 2x) over the heroes' side of the battle area, rising from the bottom, in the game's own night-mode OS: gold
  is what you can tap, moss accept, crimson decline, her pink is her. Every phone moment moved: the incoming call
  (Speaker, slide to answer with the mouse, Decline), the lock screen (Face ID: hold the ring), the boss's sums, her
  text, Mom's beat, the courier and the boys (a wine "She can hear it" strip on speaker).
- **The idle phone opens the home screen,** with Messages (her unread count). **Her chat is kept for good** across the
  nights: her texts, your answers, Text her and her replies, a grey separator per sitting; the wheel scrolls it a
  bubble at a time. **The Boys' chat** keeps the last call's exchange, with Raid night? at the bottom (dim with why
  while it can't).
- The DOM iPhone in your hand is gone (and 115 CSS rules only it used; a selector check over the game's screens
  found none in use). The desk phone stays DOM until the desk's redesign (V3, #68).
- Left for later: the Shop and Home apps and the battery widget (steps 4 and 6), her photos (#59), the call's
  Message button (no rule behind it).
- `test/phone.py` drives every screen with real clicks on the canvas (slide to answer, Face ID, the boss's total,
  the apps) and writes a contact sheet. UI only: sims as 0.64.

## 0.64.0 (2026-11-24)

- **The phone: fewer events, each worth taking** (#54 3.2, the rest of step 3). A night script replaces the random
  timer (every 20 to 35 s): the courier once (20:30 to 21:30), Mom once around 21:00 (one callback if declined), the
  boss's texts once around 22:00, the boys 1 or 2 times on the floor before a boss floor, her texts after midnight.
  Nothing in the first 45 s.
- **Each one pays:** Mom heals the party and gets the fallen up; the boss pays 50 zł overtime (not gold; ignoring him
  now costs nothing); the courier brings a gaming mouse, skill cooldowns -10% until dawn (his loot parcel broke the
  money rule); the boys' raid buff lasts until that boss fight ends. Mom is 2 beats, the boss one row of sums.
- **One demand at a time:** a phone event or the dog waits while anything else asks for you, 15 s after the last,
  and never during her footsteps, her at the door, her shower, a boss wind-up or a calm you earned. It slides
  later, never drops. Her bedtime text only waits for the phone.
- **Only calls buzz;** texts light the lock screen silently and wait 60 s. **Speaker** on every call (desk and hand):
  hands free, keep playing, Noise while it lasts (none with the headset). **Face-down is Do Not Disturb:** silent,
  and what runs out counts as ignored. **Touch only:** the 1 2 3 keys for Mom and the boss are gone.
- `test/phone.ts` (replaces `test/calls.ts`): the script, the spacing, each event, speaker, Do Not Disturb.
  `test/phone.py` shoots the desk call, the hand call, a call on speaker and a silent text.
- Sims: good bot unchanged in outcome (sleeps, 3 stars, caught 0). **Idle bot: now reaches dawn in 4 of 5 seeds
  (Mood 69, 2 stars: Deep and Sweet), was unplugged:** the phone no longer taxes Mood for the boss, the flip or the
  random stream, and catches alone stop short of red. Left for the tuning after the redesign.

## 0.63.0 (2026-11-24)

- **Stars that reward greed** (#54 3.1, redesign step 3 begins). Three goals, a star each, no ladder: **Deep** (any
  run tonight reaches tonight's floor: your record, at least 3), **Unseen** (never caught; a forgiven catch doesn't
  count), **Sweet** (her Mood ends under red). Unplugged gets none. The old ladder (survive, then Mood, then not
  caught) paid nothing for going deep.
- **The Tonight note** is three handwritten lines with a live mark each: "floor N" (! until reached, then ✓ for
  good), "don't get caught", "keep her happy"; "deeper = better loot" is gone.
- **Results** name the three stars, lit or not; the near miss says how many floors short of tonight's target.
- **A reward per star in the morning:** Deep a chest (one item at tonight's deepest floor; a full bag keeps it as
  the next night's first drop), Unseen Trust (Goodwill +20 next night), Sweet Breakfast (sleep debt -1).
- `test/stars.ts` (every goal and reward, the full bag), `test/stars.py` (the note, results, morning).
- Sims: good bot 3 stars (floor 7 against a target of 3), sleeps, caught 0; idle bot unplugged, 0 stars.

## 0.62.3 (2026-11-24)

- **The old RPG drawing is gone** (steps 1 and 2 are closed: #52, #53, #67). The renderer has drawn the dungeon,
  the floor map, the town and the side panel since 0.62, so the old DOM side panel, the town's service and build
  windows, the canvas town (`ui/townMap.ts`), the old sprites and VFX, and 447 CSS rules nothing could produce any
  more are removed (about 1,900 lines). A check walked 60 screens (title, town tabs, dungeon, map, pause, debug,
  every phone, dog and window state) and found no element any removed rule could style.
- The alt-tab switch now freezes and brings back the renderer's picture (the battle area or the town and the
  panel); it showed the dark monitor underneath, or the old town.
- Old one-off screenshot scripts for the removed town windows are gone; `test/layout.py` keeps one town shot.

## 0.62.2 (2026-11-24)

- **The looter runs for the loot** (#52 1.3, the last open piece of step 1). On the walk Garrote (the Knight on night
  1) runs ahead to each drop, grabs it and runs back into his rank; the walk waits for him. Before, the front hero
  just walked over the drops, so nobody looked like the looter.
- **The F1 pacing line has everything 1.1 asked for:** the run's length and its Souls so far, and what each hero's
  next stat node costs, besides encounter and floor time and drops per minute. Q4's income joins it in step 4.
- The 15-minute RPG session (handoff step 1's gate) moves to after the redesign, with the number tuning (Paweł).
- Sims: good bot sleeps, caught 0, runs end on floors 5 and 6, 3 nodes, first legendary at drop 40; idle bot
  unplugged, 2 wipes (as 0.62).

## 0.62.1 (2026-11-24)

- **The Town portal plate makes room for what it banks.** It grows to fit "bank 12 · 1240 g" (it was 54 px and the
  line spilled over its edges), the two lines get more air, and it is drawn in two flat bands so the text never
  sits on a dither. The floor map's plate says what it banks too (it said "15 min" there). The unbanked count stays
  on the plate, not in the corner (Paweł's call). `test/portal.py` shoots the corner empty and full, the floor
  map, and clicks the plate's right end.

## 0.62.0 (2026-11-24)

- **Ravenhold in the redesign's look** (V2 with #53; grid doc §6). The town on the monitor is the redesign's map,
  drawn by the renderer: hover a building for its halo and card (a plot's card: level, next effect, cost), click
  the Dungeon Portal to go down.
- **No windows over the town: services are pages of the Town tab** (Paweł, 2026-11-19). The Salvage Forge, the
  Merchant, the Appraiser and the Auction House open in the side panel next to the bag: each item shows what it
  pays, the ones the service refuses are dimmed, pick several and one button does them all ("Sell 3 · +120 g").
  The Merchant warns when you sell a rare or better; the Appraiser takes one item at a time and plays its reveal
  in the panel. A plot lights its build row. The run end card still shows over the town. zł is drawn with its ł.
- **The map shows what you built.** The redesign drew one state per plot (three built, the Treasury not); now an
  unbuilt Library, Training Grounds or Inn is a building site with its materials and its mark on the notice board,
  and a built Treasury is a squat vault with battlements, barred windows and a gold lock. Lv 2 and 3 art: #81.
- **Reorder the party in town**: drag one party card onto another in the Inventory tab (it had no UI in town
  since 0.56; the cards work in the dungeon too).
- `test/town.py` (it replaced a DOM script that no longer ran) hovers, clicks a plot, salvages, sells and
  identifies through the canvas and checks the gold and Souls. No rule changes: sims as in 0.61 (good: sleep,
  caught 0, runs end floors 5 to 6; idle: unplugged, 2 wipes).

## 0.61.0 (2026-11-24)

- **The side panel in the redesign's look** (V2 with #53; grid doc §5, §6b). The whole panel is drawn by the renderer:
  in the dungeon the four party cards, the hero's gear and stats, the bag with its Treasury row and the footer; in town
  the three tabs (Town: the build list, the floor picker, Enter the dungeon, the bag; Inventory; Skill Tree). Bag
  cells show NEW, the lock, the upgrade ▲, the unbanked dashes and the picked frame. Drag to equip or unequip,
  right-click, hover tooltips and L work as before; item windows and the bag-full popup are still DOM, over the canvas.
  The loot coach mark points at the bag on the canvas.
- `test/panel.py` shoots the tabs, the dungeon panel, a drag onto a gear slot and the item window; `test/tree.py` and
  `test/legend_tip.py` use the canvas. No rule changes.

## 0.60.0 (2026-11-24)

- **Skill trees** (#53; grid doc §6c; `src/data/trees.ts`, `src/systems/tree.ts`). Skills come only from the tree:
  every hero starts with his auto attack and skill 1; skill 2 is an unlock behind two stats; the ultimate needs 6
  nodes and charges only once bought (levels give stats only, `ABILITY_UNLOCK` is gone). Per hero two rule pairs
  (one shuts the other), two autocasts, nine class stats (the last on the way to the ultimate raises his aura).
  Costs stat 20, unlock 40, rule 40, autocast 60, ultimate 120 Souls, +15% per node in that tree; respec free while
  testing; buying in town only.
- **Autocast**: a loop mark on the well, on when bought, right-click the well to switch it. Dumb on purpose (ready, it
  casts on the default target), fires while you're away, never an ultimate.
- **The Skill Tree tab**: the town side panel has three tabs (Town, Inventory, Skill Tree). The tree opens over the
  town as a constellation and the tab shows the node, the Buy and the Respec, both drawn by the renderer. Town and
  Inventory are the DOM panel for now.
- Pacing with skill 2 now bought: pack HP back to x1.25, first legendary within 40 drops (night 1 has 43 to 75).
- The sim's good bot now gears up on the walks and keeps auto-salvage off (with rares every 30 s it was starving its
  own gear), and buys tree nodes in town. Night 1, 4 runs: fights 9 to 13 s, runs end on floors 5 to 7 (mostly banked
  with a full bag), 3.5 to 4.5 min, a rare or better every 16 to 31 s, 3 to 4 nodes a night. Idle: unplugged, 3 wipes.
- New `test/tree.ts` (23 checks), `test/tree.py`. The autopilot test gives its party skill 2 and the ultimates and finds
  its heroes by id (it assumed the old order since 0.56).

## 0.59.0 (2026-11-24)

- **Pacing tuned to the targets** (#52, 1.9). Rarity weights 68/28/3.3/0.55/0.15 (were 60/25/10/4/1) with a slower
  shift per floor; the first legendary comes within 50 drops (was 80), so on night 1. Pack HP x1.25 (was x1.4), pack
  attack x0.7 (was x0.5), enemy attack x1.15 a floor (was x1.12).
- Sims, good bot, night 1 (4 runs each), before → after: fights 10 to 15 s → 9 to 12 s; items every 3.2 to 4 s → 2.7
  to 5 s; a rare or better every 8 to 16 s → 16 to 24 s (about half now from bosses, elites, Cursed paths, curios and
  pity; target 30 s); runs ended on floors 5 to 9 with no wipes → floors 6 to 10, most ending in a wipe (the Ogre on
  floor 5 stops some); first legendary at drop 14 to 81 → by drop 50. Idle: unplugged, caught 1 to 2, 2 to 3 wipes.
  Autopilot test: floor-10 boss careful 6/30 wipes (was 1/30), floor 5 0/30, normal floor 3 lowest HP 89% (was 97%).
- The sim reports each run's end (floor, banked or wiped, seconds), the first legendary's drop, and why each rare came
  (roll, sure, pity, first, cursed).
- Not met: night-1 runs ending on floors 3 to 5 (the bot plays better than a person; waits for the playtest, #80).

## 0.58.0 (2026-11-24)

- **Loot rules** (#52, 1.8). An item is a main stat line plus at most three affix lines (common 0, uncommon 1, rare 2,
  epic 3, legendary 3); the downside (rare up) and a special affix each count as one.
- **Legendaries change a rule.** Every legendary is one of eight named items, each for one hero, dropping only while
  he is in the party: Frostbinder, The Tithe, Last Lantern, Ash Choir, Widow's Kiss, Stormcoil, Gilded Hand, Vigil
  Censer. Stormcoil and Vigil Censer were written for the cut Storm and Revive; they now work on Magoo's Bolt and
  Healero's Miracle.
- **Sets**, one per hero (Ironwake, Embervow, Dawnward, Nightglass): 30% of epics are a piece; two pieces on the set's
  hero give a stat, three a rule. The tooltip shows the rule, whose it is, and how many pieces he wears.
- New `test/loot.ts` (22 checks), `test/legend_tip.py`. Sims (good): depth 8 to 9, encounters 10 to 15 s, 78 to 88
  items a night; no balance change intended (1.9 tunes).

## 0.57.0 (2026-11-24)

- **A night's end and the run** (#52, 1.4; Paweł's call: going further always carries a risk). Sleep banks a run
  still going, as before. Dawn and unplugged now lose it like a wipe (its unbanked items, its gold, what lies on the
  floor; Souls stay); unplugged still costs the cheaper half of what is left in the bag on top. The feed warns once
  15 game minutes before dawn and once when her Mood reaches red, while a run is going. The results say what the
  run banked or lost. Until now every ending banked, so Sleep was a free portal and the night's last run had no risk.
- New `test/runend.ts`. Sims: the good bot sleeps at 01:00 and banks as before (no change); the idle bot is unplugged
  and now loses its run (bag 0 at the end; before, half of a banked bag).

## 0.56.0 (2026-11-24)

- **Marching order** (#52, 1.6; grid doc §5d). The party fights in one line, rank 1 at the front; the skill bar's
  groups follow it, keys stay with the hero. Home ranks (Knight 1-2, Garrote 1-3, Mage 3-4, Healer 2-4): outside them a
  hero deals and heals x0.7 (a crimson "x0.7" tab on his portrait). Auras on the bar's pilasters: the Knight's shield
  wall (the hero behind takes 25% less), Garrote's keen eye (+10 crit to the one in front), Magoo's haste (10% shorter
  cooldowns to the one in front), Healero's blessing (1% HP a second to both neighbours). Night 1 now starts Knight,
  Healer, Mage.
  - Swap: drag a portrait or a hero onto another; both walk past each other for 1 s without acting. Free in town.
  - From floor 6, 35% of encounters bring a Ghoul (Hook · rank 4: the last hero is dragged to the front on a chain)
    or a Brute (Shove · rank 1: the front hero is knocked back). Away, the line stays broken.
  - Enemies pick ranks: melee the front (70%) or the next, the Shaman ranks 3 and 4; Taunt finds the Knight
    wherever he stands. EXECUTE now names a rank ("Execute · rank 4"): swap someone sturdier in.
  - Hover a hero for his card: his rank, what is wrong, what his aura gives and to whom.
- **Garrote** (#52, 1.7) joins on night 2, second in line, at the party's lowest level, with a feed line; he is the
  looter now. Stab (auto), Backstab (Z: 3x, x2 on Staggered), Smoke Bomb (X: enemies miss half their attacks for
  4 s), Heist (C, ultimate: every kill drops an item for 8 s). Z X C glow ember on the desk keyboard.
- F1: Garrote, Hook and Shove buttons. New `test/ranks.ts` (25 checks) and `test/ranks.py` (screenshots).
- Sims (good): night 1 depth 6 to 10, encounters 9 to 11 s, 0 wipes in 3 (0.55: depth 5 to 7); with `NIGHTS=2` the
  second night (four heroes) reaches depth 9 to 11 with about 105 items. The bot puts the line back after a break.
  Idle: depth 2, 2 wipes, caught 1. Autopilot test: floor 10 boss 1/30 wipes careful (0/30 before), away still 30/30;
  normal floor 8 away 0/30 (2/30 before: the healer's blessing and the Knight's wall).

## 0.55.0 (2026-11-24)

- **The route choice** (#52, 1.5; grid doc §5b). When a floor ends, the renderer draws the floor map: the run so far
  (the last four floors, "you are here"), a fork to each candidate room and 2 path cards (3 from floor 6, one before
  a boss). A card is a floor with at most one feature and one condition, the danger in skulls; hover it and its road
  inks itself and the margin gives the full text with + and -. Click to go down.
  - Features: the six blessing curios and the Locked Chest are sure to stand on that floor (in place of a random
    curio); Elite Pack and Goblin Den turn it into that map's floor.
  - Conditions, each with a price and a payoff: Silent Halls (no Noise from crits and skills, drops -20%), Haunted
    (ultimates +50% faster, every kill Noise +1), Flooded (drops +30%, cooldowns +20%), Pitch Dark (gold +50%,
    enemies hit 15% harder), Swarming (Souls +50%, packs 50% bigger), Cursed (the Cursed Floor).
  - Maps from loot are their own card ("uses your map"); at most three cards fit, one generated path always stays.
  - Away 5 s in all (it adds up across glances), the party takes the safest path (no condition first, never a map)
    and says so in the Feed. The hourglass marks it; the footer counts down.
  - Card texts come from tuning.ts (`src/data/routes.ts`); the boss floor's note names the boss.
- The 0.44 parchment map of the whole descent (#48) and its CSS are gone. F1's End floor now ends the floor properly
  (with its route choice). New `test/routes.ts` (every feature and condition, the away rule), `test/dmap.py` reshot.
- Sims (good, 3 nights): depth 5 to 6, 2 to 3 runs, encounters 9 to 13 s, rare+ 17 to 21 a night (unchanged; tuned
  in 1.9). Idle: depth 2 to 3, 2 to 4 wipes, caught 0 to 1 (0 to 2 before, the same spread). Autopilot test
  unchanged: away on the floor 10 boss wipes 30/30.

## 0.54.0 (2026-11-24)

- **Run blessings** (#52, 1.5b). Curios are their only source; a blessing lasts until the run ends, stacks, and
  every one has a cost. Five new curios and two reworked, each with its bargain and "Leave it": the Wayside Shrine
  (+20% damage, the bell: Noise +15), the Pilgrim (cooldowns -15%, no town portal until the next boss is dead), the
  Supply Cart (+25% drops, max HP -10%), the Potion cart (50/50: +30% healing, or broken glass for 10% HP; Noise
  +15), the Blood Altar (+30 crit, heroes bleed 1% HP a second outside fights), the Moonwell (ultimates charge 40%
  faster, Flow drops to x1), the Ritual Circle (Souls +50%, enemies +20% HP). Away, the party may take the bargain
  on its own. Blessings sit right-most in the buffs row (dashed frame, "run" or x2); the run end card lists them.
  The green flame's can offering and the cart's "Pay" are gone; the chest, coffin, bank and troll stay as they were.
- Sims (good, 2 runs): depth 6 to 8, Souls 140 to 198 (the chant), encounters 9 to 13 s. New curios have stand-in
  sprites until Paweł's.

## 0.53.0 (2026-11-24)

The RPG on its own, part 2 (#52, steps 1.3 and 1.4).

- **Packs.** An encounter is a pack of 5 on floor 1, growing by one every two floors (at most 12): six stand on
  screen, fodder in two close lanes and a boss or the Shaman behind them; the rest wait off screen and slide into a
  free rank as the front ones die. Pack members have 1.4x a lone enemy's HP and half its attack. Enemies now pick
  ranks: melee hits the front two (the knight 70%), the Shaman the back, bats anyone; Taunt still takes it all.
- **Drops per kill**, where the enemy fell (35% a kill, a boss 3, an Elite Pack's lieutenant a rare). No more loot
  pause: the walk picks everything up. The first legendary of a save comes within its first 80 drops.
- **Runs.** A run starts at the Dungeon Portal, at floor 1 or a checkpoint you unlocked (◀ floor N ▶ by Enter the
  dungeon); beating the boss of floor 5n unlocks 5n+1 for good. Loot and gold picked up are unbanked (a dashed mark
  in the bag; the town portal plate says "bank 7 · 420 g") until the town portal banks them. A **party wipe** loses
  the run's unbanked items and gold (worn and locked ones too), keeps its Souls, and wakes the party in the city at
  full HP; the corpse run is gone. Logging off banks the run. A run end card shows what was banked or lost.
- **Souls** replace scraps everywhere: +3 + floor for each floor cleared, +20 for a boss, salvage as before.
- The old cave drawing (`ui/dungeon.ts`) is gone; units, numbers and drops are placed on the grid (`core/arena.ts`).
- Sims (good, 3 runs; the bot banks when the party is under 45% HP or the bag is nearly full, and turns
  auto-salvage on), before → after: depth 10 → 6 to 7, 3 runs a night (2 banked), level 7 to 8, Souls 31 → 120 to
  143; pacing: an encounter 6 s → 10 to 11 s, a floor about 40 s, an item every 3.5 s of combat (target 3 to 5),
  a rare or better every 12 s (target 30: tuning in 1.9). Idle: 2 wipes a night, depth 2 to 3.

## 0.52.0 (2026-11-24)

- **The dungeon in the redesign's look** (V2, #67, the battle area). The walk, the fights, the curios and the loot are
  now drawn by the redesign's renderer from the game itself: the Shadow Crypt in Moonwell 32, the party of rigs
  walking in rank, the enemies in the front lane with the boss behind, HP bars, mark tags, a boss's cast as its name
  over a bar, floating numbers, loot in its rarity light with the beam, the corner with Flow in yellow, the town
  portal plate, the buffs, the curio's parchment card, and the skill bar with its two wells and the ultimate's gilded
  well (charge countdown, answer pulse, combo glow). Clicks and hovers go through the renderer's hit regions, so
  skills, the portal, the curio choices, hero portraits and the goblin work as before; tooltips too.
- Enemies without a rig on the page (bats, imps, the bosses), the curios and the goblin are the prototype's pixel
  sprites, lit and dithered like the rest, until Paweł's art. The town and the floor map are still the old drawing.
- The renderer redraws the battle area at 30 fps, about 22 ms a frame in headless Chrome (F1 shows it).
- Coach mark "Big attack incoming" points at the new skill bar. Sims unchanged (drawing only).

## 0.51.0 (2026-11-24)

The RPG on its own, part 1 (#52, steps 1.1 and 1.2).

- **Real-time combat.** Every unit attacks on its own timer: `BASE_ATTACK_SEC` (1.2) × 10 / speed, so speed 10
  attacks every 1.2 s (the old ATB took 3.3 s). Stuns and Fury count seconds (Bash stuns for 1.5 s; Fury starts after
  10 s, +3% a second). At max Flow the party attacks 25% faster (`FLOW_SPEED`).
- **Three slots per hero: two skills and the ultimate** (decisions 2026-11-20). Rally, Storm and Revive are gone. The
  third key (3, E, D) is the ultimate, charged over 20 s of combat (only during fights) and always cast by hand:
  Last Stand (6 s, nobody drops below 1 HP), Cataclysm (8x to every enemy, double on Staggered or Chilled), Miracle
  (revives everyone, full heal). 4, R and F are dark. Until the trees (#53) the ultimates need only their charge.
- **Away means no skills.** The reckless autopilot is gone (no random targets, no late heals, no faster pulls, no
  ambush); away from the game the party fights on with auto attacks only.
- **Big numbers.** Enemy HP x1.15 and attack x1.12 a floor, item attack, HP and armor x1.12 an item level,
  compounding; damage and heals show as 1.2K, 34.5K, 1.2M.
- **Debug (F1): Real life on/off** turns off her, the phone, the dog, Tiredness, Noise, Mood and the night clock, and
  the overlay shows live pacing: encounter and floor time, items and rare+ a minute of combat. `LIFE=off` does the
  same for `test/sim.ts`, which now prints `pace`.
- Saves move to `lootnight.save.v2`: old saves start fresh.
- Sims (3 runs each), before → after: good depth 5, 5, 6 → 10, 10, 10, levels 4 → 7, epics 3 → 4 to 6, 0 or 1 wipe →
  1; idle depth 2 to 3 → 4, catches 0 to 2 → 0 to 2. Pacing (good): an encounter 6 s, a floor 40 s, about 15 items
  a minute of combat. `test/autopilot.ts`, 40 s on Excel: the floor-5 and floor-10 bosses wipe 29/30 and 18/30.
  Tuning to the 1.9 targets comes with the packs (1.3).

## 0.50.0 (2026-11-24)

- **The visual redesign is handed off.** Its package is in the repo at `design/redesign/` (the mockup page's code,
  every baked image, the palettes, 168 stills, a snapshot of the specs). Issues V1 to V13 are filed (#66 to #78),
  with the redesign's notes on #52 to #57.
- **One 640 × 360 grid at whole-number scales** (V1, #66). The game now shows at ×2 (1280 × 720), ×3 (1920 × 1080),
  ×4 or ×6, whichever fits the window, counted in device pixels, and letterboxes the rest. Before, it stretched to
  any size, which smeared the pixel art at most window sizes.
- **The redesign's renderer is in the build** (V1, #66): the mockup page's own drawing code (`src/render/`) with its
  three palettes, Bayer dither, UI materials, actor pass and the four pixel fonts (Tiny5, Silkscreen Bold, Micro 5,
  Jacquarda Bastarda 9; OFL, embedded). Nothing in the game uses it yet: F1, "Redesign frame", draws the mockup's
  frame over the game (Dungeon, Battle, Map, Town, Q4), crisp at ×2 and ×3. Against still `00-default` it differs
  only where the animations stand at another moment. Next: V2 and #52 wire the RPG screens to the game.
- Cost: the build grows from 1.0 MB to 1.6 MB; the renderer draws the full frame in 50 to 70 ms and the RPG screen in
  about 22 ms in headless Chrome (2 cores), so V2 has to cache before it draws every frame.
- Tools: `test/pkcheck/` (the renderer alone against the still; top-level names declared twice),
  `test/her_native.py` and `test/her_redesign.py` (her art at game pixels, from 2026-11-20). Sims unchanged.

## 0.49.8 (2026-11-19)

- `test/her_screens.py`: every place she appears, for redrawing her (her at the door in every outfit, through the
  crack, the shower daydream, leaning in, the mornings, the caught face), plus a model sheet of every outfit and
  face drawn by the game's own code (test hook `window.__lnHer`). No game changes.

## 0.49.7 (2026-11-19)

- **Her questions lean into your face** (#65). She no longer sits on the desk over the battle area. She leans in
  from outside the right edge over the whole screen (webcam, monitor, desk; the rest dims), bent forward with her
  head tilted, her body running off the bottom right. Her line sits by her face, your three answers on the left in
  bigger buttons. Poses by sweet answers: a finger on her lips, twirling her hair, her chin on her fist. Same rules
  and timers (hotkeys still work); the toasts say "She leans in between you and the screen." and "She leaves you
  to it.". Sims unchanged (drawing only).
- **The plan: your desk and your bed swapped** (#65), so the door is right behind you, as the webcam view shows.

## 0.49.6 (2026-11-19)

- **Your room is at the end of the hallway** (#64). The crack looks straight down the hallway, so your door is at
  its end, where 0.49.5's plan had the front door. The plan is redrawn around that: the kitchen beside your room
  (its opening first on the right), the bathroom further down, the living room along the left with its opening at
  the far end next to the bedroom door. Both the kitchen and the living room still share your walls, so who hears
  you is unchanged. No front door on the sheet (nothing uses it, the crack doesn't show one).
- **His eyes match the crack.** A new sound from the bathroom or the bedroom now turns his glasses to the right
  of the webcam picture, the side the crack shows them on (they turned left). The living room stays left, the
  kitchen and the hallway right. Sims unchanged (his eyes are a tell, not a rule).

## 0.49.5 (2026-11-19)

- **The plan matches the apartment again.** The blue sheet on his wall still showed the layout from before the
  door-crack view. It is redrawn from the hallway you see through the crack: your door opens onto the hallway,
  the kitchen's open doorway is right across, the bathroom door further along, the bedroom door and the living
  room's opening at the far end; the living room shares your wall; the front door is at the near end. Numbers 1
  to 3 mark what the crack shows first, then next, then only when wide, and the text under it says who hears you
  best. The corner of the sheet in the webcam view uses the same layout (`src/ui/plan.ts`).
- `test/redesign_chunks.py`: the redesign's windows grouped by purpose (her, hints, RPG windows, night overlays,
  end of the night), with a board per group.

## 0.49.4 (2026-11-19)

Everything on the phone happens inside the phone (#63).

- Tapping the idle phone used to open a Messages card floating next to it on the desk, and texting her or asking
  the boys to raid showed a "Typing..." card on the desk (the raid's even said "Making her tea..."). Now the tap
  brings the phone into your hand at Messages, with two chats, Babe (Text her) and The Boys (3) (Raid night?).
  Tap one and the message types itself into that chat, shows Delivered, and the phone goes down.
- No call or text arrives while the phone is in your hand (it used to vanish from the desk with nothing to show a
  call).
- A button's tooltip goes away when you use it.
- `test/phonemenu.py` now checks it: Messages in the phone, typing in the chat, nothing outside the phone, nothing
  rings meanwhile. `test/rl_screens.py` captures Messages and the typing chat in the phone.

## 0.49.3 (2026-11-19)

- The phone's Messages menu (tap the idle phone: Text her, Raid night?) opened over the monitor's taskbar, and the
  taskbar hid its header and "Text her". It now sits on the desk beside the phone, below the taskbar (#63).
  New check `test/phonemenu.py`: the menu is below the taskbar and nothing covers it.
- `test/rl_screens.py`: every real-life screen (phone, dog, every pop-up) at 2x with contact sheets, for the
  redesign.

## 0.49.2 (2026-11-19)

Space didn't tilt the Goblin Fuel can (#62).

- Tilting needed the mouse button held down on the can at the same time; one click without holding left the can
  floating and Space did nothing. Now one click (anywhere in the shot) picks the can up and it follows the mouse
  from then on, and **Space tilts it wherever it is**, even before you pick it up. The Space hint shows whenever
  the can is upright, not only at his mouth.
- A focused button can no longer swallow Space (focus is cleared when the break opens).
- New check `test/goblin_space.py`: real clicks, Space away from his mouth, the can must tilt and ease back.
- Pour tuning unchanged (`test/pour.ts`: holding Space about 50%, a slow tilt about 90%).

## 0.49.1 (2026-11-19)

The Goblin Fuel break after Paweł's review (#62).

- **Drawer** shot is closer: the mouse pad sits right next to the keyboard, and the can's spot (the old green rings)
  is right of the pad. Under the desk: a power strip and cables instead of him.
- **Open** shows the whole can standing on the desk, smaller, with its branding in view; the tab is pulled on its lid.
- **Drink** is close on him, with no desk in the shot. He tips his head back, which turns his mouth up toward the can,
  and the can floats (no hand). Pour check (`test/pour.ts`): holding Space 48-50% (was 56-57%), easing off as his
  cheeks fill 80-93% (was 79-88%), a slow tilt 88-91%: a little easier, holding Space still fails.
- **Toss** has no character: the floating can, the bin and the room.
- No hands anywhere: the cursor moves the drawer, the can and the tab.
- **The can is B "Chest Burst"** (the design chat's pick): plum neck band "100% GREED", acid green, a gold burst, the
  crowned goblin bursting out of a loot chest, "Goblin FUEL" on a plum band. Drawn in vector from one painter as a
  stand-in until the pixel sprites are committed.
- Bots unchanged (the drink's look and feel only).

## 0.49.0 (2026-11-19)

The Goblin Fuel break is remade as five hands-on steps in a dark room (#61). He is the left panel's character in every
shot: dark silhouette, white glasses, drawn the same pixel way.

- **Drawer** (new, replaces the fridge, which he never had): a top-down shot of the desk's corner. Grab the handle
  and pull; it sticks, slides and thunks open. **Grab**: drag a can from the drawer onto the desk.
- **Open**: a close-up of the lid. Pull the ring up until the seal pops: PSSHHT, spray, a shake, a new pop sound.
- **Drink** is now a physics puzzle in side view: 80 drops of liquid in a see-through can. Hold the can with the
  mouse, bring it to his lips, hold Space to tilt and let go to ease back. He swallows at a steady rate; pour
  too fast and it runs down his chin or he coughs (Noise). 85% down is the full boost, 60% half of it
  (half the time, half the Tiredness drop), less is nothing. Cheeks puff as his mouth fills.
  Headless check (`test/pour.ts`): holding Space 56-57%, reacting to his cheeks 79-88%, a slow tilt 86-91%.
- **Toss** remade: rigid can physics with friction (the old one was wonky), one throw. A miss stays on the floor
  for good: it is saved, later throws land among the old cans and move them. `test/toss.ts`: 6 of 28 blind
  pulls go in; misses settle, none sink.
- New sounds: drawer slide and thunk, tab creak, pop, splash, can on desk.
- Tuning: `MONSTER_DRINK_FULL/HALF`, `MONSTER_HALF_MULT`, `MONSTER_FLUID_N`, `MONSTER_TILT_*`, `MONSTER_LIPS`,
  `MONSTER_SWALLOW`, `MONSTER_MOUTH_CAP`, `MONSTER_FLOOR_CANS_MAX`, `MONSTER_COUGH_NOISE` (the `MONSTER_GULP_*`
  values are gone).
- Bots: the sim drinks at 90% (full boost, as before), so balance is unchanged. Good bot 3 stars in 5 of 5 runs
  (one drank a can); idle bot unplugged.
- Plan: the Mini fridge upgrade in the handoff now skips the drawer step.

## 0.48.2 (2026-11-19)

The energy drink is now **Goblin Fuel** (#60: no real brands on Steam).

- Every line that said Monster says Goblin Fuel: the coach tip, the buff ("Goblin Fuel: party acts 30% faster"),
  the "of Frenzy" affix, the shrine curio's cost, the drink toast, the tiredness row, the button's label for
  screen readers. The key stays M ("Drink · M").
- The can is redrawn: acid green with a grinning goblin and "GOBLIN FUEL", in the energy-break scene and on the
  YOU card's button. The old black can with green claw marks copied a real brand's look.
- Code names (`monster.ts`, `MONSTER_*`, the save field) stay as they are, so saves and tests are untouched.
- No gameplay change.

## 0.48.1 (2026-11-19)

No more real people in the game, now that it is heading for Steam.

- The friends on the phone are Danny and Mike (were the real friends' names). Their characters keep their names
  (Magoo, Healero).
- Design bible: the personal pillar now asks for relatable jokes about a gamer's night, not jokes about one
  real friend; the eye-candy tone notes drop the one friend's personal taste (the generic look stays); the
  birthday ending is gone from the campaign plan.
- No gameplay change: bots unchanged.

## 0.48.0 (2026-11-18)

The town, second pass (#51), after Paweł's look at 0.47.

- **Square streets.** The winding streets read as messy; Ravenhold is now a grid like a SNES town: three streets
  east to west, two north to south, an avenue south from a square plaza. The portal court sits between the plaza and
  the portal.
- **Every building shows its trade**, and hangs a shop sign with its mark. The Appraiser's tower has a glowing
  crystal with circling runes, a telescope and star banners, and the appraiser works in a rune circle on the street.
  The Auction House is a columned guildhall with lots glowing on pedestals, an auctioneer and bidders with paddles.
  The Merchant has an awning, a window of bottles, a counter of goods and two stalls on the plaza. The Salvage Forge
  has its hearth open to the street, a lean-to with a scrap heap, an anvil and a smith hammering sparks. The
  Treasury is a squat vault with battlements, barred windows and guards. The Inn is half-timbered with bottle-glass
  windows and drinkers on a bench. The Library has stained glass, a clock tower and an observatory dome.
- **Plots look unbuilt.** No more scaffolding: cleared ground with stakes and string, a notice board with the
  building's mark, and its own materials as the clue (crates of books, strongboxes and a vault door, practice
  swords and a target, kegs and the tankard sign). The build window says "Empty plot, materials ready."
- **A town that's alive.** 75 to 90 people (more as the plots get built). Adventurers crowd the portal court and some walk into the vortex (a
  violet flash); townsfolk fill the plaza (a bard, kids round the fountain, people on its rim, stall customers);
  walkers on every street. The plaza and the court get the most light: fire bowls, strings of lights, torches, a
  rune ring, the fountain lit from inside.
- Lights that don't flicker are baked once per set of building levels, so the extra windows cost nothing per frame.
- UI only: bots unchanged (good: 3 stars, floor 5, never caught; idle: caught).
- Tests: `test/towninput.py` also checks the Appraiser and the Salvage Forge.

## 0.47.0 (2026-11-18)

The town remade (#50). The old city was two rows of buildings facing each other across a plaza, with the services
as buttons in the side panel: it read as a menu with pictures. Now Ravenhold is a place.

- **A jRPG town at night, seen from above.** It fills the whole battle area: stone houses under slate roofs,
  cobbled streets winding between them, a fountain on the round plaza, graves and dead trees under the ridge. Dungeon
  Portal at the top centre: a pointed arch with skulls and chains, a violet vortex turning inside, violet braziers.
  Candlelit windows, lantern posts, the forge's furnace, smoke and sparks, hooded walkers with lanterns.
- **Unbuilt buildings are construction sites** (foundation, half wall, scaffolding, a crane, stone blocks). Each
  level changes the art: the Training Grounds get barracks and a watchtower, the Inn a stable wing and a balcony, the
  Library a tower and a glowing dome, the Treasury gold trim and a gold dome.
- **The buildings are the buttons.** Names are painted on wooden signs in the scene. Hover: a soft gold halo, a hand
  cursor, the tooltip, a brighter sign. Click a service for its window, a plot for its new build window (effect now
  and next, Build / Upgrade with the cost), the portal to go down.
- **Side panel:** the SERVICES buttons are gone (each was a building on the map; the panel overflowed with them). The
  BUILD list stays, and an "Enter the dungeon · floor N" button.
- The MMO crowd with guild tags and chat bubbles is gone (the guild chat lives in the feed).
- UI only: bots unchanged (good: 3 stars, floor 5, never caught; idle: caught).
- Tests: `test/towninput.py` checks hover and click on the map (Merchant, Inn, Library, portal);
  `test/layout.py` shoots the town, hover, build window and two sets of built levels. Old screenshot scripts
  pointed at a stale repo path (fixed).

## 0.46.0 (2026-11-18)

Loot drives progress (#49, round 3). Before, a party that never equipped anything got almost as deep as one that
geared up, so loot was decoration. Now enemies outgrow a party that does not gear up, and the bag tells you what
to equip.

- **Difficulty and loot curves.** Enemies grow +60% HP / +45% attack per floor (were +25% / +24%). Items' main stats
  grow faster with item level (attack +2, HP +9, armor +1.2 per level; were +1.2, +5, +0.8). Levels give +4% HP and
  attack (were +10%); they still unlock the skills. Every normal battle drops an item (was 60%).
- **Upgrades at a glance.** A green ▲ on a bag item that would raise some hero's Power.
- **Item windows slow nothing.** The item details and the bag-full popup open over the side panel's party block (the
  bag stays clickable, the battle stays in view), with one Equip button per hero and its power change. The fight no
  longer slows to 30% and the clock no longer slows while one is open (only the floor map slows the clock now).
- Bots, before / after (24 nights each, night 1):

  | | Never equips at night | Equips upgrades as they drop |
  |---|---|---|
  | Before | floor 9.8, wipes only at boss 10 | floor 11.6, no wipes, gear = 55% of attack |
  | After | floor 5.4, wipes at boss 5 in 16 of 24 nights | floor 9.3, 4 wipes in 24 nights, gear = 62% of attack, about 30 equips |

  Four nights in a row: equipping as you go goes 9.8 → 12.1 → 13.8 → 14.2; gearing only in the city between nights
  stalls at about 10 with 0.7 wipes a night. Nobody was caught in any run; stars unchanged (3.0). The city fills
  faster with the extra drops (2+ buildings before each later night).
- Tests: the gear bot swaps junk for better drops when the bag is full; `test/balance.py` reports equips, gear share
  and wipes by floor; `test/campaign.py` takes `1500 gear`; `test/sim.ts` takes `TUNE` / `TUNE_STAT` for experiments.
  `test/autopilot.ts` gears up on the way (away at a boss still wipes 14 to 20 of 20; present survives 18 to 19 of 20).

## 0.45.0 (2026-11-18)

Monitor first (#49, round 2): the right RPG panel is gone and the whole RPG lives on a bigger monitor, with a side
panel inside the game screen. The layout is the "A1 final" board from round 1. Rules and numbers are unchanged.

- **Layout.** The webcam view and her panel are 296 px wide (was 280). The game screen is 948 x 464 (was 616 x 352):
  a 668 px battle area and a 280 px side panel. The desk is 192 px tall. All sizes are even, so a 640 x 360
  pixel-art version can scale by 2 (`src/ui/layout.ts`).
- **The battle area.** The dungeon and the city are drawn 1:1 at its bottom; a dark band above holds the dungeon's
  ceiling and the curio windows. No top bar: where you are and Flow are a quiet overlay in the top-left corner,
  and Flow glows for a second each time it passes a step of 0.5. The town portal sits under it. Buffs drop Flow,
  Zone and Tired (shown elsewhere). The skill-bar portraits lose their names; hotkeys are 10 px.
- **The side panel.** Party cards (level, power, XP line, "!" when behind; no HP), the selected hero's 3 x 2 gear
  grid and stats, the bag with the auto-salvage toggle in its header, the Treasury row (locks until built), gold,
  scraps and record. In the city: the build menu and the services (moved off the plaza), and the bag. Item details
  and the bag-full popup open next to the bag.
- **Loot pickup.** The item's name flies up from where it lay in its rarity colour (staggered when several), and its
  bag slot shines with NEW.
- **Real life.** A YOU card (Tired, Zone) with the Monster button (M): it glows only when you are tired, and turns
  into "Hide the cans" during a visit's footsteps. The feed is a card under it: newest on top, a tag per line (YOU,
  LOOT, HER, PHONE, GAME...), no tabs. Noise moved to her panel, under Goodwill. No cans, fridge or headset on the
  desk; the phone and keyboard are bigger and run off the bottom edge; the Tonight note is stuck on the monitor's
  bottom edge. The taskbar drops "bed 01:00" (the witching hour still shows).
- **Headset.** Click his head (H still works). A small headset icon beside his head, grey or cyan; hover shows a ring
  and a tip. A coach mark teaches it after the first passed visit, unless you found it first. His cups are cyan.
- **Her panel** fits four stat rows plus Noise after midnight (tighter slots). Her desk visit covers the battle
  area only; the side panel stays usable.
- Tests: new `test/layout.py` (every moment on one sheet); clips in the old screenshot scripts moved.
  `NOISE_HURRY` (70) moved into `tuning.ts`.
- Sims unchanged (UI only): good bot floor 9, 0 catches, 3 stars; idle bot caught and unplugged.

## 0.44.0 (2026-11-18)

Playtest polish: phone screens, the her panel, a quiet face-down phone and a real dungeon map.

- **Phone minigames, clean pass (#45).** Mom's replies are one per row. The lock screen shows the two newest
  banners plus "+N more", so the Face ID ring stays a full circle and "Put down" stays on screen. "Slide to
  answer" no longer hides under the knob (in your hand and on the desk). Courier and the boys: replies grow
  with their text instead of spilling out. Chats fade older messages at the top. The idle phone menu no
  longer slides under the Tonight note. New `test/phone.py` shoots every stage of every phone game.
- **Her panel keeps its layout (#46).** The last-heard line, her note, the "before" row and the stats have
  fixed slots; Patience and Goodwill no longer jump up when a row hides (a catch, a visit). A chat question
  and its three replies fit the note slot. New `test/herpanel.py` checks ten states.
- **Face-down phone is silent (#47).** No buzz, no shake, no countdown ring: an incoming call or message only
  makes a soft glow on the desk around the phone (it flares on each message, pulses during a call).
- **The dungeon map (#48).** Your whole descent on old parchment in faded ink, top to bottom: a row per level
  (five floors, the boss room at the end), rooms joined by stairs, each room showing what that floor was.
  "You are here", the checkpoint flag and your corpse are marked. The next floor is a pencil sketch; the
  choices are path cards under the map (hover one to see it on the map). Floor types are saved
  (`mapPath`), so the map keeps every night's descent. New `test/dmap.py`.
- Sims unchanged (UI only): good bot floor 10, 0 catches, 3 stars.

## 0.43.0 (2026-11-18)

The RPG plays it straight (#44): plain fantasy names and no real-life jokes in the game world, so the real-life
half carries the comedy. Names are short so they read at a glance. Mechanics and numbers are unchanged.

- **Party:** Knightenstein (knight, you), Magoo (mage) and Healero (healer). Party and guild chat use these
  names; the friends' phone calls still use Rafał and Jacek. Old saves are renamed on load.
- **Enemies:** Skeleton, Bat, Orc, Shaman (heals), Guardian (shield), Imps (swarm). New sprites.
- **Bosses:** the Ogre (SMASH), the Warlock (SUMMON / EMPOWER) and the Black Knight (EXECUTE). New sprites,
  a bit brighter so they read on the dark boss floor. The EXECUTE target moved to the hint line under the cast
  bar so the bar title fits.
- **Items:** two words, a rarity adjective and a slot noun (Iron Helm, Runed Band, Dragon Sword). An "of ..."
  suffix now appears only on special affixes, one word each (of Stealth, of Charm, of Focus, of the Wolf, of
  Midnight...). Items in old saves get new names on load.
- **Curios:** Locked chest, Sealed coffin (curse instead of a late fee), Shrine of the green flame (the offering
  still costs a real can), Potion cart. The guild bank stays.
- **World:** the town is Ravenhold, Monday's dungeon the Shadow Crypt; "Interest" is now Fury; Receipt Scraps
  are scraps; trade chat is MMO chatter.
- Later nights in the campaign plan renamed to match (Drowned Marsh ... the Lich Lord).
- Design pillar 6 and CLAUDE.md now say it: jokes in real life, the RPG straight.

## 0.42.0 (2026-11-18)

Tooltip pass (#43): every tooltip carries only what you need to decide, 2 to 6 lines instead of up to 12.

- **Hero:** name, class and the class description. Gone: the power formula, auto attack, stat line, click hint.
- **Pre-emptive actions** (towel, tea, text, raid): name, cost and one sentence on what it does.
  - "Works when / Otherwise" and the repeat rule are gone. That also fixes the towel's "Works when always".
  - A downside or condition stays when it would blindside you: the towel takes the light under the door; tea
    only works while she is in the living room or bedroom.
- **Skills:** name, hotkey and one line (a new `tip` per ability: numbers plus the one combo that matters), and
  the unlock level while locked. Gone: cooldown and Noise line, "use it when". The cooldown shows on the button.
- **Items:** name, rarity, slot and power, stats, special affix, and one line "▲ +4 power for Paweł". Gone: item
  level, sell price, the full stat comparison (still in the click panel), control hints.
- **Equipped gear, maps, the phoenix feather:** the same minus hints and prices.
- **Native hover titles** (Goodwill, the Witching Hour, the sticky note, skill buttons): one short line each.
- New `test/tooltips.py` hovers each kind and makes a sheet (`test/tips_sheet.png`). UI only, no rule changes.

## 0.41.0 (2026-11-18)

Onboarding, part 2 (#42): a player now knows what a good night is, and the core loop is coached where it
happens.

- **Tonight sticky note:**
  - A yellow Post-it on the desk, left of the monitor stand, always visible in the game and in Excel.
  - The three stars, live: "★ plug stays in", "★★ she's happy", "★★★ not caught". Each is marked ✓, ! (her
    Mood is red) or ✗ (lost for tonight).
  - Also on it: when Sleep opens (23:00+) and "deeper = better loot". Hovering it explains the stars.
  - Until now the stars only appeared on the results screen.
  - A right-panel section was tried first: there was no room, it squeezed the feed to two lines and cut off the
    party's stats.
- **Coach marks for the core loop, once per save:**
  - The first footsteps ("Press Tab now"), her first time in the doorway ("answer her in her note"), the first
    phone, the first loot ("right-click to equip") and the first boss wind-up ("hit a skill now").
  - Each one is a callout next to the thing with a ring around it. The game crawls at a quarter speed
    (`COACH_SLOW`) until you do it, the moment passes, 14 real seconds run out (`COACH_MAX_SEC`), or you close
    it with ✕.
  - A more important mark bumps a less important one (footsteps over the doorway, over the phone, over the
    wind-up, over loot), and the bumped one comes back next time.
  - Never shown over the jumpscare. Those moments' feed tips are gone; the other first-time tips stay.
- **Tests and sims:**
  - New `test/coach.py`: each mark through the game, the crawl (0.25x), clearing by doing the thing, ✕, the
    bump, and screenshots. `test/tips.ts`, `test/onboarding.py`, `test/webcam.py` and `test/sound.py` pass.
  - Sims (8 good, 6 idle): good depth 10.0, visits 5.6, 0 catches; idle caught 0.83. No rule changes.

## 0.40.0 (2026-11-17)

Balance pass, round 1 (#2). Numbers from new tools; outside playtests are next (docs/playtest.md).

- **Measured first:**
  - `test/balance.py` runs many bot nights and reports visits, how many visit types two nights show, catches,
    Noise and income against the cheapest building.
  - `test/campaign.py` runs `NIGHTS=n` campaigns in `test/sim.ts`: the save carries over, and at 20:00 the bot
    equips, salvages, sells and builds like a player.
- **What the numbers say:**
  - Visits are fine: 5.1 to 5.6 a night, and 82 to 86% of two-night pairs show 3+ types that need different
    answers. The issue's old "only 2 to 4 visits" is out of date.
  - The skill pace is fine: floor 9 to 10 by 01:00, 1.4 to 1.6 wakes a night. Decision: instant skills stay
    (dungeon.md).
  - The city was not: gold came only from selling drops, so a third of campaigns could not afford a single
    building before night 2.
- **Floor bounty:** clearing a floor pays 5 + 3 × floor gold (`FLOOR_GOLD_BASE`, `FLOOR_GOLD_PER`; about 180 a
  normal night), with a feed line.
  - Campaigns (12 × 3 nights), before → after: a building before night 2 in 8/12 → 12/12 runs; builds before
    night 2 0.8 → 1.6, before night 3 1.7 → 1.7.
  - The city grows one or two buildings a night, and a 7-night campaign does not finish it.
- **The results screen counts your bag:** "Sell and salvage your bag in the city: it pays for the Inn." It used
  to say "6 scraps short" while the bag held 50 scraps' worth.
- **F1 line:** income tonight, what the bag sells and salvages for, and the next build ("now", "with the bag",
  "short").
- **Sims:**
  - 16 good nights, before → after: depth 9.6 → 9.9, visits 5.6 → 5.1, caught 0 → 0, wipes 0.25 → 0.12,
    wakes 1.6 → 1.4, Noise 30 → 28, gold in hand at the end 162 → 364.
  - 8 idle nights: caught 0.88 → 0.62, unplugged before midnight either way.
- New `docs/playtest.md`: a one-page protocol for outside playtests against the five slice criteria.

## 0.39.0 (2026-11-17)

First-night onboarding (#28): the first night teaches by happening, no walls of text.

- **Title screen:** the eight-bullet wall is gone. Two lines of pitch (raid night, she thinks you are doing
  spreadsheets; the RPG plays itself, you listen, hide and keep everyone happy) and "turn the sound on".
- **How-to-hide card:**
  - Opens when the first night starts; the night waits until "Got it" (or Esc / Enter).
  - Four tiles: Listen, Tab to Excel, Answer her, Headset.
  - The pause menu has a "How to hide" button to reopen it.
- **First-time tips:**
  - The first time each thing happens, one line from her or the guild chat (Rafał and Jacek, your party) in
    the feed, pinned at the top for 9 s so combat lines cannot bury it.
  - Her opening line ("I'm watching my show, babe"); the plan on the wall after 40 s.
  - On events: footsteps, a pass, a catch, an end cue, a call, a message, the dog, a yawn, the headset, her
    bedtime, a peek, the first loot, the first floor choice, the shower.
  - Once per save; a new game starts them over.
- **Labelled cues on night 1:** besides the hallway cue of each visit, her note now names the cue that ends each
  activity ("The kettle clicked off. Tea, then maybe a snack run."). The kettle's end cue is heard as
  "KETTLE CLICK", so the last-heard line tells it apart from the boiling.
- **Tests and sims:**
  - New `test/tips.ts`: the card holds the night, tips once and pinned, kept in the save, reset by a new game.
    Passes.
  - New `test/onboarding.py`: the title, the card, the pause button, Esc, the pinned tip, the end-cue label.
    Passes.
  - The headless tests that run the game loop now close the card like a player would. While fixing that, a
    broken insert had disabled the autopilot's and alt-tab's dungeon start for a moment; it was caught and
    both run as before.
  - Sims (4 good, 4 idle): good depth 9.8, visits 6.0, 0 catches; idle caught 1.0. No rule changes.

## 0.38.0 (2026-11-17)

The webcam view's frame (#41).

- The door is centred in the frame again, lined up with him below it (it had moved right in 0.35 to make room
  for the plan).
- The plan on the wall shows only partly: the corner of the blue sheet comes in from the left edge, with tape on
  its corners and a small "plan" label. That corner is the click area; clicking it still opens the full plan.
- The shower daydream bubble follows the door to the middle.
- `test/webcam.py` (the plan opens and every way to close it works) and `test/peek.py` pass. UI only.

## 0.37.0 (2026-11-17)

Him, redesigned (#40): a centred silhouette with screen-lit glasses, in a dark room.

- **Centred:** at the bottom of the webcam view, as a bust; his hair stays just below the light gap, so he
  still never covers the doorway, the crack, the gap or her toes.
- **A silhouette:**
  - Near black with a grey rim and a soft backlight. His glasses catch the screen and shine white, with a
    bloom in the screen's colour (cool for the game, green-white for Excel).
  - No eyes, no mouth by default: mysterious and stoic.
- **The comedy is in the emotes**, which only come when something embarrassing happens:
  - She walks in: a wobbly mouth and a sweat drop.
  - Caught: popping eyes, mouth wide open, sweat everywhere.
  - Cuddle ask: fogged pink glasses, blush lines, steam.
  - A big drop: a wide, slightly evil grin with a glint.
  - The yawn.
  - Nodding off: the glasses slide down his nose.
- **Stoic states:**
  - Full Zone: hands steepled in front of his face, a glint.
  - A pass: a small exhale.
  - A sound: his head and glasses turn toward it.
  - Tired: the glasses dim.
- **The room:**
  - Black and grey walls, floor and door (no brown); a steel handle.
  - The left panel's background is dark grey too.
  - Her world (the light under the door, the hallway in the crack, her) is the only warm colour.
- Small fixes:
  - The peek hint sits on the door now, not on him, and hides during his shower daydream.
  - The daydream bubble rises from his new head position.
- `test/him.py` re-cropped; `test/webcam.py` passes. UI only, no rule changes.

## 0.36.0 (2026-11-17)

Left panel rework, part 3: his face reacts and shows his state (#37, #38). The rework is done; the poker face
(#39) stays an idea for the arc.

- **Reactions (#37), automatic:**
  - She comes in: he freezes, guilty smile and a drop of sweat, eyes on her.
  - Pass: relief, which lingers for 2 s after she leaves.
  - Caught: panic, before the jumpscare.
  - Cuddle ask, her lean visit, good night: a blush.
  - Chat answers on his face: good is a grin, meh is flat, rude is a frown.
  - An epic or better drop: he grins for 2.5 s (`HIS_GRIN_RARITY`, `HIS_GRIN_SEC`; kept in `n.grin` for the
    poker face, #39).
  - A new sound of her: his eyes flick to its side (`ROOM_LOOK` in `src/data/apartment.ts`). With the headset
    on he does not react.
- **Status (#38):**
  - Tired: heavy eyelids, and he yawns with the yawn.
  - Microsleep: he nods off (eyes shut, head drops, "z").
  - Full Zone: a focused look and a purple glow.
  - Monster: jittery.
  - The headset is on his head while worn.
- Rules in the new `src/systems/him.ts` (`updateHim` in the loop, `hisLook`); art layers in `src/ui/him.ts`.
- **Tests and sims:**
  - New `test/him.py`: every expression, the eye flicks, the headset (`test/him_sheet.png`).
  - `test/webcam.py`, `test/peek.py`, `test/sound.py` pass.
  - Sims (3 good, 3 idle): good depth 9.7, 0 catches; idle caught 0.7. No rule changes (the grin has no
    effect yet).

## 0.35.0 (2026-11-17)

Left panel rework, part 2: the blueprint panel is gone; the left panel is the webcam view of him (#36) with the
plan taped on the wall (#35).

- **The webcam view (#36):** the left panel is what the webcam on top of his monitor sees: him low on the left
  in a gaming chair, facing the camera, your door behind him at its old size, the floor running toward the
  camera. A small webcam sits on the monitor bezel. He overlaps only the door frame, never the doorway, the
  crack, the light gap or her toes. While peeking he turns around (the back of his head). The headset shows on
  his head while worn. New art: `src/ui/him.ts` (one head pose, expression and gear layers ready for #37,
  #38).
- **The plan on the wall (#35):** the blueprint is a taped sheet left of the door. Click it to open it large
  over the panel (the plan, the line of sight, a line on which rooms are next to yours), with the game still
  running; close with ✕, Esc or a click outside.
- **The shower panel became his daydream:** it used to sit over the map; now a thought bubble rises from his
  head with the frosted cabin (same rules: headset off, no visit, not peeking).
- **The space under the view:**
  - The last-heard line hides while she stands in the doorway.
  - The "before" row hides during a visit; every action said "too late" then.
  - So the tallest note (a chat question with three answers) fits without pushing the stats off.
  - The headset line is shorter, and her note under the headset reads "In the zone. She could be anywhere."
- **Tests and sims:**
  - New `test/webcam.py`: screenshots of idle, peeking, her in the doorway, a pass, the headset, the shower
    daydream, her toes and a chat; checks that the plan opens and that ✕, Esc (without pausing) and a click
    outside each close it.
  - `test/peek.py` and `test/sound.py` pass.
  - Sims (3 good, 3 idle): good depth 8.3, 0 catches; idle caught 0.7. Rules unchanged, UI only.

## 0.34.0 (2026-11-17)

Left panel rework, part 1: two of the blueprint's jobs move out (#33, #34). The rework replaces the blueprint
panel with a webcam view of him (#35 to #38, next); it comes before onboarding (#28).

- **Last heard (#33):** one line between the map and the her-note: "♫ KETTLE · kitchen · 12 s ago",
  "♫ STEPS · hallway · now", "♫ ZZZ · bedroom". After `APT_STALE_SEC` it dims behind a "?" (her phone is
  silent). Headset on: "Headset on. You hear nothing. (H)". The data was tracked all along but nothing drew it;
  her.md claimed the blueprint did. It replaces the map's footer line.
- **Peek through the crack (#34), replaces the pink cloud:**
  - Behind your door is now one fixed picture of the hallway, laid out like the blueprint. The crack opens from
    the door's right edge: the kitchen right across shows first, then the bathroom door, then the far end
    (bedroom door, living-room opening).
  - Hold the door: a narrow crack in 0.5 s, then it creeps wider over 7 s (`PEEK_CRACK_MIN` 0.15,
    `PEEK_CRACK_MAX` 0.66 of the door, `PEEK_CREEP_SEC`). The old fixed 0.34 is gone from door.ts.
  - Her tells: her at the kitchen counter from behind with kettle steam; the bathroom light strip; steam and a
    frosted shape in the bathroom door's glass; blue phone glow on the far ceiling; the far door ajar and dark
    when she sleeps; TV flicker and her bare feet on the sofa armrest; her head to toe in the hallway.
  - Detection is the same rule (`PEEK_SEEN` times how open the door is), so a narrow crack is safer now:
    noticed from the hallway in about 2.5 s; the living room comes into view at 6.4 s and she notices at 8.7 s.
  - Removed: the cloud, `peekReveal`, `peekOff`, `PEEK_REVEAL_SEC`, `PEEK_FORGET_SEC`.
  - New art: her from behind (`drawHerBack`).
- The blueprint shrinks to 168 px so the panel still fits; it moves onto the wall with the webcam view (#35).
- **Tests:**
  - `test/peek.py` is rewritten: it screenshots every row of the table at its crack width, plus each wide open
    (`test/peek_sheet.png`).
  - New `test/peekcrack.ts`: the crack timing and who can see you. Passes.
  - Sims (4 good, 4 idle): good depth 9.8, visits 6.0, 0 catches; idle caught 0.5. Unchanged, since the bots
    never peek.

## 0.33.0 (2026-11-17)

Real audio for her cues and audio-first loot (#13). Music moved to #32.

- **Her sounds are recordings and models now, not beeps:**
  - Wooden-floor steps (soft ones when she moves between rooms), the door latch, the door opening and closing
    behind her when she leaves.
  - **Continuous loops while she is at it:** a TV show with two people talking and a laugh track now and then,
    a kettle that gets louder towards the boil, the shower. Each loop stops when its end cue takes over.
  - **End cues:**
    - TV: credits music.
    - Tea: the boil peaks and the switch clicks off.
    - Toilet: the flush, then the tap and a squeak.
    - Shower: the hair dryer.
    - Phone: a muffled "ok, bye, love you".
  - **Visit cues:** plates clink on a snack run; she hums on her way to a chat.
  - **Distance:** her sounds now get quieter and more muffled the further away she is (`APT_ROOM_GAIN`,
    `APT_ROOM_LOWPASS`). The bedroom is faint, the living room is right through the wall. Before this, every
    room sounded the same. The headset still muffles all of it (`HEADSET_APT_LOWPASS`).
- **Audio-first loot (synergy.md):** each of these has its own sound and a Feed line, so you know what happened
  while Excel covers the screen:
  - **Legendary:** a fanfare with drums. The other rarities are a ladder of bell pings.
  - **Full bag:** a thump and "nuh-uh", plus a new Feed line.
  - **Goblin:** it giggles over jingling coins; caught, it squeals; escaped, it taunts and its coins fade away.
  - **Downed hero:** a body thud and three sad notes.
  - **Boss enrage:** a roar. It used to share the sting with getting caught; the sting is hers alone now.
  - **Party wipe:** wah wah wah waaah, then he slams the desk.
- **The desk:**
  - A phone that rattles on wood, the Monster can's crack and fizz, gulps, a fridge (it used to be the room
    door), cans clanking in the bin, keyboard clicks and a real-sounding dog.
- **How the sounds are made (`tools/sfx/`):**
  - Kenney CC0 recordings (steps, doors, latch, creaks, plates, tins, coins, impacts; thanks, kenney.nl) plus seeded Python synthesis
    for everything with no free recording (TV voices, laugh track, credits, kettle, shower, dryer, flush, tap,
    her voice, phone, can, dog, the RPG cues).
  - 72 MP3 files, inlined into the single-file build: 361 KB → 928 KB (482 KB gzipped).
  - Your own recordings go in `src/assets/sfx/own/` and replace a cue by name. The F1 debug panel has a sound
    board to audition every cue.
- **Fix:** a mouse-up on the title screen threw two errors (no night yet).
- **Tests:**
  - New `test/sound.py`: in Chrome, all 72 files decode; the loop points are exact; the TV, kettle and shower
    follow her activity and stop at the end cue and on a visit; the headset muffles them without stopping them.
  - Sims unchanged (12 good runs each, v0.32.0 → v0.33.0): depth 9.4 → 9.6, visits 5.4 → 5.3, 0 catches,
    wakes 1.7 → 1.9, all within noise.
  - Idle (6 runs): caught 0.8 → 0.5, visits 2.7 → 3.2.
  - All headless tests pass.

## 0.32.0 (2026-11-17)

Eye-candy (#22), the three small moments.

- **Shower panel:** while she showers (and you can hear it), the apartment map becomes a frosted glass cabin with
  her blurred silhouette, water, steam and drips. The fog thickens; at the hair dryer the water stops and the
  glass clears bottom-up for a few seconds, then it is the map again.
- **Hoodie walk-by:** green Mood at bedtime, she stops at your door in your dark gaming hoodie, sleeves over her
  hands: "Night, babe." Mood −5, no check, once a night. New outfit: the big gaming hoodie.
- **Morning vignette by how the night ended:** green, hugging your pillow; yellow, back turned with her phone
  still lit; red, asleep on the couch in the TV light; unplugged, an empty bed and a note.
- `test/walkby.ts`: 5 checks pass. Sims (8 good runs): depth 9.4, visits 5.4 (the good-night visit counts),
  0 catches.
- Still planned in #22 for later nights: "How do I look?" (#12) and "Wanna join?" (night 5, #3).

## 0.31.0 (2026-11-17)

Synergy, part 3 of 3 (#29, done): the Witching Hour.

- From 01:00: the clock turns purple, the dungeon fog violet. Every drop has a 35% chance to shift up one
  rarity (the drop line says so). Insomniac affixes roll only then: of the Night Shift (attack after 01:00),
  of Red Eyes (crit at Tired 70+), of the Second Wind (max HP after 01:00), of the Dawn Chaser (luck after
  03:00).
- Staying up is a greed choice now (6 good-bot nights each): bed at 01:00, 4.8 epic+ drops, 1.5 wakes, sleep
  debt 1.3; bed at 02:00, 6.7 epic+, 5.5 wakes, sleep debt 7.0.
- `test/witching.ts`: 5 checks pass. The synergy audit has no dead ends left among the slice systems.
- Not built from #29's list, on purpose: Alibi stacks (cut with Looks busy in 0.20); Fed (needs the dinner
  shout, #23); Hug and Help me Goodwill (#12).

## 0.30.0 (2026-11-17)

Synergy, part 2 of 3 (#29): Goodwill.

- **Goodwill**, a 0-100 bank of good moments with her, on the door panel (Patience and Caught now share one
  line above it). Earned: a good cuddle +20, sweet answers on the desk +20, a good chat +8, her bedtime text
  answered +5, a lean visit +3. Every catch costs 15. Half carries over to the next night.
- **Forgiveness** (automatic at 60, once a night, spends 60): a catch does not count and she lets it go.
- **Raid night?** on the phone (40 Goodwill): no visits for 150 s, and Noise does not end this calm: she knows.
  No diminishing returns, no suspicion. Not after midnight.
- `test/goodwill.ts`: 9 checks pass. Sims (8 good runs): depth 9.8, visits 5.0, wakes 2.1, 0 catches.

## 0.29.0 (2026-11-17)

Synergy, part 1 of 3 (#29): cross-layer echoes and payouts.

- **RPG → life:** a legendary makes him yell "LET'S GOOOO" (Noise +15, +5 into the headset mic; she asks "what
  was that??" if she can hear). A boss below 25% HP is ENRAGED: Flow builds x1.5 for the fight, and alt-tabbing
  out of it resets Flow. A wipe makes him slam the desk (Noise +10) and the dog comes over.
- **Life → RPG:** a good cuddle gives **Loved** (+15% damage, +10% crit for the next fight). Tired 70+ makes
  the party **Drowsy**: 10% of hero hits miss ("zzz"). Every catch now brings Guilt, not only the second.
- **The dog pays:** petting him mostly on his favourite spot gives **Good Boy** (loot goblins x2 for 60 s).
  Cables back in within 6 s restore your Flow.
- Party buffs can last "the next fight" (Loved) and add crit. New buff icons: Loved, Good Boy.
- `test/echoes.ts`: 14 checks pass. Sims (10 good runs): depth 9.9, visits 4.7, wakes 2.1, 0 catches,
  average Noise 34 (28 in 0.28: the yells and desk slams). Not tuned yet; the balance pass (#2) owns it.

## 0.28.0 (2026-11-17)

- **Two new calls** (#23), both short dialogues on the phone:
  - **Courier** (until 22:00, at most 2 a night): talk him into leaving the parcel with a neighbour (two
    steps, three replies each, one wrong word and he leaves). The parcel is a rare-or-better item in your
    bag. Ignored or declined: the parcel is lost, nothing else.
  - **The Boys** (group call, at most 3 a night): they are on speaker, Noise every second the call is open.
    Decline them politely twice for a **Raid buff** (party +20% damage, +10% speed, 30 s); a rude reply makes
    them louder, two and they hang up. Ignored: Discord rings on the PC at full volume (Noise +30). Declined:
    group chat spam (Noise +15). With the headset on it all goes into your ears: no Noise.
- Interrupts are now weighted (Mom 3, boss 3, courier 2, the boys 2) with per-night caps. Calls share the
  ringing, decline and face-down rules Mom had. F1: Courier and Boys buttons.
- Party buffs are one list now (curio buffs, the raid buff), each with its own icon and duration, and they
  count down in town too.
- `test/calls.ts`: 14 checks pass. Sims (10 good runs): depth 9.5, visits 5.0, wakes 1.7, 0 catches; the bot
  answers both calls (2 couriers and 3 group calls a night). Idle still unplugged and caught.

## 0.27.0 (2026-11-17)

- **Pre-emptive actions** (#19): verbs used before she comes, to shape her next visit. The framework: hands
  busy or away from the desk (empty chair, reckless autopilot, a visit then sees whatever is on screen), a
  hidden condition on where she is (wrong = backfire), half effect the 2nd time a night, suspicion on the 3rd
  (her next visit is a check). A calm (no visits) ends if you get loud. Debug: F1 → Calm +30s.
  - **Text her** (tap the idle phone, 3 s): her next visit waits 40 s, Mood -5, and her reply tells you what
    she is doing. On her way somewhere: she comes to chat. Shower: chat after.
  - **Make her tea** (door panel, 15 s away): Mood -15, 60 s calm; watching TV she asks you to stay for one
    episode (60 s more away, 120 s calm). Kitchen: a long hug. Hallway: she glances at your screen.
  - **Towel under the door** (door panel, toggle): your Noise reaches her 40% quieter, she gets up 30% less
    often; you lose the light under the door and her steps are half as loud, and she asks about it every visit.
- Tea calm cut from the plan's 2 min to 60 s and the episode's 4 min to 120 s: at the planned numbers a bot
  using tea and the episode twice a night got 0 to 1 visits.
- Sims, 10 good runs each: no actions depth 9.7, visits 5.1, wakes 2.1 (batch-to-batch range 3.6 to 5.1);
  tea and episode twice a night, 1.0 visits, depth 5.4, 0.7 wipes; tea but declining the episode, 3.3 visits,
  depth 8.8. `test/preemptive.ts`: 21 checks pass. Idle still unplugged.

## 0.26.0 (2026-11-17)

- **Curios in the corridor** (#30), the RPG's third verb. On battle floors, 1 or 2 walks stop at a curio with
  two choices, each costing something from real life: locked strongbox (pick 8 s quiet / smash, Noise +25),
  overdue mailbox (gold, a rare or a late fee), energy-drink shrine (offer a real can from the desk for a big
  buff / pray, coin flip), snoring troll (sneak 6 s on the RPG screen, alt-tab wakes him / fight a mini-boss),
  guild bank vault (a free rare; Rafał reads the log later and sulks), vending machine (pay gold / kick it).
  The party waits 7 s, then walks past; ✕ leaves. Away, the party does the loud thing half the time.
- New buffs on the monitor: Monster blessing, Small blessing, Late fee, Rafał sulks.
- Sims, 10 good runs (quiet choices): depth 9.6, 0 catches, visits 4.6, wakes 1.1, Noise 27 (0.25: 5.0, 2.2,
  29). Always the loud choice: visits 5.8, wakes 3.1, Noise 44. Idle still unplugged and caught.

## 0.25.0 (2026-11-17)

RPG depth, part 3 of 3 (#27, done).

- **Special affixes**, at most one per item, named by its suffix:
  - Real-life (epic, legendary): of Peace (hear her steps through the headset), of Quick Fingers (alt-tab 30%
    faster), of Five More Minutes (Tiredness 20% slower), of Infinite Excuses (once a night a catch becomes a
    pass), of the Night Owl (Noise wakes her 30% slower), of Many Cans (cans hide themselves on a Snack run).
  - Cross-system (rare and up), a stat while something in real life is true: Headset Hero (crit, headset on),
    Caffeine (speed, Monster), Library Voice (attack, Noise under 30), Sweet Talker (attack, Mood green),
    Good Boy (luck for 60 s after petting the dog), Spreadsheet Warrior (3 gold per kill on Excel).
  - Roll rates: rares 30% cross; epics 35% real-life, 45% cross; every legendary has one. Hidden until
    identified. Pink and teal tooltip lines; cross-system lines say Active or Inactive.
- Random name suffixes that now are real affixes (Five More Minutes, Night Owl, Infinite Excuses) left the
  random pool, so a name never promises an effect it does not have.
- `test/affixes.ts`: roll rates and that the effects switch on. Sims unchanged (the bot does not equip):
  8 good runs depth 9.6, 0 catches, visits 5.0, wakes 2.2. Alt-tab test 200/200 both ways.

## 0.24.0 (2026-11-17)

RPG depth, part 2 of 3 (#27).

- **Three enemies that each ask for a different answer**: The Auditor (floor 2+) heals his friends; Frost now
  goes for a healer first. Tax Shelter (3+) takes 25% damage until a Bash breaks its shield; Bash now goes for
  a shield before the front enemy. Junk Mail (4+) is a swarm of 5 envelopes: one per single hit, all of them
  per Fire. The first meeting with each shows a line on what it wants.
- **A boss per checkpoint floor**: 5 the Bailiff (FINAL NOTICE, as before), 10 the Loan Shark (a loan every 3rd
  action brings a friend; a friend still standing is refinanced: full HP, harder hits), 15 the Landlord (a
  deposit shield Bash breaks; EVICTION on the most hurt hero, 90% of their HP; Taunt or Ward). Then around
  again. Cast bar text and red answer pulses per boss; the node map names the boss.
- When a boss dies, the enemies still standing run.
- **Two maps**: Cursed Floor (heals do half, every drop one rarity better, violet fog) and Goblin Den (a goblin
  after every battle, catching one is loud).
- Node map: names under the nodes, descriptions on hover, so six paths fit. Fixed: the Treasure Vault said 6
  items, it drops 5.
- Autopilot test (lowest party HP, careful / spam, 10 to 12 trials): floor-5 Bailiff 69% / 67%; floor-10 Loan
  Shark 52% / 62%, 1 to 3 wipes in 12 (was the Bailiff: 62% / 56%, 0 wipes); floor-15 Landlord 60% / 55%;
  40 s away wipes on all three. Normal floor 8, 40 s away: 4/12 wipes, 22% HP (was 2/15).
- Sims, 20 good runs averaged: depth 9.5-9.7, 0 catches, visits 5.2 (0.23: 3.9-4.7), wakes 2.5-2.9 (1.7-1.9),
  average Noise 32 (28). Battle Noise is unchanged; the bot reaches the floor-10 boss at bedtime and its longer
  fight runs into the sleep phase (night ends about 01:35, was 01:07). Left for the balance pass (#2).

## 0.23.0 (2026-11-17)

RPG depth, part 1 of 3 (#27).

- **Third skill per hero**: Rally (knight, key 3: every hero acts now, +25% damage for 6 s), Storm (mage, E:
  6 bolts at random enemies), Revive (healer, D: a downed hero back at 50%, otherwise a 50% heal on the most
  hurt). Unlocks moved to levels 1 / 3 / 5, so one night reaches the whole kit (level 3 before the first boss).
  Ultimates stay locked as "later nights".
- **Ability marks**: Bash Staggers (Fire x2), Frost Chills (Bash shatters x2.5), the healer's Smite Judges
  (skill hits on it heal), Taunt marks enemies Taunted (with Ward up, half their hits bounce back). Tags above
  the enemies' HP bars; a skill that would cash in a mark glows gold on the bar with a badge (x2, x2.5, ↩).
  Tooltips colour the mark words.
- Judged pays off only on skill hits. Healing off auto attacks made 40 s on Excel safe (floor 8: 0 wipes and
  44% HP), which undid the reckless autopilot.
- Noise per cast 4 → 3.5; Storm and Rally count as one noisy moment. The Bailiff 1100 → 1700 HP.
- Sims, 10 good runs averaged (before → after): depth 9.6 → 9.6, visits 4.5 → 3.8, wakes 2.0 → 1.3, average
  Noise 26 → 26, 0 catches. Idle still unplugged and caught.
- Autopilot test, lowest party HP (before → after): floor-5 boss smart 67% → 69%, spam 72% → 66%, fight
  33-37 s → 44-56 s; floor-10 boss smart 5/15 wipes, 22% → 0 wipes, 62%; spam 3/15, 43% → 0, 56%;
  40 s away still wipes on every boss; normal floor 8 away 2/15 wipes, 18% → 2/15, 22%.

## 0.22.0 (2026-11-17)

- **Her activity predicts the next visit type** (#18). The type now depends on what she was doing: TV → Chat
  or Cuddle, tea → Snack run, bathroom or phone → Peek, shower → Cuddle or Peek. 25% of the time it ignores
  that (`VISIT_RANDOM`), and Cuddle is still only drawn while she is green. Replaces the shuffled deck
  (`VISIT_DECK` is gone). `test/predict.ts` prints the odds.
- **Activity end cues**: 3.5 s before she moves, each activity gets its own sound: TV credits, kettle whistle
  and click, running tap, hair dryer, the phone goodbye jingle. The phone used to be silent, so it was the one
  activity you could not follow. Cues come from her room, so distance and the headset mute them.
- Sims (2 good, 1 idle): good bot 3 stars, floor 9-10, 0 catches, 0 wipes; idle still caught and unplugged.
  Alt-tab test 200/200 both ways; noise test passes. No balance numbers moved.

## 0.21.0 (2026-11-16)

- **Power level** (#31). Every item has a power (item level × rarity, the scale that sets its stats); a hero's
  Power (◆) is the average of their 6 slots, empty = 0. Shown on the portraits next to the level, in the equip
  window, on every slot and bag item, and in tooltips as the change for the selected hero ("◆ Power 3 → 33").
  A hero under 85% of the party's best gets a pulsing red "!" on the portrait.
- **Rebuilt equip window**: Power in the title, power per slot, and a stat block (HP, ATK, ARM, SPD, CRIT,
  LUCK) with the gear share in green. Bag slots show item power instead of sell value (value is in the tooltip).
- Feed and doll slightly shorter to fit. No balance change.

## 0.20.0 (2026-11-16)

- **Looks busy is gone.** Excel on screen when she looks is a pass. The meter made players fill a bar they
  did not watch, and it caught players who switched in time (the alt-tab lag ate the time Excel needed to fill
  it). The reckless autopilot now carries the cost of hiding. The Excel Tetris stays, optional, for overtime gold.
- The boss's message no longer pays Looks busy: answering it pays a 40 gold overtime bonus and keeps him quiet
  for 150 s; flipping the phone on him makes him ping again in 20-30 s.
- Removed: the Looks busy rows (YOU box, her stats), Busy in Excel's status bar (now the night's overtime pay),
  the Busy 100 debug button, the Alibi stacks plan.
- Sims (4 good, 2 idle): good bot 3 stars, floor 5-10, 0-1 wipes, **0 catches** (was caught in about 1 night in 3);
  idle still caught and unplugged. Alt-tab test unchanged (200/200 both ways).
- Designed: curios in the corridor as the RPG's third verb (#30, `dungeon.md`), slotted after RPG depth.

## 0.19.0 (2026-11-16)

- **Skill tooltips.** Hover a skill: what it does with this hero's real numbers, cooldown, Noise, and when to use
  it; locked skills show their unlock level. Hover a portrait: the hero's role and auto attack. Replaces the
  browser's slow native title, which often did not show at all because the bar redraws every frame.
- During a boss wind-up, the answering skills (Taunt, Ward, Bash unless braced) pulse red.
- Skill numbers moved from the battle code into `src/data/heroes.ts` (one source for effect and tooltip).
  No balance change.

## 0.18.0 (2026-11-16)

- **Bosses make you sweat** (#2). The Bailiff now winds up FINAL NOTICE every 2nd action: a boss cast bar at
  the top of the screen and a rising rumble you can hear from Excel, then 60% max HP to every hero. Answers:
  Bash interrupts (after which he is braced and the next one cannot be interrupted), Ward halves it, Taunt pulls
  it onto the knight. Bailiff 850/24 → 1100/28.
- `test/autopilot.ts` now runs three players per fight and reports the lowest party HP during it (the old
  end-of-fight HP hid the danger: a boss kill levels the party up and heals it). Floor-10 boss, skills on
  cooldown: lowest HP 58% → 49%, close calls appear, no wipes. Floor-5 boss: 76-84% → 66-70%. Away: always wipes.
- Sims (4 good, 2 idle): good bot 3 stars, floor 5-12, 0-1 wipes; idle unchanged. Alt-tab test unchanged.
- Slice criterion changed: 3 visit types over two nights, not one; few visits per night is intended.

## 0.17.0 (2026-11-16)

- **Three new visit types** (#12, Monday set). Each wants a different answer:
  - **Snack run** (plates clinking): she never looks at the screen; she checks the desk for Monster cans.
    Click the cans during the footsteps to hide them, then take the plate (party +20% HP). Cans in sight: one
    is confiscated.
  - **Chat** (humming): Excel up and headset off, then 3 quick questions while you stay on Excel (and the
    reckless autopilot runs).
  - **Cuddle** (slow slippers, only when she is happy): "Come here" starts a cuddle minigame (follow her breathing
    around a heart, slowly); "One sec, babe" costs Mood. The party keeps the safe autopilot while you cuddle.
- Visit types come from a shuffled deck (Peek x2, Snack, Chat, Cuddle), so a short night still shows variety.
- First night: the her-note names each hallway cue. Plate prop and new faces at the door. New sounds: plates,
  humming, slower slipper steps.
- Debug panel: spawn a Snack, Chat or Cuddle visit. New `test/visits.py` screenshots. `test/alttab.ts` now forces Peeks.
- Sims (4 good, 2 idle): good bot 2-3 stars, floor 5-10, 0-1 wipes, 0-2 catches, 1-5 visits covering all types;
  idle still unplugged. Finding for #2: a Peek can catch a player who switched on the earliest cue if Looks
  busy started low (the lag eats the Excel time); and nights only get 2 to 4 visits before bed.

## 0.16.0 (2026-11-16)

- **Noise by distance and masking** (#17). Your Noise reaches her x2 from the living room, kitchen and hallway,
  x1 from the bathroom, x0.5 from the bedroom; the TV masks a further half and the shower masks it all.
  Heard Noise drives her chance to come to your door and makes her finish activities early. Never shown.
  Not applied while she sleeps (the bed phase keeps its own tuning).
- New `test/noise.ts`: boss kill during her shower 35% → 35% door chance; while she makes tea next door 35% → 85%.
- Sims (4 good, 2 idle): good bot 3 stars, floor 10, 0-1 wipes, 1-8 visits (high variance; the bot does not use
  her location yet). Idle unchanged. Alt-tab test unchanged.
- Removed the unused `VISIT_NOISE_SPEEDUP` constant.

## 0.15.0 (2026-11-16)

- **Reckless autopilot** (#15). Leaving the game is now dangerous: while you are on Excel, mid-switch, in a
  minigame or have the cables out, nobody holds aggro, the healer waits until 35%, the party pulls without
  resting and careless pulls give the enemies the first hit. Party chat complains in the Feed, and the
  Loot Night taskbar button flashes orange when the party is in trouble. Forced situations (her on your desk,
  the monitor she turned off) keep the old safe autopilot.
- The Bailiff is stronger (700 HP / 16 atk → 850 / 24): a floor-5 boss never threatened an absent player.
- New `test/autopilot.ts`. 40 s away, 20 trials each: boss floor 5 wipes 0 → 16, boss floor 10 3 → 20,
  normal floor 3 stays 0 (party HP 75% → 65%), normal floor 8 1 → 2 (53% → 32%).
- Sims (3 good, 2 idle runs): good bot before: 2-3 stars, floor 10, 0 wipes. After: 3 stars, floor 9-10,
  0-1 wipes per night (it hides on Excel mid-fight and now pays for it). Idle unchanged (unplugged, floor 3).
  Alt-tab test unchanged (200/200 both ways).
- Option A for the Raid pass written into `preemptive.md` (Goodwill only pays for the Raid pass; 2.5 real min).
- Test hook `window.__lootnight` for Playwright scripts.

## 0.14.1 (2026-11-16)

- **Design bible moved into the repo** as `docs/design/`, one file per system, rewritten to describe the
  current build (Now / Decisions / Planned). The old claude.ai doc had 13 appended playtest rounds on top of
  outdated sections. Unbuilt designs (campaign, synergy pass) are kept as clearly marked plans. Fixes #1.
- New backlog issues for designed-but-unbuilt parts: more visits and interrupts (#12), real audio (#13),
  synergy pass (#14).
- Code comments point to the new bible files. No gameplay change.
- Recovered the unbuilt prompts from the "Apartment map and switch costs" chat into the bible and backlog:
  reckless autopilot (#15), alt-tab crash (#16), Noise by distance (#17), activity predicts visit type (#18),
  pre-emptive actions (#19, #20, `preemptive.md`), wandering merchant (#21), eye-candy moments (#22,
  `eye-candy.md`), plus idea issues #23 to #25. #12 is now visit types only.
- Decisions: no wandering merchant (#21 closed), Doorframe visit cut, alt-tab crash parked as an idea (#16):
  lag plus reckless autopilot should be enough.
- Synergy pass split: slice set (#29, plus marks/affixes in #27, audio cues in #13, upgrade-per-night in #2)
  and arc set (#14). Audit table of what feeds what added to `synergy.md`. Raid pass becomes a pre-emptive action.
- `ROADMAP.md`: Monday slice first (with done criteria), then a longer arc with an ending and endless free play,
  final sprites after the slice. New issues: art style sheet (#26), RPG depth (#27), onboarding (#28).

## 0.14.0 (2026-11-16)

- **Alt-tab lag.** Every switch between the game and Excel takes a random 1.0–2.5 s (`ALT_TAB_LAG_SEC`) and plays an
  old-Windows fullscreen mode switch: frozen tearing frame, teal desktop with the window shrinking and smearing,
  black mode change with a monitor OSD, blocky arrival. No input during it; she sees the screen you switched *from*.
  Door-handle stage shortened to 0.9 s so a handle-cue switch always fails and a hallway-cue switch always passes
  (`test/alttab.ts`: 200/200 each).
- Phone leaves the desk while it is in your hand.
- Version number on the title screen; title help text updated for alt-tab and the Monster break.
- Repository created; mockups moved to `design/mockups/`.

## 0.13 (2026-11-15) — round 13

- Skills cast instantly on click/key, no global cooldown. Auto attack has no button; keys start at 1 / Q / A.
- Grey circle with red X on every minigame window.
- Desk phone shows the full iOS incoming-call screen; tap red declines at once, tap elsewhere picks up.
- Loot drops where each enemy died, bounces, shines more; party walks faster while loot is on the floor.
- Monster-scene guy redrawn (fringe, back spikes, headset round the neck).
- Balance: bot depth by bedtime rose from 5–7 to ~10 floors with instant skills.

## 0.12 — round 12

- Phone is iOS throughout (in hand: iPhone proportions; lock screen, Face ID, incoming call, in-call, iMessage threads).
- Messages arrive in bursts of 1–3, one short buzz + one lock-screen banner each; calls keep the long buzz.
- Every phone screen can be left (Put down, Decline, end call, back chevron, home bar).
- WoW-style buff/debuff squares top-right of the game screen with timers.
- Right panel order: You, Feed, run progress, Party, Bag.

## 0.11 — round 11

- Dungeon as a dark 2.5D cave diorama: torch light travels with the party, fog at the far end, foreground parallax.
- Camera acts: dolly on walk, push-in on fights, pull-back on heavy hits, shake on crits, slow zoom on legendaries.
- Loot on the floor with rarity beams; the front hero collects it, bag slot flashes.
- Item lock (L), auto-salvage below blue, bag grows to 18 slots.
- Her: higher fidelity, grounded at the door, situational expressions + reaction bubble; desk pose redrawn.
- Peek cloud shrinks onto her over ~7 s; dog visible chest-up from the floor; headset Zone aura; morning screen fits.

## 0.10 — round 10

- Pixel-anime pipeline for characters; her redrawn with outfits by activity, barefoot moments (lean visit, toes
  under the door, morning bed), frosted shower silhouette.
- First-person "she sits on your desk" scene; Infinity Engine skill bar on the dungeon screen; feed moved right.
- Shiba with a body; 9-type randomized cable minigame; 2026 phone proportions; vibration instead of ringtones.

## 0.9 — round 9

- Desk layout pass, headset/Monster art, bin in the back; slingshot toss (later replaced by a free fling).
- Taller door, square blueprint, your stats moved to the right panel.
- New: the dog (pet him or he knocks the cables out), the cable fix, she sits on your desk (sweet-talk her off).

## 0.8 — round 8

- MMO chat feed; phone declines (flip face-down, decline calls); roaming town NPCs with chat bubbles.
- Keyboard/mouse art; Monster rebuilt (free grab, one-click open, drink close-up, physics toss into a bin).
- Blueprint floor plan with no exact position; hold-to-peek door with detection risk.

## 0.7 — round 7

- MMO city hub on the monitor with clickable services and buildable plots; Slay the Spire-style floor map.
- Monster close-ups and a can pile; team renamed Paweł, Rafał, Jacek.

## 0.1–0.6 — prototype and early rounds

- Night 1 prototype: RPG idler, girlfriend visits (FNAF-style telegraph), Excel cover, phone interrupts,
  Monster, tiredness, sleep debt, stars. Early rounds slowed pacing, replaced "hold Space to listen" with the
  headset/Zone trade-off, added the Mom reading phase, rarity colours, tooltips, paper doll, three UI flavours.
