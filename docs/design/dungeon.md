# Dungeon: party, battle, floors

## Now

**Party.** Three heroes, persistent across nights (data: `src/data/heroes.ts`, `HERO_NAME`): Knightenstein
(Knight, tank, in front, carries the torch: you), Magoo (Mage) and Healero (Healer, at the back), the
characters of your friends Rafał and Jacek. Party and guild chat use the character names, as an MMO would;
the friends' phone calls use their real names.
Stats: HP, attack, armor, speed, crit, luck; level and XP; six gear slots (weapon, helm, armor, boots,
ring, trinket). Old saves are renamed on load.

**Floors.** Endless. A floor is a walk, then `BATTLES_PER_FLOOR` (3) battles. Every
`CHECKPOINT_EVERY` (5th) floor ends in a boss and sets the checkpoint. Enemies scale per floor
(`ENEMY_HP_PER_FLOOR`, `ENEMY_ATK_PER_FLOOR`). Monday's dungeon is the Shadow Crypt
(`src/data/enemies.ts`). When a boss dies, the enemies still standing run. Enemy ids are older than their
names (`collector` = Orc, `auditor` = Shaman, `shelter` = Guardian, `junk` = Imps, `bailiff` = Ogre, `shark` =
Warlock, `landlord` = Black Knight; boss moves `slam`, `loan`, `evict`); saves and tests key on the ids.

**Enemies.** Three plain ones (Skeleton, Bat, Orc) and three that each ask for a
different answer, joining from floors 2, 3 and 4. The first time you meet one, a line says what it wants.

| Enemy | From | Role | Answer |
|---|---|---|---|
| Shaman | floor 2 | Heals the most hurt friend under `AUDITOR_HEAL_BELOW` (75%) for `AUDITOR_HEAL` (60%) of his own max HP instead of attacking | Frost goes for him first; the mage's auto Bolt picks the weakest, often him |
| Guardian | floor 3 | Shielded: takes `SHIELD_TAKEN` (25%) damage until a Bash breaks the shield | Bash (it goes for a shield before the front enemy), then burst |
| Imps | floor 4 | A swarm of 5 imps; each single hit takes one imp at most, and every imp bites on its turn | Fire hits every imp; Storm's bolts take one each; Taunt soaks the bites |

Skill targeting: Bash goes for a winding-up boss, then a shield, then the front enemy; Frost goes for a
healer, then the front enemy.

**Bosses** rotate per checkpoint floor: floor 5 the Ogre, 10 the Warlock, 15 the Black Knight, then around
again with floor scaling. Each has its own telegraphed move: a cast bar at the top centre and the skills
that answer it pulsing red. The dungeon map names the boss on the path card for the boss floor.

| Boss (HP / attack at floor 1 scale) | Move | Answer |
|---|---|---|
| The Ogre (1700 / 28) | SMASH, every 2nd action: everyone loses 60% | Bash interrupts (then he braces), Ward halves, Taunt pulls it onto the knight |
| The Warlock (1700 / 28) | Every `LOAN_EVERY` (3rd) action, a 2 s SUMMON: a friend (Shaman or Imps) joins; a friend still standing is EMPOWERed instead: full HP, x`LOAN_REFI` (1.3) attack | Kill the friend before the next summon: Fire, Storm, Frost on the Shaman |
| The Black Knight (1600 / 26) | Starts behind a shield. Every `EVICT_EVERY` (3rd) action, a 3 s EXECUTE on the most hurt hero (a red EXECUTE tag over them): `EVICT_PCT` (90%) of their max HP. Afterwards the shield comes back | Taunt (the knight takes 55% instead), Ward halves, Revive after; Bash the shield off again |

**Boss big attack: SMASH** (the Ogre). Every `BOSS_SLAM_EVERY` (2nd) boss action is a wind-up instead of a hit:
a boss cast bar at the top centre of the screen (MMO raid style, outside the camera) fills over
`BOSS_WINDUP_SEC` (3 s) with a low rising sound you can hear from Excel. Then every hero loses
`BOSS_SLAM_PCT` (60%) of max HP. Three answers, one per hero:
- **Bash** (knight) interrupts it, but then the boss is **braced**: his next SMASH cannot be interrupted;
- **Ward** (healer) halves it (`BOSS_SLAM_WARD_MULT`);
- **Taunt** (knight) pulls it onto the knight alone (`BOSS_SLAM_TAUNT_PCT` of his max HP).
So a boss fight is a rotation: Bash, then Ward or Taunt, then Bash again. On Excel during a wind-up,
nobody answers.

