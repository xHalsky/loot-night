# Loot Night: the v2 redesign (Age of Judgment), the Issues for the build (W1 to W6)

**The v2 redesign** (Paweł, 2026-11-27) is the RPG's new world, Age of Judgment, and its launch: this doc and the spec
`claude/loot-night-aoj-world.md`. It is called v2 to keep it apart from the first redesign (the Game Frame, Issues V1
to V13), which stands.

**Approved by Paweł on 2026-11-27, to be built now** (his call: before the outside playtests, not after), the whole
roster included (the last round approved the same day). For the build chat to file as written on xHalsky/loot-night
and build in order. The spec is `claude/loot-night-aoj-world.md` (commit a copy as `docs/design/aoj-world.md`); the
handoff package is `loot-night-v2-handoff-2026-11-27b.zip`, for the repo at `design/v2/` (its README says which sample
functions to port and which are for later). Precedence: `claude/loot-night-decisions.md` > the spec > the grid doc.

This is the build of the first two stages of the world's plan (aoj-world §8): what week one shows (Ravenhold, the
Shadow Crypt, every enemy and curio it can show, the emblem) and the launch on night one. **Not in it:** the Ossuary,
the Iron Saint, the Brood, the Hunter and the drones (later, once week one's players reach those floors). The loot
goblin keeps its look (a critter you catch, Goblin Fuel's mascot).

**Rules for all six:**
- **Visual and text only.** Stats, roles, moves, timings, drops and balance don't change. `test/` and the bot sims give
  the same numbers before and after; run them on every Issue.
- **The engine is the page's** (`src/render/page/`): port the sample code into it (`aoj.js`, `foes.js`, `logos.js`
  after `live.js` in `ORDER`) and call it from the build's views. Moonwell 32 only, palette-exact; no new colours. Iron
  is the stone family, the angels' eye-lights are crimson, gilding is umber's highs, gold means loot (the
  Procrastination Studios tile is a studio's colours on the boot, outside the RPG).
- **Draw order follows depth in every pose** (aoj-world §2): back to front as the parts sit in depth, decided per pose
  and per frame; armour strapped to a limb moves with it. **Every character and curio is checked in every pose and
  frame** (rest, wind-up, strike, recovery, its loops) before its Issue closes.
- **Attacks move like the real thing** (aoj-world §2): a big attack's wind-up is its cast (slow and readable), the hit
  plays when the cast resolves (fast, accelerating into the impact, a smear on its path), then recovery. A cut is a
  straight arm; a chained weight is whirled, then brought over and down.
- **Player text:** plain and short, no em dashes; never a film, a film character or a real game by name.
- **The stills in `design/v2/stills/` are the reference;** the build matches them with its own live HUD and data.
- One version and a CHANGELOG line per Issue. Where something in the build has moved since the page (coordinates, the
  town's map, the crypt's layers), fit the sample to the build and say what you changed.

---

## W1. The launch on night one: Windows, the engine, two studio logos, the title, the login, the world loading, with its sound and music

**What.** Before the first night, the PC launches Age of Judgment on the monitor while the boys' first chat comes in on
the phone in your hand. 38 s, not interactive, there to set the mood. Spec: aoj-world §6 (the title art and the logo),
§7 (the beats, second by second) and §7b (the sound and the music). Package: `logos.js` (with `HALSKY_MARK`), the launch
section of `aoj.js` (with the cue sheet `LAUNCH_SOUND`, `LAUNCH_LOOPS`, `LAUNCH_MUSIC`), `PHONE_SCREENS.firstchat` in
`phone.js`, `assets/halsky-labs-logo-source.png` and `tools/halsky_mark.py`; stills `launch-*` and `desk-launch-*`.

**When it plays.** The first Monday only: the night whose 20:00 chat is `FIRST_CHAT` (`systems/week.ts voiceNote()`,
day 0 of week 1). Not on Monday's replay ("Monday, again") or later nights; those stay as now. (Open, Paweł's call: the
launch on later nights, whole or from the login, about 15 s.)

**Build.**
- **One clock** for the launch and the chat: T starts when the boys' chat comes up (`phoneView`'s `voiceAt`); pause
  stops it.
