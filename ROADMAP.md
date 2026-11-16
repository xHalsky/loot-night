# Roadmap

The build order. Issues hold the details; priority labels match the phases below. Reorder here first,
then update the labels. Done items leave this list (they live in `CHANGELOG.md`).

Plan: **a Monday slice that is a good game on its own → a longer arc with an ending → endless free play.
Final sprites once the screens stop changing.** We have time for polish.

## Phase 1: the Monday slice (p1)

**Slice is done when** someone other than Paweł plays it and:
- understands what to do within 2 minutes,
- gets caught at least once and feels it was their own fault,
- sees at least 3 different visit types and has to answer each differently,
- wants to play another night right away,

and the audit in `docs/design/synergy.md` shows every slice system taking input from 2+ systems and feeding 2+.

The bot sims (good + idle) still run every round, but these four criteria come from watching a person play.

**Art track, in parallel from the start:** #26 style sheet + one test sprite of her.

1. **#17 Noise by distance and masking.** Where she is decides how loud you can play.
2. **#12 Visit types, Monday set: Snack run, Chat, Cuddle** (Peek, Lean and the desk visit exist). Each asks
   for a different answer: hide the can, divide attention, leave the PC. The rest of #12 is for later nights.
3. **#18 Activity predicts the next visit type** + **activity end cues** (from #25). Listening now tells you
   when she will come *and* what to clear.
4. **#27 RPG depth:** full skill kit within a night, 3 more enemy types, different bosses on floors 5/10/15,
   Cursed Floor and Goblin Den, real-life and cross-system affixes, ability marks. Can be interleaved with steps 1 to 3; it touches different code.
5. **#19 Pre-emptive framework + 3 actions** (from #20): Text her, Make her tea, Towel under the door.
   One phone verb, one away verb, one FNAF trade.
6. **#23 two more interrupts:** courier call (pays a gear drop), friends' group call (Noise).
7. **#29 Synergy, slice set:** cross-layer echoes (Loved after a Cuddle, legendary yell, wipe desk slam),
   interrupts and the dog always pay, Goodwill (with the Raid pass as a pre-emptive action), Alibi stacks,
   Witching Hour. Closes the dead ends: the dog, Tiredness and her visits stop only punishing.
8. **#22 cheap eye-candy:** shower panel, hoodie walk-by, results vignette by Mood.
9. **#13 real audio for her cues** (steps, kettle, TV, shower, door, phone). The stealth runs on listening;
   generated beeps undersell it. Includes audio-first loot cues. Music can wait.
10. **#28 first-night onboarding.**
11. **#2 balance pass** (incl. a city upgrade every night) + outside playtests against the criteria above.
    Repeat 11 until it passes.
    If panic-switching on fake-outs is still free, revisit the parked crash (#16).

## Phase 2: the arc (p2)

- **#3 Nights after Monday**, each adding one rule, one visit type or interrupt, one dungeon. Length decided
  by content (3 to 7 nights), ending with the birthday level-up screen and credits, then endless free play
  with escalating her behaviour.
- **#5 Final sprites** once the slice's screens are stable.
- **#4 Real-life upgrade store** (the zł sink).
- **#14 Synergy pass, arc set:** combo floors, party sets, overtime zł, bag tools, banter, unfolding city,
  bounties, the ending.
- Rest of #12, #20, #23, #22 ("How do I look?", "Wanna join?") as the nights need them.

## Later (p3)

#24 away-from-PC dangers · #25 her rooms extras · #6 outfit unlocks ·
#7 pet choice · #16 alt-tab crash (parked) · #8 alt-tab readability · #9 lap visit vs. skill bar · #10 Zyn ·
#11 tags from cloud sessions
