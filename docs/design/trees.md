# Skill trees, Souls and autocast

## Now

**Skills come only from the tree** (#53; handoff 2.1 to 2.3 with the 2026-11-20 drop; grid doc §6c; data
`src/data/trees.ts`, rules `src/systems/tree.ts`). Every hero starts with his auto attack and skill 1. Skill 2 is an
unlock, the ultimate needs `TREE_ULT_NEEDS` (6) nodes bought in his tree and charges only once bought. Hero levels
give stats only (`ABILITY_UNLOCK` is gone).

**A tree** (the same shape for every hero, node ids in brackets): the auto attack as the root, skill 1 (s1), two stats
that gate skill 2 (g1, g2), skill 2 (s2), on each skill a stat that leads to its rule pair (p1, p2) and the pair (r1a/r1b,
r2a/r2b: buying one shuts the other, respec frees it), on each skill a stat that leads to its autocast (q1, q2) and the
autocast (a1, a2), and three stats up the middle to the ultimate (m1 to m3; the last raises the hero's aura). 17 nodes
to buy, 15 at most.

| Hero | Rule pair on skill 1 | Rule pair on skill 2 |
|---|---|---|
| Knightenstein | Hold the Line: Taunt also gives him +30% armor / Thorns: Taunted enemies take 30% of their hits back | Cleaving Bash: Bash hits the two front enemies / Concussion: Bash stuns twice as long |
| Garrote | Ambush: Backstab always crits on Staggered / Shiv: Backstab's cooldown -30% | Choking Smoke: Smoke Bomb hurts every enemy for 25% of his attack a second / Vanish: he can't be targeted during Smoke Bomb |
| Magoo | Wildfire: Fire's targets burn for 30% of its damage over 3 s / Inferno: Fire +40% damage, cooldown +3 s | Lingering Chill: Chill lasts twice as long / Shatterpoint: Bash shatters Chilled for x4 instead of x2.5 |
| Healero | Sanctuary: Mend gives the party +20% armor for 5 s / Greater Mend: Mend heals 30% more | Aegis: Ward lasts 3 s longer / Retribution: any enemy hitting a warded hero takes 25% back |

Stats (the class's own; grid doc §6c has the table): Knight Veteran, Brute, Bulwark, Iron Skin, Crushing (Bash +20%),
Hardened (healing on him +15%), Stalwart, Tower Shield, Shield Brother (his aura 35%); Garrote Nimble, Shadow (dodge
10%), Keen Eye, Deadly (crits +25% damage), Quick Blades, Lucky, Cutpurse (+15% gold), Ruthless, Sly (aura +15
crit); Magoo Focus, Arcane Mind, Pyromancy, Spellpower, Elementalist (Burning and Chill +25% longer), Glass, Ley Lines
(ultimate +20% faster), Warded, Mentor (aura 15%); Healero Devotion, Faith, Grace, Mercy, Bastion (Ward soaks 20%
more), Zeal, Shepherd (the party's max HP +5%), Vigil, Halo (aura 1.5% a second).

**Costs** `TREE_COST`: stat 20, unlock 40, rule 40, autocast 60, ultimate 120 Souls, each × (1 + `TREE_COST_STEP`
0.15 × nodes already bought in that tree). Souls are one pool for the four trees and the buildings. **Respec** is free
while testing: every Soul spent in that tree comes back. Buying is in town only.

**Autocast** (2.3): a bought autocast puts a loop mark on its skill well, on by default; right-click the well to switch
it. It casts the moment the skill is ready, on the default target, ignores marks, combos and wind-ups, never casts an
ultimate, and keeps firing while you're away (Excel, mid alt-tab, monitor off, hands busy). Changing places stops it.

**Where** (grid doc §6b, §6c): the town side panel has three tabs, Town, Inventory and Skill Tree. The Skill Tree tab
picks the hero (his party card), shows the hovered or clicked node (name, kind, what it does, moss and crimson notes:
bought, what it shuts or needs), "n bought in this tree" with the ultimate's six pips, the flat gold **Buy · cost**
and **Respec**. The tree itself opens over the town as a constellation in the hero's colours: owned nodes lit in the
class colour, a blinking gold ring on what you can buy, bone when too dear, dark when locked, crossed when shut by
its pair. Both are drawn by the redesign's renderer (`liveTree`, `liveTreePanel` in `src/render/page/live.js`); the
Town and Inventory tabs are still the DOM panel until the side panel moves to the renderer (V2).

`npx tsx test/tree.ts` checks costs, pairs, the ultimate's 6, respec, skill gating, autocast and a sample of rules and
stats; `python3 test/tree.py` shoots the tab and the tree.

**Measured** (good bot, night 1, 4 runs; it gears up on the walks, keeps auto-salvage off, buys skill 2 first, then
the way to the ultimate): 3 to 4 nodes a night (target 1 to 2 a run); fights 9 to 13 s; runs end on floors 5 to 7,
mostly banked with a full bag, 3.5 to 4.5 minutes; a rare or better every 16 to 31 s; the first legendary by drop 40.

## Decisions

- **Skills from the tree only** (0.60, #53). Night 1 is played with skill 1 and the auto attack; skill 2 is the first
  thing the Souls of the first run buy, and the ultimates arrive around nights 3 and 4. Levels give stats only. Rejected:
  keeping level unlocks next to the tree (two ways to the same skill; the tree's first buy would be pointless).
- **Costs 20/40/40/60/120 at +15% a node** (grid doc §6c, set against the Souls income): about 2 nodes a run on night
  1, every ultimate by about Sunday, the trees full in about two weeks. Rejected: the handoff's 10/15/15/40/60 at +25%
  (4 to 5 nodes a run on night 1; the last node would cost x4.5).
- **Autocast is dumb on purpose**: it trades the player's timing for not having to be there. Bash on autocast
  interrupts nothing on purpose, so a boss still asks you to look.
- **The tree's rules work on the hero who owns them**, and Shatterpoint (Magoo's) changes Bash's shatter for the
  party: the pair is about the combo, not about whose button it is.