**Fury (Monday's mechanic, the red FURY +x% tag).** An enemy alive more than `FURY_AFTER_TURNS` turns deals
+`FURY_PER_TURN` per extra turn. Rewards burst.

**Battle.** Side view, heroes left, up to 3 enemies right. Turn order by an ATB gauge
(`ATB_RATE` × speed; speed 10 = a turn every 3.3 s). Each turn the unit auto-attacks: Knight slashes
the front enemy, Mage bolts the weakest, Healer heals an ally under 60% HP or smites. Floating
numbers, crits in gold, every action has a visible effect (lunge, slash arc, bolt, beam, claw marks,
shockwaves, sparks).

**Skills.** Three per hero, unlocked at levels 1, 3 and 5 (`ABILITY_UNLOCK`), so a first night reaches the
whole kit: level 3 comes before the first boss, level 5 with a few minutes left. Slot 4 (ultimates) is shown
locked as "later nights".

| Hero | Level 1 | Level 3 | Level 5 |
|---|---|---|---|
| Knight (1, 2, 3) | Taunt: enemies hit the knight for 5 s, marks them Taunted | Bash: 2x to the front enemy, stun, Stagger; interrupts SMASH | Rally: every hero acts right now, +25% party damage for 6 s |
| Mage (Q, W, E) | Fire: 1x to every enemy | Frost: 2.6x to the front enemy, Chill | Storm: 6 bolts at random enemies, 0.6x each |
| Healer (A, S, D) | Mend: heals the party | Ward: 40% less damage for 6 s | Revive: a downed hero back at 50%, else heals the most hurt for 50% |

**Curios in the corridor** (#30, the RPG's third verb; content `src/data/curios.ts`, rules
`src/systems/curios.ts`, numbers `CURIO_*`). On a battle floor, `CURIO_PER_FLOOR` (1 or 2) of the walks stop
halfway at a curio (none on vault or shrine floors, no repeats among the last three). A parchment card names
it and offers two choices, each with its real-life cost on the button, so the question is "can I afford
this right now, given where she is?". The party waits `CURIO_WAIT_SEC` (7 real seconds), then walks past;
the ✕ or "walk past" leaves at once. Curio time is your time: the night clock runs, the battle does not.

| Curio | Choice A | Choice B |
|---|---|---|
| Locked chest | Pick the lock: 8 s standing still, quiet | Smash it: instant, Noise +25 |
| Sealed coffin | Open: Noise +5; 50% gold (20 x floor), 30% a rare, 20% a curse (party -15% damage until the next floor) | Leave it |
| Shrine of the green flame | Make an offering (costs a real Monster can from the desk): party +30% damage, +20% speed for 60 s | Pray: 50% +15% damage for 30 s, 50% it roars (Noise +10) |
| Snoring troll on a loot pile | Sneak: 6 s on the RPG screen; alt-tab (or the monitor going off) wakes him | Fight: a mini-boss (330 HP at floor 1 scale), Noise +15 |
| Guild bank vault | Take one item: a free rare; 40 to 90 s later Magoo reads the log in guild chat and sulks (mage -20% damage for 45 s) | Close it |
| Potion cart | Pay 12 gold x floor: party heals 30% | Shake it: Noise +15, 50% the same heal, else broken glass |

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
| Judged | the healer's auto Smite | any skill hit (Rally's actions count) | Heals the most hurt hero for `MARK_JUDGED_HEAL` (30%) of the damage |
| Taunted | Taunt (all enemies, as long as the taunt) | Ward | With Ward up, its hits bounce `MARK_TAUNT_REFLECT` (50%) back |

Marks last `MARK_SEC` (6 s). So the long chain is Rally → Frost → Bash (shatter, stagger) → Fire (x2). On a boss
it collides with the wind-up: Bash spent on a shatter is not there for SMASH. A mark shows as a small
coloured tag above the enemy's HP bar, its line shrinking as it runs out; its name floats up when it lands
and the payoff floats up when it is cashed in. A skill that would cash in a mark right now glows gold on the
skill bar with a badge (x2, x2.5, ↩).

