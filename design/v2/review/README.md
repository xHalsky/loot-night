# The v2 redesign: review stills and the check (W5 and W6)

**W5, the curios (#131), for Paweł's review:** `curios-w5-a.png` and `curios-w5-b.png` (every curio from the build,
waiting, at the choice's moment 0.8 s after it and after, one column per outcome; `python3 test/curio_stills.py`),
`icons-w5.png` (the floor map's feature icons, old and new) and `map-icons-w5.png` (on the path cards).

**W6, the check (#132):** `w6-launch-*.png`, `w6-world-1.png`, `w6-battle-*.png`: each reference in
`design/v2/stills/1x` on the left, the build at the same beat on the right, at the native 474 x 232 (the desk stills
at 492 x 360). Made by `python3 test/v2_stills.py` after `npm run build`; it also prints the F1 render times.

## Differences from the references, and why

- **The launch (24 beats and the four desk stills):** the monitor matches beat for beat. On the desk the build shows
  the first Monday as it is: the contacts' names in their own colours (0.92.1, #119), the phone's battery full, no
  Tonight note and no Drink button yet (the page staged its desk from a later night). At 38.5 s the harness jumps the
  clock past 38, so its still has no welcome line in the feed; the real launch posts it (`test/launch.py` checks it).
- **Ravenhold in the rain:** the town matches (rain, puddles and reflections, the ribs over the portal with the heart
  light, the halo fountain). The side panel is the build's own (Town, Inventory and Skill Tree tabs, the floor picker,
  the live bag and gold), not the page's mock panel.
- **The crypt walk and the iron angel:** the tells match (the ribs in the far hall, the broken halo on the banner and
  the saint, the iron angel in its alcove). The build's still is at its own scroll, with its live HUD (floor 1, Flow
  x1.0, party level 1); the close-up of the angel sits about 20 px lower in the build's battle area and gets less of
  the moon shaft at that scroll.
- **The roster in battle:** every figure, its light and its idle match. The build's stills are staged on floor 1 with
  the game's own data: HP bars, damage numbers and the party still fighting (the mage's bolt in flight); the references
  show marks and casts from a played fight (Staggered, Taunted, Last Rites). The roster stills put the six regulars in
  two packs of three (the reference mixed its own pack).
- **The bosses through their attacks:** the Gaoler's Smash (whirl, over, down, impact, drag back), the Inquisitor's
  Execute (rest, raised, the 0.15 s cut, follow-through, recovery) and the Abbot's swing (raised, swing,
  follow-through) match pose for pose, on the build's cast timing. The Bellringer's still shows Summon under way; his
  choir comes when the cast resolves.
- **The Abbot asleep on the tithe:** the same figure; in the build he stands where curios stand since 0.87 (#99), on
  the cart row behind the party, with the curio card over the band.

## Frame time (F1, render ms, headless Chrome on 2 cores, software rendering)

| Scene | Before W1 | Now |
|---|---|---|
| Ravenhold in the rain | 6.5 | 6.9 |
| A crypt battle with Cherubs and a Confessor | 21.0 | 21.1 |
| The Gaoler through Smash | 19.2 | 19.8 |
| The Bellringer through Summon | 18.9 | 20.3 |
| The Inquisitor through Execute | 18.8 | 20.5 |
| The Abbot through his swing | 19.8 | 21.3 |
| The launch's title (19.6 s), its login (26 s) | (new) | 27 to 32, 27 to 29 |

Everything stays inside a 30 fps frame; the launch's title is the heaviest frame (the logo, the scene and the rain).

## The numbers

- **The bot sims:** six seeded good nights and six seeded idle nights (`SEED=n npx tsx --import ./test/seed.mjs
  test/sim.ts good|idle`) print the same JSON, byte for byte, in the tree before W1 (8f333b5) and now.
- **`test/`:** every `test/*.ts` seeded the same way gives the same output before W1 and now, except `test/launch.ts`
  (new with W1) and `test/week.ts`'s week-two line, which follows the 0.99.1 decision (week two plays the login).
