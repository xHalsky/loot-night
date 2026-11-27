# Loot Night: the v2 redesign (Age of Judgment), handoff, 2026-11-27

For the repo at `design/v2/`. **The v2 redesign** is the RPG's new world, Age of Judgment, and its launch on night
one; it is called v2 to keep it apart from the first redesign (the Game Frame, `design/redesign/`, Issues V1 to V13).
Approved by Paweł on 2026-11-27, the whole roster included; the same evening Halsky Labs' mark became his logo and the
launch got its sound and music. This package (`loot-night-v2-handoff-2026-11-27b.zip`) replaces
`loot-night-v2-handoff-2026-11-27.zip` and `loot-night-aoj-handoff-2026-11-27.zip`.

The spec is `spec/aoj-world.md` (commit it as `docs/design/aoj-world.md`); the Issues are W1 to W6 in
`spec/aoj-issues.md` (file them as written). Where this README and the spec disagree, the spec wins; the decisions log
(`claude/loot-night-decisions.md`) wins over both.

## What's here

| Path | What |
|---|---|
| `spec/` | The spec (`aoj-world.md`) and the Issues (`aoj-issues.md`), as in the project on 2026-11-27. |
| `samples.html` | The approved samples page, self-contained (open it in a browser). The launch (whole, then each step); the world (Ravenhold, the four depths, the first roster); the roster, round four (the sheets, every boss in battle through its attack, the Abbot asleep and woken, the iron angel close); Compare flips to the approved look before v2. |
| `page/` | Its source: the page engine as in `src/render/page/` (engine, kit, hud, dungeon, chars, enemies, screens, townkit, town, desk, win98, q4, ebreak, dog, cables, phone) plus the three new modules. `build.py` inlines it into `samples.html`; `harness.html` loads the files one by one (for stills). |
| `page/aoj.js` | **New.** The helpers, the first roster (Hollow, Penitent, Confessor, Cherubs), the crypt's tells, Ravenhold in rain, the deeper depths (later), the title art and the launch. |
| `page/foes.js` | **New.** The rest of the roster (Ironwing, Vigil, Gravedigger, the Gaoler, the Bellringer, the Inquisitor, the Abbot awake and asleep), the attacks' timing (`strikeTimeline`, `smashAt`) and the crypt's iron angel statue. |
| `page/logos.js` | **New.** The logo kit and the three logos (Age of Judgment, Halsky Labs, Procrastination Studios). Halsky Labs' mark is `HALSKY_MARK`, Paweł's logo as palette indices (75 x 88, one string per row). |
| `assets/halsky-labs-logo-source.png` | Paweł's logo, the source of `HALSKY_MARK` (RGBA, 1400 x 1400). Commit it. |
| `tools/halsky_mark.py` | Makes `HALSKY_MARK` from the source (`python3 halsky_mark.py [png] [height]`; numpy, scipy, Pillow): the sticker's white rim, the dark band, the face Atkinson-dithered in two tones, each lit pixel's brightness kept so the face can develop brightest first. Commit it with the source. |
| `page/phone.js` | **Changed:** `PHONE_SCREENS.firstchat` (line 939) is the boys' first chat (five bubbles) paced to the launch, with the loading pill. In the build it merges into the `intro` screen. |
| `fonts/` | The four new fonts (Cinzel Decorative Black, Cinzel Black, Sora ExtraBold, Fredoka Bold; SIL OFL 1.1, the licences beside them; in the build Sora and Fredoka were replaced with the studio logos' redesign, #133: now Syncopate Bold for HALSKY, New Rocker and Uncial Antiqua for Procrastination Studios' cracktro, in `src/assets/fonts/` with their licences) and the page's existing four. |
| `stills/1x`, `stills/3x` | 61 stills at the native size and at 3x (below). |

