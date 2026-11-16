# Her: the stealth layer

## Now

**Her stats** (left panel, "Babe" box): patience as hearts with a mood word (happy, a bit annoyed,
furious, asleep), catches as broken hearts, and after midnight "waking up" instead of Looks busy.
Internally this is **Mood** 0 to 100: green below `MOOD_GREEN` (+10% loot luck), red from `MOOD_RED`
(visits likelier). 100 ends the night.

**The apartment** (`src/data/apartment.ts`, `src/systems/apartment.ts`). Between visits she moves
through the flat doing activities, each with a room, a sound and a duration:

| Activity | Room | Sound | Seconds |
|---|---|---|---|
| Watching TV | Living room | TV laughter | 20 to 35 (most common) |
| Making tea | Kitchen | Kettle | 10 to 18 |
| Bathroom | Bathroom | Flush | 8 to 12 |
| On her phone | Bedroom | silent | 15 to 25 |
| Shower | Bathroom | Running water | 90 to 120, once per night after 21:30 (`SHOWER_CHANCE`): the safe window for greed |

Moving takes `APT_MOVE_SEC` with quiet steps. At each activity end she heads to your door with
`DOOR_BASE_CHANCE` + `DOOR_NOISE_CHANCE` per Noise point + `DOOR_RED_CHANCE` in red Mood
(+0.15 when you are Wrecked). Never sooner than `DOOR_MIN_GAP_SEC` after the last visit; always by
`DOOR_MAX_GAP_SEC`. Noise above 70 makes her finish activities twice as fast (not the shower). A failed
Mom call sends her to your door next.

**The blueprint** (176 px, left panel). A blue architect's floor plan: white walls, door swings, furniture,
a dashed line of sight from your door. It never marks where she is. With the headset off it shows what
was last heard, where, and how long ago; stale after `APT_STALE_SEC`.

**Headset and Zone** (H, or click it on the desk). Headset on fills Zone over `ZONE_FILL_SEC`; full Zone
gives Flow ×`ZONE_FLOW_MULT` and +`ZONE_LUCK` loot luck, a purple aura around the monitor and a ZONE
badge. But she is muffled to `HEADSET_APT_VOLUME`, the blueprint stops updating, and the far-steps
warning is gone. Headset off empties Zone instantly. Starts off each night; disappears from the desk while worn.

**Peeking through your door.** Hold the door: it opens a crack, and the light gives a hint (TV flicker,
kitchen light, bathroom steam, her silhouette in the hallway; a frosted silhouette in the shower). A pink
cloud covers the whole flat on the blueprint and shrinks onto her over `PEEK_REVEAL_SEC` (7 s), never
smaller than about a quarter of the living room; let go and it widens again over `PEEK_FORGET_SEC`.
If she is in the hallway or living room she can notice (`PEEK_SEEN` rates); a red bar fills, and if it
fills she rushes straight over: Mood +`PEEK_CAUGHT_MOOD`, Flow reset.

**Visit telegraph.**

| Stage | Before she looks | Cue |
|---|---|---|
| Far steps | `TELEGRAPH_SEC.far` (5 s) | Steps, tempo shows her mood (muffled with the headset on) |
| Hallway | `hall` (3 s) | Louder steps; her bare toes in the light gap under the door |
| Handle | `handle` (0.9 s) | The handle turns |
| In | `VISIT_IN_SEC` | She stands in the doorway and checks |

`FAKEOUT_CHANCE` of the far steps just walk past ("She went to the kitchen").

**The check (Peek visit).** Passes if the monitor shows Excel with Looks busy ≥ `BUSY_PASS` (60), or the
monitor is off. If you switch back to the game while she still stands there, you are caught. A pass gives
Mood `PEEK_PASS_MOOD`. Switching to Excel takes 1 to 2.5 s ([desk.md](desk.md)): you must commit on the
hallway cue or earlier.

**Caught (ladder per night).** Every catch: a 0.8 s scare face and a sting, Mood +`CATCH_MOOD`.
1st: Flow reset. 2nd: Guilt, party −10% damage for 30 s. 3rd and later: she turns the monitor off for
8 s and Flow resets.

