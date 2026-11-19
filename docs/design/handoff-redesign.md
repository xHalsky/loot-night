# Loot Night: redesign handoff (RPG, trees, real life, Q4, the week, smart home)

For the builder. Received 2026-11-19 from the redesign chat (project doc `claude/loot-night-handoff-redesign.md`),
with Paweł's answers of 2026-11-19 folded in. Steps 1 to 7 are Issues #52 to #58, in this order. Each step's bullets are its checklist. Values marked *start* are starting values: put them in
the config object and tune them with the debug overlay.

## 0. Rules that hold for every step

- **The goal:** a proper Steam game. No birthday ending.
- **The frame:** Five Nights at Freddy's, but the night guard is trying to play a game, and the threat is his
  girlfriend. The RPG is the temptation: it has to be fun on its own, or the rest doesn't work.
- **Loot comes only from the game.** Real life can give buffs (heals, cooldowns, calm), never items or RPG gold.
  RPG to real life is fine (Auction House pays złoty, real-life affixes on gear). Złoty buys only real-life
  upgrades: things for you, and smart-home devices for defense. Q4 (the Excel clicker) is its main source.
- **Currencies:** gold and Souls in the RPG, złoty (zł) in real life. Souls replace scraps. No fourth currency.
- **Player-facing text:** plain, short, funny where it fits, no em dashes. The RPG plays it straight: plain
  fantasy names of one or two words, no real-life jokes in items, enemies, skills or places.
- **Don't:** add an "Equip best" button (comparing and equipping is core gameplay), let ultimates autocast,
  send loot straight to the bag, or cut the walk.
- **Save:** the data changes a lot (scraps, trees, runs, zł use). Bump the save key to `lootnight.save.v2`;
  old saves start fresh.
- **Art:** `claude/loot-night-rpg-grid.md` assumes 3 heroes, 3 enemies and 3 skill wells per hero. The new
  layout is 4 heroes with 4 wells each, enemy ranks, swaps, path-card features and conditions, run-blessing
  icons, the tree screen, the Q4 screen and the phone apps. Keep the Moonwell 32 look, the grid and the
  meaning colours; lay the new parts out on the same grid. Code-drawn stand-ins are fine until the art pass.
  The PC (taskbar, windows, Excel, dialogs) looks like Windows 98/XP. The phone is a touch smartphone: mouse
  only, no keys. The battle is being redrawn for 4 evenly spaced heroes and a mob of six.

---

## Step 1. The RPG on its own

Build and test this with real life switched off. It has to hold 15 minutes alone before step 3.

### 1.1 Debug: real life off
- Add a debug toggle (F1 panel) "Real life off": no visits, phone, dog, Tiredness, Noise, Mood or night clock
  pressure. The RPG runs as if nobody is home. Keep it in the debug panel for later testing.
- Add live pacing numbers to the overlay: encounter time, floor time, run length, items per minute, rare+ per
  minute, Souls per run, current node costs, Q4 income per second (step 4).

### 1.2 Real-time combat
- Remove ATB. Every unit attacks on its own timer: `attack interval = BASE_ATTACK_SEC × 10 / speed`
  (*start* `BASE_ATTACK_SEC` 1.2). Auto attacks (Knight Slash, Mage Bolt, Priest Smite, Rogue Stab) fire on
  their own; they are not skills.