- **The monitor.** While T < 38 (`LAUNCH_END`), the game screen (474 x 232) shows `launchScreen(T)` in place of the live
  RPG; the desk, the taskbar and the phone stay as now. At 38 the live town fades in from black, dithered
  (`ditherBlack`, 0.9 s), and the feed's welcome line ("Welcome to Age of Judgment. Have fun, don't get caught.")
  arrives then, not before.
- **The phone.** Monday's five bubbles (since 0.91.2) arrive at **2.6, 10.2, 21.4, 26.4 and 35.4 s** (Lance's at 21.4, clear of the
  title's sounds), each after 1.6 s of
  typing dots (new tuning: `CHAT_LAUNCH_AT`, `CHAT_LAUNCH_TYPING`; `CHAT_FIRST_SEC` and the `CHAT_TYPE_*` pacing stay for the
  other chats). Until 38 s the pill at the bottom reads **"Age of Judgment is loading"** with the percentage, dim and
  not a button; at 38 s it turns into the gold **Let's go** with "the night starts", as now. **Let's go, Esc, Enter and
  the home bar do nothing before 38 s.**
- **The beats** (aoj-world §7): the Windows 98 desktop, the Age of Judgment icon at the top of the icon column (the
  phone in your hand covers the lower left), double-clicked, the hourglass, the display mode switching; the engine's
  start-up lines (`ENGINE_LINES`, "Iron Engine 3 · Procrastination Studios"); **Halsky Labs** (publisher; its mark is
  Paweł's logo, `HALSKY_MARK`, 75 x 88 in void and moon, drawn by `halskyLabs`); **Procrastination Studios** (developer); the title with the full-screen logo; the login (the logo shrinks to the top, the panel slides
  up, "dutch" and nine stars typed, Log in pressed); logging in and the world loading with the tip.
- **The emblem in the UI:** the desktop's Age of Judgment icon is the broken halo (the 18 x 18 `aoj` icon in
  `launchDesktop`), on the launch and on the desktop at any other time (`ui/monitor.ts`); the taskbar's Age of Judgment
  tab gets the same at 8 x 8 (an umber ring, its gap at the upper right, a crimson pixel in it). The login's turning
  halo is in `loginPanel`.
- **Fonts:** Cinzel Decorative Black, Cinzel Black, Sora ExtraBold and Fredoka Bold (`design/v2/fonts/`, SIL OFL 1.1)
  into `src/assets/fonts/`, their licence files with them, loaded with the others before the first frame.
- **The Halsky Labs mark** is a bitmap of palette indices (`HALSKY_MARK`, one string per row): the only bitmap in the
  launch. `tools/halsky_mark.py` makes it from Paweł's PNG (`assets/halsky-labs-logo-source.png`; numpy, scipy,
  Pillow); commit both, so a new version of his logo is one command.
