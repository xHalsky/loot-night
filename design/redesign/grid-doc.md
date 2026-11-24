# Loot Night: pixel grid and RPG screen spec (for round 2)

Companion to `claude/loot-night-ui-inventory.md`. That doc says what each element does; this one says the grid,
the sizes and the look of the RPG screens and of the right screen around them (monitor + desk). Live reference:
https://claude.ai/artifact/9xDaK6XXC4VYYgivRajnwU (Full frame, Desk + monitor or Game screen only; her four states; Dungeon / Battle / Floor map /
Town / Q4 (Excel) on the monitor; the town panel and the skill trees; Q4's toys and a promotion; the Windows 98 taskbar; desk moments; the five energy-break steps; the dog's moments and the cable fix, both
playable with the mouse; the caught scare for each catch; the phone in your hand (its home screen, Messages, her chat and her photos, the Shop, the Home app and the battery too) and on the desk (picking it up too); lean in, playable with the mouse (her timers, her tell, the hall mirror); the small pieces (the Goblin Fuel inspect window, How to hide, coach marks, tooltips, pause, away, the microsleep); the cuddle break, playable with the mouse, and the plan taken off the wall; the four mornings; the floor map's route choice (three paths, a map card, boss next, away); the battle's run blessings, the swap and the Hook; a "Show grid" toggle). Stills are in rows D and E of
https://claude.ai/artifact/QN1vFM45ZmBH89Exo9qiZe.

## 1. Internal resolution: 640 × 360

One pixel grid for the whole game, UI and text. It scales by whole numbers to every usual screen:
×2 = 1280 × 720 (the CSS base), ×3 = 1920 × 1080, ×4 = 2560 × 1440, ×6 = 3840 × 2160. Letterbox anything else.
Every CSS size from the inventory halves; odd values snap as below.

| Zone | CSS on 1280 × 720 | Grid (640 × 360) |
|---|---|---|
| Left column (webcam + her panel) | 0, 0, 296 × 720 | 0, 0, 148 × 360 |
| Monitor bezel | 304, 6, 968 × 519 | 152, 3, 484 × 260 (519 → 520) |
| **Game screen** | 314, 16, 948 × 465 | **157, 8, 474 × 232** (465 → 464) |
| · Battle area | game x 0 to 668 | x 0 to 334: band **64**, battle picture **142**, skill bar **26** (town: the whole 334 × 232, no band, no skill bar) |
| · Side panel | game x 668, 280 × 465 | x 334, **140 × 232** |
| Taskbar | 314, 483, 948 × 30 | 157, 241, 474 × 15 (483 → 482) |
| Desk | 296, 528, 984 × 192 | 148, 264, 492 × 96 |
| Phone (−4°) | 308, 548, 134 × 235 | 154, 274, 67 × 118 (235 → 236) |
| Keyboard, mat, mouse | 454, 590, 660 × 200 | 227, 295, 330 × 100 |
| Tonight note (3°) | 684, 503, 106 × 74 | 342, 251, 53 × 37 (503 → 502) |
| YOU card | 1006, 534, 266 × 52 | 503, 267, 133 × 26 |
| Feed card | 1006, 592, 266 × 122 | 503, 296, 133 × 61 |

**Text:** Tiny5 at 8 px (5 px caps = 10 CSS px, the minimum) for all body text; Silkscreen Bold 8 px for
headers and labels; Micro 5 at 11 px where a narrow face is needed; Jacquarda Bastarda 9 at 13 px (blackletter)
only for map titles and floor numerals. Each renders pixel-exact only at these sizes (or exact multiples).
Blackletter capitals and Roman numerals are hard to read at this size: use lowercase-led titles and Arabic numerals.
Silkscreen has no middle dot: "RAVENHOLD · BUILD" renders with a hyphen.

## 2. UI materials (how the UI gets the dungeon's depth)

- UI surfaces (bronze, leather, parchment, wells, bars) are written as value + material, unlit and outside the
  scene vignette, so they go through the same hue-shifted ramps and Bayer 8×8 dither as the world.
- Every raised element casts a soft shadow that darkens whatever is beneath it (scene or UI). Text over the scene
  gets a dithered smoke patch behind it (corner overlay, buffs). The skill bar has a contact shadow on the scene.
- Bronze plates are lit from the top left (bright top/left lip, dark bottom/right). Wells are recessed: inner
  shadow under the top/left lip, lit bottom/right lip. Frames are carved mouldings with domed corner bosses.
- Rare items light the slot from below in their rarity material. Answer and combo skills get a crimson / gold
  halo on the leather.
- Palette-exact (never dithered): text, icons (with a 1 px void cast shadow or outline), rarity frames, state
  frames, small tabs that carry dark text (NEW, x2), sign planks, and the map title ribbon face.
  **Dark text never sits on a dither.**
- Portraits are lit like the scene (warm key from the upper right, cold rim from the left, candle glow behind) and
  baked once with a lighter dither (0.1) so 18 × 20 features stay readable.

## 3. Actor separation (party, interactables, enemies vs the set)

Every actor sprite is tagged (party, the potion cart and other interactables, enemies); the set never is. One
silhouette pass after the actors are drawn gives them, and only them:

- a cool **actor fill light** (≈0.15 added to the light sum, slightly blue) so nobody drops to black between lamps;
  lit actors barely change because of the soft knee;
- an **8 % value lift**;
- a **rim of light** added after lighting on the top (≈0.075), left (≈0.05) and right (≈0.06, plus the original
  albedo rim) edges, so the contour shows even in shadow;
- the 1 px **void outline**;
- a soft dark **halo** in the set behind them: up to 40 % darker at the outline, fading out over 5.5 px (dithered).

Cost ≈ 1 ms per frame. Staging rule: in battle, foreground set pieces must not cover an actor (the foreground
pillar is pinned to the left edge in the battle framing); while walking it may sweep past.

**Draw order inside a character** (checked for every hero and enemy, 2026-11-19): back to front, as the parts sit
in depth, never in the order they were designed. Far limbs and what they hold come first, then the body, then the near
limbs; anything worn or held over a part is drawn after it. Fixed in that pass: the knight's sword grip is drawn before
his fist closes over it; the mage's casting arm comes out from under his mantle; the priest's censer arm comes out from
under his chasuble, and his icon's pole stands in front of his robe all the way down; the skeleton's far pauldron sits
behind its ribcage; the necromancer's raised arm comes out from under his far pauldron; Garrote's near blade, carried
pointing back, runs behind his hip. (Earlier fix: the knight's near pauldron is drawn before the shield.)

## 4. Skill icons: grouped by class

Icons are 13 × 13 with a baked 1 px void outline, drawn over a class tile that fills the slot (13 × 16, dithered).
The class reads from the tile colour first, then from the icon's palette and weight:

| Class | Tile | Icon language | Skills |
|---|---|---|---|
| Knight | riveted steel-blue iron, scratched | heavy, blunt silhouettes; steel with blood red | 1 Taunt (crested great helm roaring, red war-cry chevrons), 2 Bash (broad blade through a red arc), 3 Last Stand, the ultimate (heater shield, crimson field, gold cross, sparks off the rim) |
| Mage | violet field with a faint arcane rune ring | glowing elements with hot cores | Q Fire (flame, white-gold core), W Frost (crystal frost star), E Cataclysm, the ultimate (screaming soul-skull trailing a violet wisp) |
| Priest | warm gilded field with light rays | symmetric holy shapes in gold, ivory, green | A Mend (budded green cross, gold heart), S Ward (bubble of light with a gold cross), D Miracle, the ultimate (golden scales) |
| Rogue (Garrote) | dark plum cloak weave with one faint diagonal cut | lean steel, blood, ember sparks, pale smoke, gold | Z Backstab (dagger driven point-down, blood off the tip), X Smoke Bomb (dark flask, burning fuse, pale smoke), C Heist, the ultimate (gloved fingers lifting a coin purse, coins slipping out); Stab is his auto attack |

Buff icons stay 11 × 11; Taunt and Ward use the same drawings, simplified.

**Three slots per hero: two skills and the ultimate** (decided 2026-11-20; the skill bar has no room for more). The
third key of each group (3, C, E, D) is the ultimate; 4, V, R and F are free and stay dark. Skill names are the
decisions log's; the ultimates' icons above are placeholders taken from the old third skills (Paweł draws the final
icons).
Crimson inside knight icons is picture colour (blood); the "answer" state is carried only by the pulsing crimson
frame and halo, so it stays unambiguous.

### 4b. Garrote, the fourth hero (rogue)

Second in marching order, right behind the knight. The party is evenly spaced, about 35 px apart: priest x 21,
mage 56, Garrote 87 (his bent back carries his mass ~3 px forward), knight 126 (party lane, feet at y 196).

Drawn after Paweł's references (a black hooded blade-dancer with glowing eyes and gold fittings; a masked rogue in a
long cloak; a pixel-art rogue in a deep rounded hood and capelet, crouched in a wide sneaking stance), then reworked:
- **View**: chest to the camera, like the knight and the others: a three-quarter view turned toward the enemy. Far leg
  and far arm on the left, near leg and near arm on the right, the crossed straps and the belt across his front.
- **Build**: athletic and long-limbed, not skinny: broad shoulders tapering to the waist; thighs 4.6 → 3.6 px, calves
  with a bulge (3.6 → 3.8 → 3 px), knee pads.