Skills **cast instantly** on click or key, with no global cooldown; only their own cooldown applies
(shortened by the Library). Outside a fight the key says "No enemies in reach". Each cast adds
`NOISE_ABILITY` (3.5). A multi-hit skill (Storm, Rally) is one noisy moment: its crits add Noise once and its
extra actions make no keyboard Noise. Skills are blocked while switching screens, while a minigame has your hands, and
during microsleeps.

**Teaching the skills.** Hovering a skill shows its name and hotkey and one line on what it does in this hero's
current numbers (`tip` in `src/data/heroes.ts`: damage, heal, duration and the one combo that matters); locked
skills add their unlock level. The cooldown shows on the button itself. Hovering a portrait shows the hero's
name, class and role in one line. (Tooltips carry only crucial information: [screen.md](screen.md).)
During a boss wind-up, the skills that answer it pulse red (Taunt, Ward, and Bash unless the boss is braced),
so the game teaches the answer in the moment. Skill numbers (`power`, `flat`, `dur`) live in
`src/data/heroes.ts` and are read by both the battle code and the tooltip, so they cannot disagree.

**Skill bar** (dungeon screen only, Infinity Engine style): a stone-and-gold bar along the bottom with a
framed portrait per hero (vertical HP gauge, name; click to select in the paper doll), then that hero's
skills with glyph, hotkey, cooldown sweep and level lock. The auto attack has no button.

