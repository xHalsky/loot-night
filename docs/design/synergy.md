# Synergy pass

Slice set #29, arc set #14.

**Rule:** every system takes input from at least two others and feeds at least two others; a system that
only punishes or only rewards is a dead end (Loop Hero's rule). The slice set (#29) is built: ability marks (0.23), cross-system affixes (0.25), cross-layer echoes and the dog and cable payouts (0.29), Goodwill with Forgiveness and the Raid pass (0.30), the Witching Hour (0.31). The arc set (#14) below is planned.
All new numbers go in `tuning.ts`; banter lines in a `banter.ts` data file.

## Audit of the current build (2026-11-16)

| System | Feeds | Fed by | Gap |
|---|---|---|---|
| RPG combat | Noise, loot, XP | Flow, Zone, Monster, buildings, gear, Tiredness; curios (a real can, Noise, standing still) | Fine |
| Loot | Gold, scraps, zł, party power; real-life affixes change headset, alt-tab, Tiredness, excuses, waking, cans | Flow, Zone, green Mood; cross-system affixes read headset, Monster, Noise, Mood, the dog, Excel | zł is a dead end until the store (#4) |
| Her Mood | Night end, stars, visit chance, loot luck | Visits, interrupts, peeking, drift, pre-emptive actions | Fine: good visits now pay Goodwill and Loved (0.29, 0.30) |
| Goodwill | Forgiveness, the Raid pass (calm, Noise allowed) | Cuddle, good chat, lean visit, sweet answers on the desk, her text answered; catches take it | New in 0.30 |
| Noise | Visit timing, waking her | Combat, dog, Monster, loud curio choices, a legendary yell, a wipe slam | Only punishes; distance and masking (#17) add the read; curios make it a price you choose to pay |
| Excel | Passes checks, overtime gold | Alt-tab | Fine (Looks busy cut in 0.20) |
| Interrupts | Mom heals, boss pays gold and goes quiet, courier pays an item, the boys a raid buff or Noise, her text Goodwill | Timers, the headset (the boys) | Fine |
| Dog and cables | Noise, NO SIGNAL; Good Boy (goblins x2), a fast fix keeps Flow; a wipe calls him over | A timer, a wipe | Fine (0.29) |
| Tiredness | Yawns, microsleeps, sluggish, Drowsy misses; Red Eyes affix | Clock, sleep debt, Monster | Fine: the Witching Hour gives staying up a reward side (0.31) |

## Slice set vs. arc set (decided 2026-11-16)

The principle is vital, so the slice gets every item whose inputs exist on Monday. The rest needs several nights.

| Item | Where |
|---|---|
| Cross-layer echoes, interrupts and the dog always pay, Goodwill, Witching Hour | Slice: #29 |
| Ability marks, cross-system affixes | Slice: built in RPG depth #27 (0.23, 0.25) |
| Audio-first loot cues | Slice: built in real audio #13 (0.33) |
| A city upgrade every night | Slice: inside the balance pass #2 |
| Combo floors, party sets, overtime zł, bag tools, banter, unfolding city, bounties, the ending | Arc: #14 |
| Poker face: his grin at a big drop while she is in the doorway | Arc: #39 (idea) |

**Raid pass merged into pre-emptive actions:** it is a pre-emptive action that costs Goodwill instead of a
per-night charge. One system for "act before she comes", not two.

## Cross-layer echoes (built 0.29, numbers `ECHO_*`)

| Direction | Trigger | Echo | Status |
|---|---|---|---|
| RPG → life | Legendary drop | He yells "LET'S GOOOO": Noise +15 (+5 with the headset on: into the mic); awake and no headset: "[Her] what was that??" | Built |
| RPG → life | Boss below 25% HP (enrage) | ENRAGED tag; Flow builds x1.5 for the fight; alt-tabbing out of it resets Flow | Built (the boss itself does not get stronger: the bosses are tuned) |
| RPG → life | Party wipe | He slams the desk: Noise +10, the dog comes over | Built |
| Life → RPG | Cuddle passed | Loved: +15% damage, +10% crit for the next fight (buff bar: "next") | Built; Hug when it exists (#12) |
| Life → RPG | Dinner shout passed | Fed: +10% max HP for the floor | Waits for the dinner shout (#23) |
| Life → RPG | Tiredness 70+ | Drowsy: 10% of hero hits miss ("zzz") | Built |
| Life → RPG | Caught (any rung) | Guilt on every rung, not only the 2nd | Built |

## Goodwill (built 0.30, `src/systems/goodwill.ts`, numbers `GOODWILL_*`)

A 0 to 100 bank on the door panel under Patience and Caught (a bar with marks at 40 and 60); no decay in a
night; half carries over to the next. A toast names every gain and loss.

- **Earned:** a good cuddle +20, two sweet answers when she sits on your desk +20, a good chat +8, her
  bedtime text answered +5, a lean visit +3. Later: Hug +15, Help me +15 (#12).
- **Lost:** every catch -15.
- **Raid pass** (40): a phone action, "Raid night?" (3 s). No visits for `RAID_CALM_SEC` (150 s), and Noise
  does not end this calm, unlike the others: she knows. No diminishing returns or suspicion. Not after
  midnight, not during a visit ([preemptive.md](preemptive.md)).
- **Forgiveness** (60, automatic, once a night): a catch does not count (no heart, no rung, keeps the
  3-star night) and she leaves: "I know, I know. Raid night." It spends the 60.
- Later: 70+ makes Help me give the better desk item (#12).

Decisions (0.30): Forgiveness makes the catch not count rather than "drop one rung": one rung below the
first catch is no catch, and a single clear rule reads better than a partial one. It spends the full 60 so it
stays rare (about one good cuddle, one good chat and a lap visit). Rejected: Goodwill paying for every
pre-emptive action (decided 2026-11-16, see preemptive.md).

## Excel produces something

(Alibi stacks were dropped in 0.20 together with Looks busy: there is no Busy threshold left to excuse.)

**Overtime zł:** a 4-row clear pays 2 zł, capped at 20 per night.

## Witching Hour (built 0.31, numbers `WITCHING_*`)

From 01:00 (bedtime) to dawn: the taskbar clock turns purple ("witching hour"), the dungeon fog violet, and a
toast announces it. Every drop has `WITCHING_UPGRADE` (35%) to shift up one rarity (stacks with a Cursed
Floor; the drop line says so). Insomniac affixes, cross-system, roll only then (half of the cross-system
rolls after 01:00):

| Affix | Bonus | While |
|---|---|---|
| of the Night Shift | Attack | after 01:00 |
| of Red Eyes | Crit % | Tired 70+ |
| of the Second Wind | Max HP | after 01:00 |
| of the Dawn Chaser | Luck | after 03:00 |

Staying up becomes a greedy choice, not only a penalty. Measured (6 good-bot nights each): bed at 01:00,
4.8 epic-or-better drops, 1.5 wakes, sleep debt 1.3; bed at 02:00, 6.7 drops, 5.5 wakes, sleep debt 7.0
(Tired 50 the next night). Their effects only show on later nights, so the insomniac affixes are mostly a
promise on night 1.

## Interrupts always pay

Built (0.28, 0.29): the courier's parcel, the boys' raid buff; the dog petted mostly on his favourite spot
(`GOOD_BOY_SWEET_SHARE` of the petting) = Good Boy, loot goblins x2 for 60 s (dog icon on the buff bar);
cables back in under `CABLE_FAST_SEC` (6 s) restore the Flow you had when he bumped the desk; a bank shot in
the bin gives a small Flow bonus. Planned with their interrupts: car alarm +60 gold, dinner shout = Fed, the
boys' call revealing the next node row.

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

- **Audio-first loot (built 0.33):** a legendary, a full bag, a goblin, a downed hero, a boss enrage and a wipe
  each have their own sound (table in [screen.md](screen.md), Audio) and a Feed line, so you can follow the
  RPG by ear while Excel covers the screen.
- **A city upgrade every night:** tune costs so a normal night (bed at 01:00, floor 8 to 10) always affords
  the cheapest next building.
- **Bag tools:** auto-salvage threshold (Off / Common / Uncommon / Rare); Reroll one affix at the Salvage
  Forge (50 gold + 3 scraps, doubling); comparison shows total ATK and HP change.
- **Poker face (#39, idea):** a big drop while she stands in the doorway makes him grin (the grin exists since
  0.36, `n.grin`). Hold a key to keep a straight face; if he grins she gets suspicious (Mood +, next visit is a
  Peek). Loot → her: a drop becomes a tell she can read. Numbers in tuning.ts when it is built.
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