**The stills:** `launch-*` (every beat of the launch; `launch-03*` the Halsky Labs sting with Paweł's logo), `desk-launch-*`
(the desk during it, the five bubbles),
`world-*` (Ravenhold, the crypt walk and battle, the iron angel close, the first roster; `*-approved-before` for
comparison), `roster-*` (the round-four sheets), `battle-*` (every new enemy in a crypt battle; each boss through its
attack, beat by beat), `curio-abbot-asleep-on-the-tithe`, and `anim-*` (each attack frame by frame through its battle
timing: left to right, top row then bottom).

## What to port (by Issue)

The build already runs this engine (`src/render/page/`, `ORDER`), so the code ports almost as it is: add `aoj.js`,
`foes.js` and `logos.js` to `src/render/page/` (after `live.js` in `ORDER`), keep only the parts below, and call them
from the build's views. Everything is palette-exact Moonwell 32 through the same `compose`.

- **W1, the launch:** all of `logos.js`. From `aoj.js`: `screenBoot` (the title art, with its `halo` option), `LAUNCH`,
  `LAUNCH_END`, `launchPhase`, `FIRST_CHAT_AT`, `TYPING_SEC`, `launchBuf`, `launchOut`, `fadeIdx`, `fadeAt`,
  `ditherBlack`, `PTR`, `HOURGLASS`, `pointer`, `launchDesktop` (with the 18 x 18 `aoj` icon, the emblem on the
  desktop), `ENGINE_LINES`, `launchEngine`, `launchPublisher`, `launchDeveloper`, `LOGO_BIG`, `LOGO_SMALL`, `titleLogo`,
  `launchTitle`, `ACCOUNT`, `loginPanel` (the turning halo), `launchLogin`, `TIP`, `launchEnter`, `launchGame` (it draws
  the town through the page's `gameScreen`; in the build, fade the live town in instead), `launchScreen`. From
  `phone.js`: `PHONE_SCREENS.firstchat`.
  - **The sound** (spec §7b): `LAUNCH_SOUND` (the cue sheet, 62 cues by the launch's T), `LAUNCH_LOOPS` (the rain) and
    `LAUNCH_MUSIC` (the theme from 6.2 s, its parts) in `aoj.js`, as data for the build's launch view. There is no audio
    in this package: the cues and the theme are made in the build (`tools/sfx/`), as §7b and W1 say. The samples
    page draws the cue sheet under the launch (hover a tick for what it is).
- **W2, Ravenhold:** `STREETS`, `ravenholdIron(L)` (puddles, the ribs over the portal, the fountain's halo; into the town
  layer once, when it is built), `townRain(F, t, lights)` (the reflections, the heart-light, the rain and splashes;
  every frame, after the town's life), and `TOWN_AMB = [0.56, 0.6, 0.84]`. `aojTown` shows how the page composes them.
- **W3, the crypt:** `ironRibV` and `cryptTells()` (`aoj.js`), which calls `ironAngelStatue(cx)` (`foes.js`). Once,
  after the crypt's layers are built (`buildDungeon`).
- **W4, the roster:**
  - From `aoj.js`: the helpers at the top (`easeO`, `ironRod`, `ironJoint`, `rivets`, `eyeLight`, `brokenHalo`,
    `litEdges`, `plate`, `rustPatch`), `hollow`, `penitent`, `candleFlames`, `confessor`, `frameLine`, `cherub`.
  - From `foes.js`: the helpers (`lgB`, `polyF`, `wingFrame`, `ik2`, `ironBar`, `rimPoly`, `frameLine2`, `chainLinks`,
    `sag`, `cageLantern`, `smoothQ`, `angLerp`, `rotAbout`, `smear`), the timelines (`strikeTimeline`, `smashAt`), and
    `ironwing`, `vigil`, `gravedigger`, `gaoler`, `bellringer`, `inquisitor`, `haloMace`, `abbotBanner`,
    `abbotPauldron`, `abbotHead`, `abbot`.
  - `aojBattle` / `DRAW_FOE` (`aoj.js`) and `DRAW2` / `BATTLES` / `foeBattle` (`foes.js`) show how the page stages
    them: the poses from the timelines, the lights, the flyers' heights and bars, the casts' label heights. `live.js`'s
    enemy loop takes their place; W4 has the mapping by the build's ids.
- **W5, the curios:** `titheHeap` and `abbotAsleep` (`foes.js`) are the troll's curio, done. The other curios are drawn
  in the build from the spec's briefs (§4b), in the same manner as `foes.js`.

**Not this pass** (the later stages: deeper depths, the Hunter): `HUNT`, `hunterBody`, `hunterTrophies`, `hunterMask`,
`hunterReveal`, `hunterFX`, `drone`, `DRONES`, `dronesOnWalls`, everything from `skl` to `broodLightsInto` (the
Ossuary, the Iron Saint, the Brood), `WALKS`, `aojWalk`, `BASE_FN`, `BIOME_FN`, `useBiome`.

**Page only** (don't port): from `aoj.js` `aojCanvas`, `screenRoster`, `aojInit`, `gameScreen`, `aojDraw`, `snapDG`,
`cloneBuf`, `ROSTER`, `screenSpriteTest`, `DESK_MOMENTS.launch*`, the `drawScreen` patch, `launchDesk`; from
`foes.js` `screenFoes`, `foeCard` and its test cards (`fc*`, `strip*`, `aud*`), `statueCard`, `statueView`, `STV`,
`L6`, `WALKS.abbot` and the `aojDraw` wrappers.

## Checks used on the page

- Every view runs in 21 to 38 ms a frame in headless Chrome (the launch's title and login about 27 ms, the boss battles
  25 to 36 ms).
- Draw order checked for every enemy in every pose and frame (rest, wind-up, the hit, recovery, the loops), rounds one
  to four; the `anim-*` strips show the attacks.
- The logos rasterise each type size once (cached); the login's shrink makes about 30 sizes over 0.9 s. The Halsky
  Labs mark is 6,600 pixels, written with `putI` each frame (palette-exact).
- The cue sheet's times were taken from the launch's code (each phase's own timings) and checked against it.