- **Sound and music** (aoj-world §7b; Paweł): the cue sheet is `LAUNCH_SOUND` (about 60 cues by T), `LAUNCH_LOOPS` (the
  rain) and `LAUNCH_MUSIC` (the theme, 6.2 s to the town). New cues baked in `tools/sfx/` like the rest, seeded, into
  `src/assets/sfx/`, with their levels in `MIX`: the real PC's clean (`mouse`, `hdd`, `crt`, `cdspin`; the keys are
  the desk's `key`), the game's through the console chain of §7b (22,050 Hz samples, the 4-bit ADPCM round trip, the
  console's kind of reverb, 24 voices at most): `bootline`, `hl_*`, `ps_*`, `thunder_near`, `thunder_far`, `rain`
  (a seamless loop), `aoj_ring`, `aoj_spark`, `aoj_word`, `aoj_strike`, `aoj_quench`, `aoj_ageof`, `aoj_glint`,
  `ui_panel`, `ui_login`, `ui_verified`, and the theme `aoj_theme` (stereo). All on the game bus; the launch makes no
  Noise. One clock: each cue fires once as T passes it, never for a jump past it; the theme plays at offset T - 6.2
  and re-syncs when it drifts more than 0.1 s; pause stops everything and unpause resumes it; the skip stops it all.
  A file in `src/assets/sfx/own/` replaces any of them, the theme included (§7b says what a replacement must keep).
- **For testing:** F1's debug panel gets "Skip the launch" (to T = 38; it stops the launch's sound); the bot sims and
  `test/` skip it. The F1 sound board lists the new cues.

**Done when.**
- On a fresh save the first Monday plays the 38 s launch beat for beat like the stills, then Let's go; nothing before
  38 s starts the night; the night's clock doesn't run during it (it already waits while the chat is up).
- Monday's replay and every later night are unchanged.
- The desk holds the build's frame rate during the title and the login (F1).
- The sound plays to the cue sheet: the strike on the second bolt's frame (19.15 s), the theme's first chord with it,
  its last chord on the fade to black; nothing plays after a skip, and pause holds it all. `test/sound.py` decodes every
  new file and checks the rain's loop; a test fires the launch at speed and checks each cue fires once, in order, and
  none after a skip.
- **Paweł approves the sound by ear before W1 closes:** post the launch's whole audio as one MP3 (every cue and the
  theme on the timeline, 0 to 40 s, as it plays) and the theme alone. The look of the launch doesn't wait for it.

---

## W2. Ravenhold in rain

**What.** Spec aoj-world §5. Package: `STREETS`, `ravenholdIron(L)`, `townRain(F, t, lights)`, the town's ambient;
stills `world-ravenhold-rain` (and `world-ravenhold-approved-before` to compare).

**Build.**
- **In the town layer, once, when it is built:** puddles on the streets, the plaza and the court (dark mirrors with a
  pale rim on their far edge); **two pairs of iron ribs** rising out of the court and arching in over the Dungeon
  Portal, with a dim eye-light where they meet; the fountain's statue is **the broken halo** in iron with its crimson
  spark.
- **Every frame, after the town's life:** each lantern and fire bowl throws a shimmering reflection down the wet
  stones; the crimson heart-light pulses where the ribs meet; **rain** over everything (about 340 slanted streaks, 150
  to 240 px a second) and splashes on the ground.
- **A colder night:** `TOWN_AMB` `[0.56, 0.6, 0.84]` (was `[0.72, 0.72, 0.9]`).
- The sample's coordinates are the page's town (`TW`, `LANTERNS`, the portal at x 167, the fire bowls at 121 and 212,
  `TW.fountain`); fit them to the build's town if it has moved.

**Done when.**
- The town matches the still; the rain falls over the town but never over its UI (signs, the hovered building's
  outline, the service highlight, the side panel), and every building still reads and clicks as before.

---

## W3. The Shadow Crypt's tells

**What.** Spec aoj-world §3, Shadow Crypt. Package: `ironRibV`, `cryptTells()` (`aoj.js`) and `ironAngelStatue(cx)`
(`foes.js`, which `cryptTells` calls); stills `world-crypt-walk-tells`, `world-crypt-iron-angel-close` (and
`world-crypt-iron-angel-approved-before`).

**Build.** Once, after the crypt's layers are built (`buildDungeon`):
- **Far hall:** three colossal riveted iron ribs rise through it, seen through the arches, a dim crimson eye-light on
  one.
