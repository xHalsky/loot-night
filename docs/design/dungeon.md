# Dungeon: party, battle, floors

## Now

**Party.** Three heroes, persistent across nights, named after the friend group (data: `src/data/heroes.ts`):
Paweł (Knight, tank, in front, carries the torch), Rafał (Mage), Jacek (Healer, at the back).
Stats: HP, attack, armor, speed, crit, luck; level and XP; six gear slots (weapon, helm, armor, boots,
ring, trinket). Old saves are renamed on load.

**Floors.** Endless. A floor is a walk, then `BATTLES_PER_FLOOR` (3) battles. Every
`CHECKPOINT_EVERY` (5th) floor ends in a boss and sets the checkpoint. Enemies scale per floor
(`ENEMY_HP_PER_FLOOR`, `ENEMY_ATK_PER_FLOOR`). Monday's dungeon is the Dungeon of Overdue Bills:
Debt Skeleton, Late-Fee Bat, The Collector, boss The Bailiff (1100 HP, 28 attack at floor 1 scale).

**Boss big attack: FINAL NOTICE.** Every `BOSS_SLAM_EVERY` (2nd) boss action is a wind-up instead of a hit:
a boss cast bar at the top centre of the screen (MMO raid style, outside the camera) fills over
`BOSS_WINDUP_SEC` (3 s) with a low rising sound you can hear from Excel. Then every hero loses
`BOSS_SLAM_PCT` (60%) of max HP. Three answers, one per hero:
- **Bash** (knight) interrupts it, but then the boss is **braced**: his next FINAL NOTICE cannot be interrupted;
- **Ward** (healer) halves it (`BOSS_SLAM_WARD_MULT`);
- **Taunt** (knight) pulls it onto the knight alone (`BOSS_SLAM_TAUNT_PCT` of his max HP).
So a boss fight is a rotation: Bash, then Ward or Taunt, then Bash again. On Excel during a wind-up,
nobody answers.

