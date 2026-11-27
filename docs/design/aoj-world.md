# Loot Night: Age of Judgment, the RPG's world (art direction): the v2 redesign

**Approved by Paweł on 2026-11-27** ("We're going in this direction"; the launch, the logos and the whole roster approved the same day;
the same evening Halsky Labs' mark became his logo and the launch got its sound and music, §7 and §7b). This is the world the RPG on the monitor lives in.
**The v2 redesign** (Paweł, 2026-11-27): this world, its launch and everything they change is called the v2 redesign,
to keep it apart from the first redesign (the Game Frame, Issues V1 to V13). Its Issues are W1 to W6
(`claude/loot-night-aoj-issues.md`).
Every redesign of the RPG's sets, enemies, town, emblem, boot and title art, and any marketing art of the RPG, follows it.

- **Mockups:** the "Age of Judgment · world samples" page, https://claude.ai/artifact/UXCTfkY21mYjN6N9SKLcWe. It runs the
  Game Frame's own renderer, palette, heroes, desk, phone and HUD; Compare flips Ravenhold and the crypt back to the
  approved look. Its code is one file (the page); its new modules (`aoj.js`: the biomes, the first roster, the town
  pass, the boot and the launch; `foes.js`: the rest of the roster, the attacks' timing, the iron angel; `logos.js`)
  are in the v2 handoff package, `design/v2/`.
- **Precedence:** `claude/loot-night-decisions.md` wins; **this doc wins over the grid doc for what the RPG's world looks
  like** (sets, enemies, the town's dressing, the emblem, the title art). The grid doc still rules the grid, the
  palette, the renderer, the UI materials, the HUD and every size.
- **All of it is code-drawn stand-ins,** like the Game Frame: the look, the shapes and the light. Paweł's sprites
  (#5) draw from this brief.

## 1. The premise

When the sky passed judgment, iron angels came down burning and died where they fell. The world was rebuilt on their
bodies. **Ravenhold** stands in the ribcage of one; under its crypts, something grows in the angel's body. You go down.

- Every word stays medieval: saints, relics, iron, the Church. **The RPG plays it straight** (plain fantasy names of one
  or two words, no real-life jokes); the jokes stay in the real-life half and the boys' chat.
- **"Judgment" is also the weekly raid,** so the boys' "judgment day at 11?" means something in the world.
- The Church worships the fallen angels: its emblem is the broken halo, its saints are iron.

## 2. The rules that hold

- **Moonwell 32 only. No new colours.**
  - **Iron is the stone family:** dark (values about 0.1 to 0.4), riveted, a bright lip on the edges that face the
    upper left, rust in umber.
  - **The angels' eye-lights are crimson** (`#d23c5a`): enemies and danger, as before. The world's crimson is always
    the angels' (an eye, a heart-lens, a vent, a spark).
  - **Gilding on buildings, saints and relics is umber's highs** (`#c7b18c`), never the loot gold: gold still means
    loot and the next action.
  - **Each depth owns one family** (section 3), so the floors read apart at a glance.
- **The film nods: ideas, never designs. At most one nod per screen,** and every nod is earnest in the world (a
  stranger just sees a coherent world). Never a film's creature, mask, logo or prop: no long-headed alien, no masked
  hunter with dreadlocks, no chrome skull (the Hollow's frame is forged and riveted iron).

  | Where | The idea | From |
  |---|---|---|
  | Ravenhold, the title | Rain over a night city of lit windows | Blade Runner |
  | The premise, the Hollow | Machines that judged from the sky; an iron frame under the flesh, red eyes | Terminator 1 and 2 |
  | The Brood | A hive of resin and cocoons | Aliens |
  | The Brood's drones | Swarms of bugs on the deep floors | Starship Troopers |
  | The Hunter | The shimmer, the trophies | Predator |
  | The Confessor | The serpent cult | Conan |
  
- **The emblem: the broken halo.** A ring with a gap at the upper right (centred at minus 45 degrees, about a tenth of
  the ring) and a **crimson spark in the gap**. It is in the game's logo (section 6), the Hollows' shields and tabards, the Confessor's stole, the banners, the saint's head, the Cherubs, the
  fountain in Ravenhold, the login's spinner. Iron in the world, gilded where the Church made it holy.
- **A reskin is only a reskin:** every enemy keeps its stats, role and moves; the HUD, the casts, the marks and the
  bars don't change.
- **Draw order follows depth in every pose** (Paweł, 2026-11-27, after the same bug came back: the Gaoler's and the
  Inquisitor's arms went behind their heads). A character's parts are drawn back to front as they sit in depth, and the
  order is decided **for each pose and each frame**, never once for the idle: an arm raised past the head, a chain or
  weapon swung across the body comes after what it passes in front of; a blade carried back over the shoulders goes
  behind the head. Far limbs and what they hold first, then the body, then the near limbs; a part worn or held over
  another after it (the grid doc's rule, section 3). **Armour strapped to a limb moves with it:** a pauldron lifts and
  turns with the raised arm (about the neck side, so it never swings across the head), and the arm comes out of it.
  **Every new or changed character is checked in every pose** (rest, wind-up, strike, each frame of its loops) before
  it is shown or handed off.
- **Attacks move like the real thing** (Paweł, 2026-11-27). Every big attack has three phases: **anticipation** (the
  wind-up, slow and readable, under the cast bar), **the hit** (fast: a cut or a slam that accelerates into the impact,
  0.15 to 0.3 s, a smear marking its path) and **recovery** (the follow-through held a moment, then back to rest). A
  cut is swung from the shoulder with a straight arm (the arm may bend while lifting the weapon, never on the way
  down). Chained weights are whirled to build speed, then brought over and down in one arc; the chain is taut while it
  swings and slack after it lands.

## 3. Depth and family

The checkpoints (every 5 floors) end each depth. The boss table cycles as now.

| Floors | Where | Family | The set | Signature enemies | Its curio (sample) |
|---|---|---|---|---|---|
| 1–5 | **Shadow Crypt** | Stone | The approved crypt, with iron under the stone | Hollow, Penitent, Confessor | the Potion cart |
| 6–10 | **The Ossuary** | Umber | Walls of skulls and long bones, a jewelled saint, a chandelier of bones | Cherubs | a gilt reliquary |
| 11–15 | **The Iron Saint** | Stone darks, crimson | Inside the angel: hull plates, ribs, pipes, the great eye | Hollows as bare frames, the Hunter | (not drawn) |
| 16+ | **The Brood** | Moss and dusk | The crypt overgrown with resin, cocoons, cold glow | Drones | a cocoon with a hand pressed inside |

- **Shadow Crypt (1–5):** as approved (grid doc 5), plus three tells:
  - **the moonlit saint in the alcove is an iron angel** (redrawn with more detail, approved 2026-11-27): one of
    the fallen, set up by the Church as a saint. Folded wings of riveted iron feathers rising to points above its head
    (scalloped coverts above, long primaries below), the gilt broken halo with its spark, a serene iron face with one eye
    still an ember weeping a line of rust, a breastplate with the halo, its hands on the pommel of a great sword point
    down, a robe of deep iron folds with riveted bands, green patina low in the folds, the moon's cold rim down its right
    side, a carved plinth with its name worn away, the halo cut into it and wax run down its front;
  - **the banner carries the broken halo** (in umber) instead of the sun;
  - **colossal riveted ribs rise through the far hall,** seen through the arches.
- **The Ossuary (6–10):** walls of stacked skulls in rows between bands of long bones; pillars of stacked skulls under
  femur capitals; arches of femurs, radiating. In one bay **a jewelled catacomb saint** sits on his throne in gilt armour
  (umber highs) with gems (arcane and moss), a crown, candles at his feet. In another **a chandelier of bones** hangs from
  the vault, candles on its three tiers: the main light. Packed earth with bone shards for the floor. Warm and close
  (ambient about `[0.1, 0.07, 0.12]`).
- **The Iron Saint (11–15):** riveted hull plates (36 × 24 with rivet rows and seams) streaked with rust; colossal bowed
  ribs at the bay joints; **organ pipes** with crimson vents; **a gothic tracery plate** with crimson light behind it;
  **the great eye**, an iron socket of rings round a crimson lens, the room's light (a pulsing crimson light,
  `[1.7, 0.45, 0.55]`); **a tear in the hull** lets the moon in (a cold beam). An iron grating for the floor. Dark and
  cold (ambient about `[0.06, 0.055, 0.13]`). Battles here put the eye behind the mob.
- **The Brood (16+):** the crypt again, overgrown: **ribbed, glistening resin** over most of the carving (thickest at the
  vault and the floor, gaps where the skull niches and capitals show), **cocoons** hanging from the vault with a pilgrim's
  shape inside and a cold glow, strands and drips, **glowing nodules** (moss, emissive, each a small cold light), resin
  pools on the floor, a green mist. No candles. Ambient about `[0.075, 0.115, 0.13]`.

## 4. The roster

| Approved | Becomes | Look |
|---|---|---|
| Skeleton | **Hollow** | A dead knight in blackened, rusted armour: a great helm with a slit and two embers, a greatsword raised, a kite shield painted with the broken halo, a wine tabard. Where the armour breaks he is an **iron frame**: riveted rods, joint discs, a crimson heart-lens. Three states: armoured; torn open (the breastplate ripped, the heart-lens showing; or one arm bare to the frame); the bare frame (the Iron Saint's floors). |
| Zombie | **Penitent** | A gaunt flagellant, bare to the waist, lashes across his back, a dark robe below, a rope belt. **An iron cage over his head with a candle stub burning on top** (a small warm light each). A scourge thrown back over his shoulder, three cords with iron weights. |
| Necromancer | **Confessor** | A heretic priest of the serpent cult: a tall pointed hood, **an iron confessional grille for a face with crimson light behind it**, a gilt stole, a serpent crozier (a coiled snake for its crook, a crimson eye), a censer on its chain breathing violet smoke. A ring of crimson ink and candles on the floor. Its cast reads "Last Rites" on the page (the build's names stay until Paweł renames). |
| Imps | **Cherubs** | Baroque putti: a chubby pale body, iron wings, a blank porcelain face with an open mouth, a broken halo floating over the head with its spark. A swarm of four or five. |
| (new elite) | **Hunter** | Cloaked, it is **only a shimmer**: the set bends where it stands, its outline glints, its **trophies** (three skulls and a dented helm on a cord) swing in the air. On the page the cloak fails every 5 s for a moment: tall, gaunt, a smooth iron face with one slit, a hooked spear; arcane crackle over the outline. Its cast reads "Hunt · position 4". What it does in play is open. |
| (new) | **Drones** | Small segmented crawlers on the Brood's walls and vaults, dusk carapace, moss sheen, a pale glow at the head. |

**Rounds two to four (drawn and approved 2026-11-27):** every enemy the build shows gets the look (Paweł). Round three
answered his notes on round two (the arms behind the heads, the Gravedigger and the Abbot cartoonish, the moths like
butterflies, the Inquisitor not imposing), round four his notes on round three (the attacks' motion, the Gaoler's ball,
the Inquisitor's pauldron, the Abbot). On the samples page, The roster, round four.

| Build | Becomes | Look |
|---|---|---|
| Bat (floor 1) | **Ironwing** and **Vigil**, both (Paweł) | **Each bat that spawns is one or the other at random** (the build has one `bat`: keep its id and stats, roll the look and the name per enemy). **Ironwing:** a bat the Church's smiths rebuilt in angel iron when the crypt's bats died on the angel's light: an iron skull with blade ears and fangs, two embers, a cage of ribs round a crimson heart-lens, wings of iron finger-struts with black leather stretched between them, torn and patched, a toothed joint at each wrist, hooked talons; its joints spit sparks. **Vigil:** an old flying watcher of the Church: a riveted iron drum held up by a rotor of three iron feathers; its face is one window rimmed by the broken halo, a fallen angel's crimson eye in it (slit pupil, it follows you, an iron shutter blinks over it); two feather-fins; three hooked blades on chains under it; smoke and sparks from the hub. Either flies at head height; its crimson heart or eye throws a little light, so it reads in the back lane. |
| Brute (Shove, from floor 6) | **Gravedigger** (approved) | A hulking, hunched brute in a black oilskin coat and hood. Under the hood a riveted iron face-plate cut from a coffin lid, one slit, two embers, rust running from it. An iron collar with a padlocked chain, a heavy riveted plate on the near shoulder, iron bracers, three iron coffin lids hung from his belt as tassets, a pick slung across his back with a cage lantern on it (a warm light), heavy boots with iron toe caps. He leans on a great iron grave-spade with a ground edge; Shove drives it at you. |
| Ogre (boss, floor 5, Smash) | **The Gaoler** | The hood and muzzle, the keys, the manacle, a solid iron ball on a chain. **Smash, as a ball and chain is used:** he hauls the ball up off the floor and whirls it overhead on a taut chain, faster and faster (the cast; his elbows out, the fists over his hood, his arms in front of it); when the cast ends he brings it over his shoulder and down in one accelerating arc onto the floor in front of him, bending into it, a smear behind the ball (0.3 s); it lands with a flash and dust, the chain goes slack, he holds it a moment and drags it back (0.8 s). |
| Warlock (boss, floor 10, Summon / Empower) | **The Bellringer** | A stooped bell-priest under a wooden yoke with an iron bell over his head, eyes bound in white, a candle on each post; Summon: he hauls the rope, the bell tolls, the choir comes. |
| Black Knight (boss, floor 15, Execute, shield) | **The Inquisitor** | Angel-iron wings **spread and raised**, each a curtain of blade-feathers hanging from an iron bone with a gilt top, a hooked claw at its tip and a spur at the wrist; **massive black-iron pauldrons** with gilt rims, swept up to a point at the outer edge, three lames under each and high neck guards, so the angel-masked helm (a crown of spikes, ember eyes) sits sunk between them; the broken halo behind; a wide, planted stance; the tower shield with the halo on the far arm (gone once Bash breaks it). At rest the headsman's sword stands planted point-down under his fist. **Execute:** the wings flare and he raises the sword back over his head (the arm may bend; his near pauldron lifts with it), holds it, then **cuts: a straight arm swung from the shoulder, fast (0.15 s), the blade snapping through from over his back to forward and down**, a smear behind it; he holds the follow-through and brings the sword back to rest. |
| Troll (the curio and its fight) | **The Abbot** | A war-priest (Paweł: grim, after the far-future gothic priest-warriors; ideas, not their designs). The abbot who kept the tithe and armed himself to keep it: a deep cowl over a gaunt grey face, embers sunk in its sockets, the lower jaw an iron plate riveted on and slotted for his breath, an iron pipe from it into his collar; a high iron collar standing behind his head, gilt along its rim; domed pauldrons, a reliquary candle burning on the near one; a gothic breastplate with a gilt ridge, the halo boss and wax seals on cords; a wine tabard with the halo in the split of his black habit, plate on his legs; the tithe ledger, iron-bound, chained to his belt; a banner pole on his back, a wine banner with the gilt halo, a candle at each end of its bar; a great iron mace on a long haft, its head a broken halo ringed with flanges. Woken: he raises it two-handed over his shoulder and brings it down in one fast arc (the attack rule). Asleep (the curio): slumped against an iron-bound chest on the heap of gold (loot), his cowled head bowed, the ledger in his folded hands, the mace leaning on his shoulder, the banner planted in the heap behind him; his breath fogs and the coins hop when he snores, and now and then one eye opens. |

The loot goblin stays as it is (a critter you catch, not an enemy, and Goblin Fuel's mascot).

**In the build (W4):** Skeleton becomes the Hollow; the Guardian a Hollow with the halo shield (its name stays); the Orc
the **Revenant**, a Hollow torn open; the Ghoul the Penitent; the Shaman the Confessor; the Imps the Cherubs. The ids
stay. The Bat, the Brute, the bosses and the troll become the designs above (W4 has the mapping by id and the
attacks' timing).

## 4b. The curios (v2)

**Every curio is redesigned for the world, as detailed as the characters** (Paweł, 2026-11-27, part of the v2
redesign). Drawn in code the way the enemies are (`foes.js`), never as the build's Px stand-ins. Built in W5; the
build chat draws them from the briefs below and Paweł approves each from stills (before and after its choice). The
troll's is done: the Abbot asleep on the tithe (§4).

**For all of them:**
- **Lore:** iron for anything made (the Church builds with angel iron: riveted, rusted, the bright lip on edges facing
  the upper left); the broken halo wherever the Church made or blessed it; crimson only for the angels' light (an
  ember, a lens, a glow from inside); gilding in umber's highs; gold only where it is loot. The crypt's family (stone),
  with the curio's own accents.
- **Detail:** about a hero's height or taller (30 to 60 px), shaded shapes on the Moonwell ramps with the actor rim and
  outline, rivets, rust, wax, cloth folds; one idle animation (a flame, a sway, a drip, a rattle) and its own light
  (warm or cold); the light dims once the party has passed it.
- **States:** waiting; after each choice (opened, emptied, used, gone dark), with the choice's moment animated briefly
  where noted.
- **Names and lines stay as built** (they already fit), except the troll's (§4). The floor map's icons follow the new
  looks (W5).

| Curio (id) | v2 look | Idle, light | After the choice |
|---|---|---|---|
| **Locked chest** (`strongbox`) | A tithe chest of the Church, waist-high: dark wood under riveted angel-iron bands and corner plates, a domed lid, a heavy padlock cast as the broken halo (the key goes in its gap, its spark crimson), broken wax seals on cords across the lid's seam, a chain round it staked to the floor; coins wedged in a split in the lid. | It rattles now and then (hops 1 px, a coin glints); the halo lock's spark. | Pick: a pick in the halo lock, the tumblers click with pale sparks, the lid lifts. Smash: the bands spring, the lid splits, gold spills. Then open and empty. |
| **Sealed coffin** (`mailbox`) | A Hollow knight's iron coffin standing upright against the wall: an effigy cast in relief on the lid (a great helm, a sword on the chest), prayers cut round its rim (the "runes"), chains crossed over it with a padlock, wax run down from candle stubs on its shoulders. Something warm inside: a crimson glow leaks from the seams. | The glow breathes; the candles' small warm lights. | Open: the lid grinds aside on its chains; inside gold or a rare glinting, or for a curse crimson smoke pouring out. Then open and dark. |
| **Wayside Shrine** (`shrine`) | A fallen angel's iron feather, twice a man's height, driven point-down into the floor, its vane cut into a niche: in it a small stone altar with a green flame (moss: a blessing), a little iron bell on a bracket over it, the broken halo painted on the feather in umber, votive candle stubs and bronze offerings at its foot, rust running from the cuts. | The green flame flickers (a cold green light); the bell sways. | Pray: the bell swings and rings (rings go out, as the Bellringer's), the flame flares. Then the flame burns low. |
| **Pilgrim** (`pilgrim`) | An old pilgrim, stooped, in a deep hood and a patched travelling cloak, iron penance chains on his wrists, a tall staff topped with a small iron broken halo hung with tokens and a lantern, a bundle on his back, rag-wrapped feet; a gaunt face with pale eyes (human, not crimson). He holds out a scroll with a wax seal: the vow. | He sways on his staff; the lantern swings (a warm light). | Swear: he presses the seal to the scroll and bows, the lantern flares once. Then he walks on (gone). |
| **Supply Cart** (`supply`) | A Church supply cart: two iron-rimmed wheels, a waxed canvas half drawn back with the halo stencilled on it, sacks, a cheese wheel, loaves, a barrel with a tap, a lantern on a pole; nobody with it, its traces lying on the floor. | The lantern's warm light; a drip from the tap. | Eat: the loaves torn, the cheese cut, the tap left dripping. |
| **Blood Altar** (`altar`) | A slab cut from an iron angel's breastplate laid on a block of black stone: channels cut in its face running to a basin at its foot, a curved blade on it, black candles, old blood dark in the grooves. The stone is warm: the angel's light glows faintly in the channels. | A faint crimson glow in the channels, pulsing slowly. | Bleed: drops run along the channels into the basin and the glow brightens and keeps pulsing (the run's drain). |
| **Moonwell** (`moonwell`) | A fallen angel's great iron helm turned face up and sunk in the floor, filled with still silver water; the moon's cold beam falls into it through a crack overhead; a dipper chained to its rim, moss on the iron. | Slow ripples, the moon's reflection wobbling; the cold beam. | Drink: rings spread, the reflection breaks up and the beam dims a little (Flow drops). |
| **Ritual Circle** (`ritual`) | The serpent cult's circle (the Confessor's cult): a crimson-ink ring on the floor with a serpent biting its tail round it, black candles at its points, skulls, a censer on a stand breathing violet smoke, faint violet sigils rising (the chanting from nowhere). | The candles' warm lights; the smoke and sigils drift (arcane). | Join: the candles flare violet, the sigils rise thick and the ring glows (enemies +20% HP). |
| **The Abbot, asleep on the tithe** (`troll`) | Done (§4): `abbotAsleep`. | | Fight: he wakes and the fight starts (`abbot`). |
| **Guild bank vault** (`bank`) | A round vault door of riveted angel iron set in a broken stretch of wall, its wheel lock a broken halo, left ajar; inside, shelves with items glowing in their rarity light; a lectern beside it with the bank log, a great iron-bound ledger on a chain; an iron plaque for "officers only". | The items' rarity glows through the gap; the door creaks a little. | Take: one glow goes out; the door swings wider. Close: it shuts and the glows are gone. |
| **Potion cart** (`vending`) | The approved cart, in the world: iron fittings and rims, a rack of potions in their own colours, a mortar and hanging herbs, a lantern, the "PAY HERE" plank with the broken halo burnt into it, a coin box chained to the cart. | The potions' glints; the lantern. | Shake: the bottles clatter and one falls; the 50/50's outcome shows (a potion caught, or broken glass on the floor). |

## 5. Ravenhold

The approved 16-bit town (grid doc 6), plus:

- **It always rains:** slanted streaks over everything (about 340 at a time, 150 to 240 px a second, a slight slant),
  splashes on the ground.
- **Wet streets:** puddles on the streets, the plaza and the court (dark mirrors with a pale rim on their far edge);
  **every lantern and fire bowl throws a shimmering reflection** down the wet stones.
- **A colder night:** `TOWN_AMB` about `[0.56, 0.6, 0.84]` (was `[0.72, 0.72, 0.9]`).
- **The Dungeon Portal is the angel's chest:** two pairs of colossal iron ribs rise out of the court and arch in over
  the portal like a gothic arch; **a crimson heart-light** where they meet over the arch.
- **The fountain's statue is the broken halo,** iron, standing in the basin, its spark in the gap.

## 6. The title art and the logo

The scene behind the title, the login and the loading screens (and the title screen, which is designed last):

- Rain over Ravenhold at night; the moon behind low clouds.
- **The fallen angel behind the town:** seven ribs rise out of the hills and arch over the rooftops, its spine of
  vertebrae along the top, running out of the frame; two dim eye-lights on the ribs.
- Ravenhold's skyline in silhouette (roofs, spires, the cathedral), lit windows; a lone knight on a ledge in front.
- **Lightning** every 7.3 s shows the whole carcass for a moment.
- **The broken halo stands behind the cathedral spire** (gilded, its spark crimson) only where the logo isn't shown
  (the loading screen): the logo carries the emblem.

**The logo** (Paweł: full screen, crafted lettering like the big fantasy games, not text on a plaque; drawn
2026-11-27, approved the same day). Original: no other game's logo shapes (no shield crest, flaming letters or
winged plaque).

- **JUDGMENT** in carved gilt capitals, about 370 px wide on the 474 game screen: Cinzel Decorative Black (OFL), its
  swash **G and M** as the centrepiece and plain capitals round them, on a gentle arch (the middle 8 px higher).
  Rasterised crisp at its size (no anti-aliasing), then shaded by hand in umber's ramp up to moon: a chiselled bevel
  lit from the upper left, a metal gradient on the face (bright top, a dark horizon band just above the middle, a
  warmer lower half), a fine inline, a 1 px void outline and a 1 px iron rim, a drop shadow.
- **The broken halo behind it:** an iron ring (radius 86, 11 wide) with gilt lips, rivets every 24 degrees and engraved
  ticks, its ends broken ragged at the gap, the **crimson spark** in the gap (a four-point flare with a glow).
- **AGE OF** inside the ring's top, Cinzel Black spaced out, gilt, between two gilt rules; "The realm of Ravenhold"
  under the ring in Tiny5 on the splash.
- **At the top of the login and logging-in screens** the same logo at half size (AGE OF in Tiny5 there).
- All of it is palette-exact (umber, stone and crimson, ordered dither); glows go into the lit scene. In the build the
  logo can be baked images (one per size) or drawn the same way; Paweł's final art can replace it.

## 7. The launch on night one (approved 2026-11-27)

Not interactive: it sets the mood. 38 s on the monitor, live on the samples page (The launch: the whole on the desk with
the phone in hand, and each step on its own, with a timeline strip that also shows the sound cues and the music, §7b).

| s | On the monitor |
|---|---|
| 0 to 3.2 | **Windows 98:** the teal desktop, the Age of Judgment icon at the top of the column (above where the phone sits), the pointer double-clicks it, the hourglass, then the display mode switches: a line collapses to black. |
| 3.2 to 6.2 | **The engine boots:** black, the client's start-up lines a little at a time, each with its OK in moss (the version, Iron Engine 3, video, sound, input, ravenhold.pak, the patch server); a block caret. |
| 6.2 to 10.6 | **The publisher, Halsky Labs** (redrawn 2026-11-27, #133: Paweł asked for an 80s Japanese studio-gear flair, then the feel of the 16-bit cracktro and demo scene's logos, with more detail; original). Its mark is **Paweł's logo** (a stippled face on a white sticker, his PNG, `design/v2/assets/`) as a two-tone pixel mark, void and moon only, 75 x 88 (`HALSKY_MARK`, made by `halsky_mark.py`), given a dark extrusion like the word's and sparkles on its rim. Beside it **HALSKY** in a wide, heavy face (Syncopate Bold) in banded chrome (hard steps on the stone ramp) with a deep violet extrusion and twinkling sparkles; a red three-row copper rule under it ending in a crimson **LABS** badge with screws in its corners, like a rack unit's model badge; **PRESENTS** (Tiny5 doubled, spaced, a chrome gradient through it) centred under the whole lockup between two rules as wide as it. A slow parallax starfield behind. In: the stars; a red power-on line sweeps across (0.2 s); the mark rasters in top to bottom behind a bright scanline (0.45 s); HALSKY flies in from the right on speed lines and locks (1.42 s, 7.62) with a flash, a lens streak and a burst of sparkles, its extrusion and the sticker's pushing out; the badge lights like a panel LED, two flickers then on (1.6 s); PRESENTS opens from the middle (2.0 s); a glint runs across the chrome (2.7 s). Then it holds, the face's grain alive, the sparkles twinkling; **no animation out:** the next screen fades in over it (dithered, 0.5 s). |
| 10.6 to 15 | **The developer, Procrastination Studios** (redrawn 2026-11-27, #133: Paweł asked for it changed completely, after the cracktros and demos the pirate scene put before the games; the name and the tagline kept). It fades in over the held Halsky Labs. A parallax starfield; a big chrome **PROCRASTINATION** in a spiky display face (New Rocker, stretched tall) in banded chrome (moon and teal on top, mauve and peach below) with a deep violet extrusion, sparkles and a rippling mirror reflection; **STUDIOS** tagged at its right under the reflection like an artist's signature; **"est. eventually"** in uncial lettering (Uncial Antiqua) with a gradient through it, in a dark band between two rules; at the bottom two copper bars swing and a sine scroller rides over them ("YO! THIS INTRO WAS DUE IN MARCH. GREETINGS TO DUTCH, HIXX, HUDZOR AND ARKBISHOP. SEE YOU EVENTUALLY..."). In: the logo drops in from above (0.15 s), bounces twice wobbling row by row, and lands in a burst of sparkles (0.55 s); its reflection (0.8 s); the band opens (1.0 s); the copper bars swing in (1.1 s) and the scroller starts (1.2 s); STUDIOS (1.35 s). Then it holds until the title fades in over it (dithered, 0.5 s). |
| 15 to 23 | **The title:** black and rain; lightning shows the angel; the scene comes up out of the dark. The logo (section 6): the halo forged round from its gap, the spark ignites, JUDGMENT struck out from the centre, white-hot and cooling, a second bolt and a shake as it lands, AGE OF, a glint across the gilt, "The realm of Ravenhold"; rain in front of it. |
| 23 to 31 | **The login screen:** the logo shrinks to the top as the scene dims, and the iron panel slides up: Account and Password wells, Remember ticked, Log in in gold. The pointer types "dutch" and nine stars, presses Log in (copper, down a pixel), turns to the hourglass. Options, Credits, Quit; the version and the realm in the corners. |
| 31 to 38 | **Logging in:** the logo stays at the top; the panel becomes a status line with the halo turning: Connecting to Ravenhold, Authenticating, Account verified (moss). Then the world loads: "Ravenhold" in blackletter, "Entering the world", a tip, the bar and what it loads (the town, your party, the night). A dithered fade to black. |
| 38 | **Ravenhold** fades in (dithered), the town panel beside it; the feed gets "Welcome to Age of Judgment. Have fun, don't get caught." |

- **The boys' first chat is paced to it** (`FIRST_CHAT`): the phone rises into your hand at 20:00 and the bubbles come
  one at a time after their typing dots (1.6 s), arriving at **2.6, 5.0, 8.4, 10.2, 12.8, 21.4, 26.4, 30.6 and 35.4 s**
  (nine since #133: Paweł asked for more to read while it boots, four mood lines; none from 15 to 21 s so the title's
  sounds stand alone, §7b); the last lands as the world finishes loading. Until then the pill reads **"Age of Judgment is loading"**
  with the percentage (dim); **at 38 s it turns gold, "Let's go"**, the night starts as now. This replaces Monday's
  `CHAT_FIRST_SEC` / `CHAT_TYPE_*` pacing (about 6 s for six).
- All fades are palette-exact (a Bayer-dithered fade to and from the void colour), never a blend.
- **The studios are Halsky Labs (publisher) and Procrastination Studios (developer)** (Paweł). Both get a trademark
  check before the Steam page. The engine's start-up lines name Procrastination Studios. **Halsky Labs' mark is Paweł's
  logo** (2026-11-27; it replaced the H in a hexagon).
- **When it plays (W1):** **the whole launch on the first Monday only,** with the boys' first chat. **Every night after
  it starts from the login screen** (Paweł, 2026-11-27: from Tuesday on; my call: replays too, "Monday, again"
  included, and week two's nights): the last 15 s of the launch, T 23 to 38, opening with a 0.6 s dithered fade in
  from black: the logo shrinking to the top, the panel sliding up, "dutch" and the stars typed, Log in, logging in, the
  world loading, then Ravenhold. Its sound is the cue sheet from T 23 (§7b). That night's 20:00 chat is paced to it:
  its bubbles spread evenly from 25.4 to 35.4 s (three bubbles: 25.4, 30.4 and 35.4 s), each after its 1.6 s of typing
  dots; the pill reads "Age of Judgment is loading" until 38 s, then Let's go.

## 7b. The launch's sound and music (Paweł, 2026-11-27)

**The launch has sound and music** (Paweł): the boot and the logos have sound, the title's heavy above all (the halo
appearing, the thunder strikes, the words appearing), and music plays from the boot until Ravenhold comes in. The music
is in the vein of the King's Field games' music, at PlayStation 1 fidelity.

**The cue sheet** is data in `aoj.js` (`LAUNCH_SOUND`, `LAUNCH_LOOPS`, `LAUNCH_MUSIC`), each time taken from the
launch's code. The samples page draws it under the launch: a tick per cue (hover one for what it is; red for the heavy
ones, grey-blue for the real PC), the music's parts and the rain. In short:

| s | Sound |
|---|---|
| 0 to 3.2 | **The real PC, clean:** the double-click (1.25, 1.45), the display mode switching (2.85: a relay clunk, the whine cut off). No hard-drive chatter under the hourglass (Paweł, 2026-11-27: it read as a repeated clacking). |
| 3.2 to 6.2 | The CD drive spinning up (quiet); a soft tick per start-up line. |
| 6.2 to 10.6 | **Halsky Labs** (#133), an 80s studio-gear sting through the 16-bit home computer's sound (8-bit samples at a low rate, no interpolation): an analog synth sweeping up through its filter for the red line (6.4); a soft digital data chirp as the mark rasters in (6.65); a whoosh rising into the lock (7.2); **the lock** (7.62): a sampler's orchestra stab with a gated reverb snare, then an FM bell chord ringing on (the sting's one big beat); three digital blips as the badge flickers on (7.8); a soft two-note FM chime for PRESENTS (8.2); a thin shimmer with the glint (8.9). **The music starts** (6.2). |
| 10.6 to 15 | **Procrastination Studios** (#133), a cracktro's: a falling whistle as the logo drops in (10.75); it lands on the first kick of **a 4-channel tracker jingle** (11.15, `ps_mod`): 125 BPM, a row 0.12 s, arpeggio chords on one channel a note per tick (D minor, B flat, C, A), a filtered saw bass in eighths, the drums, a pulse lead with a little vibrato, ending on a D minor chord on row 28 that rings out by 15 s, through the same 8-bit chain. Original. |
| 15 to 23 | **The title, the heavy part.** The rain comes in. **The first bolt** (15.9): a crack on the flash, a roll for three seconds. **The halo** (17.2 to 18.2): iron dragged round under strain, rising, a forge's hiss; as it closes, a deep ring like a cracked bell. **The spark** (18.15): an electric crackle, a thin high crimson tone. **JUDGMENT** (18.4 to 19.15): a furnace roar widening out from the centre with the word, a reversed cymbal rising into **the strike** (19.15): the second bolt's crack, a huge low iron impact, a sub drop under it. It is the loudest moment of the launch, and the theme's first chord lands on it. Hot iron hissing as the word cools. **AGE OF** (19.55 to 20.25): a low gong for the letters, two metal slides as its rules run out, a bright tink at each end. A quiet shimmer with each glint (20.3, 22.0). |
| 23 to 31 | The iron panel sliding up; the clicks, and a clacky mechanical keyboard (`kb_clack`, Paweł 2026-11-27) for "dutch" and nine stars; **Log in** (28.0): a heavy iron button, a low bell tap. Far thunder after the scene's lightning (28.3). |
| 31 to 38 | **Account verified** (32.7): a solemn two-note bell. Far thunder (35.8). The rain fades with the fade to black (37.2 to 38). |
| 38 | The theme's last chord rings out as Ravenhold fades in; from there the game sounds as now. |

**The music** (`aoj_theme`): one file, through-composed to the launch from 6.2 s to about 39.6 s. No loop: the launch is
a fixed 38 s.

- **The vein:** the King's Field games' music on the PlayStation (FromSoftware, 1994 to 1996). Slow, sparse, ominous
  and melancholic; sequenced, sampled orchestra and organ, a long reverb; a lonely melody over held chords; minor and
  modal (the Phrygian half step). Original: never a melody or a phrase from those games or any other, only their way
  of sounding. Their name never appears in the game.
- **Its parts** (they meet the beats):
  1. **The deep** (6.2 to 15), under the logos and about 14 dB under the theme: a low organ pedal on D and a male
     choir's "oo" on an open fifth, swelling slowly; from 10.6 a slow low-strings figure, D to E flat and back, every
     4 s. It thins out with the dithered fade (14.45).
  2. **Rain** (15 to 16.4): no music, the rain and the first bolt alone.
  3. **The rise** (16.4 to 19.15): the choir's "ah" comes in low on D; a timpani roll from 17.2 grows with the halo;
     string tremolo climbs D, E flat, F, G to A by 19; a reversed cymbal from 18.4 into the strike. A crescendo.
  4. **The theme** (19.15 to 37.15): 60 bpm, a bar is 4 s (bars at 19.15, 23.15, 27.15, 31.15, 35.15). On the strike
     the full chord: organ, low brass, choir, a timpani hit. A chord a bar: D minor, B flat, E flat (the Phrygian flat
     second), A (with C sharp), then D. A lone melody on a solo voice or a flute, something like: A4 and C5 on beats
     3 and 4 of bar 1 (once the strike has settled) | D5 (two beats), C5, B flat 4 | G4 (two), B flat 4, A4 | G4, F4,
     E4 (two) | D4, held into the last chord. Under it organ and low strings held; a deep bell tolling each bar from
     bar 2; from the login (bar 2) a quiet harp or harpsichord in eighths on the chord's notes, under the typing,
     dropping out at bar 4 (logging in).
  5. **The last chord** (37.15, as the screen goes black): D open (D, A, D, no third) on organ, choir and the bell,
     swelling for a moment and dying into the reverb; silent by about 39.6, once Ravenhold has faded in (38 to 38.9).
- The notes can change; the parts, their times, the downbeat on the strike and the last chord on the fade stay.

**PlayStation 1 fidelity,** so it sounds like the console and not a modern orchestra. Baked offline like every sound in
the build (`tools/sfx/`, seeded; `python3 tools/sfx/make.py aoj_theme`), through a chain that does what the console's
sound chip did:

- **Instruments are samples:** each made once (synthesised, or from a CC0 recording) as a short mono sample at 22,050
  Hz with a loop for its sustain. A note is that sample played faster or slower (one sample per octave or two, so the
  timbre moves with the pitch as on the console), with a soft interpolation that dulls the top end.
- **The console's grain:** every sample goes through a 4-bit ADPCM round trip (the console's format: blocks of 28
  samples, five prediction filters). The chip played nothing but ADPCM samples, 24 voices at most from 512 KB: never
  more than 24 notes at once.
- **The console's kind of reverb:** a long dark hall (2.5 to 4 s), a comb and all-pass network run at 22,050 Hz, about
  a third wet. It carries the mood.
- An envelope per note (attack, decay, sustain, release), a little panning per instrument, no modern mastering (a peak
  ceiling at -1 dB, the quiet left quiet).
- **The instruments:** a church organ (soft stops, a 16-foot pedal), a male choir ("oo", "ah": `dsp.voice` with the
  vowels' formants), low strings (an ensemble, a slow attack), a solo voice or a flute (a little vibrato), a harp or a
  harpsichord, timpani, a deep bell (inharmonic partials), low brass for the strike, a reversed cymbal.
- **The game's own sounds go through the same chain** (every cue from the engine on: the stings, the title, the
  login's UI), so they sit with the music. **The real PC's stay clean** (the mouse, the drive, the display, the CD
  drive, the keys), like the desk's sounds.
- **The heavy ones are built in layers:** thunder from noise (a crack of filtered bursts, then a long low-passed roll);
  the strike from that crack, the repo's heavy punch and metal impacts pitched down, a sine falling from 60 to 30 Hz
  and the bell; the halo from noise through resonant filters swept upward (the grind) over a low metal drone, ending
  in the bell. Kenney's heavier CC0 impacts only if the build can fetch them.

**In the build:**

- **Files:** the theme in stereo (32 kHz, 64 kbps, about 300 KB), the rest mono as the other cues; every one-shot
  loudness-matched like the rest, so the mix lives in `MIX` (`src/data/sounds.ts`): the strike loudest, the theme
  under the title's sounds, the Procrastination cues light. About 0.6 MB more in the build's file.
- **Bus:** the game bus (the headset doesn't muffle them, as the RPG's sounds now). The launch makes no Noise: the
  night hasn't started.
- **Sync, one clock (the launch's T):** each cue fires once when T passes its time; a jump (the F1 skip) never fires
  the cues it jumps over. The theme starts at T 6.2 at offset T - 6.2; each frame, if it is more than 0.1 s from where
  T says, it restarts at the right offset (after a pause, a hitch, a hidden tab). Pause stops all of it and unpause
  resumes it where T is; "Skip the launch" stops it all.
- **From the login (every night after the first, §7):** T starts at 23, so only the cues from 23 on fire; the rain
  fades in from 23; the theme plays from its offset at T 23 (16.8 s in, just before bar 2) with a 1.5 s fade in, and
  ends on its last chord as on the first Monday.
- **Replaceable like every cue:** a file in `src/assets/sfx/own/` named after a cue replaces it. For `aoj_theme` it
  starts at T 6.2 and keeps the times above (silence at 15, the downbeat at 19.15, the last chord at 37.15), so Paweł
  can score it himself.
- **The RPG's own sounds in play stay chiptune** (the build's decision at 0.33): the launch is the exception, the
  game's own cinematic. Open, Paweł's call: whether the play sounds follow the launch later.

## 8. When it gets built

- **Built now: the v2 redesign** (Paweł, 2026-11-27: the first two stages done now, not after the outside playtests): the design (this
  brief, the samples page), then **the world pass for what week one shows and the launch**: Ravenhold in rain with the
  ribs and the halo, the crypt's tells, every enemy and every curio in the new look, the emblem in the UI, the launch with its logos, its sound and its music. A reskin:
  a readability check only, no balance pass. Issues W1 to W6 (`claude/loot-night-aoj-issues.md`), package
  `design/v2/`. The trade-off he took: playtests run on the new look, so a reaction can't be split between the loop and
  the look.
- **Before the Steam store page** (#60): the screenshots and the trailer come from this look.
- **Before the final sprites** (#5): Paweł's art draws from this brief.
- **Later, with the synergy arc set (#14) or week two:** the deeper biomes (Ossuary, Iron Saint, Brood), the Hunter,
  relic legendaries, and the deeper depths' own bosses (the Bat, the Brute, the bosses and the troll are drawn in rounds two
  and three). Run the campaign sim
  first: build a depth only if players reach it in week one.

## 9. Open

- The Hunter's mechanic (the page only shows its look); the deeper depths' bosses and their curios' bargains.
- Whether the RPG's own sounds in play follow the launch's PlayStation 1 sound (§7b), or stay chiptune (now).
- The angel's eye opening a little more each night as a tell for the twist (`claude/loot-night-the-other-her.md`): an
  idea, not decided.