- **The moonlit saint in the alcove is an iron angel** (approved 2026-11-27, `ironAngelStatue`): folded wings of
  riveted iron feathers rising to points above its head, the gilt broken halo with its spark, a serene iron face with
  one ember eye weeping a line of rust, a breastplate with the halo, its hands on a great sword point down, a robe of
  iron folds with riveted bands, green patina low in the folds, the moon's rim down its right side, a carved plinth
  with its name worn away and wax run down its front. It clears the alcove's old saint first.
- **The banner** carries the broken halo in umber instead of the sun.
- The sample draws into the page's crypt layers (`DG.far` 330 wide, `DG.mid` 440; the alcove at mid x 165, the banner
  at mid x 385); fit it if the build's crypt has moved.

**Done when.** The walk and the battle match the stills; the parallax, the lights, the mist and the party's
readability are as before.

---

## W4. The roster: every enemy in the new look

**What.** Spec aoj-world §4 (all approved 2026-11-27). Package: the helpers at the top of `aoj.js` and `foes.js`, the
enemies in both; stills `world-roster-sheet`, `roster-*`, `battle-*`, `anim-*` (and `world-crypt-battle-approved-before`).

**The enemies, by the build's id** (`data/enemies.ts`, `data/curios.ts`; the ids stay, saves key on them):

| id | Now | Becomes | Drawn as | Name |
|---|---|---|---|---|
| `skeleton` | Skeleton (`skel` rig) | The Hollow: a dead knight in blackened, rusted armour, a great helm with two embers, a greatsword | `hollow(x, fy, t, { shield: false, b, swing })` | **Hollow** |
| `shelter` | Guardian (`skel`, helm and shield) | A Hollow with the kite shield painted with the broken halo | `hollow(...)` while `e.shield`; once Bash breaks it, `{ shield: false, strip: 1 }` (torn open, the heart-lens showing); it raises the shield again as now | **Guardian** (unchanged) |
| `collector` | Orc (`zomb` with a sword) | A Hollow torn open, one arm bare to the iron frame, the crimson heart-lens showing | `hollow(..., { shield: false, strip: 1, armBare: true })` | **Revenant** |
| `ghoul` | Ghoul (`zomb`, Hook) | The Penitent: a gaunt flagellant, the iron cage and its candle on his head; his scourge is the Hook | `penitent(...)` | **Penitent** |
| `auditor` | Shaman (`necro`, heals) | The Confessor: hooded, an iron grille for a face, the serpent crozier, the censer; the ring of candles | `confessor(...)` | **Confessor** |
| `junk` | Imps (pixel sprite, a swarm) | Cherubs: one per body, iron wings, a porcelain face, a broken halo each | `cherub(x, y, t, n)` per body, in the swarm's places | **Cherubs** |
| `bat` | Bat (pixel sprite) | **The Ironwing or the Vigil, rolled at random for each bat when it spawns** (kept for its life; a pack can mix them) | `ironwing(x, y, t, n)` or `vigil(x, y, t, n)` at head height over the lane (the page flies them 72 to 88 px above the feet) | **Ironwing** / **Vigil** |
| `brute` | Brute (the Ogre's sprite, Shove) | The Gravedigger: a hulking hooded brute, a coffin-lid face-plate, an iron grave-spade | `gravedigger(x, fy, t, { swing })`: `swing` while Shove lands (the spade driven at the front hero) | **Gravedigger** |
| `bailiff` | Ogre (boss, Smash) | The Gaoler: the hood and iron muzzle, the keys, a solid iron ball on a chain | `gaoler(x, fy, t, pose)` | **The Gaoler** |
| `shark` | Warlock (boss, Summon / Empower) | The Bellringer: a stooped bell-priest under a yoke with an iron bell | `bellringer(x, fy, t, { toll })`: `toll` 1 during the wind-up (he hauls the rope, the bell rings, the rings go out) | **The Bellringer** |
| `landlord` | Black Knight (boss, Execute, shield) | The Inquisitor: spread angel-iron wings, massive pauldrons, the angel-masked helm, the tower shield, the headsman's sword | `inquisitor(x, fy, t, { ...pose, shield: e.shield })` | **The Inquisitor** |
| `troll` (the fight) | Troll (mini-boss) | The Abbot, woken: the war-priest with his great mace | `abbot(x, fy, t, pose)` | **The Abbot** |

- **The attacks' poses** come from `strikeTimeline(u, wind, hold, strike, after, recover)` (`foes.js`), u the seconds
  since the cast began. Fit `wind` to the build's wind-up so the hit plays as the cast resolves:
  - **Smash** (`bailiff`, `BOSS_WINDUP_SEC` 3): `smashAt(u, BOSS_WINDUP_SEC - 0.3)`: he hauls the ball up and whirls it
    overhead while the bar fills, brings it over and down in the last 0.3 s, lands it as the damage lands, holds 0.5 s
    and drags it back in 0.8 s. The page's flash and dust at the ball (`EFX.ball`) on the hit.
  - **Execute** (`landlord`, `EVICT_WINDUP_SEC` 3): `strikeTimeline(u, EVICT_WINDUP_SEC - 0.4)`: the raise (his wings
    flare, the near pauldron lifts with the arm), a 0.25 s hold, the straight-arm cut in 0.15 s as the damage lands,
    the follow-through held 0.5 s, back to rest in 0.7 s.
  - **The Abbot's hit** (the troll's own attack): `strikeTimeline(u, 1.3)` from 1.3 s before each hit he lands (raised
    two-handed over his shoulder, the 0.15 s swing down as the hit lands).
  - **Summon / Empower** (`shark`, `LOAN_WINDUP_SEC` 2): `toll: 1` for the wind-up, as the page's Bellringer battle.
  - **Shove** (`brute`, 1 s, `LINE_BREAK_WINDUP_SEC`): `swing` for the last 0.5 s of the wind-up and while it lands.
  - The casts' labels lift clear of the bosses' heights (the page puts Smash's at y 50 and its bar at 64, over the ball
    at the top of its swing).