**Interest (Monday's mechanic).** An enemy alive more than `INTEREST_AFTER_TURNS` turns deals
+`INTEREST_PER_TURN` per extra turn. Rewards burst.

**Battle.** Side view, heroes left, up to 3 enemies right. Turn order by an ATB gauge
(`ATB_RATE` × speed; speed 10 = a turn every 3.3 s). Each turn the unit auto-attacks: Knight slashes
the front enemy, Mage bolts the weakest, Healer heals an ally under 60% HP or smites. Floating
numbers, crits in gold, every action has a visible effect (lunge, slash arc, bolt, beam, claw marks,
shockwaves, sparks).

**Skills.** Two per hero in the prototype (slots 3 and 4 show as locked):

| Hero | Skill (unlock level) | Effect |
|---|---|---|
| Knight (1, 2) | Taunt (1), Bash (4) | All enemies hit the knight for 5 s; 2x damage + stun the front enemy |
| Mage (Q, W) | Fire (1), Frost (4) | Hits every enemy; 2.6x to one enemy |
| Healer (A, S) | Mend (1), Ward (4) | Heals the party; party takes 40% less damage for 6 s |

Skills **cast instantly** on click or key, with no global cooldown; only their own cooldown applies
(shortened by the Library). Outside a fight the key says "No enemies in reach". Each cast adds
`NOISE_ABILITY`. Skills are blocked while switching screens, while a minigame has your hands, and
during microsleeps.

**Teaching the skills.** Hovering a skill shows a tooltip with what it does in this hero's current numbers
(damage, heal, duration), its cooldown (after the Library), Noise per cast, and a "use it when" line; locked
skills show their unlock level. Hovering a portrait shows the hero's role and what their auto attack does.
During a boss wind-up, the skills that answer it pulse red (Taunt, Ward, and Bash unless the boss is braced),
so the game teaches the answer in the moment. Skill numbers (`power`, `flat`, `dur`) live in
`src/data/heroes.ts` and are read by both the battle code and the tooltip, so they cannot disagree.

**Skill bar** (dungeon screen only, Infinity Engine style): a stone-and-gold bar along the bottom with a
framed portrait per hero (vertical HP gauge, name; click to select in the paper doll), then that hero's
skills with glyph, hotkey, cooldown sweep and level lock. The auto attack has no button.

**Choosing the next floor.** When a floor ends, the monitor shows a Slay the Spire-style node map: the
cleared node, the next row (the plain or boss floor plus one node per map in the bag) and a greyed
preview. Maps (dropped as loot, 8% per drop):

| Map | Effect |
|---|---|
| Elite Pack | Enemies ×`ELITE_MULT`, a guaranteed rare |
| Shrine | Full heal and revive, no battle, no loot |
| Treasure Vault | No battle, `VAULT_DROPS` items, +`NOISE_VAULT` Noise |

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
Party chat complains in the Feed ("Rafał: afk again? pulling"), and the Loot Night taskbar button flashes
orange like a Windows app wanting attention when party HP is under `AUTOPILOT_FLASH_HP` or a hero is down.
Measured by `test/autopilot.ts` (40 s on Excel): bosses on floor 5 and 10 wipe 16/20 and 20/20; normal
floors 3 and 8 wipe 0/20 and 2/20 and end at 65% and 32% party HP.

**City portal.** A button at the top left of the dungeon screen (between battles): back to the city,
15 min. In the city, the Dungeon Portal returns to the checkpoint, 15 min.

## Decisions

- **Instant skills, no GCD** (0.13). Waiting for the hero's turn felt unresponsive. Side effect: the bot
  reaches about floor 10 by bedtime (was 5 to 7) and skill spam can wake her. Open: #2.
- **Tooltips over a manual** (0.19): the RPG is half of a split-attention game, so skills are taught at the
  point of use (hover, and the pulsing answers during a wind-up) rather than in a help screen.
- **No auto-attack button.** It was always on, so the button was noise. Keys start at 1 / Q / A.
- **Knight in front with the torch**, so the light leads the party and the front hero picks up loot.
- **Floor choice as a node map** instead of a list in the right panel: the choice reads as a route.
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
  Bailiff history: 700/16 → 850/24 (0.15) → 1100/28 (0.18).
- **No permadeath.** Progress is never wiped (pillar 4); a wipe costs time, gold and half the bag.
- Rejected: a 12-slot bag inside the battle UI and drag-to-equip mid-fight as the main loop. Equipping
  happens in the right panel; the fight slows while you look.

## Planned

- **Curios in the corridor** (#30, the RPG's third verb, decided 2026-11-16). While the party walks, 1 or 2
  objects per floor appear in the cave. Click one for a quick choice with a gamble outcome. Every choice
  trades loot against a real-life currency, so the question is "can I afford this right now, given where
  she is?":

  | Curio (Overdue Bills) | Choices | Real-life cost |
  |---|---|---|
  | Locked strongbox | Pick the lock (8 s, quiet) / Smash it | Smash: Noise +25 |
  | Overdue mailbox | Open / Leave | Gold, a "late fee" curse or a rare; opening makes him groan (a little Noise) |
  | Energy-drink shrine | Offer a Monster can / Pray for free | Offering spends a real can from the desk: a big buff. Praying: a coin flip |
  | Snoring troll on a loot pile | Sneak and grab / Fight | Sneak: 6 s on the RPG screen, no alt-tab. Fight: a mini-boss, lots of Noise |
  | Guild bank vault | Withdraw "just one thing" | Free loot; Rafał notices later in guild chat |
  | Unpaid vending machine | Pay gold / Kick it | Kick: Noise, 50/50 on a snack buff |

  Each dungeon gets its own set (its own jokes). Out on purpose, so it does not become a pocket Darkest
  Dungeon: no hero stress, no torch meter, no provisions. Curios are a garnish on the walk, not a system to
  manage. Rejected alternatives for the third verb: standing orders for the autopilot, a Loop Hero floor deck,
  a torch light meter, pull control, raid marks, loot council, playing only Paweł.

- **Away-from-PC dangers** (ideas, #24): Need/Greed rolls on rare+ drops (away = auto-pass, "xX_Ninja_Xx
  won [Legendary]"), a 10 s floor vote on the node map (away = the riskiest floor), a ready check before
  bosses, a Party Patience meter that vote-kicks you at 100.

- Skill slots 3 and 4 (Rally, Storm, Revive) and ultimates; trainer in the city. Not scheduled.
- Ability marks and combo floors: [synergy.md](synergy.md).
- One dungeon type and mechanic per night: [campaign.md](campaign.md), #3.
- Balance of instant skills: #2.
