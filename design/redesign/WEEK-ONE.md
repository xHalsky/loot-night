# Loot Night: week one, the loop and the seven nights

**Approved for now** (Paweł, 2026-11-24): everything here gets tuned after the playtests. Paweł's brief: make Monday
to Sunday seven perfect nights gameplay-wise and lock in the loop; if the loop proves fun, expand (more days, new
things to buy). The second week and the endgame are TBD. This fills in the handoff's step 5 (#56: "the week schedule"
was open there) and slots in the fan-service steps (#59, its open 1). Where it changes the handoff it says so and why.
`claude/loot-night-decisions.md` wins over this; this wins over the handoff's step 5. Values marked *start* go in
`tuning.ts` / `NIGHT_SCHEDULE`.

## 1. The loop of one night

| Beat | What happens | What you decide |
|---|---|---|
| 20:00 | Hudzor's voicemail says tonight's new thing (2 or 3 lines, skippable); How to hide shows tonight's tiles, the new one framed gold; the Tonight note shows the three stars: "floor N", "don't get caught", "keep her happy" | |
| The pull | The RPG plays in real time. Deeper floors pay (the Deep star, rarer drops); a run is kept when you bank it and lost on a wipe | How deep, when to bank, which path |
| The threat | Her routine in the flat: each activity has a sound and a length; at its end she may come to your door (far steps 5 s, the hallway 3 s, the handle 0.9 s). The phone, the dog and her requests also want you: one demand at a time, 15 s apart | |
| Read her | Listen, the last-heard line, the plan on the wall, the door (a glance; lean in from Tuesday) | When to be greedy |
| Hide and answer | Tab to Excel (Q4 pays złoty while you hide); each visit type wants a different answer | |
| Prevent | Text her and Raid night? (Wednesday), the smart home (Thursday) | What to spend battery, złoty and Goodwill on |
| Earn and spend | Gold and Souls (buildings, trees), złoty (the Shop, devices, gifts), Goodwill (forgives a catch at 60, buys a Raid night at 40) | |
| The end | Sleep from 23:00. Monday the night ends at 01:00. From Tuesday you can stay up: past 01:00 costs sleep debt, dawn is 06:00. Her Mood at 100 unplugs you. From Friday, "Coming, babe" | When to stop |
| The morning | One reward per star: Deep a chest, Unseen Trust (Goodwill +20), Sweet Breakfast (sleep debt -1); the Auction House pays; Q4's take | |

**Carried over:** all RPG progress, złoty and what you bought, half your Goodwill, sleep debt, the cans on the
floor, her chat. **Unplugged:** you replay the same night ("Tuesday, again."), RPG progress kept.

**The night on the clock** (the clock runs only in the dungeon, 96 s an hour, so 20:00 to 01:00 is about 6 real
minutes; `test/sim.ts good` measures 360 s today):

| Clock | What | From |
|---|---|---|
| 20:00 | The night starts | Monday |
| 20:30 to 21:30 | The courier calls | Wednesday |
| about 21:00 | Mom calls (and calls back) | Wednesday |
| from 21:30 | Her shower (a bath on the weekend): the safe window for greed | Monday |
| about 22:00 | The boss texts (złoty) | Wednesday |
| from 22:00 | Tiredness rises (yawns at 30, microsleeps from 50, about 00:30 rested) | Tuesday |
| 23:00 | Sleep opens on the taskbar | Monday |
| 00:00 | She goes to bed: the wake-up meter, her texts after midnight | Friday (the weekend: 01:00) |
| 01:00 | Bedtime: Monday the night ends; from Tuesday the late night; from Friday the Witching Hour and "come to bed" | Tuesday |
| 06:00 | Dawn | Tuesday |

## 2. The seven nights

One headline a night, her side and yours. Everything from earlier nights stays on.

| Night | New: her | New: you | Her routine adds | Pressure (*start*) |
|---|---|---|---|---|
| **Mon** | Her routine; peek and snack-run visits (before Thursday a snack run is just the plate: no cans to hide yet) | Excel and Q4; the door (a glance); the plan; picking up the phone: the Shop and her chat | TV, tea, the toilet, her phone; the shower from 21:30 | Visits x1; no Tiredness (the one easy night); ends at 01:00 |
| **Tue** | Chat visits (Excel up and the headset off, three answers); her on the desk after a pass | The headset (Zone, but you're deaf to her); lean in and her timers (fan-service 7, 12); the hall mirror in the Shop; the Rogue joins; **Tiredness**, and the night runs past 01:00 | Yoga | Visits x1.2 |
| **Wed** | The phone rings: the courier, Mom, the boss | Messages: Text her and Raid night? | | Visits x1.2; 3 phone events |
| **Thu** | The dog; cuddle visits with her close-up (fan-service 11); the friends' call before a boss floor; snack runs look for your cans | The Goblin Fuel; the Home app, the devices and the battery | | Visits x1.2; 4 phone events; the dog twice |
| **Fri** | She goes to bed at 00:00 ("Night, babe." when she's happy), the wake-up meter, her texts after midnight with selfies (fan-service 5); "come to bed" after 01:00 (fan-service 2) | The Witching Hour after 01:00; "Coming, babe" | The sheet mask, before bed | As Thursday |
| **Sat** | **The weekend: she's off and wants you.** Tease visits (fan-service 1), the lap sit (10), "Babe, towel!" (8) | Everything | Her shower is a bath, the door ajar half the time; "Babe, bring my wine?" (13) | Visits x1.4; 1 or 2 tease visits; she goes to bed at 01:00 |
| **Sun** | **The weekend, more** | Everything | | Visits x1.6; 2 or 3 tease visits; bed at 01:00 |

Her outfits follow what she was doing from Monday (fan-service 3). The Shop fills as things come in: For you and
For her (her gifts, fan-service 4) on Monday, the hall mirror on Tuesday, the devices and the Goblin Fuel on Thursday.

**Tiredness before the Goblin Fuel:** on Tuesday and Wednesday the only answer to Tiredness is Sleep (from 23:00) and
Breakfast; the Goblin Fuel, with the cans that snack runs look for, comes Thursday.

**"Coming, babe"** (from Friday): a third answer to "come to bed". It ends the night like Sleep (sleep debt as for
Sleep at that hour) and gives the best morning, the green one (she fell asleep in your shirt), whatever her Mood. The
Sweet star still goes by her Mood. You give up the Witching Hour for her.

**How often real life wants you** before 01:00 (a model, not a sim: today's 3.7 visits in 360 s times the night's
multiplier, four fifths of that once she's in bed from 00:00, plus the phone events, the dog, the tease visits and
half a bath request; a good player):

| | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Demands | 3.7 | 4.4 | 7.4 | 10.4 | 9.6 | 13.2 | 14.9 |
| Seconds apart | 97 | 81 | 48 | 34 | 38 | 27 | 24 |
| The handoff's schedule, seconds apart | 97 | 97 | 41 | 28 | 30 | 28 | (Custom Night) |

Friday dips on purpose: she's in bed from 00:00, and the pressure changes from visits to Noise (the wake-up meter).

## 2b. Every new thing is taught the night it unlocks

Paweł (2026-11-24): a mechanic is introduced when it unlocks. Each night's new things are taught that night, the same
four ways:
1. **The 20:00 voice note** names it: the handoff's "Hudzor's voicemail" is a voice message from Billy (Hudzor is his
   character) in The Boys' chat, the phone in your hand while the night waits (grid doc 7m).
2. **How to hide** shows its tile, framed gold with "new tonight", when it's about hiding or reading her.
3. **Its first chance is scripted early,** within about 2 real minutes of 20:00, and safe: it can't cost you the first
   time.
4. **A coach mark** at that first chance (the game crawls until you do it, grid doc 7k), then its first-time tip in
   the feed.

Before it unlocks, nothing hints at it. The build's coach marks already cover the footsteps, her at your door, the
phone, loot, a wind-up and the headset; the rest get theirs when their step is built.

**Lean in, Tuesday** (mocked on the Game Frame page: Lean in, the Tuesday row; Small pieces, How to hide):
- **Monday:** holding the door is the glance, nothing more.
- **The voice note:** "hixx is in the party tonight" / "hold your door open longer: you lean in and see what she's
  doing" / "she can see you too tho. don't get weird".
- **How to hide:** five tiles on Tuesday; the headset and Lean in are framed gold. Lean in: "Hold the door open: you
  lean in and see what she is doing. Move the mouse to look. While you look you cannot play, and she can see you."
- **The first chance:** Tuesday opens with her yoga in the living room (stop 3), so within about 2 real minutes she is
  busy where the lean reaches. No visit comes while that first yoga lasts.
- **Coach mark 1, Lean in,** rings the door in the webcam view (him turned toward it): "She is doing yoga. Hold the door
  open and you lean in to watch. How far along she is tells you how long you have." The game crawls until you hold the
  door open, she finishes, or you close the mark.
- **Coach mark 2, You are leaning in,** rings the slit: "Move the mouse to look: 1 2 3 are the rooms. The wheel opens the
  door wider, the right button looks closer. Let go of the door to get back to the game." It crawls until you have
  leaned through a stop or let go. The first lean is safe: her tell can't start in its first `LEAN_FIRST_SAFE_SEC`
  (*start* 6 s).
- **Coach mark 3, She is turning,** the first time her tell comes while you lean: it rings the eye and the red bar, the
  callout beside the slit (not over her): "Her head turns toward your door. Let go now, or she sees you. The wider the
  door, the faster the red bar fills." The game, her turn with it, crawls until you let go: the first tell teaches the
  timing, it never spots you.
- **The feed:** the build's peek tip on the first lean (Hudzor: "the wider you open the door, the more you see. and the
  more she sees you"); the hall mirror's tip when you buy it (Hudzor: "the mirror shows round the corner. works both
  ways tho").
- **Coach mark priority** (the build's bump order): her tell right after the footsteps (you can't see the game while
  you lean, so it never meets a wind-up); Lean in and You are leaning in last, after loot.

**The pieces each night needs** are drawn and approved (grid doc 7m, the page's Week one rows): Billy's voice note, the replay
morning ("Tuesday, again"), the snack run's Hide cans and plate, the tease visit with Eyes busy, her towel and wine
requests and the away card for them, the waking meter, "come to bed" with "Coming, babe", the lap sit.

## 3. What changes from the handoff, and why

1. **The Shop opens Monday.** Q4 pays złoty from Monday and the Shop check (grid doc 7i) has Flowers as Monday's buy;
   without a Shop, Monday's złoty are only a number. You can pick up the phone from Monday (the Shop, her chat);
   Wednesday is when it starts ringing.
2. **Tuesday gets lean in, her timers and yoga** instead of "the door moves (tea, towel)". Step 6 removed tea and the
   towel for the Door seal, a device that needs the Home app, so Tuesday's door moves had nothing left. Lean in is
   the door held long, so it builds on Monday's glance.
3. **Monday is the only night without Tiredness** (Paweł): one easy night to get to grips with the systems.
   Tiredness comes Tuesday (the handoff: Thursday). Monday ends at 01:00: with no Tiredness, playing to dawn would
   cost nothing that night and start Tuesday at Tired 70 (sleep debt at its maximum). Monday's Breakfast pays nothing
   (sleep debt is 0); kept as it is (Paweł).
4. **The Home app, the devices and the battery come Thursday** (Paweł; the handoff: Wednesday with the phone), so
   Wednesday teaches only the phone ringing and Messages.
5. **A smoother ramp, and a weekend that is harder.** The handoff keeps visits at x1 until Saturday's x1.3 and puts
   4 to 6 phone events in from Wednesday, so the gap between demands drops from 97 s to 41 s in one night; the
   build's dog (about 4 a night) takes Thursday to 28 s; and Saturday (28 s) is no harder than Thursday. Here: visits
   x1.2 from Tuesday, 3 phone events on Wednesday (the courier, Mom, the boss) and 4 from Thursday, when the friends'
   call joins (the low end of the handoff's 4 to 6), the dog twice a night (*start*: first at 90 s, then every 120 to
   180 s).
6. **The fan-service steps get their nights** (fan-service open 1): lean in and her timers Tuesday, the cuddle
   close-up Thursday, selfies and "come to bed" Friday, the tease visit, the lap sit, the towel and the bath with
   its wine on the weekend, which is where "she has the weekend off and wants your attention" (Paweł) lives.
7. **The bath goes in her routine on the weekend** (fan-service open 5): on Saturday and Sunday her shower is a bath,
   *start* 120 to 150 s, from 21:30, the door ajar half the time.
8. **Visits as a multiplier per night** (`VISIT_MULT` in `NIGHT_SCHEDULE`) instead of one `SATURDAY_VISIT_MULT`.
9. **"Come to bed" gets "Coming, babe"** (Paweł; fan-service open 3), as in section 2.

## 4. The weekend

Paweł (2026-11-24): the weekend is on and gaming gets harder, because she has the weekend off and wants your
attention. Saturday brings the attention set (tease visits, the lap sit, the towel, the bath and its wine); Sunday
ramps on from it. Taken for now (Paweł): visits x1.4 on Saturday and x1.6 on Sunday, tease visits 1 or 2 and then 2
or 3 (weighted to boss wind-ups and legendaries, as in fan-service 1), and she goes to bed at 01:00 on both weekend
nights (no work tomorrow), so "come to bed" lands at 01:00. Not taken: the lap sit from Goodwill 50, the wine with
every bath.

## 5. What makes it perfect (the checks)

| Check | Target | How |
|---|---|---|
| A night to 01:00 | About 6 real minutes; from Tuesday up to about 14 if you stay to dawn | `test/sim.ts` |
| Tonight's new thing | Taught as in section 2b: named at 20:00, its first chance within 2 real minutes and safe, coach-marked | Scripted per night |
| Real life | The seconds-apart row above, within 20% | The sims with `NIGHT_SCHEDULE` |
| A good bot | 3 stars most nights Monday to Wednesday, about 2.5 Thursday and Friday, about 2 on the weekend | `test/campaign.py` with `NIGHTS=7` |
| The idle bot | Caught and unplugged every night (today: unplugged on Monday after 231 s) | `test/sim.ts idle` per night |
| A new player | Caught on Monday and calls it his own fault; three visit types by Tuesday; wants the next night right away | The roadmap's playtest criteria |
| The RPG | The ultimates around Wednesday and Thursday, all four by Sunday (grid doc 6c); a Q4 promotion about every night; something worth buying every night to Thursday (Friday on: section 6) | The campaign sim, grid doc 7i's model |

Today's build gives a good bot 3 stars on every night (`test/balance.py 12 good`: 3.00, 3.7 visits, 0 catches), so
the Deep star's "your record or deeper" (step 3.1) is what has to make the good bot miss some.

## 6. Later (known, not for now)

- **Złoty run out of things to buy inside week one:** from about night 5 (Friday) Q4 makes far more than the Shop
  sells (grid doc 7i). New things to buy come once the loop proves fun (Paweł).
- Week two and the endgame (TBD).
- Every number here: tuned after the playtests.
