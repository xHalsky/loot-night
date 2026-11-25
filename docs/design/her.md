# Her: the stealth layer

## Now

**Her stats** (left panel, "Babe" box): patience as hearts with a mood word (happy, a bit annoyed,
furious, asleep), catches as broken hearts, and after midnight a "waking up" meter.
Internally this is **Mood** 0 to 100: green below `MOOD_GREEN` (+10% loot luck), red from `MOOD_RED`
(visits likelier). 100 ends the night.

**The apartment** (`src/data/apartment.ts`, `src/systems/apartment.ts`). Between visits she moves
through the flat doing activities, each with a room, a sound and a duration:

| Activity | Room | Sound | Seconds |
|---|---|---|---|
| Watching TV | Living room | A show (two voices), a laugh track now and then | 20 to 35 (most common) |
| Making tea | Kitchen | Kettle, louder towards the boil | 10 to 18 |
| Bathroom | Bathroom | Flush (once, as she goes in) | 8 to 12 |
| On her phone | Bedroom | silent | 15 to 25 |
| Shower | Bathroom | Running water | 90 to 120, once per night after 21:30 (`SHOWER_CHANCE`): the safe window for greed |

Moving takes `APT_MOVE_SEC` with quiet steps. At each activity end she heads to your door with
`DOOR_BASE_CHANCE` + `DOOR_NOISE_CHANCE` per Noise point + `DOOR_RED_CHANCE` in red Mood
(+0.15 when you are Wrecked). Never sooner than `DOOR_MIN_GAP_SEC` after the last visit; always by
`DOOR_MAX_GAP_SEC`. Noise above 70 makes her finish activities twice as fast (not the shower). A failed
Mom call sends her to your door next.

**Noise by distance and masking.** How much of your Noise reaches her depends on where she is
(`ROOM_DISTANCE` in `src/data/apartment.ts`, `HEAR_DISTANCE` / `HEAR_MASK` in `tuning.ts`). Your room is at the
hallway's end and shares walls with the kitchen and the living room (x2, the hallway too); the bathroom is
further down the hallway (x1); the bedroom is at the far end (x0.5). The TV masks an extra x0.5; the shower masks everything (x0).
Moving between rooms counts as the hallway. This heard Noise drives her door chance and makes her wrap up
early above 70. It is never shown; the player infers it from what they hear. `test/noise.ts`: a boss kill
during her shower leaves the door chance at 35%; the same kill while she makes tea next door raises it to 85%.