- **Their lights** (as `aojBattle` and `foeBattle` do): each Penitent's candle and the Confessor's ring of candles
  (`AOJ.candles`, `candleFlames` in the fx pass, a warm light each); a torn Hollow's heart-light (crimson, r 14, at its
  chest); the Confessor's two lights (`EFX.necro`, `EFX.staff`); a small crimson light at each Ironwing's heart and each
  Vigil's eye (r 18, stronger in the back lane, so they read where everything is dimmed); the Gravedigger's lantern and
  the Bellringer's two candles (`AOJ.lamps`, `AOJ.candles`); the Bellringer's cold light while the bell tolls.
- **Everything the battle does to an enemy still works:** the outline pass (`TAG`), the hit flash, the back lane dimmed,
  the swing on its attack, the HP bar and the marks above it (bar heights per figure; a flyer's bar 27 px above its
  centre, clear of its ears and rotor; the bosses' bars clear of their heads and wings), the wind-up label, the Hook's
  and the heal's timings, the Guardian's and the Inquisitor's shields (`e.shield`).
- **Their text,** the ids unchanged. The meet lines:
  - "New: Confessor. Heals his friends. Frost goes for him first."
  - "New: Guardian. Takes 75% less damage until Bash breaks his shield." (as now)
  - "New: Cherubs. One cherub per hit, and each one bites. Fire burns them all."
  - "New: Penitent. Its Hook drags your last hero to the front. Drag him back."
  - "New: Gravedigger. Its Shove knocks your front hero back one position. Drag him back."
  - "Boss: The Gaoler. SMASH hits everyone: Bash, Ward or Taunt."
  - "Boss: The Bellringer. He summons a friend, or empowers the one still standing: full HP, hits harder. Kill friends
    fast."
  - "Boss: The Inquisitor. Bash his shield off. EXECUTE hits one hero hard: Taunt or Ward."
  - The Hollow, the Revenant, the Ironwing and the Vigil have none, as the Skeleton, the Orc and the Bat have none now.
  Every other place a renamed enemy is named follows (the feed, toasts, tips, tooltips, the Bellringer's summon: "a
  Confessor or Cherubs"; search for Skeleton, Orc, Shaman, Ghoul, Imps, imp, Bat, Brute, Ogre, Warlock, Black Knight and
  Troll). Cast and move names stay (Hook, Shove, Smash, Summon, Empower, Execute).

**Done when.**
- The roster sheets, the battles and the attack strips match the stills; every enemy reads at the battle's size: its
  silhouette, which lane it's in, the shields up or broken, the Confessor as the caster, the Cherubs as a swarm, the
  flyers in the back lane.
- Every pose of every enemy passes the draw-order check (above).
- The bot sims give the same numbers as before.

---

## W5. The curios: every curio in the new look, as detailed as the characters

**What.** Spec aoj-world §4b. Every curio in `data/curios.ts` is redrawn for the world, at the characters' level of
detail: code-drawn like the enemies in `foes.js`, not Px sprites. The troll's is done (the Abbot asleep on the tithe:
`abbotAsleep(cx, fy, t)`, `titheHeap`); the others are drawn in this Issue from the spec's brief for each: the Locked
chest, the Sealed coffin, the Wayside Shrine, the Pilgrim, the Supply Cart, the Blood Altar, the Moonwell, the Ritual
Circle, the Guild bank vault, the Potion cart. Paweł asked for this as part of the v2 redesign.