- **Pose**: sneaking, never stiff (after Paweł's stick-figure sketch). Knees bent; the back bent forward from the
  waist, the upper back rounded behind, the shoulders and chest tipped toward the enemy (shoulders ~4 px ahead of the
  hips); the head hangs forward and low in front of the shoulders (hood crown at Y - 58), the eyes looking ahead from
  under the hood's rim, hunting.
- **Arms** (after Paweł's sketch): long (upper ≈ 10, forearm ≈ 10 px), hanging low and nearly straight from the
  forward shoulders, only a slight bend at the elbow. The front fist sits low and a little forward, at the top of the
  thigh; the back arm hangs at his side behind the hip (drawn behind the body and the far leg).
- **Daggers, in battle**: front fist, forward grip, the blade pointing at the enemy. Back fist, reverse grip, a long
  blade pointing straight back.
- **Daggers, out of battle**: both reverse-gripped for stabbing, blades pointing back (the back one long and level, as
  in the sketch; the front one short, ahead of the thigh).
- **Walk** (a stalking cat, not a wind-up toy): his own gait, 12 frames over 1 s (the others keep their 4-frame
  shuffle at 0.5 s). Long, low steps: a 10 px stride, the swing foot lifts only 3 px, toe down. Knees are solved from
  hip and ankle (thigh 17.5, shin 13.5, bending toward the enemy), so they bend through every step. He walks 1 px lower,
  and the pelvis rises 1 px at mid-stance. The arms hang steady, swaying 1 px. The cloak's hem and the tabard
  swing gently with the stride. Stopped (at the cart), he holds the pose.
- **Head and hood** (redone from the three references, 2026-11-19): normal head size, about the knight's helm (12 ×
  12 px, drawn as a hand-placed pixel map, not shapes). A close-fitting hood with a small peak at the back and a fold
  down the back, its sides falling to the shoulders; shaded from deep at the back to lit at the crown and rim. The
  head is bowed and turned toward the enemy: a small face opening (about 6 × 6) set to the near side, in shadow under
  the lit rim, with only two glowing eyes (gold, a faint glow beside each, a blink every ~8 s) and a hint of chin.
  A thin wine scarf at the neck. A short shoulder cape (capelet) close over the shoulders with a ragged hem at the
  chest. (The earlier big rounded cowl read as a head wrapped in a blanket.)
- **Cloak**: near-black plum (the dusk ramp kept at d1–d2), from the upper back down to the calf and flaring behind,
  tattered hem with loose strands, a cold rim down its back edge.
- **Kit**: black leathers lit along the near side; crossed straps with steel buckles; a belt with a gold buckle, a
  slung hip belt with a gold ring; a pouch on the near hip; a front tabard hanging between the legs with a gold hem;
  throwing knives sheathed on the near thigh; tall strapped boots; the garrote wire coiled on the far hip.
- **Portrait** (18 × 20): the peaked hood with its lit rim round the shadowed opening, two glowing eyes (emissive)
  inside, a hint of chin, the wine scarf at the neck, a dagger hilt over the far shoulder.
- **Class colour: ember** (Moonwell copper #c16229): 1 px portrait outline, and Z X C light ember on the desk
  keyboard. Crimson, green, cyan and pink were already meanings (danger, Excel/Monster, Zone, her). On the desk ember is
  slot 33, UI-only: `makePalSet(hexes, ramps, lutN)` keeps it out of the dither LUT, so the desk's renders don't change.
- **Inventory** (floor map screen): Garrote selected; epic dagger, rare hood, leather armour, boots, ring, and the
  garrote wire as a legendary trinket. New item icons: dagger, hood, wire.

### 4c. The mob: six, in two fodder lanes

Fodder (3 skeletons, 2 zombies) is bunched in two close lanes: back lane at feet y 190, front lane at y 202; each lane
32–40 px apart, the lanes staggered so back-lane bodies show in the front lane's gaps. The lieutenant (necromancer)
stands behind them on the party's own lane (y 196), between the two lanes in depth. Drawn back to front.

| Lane | Units (x) | Notes |
|---|---|---|
| Front, y 202 | skeleton 186 (STAGGERED, hellfire target), zombie 226, skeleton 266 (bare skull, no shield) | lit by a widened cold shaft |
| Back, y 190 | skeleton 205 (no scarf), zombie 245 (TAUNTED, no sword through it; spits bile over the front rank at the knight's shield) | darker: occlusion ×0.62, value ×0.9 |
| Mid, y 196 | necromancer 304 | SUMMON wind-up; brazier at 286 behind the mob |

Variants come from options on the same rigs (`helm`, `shield`, `scarf` on the skeleton; `sword` on the zombie) plus
a phase offset per unit so they don't move in step. HP bars: back lane y 117, front lane y 132, necromancer y 121;
tags sit 10 px above their bar. The Grave Ring's bone pile moved to x 160, in front of the knight.

## 5. RPG screen components (grid px)

| Component | Size and position | Notes |
|---|---|---|
| Corner overlay | x 4, y 4; three lines, 7 px apart | "Shadow Crypt" / "floor 4 · battle 1/3" / "Flow x1.4" + 30 × 4 groove. Dithered smoke behind, 1 px void shadow. Town: "Ravenhold · town" |
| Town portal button | 4, 28, 54 × 19 | Arcane plate with a dusk-rose top lip when usable; dark bronze with "after battle" |
| Buffs | 13 × 13 each from the top-right, 16 px apart; label under | Recessed, green frame = buff, crimson = debuff; dithered sweep for time left. Run blessings sit right-most with a dashed frame and "run" (section 5c) |
| Curio card | 84, 4, 188 × 57 in the band | Dithered parchment, scorched edge, curled corner, cast shadow; two 85 × 20 bronze choices; 5 px timer groove; round close button outside the top-right corner. A curio that gives a blessing offers its bargain and "Leave it" (section 5c) |
| HP bar over a unit | 22 × 4 groove | Party: moss, crimson under 35 %. Enemies: crimson |
| Mark tag | text + 6, 9 tall, coloured underline | STAGGERED bone, TAUNTED dusk rose, CHILLED stone, JUDGED pale |
| Enemy cast (wind-up) | the name centred over the caster, the bar 7 px under it | Just the cast's name in Tiny5 crimson with a 1 px void shadow ("Summon", "Hook · rank 4"), and a thin cast bar under it as wide as the name (at least 24): a void rim round a 2 px track, dark dusk, filling crimson. No plate (decided 2026-11-20: the enamel plate was too loud). The skill that answers it pulses crimson with a halo in the skill bar |
| Loot on the floor | the item 7 × 5 at floor level | Lies in a flattened pool of its rarity light (≈26 × 7); the beam rises from it, flares at the foot and dithers away over ~60 px; motes drift up; the name flies up from the item |
| Skill bar | 334 × 26 at y 206 | Carved 4 px rail with studs, tooled leather; four heroes, 76 px each at x 6 / 88 / 170 / 252 in marching order (knight 1 2 3, Garrote Z X C, mage Q W E, priest A S D): portrait 22 × 24, HP tube 4 × 23, two skill wells 15 × 18 (13 × 13 icon at +1,+1 on the class tile; hotkey on a 6 × 5 void tab at +1,+13, under the icon) and the ultimate's gilded well; carved pilasters between heroes. The groups follow the marching order; aura glyphs sit on the pilasters, and an out-of-position hero gets an x0.7 tab (section 5d) |
| Ultimate well | 15 × 18, the third in each group | A gold frame with pale gold corner studs and a void line outside it; a crest over its top edge, a gold peak 7 → 3 px wide reaching 4 px into the rail, a crimson gem and a moon glint in it; the key on a 7 × 6 gold tab (pale top row, void letter). Ready: a warm gold halo that breathes (2.6 rad/s). Cooldown: the same sweep and seconds as the other wells. Locked (it needs 6 nodes in the hero's tree): the frame and crest copper, the corners wine, the icon behind a void checker, a lock, and the number of nodes still missing. No autocast loop (ultimates never autocast) |
| Skill states | | Cooldown: dithered sweep over the 13 × 13 icon + seconds. Combo: gold frame + halo + gold "x2" tab. Answer: crimson frame + halo, pulsing. Queued: pale corner tick. Blocked: whole bar dithered + label plate. Autocast (bought in the tree): a loop mark on a 7 × 5 void tab in the bottom-right corner, moss when on, dim bone when switched off (right-click). The ultimate well has its own states (above) |
| Side panel | 140 × 232 | Leather with edge vignette and a bronze rail on the left; PARTY header 10; four cards 33 × 40, 34 apart, with the portrait and a 1 px XP line (pale gold) right under it (short names: Knighten, Garrote, Magoo, Healero); hero header 10; gear 3 × 2 of 21 px + stats well; BAG header with the count and the auto-salvage toggle; bag 6 × 3 of 21 px; Treasury row of 6 cells (locked, 2 open per Treasury level); footer plate 11 |
| Item cell | 21 × 21 well | 1 px rarity frame, rarity light from the slot floor, 12 × 12 icon, power bottom-right, lock bottom-left. NEW: pale gold double frame and a solid NEW tab inside the top edge |
| Floor map | fills the battle area, 334 × 232 | Lit vellum on a dark table: torn and scorched edges, a torn-off and a curled corner, fold panels and creases, wrinkles, ring stains, foxing, burn holes, cast shadow. Ink: double-ruled border with red inner rule and fleurons, ribbon cartouche with the blackletter title, gilded 17 px floor roundels with blackletter numerals, stair-roads (two rails + rungs, pen flourishes, gilded quatrefoil midpoint), red-ink ring + arrow for "you are here", gilded compass rose with fleur-de-lis, crimson wax seal. The route choice (path cards, forks, the margin note, the away hourglass): section 5b |

## 5b. The route choice: the floor map (handoff 1.5, #52)

Decided 2026-11-20 (Paweł approved the mockups). Live on the page's Floor map row (3 paths, 2 paths + a map, Boss next, Away 5 s);
code in `paths.js` and `pathicons.js`. The map's vellum, ink, roundels and stair-roads stay as in section 5; what is
new is that the map now draws the choice.

**The map (334 × 232).**
- Cartouche title, then "Floor 7 cleared · choose the way down" ("the boss waits below" before a boss).
- **The run so far** down the left: the last floors (up to 4) as gilded roundels joined by stair-roads at x 40 / 74 /
  42 / 80, y 52 / 70 / 88 / 106; boss floors (5, 10…) in a crimson field. The last one is "you are here": the red-ink
  ring, with "you are here" in wine under it at 64, 121. Compass rose at 34, 146. The burn holes move to 311, 150 and
  25, 64, out of the text.
- **The forks:** a stair-road from "you are here" to each candidate room: three at 150, 58 / 160, 104 / 150, 148; two at
  150, 76 / 150, 134; one at 160, 104. A map from the bag has no inked road: it shows as a dashed red route on hover.
- **Candidate rooms** are pencilled (a dashed ring with "?") with their icons sketched beside them (feature first, then
  condition; the outline and darks in ink, red and gold kept as red ink and gilding). Hovered: the road draws itself in
  marching red ink, the room is gilded with the floor's numeral (field: stone for a feature, crimson for a condition or
  the boss, arcane for a map, dusk if plain) and its sketch inks in full.
- **The margin note** (x 202, y 42, 114 wide): the hovered path's full text in the cartographer's hand. "FLOOR 8" in
  Silkscreen ("FLOOR 10 - BOSS", "FLOOR 3 - BY MAP"), a ragged ink rule, then each part with its inked icon and name;
  a bargain line ("Drink for a blessing:"); a moss + bullet for what you get and a crimson - bullet for what it costs.
  The words stay dark ink: green and red text don't read on the vellum, so the colour is only in the bullets.
  Conditions add their danger skulls after the name. Plain: "The stairs down. A plain floor: fights and the usual
  random curios." A map: "Uses the map from your bag.", its + and -, "Never taken for you."
- HUD over the map: Flow with an ink label and the yellow bar; the Town portal button.

**Path cards** 98 × 46 at y 160 (x 17 / 118 / 219 for three, 68 / 169 for two, 118 for one): bronze moulding over
leather, a stud on top; hovered, it lifts 2 px with a gold moulding, a bigger shadow and a gold pointer under it.
- Header (Tiny5 at +6, +5): "Floor 8" in bone; "Floor 10 · boss" in crimson. On the right: the danger as three 5 × 5
  skulls (crimson for each level, the rest dark) when there is a condition; the hourglass on the safest card.
- Two rows, a 13 × 13 well and the name at +21: the feature (bronze frame), then the condition (crimson frame). An empty
  row is a darker well with "no feature" or "no condition" in dim bone, so a plain card reads plain next to the others.
- A map card: the map icon in its rarity frame, the map's name in its rarity colour, "uses your map".

**Away.** The hourglass (5 × 7, bone frame, pale sand) marks the card that would be taken: no condition first, then the
lowest danger, at random among equals, never a map. The footer at y 211: "Look away 5 s in all and the [hourglass] path
is taken." The time adds up and doesn't reset when you glance back: the sand drains on the card and in the footer, with
"N s left." At 5 s that road inks itself and the party goes on (the build tells you in the feed).

**Icons** (11 × 11, placeholders for Paweł's): Wayside Shrine (a roofed niche with a gold bell), Pilgrim (a hooded
figure in a wide hat with a staff), Supply Cart (sacks and a crate on a cart), Blood Altar (a stone table running with
blood, a drop above), Moonwell (a stone well of moonlit water under a crescent), Ritual Circle (a violet circle, a star,
three candles), Locked Chest (iron bands, a gold padlock), Elite Pack (a horned skull with red eyes), Goblin Den (the
goblin's head and a coin); Silent Halls (a stone mask with stitched lips), Haunted (a ghost), Flooded (a drop over
waves), Pitch Dark (a snuffed candle), Swarming (three bats), Cursed (a violet eye in a ring); the Potion cart (a red
flask). The bell is the Wayside Shrine's own, so Silent Halls doesn't use a bell.

## 5c. Run blessings (handoff 1.5b)

Decided 2026-11-20 (Paweł approved the mockups). Live on the page: Dungeon (one being made) and Battle, Run blessings.
- **The curio card** offers the bargain and "Leave it". The Potion cart: "Shake it · Noise +15 · 50/50" and "Leave it ·
  Nothing happens"; the card's line says what the bargain gives ("Shake it: 50/50, +30% healing for the run or broken
  glass.").
- **The chip** in the buffs row: the curio's own icon in the 13 × 13 moss-framed well, the frame dashed (every other
  pixel dark moss). Dashed means "this run", the same idea as the unbanked mark in the bag. "run" stands where timed
  buffs show their seconds ("run x2" when it stacks). Blessings sit right-most; a new one flashes in with a pale moss
  frame for about 0.8 s, and "+30% healing, this run" floats over the party.
- **Hovering a chip** opens the tooltip card (below): the name and a "run" tag (dark moss, moss frame, pale moss
  text), + what you got, - what it cost, and "Lasts until the run ends (banked or wiped). Blessings stack."

**The tooltip card** (shared by blessings and heroes): leather with a bronze moulding (no studs) and a soft shadow;
Tiny5; the head in moon; a 3 × 3 moss + or crimson - bullet before each line, the words in bone; notes in dim bone.
As wide as it needs (132 for a blessing, 150 for a hero). **The pointer** is a bronze gauntlet arrow, 8 × 11 with a
void outline.

## 5d. Marching order and swaps (handoff 1.6)

Decided 2026-11-20 (Paweł approved the mockups). Live on the page: Battle, Swap (drag) and Hook breaks the line; the auras show
in every battle state. Code in `ranks.js`.
- **Ranks:** rank 1 is the front: x 126 in the picture (the right), the left group in the skill bar; ranks 2, 3 and 4
  at x 87, 56 and 21. The skill bar's groups follow the ranks; the keys stay with their hero.
- **Auras** sit between two groups, on the pilaster (from group x + 75, over its middle stud): a 5 × 5 glyph on a
  7 × 7 void plate in the giver's class colour. Knighten's steel shield goes to the hero behind, Garrote's ember crit
  star and Magoo's violet clock to the hero in front, Healero's gold cross both ways. The giver is the neighbour of
  that class. Two glyphs stack (y + 8 and + 16 in the bar), one sits at + 12. A downed hero gives none.
- **Out of position:** a 16 × 7 crimson tab over the bottom of the portrait (a wine underline) with "x0.7" in moon.
- **Swap:** press on a portrait (or the sprite) and drag. The portrait lifts under the pointer (its class outline, the
  art at a 50% checker), the target portrait gets a marching dashed gold frame, both heroes a dashed gold ring on the
  floor. On the drop they pass each other in 1 s; both groups' wells dither with a small "swap" plate, and "swap"
  floats between them. Landing outside his ranks, "out of position" floats up in crimson and the tab appears.
- **Enemies that break the line:** the cast names the target rank ("Hook · rank 4", section 5), 1 s, then a chain (steel links, a barb) flies to rank 4 and drags the hero to the front while the others step
  back. "out of position" floats up over him.
- **Hovering a hero** (the sprite) opens his card above his head: "Healero · rank 1", a crimson bullet for what is
  wrong ("Out of position: heals at 70%. His ranks are 2 to 4."), a moss bullet for what his aura gives and to whom,
  and a note ("Drag him back. Away, the line stays broken.").

## 6. Town (Ravenhold) on the grid

Inventory §6 halved. The town fills the battle area (334 × 232). Night, top-down at an angle. The static town is
drawn once into a lit layer, and its static lights (lanterns, fire bowls, windows, hearths, the portal) are baked
into a light map, so a frame costs ≈ 6 ms; fires, the vortex, water, smoke, people and UI are drawn each frame.

**Town style: 16-bit, not 8-bit.** The town is hand-textured pixel art, unlike the dithered crypt:
- Almost no ordered dither (strength 0.03 instead of 0.2), and no per-pixel noise. Texture comes from structure
  (stones, shingles, cobbles, tufts) so it forms clean clusters, never salt and pepper.
- Masonry: courses of uneven height (3–4 px) and stones of uneven length (4–8 px), each stone lit on its top and
  left edge and shaded on its right, joints partly worn; dressed quoins at the corners, long ones a pixel proud
  of the wall; a darker stone plinth; rain streaks; moss at the foot; the eave's shadow on the top rows.
- Roofs: hip roofs seen steeply from the south: back slope, bright ridge, front slope, a lit west hip and a dark
  east hip whose courses run along their own eaves (vertical), ragged eave tips. Front gables (Library, chapel,
  wings) show two slopes, a bargeboard V and the gable wall. Distinct per trade: slate, violet fish-scale cone,
  red barrel tiles, wooden shingles, soot-black slate, rounded thatch.
- Less box: cross-gable wings stepping 3 px forward of the front, dormers, chimneys, buttress pinnacles above the
  roof line, a jettied upper floor, lean-tos and awnings; trees, cypresses, hedges and props overlap the corners.
- Ground: Voronoi cobbles (5 × 4) kept low in contrast so streets recede, ragged street edges with worn dirt and
  weeds, paved plaza and court in uneven flagstones, grass with tufts one per cell.
- Depth: every caster writes a shadow length; the moon (upper left) lays shadows to the lower right, plus a contact
  shadow under every wall and a dark 1 px rim on the ground around everything that stands up.
- Brighter moonlight than the crypt (ambient 0.72 / 0.72 / 0.9) so the texture reads; windows, fires and the
  portal are baked into the light map as before.

Streets: east-west y 69 (10 tall), 131 (12), 191 (9); north-south x 68 and 265 (10 wide); the avenue x 157
(20 wide) from the plaza south. Plaza 116, 79, 102 × 52 (warm pale flagstones), fountain centre 167, 104.
Portal court 131, 52, 72 × 17 (cold stone, rune ring). Cliff along the top 10 px.

| Spot (box) | Reads as its trade by |
|---|---|
| Dungeon Portal 138, 0, 58 × 61 | pointed arch of voussoirs cut into a mound of boulders, skull keystone and jamb skulls, chains, a violet-and-crimson vortex turning, violet braziers, graves, worn steps with two guards; adventurers crowd the court and one at a time walks up and vanishes in a violet flash |
| Appraiser 2, 0, 65 × 69 | the only tower, and round: curved violet courses under a fish-scale cone on a corbelled gallery, a glowing eye window, a crystal on the spire with runes circling it, star banners, a brass telescope; curio shop with a crystal ball in a bay window; the appraiser in a rune circle on the street |
| Library 79, 5, 50 × 64 (plot, Lv 1) | gothic hall under a steep front gable: buttresses with pinnacles breaking the roof line, four stained-glass lancets, a rose window, a deep pointed door with the book over it, book stacks, ivy |
| Auction House 204, 0, 60 × 69 | the only pale building: four fluted columns, dentilled entablature, red barrel-tile roof, gold coin in the pediment, coin banners, a bell cupola, two pedestals with lots glowing in rarity colours, bidders raising paddles |
| Treasury 276, 15, 56 × 54 (plot, Lv 0) | cleared dirt with ragged edges, stakes and string, a work lamp, a notice board, the round riveted vault door leaning in a timber frame, gold-banded strongboxes, dressed stone blocks, iron bars, a sand pile and a barrow; a guard on watch |
| Merchant 199, 81, 65 × 49 | clapboard shop under wooden shingles, a red-and-bone striped awning with a scalloped edge, a bay window of coloured bottles, a counter of fruit and potions, barrels, crates and sacks; two striped market stalls on the plaza |
| Training Grounds 79, 143, 77 × 47 (plot, Lv 1) | the only sand yard: pointed log palisade, low rail fence, log gate with the crossed-swords banner and torches, straw dummies, two targets on easels, a weapon rack, hay bales, a roped sparring ring with two fighting |
| Salvage Forge 178, 132, 86 × 58 | rubble stone under soot-black slate; the only open fire at street level: a roaring hearth in an arch of voussoirs, the tallest chimney (rubble, tapering) with sparks and smoke, a plank lean-to with tools on the wall and a woodpile, a heap of broken blades, helms and shields, the anvil on a stump, a steaming quench barrel, a coal pile, the smith hammering sparks |
| Inn 276, 134, 56 × 56 (plot, Lv 1) | the only thatch: a deep rounded thatch with an eyebrow window over two half-timbered storeys, the upper one jettied; bottle-glass windows glowing warm, flower boxes, an open door, barrels, a bench of drinkers, the tankard sign |

Map UI (diegetic, no plates or buttons on the map): a wooden name sign on the curb under each building (solid
plank, Tiny5, brighter when hovered; the portal's sits on the cliff over the arch), a hanging trade sign 9 × 9
with the mark (eye, book, gavel, coin, scales, crossed swords, anvil, tankard). Hover: a breathing gold halo
4 px outside the building's own outline (violet for the portal), the sign brightens, and a tooltip card (leather,
bronze moulding; name, what it does, or for a plot its level, next effect and cost). About 80 townsfolk, 6 px tall.

Side panel in town: three tabs (section 6b).

## 6b. The town side panel: Town, Inventory, Skill Tree (handoff 2.1, #53)

Decided 2026-11-20 (Paweł approved the mockups). Live on the page's Town panel row (Town, Salvage Forge, Appraiser, Merchant,
Inventory, Skill Tree) and the Tree row (one per hero). Code in `townpanel.js` and `tree.js`.

**Souls replace scraps everywhere** (handoff 1.8): a soul is a 5 × 6 wisp, moon white with an arcane rim, set after
the number ("12" then the wisp); in the footer "650 g · [wisp] 26". Dim (bone) when you can't afford it.

**Tabs** (y 0 to 10, over the panel's leather): Town 42, Inventory 48, Skill Tree 46 px wide. The open tab is raised
leather with a lit top and left lip, its label in moon, and it opens into the panel; the others sit lower and darker,
labels in dim bone, over a bronze line at y 10. A service page keeps the Town tab open.

**Town tab:**
- The build list as before, from y 14: four rows 19 tall (name, three gold pips, "Next: effect", the 40 × 15 Build /
  Upgrade plate with "gold g" and Souls, the build's own costs and effects from `src/data/city.ts`; dim when unaffordable; MAX LEVEL at 3); the hovered plot's row lights with a
  gold edge.
- **The way down** at y 92: a floor picker well (12 tall) with two 9 × 10 bronze arrow buttons (dim at the ends),
  "floor 6" in moon and "checkpoint" (or "the start") in dim bone; floor 1 and every checkpoint (6, 11...). Under
  it the violet plate "Enter the dungeon · floor 6", 15 tall.
- BAG header at y 124 and the 6 × 3 bag; the footer.

**Services open in the Town tab** (no pop-up windows in town). The building clicked on the map keeps its gold halo
while its page is open, without the map tooltip.
- **Head:** an engraved strip at y 14 with a back arrow, the name in Silkscreen and the building's mark in gold at the
  right; one line under it ("Melt gear into Souls.", "Buys loot for gold.", "Epics 40 g, legendaries 100 g.").
- **The bag** at y 36 (6 × 3): each item that applies shows its value at its top-left in Tiny5 with a void outline
  (+1 to +16 Souls by rarity at the forge; its gold price at the Merchant, the build's item value, 6 × ilvl × rarity
  multiplier² + 3 per affix; at the Appraiser 40g on an unknown epic and 100g on an unknown legendary, the only two
  that drop unidentified);
  picked items get a gold double frame and a gold tick; items that don't apply (locked, unknown, maps; at the
  Appraiser, everything known) are dimmed under a void checker.
- **Then** what is picked ("2 picked: +2 [wisp]"), why some can't be ("Locked, unknown and maps: no."), and the
  action as a **flat gold button** ("Salvage 2 · +2 [wisp]", "Sell 2 · +48 g"): 15 tall, void rim, pale top row,
  copper bottom row, the label in void. Flat and palette-exact, so the dark label never sits on a dither; dim (dark
  umber, bone label) when it can't be done. The Auction House works the same way, priced in złoty.
- **The Appraiser's reveal** shows in the panel: a well with "Looking closely..." and sparks circling in, a flash,
  then a card (arcane moulding): IDENTIFIED, the item's cell, its name in its rarity colour, "Epic hood · Garrote",
  its affixes in moss (up to 3); a real-life affix ("of Stealth") shows its name in bone with a "real life" tag in
  dusk at the right, its effect on the next line. 40 g leaves the footer.

**Inventory tab:** party, gear, stats, bag and the Treasury row as in the dungeon, under the tabs.

## 6c. Skill trees (handoff 2.1 to 2.3, #53)

Decided 2026-11-20 (Paweł approved the mockups). The tree opens over the battle area (334 × 232) as a constellation; the Skill
Tree tab picks the hero and shows the hovered node.

**Each tree** (after the skill drop of 2026-11-20): the auto attack as the root, skill 1 (from the start), skill 2 (an
unlock), a rule pair on each skill, an autocast on each skill, the ultimate, and **stat nodes on the way to everything**
(Paweł, 2026-11-20): two stats gate skill 2, one leads to each rule pair, one to each autocast, three climb to the
ultimate. 17 nodes to buy, 15 at most (one of each pair). The stats are the class's own; in each tree the last one on
the way to the ultimate raises the hero's aura (section 5d). In the panel a stat says where it leads ("Stat · on the
way to Bash").

**Costs** (set 2026-11-20 for the playtests, checked against the Souls income): stat 20, unlock 40, rule 40, autocast
60, ultimate 120 Souls, each × (1 + 0.15 × nodes already bought in that tree). Souls are one pool for all four heroes
and the buildings.
- **Income** (the handoff's formulas: 3 + floor per floor cleared, +20 per boss, salvage 1 / 2 / 4 / 8 / 16 with
  commons and uncommons auto-salvaged, 0.35 drops per kill, packs of 5 + floor/2 up to 12; about half the rares and
  epics salvaged later): about 17 Souls a floor on night 1 (a run to floor 4 gives about 59), 30 by floor 10, 45 by
  floor 20. A plausible week (10 to 12 floors a night, the best checkpoint rising about 3 floors a night) gives about
  200, 215, 320, 330, 310, 350 and 320 Souls a night, about 2,050 by Sunday.
- **What it buys:** 2 nodes per run on night 1 (the handoff's target is 1 to 2); each hero has the 6 nodes his
  ultimate needs around nights 3 and 4; all four ultimates bought by about Sunday; one tree bought out costs about
  1,100, all four about 4,500, so the trees fill in about two weeks. (Custom Night's x1.5 is gone: no Custom Night, 2026-11-20.) The buildings' Souls are
  216 in all (gold is their real gate).
- The handoff's starting costs (10 / 15 / 15 / 40 / 60, +25% per node) would buy 4 to 5 nodes per run on night 1,
  twice the target, and with 15 buys the last node would cost x4.5.

| Hero | To skill 2 (2) | To skill 1's rules / autocast | To skill 2's rules / autocast | To the ultimate (3) |
|---|---|---|---|---|
| Knightenstein | Veteran +8% damage, Brute +10% damage | Bulwark +10% armor / Iron Skin +10% HP | Crushing: Bash +20% damage / Hardened: healing on him +15% | Stalwart +15% HP, Tower Shield +15% armor, Shield Brother: his aura -35% damage (from 25%) |
| Garrote | Nimble +8% attack speed, Shadow +10% dodge | Keen Eye +10% crit / Deadly: crits +25% damage | Quick Blades +8% attack speed / Lucky +5 luck (he loots) | Cutpurse +15% gold, Ruthless +8% damage, Sly: his aura +15% crit (from 10%) |
| Magoo | Focus +8% damage, Arcane Mind cooldowns -8% | Pyromancy: Fire +15% damage / Spellpower: skills +12% damage | Elementalist: Burning and Chill last 25% longer / Glass +10% crit | Ley Lines: his ultimate charges 20% faster, Warded +10% HP, Mentor: his aura cooldowns -15% (from 10%) |
| Healero | Devotion +10% HP, Faith cooldowns -8% | Grace healing +10% / Mercy healing +15% | Bastion: Ward soaks 20% more / Zeal +8% damage | Shepherd: the party's max HP +5%, Vigil +10% armor, Halo: his aura 1.5% HP per second (from 1%) |

**Layout** (the same for every hero): the root at 167, 208 (its name to its left). Skill 1 at 72, 170 ("start" above
it to the right); its autocast stat and autocast go left in a line (41 and 16, y 170, names above and "auto" under); its
rule stat above it at 72, 140, then the fork (72, 116) to the pair at 44 / 100, y 90, chained. Skill 2 at 262, 170, the
mirror (autocast stat 293, autocast 318, rule stat 262, 140, fork 262, 116, pair 234 / 290), reached from the root
through its two gate stats at 204, 202 and 236, 190 (names under). The three stats to the ultimate up the middle at y
174, 142, 110 (names to the right), the ultimate at 167, 52. "gold ring: you can buy it" sits top right, the key
(rule, stat, autocast) bottom left.

**The sky:** near-black stone with a soft nebula in the hero's own material (knight stone, Garrote loot copper, Magoo
arcane, Healero umber), about 170 fixed stars and a few that twinkle.

**Shapes by kind:**
- Root: a disc in the class colour inside its ring, the auto attack's name under it.
- Skills (large): a void disc 19 across with a ring, the 13 × 13 skill icon inside.
- Ultimate (largest): rings copper or class colour, gold and wine, its icon, the gold crest peak with a crimson gem
  over it (as on the skill bar's ultimate well), and six pips in an arc under it that light gold as nodes are bought.
- Rules (medium): a 13 px diamond; owned, it fills with the class colour around a moon centre.
- Stats (small): a 7 px four-point star.
- Autocast (small): an 11 px ring with the loop mark inside (moss when owned).

**States:** owned (the class colour, moon highlights, a soft glow under it); can buy (a gold ring that blinks gold and
pale: the next action); too dear (bone); locked (dark stone, the icon under a void checker); shut by its pair (dark,
crossed). Lines: solid in the class colour between owned nodes, dotted stone toward what you can buy, sparse dots
toward what is locked. Names: under the skills and the root, over the rules, beside the stats and the ultimate (moon
when hovered, bone when owned, dim when locked); "auto" under the autocasts. The hovered node gets a marching gold
ring and the pointer. Top left: the hero's name in Silkscreen and "Knight tree"; bottom: a key (rule, stat,
autocast) and "gold ring: you can buy it" in gold.

**The Skill Tree tab:** the party cards as the hero picker (the chosen one framed gold), a strip with his short name and
his Souls; the hovered node's name, its kind ("Rule · Taunt", "Unlock · skill 2", "Ultimate"), what it does, then
bullets: moss for "Bought." or what it gives, crimson for what it locks or needs ("Locks Hold the Line.", "Needs 6
nodes in his tree: 5 of 6."); a rule; "5 bought in this tree" and the ultimate's six pips; the flat gold **Buy ·
cost [wisp]** (dim with "Needs 6 nodes", "Locked" or "Shut by its pair"); under it "Each buy in this tree
costs +15%." or, when you can't afford it, "Not enough Souls: 140 of 246." in crimson; the bronze **Respec · free
while testing**; the footer.

## 7. The right screen: monitor + desk (real life)

The right screen is 492 × 360 at x 148. Real life is drawn as modern pixel art: a dark room lit almost only by the
monitor.

**Decided (2026-11-19): the desk is Graphite**, which fits the black and grey left panel. The desk has its own 32
colours in the same slots as Moonwell (the drawing code names slots), plus slot 32, `steel` `#5398b5`, and slot 33, `ember` `#c16229` (UI-only, kept out of the dither). Every part keeps
a shared core in the same slots: void, moon white, the six meaning colours (gold, crimson, arcane violet, her pink
`#d9a69c`, Zone cyan `#81c1c8`, moss `#749970`) and the four class colours (knight steel `#5398b5`, Garrote ember
`#c16229`, mage arcane `#8b5ad6`, priest gold `#f1a934`). Graphite's own 24: neutral greys with no hue shift (hardware, cards), grey-greens
(Excel), mauve greys (room, call screen), greige wood and Platinum grey (desk, taskbar), plus wine, copper and pale
gold for the note. Tungsten (warm) and Neon (2 a.m.) stay on the page as alternatives, Moonwell 32 as the backup.
Her panel (PC-98): 16 colours, see section 7b.

**Class colours** tie the game to the desk: each portrait (party cards and skill bar) has a 1 px outline in its hero's
colour, and his keys glow in it on the keyboard: 1 2 3 knight steel, Z X C Garrote ember, Q W E mage violet, A S D
priest gold (legend plus a line of light along the lowest visible row of the cap's top face). The locked fourth skills
(4, V, R, F) stay dark.

**One camera for the desk.** Eye level at the monitor's top edge; depth lines meet at x 246, y 3. A desk point
(X across, Z ahead, Y up; the eye's height = 1) lands at x = 246 + 479 X / Z, y = 3 + 479 (1 - Y) / Z; the monitor's
foot is at Z = 1.84, the bottom edge of the screen at Z = 1.34.
- Keyboard: X -0.42 to 0.56, Z 1.18 to 1.57; the case rises toward the back (typing angle); each key is a 3D cap:
  a sculpted top that tilts toward you (lit, brightest at its far edge), a dark front skirt, and the side that faces
  the centre. Caps sit close: 0.0015 gap on each side of a 0.0624 pitch, the top inset 0.0055. Far rows first, so nearer caps hide the skirts behind them. Visible rows: numbers, Q, A, Z and the top
  of the bottom row.
- Phone: lies flat at X -0.625, Z 1.47 (0.1 clear of the keyboard's left edge), square to the desk, so its long edges run to the same point as the keyboard's
  sides; 0.215 × 0.46, 0.024 thick (the rail facing the centre shows), corners rounded like the phone in your hand. Its lit
  screen is a texture laid on the glass through the camera, so it is in perspective. What it shows: section 7f.
- The mat and the monitor's foot are rectangles on the desk plane, drawn through the same camera.

The element specs below hold for any palette. It stays out of the RPG's frames: **Windows 98 on the monitor** (decided
2026-11-19 as 98/XP; Windows 98 decided 2026-11-20, section 7i: the taskbar, Excel and its dialogs), iOS on the phone, flat
glass cards on the desk. Text is Tiny5 only (no Silkscreen, no blackletter: those belong to the RPG).

| Element | Grid px (right-screen coords; add 148 for the 640 grid) | Look |
|---|---|---|
| Monitor bezel | 4, 3, 484 × 260; 5 px all round, corners r 3 | Thin dark modern bezel, unlit (its own shading), a lit outer edge top/left, an inner lip that catches the screen's light; a webcam module on the top edge (lens, glint, green light: it is on); a power light bottom right |
| Game screen | 9, 8, 474 × 232 | The RPG screens (sections 5 and 6) or Excel, pasted in 1:1 |
| Taskbar | 9, 241, 474 × 15 (screen glass at rows 240, 256, 257) | Windows 98 (section 7i has the kit): Platinum grey face with a white top line. Left: Start (38 × 11, raised, the four-pane flag), a groove, then two task buttons 76 × 11 with 8 × 8 icons (Loot Night: crossed swords on arcane; Excel: a green sheet). The app in front is pressed in (the dithered face); the one behind is raised and carries the key that switches to it ("Loot Night · Tab" while Excel is up, "Excel · Tab" in the game). Loot Night flashes navy with white text when it needs you while you're away. Right: Sleep (raised, a power glyph; "Sleep (23:00+)" and greyed until 23:00), then the tray, a sunken well with the wallet in moss ("zł" with a hand-drawn ł) and the clock. After 01:00 the clock turns crimson |
| Tonight note | 208, 248, 74 × 45 (clear of the 1 2 3 keys) | Flat pale-gold paper stepped for a slight tilt, a lifted lower-right corner, a strip of tape over the bezel edge, a soft shadow on the bezel. Tiny5 sheared into a ballpoint slant (dark blue ink), each word on a wandering baseline: "Tonight ⏻ 23:00+" ("any time" after 23:00), then tonight's three stars as three lines, "floor 8" (Deep), "don't get caught" (Unseen), "keep her happy" (Sweet), each with ✓ (green) / ! (copper) / ✗ (crimson); no star ladder |
| Desk | from y 263 | Dark wood in perspective (grain compressing toward the monitor). Lit by the monitor: its light is sampled from the screen (8 columns, every few frames) so the desk goes blue in the crypt, warm in town, cream under Excel; the pale taskbar adds a warm fill along the far edge. A flat monitor foot at the centre |
| Phone | lies flat at the left, runs off the bottom | Through the camera (above). Graphite with a polished rim, Dynamic Island; off: black glass with a reflection band. Ringing, banners, her reply, face down: section 7f |
| Keyboard and mat | keyboard from about y 282, runs off the bottom; mat under it | Through the camera (above). The game's keys are backlit in what they drive: 1 2 3 knight steel, Z X C Garrote ember, Q W E mage violet, A S D priest gold, Tab Excel green, H Zone cyan, G moss (Goblin Fuel; dark with no cans); 4 V R F dark. A dark cloth mat with a stitched edge |
| YOU card | 355, 267, 133 × 26 | Flat glass card: indigo fill, lit top edge, rounded corners, soft shadow on the desk. TIRED (arcane bar, value, a mark at 30 that turns gold once passed) and ZONE (cyan bar out of 30). Drink button 40 × 20: the Goblin Fuel can (its 6 × 13 icon, in its own print colours over the UI), "×3", "Drink", and a small G keycap; from Tired 30 with a can left it turns gold with a pulsing copper rim (gold = the next action); no cans: the can greyed and struck out in crimson, the count dim |
| Feed card | 355, 296, 133 × 61 | Same glass card. Newest line on top, each: time (dim), a coloured tag, the text in moon fading to dim with age; two lines at most, the second indented to the text column, "..." if it runs on |
| Zone aura | around the bezel | Headset on: the bezel's outer rim lights cyan (pale cyan from half Zone), a cyan glow spills over the wall margin and onto the desk, growing with Zone |

Feed tag colours: YOU bone, HER dusk pink `#d9a69c`, PHONE moon, GAME gold, LOOT its rarity, EXCEL sage, DOG copper,
NIGHT stone blue, GUILD and PARTY umber, MAGOO arcane, HEALERO moss.

**Excel (Tab)** fills the game screen (474 × 232): Q4, the Excel clicker, in a maximised Windows 98 window (section 7i).
The RPG, side panel included, is hidden; the party fights on behind it.

Cost: the desk adds about 6 to 9 ms per frame on top of the game screen (≈ 9 to 21 ms in all).

## 7b. Her panel (left, 148 × 360) and the dog

**Decided (2026-11-19, round 4):** the webcam view is the prototype's, as close as possible: its room, door, corridor,
him and her, unchanged in design, only dithered. The panel UI below it stays as designed (PC-98: beige, pink, purple).

**How it's made.** Each state is baked (`bake_her.py`) from the prototype's own screenshot of that state. The prototype
panel is 296 × 720 CSS px, exactly 2× the grid, so the webcam view (CSS rows 0 to 532) comes down 2× in linear light
to 148 × 266, then is ordered-dithered (Bayer 8×8) to the curated palettes:
- his room and him (the near-black striped wall and floor, the slate door and frame, the chair back, his silhouette,
  the glowing glasses, the plan sheet): the desk's Graphite, light dither;
- what shows through the door and the daydream bubble (the warm corridor, the kitchen light, her): the PC-98 set plus
  the desk's darks and greiges, so the prototype's colours stay close, stronger dither;
- the light under the door: a gold bar with a pale top row.
The prototype's own header (name, mood) is wiped from the bake; the game draws its own.

States baked: chat (she stands in the open doorway; he faces the monitor, nervous), kettle (the door ajar, her back by
the kitchen; he has turned to look), footsteps (the door ajar, she comes down the corridor; he has turned), shower (the
door shut, the daydream bubble; he faces the monitor). Live on top: the headset icon lights cyan with the headset on;
his glasses turn grey-green under Excel. New states (another visit, the cuddle, caught) come the same way: a prototype
screenshot of the state, baked.

**UI (PC-98):** "Babe" in Tiny5 16 px over the wall, a rose heart, the mood in a plum pill. A plum band from y 266:
the last-heard line (y 270), her note as a beige paper window with plum and purple bevels (y 279, 29 tall; amber line
on top for footsteps), two pink buttons (y 310, 69 × 17), stats at y 331 (Patience, Caught, Goodwill with marks at 40
and 60, Noise in gold). In a chat the window grows from y 270 for the question and three answer pills.

**The dog (right screen):** redesigned, see section 7d.

## 7c. The energy break (five steps in a window over the right screen)

Live: the Energy break row on the page (No energy break / 1 Drawer / 2 Grab / 3 Open / 4 Drink / 5 Toss); stills and
the drink animated in row I of the canvas. The prototype gave the content (steps, words, mechanics); the look is ours.
Real life, so it is the desk's world: Graphite neutrals lit by the monitor (its light takes the screen's colour), the
can in its own print colours, text in Tiny5 only.

**Window** 400 × 300 at right-screen 46, 30; the scene 392 × 258 at 50, 68. Behind it the right screen dims to 42 %
(each colour mapped back into the desk palette) with a soft shadow under the window. Flat glass like the YOU card: s1
fill, s3 lit top edge, rounded corners. "Energy break" in moon and "Hands busy: abilities paused" in dim, a close box,
five step pills 74 × 11 (done: moss check on dark moss; now: gold with dark text, the next action; to come: dim), the
step's instruction in moon, a 1 px ink frame round the scene. In-scene hints are Tiny5 gold with an ink shadow, the
cursor is a pixel hand (open, grabbing).

**One camera per scene.** Every scene is ray-cast through a pinhole camera in centimetres (X right, Y up, Z toward
you; the desk's front edge at Z 0, its top at Y 75, the floor at Y 0): boxes, cylinders, ellipsoids and discs, each
with its own pixel shader; light = ambient + lights with a soft cosine, falloff and hard shadows. Materials quantise
to the desk's 34 colours with its light Bayer dither; sprite texels to the desk + acid + print colours (58); UI is
palette-exact. Flat clutter (receipts, stains, cables, rugs, posters) is drawn in the surface's own coordinates, so
it lies in perspective. "Show grid" draws each camera's vanishing points, its horizon and a grid on its main plane.

| Step | Camera | In view | The can |
|---|---|---|---|
| 1 Drawer | eye 26, 240, 130, looking 54° down, f 1116 (a longer lens, so the desk, the can on its spot and the open drawer fit) | desk top above the fold: the mouse mat with its stitched edge and a black gaming mouse well back on it (centre 20 cm in from the edge: high palm hump, flared thumb rest with two side buttons, a ridged wheel standing proud between split buttons, a DPI button, chevron seams, dotted rubber grips, a braided cable; no lights), the keyboard's corner, a receipt, two coins, crumbs, the charger cable, a white glazed mug with a round handle (a true ring) and coffee in it, the ring stains on the can spot; the pedestal's two drawers (gaps, lit lips, bar handles); the floor's planks, cables, a power strip with a lit switch | inside, not seen yet |
| 2 Grab | the same | the drawer pulled 22 cm: two cans, a dead gamepad, AA batteries, a coiled USB cable, a receipt, a sticky-note pad | cylinders r 3.62, L 16.8 wrapped in the 36 × 87 sprite (86.5 px long: 1:1); the dragged can turns upright on the way and stands on its spot right of the mouse mat, 12 cm in from the desk's edge, ring gold → moss with a check |
| 3 Open | from the front left (yaw 12°), 14.5° down, 300 cm away, f 2968 (a long lens) | the can 12 cm in from the edge, so the desk runs on in front of it; the white mug behind it to the right, a desk speaker; the monitor out of frame to the left, lighting the can from that side like its drawing | the 72 × 174 sprite stood on the spot: 69.7 vs 72 px wide, side 160.9 vs 161 px; the tab ring lifts 10 px, the mouth opens, acid fizz, "psssht" |
| 4 Drink | level with his glasses at rest (the horizon runs through them), from his left, f 440 (5.18 px per cm at his depth) | no desk: the monitor at the far left with the game on its glass, squeezed into its perspective; the window's moonlit blinds behind him, a poster, a shelf with books and a plant | the 36 × 87 sprite turned to the tilt, side-on, see-through; the hole on the lid's lower edge, on his lower lip |
| 5 Toss | from his chair, 9° down, f 486 | no desk, no monitor: the window and blinds, the sill, a radiator, a low cabinet with a plant, a little castle and game boxes, a dragon-eye poster, a calendar and a switch on the side wall, the mesh bin with paper in it and nothing behind or beside it, last nights' misses lying flat on the floor round it. A dark corner: the monitor behind you is far off and fades before it gets here, the moonlit blinds are the brightest thing, the misses lie dim; the bin's rim and mesh stay readable | a whole can, the 15 × 36 sprite (on its side for the misses), held at the bin's depth (15.2 px per 6.6 cm there), so it keeps its size as it flies across; not the crushed one |

**Him, in the drink:** the one from her panel turned side-on. A dark silhouette (short dark hair with a few lighter
strands, the ear, a dark tee), the screen's cold light rimming his profile (forehead, nose, lips, chin), his glasses
lit white with a soft halo, red lips that part while he drinks, the cyan sweat drop on his temple. His head tips well
back (up to 41°, about the top of the neck) while the can tilts, so his mouth turns up to the can. The neck is its
own shape, rebuilt each frame between the turning head (under the jaw, the nape, the occiput) and the still body (the
throat's base, the collar at the back): the throat runs as one smooth curve from chin to collarbone at any tilt, the back
of the neck runs straight down from the back of the skull to the collar, a touch hollow, never outside the shirt (no
hump), and pinholes where shapes meet are closed so no seam is rimmed. The can tilts on to 154° to keep pouring into the raised mouth.

**The can at his mouth:** side-on, the lid end at his lips and the base (GOBLIN FUEL, upside down as it tips) up and
away. The hole the drink comes out of is on the lid's lower edge at every tilt, where the liquid pools, so it pours out
of the bottom of the tilted can into his mouth. That lower edge rests on his lower lip; the rest of the top end sits
above it, against his upper lip.

**The liquid** (not blobs): one continuous body. The can's inside is a rectangle in the picture; the free surface is a
level line placed so that the area under it inside that rectangle equals what is left (bisection on the clipped
polygon), so the volume holds as the can turns. Two standing-wave modes ride on it, their height following how fast
the tilt is changing (slosh), plus a small ripple. Below the surface the colour runs down the acid ramp with depth and
darkens toward the walls, ordered-dithered like everything else; a 1 px pale meniscus line; fizz as single pixels
rising and vanishing at the surface; the label shows faint over the liquid (22 %) and over the empty part (36 %). When
the surface reaches the mouth, a thin ribbon (a parabola, its width the flow) runs into his mouth. In you: a bar with
half at 60 and full at 85; the Space key shows pressed while it tilts.

**Checked:** measured against each camera, the drawer cans 86.5 px for 87 sprite rows, the open can 69.7 × 160.9 px
for 72 × 161, the thrown can 15.2 px for 15 and the misses 14 to 16 px, the drink can 87 px for 16.8 cm at his depth.
The can's radius is taken from the drawing's proportions (its side 161 px tall to 72 wide), so sprite and cylinder
agree. Vanishing points: drawer depth (196, -1361) and verticals (196, 986); open depth (-502, -630), verticals 11600 px
below (the sprite's parallel sides are off by under 1 px); drink depth at the centre (196, 112), on his glasses; toss
depth (196, -3), verticals 3100 px below. The misses are 36 × 15 lying cans, 14 to 16 px across the can at their depth. One known mismatch: the 72 × 174 drawing makes its lid a touch rounder than
its base (about 0.28 vs 0.25), while the camera sees 0.22 vs 0.27; about 2 px at the lid, left as drawn.

**Sprites:** taken from the can canvas (B, Chest Burst): 72 × 174 (the 76 × 184 drawing trimmed to the can), 36 × 87,
15 × 36, the 15 × 40 states, the 37 × 24 and 33 × 33 drinking angles, the crushed 15 × 20 (not used now) and the 113 × 164 wrap; stored
palette-indexed in `cans_img.js`.

**Cost:** about 30 to 40 ms a frame with the window up (each scene's static part is ray-cast once and cached, the drawer
once per 3 cm of travel; the moving can, him, the liquid and the UI are drawn each frame).

## 7d. The dog and the cable fix

**Decided (2026-11-19):** the prototype gives the content (a shiba who jumps up at the desk; pet him gently or he
slams the desk and the cables come out), the look is ours. Live on the page's Dog row (pet him and play the cable fix
with the mouse); stills and three animations in row J of the canvas.

**The dog** (`dog.js`). A shiba, cute first:
- **Proportions (chibi):** the head about as wide as his shoulders: 66 px across (72 with the cheek tufts), ear tips
  45 px above the head's centre, the body a short bean with a cream bib, front legs in cream socks, paws on the desk.
- **Face:** a round mochi head with fluffy cheek tufts; triangular ears with rounded tips, cream and pink inside; big
  glossy eyes set low and wide (11 to 13 px; a big shine up left and a small one low right, puppy eyes get a third);
  the orange mask comes down between the eyes to the nose; the cream urajiro rises on both cheeks under the eyes and
  covers the muzzle, chin, throat and chest, with the two eyebrow dots; a small black nose with a grey shine; an omega
  mouth; blush on the cheeks when happy.
- **Tail:** a curl over his right hip (a spiral, orange outside, cream inside). It wags slowly when he waits and faster
  and wider as he fills up (0.14 rad at 4 rad/s to 0.64 rad at 18 rad/s): **no bar, the tail is the meter.**
- **Drawing:** code (shapes, hard pixel edges, a 1 px ink outline), each part shaded with the key light from the upper
  left (as the UI and the can), 4 × 4 Bayer in narrow bands, palette-exact.
- **Palette:** his own slots from the can's print colours (EB_PAL), appended to the desk set as index pixels and kept
  out of the desk's dither (like Garrote's ember). Fur `#241c2e #452c3d #6a4240 #852e30 #c16229 #fae299` (the shadows
  shift to red and plum), cream `#8a614d #aa8667 #c7b18c #eee5c6 #f2efdc`, pinks `#925673 #b87a83 #d9a69c`, eyes
  `#241c2e #452c3d` with moon shines. The desk's gold stays out of his fur (it keeps its meaning). Hearts in his orange.
- **Place:** the head's centre at x 224, y 288; paws on the near desk edge (the frame's bottom); ears over the
  taskbar and the Tonight note. Drawn over the desk, the cards over him; hearts, marks, your hand and the sound
  bubbles go in an overlay after the game screen is pasted, so they float over the monitor. Sound bubbles: Tiny5 on a
  flat dark fill.

| State | What he does |
|---|---|
| 1 Jumps up | Rises fast over the edge, ears flying, wide eyes; a squash when the paws land |
| 2 Waits | Whines (a "whine" bubble, a little Noise); puppy eyes, the eyebrow dots lift; his head tilts one way then the other; tongue blep; one paw lifts out to the side and taps, showing pink beans. The first time, a glass card to his left: DOG "stroke his head, gently" |
| 3 Petting | Your hand (the game's cursor) on his crown; eyes close in happy arcs, ears go back, blush, an open smile with the tongue, hearts float up, the tail speeds up |
| 4 Favourite spot | Left ear, right ear or chin (a new one each time, counts ×3): he leans his head into your hand, bliss eyes, tongue out, full blush, a sparkle, twice the hearts |
| 5 Too fast | Flinch: eyes squeezed (> <), ears pinned, he ducks 4 px; a "!" and the card says "gently!"; the stroke takes a little back; then a wary peek |
| 6 Good boy | He licks your hand ("lick"), a happy hop, and drops away to your feet |
| 7 Lucky sock | Filled mostly on the favourite spot: he comes back up with a white sock with red stripes in his mouth, drops it on the desk, "GOOD BOY!" (moss), and leaves it there |
| 8 Ignored | After 12 s: side-eye, nose up and away, a pout, "hmph"; he sinks out of sight |
| 9 Slams the desk | After 1 to 3 ignores: leaps barking, slams both paws (eyes squeezed, impact strokes), "BONK" (crimson); the whole desk jolts (up to 3 px, 0.6 s), the screen flickers and goes NO SIGNAL; a guilty "?" and he drops away |

**Input (the page):** strokes over his head (±40 px across, from 52 px above to 30 below the head's centre) fill him
by 0.0032 per px moved; faster than 760 px/s makes him flinch (−0.04). These are the mockup's numbers; the game's stay
in `tuning.ts`.

**NO SIGNAL:** the monitor's own message box ("NO SIGNAL", "check the cable"; Tiny5 on a grey box) drifting on black.
The room goes dark with the screen, since the desk's light is sampled from it.

**The cable fix** (`cables.js`): a window like the energy break's over the right screen, the rest dimmed.
- **Window:** "Behind the monitor" and "NO SIGNAL: the party fights on unseen"; four pills, one per cable (a swatch
  of its colour and the plug's name; moss with a check once in); "Plug each cable into the port of the same shape";
  on the right "Flow kept if back in N s" (gold, from 6), then "Flow kept" (moss) or "Flow lost".
- **Camera:** behind the monitor, 16° down, a long lens (300 cm away, f 3999): 13.1 px per cm at the sockets, 13.6 at
  the plugs. Depth vanishing point (196, −1013); the verticals meet about 14100 px below (practically parallel).
- **Scene (cm):** the monitor's back (68 × 36, dark matte, vents and the VESA plate up top, a serial sticker), its
  bottom edge 4 cm above the desk. The port strip is a recess (x −31.8 to −5, y 5.4 to 11.8) with 4 sockets at
  x −28, −21.6, −15.2 and −8.8 (y 8.6), each with its label printed under it (Tiny5, grey). The stand's neck and base,
  the greige desk with dust, the grommet at (−35.5, −9) that the cables come up through, a USB stick and a crumpled
  note. The screen is off, so the moon through the window behind you lights the back and the plugs' faces.
- **The 9 connectors** (HDMI, DisplayPort, figure-8 power, USB-A, USB-C, DVI, VGA, Ethernet, 3.5 mm) share one shape
  for socket and plug: the metal shell, the cavity, the details (tongues, pins, contacts, DVI's blade, the RJ45 clip
  notch, the audio jack's green ring, thumbscrews on DVI and VGA). **Every connector is drawn 1.3× its real size,
  sockets and plugs alike, so the shapes read** (HDMI 24 × 8 px, USB-C 15 × 5, Ethernet 20 × 17).
- **Plugs** lie on the desk in front of the strip, **connectors toward you**, so each plug and its socket are compared
  face to face. Cables in 4 of 9 colours (crimson, gold, moss, violet, white, black, greige, copper, mauve; no cyan,
  which means Zone) run back to the grommet. Dragged, a plug follows on a plane 4.6 cm in front of the strip; on the
  socket of its shape it turns and clicks in (moss frame, "click") and its cable hangs to the desk and back to the
  grommet; on a wrong one it bounces back (crimson frame, "doesn't fit"). A fresh mix every time: which plugs, which
  colours, which socket order.
- **Done:** "Signal back in N s. Flow kept." within 6 s, otherwise "Signal back. Good as new."

**Checked:** Show grid draws a grid on the monitor's back and on the desk with the depth vanishing point; the plugs
and sockets measured against the camera (above). Frame time about 25 ms with the dog and 32 ms in the cable fix
(plugs standing still are cached with the room; only a moving plug is cast each frame).

## 7e. Caught (the full-screen scare)

**Decided (2026-11-19):** the caught scare is a late PC-98 dating-sim portrait of her, head and shoulders only, in the
style and fidelity of that era's portraits (Paweł's reference; for style, not her look). Her look is the prototype's.
Live on the page's Caught row; stills, close-ups and the scare animated in row K of the canvas.

**Screen** (640 × 360, the whole frame, her panel's 16 PC-98 colours). She stands in your doorway, close, with the
hallway light behind her: the dark door jambs at the sides, the corridor in perspective with its ceiling light, a warm
rim one pixel inside her outline along the hair and shoulders. Her look: long straight black hair (dark plum to violet,
a blue-violet shine of short strands round the crown, highlights down the sidelocks), blunt bangs cut short enough that
her brows sit on skin, round thin glasses, green eyes, the pink flower clip on her right, a cream wide-neck tee. (A placeholder: Paweł draws her final
art, and she wears no glasses.)

**How it's drawn** (`caught/gf_svg.js` → `render.js` → `compose.py`, baked to `caught_img.js`): vector layers, one per
material, each carrying a grey light map (the face lit softly from the front, the bangs' and sidelocks' shadows, the
neck under the chin), rendered at 4× and brought down to the grid, then each layer quantised on its own ramp with
flat tones and 50% checkers between them (what PC-98 painters used); the background with a fine 4 × 4 Bayer. Ramps:
hair void, plum, purple, denim, lilac; skin brown, pink, skin, moon; tee tan, beige, moon; iris void, moss, cyan;
mouth void, plum, crimson, rose; the hallway void, plum, brown, tan, gold, beige. Line art in exact colours, each part's
lines right after the part (so what's in front hides them): black on hair, eyes, brows and glasses, brown on skin and
the tee, plum for the mouth, crimson for the clip.

| Catch | Face | Hallway | The line under WE NEED TO TALK. |
|---|---|---|---|
| 1st | A stern glare: brows heavy and slanted down to the nose, the eyes narrowed, a flat mouth, pink hatching on the cheeks | warm | Caught 1 of 3 tonight · Flow reset |
| 2nd | Her glasses go blank white with a glint (eyes hidden), the upper face in shadow with gloom lines, a tight straight mouth | a step darker | Caught 2 of 3 · Guilt: the party deals 10% less for 30 s |
| 3rd and later | Furious: brows hard down, a tight squint with tiny pupils, a shout with clenched teeth top and bottom, the anger mark on her hair, red hatching | lit red behind her | Caught 3 · she turns your monitor off for 8 s · Flow reset |

**The text window** (PC-98, x 104, y 286, 432 × 64): plum with a lilac edge and a purple bevel, a checker shadow along
its bottom, her name on a pink tab with a heart, WE NEED TO TALK. in Tiny5 16 px, crimson with an ink shadow, the
cost in Tiny5 lilac, a blinking ▼ in the corner (the dating-sim nod).

**The scare (0.8 s):** a white flash (one frame), an interlaced punch-in (every other line black), then her face shakes
and settles (up to 5 px, 7 px for the 3rd); the window snaps in at 0.12 s. The page holds the screen after the scare so
it can be looked at.

## 7f. The phone

**Decided (2026-11-19):** the prototype's phone UI was a placeholder; the content is the prototype's and the build's
(desk.md: the phone minigame table, the #45 layout rules, #47 face-down is silent, #63 everything happens inside the
phone), the look is ours. Live on the page's two phone rows (in your hand, on the desk); stills and two animations in
row L of the canvas.

**One OS, a night mode** (`phone.js`), drawn at the game's pixel size in the desk's Graphite. Text Tiny5 only (8 px; 16
px for names and titles), the UI palette-exact; only wallpapers are dithered, and they glow (emissive, unlit).
- **Meaning colours keep their jobs.** Gold is what you can tap now: every reply, every timer (bars and chips). Moss is
  accept and success (the answer knob, Face ID, the timing zone, "sent"). Crimson is decline, end, wrong and misses.
  Her pink is her (her name with a heart). Wine is a warning strip (on speaker). No cyan (it means Zone).
- **Status bar on every screen:** the time, the Dynamic Island, signal, battery %.
- **Avatars:** small pixel portraits clipped to a disc. Mom: copper, a grey bun, glasses, a wine cardigan. Babe:
  mauve, long black hair, the pink clip, blush (no glasses). Boss: grey, a side part, a white shirt, a red tie. The
  courier: umber, an ember cap. The Boys: violet, three heads.
- **Bubbles:** incoming dark grey with moon text; hers a warmer mauve; yours cream with dark text; 4 px corners and a
  tail pixel. A thread comes up from the bottom under a fixed header, and a bubble that would be cut is left out.
- **Replies:** one full-width gold button per row that grows with its text, a wine drop shadow, copper while pressed;
  Mom's carry their mark (… ? !) in a dark square on the left.
- **Timers:** a gold bar with seconds in calls and chats; a gold chip with seconds on an incoming call.
- **Every screen can be left:** Decline, Put down, the red End, the back chevron, the home bar.

**In your hand.** 124 × 252 (the screen 112 × 240; corners r 17 on the body, r 12 on the screen) at right-screen 12,
112, over the heroes' side of the battle area; it rises from the bottom in 0.32 s (ease-out), its bottom edge 4 px off
the frame. The desk spot stays empty meanwhile. No hand: just the phone, with side buttons on both rails.

| Screen | Layout |
|---|---|
| Incoming call | The caller's colour as the wallpaper (Mom umber, the courier stone, The Boys violet) with a glow behind the head; a dotted pulse round the 20 px avatar; the name at 16 px, a subline (mobile, a number, the three names); Speaker and Message (round dark buttons; Speaker answers hands free, but she hears it); slide to answer (a moss knob, a light sweeping the words); Decline (crimson). The gold chip top right counts the 8 s ring |
| Lock screen | Night wallpaper (the dusk ramp, stars, a crescent, dark hills); the date in her pink; a big clock in its own digits (11 × 20, 2 px strokes); the two newest banners (icon: Work a grey briefcase, Messages a moss bubble; the sender; the app; the message, 2 lines at most), then "+N more from …", so Face ID is always whole; Face ID: a 30 px ring that fills moss while held (1.2 s), "keep holding"; Put down |
| Boss | The Work chat: back chevron, his avatar, "Work · deck due 9:00", the 15 s bar; his bubbles; a sum card ("sum 2 of 2", the sum at 16 px), three gold totals; a wrong one flashes copper and the feedback line says "Wrong. -2 s, try again." in crimson |
| Her text | Babe and the heart in pink, the 8 s bar, her mauve bubbles, the one reply: Five more minutes, love (a red heart) |
| Mom talks | The call header (avatar, name, "on call · line 2 of 3", the call clock); her line; the timing bar (the marker sweeps it in 2.4 s, the moss zone is 30 %); "tap the reply in the zone"; mhm, really?!, wow with their marks; "Too slow. She keeps talking."; misses as 4 pips above the red End |
| Courier talks | His line, the 8 s bar, the goal ("Get it left with a neighbour." / "One wrong word: he leaves."), three replies, End |
| The Boys talk | "on speaker"; Danny's line, the 8 s bar, "Say no, nicely. Quickly.", three replies (polite, shouting, rude), the wine strip with a speaker glyph: She can hear it; misses as 2 pips; End |
| Messages | The app's contacts (decided 2026-11-20, Paweł): "Messages" in tinyL, then one row per contact 34 px apart: a 20 px avatar, the name (hers in her pink with the heart), the time, the last line (moon when unread, grey when read), her unread count on a 9 px disc in her pink; a 1 px line under each. Babe and The Boys (3). "Tap a chat to open it." A tap is a gold dashed ring. A minigame opens its chat straight away; a chat's back chevron comes here |
| The Boys' chat | The last minigame's exchange, kept until the next one: their texts in grey with the name first ("Danny: raid at 11?"), your answer in cream; at the bottom Raid night? (a group call, the Raid buff), dim with a lock and "Needs Goodwill 40: 31 now" while it can't |
| Her chat | Tap Babe in Messages (or her text arrives) (section 7f, her chat, below). The header (back chevron, her avatar, Babe and the heart in pink, "Messages"); the thread kept for good, newest at the bottom, a grey line with the day or the time between sittings ("Sunday", "Today 23:12", "00:41"); her photos as crops in the thread; Text her (gold, "3 s, hands busy" under it); the home bar |
| Her chat, scrolled back | The wheel or a drag moves the thread a bubble at a time (no bubble is ever cut); a 2 px thumb on a 1 px track at the right edge shows where you are; a grey chip with a down chevron (15 × 10, bottom right) goes back to the newest. "Babe unsent a photo." in grey, centred, where she took one back |
| A new photo | The photo's crop with a gold bar under it and "open" / "52 s" in gold beside it: the 60 s to open it (fan-service step 5); missed, it becomes "Babe unsent a photo." |
| Texting her | The thread; the field with a gold caret; the message types itself while the keys light; then it sits in a cream bubble, Delivered, "sent. back to the game" in moss, and the phone goes down |
| Home screen | Tapping the idle phone on the desk. The night wallpaper dimmed by a checker behind the icons; on top the battery widget (section 7j); a row of three 28 × 28 app tiles (radius 7, a lit top edge, a 12 × 12 glyph) at x 8, 42, 76, y 72: Messages (moss; her unread count on a 9 px disc in her pink at its top right), Shop (copper), Home (steel, "4 devices" under it); labels under them; the home bar. More apps join the row later (TBD); there is no Gallery. A tap is a gold dashed ring |
| Shop | Section 7i. The header (back chevron, "Shop" in tinyL, the wallet in moss on the right); a For you / For her / Home segmented control at y 33 (the open tab lit: grey, her pink, steel); six rows 30 px apart: a 17 × 17 tile (a glyph on a colour), the name (her pink on For her), what it does in two lines, and the price pill 30 × 9 at the right: gold when you can buy it now, grey when it costs more than you have, "soon"; bought things show a moss chip ("tonight", "owned"). Buying flashes the row moss and the wallet counts down |

**Messages and her chat** (decided 2026-11-20, Paweł). **Messages is a working app:** its contacts, and you tap one to
see their chat. A minigame (her text, The Boys' text) opens its chat straight away. The other interrupts stay one-time
minigames; The Boys' chat shows only the last one's exchange, with Raid night? at its bottom. **Her chat is kept for good:**
- **Kept for good:** one thread across the nights, newest at the bottom, a grey separator (the day, or the time after a
  gap) between sittings. Her bubbles mauve, yours cream, as in every thread.
- **Scrolling:** the wheel or a drag moves it a bubble at a time, so the rule that no bubble is ever cut (#45) holds
  while you scroll. Not at the bottom: the thumb on the right edge and the grey chip back to the newest. Text her stays
  at the bottom whatever you look at.
- **Her photos** are the only place her selfies live (there is no Gallery). In the thread a photo is a 76 × 56 bubble in
  her mauve showing a crop of the photo at its own pixel size (74 × 54 from the 180 × 240 picture, nothing scaled; the
  crop is set per photo). A new one waits 60 s to be opened (the gold bar and seconds), then becomes "Babe unsent a
  photo."; opened photos stay. The photo keeps her panel's 16 PC-98 colours (painted after the phone is composed).
- **The photo window:** tapping a photo opens the whole picture in a normal window beside the phone (the desk's glass,
  section 7k): 192 × 262 at right-screen 208, 50, over the dimmed right screen (50%); "Babe" and a heart in her pink
  and the time on its bar, the close box (Esc or a click outside close it too); the photo 180 × 240 at 1:1 in a 1 px s2
  frame. The first time you open a photo, Goodwill +5 (fan-service step 5): a moss chip rises over the photo's bottom
  and fades. The phone stays up beside it (hands busy).
- **Art:** her photos are drawn at 180 × 240 (this replaces "selfies at phone size, 124 wide" in the fan-service art
  list), in her 16 colours, with the crop for the bubble marked. The page's two are code-drawn stand-ins (a mirror
  selfie in his jersey, under the duvet), suggestive only.

**Picking up the idle phone.** Point at the phone on the desk and it wakes to the lock screen (the time, no banners)
with a gold "pick up" chip above it (the ringing chip without the seconds); click and it rises into your hand at the home
screen. This is the app mechanic: Messages, Shop, Home, and later apps on the same row. Nothing rings while
it's up; calls and texts wait.

**On the desk** (`desk.js`, through the desk's camera). The body is a rounded rectangle with the in-hand phone's corners
(radius 0.137 of the width, 2.95 cm): the polished rim, the dark frame and the side facing the centre all follow it.
The lit screen is a 64 × 100 texture over the top face (`deskScreen` in `phone.js`, about one texel per screen pixel
where the phone lies), drawn with the same kit as the phone in your hand, then mapped through the camera texel by
texel: text, avatar and buttons are in perspective; the wallpaper stays material and is dithered in screen space. At
this size the text slants with the glass and is too small to read, **and it doesn't need to be** (decided 2026-11-20): it
reads in your hand. On the desk, who it is shows in colour, while the layouts stay the OS's, so a call still reads as a
call and a text as a banner: a call fills the screen in the caller's colour (Mom copper, the courier steel blue, The
Boys violet, each with a darker lower band), a text is a solid banner block in the sender's (the boss moon white with a
dark briefcase, her pink with a white heart, The Boys violet with three heads).

| State | Look |
|---|---|
| Off | Dark glass with the monitor's reflection band |
| Idle, pointed at | It wakes to the lock screen with no banners; the gold "pick up" chip above it; the Windows arrow over it |
| Ringing | A status bar, the whole screen in the caller's colour (Mom copper over wine, the courier steel blue over grey, The Boys violet over dark mauve, a checker between), a 7 px avatar on a void disc, the name (16 px if it fits, else 8), mobile or group, the slide pill with its moss knob, Decline under it; it jumps 1 px with the long buzz (every 1.4 s) with buzz marks, and lights the desk in the caller's warmth. Above it, the only thing outside the phone: one gold chip, "pick up · 8 s" (the countdown and the hint in one) |
| Banners | The lock screen wakes: a status bar, the time at 16 px, stars, the two newest banners as solid blocks in the sender's colour (the boss moon white with a dark briefcase and dark text, her pink with a white heart, The Boys violet with three moon heads; anyone else dark grey), "+N more" |
| Her reply | One banner: Babe and the heart in pink, her reply; the desk lit a little warm; for 7 s |
| Low battery | At 20% and again at 10% the lock screen wakes with a crimson block (a battery and the %); a faint red light on the desk. The status bar's battery is crimson from 20% (section 7j) |
| Dead | Black. When it dies, and whenever you tap it, the empty battery shows with a blinking crimson sliver |
| Face down | The back: frosted glass and the camera block (three lenses). Silent (#47). A message: a soft cool glow leaks out round its edges onto the desk (moon to grey in the dither, about 5 cm wide, plus a light) and flares on each one; a call: it pulses until it stops |

**Rejected:** blue quick replies (iMessage): blue is no meaning on the desk and a reply is the next action, so gold. The
fade at the top of a thread (#45): at this size a dissolve reads as noise, so a bubble that doesn't fit is left out (no
bubble is ever cut). A countdown ring plus a hint label by the ringing phone: merged into one gold chip. A hand holding
the phone in your hand (first a skin-toned one, then a dark one lit by the screen): Paweł took it out. Glyphs pasted
flat at their projected spots on the desk phone (readable, but not in perspective): replaced by the texture. The prototype's 186 × 398 window (93 × 199 on the grid): too small for 8
px text and full-width replies.

**Cost:** the phone in your hand adds about 6 ms a frame (the page runs about 25 ms with it up); the desk states cost
under 1 ms.

## 7g. Her windows: the cuddle break and the plan

**Decided (2026-11-19):** the build gives the content and the rules (`src/systems/cuddle.ts`, `src/ui/plan.ts` and
`planHtml` in v0.49.8); the look is ours, and it is hers: her panel's PC-98 colours, its bevelled windows and Tiny5,
not the desk's glass. Live on the page's row under Caught (the cuddle's five moments, a playable run, the plan open or
on the wall; the plan's corner in the webcam view opens it too); stills and the cuddle played once in row M of the
canvas.

**The cuddle break** (`cuddle.js`). A window 268 × 204 at right-screen 112, 20, over the battle area; the right screen
dims behind it to 42 % with a soft shadow, as for the energy break.
- **Frame:** night plum with a lilac edge, a purple bevel and a void shadow (the caught screen's text window); her name
  on a pink tab above it (Babe and a heart, as on the caught window). "Cuddle break" in Tiny5 16 px skin with an ink
  shadow, "stay on her breathing, slowly" in lilac, a close box with a crimson ✕ (pulling away: Mood +12).
- **The heart:** the build's curve halved to the grid (256 × 152 field; the heart about 144 × 109), one clean 1 px line
  (L-corners removed). Ahead of her breath it is lilac stitches (2 on, 2 off); behind it the line fills in rose with a
  purple glow, so the line shows how much of the 12 s is gone.
- **Warmth fills the heart:** a plum and purple 50% checker below 30 %, flat purple up to 60 %, a purple and rose
  checker from 60 % (passing). No radial glow (it read as a pink egg).
- **Her breath:** a 7 × 6 rose heart with a plum edge and a moon shine, 9 × 8 on the in-breath (a breath every 4 s),
  inside a ring of radius 17 (the build's 34 CSS px), which grows 1 px on the in-breath. Off her breath: a dotted lilac
  ring. On it: a solid rose ring, a purple checker halo, small hearts floating up (a new one every 0.45 s, 1.6 s each,
  pink then purple). Too fast (the mouse over 450 px/s, the build's 900 CSS px/s): the ring and the heart crimson, the
  heart trembles 1.5 px, "too fast!" in crimson with an ink outline over it.
- **Your hand** is the cursor: an open hand, skin with a brown outline.
- **The foot:** "warmth" in beige; a 7 px bar (purple edge, a moon top row on the fill, an empty plum and void
  checker): lilac below 60 %, rose past it, crimson while too fast; the 60 % mark is a beige tick wearing a 5 × 4
  heart, a lilac outline until you pass it, then rose; the seconds left in beige at the right.
- **Rules (the build's):** 12 s once round the heart, warmth starts at 0.3, +0.16/s within the ring, -0.1/s outside,
  -0.5/s for 0.4 s after a rush; 60 % at the end passes. On the page a run ends with her note's line and starts again.

**The plan** (`blueprint.js`). A sheet 196 × 289 at frame 8, 34, over her panel and the monitor's left edge; everything
behind it dims to 42 % (each colour back to the nearest of the desk's and her colours, a light ordered dither) with a
soft shadow. Closes with the ✕, Esc or a click outside.
- **Palette:** her 16 plus four blueprint blues of its own: edge `#10294f`, paper `#1b4683`, grid `#265599`, pencil
  `#9fbde6`.
- **Sheet:** paper with a 1 px darker edge and an 8 px grid (1 px lines); "THE PLAN" in Tiny5 16 px moon, "who hears
  you, what the crack shows" in pencil, a close box (pencil edge, rose ✕); masking tape over both top corners (beige,
  a moon top lip, a tan lower edge, torn ends, slanted a step); the bottom-right corner curled up (the pale back of the
  paper, its fold line, the shadow through the gap); a void checker shadow 3 px down and right.
- **Drawing:** the build's 200 × 200 layout at 0.92 (184 px), **as approved on 2026-11-20 for the lean (§7l):** the bathroom
  at the hallway's far end (its door slides into the wall), the bedroom off the hallway, the living room's corner opened
  by an arch, the hall mirror on the left wall (a cyan line). Walls 2 px in moon (chalk) with the doorways open;
  windows as a thin double line where the wall gives way; door swings as the leaf and a quarter circle; furniture 1 px
  in pencil (beds and pillows, the wardrobe and nightstand, the bathtub, toilet and basin, the kitchen's L counter with
  two burners, the fridge, the round table, the TV on the wall, the sofa, the coffee table and pouf, the sideboard, your
  desk with its monitor, your chair, your bed). Room names in Tiny5 moon with a paper outline; YOU in gold.
- **What the crack shows:** everything the gap at your door can see (every direction through it, cast against the walls,
  §7l) as a lighter grid checker; three dashed rose sight lines (2 on, 2 off) to the lean's stops, 1 2 3 in rose: 1 the
  kitchen, 2 the bathroom, 3 the living room. It never marks where she is.
- **Note:** the build's text in pencil, wrapped to the sheet, its 1 2 3 in rose; with the approved plan it reads "The bedroom
  is further down, the bathroom at the far end. Through the crack: 1 the kitchen, 2 the bathroom straight down the
  hallway, 3 the living room through its open corner." (the order is who hears you best: `ROOM_DISTANCE` swaps the bathroom and the bedroom, Paweł 2026-11-23).

**Rejected:** the desk's glass window (these are hers); a radial glow round the heart (it read as a pink egg and
fought the heart); a 50% void checker to dim behind the plan (too noisy over the game screen).

**Cost:** the cuddle window about 8 ms a frame on top of the frame; the plan 15 to 25 ms a frame (70 ms the first time,
while the dim's colour table fills; the sheet itself could be drawn once and kept).

## 7h. The morning

**Decided (2026-11-19):** the build's morning screen (`src/ui/panels.ts`, `docs/design/night.md`) gives the content:
how the night ended picks the picture, then the night's numbers and stars. The look is hers: a PC-98 dating-sim CG of
her asleep, in her panel's 16 colours, over the whole frame. Live on the page's row under Caught (The morning: green,
yellow, red, unplugged; the pink button or Esc closes it); stills and how one is made in row N of the canvas.

**Screen** (640 × 360):
- **The CG** fills the frame. Keep what matters left of x 430 and above y 320: the summary and the caption cover the
  rest.
- **Caption:** a night-plum window 424 × 30 at 8, 322 (lilac edge, purple bevel, the caught window's look), a rose
  heart, the line in beige Tiny5.
- **Summary:** her beige paper window, 192 wide at 440, 14, as tall as its content. "Morning" in Tiny5 16 px plum, the
  day and time in brown, a dotted rule; what the auction house sold (or "Nothing sold overnight."); four inset cells
  87 × 27 (Wallet in moss, Gold in brown, Sleep debt in crimson above 0, Best stars); LAST NIGHT in rose, each star
  7 × 7 (gold with a brown edge when earned, a tan outline when not) with its name and its reward, or "missed";
  Q4's take in moss; a dotted rule; the sleep-debt line; the pink "Start Monday night ▶" button (rose on hover).
- **zł** is Tiny5's zl with a short slash drawn across the l.

| Ending | Caption | Picture |
|---|---|---|
| Green | She fell asleep in your shirt again, hugging your pillow. | From the foot of the bed, a little to the left: face down, deep under the thick duvet pulled up to her shoulders, only her hair and clip on the pillow; both lower legs and feet out at the foot end, soles up toward you. Morning sun through the blinds in stripes |
| Yellow | Back turned. Her phone is still lit. | From the foot of the bed, the other corner: face down with her head turned away; she kicked one corner off, so her right lower leg and foot are out and the duvet covers the rest to the bed's end, rolling over it. Her phone lies lit on your pillow by her head; what its glow reaches takes the cool ramp |
| Red | She fell asleep on the couch. The TV is still on. | From the TV's side, high: on the couch facing its back, wrapped from shoulder to toes in the lilac duvet she dragged out of bed, which runs up against the couch's back and falls over the seat's edge; only her head shows on the cushion. The TV behind you is the only light: cool ramps throughout |
| Unplugged | An empty bed. A note on your pillow: "Hope the loot was worth it." | From the foot of the bed, close to the pillows, drawn mirrored so her side is on the left: the duvet smooth on your side, folded back on hers corner to corner (doubled, a soft roll along the fold), the sheet where she lay; her flower clip left on her pillow, a folded note with a small heart on yours. Grey light, the blinds up |

**The duvet** is a proper warm one: about 10 cm thick over the mattress, laid over her as one soft mound (her body
inflated, blended into the layer with a 17 to 20 cm fillet; on her side the hollows bridged first), broad soft folds
(1.7 cm), hems rounded by cutting with a radius of about half its thickness, rolling over the bed's edges and hanging
down the sides. She is covered, warm and comfy; only her feet show.

**How it's made** (`morning/`, baked into `morning_img.js` as indexed PNGs, 12 to 18 KB each):
- `scene.html`: a WebGL2 ray-marcher of signed distance fields in centimetres: the room, the bed or the couch, her
  as smooth-blended ellipsoids and round cones (a face-down pose; a jointed side pose with a frame per foot), the
  thick duvet as a solid laid over her (`duvet()`, `duvetHang()`). One pass writes material, light and depth at 4×
  (2560 × 1440). Lights: the sun through the blinds (stripes), the phone (a point light; rendered again without it
  for its mask), the TV.
- `compose.py`: down to 640 × 360 (each pixel takes the material covering most of its 4 × 4 block), each material on
  its own ramp of her colours, flat tones with 50% checkers between them; ink where a nearer surface meets something
  more than 2.5 cm behind it, or another material behind it. Ramps and gains can be set per scene.
- **The soles are drawn,** not modelled: an SVG sole with its pads, creases and shading (`sole.js`), laid over each
  3D foot by projecting the foot's frame through the camera (`project.py`). The 3D foot is shrunk to 1/1.55 so it
  stays under the drawing. Seen from above, the outline is left open at the heel (`OPENHEEL=1`), so the sole runs on
  into the ankle.

| Material | Ramp (bedroom) | Red |
|---|---|---|
| Skin | brown, pink, skin, moon (light × 0.8 + 0.04 where her legs come out) | plum, purple, pink, skin |
| Soles; their pads | brown, pink, skin; brown, rose, pink, skin | purple, pink, skin; purple, rose, pink, skin |
| Hair | void, plum, purple, denim | the same |
| His tee | void, denim, cyan | the same |
| Panties | plum, crimson, rose, pink | the same |
| Duvet | purple, lilac, beige, moon (light × 0.45 + 0.3, so the blinds' stripes stay soft); unplugged: plum, purple, lilac, moon (× 0.62 + 0.1) | plum, purple, lilac, moon |
| Sheet, pillows | tan, beige, moon | the couch: void, plum, denim, cyan; the cushion: plum, purple, lilac |
| Wall; floor; wood | plum, brown, tan, beige, moon; void, plum, brown, tan; void, plum, brown, tan, beige | wall void, plum, purple; floor void, plum |
| Phone; its screen; its glow | void, plum; cyan, moon; plum, denim, cyan, moon | |
| Clip; the note | crimson, rose, moon; tan, beige, moon | |

**Rejected:** the sandwich scene; her asleep on top of the covers (the first green; Paweł wants a proper bed with
covers); stump, tube and modelled feet (drawn soles instead); a thong cut; for yellow, side views at bed height (she
became a thin band with empty wall above), a duvet band across her waist (no real duvet does that), and a duvet
thrown off her back seen from the side (it read as a lilac board); her bottom out from under a thin cover (Paweł: a
proper thick, warm duvet, her covered and comfy, only her feet out); under the thick duvet, yellow on her side (from
the foot end the mound hid her head and read as a lump; from the side the leg out read as a stick), so yellow is face
down too; the gold throw on the couch (the duvet she brought from bed instead).

**Cost:** the CGs are baked; drawing the morning (the CG and the summary window) takes a few ms a frame.

## 7i. Windows 98, Q4 (Excel) and the Shop (handoff step 4, #55)

**Windows 98, not XP** (decided 2026-11-20: Paweł approved the #55 mockups). Win98 reads as one hard-edged
pixel material: grey faces, white and dark bevels, a 3-step title gradient. XP needs soft rounded blue gradients and
shading that fight the dither and the desk's 1-bit edges. The kit (`win98.js`), in the desk palette plus three UI-only
slots for the title blues (navy, blue, sky: 34 to 36, never in the dither):

| Piece | Look |
|---|---|
| Raised / sunken / pressed | 2 px bevels: raised = white top-left, dark bottom-right (outer black, inner grey); sunken = the reverse; pressed (the app in front) = sunken with a checker face |
| Title bar | 11 px: navy to sky in 3 steps with checker seams between them, an 8 × 8 app icon, the title in white; minimise / maximise / close as 9 × 9 raised buttons with black glyphs |
| Window | Grey face, raised outer bevel, the title bar, then content |
| Button | Raised with centred text; the default button has a black outer ring; pressed is sunken with the text 1 px down-right; disabled text is etched (white under grey) |
| Taskbar | Section 7, the right screen's table |

**Q4 (Excel)** is the clicker that pays złoty (handoff step 4). Its window fills the game screen (474 × 232):

| Element | Grid px (game-screen coords) | Look |
|---|---|---|
| Title bar | 1, 1, 472 × 11 | "Microsoft Excel - Q4_report_FINAL_v3.xls" |
| Menu | y 15 | File Edit View Insert Format Tools Data Window Help, the access letter underlined |
| Toolbar | y 25 to 38 | New, Open, Save; Cut, Copy, Paste; Σ, sort, chart; the 100% zoom well; Macros (46 × 13, held down while the pane is open) at the right |
| Formula bar | y 41, 11 tall | The cell box (B12, C5, D5, E5 by the toy) and the formula (=SUM(B5:B11), =SORT(...), =GETPIVOTDATA(...)) |
| Sheet | 0, 54, 314 wide; letters A to E on a 10 px header, rows 12 px from y 64 | Columns A 14+60, B 74+48, C 122+48, D 170+48, E 218+96; row numbers on raised 14 px tabs; white cells, grey grid |
| Row 1 | Job | The title in B; from C, an Excel data bar (moss) to the next title in lifetime złoty, "to Senior Analyst", "820 / 1,500" |
| Row 2 | Pays | "1.61 zł/s" in moss; a gold x2 chip with its seconds while Sort runs; Hustle in D/E: a copper bar, x3 to x1 |
| Rows 3 to 9 | the report | Headers on a grey fill; five regions (North, South, East, West, Online); Total in row 9 |
| Big Σ | rows 10 to 11 in B | AutoSum, the toy you click: a raised Σ button 40 × 22 (Space works too); Total in B9 gets the selection frame |
| Fill handle | the corner of C4 | Grab the 3 × 3 handle (the thin black cross), drag down, let go |
| Sort A-Z | rows 10 to 11 in D | A raised button; greys out for its cooldown |
| PivotTable | E, rows 4 to 9, "grab and spin" under it | A disc on a turntable in perspective; grab its corner and fling it |
| Macros pane | 324, 54, 150 × 165 | A navy tool-window title ("Macros", "run while you play"); six rows 25 px: a 9 × 9 macro-sheet icon, the name, Lv, what it does at this level, Buy (40 × 11): gold when you can afford it, raised grey when you can't, a lock and "Unlocks at <title>" before you get there |
| Sheet tabs | under the sheet | Q4 (front, white), Q3_old, Sheet3; the scroll arrows |
| Status bar | y 220 | "Ready" / "Drag to fill" / "Sorted. Everything x2."; "Q4 tonight: +86 zł" in moss; NUM |
| Pops | over what paid | "+1.3 zł" in moss with a white outline rising 16 px; the BALANCED stamp: a double crimson frame 64 × 15 over the column that lands with a shake |
| Promotion | a dialog 214 × 82 | Microsoft Excel's dialog: a gold medal icon, "Congrats on your promotion!", "You are now a Senior Analyst.", "Q4 pays x1.25. Unlocked:", what unlocked, OK (default). Confetti (70 squares in the meaning colours) for 1.5 s; the new macros flash pale in the pane |

Pointers are Excel's: the Windows arrow, the fat white cell cross, the thin black fill cross.

**Q4's numbers** (set 2026-11-20 for now, all to be tuned in playtests):

| | Value |
|---|---|
| AutoSum | 0.4 zł a click; the column rolls 0.4 s; 10% BALANCED pays x5 |
| Fill flick | 0.15 zł a filled cell (7 cells a flick) |
| Sort | everything x2 for 5 s; 10 s cooldown |
| Pivot | 1.2 zł a full turn |
| Hustle | x3 right after you switch in, down to x1 over 15 s (rewards short visits, which is the stealth layer's rhythm) |
| Titles (lifetime zł) | Intern 0, Junior Analyst 50, Analyst 300, Senior Analyst 1,500, Team Lead 6,000, Manager 25,000, Director 100,000; each title x1.25 on all of Q4 |
| Macros (cost = base x 1.5^level) | Intern 20 (AutoSum 0.5x a second a level), AutoFill 60 (1 cell a second a level), VLOOKUP 150 (+25% a filled cell a level), Conditional Formatting 300 at Senior Analyst (+2% BALANCED a level, 40% at most), Pivot macro 800 at Senior Analyst (0.3 turns a second a level), Power Query 4,000 at Manager (+100% all the macros earn, a level; added, not multiplied) |

**The Shop** (the phone, handoff 4.6) sells real-life things only, in złoty. Buying is instant (hands busy while the phone is up).

| For you | zł | Does |
|---|---|---|
| Goblin Fuel | 29 | Four cans for the drawer (it holds 8) |
| Dog chew | 29 | His next visit comes 2 min later; one use |
| Silent keys | 249 | Q4 makes half the Noise |
| Mini fridge | 599 | A cold can already waits on the desk |
| Ergo chair | 899 | Tiredness builds 15% slower |
| New phone | 2,999 | The battery drains 40% slower (section 7j) |

| For her (#59) | zł | Does |
|---|---|---|
| Flowers | 49 | +20 Goodwill at once; one use |
| Fluffy socks | 79 | Her steps go silent (the decided trade-off) |
| Knee socks, Fury tee, Pajama set, Cat hoodie | 99, 129, 149, 199 | +20 Goodwill the first time she wears it; their trade-offs are open (Paweł's call) |

**Checked against the rest** (a model of a night: 10 min of game, Excel 45 to 120 s of it in 6 s visits, Hustle as
above, the Shop bought first, then the cheapest macro):

| Clicks a second | First promotion | Night 1 | Titles by night | Shop bought out |
|---|---|---|---|---|
| 1 | 38 s of Excel | +64 zł (Flowers) | Analyst 2, Senior 3, Team Lead 4, Manager 6, Director 8 | the gifts by night 3, the fridge and chair night 4, the phone night 6 |
| 2 | 21 s of Excel | +154 zł | Analyst 2, Senior 3, Team Lead 4, Manager 5, Director 7 | the gifts by night 2, the fridge 3, the chair 4, the phone 5 |

So Flowers is the first night's buy at any pace (49 zł, lowered from 89 so 1 click a second still gets there), the
promotions come about a night apart early on, and the big upgrades land on nights 3 and 4. **The open problem:** from
about night 5 Q4 makes 10,000 to 200,000 zł a night with nothing left to buy (Goblin Fuel and the chew are the only
repeat buys, at 29 zł). Late złoty need a sink (the RPG's Auction House, gold for złoty, more Home upgrades in step 6)
or Q4 needs a soft cap. That is for the playtests and step 6; nothing is decided.

## 7j. The smart home and the battery (handoff step 6, #57)

Decided 2026-11-20 (Paweł approved the mockups).

Live on the page: the in-hand phone row (Home app, Home: vacuum, Home: TV cast, Home: door seal, Home: busy, Battery
low, Battery dead, Shop: home) and the desk phone row (Low battery, Dead). Code in `phone.js`.

**The battery** (FNAF's power). 100% at the start of every night. It shows in the status bar (moon; crimson from 20%;
moss with a bolt while charging), in the battery widget on the home screen and in the Home app's header.
- **The widget** (6, 20, 100 × 40, glass like the app tiles): a battery glyph 19 × 9 (moss fill; crimson from 20%), the %
  in tinyL, "Phone" (or "Low" in crimson) and "+40%" on the right, and the gold **Charge · 15 s away** button (90 × 11).
  Charging is the away state (the empty chair, one of the small pieces): no input for 15 s, then +40%. If she comes
  meanwhile she sees whatever is on the monitor.
- **Dead (0%):** the phone in your hand is black: the empty battery with a blinking crimson sliver, a cable waiting
  under it, "0%" in crimson, "Dead. No calls, no texts, no Home app.", "If Mom calls, she gets Babe instead." (her
  scripted call counts as ignored), and the gold **Charge it · 15 s away** (+40%). On the desk it stays black and
  shows the empty battery when it dies and when you tap it.
- **Low:** at 20% and 10% the desk phone wakes with a crimson block (section 7f).

**The Home app** (header 44 tall: back chevron, "Home" in tinyL, the battery on the right, "Tap a device to use it.").
- **The plan** (x 6, y 50, 101 × 101): the build's apartment (`ui/plan.ts`, its 200 units at 0.5; as approved on 2026-11-20, §7l: the bathroom at the far end, its speaker there, the TV on the living room's west wall) as room tiles, dark
  grey with 1 px void walls between rooms: Bedroom, Bath, Kitchen, Hallway, Living, and your room in a lighter grey
  with "You" in gold. Room names small in grey at each tile's top left. **It never shows where she is:** the house
  knows its devices, not its people (the same rule as the plan on the wall).
- **Devices** sit where they are installed, as 12 px discs with a 7 × 7 glyph: the vacuum's dock in the living room,
  the speakers in the kitchen and the bath, the TV cast on the TV, the door seal on your door. A gold ring that blinks
  gold and pale: ready (the next action). A grey sweep with the time left on a small tag: resting (the speaker pair
  shows its one time once). Moss: on (the seal, "sealed") or running (the vacuum moves round its room, "running").
  Picked (its sheet is open): a marching gold ring.
- **Bubble tea** is a card under the plan (an order, not a device): a cup on an umber tile, "Bubble tea", "25 zł · 6%",
  a gold Order pill; after ordering, "Doorbell in 1:47" in moss and "1 of 2" on the right.
- **A device's sheet** rises over the dimmed plan (iOS sheet, a grabber): the device's disc and name; what it does,
  with its condition and never whether it is met (the pre-emptive rule); a note in grey (its rest, how many tonight);
  for the vacuum, **Where**: five room chips (the picked one moon white); the battery before and after (two glyphs, "64%
  > 44%", crimson and "low" if it lands at 20% or under); one gold button with the cost ("Start · 20%", "Next episode ·
  8%", "Seal the door · 4%"); Cancel.

| Device | zł | Battery | On the plan | Effect (the handoff's) |
|---|---|---|---|---|
| Robot vacuum | 899 | 20% | Living room dock; runs in the picked room | If she's in that room or next to it, she goes to stop it: next visit +45 s. Rests 3 min |
| Speakers (a pair) | 199 | 10% | Kitchen and bath | A timer rings in that room: she goes to check it, next visit +30 s. From the 3rd use in a night, Mood +5 each time |
| TV cast | 149 | 8% | On the TV | While her show's credits roll: Next episode keeps her on the couch for one more. Twice a night; the third time she notices (Mood +10, she comes to your door) |
| Door seal | 39 | 4% a toggle | Your door | The towel's effect and downside: your Noise 40% quieter, her routine 30% slower; no light under the door; she asks about it on every visit |
| Bubble tea (an order) | 25 an order | 6% | A card under the plan | The doorbell 120 s later; she gets it and sits with it: no visits for 120 s. Twice a night |

**Three readings of the handoff (decided 2026-11-20 with Paweł's approval of #57):**
- **The speakers are a pair** (kitchen and bath), bought once: the handoff's "ring a timer in the kitchen or bathroom"
  reads as two speakers, so you tap the one in the room you want.
- **The TV cast is always tappable.** Lit only during the credits it would tell a player wearing the headset that she
  is at the TV's end cue, which the game never says (the pre-emptive rule). Used at the wrong time it does nothing and
  the use and battery are gone.
- **Charge is dim at 100%** (nothing to add).

**Battery numbers** (set 2026-11-20 for now; the handoff's were half): a call or text answered 2%, vacuum 20%, speakers
10%, TV cast 8%, door seal 4% a toggle, bubble tea 6%; a charge +40% for 15 s away; the New phone ×0.6. Checked
against a night (about 7.7 real minutes, `preemptive.md`): a typical player uses the vacuum twice, the speakers twice,
the TV cast twice, the seal twice, one bubble tea and answers 6 calls and texts; a heavy one 3, 4, 2, 4, 2 and 8.

| | Typical | Heavy |
|---|---|---|
| The handoff's costs | 51%: never charges | 80%: never charges |
| Set here | 102%: one charge (15 s away) | 160%: two charges (30 s away) |
| Set here, New phone | 61%: never charges | 96%: never charges |

At the handoff's costs the battery never runs out, so it isn't FNAF's power, and the New phone (2,999 zł) would do
nothing. At double, charging is a real choice (15 s away) and the New phone is the late-game buy that removes it.

## 7k. The small pieces: inspect, how to hide, coach marks, tooltips, pause, away, microsleep

Decided 2026-11-20 (Paweł approved the mockups and the calls below). Live on the page's Small pieces rows; code in
`small.js` (the webcam's chair in `her.js`). Every one is
escapable (a close box, Esc or a click). Which look each one takes: real life is the desk's glass and Tiny5, the PC is
Windows 98, hers are her PC-98 windows, the RPG keeps its own tooltip card (section 5c). Coach marks are the game
talking, so they look the same everywhere.

**The desk's glass window** (as the energy break's): s1 fill, a lit s3 top row, an s2 edge with notched corners, a
10 × 10 close box (s2, s3 frame, a cross); the right screen behind dims to 42% (each colour back to the nearest of the
desk's and her colours, a light ordered dither) with a soft shadow round the window. Buttons are 13 tall: gold with a
copper underside for the next action (a pale key cap after the label: Drink G, Resume Esc), s2 with a lit top otherwise.

| Piece | Where | What it shows |
|---|---|---|
| Goblin Fuel inspect | Right screen 96, 40, 300 × 214 | "In your drawer" and a gold "New tonight"; the can at full size (72 × 174) on an acid glow (a1/a2 dither) over a void-checker shadow, bobbing 1 px; "Goblin Fuel" in tinyL; "100% greed. Tastes like a loot drop."; moss + Party 30% faster for 60 s, + Tiredness -35, crimson - Then a sugar crash: 15% slower for 20 s, Tiredness +10 (the build's numbers); "Pour it well: 85% down for the full boost, 60% for half."; the cans you have as eight 15 × 36 cans, the empty slots dark; "3 of 8 in the drawer.", "More in the Shop: 29 zł for four."; Drink G (gold) and Later |
| How to hide | Centred, 452 wide, as tall as its text, the whole frame dimmed | "Tuesday, 20:00" and a gold "How to hide"; "Hide the game before she sees it." in tinyL; one tile per thing that is on tonight (week one), 104 wide for four and 82 for five, as tall as the longest text (Tuesday: Listen, Tab to Excel, Answer her, the headset and Lean in), each a 64 × 40 picture (your door with the light under it and her sound; the Tab key then Excel; her note with "?!"; the headset with cyan cups; your door held open on a warm slit with her small in it, 1 2 3 in her pink and gold arrows under it), a number on a small square, the name, what to do (the build's words); tonight's new one framed gold with a "new tonight" tag; the line about the party and her patience; Got it (gold) |
| Coach mark | Beside its target | A marching gold ring round the target (and a copper one 1 px out), a glass callout 150 wide with a gold top row and copper edge, a void-checker shadow, a gold wedge toward the target; the title in gold, the line in moon, "The game crawls until you do it." in grey, a close box. Footsteps: over the monitor; at your door: right of her note; your phone: right of the phone (its corners through the desk's camera); loot: left of the bag; big attack: above the skill bar; your headset: right of his head. Lean in, taught on Tuesday (week one 2b), has three: Lean in rings the door in the webcam view (him turned toward it, the door shut), the callout right of it; You are leaning in rings the slit, the callout right of it; She is turning rings the eye and the red bar, the callout beside the slit (never over her) with its wedge and a gold line pointing at the bar |
| Tooltip, desk | Next to the pointer | Glass, 2 to 6 lines: the name and its key (Goblin Fuel, Drink (G)), what it does as + and - bullets, one count ("3 of 8 in the drawer."). The pointer on the desk and the PC is the Windows arrow |
| Tooltip, Windows 98 | Next to the pointer | Windows' own: a pale yellow box with a black line, black Tiny5 (Sleep: "Go to bed: ends the night. Greyed until 23:00.") |
| Tooltip, hers | Next to the pointer | Her PC-98 paper (beige, plum edge, the bevel, a void drop shadow): the name in plum, the line in brown (the plan's corner: "Who hears you, what the crack shows. Click it to open it.") |
| Pause | Centred card 232 × 92 | The whole frame black (so it can't be used to peek); "Paused" in tinyL, why it is black, Resume Esc (gold) and How to hide |
| Away from the PC | Right screen and the webcam view | The right screen dims (it is what she would see). Your gaming chair (below) stands pushed back in front of the desk, the same chair and shape as the webcam's, its back to you at 1.8 × the webcam's size (cx 236, top y 236): black in its own shadow, a grey rim on its arch and sides, the piping inset. In the webcam view the same chair stands empty, its front to the camera. A glass card over the monitor: "Away from the PC", "Charging your phone · 11 s", "The party is on autopilot.", a moss bar; "close: back early" under it |
| Microsleep | The whole frame | From Tired 50: the lids close from top and bottom over 1.6 s as an almond (its half-height 200 × (1 - lid) × (1 - u²)^0.8); the view greys toward them; under them the light is warm at the edge (wine, plum, deep plum, void, dithered) with the lashes as a dark line and ticks every 6 px. Shut: dark with one faint seam, "zzz..." in her pink tinyL, "click or press any key" in grey |

**His chair is a gaming chair in the reference photo's shape, black and grey, dark** (Paweł, 2026-11-20; no logos, no
green), one shape for both views (`her.js` CHAIR, in webcam px, centre x 74): **one tall back, no separate headrest**,
its top at y 188 (just under the light under the door) as a broad arch (3 px lower at the sides) with rounded corners;
sides that run down almost straight; bolsters whose inner edge, the piping, runs from near the top corners down and in;
outer piping down the lower sides; a smooth upper panel; a quilted lumbar (void dots in a diamond lattice) under a seam
that curves down to the sides; the seat and armrests below. **Colours:** black leather (s1) with void in its folds and
outline, grey piping (s2), only the top edge catching a little of the screen (s3 then s2). **As dark in the webcam
as on the desk** (Paweł): black with only a faint s1 dither in it, the piping and the lumbar's seam s1, the rim s3 along
the top and s2 down the sides; where the chair meets him, a 1 px s1 line keeps his head and shoulders readable (he is as
black as the chair).
- **In the webcam view** the camera is close and the back reclines, so its lower part is nearer and wider in the
  picture: half-width 23 at the top to 44 at the frame's bottom (23 + 21 (r/78)^2.2), running past the frame's bottom
  (the seat and armrests are below the picture). It replaces the old plain chair back in every state, **and he sits in
  it:** the arched top and the bolsters frame his head, and from his shoulders down the bolsters come forward round him
  and cover his shoulders' outer 4 px. The rest of the old back gives way to the wall (mirrored from the wall beside
  it); the headset glyph moves 5 px right. **Away** (Small pieces, Away), it stands empty.
- **On the desk** (away) the same chair, the same shape (narrow at the top, wider at the bottom), its back to you at
  1.8 × (cx 236, top y 236): black in its own shadow, a grey rim on its arch and sides, the piping inset; the seat and
  armrests are below the frame, as in the webcam.
- Rejected: a separate pillow headrest on a narrow neck with flared wings (not the reference's shape); a webcam chair
  narrower than him with the seat and armrests showing (he looked as if he stood in front of it); a bigger chair (28 to
  54 half-width) with grey-green piping and lighter greys (too big, too light, green read as moss); a desk-side back
  wider at the top than at the bottom (Paweł: the inverse, and both chairs the same).

**My calls (decided with Paweł's approval):**
- **The inspect window opens once,** the first time you have cans (the night the drink comes in, or your first pack
  from the Shop); after that the Drink button's tooltip says the same and G goes straight to the energy break. The
  handoff gives the window but not when it opens.
- **How to hide's third tile** follows the night: on Tuesday it says "Plates clinking: a snack run. Humming: she wants
  to talk." (the build's "hide your cans" and "a cuddle" wait for Thursday, when the cans and cuddles come in).
- **Away shows your empty chair on the desk side and in the webcam view,** not over everything (the build's placeholder).
  **In the build the chair is code** (decided 2026-11-20): `src/ui/him.ts` already draws him and a plain chair as
  vector shapes (the CHAIR polygon, cel-shaded through `pixel.ts`); the gaming chair replaces that polygon with this
  shape (front in the webcam, back on the desk), drawn before him and wrapping his shoulders; away, only the chair is
  drawn. No new baked images: it works in every state, and for Paweł's final art too.

## 7l. Lean in and her timers (fan-service steps 7 and 12)

**Approved 2026-11-24** (Paweł: "I love how it's designed now"). Live on the page's Lean in rows (She's, Her timer, Her, Hall mirror,
Lean, Slit; the mouse leans over the right screen, the wheel opens the door, the right button looks closer); stills and
the lean animated in row O of the canvas. Code: `lean.js` (the view, her stand-in), `her.js` (the webcam), `blueprint.js`
and `phone.js` (the plan and the Home app on the approved layout). Goes with fan-service steps 7 and 12.

**Taught on Tuesday,** the night it unlocks (Paweł, 2026-11-24): Magoo's voicemail, the Lean in tile in How to hide, a
scripted first chance (her yoga first thing), and three coach marks: the door, the first lean (the controls), her first
tell (let go). Spec: `claude/loot-night-week-one.md` section 2b; the page's Lean in row Tuesday. Monday has no lean.

**The plan, as Paweł approved it (2026-11-20).** Everything the lean can show is what the gap at your door's latch
(140, 88.4) can see: the eye only picks the direction. On the build's plan that was the kitchen (fine), the bathroom's
door edge-on (0.4°, about 5 px: no tub), a 1 m slice of the living room's west wall at 7.5 m (the couch never), and no
wall for a mirror that sees into the bathroom while its door is shut. The change (walls in plan units):
- **The bathroom moves to the room at the hallway's far end**, facing the crack: x 2 to 70, y 56 to 100 (new walls
  y 56 and y 100; the bedroom|living wall at y 96 goes). Its door at x 70, y 85 to 99 (14 u, 77 cm: the build's 9 u door
  was too narrow to see a tub through) is a **pocket door** sliding into the wall north of it: ajar for her music it
  leaves 11 u open from the north jamb, open otherwise. A swinging leaf hid either the tub or the mirror's view.
- **The bedroom** is the old bathroom (x 70 to 110, y 2 to 84, door x 80 to 98 on the hallway's right wall, swinging in)
  plus the far room's north part (x 2 to 70, y 2 to 56), open between them.
- **The living room's corner opens:** an arch from the far end along the left wall to x 96 (header at 40 u, 2.2 m),
  joined with the far-end opening (y 101 to 108; the stub at y 107 goes).
- **The hall mirror** on the left wall, x 98 to 121, 0.1 to 1.9 m high (1.3 m wide, full length).
- **Furniture:** the tub along the bathroom's south wall (x 14 to 46, rim 0.55 m), its foot end toward the door; the
  basin on its north wall, the shower in its north-east corner, the toilet on its west wall; the TV on the living room's
  west wall (y 129 to 150, 0.8 to 1.5 m), the couch facing it (x 24 to 38, y 130 to 156), her yoga mat north of the couch
  (x 17 to 27, y 104 to 128, across your line of sight); in the kitchen the counter on its west wall (y 48 to 83) with
  the kettle and the high shelf (1.7 m) with mugs, the fridge moved to its north wall; her dresser in the bedroom by the
  door (x 70 to 76, y 60 to 78).
- **Hearing follows the rooms** (Paweł, 2026-11-23): the build's `ROOM_DISTANCE` swaps the bathroom (now `far`, x0.5)
  and the bedroom (now `middle`, x1); the kitchen, the living room and the hallway stay `next`. Her bathroom sounds come
  quieter and duller, the bedroom's louder (the decisions log has the details).
- The plan on the wall (§7g), the Home app's tiles (§7j) and the build's `door.ts` corner (the crack's hallway: now the
  bathroom's door at the far end, the arch on the left) follow.

**The camera.** His eye 3 u (16 cm) behind the gap, at seated height (z 21 u = 1.15 m), aimed at the gap's middle;
focal 650 px, the centre at x 246, **the horizon low at y 226** of 360 (a level camera with its view shifted up, so the
kitchen's high shelf and the living room's floor both fit). Nothing is scaled: every picture is drawn at this camera's
size. The slit is 24 to 160 px: 2.1° to 13.9°, a gap of 0.6 to 4 cm.
- **The lean** moves the eye along y (x stays 143) and turns it to keep aiming at the gap, so the door stays put and the
  rooms beyond pan (the farther, the more). The mouse across the right screen maps to the eye through the stops with a
  soft detent at each: 1 at y 91.0 (u 0.1), 2 at 88.28 (0.38), 3 at 87.44 (0.64), the mirror at 86.8 (0.84), the
  lean's end at 85.9 (1). The whole lean moves his head about 28 cm. Each activity opens centred on her.
- **What each stop reaches** (from the gap, degrees from straight down the hallway; + is left): 1 the kitchen, −46 to
  −9 (its west wall, y 58 to 84); 2 the bathroom through its door, −3 to +6 (the tub's foot end, the far wall); 3 the
  living room, +10 to +24 (the TV, the couch, the mat); the mirror, +25 to +46: round the corner into the bathroom
  (its basin and shower) and, at the lean's end, the bedroom (her dresser).
- **Her size** (1.65 m = 30 u): standing on her mat 160 px (7 m), on the couch 170 (6.5 m), in the mirror 136, in the
  bathroom about 200 (she's lying or sitting), **in the kitchen about 550** (2 m: the slit shows her from the waist
  up). The plan puts the kitchen right by your door, so there she is bigger than the frame; nothing cheats the camera.

**The view** (492 × 360 at x 148; her panel stays live beside it).
- **The door,** in the desk's Graphite: the leaf left of the slit (s1 and s2, a faint panel line, the gap's light on it
  falling off), its edge 2 to 5 px lit greige (u4, u5; wider as you lean one way); the frame right of it (the jamb's
  inner face lit warm, u5 and u6, 12 px; the stop s3; the casing s2; your room's wall s1).
- **Through the slit:** her flat cast column by column (walls, door headers, the floor and ceiling, furniture as boxes,
  one bounce in the hall mirror) in her 16 PC-98 colours plus the desk's s1 to s3 and greiges u2 to u6 (§7b's bake),
  each material a ramp with an ordered 8 × 8 dither between its tones; lit by the hallway's ceiling light (warm) and each
  room's own (the living room's floor lamp and the TV, the bathroom's candles or its ceiling light, the kitchen's light
  under the shelf, her bedside lamp); floorboards, tiles, the skirting, off-white casings round the doorways, the
  hallway's runner, the living room's rug.
- **Her and the small things** (the snack bowl, the wine glass, the candles' flames, the kettle's light and steam) are
  drawn at the size this camera gives and hidden by whatever is nearer.
- **Focus** (hold the right button): a cut to a closer framing: the same eye, a lens 2.4 times longer (f 1560) aimed at
  her, the room and her drawn again (never a zoom), still cropped by the slit. The red bar fills x1.5 meanwhile.
- **The lean's stops** on the leaf, bottom left: 1 2 3 in her pink and a mirror mark on a void strip, a gold tick under
  where you are. **Show grid:** the horizon, the hallway's vanishing point, the 8-unit floor grid where the floor shows.
- **The wheel** opens or closes the door 8 px a notch; two notches within 0.3 s creak: a "creak" chip over the slit and
  Noise +8 in her panel.

**The red bar (she can see you)** sits over the slit at the top centre, where your eyes are while leaning: a 72 × 4 bar
on a void strip with an eye before it. Busy: the eye shut (a grey line). Her tell: the eye half open and blinking
crimson, the bar's track blinking, not filling. She sees you: the eye open, the bar filling crimson with a pale top row,
x1 at a 24 px slit to x2.5 at 160, x1.5 more while you focus (fan-service step 7).

**Her tell** (`SPOT_TELL_SEC`): she stops what she's doing and her head turns toward your door (her face starts to
show). **Spotted:** she looks straight at your door, a blush; her note says "Enjoying the view?" and her mood pill
"flustered" (Goodwill 40+; below it she teases, Mood +5).

**The webcam** (her panel): the door shut but a slit of warm hallway light at its latch side, 3 to 12 px as the lean's
slit; the leaf is the whole shut door from the bake (one inset panel across it, the handle), and as the slit opens the
whole leaf narrows toward the hinge, so its panel always spans it (2026-11-24: a plain strip over the gap cut the panel short); his gaming chair turned with him, its back to the camera (the same shape, plain black, a grey rim); him leaning
out past its right edge toward the crack, the back of his head and his near shoulder, the hallway's light along their
right edge. **From behind he is the same man as from the front** (redone 2026-11-24: he looked bald): a silhouette with
short dark hair (strands from the crown, the screen's cool sheen on its curve, three small tufts on top, a ragged
hairline at the nape), a hint of his right ear inside his head's outline with his glasses' arm running to it (an ear or a
lens edge drawn out past the outline read as something sticking out of his head), so his head stays one smooth shape
with the hallway's light along its right edge, the cyan sweat drop on his temple as on the front, the nape of his neck a step lighter than his hair, his tee's collar; head 31 × 38 px, centred at
110, 207 (he leans further out than the chair, so most of his head shows). Her panel's last-heard line says what you hear: MUSIC (living room), TV, MUSIC (bathroom), KETTLE, TAP,
SHOWER 20 s ago.

**Her timers, drawn in the scene** (never a number or a bar in the UI):

| She's | Where | Just started | Halfway | The last stretch |
|---|---|---|---|---|
| Doing yoga | Living room (3) | Standing, arms up; the video's line near its start | On the floor, sitting, reaching for her feet; the line halfway | Lying flat on her back across your view; the line nearly done |
| On the couch | Living room (3) | The back of her head over the couch's back, the bowl heaped on the armrest, a film on | The bowl half empty | The bowl crumbs; the credits rolling |
| In the bath | Bathroom (2), door ajar | Foam heaped over the rim, her leg up over the tub's side, her foot hanging out; the wine full, two tall candles | The foam down to the rim, the wine half, the candles burned down | The foam gone (water, a few patches), the glass empty, stubs: she's about to get out |
| In the kitchen | Kitchen (1) | Leaning on the counter, the kettle's light on, a wisp of steam | On tiptoe, reaching up to the high shelf for a mug (her tee rides up), the steam a plume | A mug in her hand, the steam billowing, the kettle's light off (the click) |
| Sheet mask | Bathroom (2), door open | Sitting on the tub's edge facing you, smoothing the white mask with both hands | The mask on, scrolling her phone in her lap | Peeling it off from the chin |

**Read at a glance?** All five read at a slit of 96 px or more, each by one big cue (her pose, the foam, the bowl, the
steam and her arm, the white mask). Weak spots: **the bath is small** (the scene is about 100 px wide in the bottom
third, 5 to 7 m away through a 60 cm gap): the foam level reads first, the wine and candles need the closer framing;
**the kitchen is too close to show her whole** (her back fills the slit; the arm up and the steam carry the stage); at a
24 px slit one cue shows at a time, by design (you lean to read).

**The hall mirror** (199 zł): clear, it shows the bathroom round the corner: her at the basin in her pyjamas with the
sheet mask, 136 px. Fogged by her steam (the bathroom door open after her shower): a pale wash (beige, moon, lilac in
an ordered dither, a few drips) with only her shape as a darker purple blur; it clears 20 s later.

**Her stand-in** (code, `lean.js`): a rig of capsules and ellipses in her look (long straight black hair with strands,
blunt bangs, the pink clip, green eyes, no glasses), cel-shaded from the upper left with a 1 px line; outfits: yoga (a
pink crop top, purple leggings), home (her cream tee and denim shorts), pyjamas (lilac cami and shorts), the bath (bare
shoulders, hair up; the foam and the tub's side do the work). Rule 0: clothed or covered, suggestive only. Paweł draws
the finals (the art list: the lean view's layers, one per activity and stage, a closer framing each).

**Cost:** the lean view 6 to 7 ms a frame at a 24 px slit, 12 to 15 at 96, 18 to 22 at 160 (cast again every frame);
the page runs about 36 ms a frame with it (23 without; the desk under it is still drawn). The build can cast the room
once per lean position and redraw only her and what moves (the TV, the steam, the flames): about 3 ms.

## 7m. Week one's pieces (the moments each night needs)

**Approved 2026-11-24** (Paweł). Live on the page's Week one rows; each is built from the nearest piece
already designed. Spec of the nights: `claude/loot-night-week-one.md`. Her art in them (poses, him turning) is Paweł's;
the webcam shows the nearest bake meanwhile.

**Danny's voice note (20:00, every night)** is the handoff's "Magoo's voicemail", made the way the phone is made
(everything on the phone happens inside it, §7f): a voice message from Danny (Magoo is his character) in **The Boys'
chat**. The phone rises into your hand while the night waits.
- The chat's header (The Boys (3), "Danny, Mike, Kuba"), the status bar at 20:00, a day line ("Today 20:00"; a replay:
  "Tuesday, again").
- The voice bubble (incoming grey, 98 × 25): "Danny" and the time played ("0:05 / 0:14", gold while it plays), a moon
  play disc (pause bars while playing), a 22-bar waveform that fills gold as it plays (a timer, so gold).
- The transcript under it in a darker block, a line appearing as he says it (at 0, 4.5 and 9.5 s), his chat voice
  (lowercase, casual). Monday: "yo its raid night. she thinks youre doing spreadsheets lol" / "steps in the hall = tab
  to excel. BEFORE the door opens" / "q4 pays real money btw. the shop's on your phone". Tuesday: "garrote's in the
  party tonight" / "hold your door open longer: you lean in and see what she's doing" / "she can see you too tho. don't
  get weird". A replay: "F. she pulled the plug" / "tuesday again then. the good loot's still in your bag" / "tab out
  BEFORE she opens the door this time".
- **Got it** (the gold pill) puts the phone down and starts the night (How to hide first on a night with new tiles);
  "the night starts" under it. It stays in The Boys' chat until the next minigame.

**The replay (unplugged):** the unplugged morning (§7h) with its summary saying what it cost: UNPLUGGED in crimson, "She
pulled the plug. No stars, and the cheaper half of your bag is gone.", the three stars missed, "Tonight is Tuesday
again. Party, gear, gold, Souls and city carry over.", and her pink button **"Tuesday, again"**. That night opens with
Danny's replay voice note.

**Her window** (her panel, PC-98): her moments use the chat's window (§7b: from y 270, growing to fit): a label at the
left (rose; asleep purple), the seconds or her hearts at the right, her line in plum, a bar (her time, 130 × 5), and
her answers as pink pills (a name and what it costs on a second line, 18 tall), the same pink as every answer to her.

| Moment | Window |
|---|---|
| Snack run, footsteps | The footsteps' amber note: "Plates clinking... a snack run." The YOU card's Drink button turns gold, its rim pulsing fast, and reads **Hide cans** (click or G); you keep playing |
| Snack run, at your door | SNACK RUN, the seconds; "Made you a plate. Eat something, babe."; Take the plate (party +20% HP) |
| Tease visit | A pink dotted line on top (where footsteps have amber); HER; three hearts for the 3 s of looking she wants; "babe? come here a sec..."; her 8 s in a pink bar. The last-heard line: "BABE?" |
| Looking at her | The pointer over the webcam view is an eye (11 × 6, moon with a purple iris, a void edge); the hearts fill; Goodwill rises on its bar; the skill bar is blocked as Hands busy, its plate reading **EYES BUSY** |
| She's happy | Three hearts; her line, She blows you a kiss. "Ok. Go play."; the mood pill flustered; +12 on the Goodwill bar (a plum tag at the fill's end) |
| Ignored | "Baaabe.": the pink line blinks fast, her bar restarts at 6 s in rose. Still ignored: she leaves, "Fine. Enjoy your elves.", the pill a bit annoyed |
| "Babe, towel!", "Babe, bring my wine?" | BABE, TOWEL! (or WINE?), the seconds; her line ("I forgot my towel. Bring me one?", "Bring my wine? It's on the counter."); one answer, Bring her a towel · 10 s away (Bring it to her · 12 s away) |
| Bringing it | The away card (§7k) with the reason: "Bringing her a towel · 8 s", its bar for 10 s; the empty chair |
| Asleep | ASLEEP in purple, "Keep the Noise down.", the waking meter in lilac with a mark at 60 ("texts you") and "gets up" at its end; the pill asleep; ZZZ in the last-heard line |
| Come to bed | The tease window, half asleep (the pill sleepy): "come to bed... it's late", the hearts, her bar, and **Coming, babe · ends the night**; looking shows x2 on the Goodwill bar |
| The lap sit | The chat window with ON YOUR LAP 1/3 and KEEP PLAYING (not KEEP EXCEL UP); her three questions. Ignored 10 s: "You stopped talking to me. My turn!", the skill bar's plate **SHE HAS THE MOUSE** |

**The lap sit over the battle:** the back of her head and her right shoulder cover the battle's left third and run off
the frame's bottom (her head 90 × 116 px, centred at 212, 152; her hair falls past her shoulders to the bottom), backlit
by the screen: void and plum hair with strands from the crown, then straight down, a lilac edge with purple inside it
where the screen's light comes round her; the pink flower clip on her right, by her temple; her cream tee's shoulder
in its own shadow (brown and plum), beige at its edge. Her line by her head in her window ("ooh, shiny" on a drop, "my
turn!"). You play around her; the side panel stays clear.

**Not drawn here (art):** her poses in the doorway (the tease, come to bed, the towel), him turning over his shoulder,
her on your lap in the webcam, "Night, babe." in your hoodie: Paweł's.

## 8. Palette (Moonwell 32) and meanings

Four world families, 8 levels each, sharing the darkest and lightest colour; plus loot gold, crimson, arcane.

- Void `#0a0814`, moon `#f2efdc` (shared ends).
- Stone `#1e1a3e #263160 #2d4e80 #39719d #5398b5 #81c1c8`: walls, steel, night.
- Moss `#092334 #113c44 #135a54 #3f7960 #749970 #aebb89`: damp, healing, party HP, buffs.
- Dusk `#241939 #452750 #6b3b62 #925673 #b87a83 #d9a69c`: cloth, banners, roofs, ink.
- Umber `#241c2e #452c3d #6a4240 #8a614d #aa8667 #c7b18c`: wood, skin, bone, bronze UI frames, leather, parchment.
- Loot `#852e30 #c16229 #f1a934 #fae299` (wine, copper, gold, pale gold), crimson `#d23c5a`, arcane `#8b5ad6`.

| Meaning | Colour |
|---|---|
| Money, prices, the next action, combo | gold `#f1a934` |
| Danger, enemy HP, debuffs, wind-ups, answer skills | crimson `#d23c5a` |
| Party HP, buffs, healing | moss `#749970` / `#aebb89` |
| Magic, the town portal | arcane `#8b5ad6` |
| Flow | yellow `#eadf3a` with a pale top row `#fbf5a8` (decided 2026-11-20): two UI-only slots after the 32 (32 and 33 in the RPG's set, kept out of the dither), flat in the bar, never in the world; on a step-up the text flashes moon white with a yellow outline for ~1 s |
| XP line | pale gold `#fae299` |
| Her | dusk pink `#d9a69c` / `#b87a83` |
| zł (real money) | moss `#135a54` on the taskbar |
| Tired | arcane `#8b5ad6` |
| Zone and the headset | pale cyan `#81c1c8` |
| Rarity | common bone `#aa8667`, uncommon moss `#749970`, rare stone `#5398b5`, epic arcane `#8b5ad6`, legendary copper `#c16229` |

Zone keeps the headset's cyan; Flow is yellow, kept apart from gold (money, the next action) by hue: gold leans
orange, Flow leans lemon. Other clashes as resolved here: gold is money only; legendary is copper, not the Flow orange; HP green and uncommon green stay in one family
on purpose (bars vs frames, never side by side). Garrote's class ember is the legendary copper: a class outline sits
only on portraits and keys, a rarity frame only on item cells, the same split as priest gold vs money gold. On the map, red ink and gilding are decoration plus "you are here".
Colours inside icons are picture colours; meanings live in frames, bars, tags.

## 9. Notes

- Auto-salvage toggle: in the BAG header, right side, a 31 × 8 switch ("AUTO" in moss / "off").
- **All character art is a placeholder** (Paweł, 2026-11-20): her (panel, caught portraits, mornings), him, the heroes, the
  enemies, portraits and skill icons. Paweł draws the final art; these specs give sizes, places, palettes and rules.
- Characters, enemies, the crypt and the town are code-drawn stand-ins for the hand-made sprites (#5); sizes,
  poses and what each building shows are the reference. The actor separation pass (section 3) applies to the final
  sprites unchanged, as long as they are tagged as actors.
- Town plot levels 2 and 3 (clock tower, observatory, stable, watchtower, gold dome…) are specified in the
  inventory but only Lv 0 and Lv 1 are drawn here.
