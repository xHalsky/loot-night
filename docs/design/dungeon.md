# Dungeon: party, battle, floors

## Now

**Party.** Four heroes from night 1 (#96), persistent across nights (data: `src/data/heroes.ts`,
`HERO_NAME`): Knightenstein (Knight, tank, in front, carries the torch: you), **Garrote** (Rogue, #52 1.7), Magoo
(Mage) and Healero (Healer), the characters of your friends Danny and Mike. A save from before Garrote was in from
night 1 gets him at the next night, second in line, at the party's lowest level, with a feed line. Whoever walks in
front picks up the loot by walking over it (#95; see Loot drops in [loot.md](loot.md)), so no role line says it.
Party and guild chat use the character names, as an MMO would; the friends' phone calls use their real names. Garrote's colour is ember (`#c16229`); Z, X and C light up ember on the desk keyboard.
Stats: HP, attack, armor, speed, crit, luck; level and XP; six gear slots (weapon, helm, armor, boots,
ring, trinket). Old saves are renamed on load.

**Floors** (#52, 1.3). Endless. A floor is walk, encounter, walk, encounter, walk, encounter, then the floor end
(`BATTLES_PER_FLOOR`, 3). Every `CHECKPOINT_EVERY` (5th) floor is a boss floor: two encounters, then the boss.
**An encounter is a pack:** `PACK_MIN` + floor / 2 enemies (5 on floor 1, at most `PACK_MAX` 12), six on screen
(`src/core/arena.ts`): fodder in two close lanes (front x 186, 226, 266; back x 205, 245, darker), a boss or a caster
(the Shaman) behind them on the party's lane. The rest wait off screen and step into a free rank as the front ones
die (`STEP_IN_SEC`, 0.6 s, sliding in). A pack member has `PACK_HP_MULT` (1.25) of a lone enemy's HP and
`PACK_ATK_MULT` (0.7) of its attack (tuned in 0.59, #52 1.9: the good bot's fights take 9 to 12 s against the 8 to 12 s
target, and its night-1 runs end on floors 5 to 10, the Ogre on floor 5 now a real wall).
Enemies compound per floor (1.2); levels add `HERO_LEVEL_SCALE` (+4%) and the gear has to keep up
([loot.md](loot.md), #49). **Who they hit:** Taunt takes everything (everything hits the Knight, wherever he
stands); otherwise melee hits the front living hero (70%) or the next, the Shaman hits ranks 3 and 4, bats hit anyone
(ranks: the marching order below). Monday's dungeon is the Shadow Crypt
(`src/data/enemies.ts`). When a boss dies, the enemies still standing run. Enemy ids are older than their
names (`collector` = Orc, `auditor` = Shaman, `shelter` = Guardian, `junk` = Imps, `bailiff` = Ogre, `shark` =
Warlock, `landlord` = Black Knight; boss moves `slam`, `loan`, `evict`); saves and tests key on the ids.

**Enemies.** Three plain ones (Skeleton, Bat, Orc) and three that each ask for a
different answer, joining from floors 2, 3 and 4. The first time you meet one, a line says what it wants.

| Enemy | From | Role | Answer |
|---|---|---|---|
| Shaman | floor 2 | Heals the most hurt friend under `AUDITOR_HEAL_BELOW` (75%) for `AUDITOR_HEAL` (60%) of his own max HP instead of attacking | Frost goes for him first; the mage's auto Bolt picks the weakest, often him |
| Guardian | floor 3 | Shielded: takes `SHIELD_TAKEN` (25%) damage until a Bash breaks the shield | Bash (it goes for a shield before the front enemy), then burst |
| Imps | floor 4 | A swarm of 5 imps; each single hit takes one imp at most, and every imp bites when it attacks | Fire and Cataclysm hit every imp; Taunt soaks the bites |

| Ghoul | floor `LINE_BREAK_FROM` (6) | Hook (marching order below) | Drag the hooked hero back, or kill it during the 1 s wind-up |
| Brute | floor 6 | Shove (marching order below) | Drag the front hero back |

Skill targeting: Bash goes for a winding-up boss, then a shield, then the front enemy; Frost goes for a
healer, then the front enemy; Backstab hits the front enemy.

**Bosses** rotate per checkpoint floor: floor 5 the Ogre, 10 the Warlock, 15 the Black Knight, then around
again with floor scaling. Each has its own telegraphed move: a cast bar at the top centre and the skills
that answer it pulsing red. The floor map names the boss in the margin note of the boss floor's path.

| Boss (HP / attack at floor 1 scale) | Move | Answer |
|---|---|---|
| The Ogre (1700 / 28) | SMASH, every 2nd action: everyone loses 60% | Bash interrupts (then he braces), Ward halves, Taunt pulls it onto the knight |
| The Warlock (1700 / 28) | Every `LOAN_EVERY` (3rd) action, a 2 s SUMMON: a friend (Shaman or Imps) joins; a friend still standing is EMPOWERed instead: full HP, x`LOAN_REFI` (1.3) attack | Kill the friend before the next summon: Fire, Cataclysm, Frost on the Shaman |
| The Black Knight (1600 / 26) | Starts behind a shield. Every `EVICT_EVERY` (3rd) action, a 3 s EXECUTE on the rank of the most hurt hero ("Execute · rank 4"): whoever stands in that rank when it lands loses `EVICT_PCT` (90%) of max HP. Afterwards the shield comes back | Taunt (the knight takes 55% instead), Ward halves, swap a sturdier hero into that rank, Last Stand or Miracle after; Bash the shield off again |

**Boss big attack: SMASH** (the Ogre). Every `BOSS_SLAM_EVERY` (2nd) boss action is a wind-up instead of a hit:
a boss cast bar at the top centre of the screen (MMO raid style, outside the camera) fills over
`BOSS_WINDUP_SEC` (3 s) with a low rising sound you can hear from Excel. Then every hero loses
`BOSS_SLAM_PCT` (60%) of max HP. Three answers, one per hero:
- **Bash** (knight) interrupts it, but then the boss is **braced**: his next SMASH cannot be interrupted;
- **Ward** (healer) halves it (`BOSS_SLAM_WARD_MULT`);
- **Taunt** (knight) pulls it onto the knight alone (`BOSS_SLAM_TAUNT_PCT` of his max HP).
So a boss fight is a rotation: Bash, then Ward or Taunt, then Bash again. On Excel during a wind-up,
nobody answers.

**Fury (Monday's mechanic, the red FURY +x% tag).** An enemy alive more than `FURY_AFTER_SEC` (10 s) deals
+`FURY_PER_SEC` (3%) per extra second. Rewards burst.

**Battle, in real time** (#52, 1.2). Side view, heroes left, up to 3 enemies right. Every unit attacks on its own
timer: attack interval = `BASE_ATTACK_SEC` (1.2) × 10 / speed, so speed 10 attacks every 1.2 s. Stuns are seconds
(Bash: `BASH_STUN_SEC`, 1.5 s). Auto attacks are not skills: Knight slashes the front enemy, Mage bolts the weakest,
Healer heals an ally under `HEALER_AUTO_HEAL_BELOW` (60%) HP or smites, Garrote stabs the front enemy. At max Flow the party attacks `FLOW_SPEED`
(25%) faster, linear from Flow x1. Numbers compound (#52): enemy HP x`ENEMY_HP_GROWTH` (1.15) and attack
x`ENEMY_ATK_GROWTH` (1.15) per floor, item attack, HP and armor x`ITEM_POWER_GROWTH` (1.12) per item level (speed,
crit and luck stay linear); big numbers show as 1.2K, 34.5K, 1.2M. Floating
numbers, crits in gold, every action has a visible effect (lunge, slash arc, bolt, beam, claw marks,
shockwaves, sparks).

**Skills: three slots per hero, two skills and the ultimate** (#52; decisions 2026-11-20). Skill 1 from the start,
skill 2 and the ultimate from the skill tree ([trees.md](trees.md), #53). The third key is the ultimate: a charge that
fills over `ULT_CHARGE_SEC` (20) seconds of combat once it is bought, only during fights; cast it when full, never
automatically. 4, R and F stay dark.

| Hero | Skill 1 | Skill 2 (the tree) | Ultimate (the tree) |
|---|---|---|---|
| Knight (1, 2, 3) | Taunt: enemies hit the knight for 5 s, marks them Taunted | Bash: 2x to the front enemy, 1.5 s stun, Stagger; interrupts SMASH | Last Stand: for `LAST_STAND_SEC` (6 s) no hero can drop below 1 HP |
| Rogue (Z, X, C) | Backstab: 3x to the front enemy, x`MARK_STAGGER_BACKSTAB` (2) on Staggered (spends it); cd 8 | Smoke Bomb: enemies miss `SMOKE_MISS` (50%) of their attacks for `SMOKE_SEC` (4 s); big moves still land; cd 14 | Heist: for `HEIST_SEC` (8 s) every kill drops an item |
| Mage (Q, W, E) | Fire: 1x to every enemy | Frost: 2.6x to the front enemy, Chill | Cataclysm: `CATACLYSM_POWER` (8x) to every enemy, double on Staggered or Chilled |
| Healer (A, S, D) | Mend: heals the party | Ward: 40% less damage for 6 s | Miracle: revives every downed hero and fully heals the party |

Garrote's auto attack (Stab) hits the front enemy. His stats (*start*): HP 85, attack 12, armor 3, speed 13,
crit 12, luck 5. Pickpocket is not in the kit: Heist covers its ground (decisions 2026-11-20).

**Marching order** (#52, 1.6; grid doc §5d; rules `src/systems/ranks.ts`). The party walks and fights in one line,
rank 1 at the front (right in the picture, left in the skill bar); a hero's rank is his place in the party. Defaults:
Knight, Garrote, Mage, Healer. An old save gets the default once (`orderSet`; and again when Garrote joins it);
after that the order is the player's and carries over from night to night.
- **Home ranks** (`HOME_RANKS`, data per hero so tree nodes can change them): Knight 1 to 2, Garrote 1 to 3, Mage 3 to
  4, Healer 2 to 4. Outside them a hero deals and heals `OUT_OF_RANK_MULT` (x0.7); a crimson "x0.7" tab sits on his
  portrait, and "out of position" floats over him when he lands there.
- **Auras** (a neighbour's buff; a downed hero gives none). Shown as glyphs on the skill bar's pilasters in the
  giver's class colour, and on the hero's card.

| Giver | Goes to | Gives |
|---|---|---|
| Knight (shield wall) | the hero behind him | takes `AURA_KNIGHT_TAKEN` (25%) less damage |
| Garrote (keen eye) | the hero in front of him | +`AURA_ROGUE_CRIT` (10) crit |
| Magoo (haste) | the hero in front of him | `AURA_MAGE_CD` (10%) shorter cooldowns |
| Healero (blessing) | the heroes in front and behind | regenerate `AURA_PRIEST_REGEN` (1%) max HP a second in the dungeon |

- **Swap:** press on a hero's portrait or his sprite and drag onto another. The portrait lifts under the pointer,
  the target's portrait gets a marching gold frame, both heroes a gold ring on the floor. On the drop they walk past
  each other for `SWAP_SEC` (1 s) without acting (no attacks, no skills; their wells dither with "swap"). In town
  the order changes for free: drag one party card onto another in the side panel's Inventory tab (the cards work
  the same in the dungeon). A click without a drag selects the hero.
- **Enemies that break the line** (from floor `LINE_BREAK_FROM`, 6; `LINE_BREAK_CHANCE` 35% of encounters, never
  with a boss): a Ghoul or a Brute joins the pack. Its move comes on its 2nd action and then every 4th, after a
  `LINE_BREAK_WINDUP_SEC` (1 s) cast that names the rank: **Hook · rank 4** (a chain drags the last hero to the
  front, the others step back one) and **Shove · rank 1** (the front hero is knocked back, swapping with rank 2).
  Everyone who moved walks for `SWAP_SEC`. Away, the line stays broken: fixing it is a reason to look.
- **Hovering a hero** opens his card over his head: "Healero · rank 1", a crimson line for what is wrong ("Out of
  position: heals at 70%. His ranks are 2 to 4."), a moss line for what his aura gives and to whom, and a note
  ("Drag him back. Away, the line stays broken."). The side panel's hero tooltip says the same.
- `npx tsx test/ranks.ts` checks the default order, an old save getting Garrote, home ranks, the auras, swaps, Hook and Shove,
  EXECUTE by rank, Smoke Bomb, Heist, Backstab and when the breakers come; `python3 test/ranks.py` shoots it.

**Curios in the corridor** (#30, the RPG's third verb; content `src/data/curios.ts`, rules
`src/systems/curios.ts`, numbers `CURIO_*`). On a battle floor, `CURIO_PER_FLOOR` (1 or 2) of the walks have a curio
(none on vault or shrine floors, no repeats among the last three). It stands in the corridor (#99): it comes into
view off the right edge as the walk starts (`CURIO_ENTER_X`), the party walks up to it at `CURIO_PACE` and stops with
it at `CURIO_STOP_X` once the loot ahead is picked up. A parchment card names it and offers two choices, each with
its real-life cost on the button, so the question is "can I afford this right now, given where she is?". The party
waits `CURIO_WAIT_SEC` (7 real seconds), then walks past; the ✕ or "walk past" leaves at once. Curio time is your
time: the night clock runs, the battle does not. After the choice the curio stays where it stands and the party
walks on past it at the hurry pace (`WALK_HURRY_PACE`); it goes by behind them (drawn on its row behind the party,
its glow dimmed) and the next fight starts once it is off the left edge (`CURIO_GONE_X`). The troll gets up into the
fight instead. `python3 test/walk.py` checks and shoots it.

| Curio | Choice A | Choice B |
|---|---|---|
| Locked chest | Pick the lock: 8 s standing still, quiet | Smash it: instant, Noise +25 |
| Sealed coffin | Open: Noise +5; 50% gold (20 x floor), 30% a rare, 20% a curse (party -15% damage until the next floor) | Leave it |
| Snoring troll on a loot pile | Sneak: 6 s on the RPG screen; alt-tab (or the monitor going off) wakes him | Fight: a mini-boss (330 HP at floor 1 scale), Noise +15 |
| Guild bank vault | Take one item: a free rare; 40 to 90 s later Magoo reads the log in guild chat and sulks (mage -20% damage for 45 s) | Close it |


**Run blessings** (#52, 1.5b; `src/data/blessings.ts`, numbers `BLESS_*`). Curios are their only source. A
blessing lasts until the run ends (banked or wiped), stacks with itself, and every one has a cost that reaches real
life or the run. Each of these curios offers its bargain and "Leave it" (away, the party takes the bargain
`CURIO_AWAY_RECKLESS` of the time, cost included). In the buffs row a blessing is the curio's icon in a dashed frame
with "run" (x2 when stacked), right-most; hovering says what you got and what it cost; the run end card lists them.

| Curio | Bargain | Run blessing | Cost |
|---|---|---|---|
| Wayside Shrine | Pray | +20% damage | The bell rings: Noise +15 |
| Pilgrim | Swear his oath | Cooldowns -15% | No town portal until the next boss is dead |
| Supply Cart | Eat the rations | +25% item drops | Party max HP -10% |
| Potion cart | Shake it | 50/50: +30% healing, or broken glass (the party loses 10% HP now) | Noise +15 |
| Blood Altar | Bleed on it | +30 crit | Heroes lose 1% HP a second outside fights (never below 1) |
| Moonwell | Drink | Ultimates charge 40% faster | Flow drops to x1 |
| Ritual Circle | Join the chant | Souls +50% | Enemies +20% HP |

Strongbox and troll both pay 2 items (the first rare or better); the troll fight adds normal battle drops.
His fight is not one of the floor's three battles and never counts as the boss. Away when the party reaches
a curio: `CURIO_AWAY_RECKLESS` (50%) of the time they do the loud thing themselves (smash, open, pray,
fight, withdraw, kick, with a party line), otherwise they walk past.

**Ability marks** (`src/data/marks.ts`, numbers `MARK_*`). One skill marks an enemy, another cashes the mark
in, so the order you fire skills in matters:

| Mark | Put on by | Cashed in by | Payoff |
|---|---|---|---|
| Staggered | Bash | Fire | That enemy takes x`MARK_STAGGER_FIRE` (2) from Fire |
| Chilled | Frost | Bash | Shatter: x`MARK_CHILL_BASH` (2.5), then Bash staggers it |
| Judged | the healer's auto Smite | any skill hit (auto attacks don't) | Heals the most hurt hero for `MARK_JUDGED_HEAL` (30%) of the damage |
| Taunted | Taunt (all enemies, as long as the taunt) | Ward | With Ward up, its hits bounce `MARK_TAUNT_REFLECT` (50%) back |

Marks last `MARK_SEC` (6 s). So the long chain is Frost → Bash (shatter, stagger) → Fire (x2) → Cataclysm (double). On a boss
it collides with the wind-up: Bash spent on a shatter is not there for SMASH. A mark shows as a small
coloured tag above the enemy's HP bar, its line shrinking as it runs out; its name floats up when it lands
and the payoff floats up when it is cashed in. A skill that would cash in a mark right now glows gold on the
skill bar with a badge (x2, x2.5, ↩).

Skills **cast instantly** on click or key, with no global cooldown; only their own cooldown applies
(shortened by the Library). Outside a fight the key says "No enemies in reach". Each cast adds
`NOISE_ABILITY` (3.5). A multi-hit skill (Fire, Cataclysm) is one noisy moment: its crits add Noise once. Skills are blocked while switching screens, while a minigame has your hands, and
during microsleeps.

**Teaching the skills.** Hovering a skill shows its name and hotkey and one line on what it does in this hero's
current numbers (`tip` in `src/data/heroes.ts`: damage, heal, duration and the one combo that matters); locked
skills add their unlock level. The cooldown shows on the button itself. Hovering a portrait shows the hero's
name, class and role in one line. (Tooltips carry only crucial information: [screen.md](screen.md).)
During a boss wind-up, the skills that answer it pulse red (Taunt, Ward, and Bash unless the boss is braced),
so the game teaches the answer in the moment. Skill numbers (`power`, `flat`, `dur`) live in
`src/data/heroes.ts` and are read by both the battle code and the tooltip, so they cannot disagree.

**Skill bar** (dungeon screen only, Infinity Engine style): a stone-and-gold bar along the bottom of the battle
area with a framed portrait per hero (vertical HP gauge, the one HP readout outside the battle; no name, the party
cards carry it; click to select in the side panel), then that hero's skills with glyph, hotkey (10 px), cooldown
sweep and level lock. The auto attack has no button.

**Choosing the way down: the route choice** (#52, 1.5; grid doc §5b; `src/data/routes.ts`). When a floor ends,
the battle area shows the floor map on vellum: the run so far down the left (the last four floors as gilded roundels,
boss floors crimson, the last one "you are here" in a red-ink ring), and a fork from there to each candidate room,
pencilled with its icons until you hover its card. Under the map, 2 path cards (`PATHS_EARLY`, up to floor 5) or 3
(`PATHS_LATE` from floor `PATHS_LATE_FROM`), one before a boss floor. Each card shows the floor, a **feature** row
and a **condition** row ("no feature", "no condition" when empty), the danger as 1 to 3 skulls. Hover a card: its
road inks itself, the room gets the floor's numeral, and the margin writes its full text with a + for what you get
and a - for what it costs. Click the card (or its room) to go down.
- **Features** (`NODE_FEATURE_CHANCE` a card): what stands on that floor. Six are curios with a run blessing
  (Wayside Shrine, Pilgrim, Supply Cart, Blood Altar, Moonwell, Ritual Circle), the Locked Chest is the strongbox;
  each is sure to stand on the floor, in place of one of the random curios. Elite Pack and Goblin Den turn the floor
  into that map's floor.
- **Conditions** (`NODE_CONDITION_CHANCE` a card): change the whole floor, and every one pays.

| Condition | Danger | Pays | Costs |
|---|---|---|---|
| Silent Halls | 1 | crits and skills make no Noise | drops -`COND_SILENT_DROPS` |
| Haunted | 1 | ultimates charge +`COND_HAUNTED_ULT` faster | every kill +`COND_HAUNTED_NOISE` Noise |
| Flooded | 2 | drops +`COND_FLOODED_DROPS` | cooldowns +`COND_FLOODED_CD` |
| Pitch Dark | 2 | gold +`COND_DARK_GOLD` | enemies hit +`COND_DARK_ATK` harder |
| Swarming | 2 | Souls +`COND_SWARM_SOULS` | packs +`COND_SWARM_PACK` bigger |
| Cursed | 3 | the Cursed Floor (every drop one rarity better) | your heals do half |

- **Maps from loot** add their own card (the map's name in its rarity colour, "uses your map"); at most
  `PATHS_MAX` cards fit, so a map's card takes a generated one's place (one generated path always stays). A map
  card has no road on the map: hovered, it shows as a dashed red route.
- **Away.** The hourglass marks the safest card (no condition first, then the lowest danger, at random among
  equals, never a map). Off the game (`isAway()`: Excel, mid alt-tab, at the door, a minigame) for
  `MAP_AWAY_SEC` (5 s) in all, the party takes it and says so in the Feed. The time adds up and does not reset when
  you glance back; the footer counts it down. The clock keeps running at its slow map pace meanwhile.
- The card and margin texts are built in `routes.ts` from the tuning numbers (the renderer's own texts are only
  the mockup's). `npx tsx test/routes.ts` checks every feature and condition and the away rule;
  `python3 test/dmap.py` shoots the map (three paths with a map card, a condition, away, the boss floor).

Maps (dropped as loot, 8% per drop):

| Map | Effect |
|---|---|
| Elite Pack | Enemies ×`ELITE_MULT`, a guaranteed rare |
| Shrine | Full heal and revive, no battle, no loot |
| Treasure Vault | No battle, `VAULT_DROPS` items, +`NOISE_VAULT` Noise |
| Cursed Floor | Your heals do `CURSED_HEAL` (half); every drop is one rarity better; violet fog |
| Goblin Den | A loot goblin after every battle; each catch gives `GOBLIN_DEN_DROPS` items and +`GOBLIN_DEN_NOISE` Noise |


**Runs** (#52, 1.4; `src/systems/run.ts`). A run starts at the Dungeon Portal in the city, at floor 1 or any
checkpoint you unlocked (the side panel's ◀ floor N ▶ by Enter the dungeon). Beating the boss of floor 5n unlocks
starting at 5n+1, for good (`S.g.checkpoints`), and gives `SOULS_PER_BOSS` (20) Souls. The run goes floor after
floor until the town portal (the run is banked) or a wipe (it is lost). Items and gold picked up in a run are
**unbanked**: a dashed mark on their bag cell, and the town portal plate says what it banks ("bank 7 · 420 g"),
in the battle corner and on the floor map; with nothing to bank it says "15 min". The plate is as wide as that
line and drawn in two flat bands (the name on arcane, the line on deep dusk), so neither sits on a dither.
Floor bounty and the other RPG gold go to the run first. Each floor cleared gives `SOULS_PER_FLOOR_BASE` + floor
Souls; Souls go straight to the pool and are never lost. **When the night ends mid-run,** your choice banks and a
forced end loses: Sleep (and "Coming, babe" when it lands, which ends the night like Sleep) banks the run, what lies
on the floor included; dawn, unplugged and any other forced end (Monday's 01:00 in the week, #56) lose it like a
wipe, Souls kept, floor loot gone. The feed warns once of each while a run is going: `RUN_WARN_DAWN_MIN` (15) game
minutes before dawn, and when her Mood reaches red. The results say what the run banked or lost. A run end card
shows for `RUN_CARD_SEC` over the city: the deepest floor, what was banked or lost, the Souls.
`npx tsx test/runend.ts` checks the three endings and the warnings.

**Downed and wipe.** At 0 HP a hero is downed and stops attacking. Downed heroes return at 30% when the floor ends,
or via a Phoenix Feather from the bag (50%), or Miracle. All down = **PARTY WIPE**: the run's unbanked items (worn
ones and locked ones too) and gold are lost, its Souls stay, and the party wakes in the city at full HP after the
portal's 15 minutes. He still slams the desk (Noise, the dog comes to see).

**Loot goblin.** `GOBLIN_CHANCE` after a fight; runs across the battle area for 6 s; click it for 3 drops, one
rare or better.

**The Shadow Crypt, in the redesign's look** (V2, #67; grid doc §3 to §5). The battle area is drawn by the
redesign's renderer (`src/render/page/live.js` from the view model in `src/render/rpgView.ts`) on the 334 × 232
grid: a 64 px band where the curio card opens, the 142 px picture, the 26 px skill bar. The dark baroque ossuary in
Moonwell 32, Bayer-dithered: far catacomb, the ossuary arcade, a perspective floor, ground mist, a foreground pillar
pinned to the left edge in battle, warm candles against cold moonlight. The party walks in rank, front on the right
(knight x 126, then 35 px apart); actors get the separation pass (fill light, rim, outline, halo). Enemies stand in
the front lane (x 186, 226, 266), a boss behind them on the party's lane. The page's rigs stand in for the skeleton,
the guardian (skeleton with helm and shield), the orc (zombie with a sword) and the shaman (necromancer); bats, imps,
the bosses, curios and the goblin are the prototype's pixel sprites, lit and dithered like the rigs, until Paweł's
art. Over the scene: HP bars, mark tags, the cast's name with its bar, floating numbers, loot lying in its rarity
light with the beam, the names flying up; the corner (where, Flow in yellow), the town portal plate, the buffs, the
skill bar (portrait, HP tube, two skill wells and the ultimate's gilded well; cooldown sweeps, the answer pulse, the
combo glow, "L3" on a skill still locked). Every action shows: slashes, claws, bolts, fire, frost, heal sparkles,
Ward's and Taunt's rings. **Melee hits swing the weapon** (#97, `SWING_SEC`): the Knight's Slash and Bash take
the sword off his shoulder, up behind the helm, over the top and down at the enemy, drawn over his shield; Garrote's
Stab and Backstab cock the dagger low and cut up and forward. Both leave a bright crescent smear along the edge for
the cut, bigger than Garrote's dagger so it reads from rank 2 over the Knight's back. Casts and the ranged heroes
keep the lunge (`python3 test/swing.py`). It redraws at 30 fps (about 22 ms a frame in headless Chrome, F1 shows it). The floor map is
drawn by the same renderer; the town is still the old drawing (V2 continues).

**Away from the game** (`src/systems/autopilot.ts`, #52 1.2). When you *chose* to leave the game (Excel up,
mid-switch, a minigame window open, or cables out because you ignored the dog), nobody casts the skills or the
ultimates: the party fights on with its auto attacks (bought autocasts will fire in #53). Her desk visit and the
monitor she switched off are forced on you, so they don't count. Party chat complains in the Feed ("Magoo: afk
again? pulling"), and the Loot Night taskbar button flashes orange like a Windows app wanting attention when party
HP is under `AUTOPILOT_FLASH_HP` or a hero is down. Measured by `test/autopilot.ts` with packs (0.53; 40 s on Excel,
30 runs): the boss on floor 10 wipes 30/30, floor 15 18/19 (watching, it is still 12/19: the Black Knight is the
wall); normal floors 3 and 8 wipe 0/30 and end at 71% and 64% party HP.

**Town portal.** The plate at the top left of the battle area, under the corner overlay (between fights): back to
the city, 15 min, banking the run.

**Floor bounty** (0.40): clearing a floor pays `FLOOR_GOLD_BASE` + `FLOOR_GOLD_PER` × floor gold (floor 1: 8,
floor 10: 35; about 180 a normal night), shown in the feed. Steady income besides selling drops
([city.md](city.md)).

## Decisions

- **Pacing tuned to the 1.9 targets** (0.59, #52 1.9). Fights were a little long and the floors too safe: night-1 runs
  went to floor 6 to 9 and never wiped. Pack HP down (x1.25 from x1.4), pack attack up (x0.7 from x0.5), enemy
  attack growth up (1.15 a floor from 1.12). Measured with the good bot: fights 9 to 12 s, items every 3 to 5 s, the
  first legendary on night 1; night-1 runs now end on floors 5 to 10, often wiping (the floor-5 Ogre is a wall now,
  the floor-10 Warlock wipes a careful party 6 times in 30). The target of runs ending on floors 3 to 5 is not met:
  the bot reacts instantly and never looks away from a fight it can see, so a player should stop earlier; pushing
  enemies harder for the bot would make night 2 and later a wall. Rejected for now: a steeper curve (waits for the
  playtest, with longer floors as Paweł expects, #80).

- **A night's end and the run** (0.57, #52 1.4; Paweł, 2026-11-24): going further in the RPG always carries a risk;
  short runs give less, long risky ones more. So your choice banks (Sleep) and a forced end loses the unbanked run
  (dawn, unplugged, a night's scheduled end), with a warning before each. Unplugged keeps its old cost on top (the
  cheaper half of what is left in the bag, handoff 3.1). Rejected: everything banks (0.53 to 0.56: Sleep was a free
  portal, so the last run of the night carried no risk, just when real life is most dangerous); only the portal banks
  (every night would end "portal, then Sleep", a chore rather than a choice); the run waits for the next night (it
  clashes with each night opening in town and one dungeon a night, #3).
- **Marching order** (0.56, #52 1.6; Paweł approved the mockups on 2026-11-20). A hero's rank is his place in the
  party list, so the picture, the skill bar and the rules read one order. Rejected: a rank field per hero (two
  orders to keep in step). **EXECUTE names a rank, not a hero:** whoever stands there when it lands takes it, so a
  swap is an answer, as in Darkest Dungeon (following the hero would make the swap pointless). **A swap costs 1 s
  without acting** for both heroes (and everyone a Hook or Shove moves), so fixing the line is a choice in a fight,
  not a free click. The breakers act on a schedule (2nd action, then every 4th) after a 1 s cast that names the rank,
  so you can see it coming; rejected: a random chance per action (unreadable). Night 1 now starts Knight, Healer,
  Mage: the Mage's home ranks are 3 to 4. Healero's blessing works in the whole dungeon, walks included (between
  fights is where regeneration matters, and it eases the Blood pact for his neighbours).
- **Garrote from night 1** (0.87, #96; Paweł after the first playtest: three heroes on Monday read as one missing).
  He joined on Tuesday (0.56 to 0.86, #56) so each night added one thing; Tuesday still has chat visits, the headset,
  Tiredness, the night past 01:00 and lean in, so it lost little. Monday with four (12 nights each, good bot): depth
  5.7 to 6.0, wipes 0.25 to 0; the idle bot is still caught (2.4 a night). Rejected: keeping him for Tuesday with a
  bigger entrance. A save that lacks him gets him at the party's lowest level: at level 1 he would be dead weight on
  the deeper floors. Two skills and Heist (Pickpocket was dropped with the other second unlocks, decisions 2026-11-20).
  Stand-ins until Paweł's art: the Ghoul on the zombie rig, the Brute is the old Ogre sprite at fodder size.

- **The RPG plays it straight** (0.43, #44): plain fantasy names (WoW and D&D tropes) for the party, enemies,
  bosses, skills, items, curios, the town (Ravenhold) and the dungeon (Shadow Crypt), so the real-life half
  carries the jokes and the contrast does the work. The first roster was a debt joke (Debt Skeleton, the
  Auditor, Junk Mail, the Bailiff's FINAL NOTICE, the Landlord's EVICTION); it read as one more joke on a
  screen already full of them, and the long names cost reading time mid-fight. Names are one or two words;
  boss moves are one word in capitals (SMASH, SUMMON / EMPOWER, EXECUTE). Mechanics did not change.
  Rejected: keeping the jokes in flavour text only (the names are what you read); renaming the ids too
  (breaks saves and tests for no player gain). The party chat keeps its gamer banter: that is the friends
  talking, not the game.
- **Instant skills stay instant** (decided in the balance pass, 0.40, #2): with no global cooldown the bot
  reaches floor 9 to 10 by 01:00, which is the depth a normal night is tuned for; the noise from skill spam is
  already priced (`NOISE_ABILITY` 3.5, loud multi-hit skills once per cast) and wakes her 1 to 2 times a
  night. Rejected: longer cooldowns (the party would feel slow on the screen you are risking it all for) and
  more Noise per skill (the bed phase would end in a wake-up every time).

- **Run blessings replace the short curio buffs** (0.54, #52 1.5b). A buff that ran out in 30 to 60 s was decided by
  the clock, not by the run; a blessing that lasts the run and has a real cost makes the curio a bet on how far this
  run goes. The green flame's can offering and the potion cart's "Pay" are gone (the bargain and "Leave it" only).
- **Packs, runs and banking** (0.53, #52 1.3 and 1.4). Encounters are packs of six on screen with the rest waiting,
  so a fight reads as a mob; drops come per kill where the enemy fell, and the walk picks them up (the loot pause is
  gone). The corpse run is gone: a wipe now costs the run's unbanked loot, which makes the town portal a choice
  (bank now, or push for the next floor). The unbanked count sits on the town portal plate,
  not as a fourth corner line: on the grid there is no room under Flow above the plate, and the portal is what
  banks it (Paweł kept it there, 2026-11-24, with the plate widened: at 54 px "bank 12 · 1240 g" spilled over
  its edges and the gradient's dither ran under the second line; the trip's 15 min moves to the tooltip while
  the run holds something). Rank targeting (melee on ranks 1 and 2) came early with the packs: six attackers hitting at random wiped
  the back row.
- **Real-time combat, three slots, ultimates on charge** (0.51, #52 1.2). The ATB turns were already timers; now
  each unit attacks on `BASE_ATTACK_SEC` × 10 / speed, about 2.8x the old pace, and turn counts are seconds. The
  third skill (Rally, Storm, Revive) is gone: the skill bar has no room for four wells (decisions 2026-11-20), and
  each ultimate covers the dropped skill's ground (Last Stand Rally's, Cataclysm Storm's, Miracle Revive's). The
  reckless autopilot is gone too: away now simply means no skills, so watching is what pays. Rejected: keeping the
  autopilot penalties on top (with no skills away was already punishing; 40 s on Excel during a boss still wipes).
  Item growth compounds only for attack, HP and armor; speed, crit and luck stay linear (percentages would run
  away). Until the trees (#53) the ultimates need only their charge.
- **Instant skills, no GCD** (0.13). Waiting for the hero's turn felt unresponsive. Side effect: the bot
  reaches about floor 10 by bedtime (was 5 to 7) and skill spam can wake her. Open: #2.
- **Tooltips over a manual** (0.19): the RPG is half of a split-attention game, so skills are taught at the
  point of use (hover, and the pulsing answers during a wind-up) rather than in a help screen.
- **No auto-attack button.** It was always on, so the button was noise. Keys start at 1 / Q / A.
- **Knight in front with the torch**, so the light leads the party, and the front hero picks up the loot.
- **The front hero walks over the loot** (0.87, #95; Paweł after the first playtest). From 0.53 a looter (Garrote, or
  the Knight on night 1) ran ahead of his rank to each drop and back; it read as the Knight breaking ranks after every
  fight. Now the drops scroll in with the floor and the first standing hero picks up what reaches his feet; after the
  floor's last fight the party still walks forward, out of the floor, over the drops. Rejected: a pickup pause, and
  the drops flying to the bag on their own (nobody walks over anything).
- **Curios stand in the corridor** (0.87, #99; Paweł after the first playtest): they used to pop up halfway through
  the walk and vanish after the choice. Walking up to one and past it costs about 4 s a curio; the hurry pace on the
  way past keeps it short. Rejected: starting the next fight while it is still behind the party (it would stand
  frozen at the left edge for the whole fight).
- **Floor choice on a map** instead of a list in the right panel: the choice reads as a route.
- **The whole descent on parchment** (0.44, #48; replaced by the route choice in 0.55): the old node map showed only the next row, upward, so it
  never felt like going down and forgot where you had been. Rows of five ending in the boss match the
  checkpoint rhythm, and a serpentine fits four levels (20 floors) on the monitor. Map choices moved to cards
  under the map, so branches never collide with rooms. Rejected: one row per floor with scrolling (only six
  floors visible); keeping the choices as nodes on the map (they crossed the stairs).
- **Reckless, not just slower** (#15): leaving the game has to be dangerous, or Excel is free and the stealth
  layer has no teeth. Rejected: pausing loot or resetting Flow while away (no danger, the player just waits).
  Random targeting was chosen over flat damage boosts because it reads as "nobody is tanking".
- **Bosses should make you sweat, not wipe you** (0.18). Stat buffs alone turn into random wipes, so the
  pressure comes from a telegraphed attack you can answer. The brace rule exists because Bash's cooldown
  fits between wind-ups: without it one button answered everything. Measured with `test/autopilot.ts`
  (lowest party HP during the fight, which matters because a boss kill levels the party up and heals it):
  floor-10 boss, a player using skills on cooldown dips to ~49% with some close calls and no wipes;
  a player who saves Taunt and Ward only for the wind-up wipes about half the time; 40 s on Excel always wipes.
  The floor-5 boss is milder (~66 to 70%); RPG depth (#27) will give floors 5/10/15 their own bosses.
  Ogre history: 700/16 → 850/24 (0.15) → 1100/28 (0.18) → 1700/28 (0.23, the full kit halved kill times).
- **Curios cost real life, not RPG resources** (0.26): every choice spends Noise, standing still, a real can
  or gold, so the RPG's third verb is a stealth decision too. Out on purpose, so it does not become a pocket
  Darkest Dungeon: no hero stress, no torch meter, no provisions. Curios are a garnish on the walk, not a
  system to manage. Measured (10 good-bot nights each): taking the quiet choice, 4.6 visits, 1.1 wakes,
  average Noise 27 (before curios: 5.0, 2.2, 29; the quiet stops are quiet time); taking the loud choice every
  time, 5.8 visits, 3.1 wakes, Noise 44.
  - The away party acting on a curio (half the time) keeps the reckless autopilot a character, and makes
    "away" cost something even on a walk. Rejected: curios pausing until you come back (walking away from
    the keyboard would be free).
  - The sneak fails on alt-tab, so a troll and her steps at the same time is a real choice.
  - Rejected alternatives for the third verb: standing orders for the autopilot, a Loop Hero floor deck, a
    torch light meter, pull control, raid marks, loot council, playing only the knight.
- **Each new enemy asks one question** (0.24): heal (focus it), shield (Bash), swarm (area damage). Plain stat
  variants were rejected: they make fights longer without asking for a different button. The answers lean on
  skills, so a pack with a shield or a swarm is worse while you are away (floor 8, 40 s away: 4/12 wipes,
  was 2/15).
- **A boss per checkpoint, each with its own move** (0.24): the Ogre teaches "answer the cast bar", the
  Warlock "kill the adds first", the Black Knight "break the shield, then survive the targeted hit". Bash's
  roles change per boss (interrupt, add killer, shield breaker), so the same button is a new decision.
  - The Warlock's first version only called a friend into a free slot, so killing the friend caused the next
    summon and leaving it alive was better. Empowering a living friend fixed the incentive.
  - Measured with `test/autopilot.ts` (lowest party HP, careful / skill spam): floor 5 Ogre 69% / 67%;
    floor 10 Warlock 52% / 62% with 1 to 3 wipes in 12; floor 15 Black Knight 60% / 55%, about 60 s.
    40 s on Excel wipes on all three. Shark at attack 32 wiped 3 to 4 in 10 (too punishing); at 24, 67 to 72%.
- **The route choice** (0.55, #52 1.5; Paweł approved the mockups on 2026-11-20): a path is a floor with at most one
  feature and one condition, every condition pays, and the card shows only names and skulls, the full text in the
  margin on hover (the descriptions stayed hidden until hover since 0.24; at 2 to 3 cards the names fit).
  Away takes the **safest** path, not the riskiest: being away already costs the skills, a second punishment on the
  map made leaving feel like a trap. The away time adds up across glances, or a glance every 4 s would stall the
  party forever. A map card is never taken for you (it spends an item). A feature replaces a random curio instead
  of adding one, so floors don't get longer. The map draws only the run so far (four floors), since runs start at
  checkpoints. Rejected: the whole descent on parchment from 0.44 (#48: four levels in a serpentine; it read well
  but the run is now the unit, and the cards needed the space); a full Slay the Spire branching map several floors
  ahead (too much to read between alt-tabs); conditions that only cost (nobody would pick them).
- **Marks reward order, not speed** (0.23): two skills that are fine alone are better in sequence, so the
  player has a reason to look at the fight between alt-tabs. Judged pays off only on skill hits: when it
  also healed off auto attacks, the party healed itself while you sat on Excel and the reckless autopilot
  lost its teeth (floor 8, 40 s away: 0 wipes and 44% HP, back to 2/15 wipes and 22% after the change).
  Rejected: a combo meter (one more bar to watch), marks from auto attacks other than Smite (passive, no
  decision).
- **Noise per cast went from 4 to 3.5** with the third skill (0.23): a bot casting everything on cooldown
  drew 5.9 visits and 3.6 wakes a night at 4, against 4.5 and 2.0 before the kit; at 3.5 it is 3.8 and 1.3
  with the same average Noise (26). The design wants few visits and real dread, not more of them.
- **No permadeath.** Progress is never wiped (pillar 4); a wipe costs the run's unbanked loot and the walk back
  to town, never what was banked.
- Rejected: a 12-slot bag inside the battle UI and drag-to-equip mid-fight as the main loop. Equipping
  happens in the side panel, with the fight in view and at full speed (#49).

## Planned

- **Away-from-PC dangers** (ideas, #24): Need/Greed rolls on rare+ drops (away = auto-pass, "xX_Ninja_Xx
  won [Legendary]"), a ready check before
  bosses, a Party Patience meter that vote-kicks you at 100.

- Ultimates (slot 4) for later nights. Not scheduled.
- Combo floors: [synergy.md](synergy.md).
- One dungeon type and mechanic per night: [campaign.md](campaign.md), #3.
- Balance of instant skills: #2.
