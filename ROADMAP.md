# Roadmap

The build order. Issues hold the details; priority labels match the phases below. Reorder here first,
then update the labels. Done items leave this list (they live in `CHANGELOG.md`).

Plan: **the redesign handoff (steps 1 to 7) → outside playtests → a Steam release.** The week runs into endless
Custom Nights; there is no birthday ending (decided 2026-11-19). **Final sprites once the screens stop changing.**

## Phase 1: the redesign build and the playtest (p1)

**Slice is done when** someone other than Paweł plays it and:
- understands what to do within 2 minutes,
- gets caught at least once and feels it was their own fault,
- sees at least 3 different visit types over two nights and has to answer each differently
  (few visits per night is intended: the dread of a visit matters more than the count),
- wants to play another night right away,

and the audit in `docs/design/synergy.md` shows every slice system taking input from 2+ systems and feeding 2+.

The bot sims (good + idle) still run every round, but these four criteria come from watching a person play.

**Art track, in parallel from the start:** #26 style sheet + one test sprite of her.

1. **The redesign handoff, steps 1 to 7, in this order, each with its visuals** (spec: `docs/design/handoff-redesign.md`;
   the look: `design/redesign/`, Issues V1 to V13, #66 to #78, filed 2026-11-24). Steps 1 and 2 (#52, #53) and V1, V2
   (#66, #67) are done (0.50 to 0.62). The real-life areas V3 to V11 (#68 to #76) go in with the steps that bring
   their systems back; V12 (#77) and V13 (#78) go with #59 and #56.
   3. #54 Real life back on: done in 0.63 and 0.64 (gameplay); in the new look the phone in hand 0.65 (V8, #73) and
      the desk and monitor 0.66 (V3, #68), her panel and his chair 0.67 (V4, #69), the energy break 0.68 (V5, #70),
      the dog and the cable fix 0.69 (V6, #71). Next, the rest of real life in build order: caught (V7, #72), her
      windows (V9), the morning (V10), the small pieces (V11).
   4. #55 Q4, the Excel clicker, and the Shop app.
   5. #56 The week (FNAF's nights).
   6. #57 The smart home and the phone battery.
   7. #58 Before the playtest.
2. **Paweł's 15-minute RPG session** (real life off, F1), moved here from before step 3 (2026-11-24): the RPG
   alone needs number tuning first. Then the real-life-on night.
3. **#2 balance pass** + outside playtests against the criteria above. Round 1 done (0.40: the city pays out every
   night, tools in `test/balance.py` and `test/campaign.py`). Next: playtests with `docs/playtest.md`, then tune
   from what they show. Repeat until three testers in a row pass.
    If panic-switching on fake-outs is still free, revisit the parked crash (#16).

## Phase 2: toward Steam (p2)

- **#59 Fan-service pass:** the appeal of Steam's adult-tagged games with no 18+ requirement. Audit the whole game
  for where and what; feeds #22 and #6.
- **#60 Steam release** after the outside playtests: desktop build, Steamworks, settings, brand renames, store page.
- **#39 Poker face** (idea): a big drop while she is in the doorway makes him grin; hold a key to keep a straight face.
- **#5 Final sprites** once the slice's screens are stable (the left panel rework, 0.34 to 0.36, set its layout; him included).
- **#32 Background music**, under her sounds, ducking when she is at the door.
- **#14 Synergy pass, arc set:** combo floors, party sets, overtime zł, bag tools, banter, unfolding city,
  bounties.
- Rest of #12 (Hug, Help me, Coming to bed?, How do I look?), #20, #23 (her evening texts, dinner, laundry), #22 ("How do I look?", "Wanna join?") as the nights need them.

## Later (p3)

#24 away-from-PC dangers · #25 her rooms extras · #6 outfit unlocks ·
#7 pet choice · #16 alt-tab crash (parked) · #8 alt-tab readability · #9 lap visit vs. skill bar · #10 Zyn ·
#11 tags from cloud sessions