**Build.**
- **One drawing function per curio** in `foes.js`'s manner (shaded shapes lit from the upper left on the Moonwell
  ramps, rivets, rust in umber, the actor rim, emissive accents only where something glows), about a hero's height or
  taller, standing where the curio stands now (`vm.curio.x`, its feet on `CART_Y`), tagged as an actor (`TAG`) so the
  separation pass outlines it. Each has an idle animation (a flame, a sway, a drip, a rattle) and its own light, dimmed
  once passed (as now).
- **Its states:** waiting, and after each choice (opened, emptied, used, gone dark); the choice's moment animated
  briefly where the brief says so.
- **The floor map's icons follow** (`pathicons.js`, 11 x 11): the Wayside Shrine, the Pilgrim, the Supply Cart, the
  Blood Altar, the Moonwell, the Ritual Circle and the Locked Chest redrawn from the new looks; the Elite Pack's horned
  skull becomes a Hollow's helm with two embers; the Goblin Den stays. The run blessings' chips use the new icons.
- **Names and lines stay as built** except the troll's: the curio is **"The Abbot, asleep on the tithe"** ("Every snore
  rattles the coins."; Fight him: "A mini-boss. Noise +{roar} (he wakes with a roar)"), and the fight is **The Abbot**.
- **For Paweł's review:** a still of each curio waiting and after its choice, side by side, before the Issue closes
  (the art was not mocked up in the design chat, so this is its approval).

**Done when.** Every curio is drawn and reviewed; none is a Px sprite; each reads in the corridor at a glance (what it
is, that it can be used); every pose and state passes the draw-order check; the curio cards and their choices work as
before.

---

## W6. The check and the docs

- **Stills from the build** at the reference's beats (the launch's 23, the town, the crypt walk and battle, the iron
  angel close, every enemy at rest and through its attack, every curio before and after), side by side with
  `design/v2/stills/`; list any difference and why.
- **Frame time** in F1 on the desk: the launch's title and login, the town in rain, a crypt battle with Cherubs and a
  Confessor, each boss through its attack.
- **The bot sims and `test/`:** the same numbers as before W1.
- **Docs:** `docs/design/aoj-world.md` (the spec, copied from the project), a line in the repo's design index pointing
  to it, and the package at `design/v2/`. In the ROADMAP, the v2 redesign moves into Phase 1, done.
