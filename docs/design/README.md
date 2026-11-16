# Loot Night design bible

A guy plays a loot-obsessed MMO at his desk while real life (his girlfriend, his mom, his boss, the dog,
his own tiredness) keeps pulling him away. A short, funny pixel-art browser game made as a birthday gift.
Target: about 30 minutes for an engaged player over 7 nights, each graded 1 to 3 stars.

**This bible describes the game as it is now.** Each file covers one system. It has three parts:
- **Now**: what the build does.
- **Decisions**: why it works that way, and what was tried or rejected.
- **Planned**: agreed but not built, with its GitHub Issue number.

History lives in [`CHANGELOG.md`](../../CHANGELOG.md), build order in [`ROADMAP.md`](../../ROADMAP.md). When a change lands, edit the
section in place; never append "round N" notes.

| File | System |
|---|---|
| [night.md](night.md) | The night: clocks, endings, stars, sleep debt, Tiredness |
| [dungeon.md](dungeon.md) | Party, battle, skills, floors and maps, death, the cave diorama |
| [loot.md](loot.md) | Drops, rarity, items, the bag, lock and auto-salvage |
| [city.md](city.md) | The city hub, services, buildings, currencies |
| [her.md](her.md) | The girlfriend: apartment, visits, the door, peeking, bed phase, the desk visit |
| [desk.md](desk.md) | The phone and interrupts, Excel and alt-tab, Monster, the dog and cables, buffs |
| [screen.md](screen.md) | Screen layout, the three UI flavours, art direction, audio |
| [preemptive.md](preemptive.md) | Planned: actions before a visit (framework and action list) |
| [eye-candy.md](eye-candy.md) | Her moments: built and planned, with tone rules |
| [campaign.md](campaign.md) | Planned: 7 nights, star gates, desk shop, milestones, ending |
| [synergy.md](synergy.md) | Planned: the synergy pass (cross-system links) |
| [tech.md](tech.md) | Stack, architecture, save, tests |

## Pillars (every feature serves at least one)

1. **Loot is king.** Constant drops, rarity colours, reveals, a full bag and hard choices.
2. **The threat never sleeps.** Her and the interrupts run in real time. Reading cues is the stealth skill.
3. **Everything feeds everything.** RPG success makes the room louder; handling real life buffs the party.
4. **Progress is never wiped.** Party, gear and city persist. A failed night still moves you forward.
5. **One more night.** Short nights, near misses, unidentified loot waiting in town.
6. **Personal and funny.** Jokes about the real friend beat pop-culture references.

The RPG is the main game and must be fun on its own. Real life is layered on top. Only one thing can
be done at a time, so the skill is triage.

## References

| Game | We take |
|---|---|
| Loop Hero | Auto-battle; the player decides, the party fights. Risk of one floor deeper. Every system feeds another. |
| Darkest Dungeon (I and II) | Side-view battles, heroes in a row, a lit diorama and an acting camera. No permadeath. |
| Five Nights at Freddy's | Tracking a threat by sound and partial information; the door. Mechanics only, not the horror look. |
| Knights of Pen and Paper | Stars unlock the next level; humor about the people playing. |
| Diablo | Loot beams, rarity colours, the reveal. Players never buy gear. |
| Slay the Spire | The node map for choosing the next floor. |
| Papers, Please | Day-by-day structure, a new rule each day. |
| Baldur's Gate / Infinity Engine | The stone-and-gold skill bar with portraits. |

## Rules for builders (human or AI)

- Every number lives in `src/config/tuning.ts`. This bible names the constant, not a copy of the value,
  unless the value is the point of the decision.
- Content (items, enemies, lines, buildings) lives in `src/data/`. Logic never hard-codes one item.
- Player-facing text: plain, short, funny where it fits. No em dashes.
- Names of real people are in data so they can be swapped.
- When the bible is silent, choose the simplest option and open an Issue with the question.

## Glossary

| Term | Meaning |
|---|---|
| Night | One play session, 20:00 to dawn. One night = one RPG run. |
| Night clock | In-game time. Runs in the dungeon, stops in town. |
| Threat time | Real time that drives her and the interrupts. Never stops during a night. |
| Monitor | The centre screen: the RPG or Excel. |
| Flow | RPG damage and loot multiplier that builds while the RPG is on screen. |
| Zone | Headset-on bonus that fills over time; empties when the headset comes off. |
| Mood | Her patience as a trouble meter, 0 to 100 (shown to the player as hearts and words). 100 ends the night. |
| Noise | How loud the room is. Brings her sooner; wakes her after midnight. |
| Busy (Looks busy) | How convincingly you are working. Checked when she looks in. |
| Tiredness | Live 0 to 100 meter; sleep debt from earlier nights raises its start. |
| Scraps | Crafting material from salvage (Receipt Scraps on Monday). |
| zł | Real money. Only from the auction house. |
