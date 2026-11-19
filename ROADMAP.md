# Roadmap

The build order. Issues hold the details; priority labels match the phases below. Reorder here first,
then update the labels. Done items leave this list (they live in `CHANGELOG.md`).

Plan: **a Monday slice that is a good game on its own → a longer arc with an ending → endless free play.
Final sprites once the screens stop changing.** We have time for polish.

## Phase 1: the Monday slice (p1)

**Slice is done when** someone other than Paweł plays it and:
- understands what to do within 2 minutes,
- gets caught at least once and feels it was their own fault,
- sees at least 3 different visit types over two nights and has to answer each differently
  (few visits per night is intended: the dread of a visit matters more than the count),
- wants to play another night right away,

and the audit in `docs/design/synergy.md` shows every slice system taking input from 2+ systems and feeding 2+.

The bot sims (good + idle) still run every round, but these four criteria come from watching a person play.

**Art track, in parallel from the start:** #26 style sheet + one test sprite of her.

1. **The redesign handoff, steps 1 to 7, in this order** (spec: `docs/design/handoff-redesign.md`). Not started:
   it waits for the visual redesign phase to finish.
   1. #52 The RPG on its own (real life off): real-time combat, packs, runs, the floor map's route choice,
      run blessings, marching order, the Rogue, loot rules.
   2. #53 Skill trees, Souls and autocast.
   3. #54 Real life back on: stars that reward greed and the phone retune (Paweł's brief from testing v0.48).
   4. #55 Q4, the Excel clicker, and the Shop app.
   5. #56 The week (FNAF's nights).
   6. #57 The smart home and the phone battery.
   7. #58 Before the playtest.
2. **#2 balance pass** + outside playtests against the criteria above. Round 1 done (0.40: the city pays out every
   night, tools in `test/balance.py` and `test/campaign.py`). Next: playtests with `docs/playtest.md`, then tune
   from what they show. Repeat until three testers in a row pass.
    If panic-switching on fake-outs is still free, revisit the parked crash (#16).

## Phase 2: the arc (p2)

- **#3 Nights after Monday** (the week in #56 replaces most of this plan; decide what is left), each adding one rule, one visit type or interrupt, one dungeon. Length decided
  by content (3 to 7 nights), ending with the birthday level-up screen and credits, then endless free play
  with escalating her behaviour.
- **#39 Poker face** (idea): a big drop while she is in the doorway makes him grin; hold a key to keep a straight face.
- **#5 Final sprites** once the slice's screens are stable (the left panel rework, 0.34 to 0.36, set its layout; him included).
- **#32 Background music**, under her sounds, ducking when she is at the door.
- **#4 Real-life upgrade store** (the zł sink; the Shop app in #55 and the devices in #57 are this store).
- **#14 Synergy pass, arc set:** combo floors, party sets, overtime zł, bag tools, banter, unfolding city,
  bounties, the ending.
- Rest of #12 (Hug, Help me, Coming to bed?, How do I look?), #20, #23, #22 ("How do I look?", "Wanna join?") as the nights need them.

## Later (p3)

#24 away-from-PC dangers · #25 her rooms extras · #6 outfit unlocks ·
#7 pet choice · #16 alt-tab crash (parked) · #8 alt-tab readability · #9 lap visit vs. skill bar · #10 Zyn ·
#11 tags from cloud sessions