**Choosing the next floor: the dungeon map** (#48). When a floor ends, the monitor shows your whole descent
on an old parchment map, drawn in faded brown ink, read top to bottom. Each row is one level (roman numeral
in the margin): five floors left to right, then right to left, the boss room (red ink, double wall) at the
end, and a staircase down to the next level; every room sits a little lower than the last. Rooms are joined
by stairs. Each room shows what that floor was (crossed swords, vault chest, shrine cross, goblin, elite
skull, cursed slime, boss crown), from `mapPath`, which is saved, so the map shows every night's descent.
Floors you reached before but not tonight are fainter; the next floor and the one after are pencil sketches.
Marks: "you are here" (a red ink ring), a flag on the checkpoint, a red X on your corpse. Four levels fit;
older ones scroll off the top ("floors 1 to N above"). The choice is a row of path cards at the bottom: the
plain or boss floor plus one card per map in the bag; hovering a card draws that room into the next slot
and shows what it does. `python3 test/dmap.py` shoots it at a few depths. Maps (dropped as loot, 8% per drop):

| Map | Effect |
|---|---|
| Elite Pack | Enemies ×`ELITE_MULT`, a guaranteed rare |
| Shrine | Full heal and revive, no battle, no loot |
| Treasure Vault | No battle, `VAULT_DROPS` items, +`NOISE_VAULT` Noise |
| Cursed Floor | Your heals do `CURSED_HEAL` (half); every drop is one rarity better; violet fog |
| Goblin Den | A loot goblin after every battle; each catch gives `GOBLIN_DEN_DROPS` items and +`GOBLIN_DEN_NOISE` Noise |

With six possible paths, each node shows only its name; the description appears on hover.

**Downed and wipe.** At 0 HP a hero is downed and skips turns. Downed heroes return at 30% when the
floor ends, or via a Phoenix Feather from the bag (50%). All three down = wipe, an MMO corpse run:
back to the checkpoint, −60 in-game minutes, −10% gold, half the bag (random, locked items excepted)
plus any floor loot left on the corpse at that floor. Reaching that floor returns it.

**Loot goblin.** `GOBLIN_CHANCE` after a battle; runs for 6 s; click it for 3 drops, one rare or better.

**The cave diorama** (`src/ui/dungeon.ts`). 2.5D side view lit like a cave: dark except the knight's
flickering torch, which travels with the party, a dim glow around enemies, and light from loot beams
and spells. Layers: far rock (slow parallax), stone arches, stalactites and roots, a perspective floor,
units with ground shadows, fog swallowing the far end, and dark foreground silhouettes (pillars,
chains, roots) sliding past faster, rim-lit by the torch.

**Camera that acts.** Dollies with a sway while walking, pushes in when a fight starts, springs back on
heavy hits (crits, Bash, Smite, Fire), shakes on crits, slowly zooms onto a legendary drop for about 3 s.

**Reckless autopilot** (`src/systems/autopilot.ts`). When you *chose* to leave the game (Excel up, mid-switch,
a minigame window open, or cables out because you ignored the dog), the party plays badly:
- nobody holds aggro (`AUTOPILOT_NO_TANK`): enemies pick targets at random, so the mage and healer get hit;
- the healer only heals below `AUTOPILOT_HEAL_BELOW` (35%, normally 60%);
- walking and the loot pause run `AUTOPILOT_PACE` (1.6x) faster: they pull without resting;
- a pack pulled while you are away starts with `AUTOPILOT_AMBUSH_ATB` (40 to 80) ATB, so it hits first;
- no skills (they need you).
Her desk visit and the monitor she switched off are forced on you, so they keep the normal autopilot.
Party chat complains in the Feed ("Magoo: afk again? pulling"), and the Loot Night taskbar button flashes
orange like a Windows app wanting attention when party HP is under `AUTOPILOT_FLASH_HP` or a hero is down.
Measured by `test/autopilot.ts` (40 s on Excel): bosses on floor 5 and 10 wipe 16/20 and 20/20; normal
floors 3 and 8 wipe 0/20 and 2/20 and end at 65% and 32% party HP.

**City portal.** A button at the top left of the dungeon screen (between battles): back to the city,
15 min. In the city, the Dungeon Portal returns to the checkpoint, 15 min.

**Floor bounty** (0.40): clearing a floor pays `FLOOR_GOLD_BASE` + `FLOOR_GOLD_PER` × floor gold (floor 1: 8,
floor 10: 35; about 180 a normal night), shown in the feed. Steady income besides selling drops
([city.md](city.md)).

## Decisions

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

- **Instant skills, no GCD** (0.13). Waiting for the hero's turn felt unresponsive. Side effect: the bot
  reaches about floor 10 by bedtime (was 5 to 7) and skill spam can wake her. Open: #2.
- **Tooltips over a manual** (0.19): the RPG is half of a split-attention game, so skills are taught at the
  point of use (hover, and the pulsing answers during a wind-up) rather than in a help screen.
- **No auto-attack button.** It was always on, so the button was noise. Keys start at 1 / Q / A.
- **Knight in front with the torch**, so the light leads the party and the front hero picks up loot.
- **Floor choice on a map** instead of a list in the right panel: the choice reads as a route.
- **The whole descent on parchment** (0.44, #48): the old node map showed only the next row, upward, so it
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
- **Path cards hide descriptions until hover** (0.24, kept in 0.44): five map types make six paths possible.
- **Marks reward order, not speed** (0.23): two skills that are fine alone are better in sequence, so the
  player has a reason to look at the fight between alt-tabs. Judged pays off only on skill hits: when it
  also healed off auto attacks, the party healed itself while you sat on Excel and the reckless autopilot
  lost its teeth (floor 8, 40 s away: 0 wipes and 44% HP, back to 2/15 wipes and 22% after the change).
  Rejected: a combo meter (one more bar to watch), marks from auto attacks other than Smite (passive, no
  decision).
- **Noise per cast went from 4 to 3.5** with the third skill (0.23): a bot casting everything on cooldown
  drew 5.9 visits and 3.6 wakes a night at 4, against 4.5 and 2.0 before the kit; at 3.5 it is 3.8 and 1.3
  with the same average Noise (26). The design wants few visits and real dread, not more of them.
- **No permadeath.** Progress is never wiped (pillar 4); a wipe costs time, gold and half the bag.
- Rejected: a 12-slot bag inside the battle UI and drag-to-equip mid-fight as the main loop. Equipping
  happens in the right panel; the fight slows while you look.

## Planned

- **Away-from-PC dangers** (ideas, #24): Need/Greed rolls on rare+ drops (away = auto-pass, "xX_Ninja_Xx
  won [Legendary]"), a 10 s floor vote on the node map (away = the riskiest floor), a ready check before
  bosses, a Party Patience meter that vote-kicks you at 100.

- Ultimates (slot 4) for later nights. Not scheduled.
- Combo floors: [synergy.md](synergy.md).
- One dungeon type and mechanic per night: [campaign.md](campaign.md), #3.
- Balance of instant skills: #2.