**The plan** (a sheet taped to the wall in the webcam view, only its corner in frame; #35, #41; screen.md). A blue architect's floor plan:
white walls, door swings, furniture, a dashed line of sight from your door. It never marks where she is. Click
it for the large version: it teaches the layout, which rooms are next to yours (Noise by distance) and what the
crack shows. It is drawn to match the hallway behind your door (`src/ui/plan.ts`, one layout for the sheet and
its corner in the webcam view): your room is at the hallway's end, so the crack looks straight down it; on the
right wall the kitchen's open doorway (1), then the bathroom door (2); at the far end the living room's opening on
the left and the bedroom door on the right (3). The kitchen is beside your room and the living room runs along the
hallway's left side, so both share your walls. Your desk is on the far wall, facing away from the door, so the
door is right behind you as in the webcam view, and your bed is along the same wall (0.49.7, #65; they were the
other way round). The numbers 1 to 3 are the order the crack reveals them. The sheet
has no front door: nothing in the game uses it, and the crack doesn't show one. (0.49.6, #64: 0.49.5 put your
room beside the hallway and the front door at its end, but the crack's one vanishing point means you look down
the hallway's length; before that the sheet still showed the layout from before the crack view.)

Taken off the wall (grid doc 7g), the sheet is the renderer's pixel blueprint over her panel and the monitor's left
edge, everything behind it dimmed: paper, grid, pencil and edge blues on top of her 16 colours, chalk walls with
their doorways open, windows as a thin double line, door swings, pencil furniture, room names, YOU in gold, what the
crack can see as a lighter wedge cast from your door's latch, dashed sight lines in her pink to 1 2 3, the note under
it; masking tape on the top corners and a curled corner. It closes with its ✕, Esc or a click anywhere off it. The
layout comes from `ui/plan.ts` as data (walls, windows, furniture shapes, swings, stops), the same walls the webcam's
corner draws.

**Last heard** (one line under the webcam view, above the her-note, `heardHtml()`; hidden while she stands in
the doorway): what you last heard of her, where,
and how long ago: "♫ KETTLE · kitchen · 12 s ago", "♫ STEPS · hallway · now", "♫ ZZZ · bedroom". After
`APT_STALE_SEC` without a new sound it dims behind a "?" (her phone is silent, so it goes stale). Headset on:
"Headset on. You hear nothing. (H)", and it stops updating (items of Vigilance still let hallway steps
through). It never shows where she is now, only the last sound.

**Headset and Zone** (H, or click his head in the webcam view; #49). Headset on fills Zone over `ZONE_FILL_SEC`; full Zone
gives Flow ×`ZONE_FLOW_MULT` and +`ZONE_LUCK` loot luck, a cyan aura around the monitor and a ZONE
badge. But she is muffled to `HEADSET_APT_VOLUME`, the last-heard line stops updating, and the far-steps
warning is gone; in the webcam view his eyes no longer flick toward her sounds. Headset off empties Zone instantly. Starts off each night; he wears it (cyan cups), and the icon beside his head turns cyan.

**Peeking through your door** (`src/systems/peek.ts`, `drawHallway` in `src/ui/door.ts`). Hold the door: it
opens to a narrow crack (`PEEK_CRACK_MIN` of its width) in `PEEK_OPEN_SEC`, then creeps wider to
`PEEK_CRACK_MAX` over `PEEK_CREEP_SEC` (7 s). Let go and it closes. Behind it is one fixed picture of the
hallway, laid out like the blueprint and seen from your door. The crack opens from the door's right edge, so
the kitchen opening (first on the right) shows first, then the bathroom door, and the far end (the
living-room opening on the left, the bedroom door on the right) only when wide. Lights are on only where she is.

| She is | Through the crack | Crack | Can she see you |
|---|---|---|---|
| Kitchen, tea | Warm light, kettle steam, her at the counter from behind | Narrow | No |
| Bathroom | Closed door, light strip under it | Medium | No |
| Shower | Steam leaking out, frosted silhouette in the door glass | Medium | No |
| Bedroom, phone | Far door ajar, cold blue glow on the ceiling | Wide | No |
| Asleep | Far door ajar, dark | Wide | No |
| Living room, TV | Blue flicker in the opening and on the wall, her bare feet on the armrest | Wide | A little |
| Hallway / moving | Her, head to toe (big when she is at your door) | Any | Yes, fast |

If she is in the hallway or living room she can notice (`PEEK_SEEN` rates, times how open the door is, so
seeing the far end costs more risk); a red bar fills, and if it fills she rushes straight over: Mood
+`PEEK_CAUGHT_MOOD`, Flow reset. From the hallway she notices in about 2.5 s; with the TV on, the living room
comes into view at 6.4 s and she notices at 8.7 s (`npx tsx test/peekcrack.ts`). `python3 test/peek.py`
screenshots every row (`test/peek_sheet.png`).

**Visit telegraph.**

| Stage | Before she looks | Cue |
|---|---|---|
| Far steps | `TELEGRAPH_SEC.far` (5 s) | Steps, tempo shows her mood (muffled with the headset on) |
| Hallway | `hall` (3 s) | Louder steps; her bare toes in the light gap under the door |
| Handle | `handle` (0.9 s) | The handle turns |
| In | `VISIT_IN_SEC` | She stands in the doorway and checks |

`FAKEOUT_CHANCE` of the far steps just walk past ("She went to the kitchen").

**Visit types** (`src/systems/visits.ts`). Each type asks for a different answer, so the player has to
read the cue, not just alt-tab every time. The type depends on what she was doing (`VISIT_BIAS`, table
below); `VISIT_RANDOM` (25%) of the time it is drawn from `VISIT_FLAT` instead (Peek 2, Snack, Chat, Cuddle),
so the activity is a good bet and never a promise. Only the types that are in tonight are drawn (the week: peeks and
snack runs from Monday, chat from Tuesday, cuddle from Thursday; one that is out falls back to a Peek). Cuddle is only
drawn while she is happy (green). Woken visits are always Peeks. On a night that brings a new type (Tuesday chat,
Thursday a snack run that finds cans) her first visit is that type, early and safe ([night.md](night.md), the first
chance). On the first Monday the her-note names the hallway cue (`VISIT_CUE`) and the cue that
ends each activity (`END_HINT`); later nights rely on the sound. Onboarding: [night.md](night.md).

**What she was doing predicts the visit** (`test/predict.ts` prints the odds):

| She was | End cue (`END_CUE_SEC` before she moves) | Likely visit (about 75% bias + 25% flat) |
|---|---|---|
| Watching TV | Credits music | Chat or Cuddle (about 43% each in green; Chat 80% otherwise) |
| Making tea | The boil peaks and the switch clicks off | Snack run (80%) |
| Bathroom | Running tap | Peek (85%) |
| On her phone | A short goodbye jingle ("ok bye love you") | Peek (85%) |
| Shower | Hair dryer | Cuddle 55%, Peek 35% (Peek 88% when she is not green) |

Each cue plays once per activity, from the room she is in, so distance and the headset mute it like any
other sound (`APT_ROOM_GAIN`, `APT_ROOM_LOWPASS`: the TV next door is clear, the bedroom goodbye is faint).
The activity's loop stops when its cue starts. Sounds and files: [screen.md](screen.md), Audio. Listening now tells you that she is about to come *and* what to clear.

| Type | Hallway cue | She checks | Your answer | Outcome |
|---|---|---|---|---|
| Peek | Quick light steps | The screen | Excel on screen | Pass: Mood `PEEK_PASS_MOOD`. Fail: caught |
| Snack run | Plates clinking | The desk, never the screen | During the footsteps the Goblin Fuel button reads "Hide cans": click it (or G) to shove them under the desk; you can keep playing. Then "Take the plate" within `SNACK_TAKE_SEC` | Plate: party +20% HP, Mood `SNACK_PASS_MOOD`. Plate ignored: Mood +3. Cans in sight (or mid-Goblin Fuel): she confiscates one, Mood +`SNACK_FAIL_MOOD` (not a catch) |
| Chat | Humming | The screen, then your ears | Excel on screen and headset off, then answer 3 questions (`CHAT_ASK_SEC` each, good / meh / rude, shuffled; silence = meh) while staying on Excel | 2 good: Mood `CHAT_PASS_MOOD`. 2 rude: Mood +`CHAT_BAD_MOOD`. Headset on: "are you even listening?" Mood +`CHAT_HEADSET_MOOD`. Back to the game mid-chat: caught |
| Cuddle (green only) | Slow, soft slipper steps | Nothing | "Come here" or "One sec, babe" (`CUDDLE_ASK_SEC`; no answer = one sec) | Cuddle minigame below. One sec: Mood +`CUDDLE_REFUSE_MOOD` |
| Good night (green at bedtime, once) | Soft, sleepy steps | Nothing | Nothing to do | She stops at the door in your gaming hoodie, sleeves over her hands: "Night, babe." Mood `WALKBY_MOOD`, then she goes to bed ([eye-candy.md](eye-candy.md)) |

**The cuddle minigame.** Her window over the battle area (grid doc 7g: night plum, her name on a pink tab, the right
screen dimmed behind it). Her breath, a small heart in a ring that breathes with her, goes once round a big heart
over `CUDDLE_SEC`; the heart's line is stitches ahead of her and fills pink behind, so it shows the time left. Keep
your hand (the cursor, drawn over her window) inside the ring (`CUDDLE_RADIUS`): on it the ring goes solid and
hearts float up. Warmth fills the big heart, a cold checker, then purple, then pink once past `CUDDLE_PASS`, and the
bar at the foot with the pass mark's little heart. Warmth builds near the dot, drains when far, and drops fast when
the mouse moves faster than `CUDDLE_JERK` ("too fast!"). Warmth ≥ `CUDDLE_PASS` at the end: Mood
`CUDDLE_PASS_MOOD`; below: +`CUDDLE_FAIL_MOOD`. The close X means pulling away for the game (refuse
penalty). While cuddling, the party keeps the safe autopilot, Flow is frozen, and the phone and dog wait.

On Peek and Chat, switching back to the game while she still stands there gets you caught. On a Peek she watches
you work: busy in Q4 she leaves sooner, idle she waits and asks what you are working on ([desk.md](desk.md), Q4). Switching to
Excel takes 1 to 2.5 s ([desk.md](desk.md)): commit on the hallway cue or earlier.

**Caught (ladder per night).** Every catch: the scare and a sting, Mood +`CATCH_MOOD`, and Guilt (party
−`GUILT_DMG` damage for `GUILT_SEC`, [synergy.md](synergy.md)). 1st: Flow reset too. 3rd and later: she turns the
monitor off for `MONITOR_OFF_SEC` and Flow resets.

**The caught screen** (grid doc 7e). Her, head and shoulders, in your doorway with the hallway light behind her, a
late PC-98 dating-sim portrait over the whole frame, one face per rung: a stern glare, then her glasses blank white
with her face in shadow, then furious with the hallway lit red. A PC-98 text window: her name on a pink tab, WE NEED
TO TALK., and what this catch cost, written from the rules above ("Caught 1 of 3 tonight · Flow reset · Guilt: the
party deals 10% less for 30 s"; from the 4th on, "Caught 4 · ..."). The scare is `SCARE_SEC` (a white flash, an
interlaced punch-in, a shake that settles); then the screen holds for `CAUGHT_HOLD_SEC` so the line can be read, with
a blinking ▼. A click or a key after the scare puts it away; clicks and keys while it is up never reach the game.
The night runs on under it, as it does while the monitor is off.

**Lean visit.** `LEAN_CHANCE` (25%) of non-fake visits while Mood is green: no check. She leans on the
door frame, barefoot, one foot rubbing against her other calf, smiling. Mood `LEAN_MOOD`.

**Bed phase.** From Friday (the week, [night.md](night.md)): from the night's bedtime (`NIGHT_SCHEDULE` bed: 00:00 on
Friday, 01:00 on the weekend; Monday to Thursday she stays up), at the end of her current activity she goes to bed. No patrols,
Mom stops calling (the boss still pings). Noise above `WAKE_NOISE_FLOOR` raises a Waking meter. At
`WAKE_TEXT` she texts "are you coming to bed?" ([desk.md](desk.md)); a reply lowers Waking, ignoring
raises it. At `WAKE_UP` she gets up and comes to your door (never a fake-out), then goes back to bed.

**She leans into your face.** After a passed visit, while she is happy (`LAP_CHANCE` 40%, at most every
`LAP_MIN_GAP_SEC`), she leans in between you and the screen: in from outside the right edge, over the whole
frame (the webcam, the monitor, the desk; the rest dims), bent forward with her head tilted, chest up, her body
running off the bottom right (`drawHerPeek` in `src/ui/her.ts`, `drawLapFx` in `src/ui/deskFx.ts`). Her line
sits by her face, your three answers on the left. Hotkeys still work (#9). No visits or phone meanwhile. She asks
`LAP_QUESTIONS` (3) questions, `LAP_ASK_SEC` each, with a sweet, a meh and a rude answer, shuffled;
silence is meh. Two sweet: she kisses your cheek and leaves happy (Mood `LAP_HAPPY_MOOD`, no visits for
`LAP_CALM_SEC`). Two rude: she sulks off ("Fine. Enjoy your elf."). Poses change with each sweet answer
(a finger on her lips, twirling her hair, her chin on her fist). Guild chat reacts ("who is that??").

**How she looks.** Outfit comes from what she was doing: TV = off-shoulder tee and shorts with the
remote; tea = oversized hoodie and mug; phone or bathroom = tank top and shorts; shower = towel wrap and
turban with droplets; woken = sleep shirt and messy hair. Barefoot at the door, painted toenails, contact
shadow on the hallway floor. Expressions follow the situation: suspicious while she looks, smile when she
buys it, angry, then furious with an anger mark on later catches, pout when woken, blush and wink on lean
visits and when she leans in. A small reaction bubble (?, !, heart, ...) over her head.

## Decisions

- **Her questions lean into your face, over the whole screen** (0.49.7, #65, Paweł's review): she comes in from
  outside the right edge, part of her off screen, the way someone leans between you and your monitor. Rejected:
  sitting on the desk over the battle area only, with the side panel left usable (#49): it read as a window on
  the PC, not her getting in your face.

- **Her windows in the redesign's look** (0.71, V9 #74). The cuddle's rules stay as they were, in the old window's
  units: the renderer draws the same heart at half that size round its own centre, so the ring and "too fast" mean
  exactly what they did (34 and 900 there, 17 and 450 on the grid) and no number moved. The plan is drawn in the
  page's blueprint look but from the game's own apartment: the page drew the layout approved for lean in (the bathroom
  at the far end, the bedroom off the hallway, an arch, the hall mirror), which the game gets with V12 (#77) together
  with who hears you from where (`ROOM_DISTANCE`) and the crack's new view. A plan showing rooms the game doesn't have
  yet would teach the wrong hearing and the wrong crack. The layout is data in `ui/plan.ts`, so V12 changes data, not
  drawing. What is behind the plan is dimmed four times a second and the sheet drawn once (the page redrew both every
  frame, 15 to 25 ms). Rejected: the page's layout now (wrong until V12); a frozen picture behind the plan (the night
  goes on under it).
- **The caught screen in the redesign's look** (0.70, V7 #72). The portraits are the handoff's baked ones and keep
  her glasses (the redesign's 2026-11-20 decision: all character art is a stand-in until Paweł draws it). The cost
  line comes from the game's rules and numbers, not the page's three fixed lines: those left Guilt off the 1st and
  3rd rungs, and Guilt has been on every rung since the echoes. The screen holds after the 0.8 s scare: in 0.8 s the
  window is up for under 0.7 s, too short to read what the catch cost, and the decision is that the player learns the
  ladder from the scare. A click or a key ends the hold, as the ▼ asks; while it is up nothing under it draws (it covers
  the whole frame). Rejected: the scare alone (unreadable); pausing the night for the hold (she is still at the door
  and the party fights on, as with the monitor off); the page's fixed lines (they misstate the 1st catch).

- **Snack run never looks at the screen** (0.17): rewarding the player who reads the cue with staying in
  the game is what makes the cue worth reading. Hiding the cans costs one click during the footsteps,
  the same seconds an alt-tab would take.
- **Activity-biased draw, not a shuffled deck** (0.22, replaces the 0.17 deck): a night has only 2 to 4
  visits, so variety already comes from her moving between activities, and a deck would fight the prediction
  (it would hand you a Snack run after she watched TV). The 25% flat draw keeps the cue from being a
  promise. Rejected: pure random (hid the types, nothing to read), fixed order (learnable, no tension),
  100% prediction (listening becomes a lookup table).
- **Cuddle is forced, so it is safe**: the party keeps the normal autopilot. Refusing is the risky answer.
- **Alt-tab lag forces early commitment**, which makes information (blueprint, peeking, headset off)
  worth having. Without it the safe play was waiting for the handle.
- **Distance does not apply while she is asleep.** She is always in the far bedroom then, so it would only
  halve the bed phase's difficulty in disguise; the bed phase keeps its own Waking tuning.
- **The headset replaces a Listen action.** Hold-Space-to-listen cost nothing in an idle game; taking the
  headset off for a moment empties Zone, so listening has a price.
- **The blueprint never shows her exact position**, and peeking is risky; partial information is the FNAF part.
- **Peeking shows the hallway, not a map marker** (0.34, replaces the pink cloud that shrank onto her on the
  blueprint). What you learn depends on how long you dare to hold the door: the crack creeps wider, the near
  kitchen shows at once, the far rooms only when the door is wide and easiest to notice. Your door is at
  the hallway's end, so the picture is plain one-point perspective down its length (0.49.6, #64; it used to be
  explained as hand-placed, from a door in the hallway's side wall). Rejected: an "eyes adjusting" blur or mosaic reveal (mixes pixel sizes with the pixel art);
  keeping the cloud on a smaller map (a marker in all but name).
- **Last heard is one line of text** (0.34): the blueprint was meant to show it but never did. A line keeps
  the sound-first rule (the last sound, never her position) and frees the blueprint for the layout.
- **FNAF mechanics, not the horror look.** Her world is warm and sweet; danger shows through her face,
  the note colour and the sounds.
- **Tone:** tasteful pin-up. Clothed adults, flattering poses, bare-feet moments.
  Nothing explicit.
- The visit type is labelled only on the first Monday; afterwards the sound is the only tell.

## Planned

- **More visit types** (rest of #12, later nights): Hug from behind, Help me, Coming to bed?, How do I look?
- **Bias for the later visit types**: Hug from behind joins the shower row, Coming to bed? joins the bedroom
  (#18 follow-up, with #12).
- **More pre-emptive actions** (#20): the framework and three are built ([preemptive.md](preemptive.md)).
- **Eye-candy moments** (#22): shower panel, "Wanna join?", hoodie walk-by and more: [eye-candy.md](eye-candy.md).
- Room ideas (#25): audible end cues per activity (credits music, kettle whistle, flush and tap, shower →
  hair dryer → silence), a quiet run while she sleeps (snoring stops 3 s before she wakes), her phone
  call with pacing and eavesdropping, laundry.

- Per-night behaviour modes (Cleaning, Bored, Suspicious walking silently): [campaign.md](campaign.md), #3.
- Goodwill bank and Raid pass: [synergy.md](synergy.md).
- Outfit unlocks: #6. Hand-made sprites: #5.
