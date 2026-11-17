# Synergy pass (mostly planned)

Slice set #29, arc set #14.

**Rule:** every system takes input from at least two others and feeds at least two others; a system that
only punishes or only rewards is a dead end (Loop Hero's rule). Built so far: ability marks (0.23), cross-system affixes (0.25). Everything else below is planned.
All new numbers go in `tuning.ts`; banter lines in a `banter.ts` data file.

## Audit of the current build (2026-11-16)

| System | Feeds | Fed by | Gap |
|---|---|---|---|
| RPG combat | Noise, loot, XP | Flow, Zone, Monster, buildings, gear, Tiredness; curios (a real can, Noise, standing still) | Fine |
| Loot | Gold, scraps, zł, party power; real-life affixes change headset, alt-tab, Tiredness, excuses, waking, cans | Flow, Zone, green Mood; cross-system affixes read headset, Monster, Noise, Mood, the dog, Excel | zł is a dead end until the store (#4) |
| Her Mood | Night end, stars, visit chance, loot luck | Visits, interrupts, peeking, drift | Her visits give the RPG nothing positive |
| Noise | Visit timing, waking her | Combat, dog, Monster, loud curio choices | Only punishes; distance and masking (#17) add the read; curios make it a price you choose to pay |
| Excel | Passes checks, overtime gold | Alt-tab | Fine (Looks busy cut in 0.20) |
| Interrupts | Mom heals, boss pays gold and goes quiet, courier pays an item, the boys a raid buff or Noise | Timers, the headset (the boys) | Bedtime text only avoids a penalty |
| Dog and cables | Noise, NO SIGNAL | A timer | Only punishes |
| Tiredness | Yawns, microsleeps, sluggish | Clock, sleep debt, Monster | Only punishes; staying up has no upside |

## Slice set vs. arc set (decided 2026-11-16)

The principle is vital, so the slice gets every item whose inputs exist on Monday. The rest needs several nights.

| Item | Where |
|---|---|
| Cross-layer echoes, interrupts and the dog always pay, Goodwill, Witching Hour | Slice: #29 |
| Ability marks, cross-system affixes | Slice: built in RPG depth #27 (0.23, 0.25) |
| Audio-first loot cues | Slice: inside real audio #13 |
| A city upgrade every night | Slice: inside the balance pass #2 |
| Combo floors, party sets, overtime zł, bag tools, banter, unfolding city, bounties, the ending | Arc: #14 |

**Raid pass merged into pre-emptive actions:** it is a pre-emptive action that costs Goodwill instead of a
per-night charge. One system for "act before she comes", not two.

## Cross-layer echoes

| Direction | Trigger | Echo |
|---|---|---|
| RPG → life | Legendary drop | He yells "LET'S GO": Noise +15; Feed: "[Her] what was that??" |
| RPG → life | Boss below 25% HP (enrage) | Flow builds 50% faster for the fight; alt-tabbing resets Flow |
| RPG → life | Party wipe | He slams the desk: Noise +10, the dog comes over |
| Life → RPG | Cuddle or Hug passed | Loved: +15% damage, +10% crit next fight |
| Life → RPG | Dinner shout passed | Fed: +10% max HP for the floor |
| Life → RPG | Tiredness 70+ | Drowsy: +10% miss chance ("zzz") |
| Life → RPG | Caught (any rung) | Guilt on every rung, not only the 2nd |

## Goodwill

A 0 to 100 bank under her patience; no decay in a night; half carries over. Earned: Cuddle +20, Hug +15,
Help me +15, two sweet answers on the desk +20, Chat visit +8, text answered +5, lean visit +3.
Spent: **Raid pass** (40), a pre-emptive action: no visits for 2.5 real minutes ([preemptive.md](preemptive.md)). **Forgiveness** (60,
automatic, once per night): the next catch drops one rung. 70+: Help me gifts the better desk item.
Catches cost 15.

## Excel produces something

(Alibi stacks were dropped in 0.20 together with Looks busy: there is no Busy threshold left to excuse.)

**Overtime zł:** a 4-row clear pays 2 zł, capped at 20 per night.

## Witching Hour

From 01:00: the clock turns purple, the fog violet; every drop has a 35% chance to upgrade one rarity;
insomniac affixes roll only then (Night Shift, Red Eyes, Second Wind, Dawn Chaser). Staying up becomes
a greedy choice, not only a penalty.

## Interrupts always pay

Car alarm +60 gold; dinner shout = Fed; friends' call reveals the next node row; dog petted on the
favourite spot = Good Boy (goblin chance ×2 for 60 s); cable fix under 6 s restores Flow; a bank shot in
the bin gives a small Flow bonus (exists).

## Synergy inside the RPG

**Combo floors:** two map floors in a row inside a checkpoint segment add a gold combo node
(Elite + Cursed = Nightmare; Vault + Goblin Den = Goblin Hoard; Shrine + Elite = Blessed Hunt;
Cursed + Shrine = Purified; Goblin Den + Elite = Goblin King).
**Ability marks:** built in 0.23 ([dungeon.md](dungeon.md)). Changed from this plan: marks last 6 s, not
2 turns; Fire's Stagger payoff does not spread; Judged heals on skill hits, not auto attacks (away stays
dangerous); Taunted reflects 50% with Ward, not 20% (20% was too small to see).
**Cross-system affixes:** built in 0.25 with real-life affixes ([loot.md](loot.md)). Caffeinated shipped as
"of Caffeine" and Good with Dogs as "of the Good Boy" (luck for 60 s after petting). **Party sets** worn across different heroes (Guild Tabard, Ledger Plate).

## Tweaks

- **Audio-first loot:** a legendary, a full bag, a goblin, a downed hero and a boss enrage are all
  distinguishable by ear while Excel covers the screen; each also has a Feed line.
- **A city upgrade every night:** tune costs so a normal night (bed at 01:00, floor 8 to 10) always affords
  the cheapest next building.
- **Bag tools:** auto-salvage threshold (Off / Common / Uncommon / Rare); Reroll one affix at the Salvage
  Forge (50 gold + 3 scraps, doubling); comparison shows total ATK and HP change.
- Parked: a stash Tetris grid in the city.

## Social and city

- **Friends who remember last night:** on entering the city, up to 3 players comment on what happened
  (wipe, new record, legendary, caught twice, slept after 02:00, early night, raid pass, never caught).
- **A city that unfolds:** one or two buildings per night (Mon: Merchant, Forge, Portal, Training Grounds;
  Tue: Appraiser, Auction, Inn; Wed: Library, Quest board; Thu: Treasury, Reroll; Fri: guild banner;
  Sat: raid portal). Doubles as the tutorial.
- **Nightly bounties** on a Quest board (from Wednesday): 3 per night, scraps and gold; all three = a
  Phoenix Feather.

## Build order

Audio-first cues → interrupt payouts and echoes → Goodwill → overtime zł → Witching Hour →
ability marks → combo floors → affixes and sets → bag tools → unfolding city → banter → bounties →
upgrade-per-night tuning → the ending ([campaign.md](campaign.md)).

## Open question

Several items assume the campaign's extra visits and interrupts (#12). Decide which parts make sense
for Monday-only and which wait for nights 2 to 7.