- Convert everything counted in turns to seconds (Fury, stuns, Bash's "stuns for a turn" becomes 1.5 s,
  Rally's "every hero acts now" becomes "every hero attacks immediately").
- **Each hero has 3 skills + 1 ultimate.** Skills are on cooldown and are cast **only when the player presses
  them** (key or click), unless that skill's autocast has been bought (step 2). Keep queueing, marks and
  combos (Stagger, Chill, Judged, Taunted), boss wind-ups and answer skills exactly as they work now.
- **Ultimates:** a charge meter per hero that fills over `ULT_CHARGE_SEC` (*start* 20) seconds of combat (it
  only fills during fights, never between them). Always manual, never autocast. The 4th well in the skill bar
  (now a locked placeholder) becomes the ultimate.
- **Keys, one keyboard row per hero, ultimate on the 4th key:** Knight 1 2 3 + 4, Mage Q W E + R,
  Priest A S D + F, Rogue Z X C + V. Keys belong to the hero, not to the rank.
- **Away:** when the RPG is not on screen (Excel, switching, monitor off, hands busy), manual skills and
  ultimates are not cast. Only bought autocasts fire (step 2). Remove the old autopilot skill use
  (`AUTOPILOT_HEAL_BELOW`, `AUTOPILOT_NO_TANK` and the rest of that logic); the party still fights with auto
  attacks.
- **Flow** keeps building only while you watch and keeps its loot luck. Add speed: at max Flow the party
  attacks `FLOW_SPEED` (*start* 25%) faster, scaled linearly from Flow x1.
- **Big numbers:** exponential scaling. Enemy HP grows `ENEMY_HP_GROWTH` (*start* ×1.15) per floor, enemy
  attack `ENEMY_ATK_GROWTH` (*start* ×1.12), item power `ITEM_POWER_GROWTH` (*start* ×1.12) per item level,
  all compounding. Replace the linear per-floor constants. Format numbers as 1.2K, 34.5K, 1.2M.

### 1.3 Floors: walk, packs, pickup
- A floor is walk, encounter, walk, encounter, walk, encounter, then the floor end. Every 5th floor is a boss
  floor: two encounters, then the boss.
- **Packs:** an encounter is a pack, six on screen: fodder in two close lanes, bosses, sub-bosses and lieutenants
  behind them on the party's own lane. Pack size `= min(PACK_MAX, PACK_MIN +
  floor(f / 2))` (*start* `PACK_MIN` 5, `PACK_MAX` 12). The rest wait off screen on the right and step into
  the free rank as the front ones die. Imp swarms stay as they are (one swarm fills one rank).
- **Keep the walk** (`WALK_SEC` stays) and the Diablo pickup. Drops fall where the enemy died, in their
  rarity light with the beam, as now.
- **Remove the loot pause** (`LOOT_PAUSE_SEC`). The pickup happens during the walk: the looter runs ahead to
  each item, grabs it (the name flies up, the bag slot glows NEW, the LOOT feed line), and runs back into
  rank. The walk lasts until the pickup is done, but at least `WALK_SEC`. The looter is the Knight on night 1
  and the Rogue from night 2.
- **More drops:** each kill drops an item with `DROP_CHANCE` (*start* 0.35); elites always drop; bosses drop
  `BOSS_DROPS` (3). Keep the rarity weights, the per-floor shift and the epic pity. Add
  `LEGENDARY_FIRST_BY` (*start* 80): the first legendary of a save is guaranteed within its first 80 drops.
- Curios, the goblin, chests and vaults stay (curios change in 1.5b).

### 1.4 Runs
- A run starts at the Dungeon Portal in town. The side panel's "Enter the dungeon" button gets a floor picker
  (◀ floor N ▶) with floor 1 and every unlocked checkpoint.
- **Checkpoints:** beating the boss of floor 5n unlocks starting runs at floor 5n+1. Saved permanently.
- The run goes floor after floor until one of two things happens:
  - **Town portal** (button under the corner overlay, only outside fights, takes `COST_TRAVEL_MIN` as now):
    the run is banked.
  - **Wipe** (every hero down): the run is lost.
- **Unbanked loot:** items and gold picked up during the current run. In the bag they carry a run marker (a
  dashed inner frame) until banked. The corner overlay shows a third line: "unbanked: 7 items · 420 g".
- **Wipe:** a "PARTY WIPE" moment, all unbanked items and gold are lost, Souls earned in the run are kept, and
  the party wakes in town at full HP (travel time as for the portal). Remove the old wipe penalties:
  `WIPE_GOLD_PCT`, `WIPE_TIME_MIN`, `WIPE_BAG_LEFT`, the corpse and the corpse run. The desk slam (Noise) stays.
- Banked items are never lost on a wipe. Locking (L) still blocks salvage, selling, listing and dropping, but a
  locked item you haven't banked is lost on a wipe like the rest (tune after the playtests).
- **Run end card** (small, over the battle area, 2 s): deepest floor this run, items banked or lost, Souls.
- **Souls:** each floor cleared gives `SOULS_PER_FLOOR = 3 + floor` (*start*); each boss +20; salvage gives
  Souls by rarity (reuse `SALVAGE_YIELD` [1, 2, 4, 8, 16]). Souls are one shared pool for all heroes.

### 1.5 The floor map: route choice, features and conditions
No blessing cards. The choice at the end of a floor is the route, on the parchment map (#48).

- **Every floor end opens the map** (as now) with **2–3 path cards for the next floor**, always (*start* 2 on
  floors 1–5, 3 after). Map items in the bag still add one extra card each, as now. The floor before a boss
  shows one card, the boss floor (it can carry a condition).
- **Each card shows at most one feature and at most one condition**, as an icon plus one line each. About half
  the cards are plain: `NODE_FEATURE_CHANCE` (*start* 0.5), `NODE_CONDITION_CHANCE` (*start* 0.35). Hovering
  a card draws that room into the map and shows the full text, as now.
- **Timer:** with the map on screen there's no limit (the night clock already runs at `MENU_CLOCK_SPEED`).
  Once the map has been off screen for `MAP_AWAY_SEC` (*start* 5) in total while the choice is open, it
  picks the **safest** card: no condition first, then the lowest `danger`; among equals, at random. It never
  auto-picks a card that would use up a map item. Away loses you the upside; it never walks you into danger.
- **Features** put a specific interactable on that floor: it replaces one of the floor's random curios. Data:
  `id, name, icon, line, curio id`.

| Feature | On that floor |
|---|---|
| Wayside Shrine | The Wayside Shrine curio (1.5b) |
| Pilgrim | The Pilgrim curio |
| Supply Cart | The Supply Cart curio |
| Blood Altar | The Blood Altar curio |
| Moonwell | The Moonwell curio |
| Ritual Circle | The Ritual Circle curio |
| Locked Chest | The existing Locked chest curio |
| Elite Pack | As the existing map item: harder pack, a guaranteed rare |
| Goblin Den | As the existing map item: a loot goblin after every encounter; catching one is loud |

- **Conditions** change the whole floor, and **every condition pays**: a condition with no upside is a trap,
  not a choice. Data: `id, name, icon, cost, upside, danger (1–3)`.

| Condition | Cost | Pays | Danger |
|---|---|---|---|
| Silent Halls | Drops −20% | Crits and skills make no Noise on this floor | 1 |
| Haunted | Every kill makes Noise +1 | Ultimates charge 50% faster | 1 |
| Flooded | Cooldowns +20% | Drops +30% | 2 |
| Pitch Dark | Enemies hit 15% harder | Gold +50% | 2 |
| Swarming | Packs 50% bigger | Souls +50% | 2 |
| Cursed (the existing map kind) | Your heals do half | Every drop is one rarity better | 3 |

- The existing map items keep working as they do from the bag (Elite Pack, Shrine, Treasure Vault, Cursed
  Floor, Goblin Den). Elite Pack and Goblin Den can also appear as generated features, Cursed as a generated
  condition. The map item called "Shrine" (full heal, revive all, no loot) stays as it is; the new curio is
  the "Wayside Shrine" so the two don't get mixed up.

### 1.5b Run blessings come from interactables
- **Curios are the only source of run blessings.** A blessing lasts until the run ends (banked or wiped) and
  stacks, and **every blessing has a trade-off**. Costs should reach real life or the run (Noise, game
  minutes, the Town portal, HP, enemy strength, Flow), not flat stat cuts.
- **Replace the short curio buffs** (`CURIO_PRAY_SEC`, `CURIO_CAN_SEC`, `CURIO_SULK_SEC` and the like) with
  run blessings where a curio gives a buff. Curios that give loot or gold stay as they are (Locked chest,
  Sealed coffin, Guild bank, the troll).
- **Curio timing stays:** the window waits `CURIO_WAIT_SEC`, then the party walks past (away = a missed
  blessing). The away behaviour stays too: with `CURIO_AWAY_RECKLESS` the party may take the bargain on its
  own, cost included (a shrine bell ringing while she's in your room is a feature).
- **Active blessings** show in the buffs row (top right) with a small "run" mark; hover shows name, effect and
  cost. They clear when the run ends. The run end card (1.4) lists them.
- **Starting set (names are placeholders, effects are the spec).** Each has the bargain and "Leave it":

| Interactable | Bargain | Run blessing | Cost |
|---|---|---|---|
| Wayside Shrine (rework of "Shrine of the green flame") | Pray | +20% damage | The bell rings: Noise +15 |
| Pilgrim (NPC, new) | Swear his oath | Cooldowns −15% | No Town portal until the next boss is dead |
| Supply Cart (new) | Eat the rations | +25% item drops | Party max HP −10% |
| Potion cart (existing) | Shake it | 50/50: +30% healing, or broken glass: the party loses 10% HP now | Noise +15 (as now) |
| Blood Altar (new) | Bleed on it | +30% crit | Heroes lose 1% HP per second outside fights |
| Moonwell (new) | Drink | Ultimates charge 40% faster | Flow drops to x1 |
| Ritual Circle (new) | Join the chant | Souls +50% | Enemies +20% HP |

### 1.6 Marching order (Darkest Dungeon style)
- The party walks and fights in one line: rank 1 at the front, rank 4 at the back. Defaults: night 1 (3
  heroes) Knight, Priest, Mage; from night 2 Knight, Rogue, Mage, Priest.
- **Home ranks:** a hero outside them deals and heals `OUT_OF_RANK_MULT` (*start* 0.7) of normal. Knight 1–2,
  Rogue 1–3, Mage 3–4, Priest 2–4. Show "out of position" as a small mark on the hero's skill-bar portrait.
- **Enemies hit ranks:** melee enemies hit rank 1 (70%) or 2 (30%); archers and casters hit ranks 3–4; some
  casters hit any rank. Taunt overrides all of it (everything hits the Knight). Boss wind-ups name their
  target rank: "EXECUTE · rank 4".
- **Auras (neighbour buffs).** Downed heroes give none. Show them on hover over a hero and as a tiny icon
  between the skill-bar portraits.

| Hero | Aura | Start value |
|---|---|---|
| Knight | The hero directly behind takes less damage | −25% |
| Rogue | The hero directly in front gets more crit | +10% crit |
| Mage | The hero directly in front gets shorter cooldowns | −10% |
| Priest | The heroes directly in front and behind regenerate | 1% max HP per s |

- **Swap:** drag a hero (the sprite or the skill-bar portrait) onto another to swap them. Both stop acting for
  `SWAP_SEC` (*start* 1) while they pass each other. In town, change the order freely at no cost.
- **Enemies that break the line** (from floor 6, about one every few encounters, with a 1 s wind-up icon):
  - **Hook:** pulls the hero in rank 4 to rank 1; the others shift back one.
  - **Brute:** knocks rank 1 back, swapping it with rank 2.
  - While you're away the line stays broken. Fixing it is a reason to watch.
- Tree nodes may later change home ranks (for example "Fire at full power from rank 2"); keep home ranks as
  data per hero.

### 1.7 The Rogue (4th hero)
- **Joins on night 2** (`nightsPlayed >= 1` until the week exists in step 5), with a feed line when the night
  starts. Name: **Garrote** (the others are Knightenstein, Magoo, Healero).
- **Base stats (*start*):** HP 85, ATK 12, armor 3, speed 13, crit 12, luck 5.
- **The looter:** from night 2 the Rogue does the pickup runs in 1.3 (the Knight's role text changes to
  match).
- **Kit:**

| Slot | Skill | Effect (*start* values) |
|---|---|---|
| Auto | Stab | Hits the front enemy |
| Z | Backstab | Big hit on the front enemy (power 3), ×2 on Staggered (combos with Bash). cd 8 |
| X | Smoke Bomb | Enemies miss 50% of their attacks for 4 s. cd 14 |
| C | Pickpocket | A hit (power 1) that rolls an extra gold drop. cd 10 |
| V | Heist (ultimate) | For 8 s, every kill drops an item |

- Class tile colour and keyboard backlight colour for Z X C V: pick one that doesn't clash with the meaning
  colours (not crimson, gold, moss or cyan).
- Party cards, the skill bar and the side panel all go to 4 heroes.

### 1.8 Loot rules
- **At most 3 affixes per item, in plain words:** common 0, uncommon 1, rare 2, epic 3, legendary 3 plus its
  rule. A real-life or cross affix ("of Stealth", "of Devotion") counts as one of the 3.
- **Legendaries change a rule.** Starting pool (8). A legendary for a hero's skill only drops if that hero is
  in the party.

| Legendary | Slot | Rule |
|---|---|---|
| Frostbinder | Mage weapon | Frost chills two enemies |
| The Tithe | Knight armor | Taunted enemies drop gold when they hit the Knight |
| Last Lantern | Knight trinket | Bash on a Staggered enemy resets Taunt's cooldown |
| Ash Choir | Priest weapon | Mend also clears debuffs |
| Widow's Kiss | Rogue weapon | Backstab always crits on Chilled enemies |
| Stormcoil | Mage trinket | Storm bolts that kill jump to another enemy |
| Gilded Hand | Rogue trinket | Heist drops roll one rarity higher |
| Vigil Censer | Priest trinket | Revive also gives the revived hero Ward for 4 s |

- **Sets, one per hero, 3 pieces each (weapon, armor, trinket), dropping as epics with the set name.**
  2 pieces give a stat; 3 pieces give a rule:

| Set | Hero | 2 pieces | 3 pieces |
|---|---|---|---|
| Ironwake | Knight | +15% armor | Taunt also heals the Knight 10% of max HP |
| Embervow | Mage | +10% skill damage | Fire's cooldown resets when it kills 3 or more enemies |
| Dawnward | Priest | +15% healing | Ward also heals 3% of max HP per second |
| Nightglass | Rogue | +10% crit | Smoke Bomb makes every hero's next hit a crit |

- Keep the ▲ upgrade marker and the ▲/▼ power and stat differences in the tooltip. No "Equip best".
- **Auto-salvage toggle** (exists, in the BAG header): when on, commons and uncommons are salvaged into Souls
  the moment they're picked up; rare or better always go to the bag.
- **Scraps become Souls everywhere:** salvage, building costs (buildings now cost gold + Souls), the footer.

### 1.9 Pacing targets (tune to these, check them on the overlay)
- An encounter takes 8–12 s; a floor about 40 s with the walks.
- Night 1 runs end around floors 3–5 (2–4 minutes).
- An item on the ground every 3–5 s of combat; a rare or better about every 30 s.
- 1–2 tree nodes per run on night 1 (step 2).
- The first legendary on night 1.

---

## Step 2. Skill trees, Souls and autocast

### 2.1 Trees
- One tree per hero, defined as data (for example `src/data/trees.ts`): `id, hero, kind (unlock | rule | stat
  | ult | autocast), cost, requires [ids], exclusiveWith (id), effect params, x, y`. Adding nodes later must
  not need code changes.
- **Skills come only from the tree now.** Remove the level-based unlocks (`ABILITY_UNLOCK`). Hero levels keep
  giving stats. Each hero starts with the auto attack and skill 1.
- **Node kinds:**
  - **Unlock:** skill 2, skill 3.
  - **Rule pair:** two nodes on the same skill; buying one locks the other (shown chained). Respec frees it.
  - **Stat:** small % nodes.
  - **Ultimate:** needs any 6 nodes bought in that hero's tree.
  - **Autocast:** one per skill (not the ultimate), needs that skill unlocked. See 2.3.
- **Costs (*start*):** stat 10, unlock 15, rule 15, autocast 40, ultimate 60 Souls, each × (1 + 0.25 × nodes
  already bought in that tree).
- **Respec:** free during testing (a button on the tree screen), refunds all Souls spent in that tree.
- **Where:** in town only. The town side panel gets three tabs: **Town** (the build list and the way down),
  **Inventory** (party, gear, bag) and **Skill Tree** (pick a hero; the tree opens over the battle area, 334 ×
  232 on the grid, as a constellation in Moonwell 32, and the side panel shows the hovered node's details and
  cost). **No pop-up windows in town** (Paweł, 2026-11-19): clicking a building on the map opens it in the side
  panel's Town tab, a service (sell, identify, salvage, list) or a plot's build/upgrade, and the appraiser's reveal
  shows there too. The service and build windows over the town go. Node shapes by kind: unlock large, rule medium (pairs drawn as a fork), stat small,
  ultimate largest, autocast small with a loop mark.

### 2.2 The four trees (names are placeholders, effects are the spec)

Each tree has 15 nodes; the player can buy up to 12 (three pairs). "Req" = required node.

**Knight** (starts with Slash + Taunt)

| Node | Kind | Effect | Req |
|---|---|---|---|
| Hold the Line / Thorns | rule pair | Taunt also gives the Knight +30% armor / Taunted enemies take 30% of their hits back | none |
| Bash | unlock | Unlocks Bash | none |
| Cleaving Bash / Concussion | rule pair | Bash hits the enemies in ranks 1 and 2 / Bash stuns twice as long | Bash |
| Iron Skin | stat | +10% HP | none |
| Rally | unlock | Unlocks Rally | Bash |
| War Cry / Second Wind | rule pair | Rally also clears debuffs / Rally lasts twice as long | Rally |
| Veteran | stat | +8% damage | Iron Skin |
| Bulwark | stat | +10% armor | Veteran |
| Last Stand | ult | For 6 s, no hero can drop below 1 HP | 6 nodes |
| Autocast Taunt / Bash / Rally | autocast | See 2.3 | the skill |

**Mage** (starts with Bolt + Fire)

| Node | Kind | Effect | Req |
|---|---|---|---|
| Wildfire / Inferno | rule pair | Fire leaves the ground burning: 30% of its damage again over 3 s / Fire deals +40% damage, cooldown +3 s | none |
| Frost | unlock | Unlocks Frost | none |
| Lingering Chill / Shatterpoint | rule pair | Chill lasts twice as long / Bash shatters Chilled enemies for ×4 instead of ×2.5 | Frost |
| Focus | stat | +8% damage | none |
| Storm | unlock | Unlocks Storm | Frost |
| Overcharge / Thunderclap | rule pair | Storm fires 9 bolts instead of 6 / each bolt has a 20% chance to stun | Storm |
| Arcane Mind | stat | Cooldowns −8% | Focus |
| Glass | stat | +10% crit | Arcane Mind |
| Cataclysm | ult | Hits every enemy for 8 × attack; Staggered and Chilled enemies take double | 6 nodes |
| Autocast Fire / Frost / Storm | autocast | See 2.3 | the skill |

**Priest** (healer in code; starts with Smite + Mend)

| Node | Kind | Effect | Req |
|---|---|---|---|
| Sanctuary / Greater Mend | rule pair | Mend also gives +20% armor for 5 s / Mend heals 30% more | none |
| Ward | unlock | Unlocks Ward | none |
| Aegis / Retribution | rule pair | Ward lasts 3 s longer / any enemy hitting a warded hero takes 25% back | Ward |
| Devotion | stat | +10% HP | none |
| Revive | unlock | Unlocks Revive | Ward |
| Martyr / Swift Grace | rule pair | Revive brings heroes back at 80% HP / Revive's cooldown −40% | Revive |
| Grace | stat | Healing +10% | Devotion |
| Zeal | stat | +8% damage | Grace |
| Miracle | ult | Revives every downed hero and fully heals the party | 6 nodes |
| Autocast Mend / Ward / Revive | autocast | See 2.3 | the skill |

**Rogue** (starts with Stab + Backstab)

| Node | Kind | Effect | Req |
|---|---|---|---|
| Ambush / Shiv | rule pair | Backstab always crits on Staggered enemies / Backstab's cooldown −30% | none |
| Smoke Bomb | unlock | Unlocks Smoke Bomb | none |
| Choking Smoke / Vanish | rule pair | Smoke Bomb also deals damage over time / the Rogue can't be targeted during Smoke Bomb | Smoke Bomb |
| Nimble | stat | +8% attack speed | none |
| Pickpocket | unlock | Unlocks Pickpocket | Smoke Bomb |
| Sleight of Hand / Mark for Death | rule pair | Pickpocket's gold roll is doubled / the next hit from any hero on the pickpocketed enemy crits | Pickpocket |
| Cutpurse | stat | +15% gold | Nimble |
| Keen Eye | stat | +10% crit | Cutpurse |
| Heist | ult | For 8 s, every kill drops an item | 6 nodes |
| Autocast Backstab / Smoke Bomb / Pickpocket | autocast | See 2.3 | the skill |

### 2.3 Autocast (bought per skill)
- Once bought, a skill gets an autocast toggle: a small loop mark on its skill-bar well. Right-click the well
  to switch it on or off (the player may want to hold Bash for a SMASH). On by default after buying.
- **Autocast is deliberately dumb:** it casts the moment the skill is ready, on the default target. It
  ignores marks and combos, never holds a skill for a boss wind-up, and never casts an ultimate.
- It keeps firing through every away state (Excel up, switching, monitor off, hands busy): that's the point.
  A manual press still works on an autocast skill.
- Stuns and other in-game effects that stop a hero from acting stop its autocasts too.

---

## Step 3. Real life back on: stars and phone

If the stars and phone retune brief from earlier is already built, check it against this and only apply the
changes marked **new**.

### 3.1 Stars that reward greed
- Replace the current star logic with three separate goals; stars = how many are met. Unplugged is
  unchanged: 0 stars, half the bag lost.
  - **Deep:** the deepest floor reached in any run tonight >= tonight's target. **(new: any run)** Target =
    `max(STAR_DEEP_MIN, record + STAR_DEEP_OFFSET)`, fixed at the start of the night (*start* 3 and 0;
    raise the offset to 1 if it gets too easy).
  - **Unseen:** never caught tonight (forgiven catches and "of Charm" passes don't count).
  - **Sweet:** her Mood ends below `MOOD_RED`.
- **Tonight note:** three handwritten lines, no ★ / ★★ / ★★★ ladder, each with ✓ / ! / ✗:
  "floor N" (! until reached, then ✓ for good), "don't get caught" (✓, ✗ once caught), "keep her happy"
  (✓ green or yellow, ! red). Keep "⏻ 23:00+". Drop "deeper = better loot".
- **Results:** three named stars, lit or not. Near miss for Deep: "N floors short of tonight's target".
  Update the stars key. `bestStars` stays.
- **Morning rewards, one per star, on the Morning screen.** Loot only comes from the game, so only the RPG
  star pays in loot:
  - **Deep: a chest.** It rolls one item from the normal drop table at tonight's deepest floor. A full bag is
    handled the way the game already handles it.
  - **Unseen: Trust.** She never caught you, so she trusts you: the next night starts with Goodwill
    +`STAR_UNSEEN_GOODWILL` (*start* 20), closer to a Raid night (40) and a forgiven catch (60).
  - **Sweet: Breakfast.** She's happy, so she makes breakfast: sleep debt −`STAR_SWEET_DEBT` (*start* 1), so
    the next night starts less tired.

### 3.2 Phone: fewer events, each worth taking
- Replace the `INTERRUPT_INTERVAL_SEC` timer with a night script; each time ± about 15 game minutes. Aim for
  4 to 6 phone events before 01:00, the first no earlier than ~45 s into the night.

| When | Who | Answer | Ignore / decline |
|---|---|---|---|
| 20:30–21:30, once | Courier (call) | Your new gaming mouse: skill cooldowns −10% until dawn | No parcel |
| ~21:00, once + 1 callback | Mom (call) | Party fully healed, downed heroes revived | She calls your girlfriend (Mood, as now) |
| ~22:00, once (+ optional follow-up) | Boss (texts) | Overtime pay in zł, `BOSS_ZL` (*start* 50) **(new: zł, not gold)** | Nothing. No Mood effect (remove `BOSS_FAIL_MOOD` and the face-down Mood hit) |
| 1–2 a night, during the floor before a boss floor **(new)** | Friends (call) | Raid buff until that boss fight ends | Group chat ping, Noise (as now) |
| after 00:00 | Her texts | Unchanged | Unchanged |

- **Only calls buzz.** Texts arrive silently on the lock screen with a ~60 s deadline.
- **Short:** every event done in about 5 s, 1–2 taps. Boss: one row of sums. Mom: 1–2 beats (`MOM_BEATS`).
- **The phone is touch only:** every answer is a tap, a swipe or a drag with the mouse. Remove the 1 2 3 keys
  for Mom's replies and the boss's sums.
- **Speaker or pick up** on every call: Speaker keeps your hands free (keep playing, skills still castable)
  but adds Noise while the call lasts. Pick up = hands busy, as now.
- **Face-down = Do Not Disturb** until you flip it back. Everything silent; missed events count as ignored
  (Mom escalates to her).
- **Collision rule for everything from real life (phone, dog, her):** one demand at a time, at least
  `REAL_LIFE_GAP_SEC` (*start* 15) apart. No new phone event while footsteps are coming, while she's at the
  door or in the room, during a boss wind-up, during her shower, or during a calm window you earned (tea,
  Raid night, Text her). Scripted events slide later; they're never dropped.
- The dog stays as it is (cute, cheap, and the cable fix when you ignore him stays). He only follows the
  collision rule's spacing: his arrival slides later, he is never dropped.

---

## Step 4. Q4: the Excel clicker, and the Shop app

Tetris is removed (and the `EXCEL_*` Tetris constants and its gold). Excel is your job: working earns złoty
into the same wallet as the Auction House. It must be fun to touch, pay something on every action, level up
fast, and keep earning on its own while you're back in the RPG.

### 4.1 The screen
- Fills the game screen (474 × 232) as a Windows 98/XP Excel window. File name in the title
  bar: "Q4_report_FINAL_v3.xls".
- Shows: your job title and a progress bar to the next promotion, złoty per second, the Hustle meter, the
  toys (4.2) and a **Macros** ribbon tab listing the automation (4.3) with Buy buttons and costs.
- **Juice rules for every action:** responds in under 100 ms, has its own sound, a number pop with the zł it
  paid, and a small animation. Clicks feel physical: buttons depress, stamps thunk, cells tick.
- While Excel is up, the skill bar is blocked (as now) and the RPG is hidden (as now).

### 4.2 The toys (each one pays)

| Toy | Input | What happens | Pays (*start*) |
|---|---|---|---|
| Σ AutoSum | Click the big Σ (or Space) | The column's numbers roll for 0.4 s; 10% chance of a BALANCED stamp with a 2 px shake | `SIGMA_BASE` 1 zł; BALANCED ×5 |
| Fill flick | Drag the fill handle down and release | Cells fill in a cascade (40 ms per cell) with a tick each; a faster flick fills more cells, up to `FILL_MAX` 10; the column then resets | `FILL_CELL_BASE` 0.4 zł per cell |
| Sort | Click Sort | The column reshuffles like a split-flap board, clack-clack (0.6 s) | Everything (toys and macros) ×2 for 5 s; cooldown 10 s |
| Pivot spinner | Grab the pivot table and spin it (unlocks at Analyst) | Keeps spinning with momentum, friction slows it | `PIVOT_TURN_BASE` 3 zł per full turn |

### 4.3 Automation (Macros tab)
Levels; each level costs `base × 1.15^level`. All of it keeps running while you're in the RPG and in town
(pauses only when the game is paused, and between nights).

| Macro | Per level | Base cost (*start*) | Unlocks at |
|---|---|---|---|
| Intern | Presses Σ for you, +0.5 presses per second | 15 zł | start |
| AutoFill | Fills 1 cell per second | 50 zł | Junior Analyst |
| VLOOKUP | +25% per filled cell | 120 zł | Analyst |
| Conditional Formatting | +2% BALANCED chance (max 40%) | 200 zł | Senior Analyst |
| Pivot macro | The spinner turns on its own, +0.3 turns per second | 500 zł | Senior Analyst |
| Power Query | ×2 everything the macros earn | 2000 zł | Manager |

### 4.4 Promotions (the levels, fast)
- By lifetime złoty earned in Q4 (*start*): Intern (start), Junior Analyst 50, Analyst 300, Senior Analyst
  1,500, Team Lead 6,000, Manager 25,000, Director 100,000.
- Each promotion: all Q4 income ×1.5 (stacking), its unlocks from 4.3 (Team Lead: Sort cooldown −3 s), and a
  Windows 98/XP dialog "Congrats on your promotion!" with a confetti burst (1.5 s).
- Pacing target: the first promotion after about 30 s of clicking, then one every 1–3 minutes of mixed play.
- Q4 progress persists across nights.

### 4.5 How it connects to the rest
- **Hustle:** right after you switch to Excel (once the alt-tab lag ends), toy payouts are ×3, falling
  linearly to ×1 over `HUSTLE_DECAY_SEC` (*start* 15). It recharges while the RPG is on screen, full after
  `HUSTLE_RECHARGE_SEC` (*start* 30). Macros are not affected. Short stints (her visits) pay best; staying in
  Excel only pays the macro rate.
- **Looking busy** (FNAF 2's mask): while she's in the room and Excel is up, "busy" = any Q4 action in the
  last 2 s. Busy: her visit timer runs ×1.5 (she leaves sooner). Idle for 3 s: her timer pauses and her note
  reads "What are you working on?" until you act again. It never causes a catch by itself. Switching back to
  the RPG before she leaves still gets you caught, as now.
- **Noise:** each toy action adds `Q4_NOISE` (*start* 0.5; a flick 1, a sort 1.5). The Silent keyboard and
  mouse halves it.
- **Morning screen:** add "Q4 tonight: +N zł".
- The "of Greed" affix (+gold per kill while Excel is up) stays as it is.

### 4.6 The Shop app (phone)
- Tapping the idle phone opens a home screen with app icons: **Messages** (the existing menu: Text her, Raid
  night?) and **Shop** (new). Step 6 adds **Home**.
- The Shop lists items with price, effect, and owned or bought-tonight state. Buying is instant; the phone
  window is "hands busy" while open, as now.
- Real-life effects only. Starting list (*start* prices):

| Item | zł | Effect |
|---|---|---|
| Silent keyboard and mouse | 249 | Q4 actions make half the Noise (permanent) |
| Flowers | 89 | +20 Goodwill at once, a pink feed line (one use, buy again) |
| Dog chew | 29 | The dog's next visit comes 120 s later (one use) |
| Mini fridge | 599 | The Goblin Fuel scene skips the drawer step: a cold can is already on the desk (permanent) |
| Ergonomic chair | 899 | Tiredness builds 15% slower (permanent) |
| New phone | 2999 | Listed as "coming soon" until step 6 |

- Tune prices against Q4 income so Flowers are affordable on the first night with Q4 and the chair and the
  fridge take 2–3 nights.

---

## Step 5. The week (FNAF's nights)

- Nights are weekdays. Monday to Friday each add one new thing; Saturday is everything at once; from Sunday
  on, every night is a Custom Night.
- Keep the schedule as data (`NIGHT_SCHEDULE`) so it can be edited without code changes. Systems not yet
  introduced are off that night; the "How to hide" screen only shows tiles for what's on.
- **Proposed schedule (Paweł to confirm or edit):**

| Night | Adds |
|---|---|
| Monday | Her (peek and snack visits), Q4 |
| Tuesday | The Rogue joins (RPG), chat visits, the headset, the door moves (tea, towel) |
| Wednesday | The phone (the script from 3.2), the Shop app, Messages (Text her, Raid night?) |
| Thursday | The dog, cuddle visits, Tiredness and the Goblin Fuel button |
| Friday | She goes to bed: the wake-up meter, her texts after midnight, the Witching Hour |
| Saturday | Everything, and visits come `SATURDAY_VISIT_MULT` (*start* 1.3) times as often |
| Sunday and after | Custom Night |

- **Phone Guy:** at 20:00 each night a voicemail from Magoo plays as a short transcript bubble by the phone
  (2–3 lines in his chat voice: lowercase, casual) explaining tonight's new thing. Skippable with a click. It
  is not a phone event and is outside the collision rule.
- **Failing a night:** if she pulls the plug, you replay the same night ("Tuesday, again."). Any other ending
  moves to the next night. RPG progress always carries over.
- **Custom Night:** before the night, sliders 0–20 for Her, Mom, Boss and Dog (0 = off). Her: visit gaps and
  how early the footsteps warn you. Mom and Boss: how often. Dog: how often and how long he waits. Reward:
  Souls and drop luck × `1 + total / 40` (max ×3 at 80). Presets: 5/5/5/5, 10/10/10/10 and 20/20/20/20; a
  20/20/20/20 night ending with 3 stars gives a special badge on the title screen.

---

## Step 6. The smart home and the phone battery

Last before the playtest. These replace the placeholder pre-emptive moves.

### 6.1 Battery (FNAF's power)
- The phone starts every night at 100%. Smart-home actions cost battery (6.2); each call or text answered
  costs 1%.
- **Charge:** a "Charge phone" button on the phone's home screen sends you away from the PC for 15 s (away
  state, like the tea break: the empty chair) and adds 40%.
- **At 0%:** the phone is dead. No calls or texts arrive, the Home app doesn't work, and Mom's scripted call
  counts as ignored (she calls your girlfriend).
- Battery % shows in the phone's status bar and on the lock screen on the desk.
- **New phone** (Shop, 2999 zł): the battery drains 40% slower.

### 6.2 Devices (bought in Shop, used in the new Home app)
- **Home app:** the apartment plan with the installed devices on it; tap a device, confirm with its battery
  cost, see its cooldown.

| Device | zł | Battery | Effect |
|---|---|---|---|
| Robot vacuum | 899 | 10% | Start it in a room. If she's in that room or next to it, she goes to stop it: her next visit comes 45 s later. Cooldown 180 s |
| Smart speaker | 199 | 5% | Ring a timer in the kitchen or bathroom: she goes there to check it, her next visit comes 30 s later. From the 3rd use in a night, Mood +5 each time |
| TV cast | 149 | 4% | Only during her show's end cue: "Next episode" keeps her on the couch for another episode. Twice a night; the third time she notices: Mood +10 and she comes to your door |
| Door seal | 39 | 2% per toggle | Replaces the towel: the same effect and the same downside (no light under the door) |
| Bubble tea (order, not a device) | 25 per order | 3% | The doorbell rings 120 s later; she gets it and sits with it: no visits for 120 s. Twice a night |

- **Placeholders:** "Make her tea" and "Towel under the door" are removed (the Door seal and bubble tea
  replace them). "Text her" and "Raid night?" stay in Messages, unchanged.
- The bubble tea doorbell follows the collision rule (it slides later if needed).
- Update `NIGHT_SCHEDULE`: the Home app, devices and battery come in on Wednesday with the phone; Tuesday's
  "door moves" become the Door seal.

---

## Step 7. Before the playtest

- Debug off by default; "Real life off" stays in the debug panel only.
- Save key `v2`, fresh saves for testers.
- Version bump on the title screen.

---

## Open (ask Paweł, don't guess)

1. Decided: the Rogue is Garrote.
2. Node names are placeholders; the effects are the spec. Skill names are decided: the ones in this doc,
   simple and tied to the class theme.
3. The week schedule in step 5.
