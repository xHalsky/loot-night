# Dungeon: party, battle, floors

## Now

**Party.** Three heroes, persistent across nights, named after the friend group (data: `src/data/heroes.ts`):
Paweł (Knight, tank, in front, carries the torch), Rafał (Mage), Jacek (Healer, at the back).
Stats: HP, attack, armor, speed, crit, luck; level and XP; six gear slots (weapon, helm, armor, boots,
ring, trinket). Old saves are renamed on load.

**Floors.** Endless. A floor is a walk, then `BATTLES_PER_FLOOR` (3) battles. Every
`CHECKPOINT_EVERY` (5th) floor ends in a boss and sets the checkpoint. Enemies scale per floor
(`ENEMY_HP_PER_FLOOR`, `ENEMY_ATK_PER_FLOOR`). Monday's dungeon is the Dungeon of Overdue Bills:
Debt Skeleton, Late-Fee Bat, The Collector, boss The Bailiff.

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

**City portal.** A button at the top left of the dungeon screen (between battles): back to the city,
15 min. In the city, the Dungeon Portal returns to the checkpoint, 15 min.

## Decisions

- **Instant skills, no GCD** (0.13). Waiting for the hero's turn felt unresponsive. Side effect: the bot
  reaches about floor 10 by bedtime (was 5 to 7) and skill spam can wake her. Open: #2.
- **No auto-attack button.** It was always on, so the button was noise. Keys start at 1 / Q / A.
- **Knight in front with the torch**, so the light leads the party and the front hero picks up loot.
- **Floor choice as a node map** instead of a list in the right panel: the choice reads as a route.
- **No permadeath.** Progress is never wiped (pillar 4); a wipe costs time, gold and half the bag.
- Rejected: a 12-slot bag inside the battle UI and drag-to-equip mid-fight as the main loop. Equipping
  happens in the right panel; the fight slows while you look.

## Planned

- Skill slots 3 and 4 (Rally, Storm, Revive) and ultimates; trainer in the city. Not scheduled.
- Ability marks and combo floors: [synergy.md](synergy.md).
- One dungeon type and mechanic per night: [campaign.md](campaign.md), #3.
- Balance of instant skills: #2.