**Lean visit.** `LEAN_CHANCE` (25%) of non-fake visits while Mood is green: no check. She leans on the
door frame, barefoot, one foot rubbing against her other calf, smiling. Mood `LEAN_MOOD`.

**Bed phase.** From `BED_FROM` (24:00), at the end of her current activity she goes to bed. No patrols,
Mom stops calling (the boss still pings). Noise above `WAKE_NOISE_FLOOR` raises a Waking meter. At
`WAKE_TEXT` she texts "are you coming to bed?" ([desk.md](desk.md)); a reply lowers Waking, ignoring
raises it. At `WAKE_UP` she gets up and comes to your door (never a fake-out), then goes back to bed.

**She sits on your desk.** After a passed visit, while she is happy (`LAP_CHANCE` 40%, at most every
`LAP_MIN_GAP_SEC`), she sits on the desk in front of the monitor, seen first-person from the thighs up,
covering the screen (and the skill bar; hotkeys still work, see #9). No visits or phone meanwhile. She asks
`LAP_QUESTIONS` (3) questions, `LAP_ASK_SEC` each, with a sweet, a meh and a rude answer, shuffled;
silence is meh. Two sweet: she kisses your cheek and leaves happy (Mood `LAP_HAPPY_MOOD`, no visits for
`LAP_CALM_SEC`). Two rude: she sulks off ("Fine. Enjoy your elf."). Poses change with each sweet answer
(hands on thighs, hair twirl, leaning back). Guild chat reacts ("who is that??").

**How she looks.** Outfit comes from what she was doing: TV = off-shoulder tee and shorts with the
remote; tea = oversized hoodie and mug; phone or bathroom = tank top and shorts; shower = towel wrap and
turban with droplets; woken = sleep shirt and messy hair. Barefoot at the door, painted toenails, contact
shadow on the hallway floor. Expressions follow the situation: suspicious while she looks, smile when she
buys it, angry, then furious with an anger mark on later catches, pout when woken, blush and wink on lean
visits and on the desk. A small reaction bubble (?, !, heart, ...) over her head.

## Decisions

- **Alt-tab lag forces early commitment**, which makes information (blueprint, peeking, headset off)
  worth having. Without it the safe play was waiting for the handle.
- **The headset replaces a Listen action.** Hold-Space-to-listen cost nothing in an idle game; taking the
  headset off for a moment empties Zone, so listening has a price.
- **The blueprint never shows her exact position**, and peeking is risky; partial information is the FNAF part.
- **FNAF mechanics, not the horror look.** Her world is warm and sweet; danger shows through her face,
  the note colour and the sounds.
- **Tone:** tasteful pin-up. Clothed adults, flattering poses, bare-feet moments (the friend likes feet).
  Nothing explicit.
- Rejected: showing the visit type as a label (planned only for the first nights of the campaign).

## Planned

- **Noise by distance and masking** (#17). Noise's effect on her (visit timer, waking) is multiplied by
  where she is: next-door rooms x2, middle x1, far x0.5; TV on x0.5 more; shower or hair dryer x0. Never
  shown; the player infers it. A boss kill during her shower is free; next door it is not.
- **More visit types** (#12): Chat, Snack run, Cuddle, Hug from behind, Help me, Coming to bed?,
  How do I look?
- **Her activity predicts the next visit type** (#18, needs #12): TV → Chat or Cuddle, kitchen → Snack run,
  toilet → Peek, shower → Cuddle or Hug, bedroom → Coming to bed?, phone → Peek only; 20 to 25% random.
- **Pre-emptive actions** (#19, #20): verbs used before a visit: [preemptive.md](preemptive.md).
- **Eye-candy moments** (#22): shower panel, "Wanna join?", hoodie walk-by and more: [eye-candy.md](eye-candy.md).
- Room ideas (#25): audible end cues per activity (credits music, kettle whistle, flush and tap, shower →
  hair dryer → silence), a quiet run while she sleeps (snoring stops 3 s before she wakes), her phone
  call with pacing and eavesdropping, laundry.

- Per-night behaviour modes (Cleaning, Bored, Suspicious walking silently): [campaign.md](campaign.md), #3.
- Goodwill bank and Raid pass: [synergy.md](synergy.md).
- Outfit unlocks: #6. Hand-made sprites: #5.
