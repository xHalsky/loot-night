# The desk: phone, Excel, Goblin Fuel, dog, buffs

Everything here is "real life" and uses the modern look (Inter, iOS, Windows). Every minigame window
has a grey circle with a red X just outside its top-right corner (`.mg-close`); closing counts as
ignoring the interrupt. While a minigame has your hands, skills are paused and Flow decays.

## Now

### The YOU card (desk, bottom right; #49)

Tired and Zone as bars, and the Goblin Fuel button (see Goblin Fuel energy break). Noise is a row in her panel, under
Goodwill ([screen.md](screen.md)).

| Meter | Rises from | Falls | Matters |
|---|---|---|---|
| Noise 0 to 100 | Every hero action `NOISE_ACTION`, crit, skill cast, level-up, boss kill, Treasure Vault, dog whining, Goblin Fuel coughs and clanks | `NOISE_DECAY_PER_SEC` | Brings her sooner, scaled by how far she is ([her.md](her.md)); wakes her after midnight |
| Tired | See [night.md](night.md) | Goblin Fuel | Yawns, microsleeps, sluggish |

### The phone

One iPhone on the desk (iPhone proportions, Dynamic Island, left of the keyboard), one notification at a
time (`INTERRUPT_CAP`), every `INTERRUPT_INTERVAL_SEC`. The screen stays off until something arrives.

- **Vibration you can count.** Calls: a long rattling buzz every 1.4 s. Messages come in bursts of 1 to 3;
  each one is one short double buzz, the phone visibly jumps, and a banner pops onto the lock screen at
  the same moment. The boss may follow up halfway through.
- **On the desk.** A call shows the iOS incoming-call screen; the red Decline declines at once, a tap
  anywhere else picks up. Messages wake it to the lock screen with banners.
- **On the desk it is big** (#49): the 90 × 186 phone drawn 1.38x at the desk's left edge, running off the bottom.
  On the desk's incoming-call screen the Decline button sits right under the slider, so it stays in view.
- **In your hand.** The phone leaves the desk and opens as a 186 × 398 window over the battle area with iOS
  screens: incoming call (slide to answer), lock screen with Face ID (hold `FACE_UNLOCK_SEC`), in-call
  screen, iMessage thread with blue quick-reply buttons. Every screen can be left (put down, Decline, red
  end button, back chevron, home bar, the close X); leaving counts as ignoring. Layout rules (#45): the
  lock screen shows the two newest banners and a "+N more" line, so the Face ID ring is always a full
  76 px circle; every reply (Mom, the courier, the boys) is one full-width button per row that grows with
  its text; chat threads fade out at the top instead of cutting a bubble; the instruction lives in the
  feedback line. `python3 test/phone.py` shoots every stage of every phone game.
- **Flip it face-down.** Grab and swipe left or right, any time; it lifts and turns in 3D. It stays face-down
  until you flip it back. Face-down it is silent (#47): no buzz, no shake, no countdown ring; when a call or a
  message comes in, its screen only lights the desk around it (a soft cool glow that flares on each new
  message and pulses during a call). For players who want to ignore the phone and play. Flipping a message
  face-down dismisses it (cheaper than ignoring); messages that expire face-down count as unseen (half
  penalty). To answer anything, flip it back up.

| Who | Minigame | Success | Ignore or fail | Decline |
|---|---|---|---|---|
| Mom (call, before midnight) | 3 lines; her line's ending (… ? !) tells the reply (mhm / really?! / wow), tapped while a marker sweeps through a zone; `MOM_MAX_MISSES` | Full party heal | Mood +`MOM_FAIL_MOOD` and she calls your girlfriend (next visit soon) | Mood +`MOM_DECLINE_MOOD`, she calls back in 40 to 60 s |
| Boss (messages) | Two easy sums in a chat, `BOSS_WINDOW_SEC`; wrong total −2 s | Overtime bonus `BOSS_GOLD` gold, and no boss messages for `BOSS_QUIET_SEC` | Mood +`BOSS_FAIL_MOOD` | Flip: he pings again in `BOSS_FLIP_FOLLOWUP_SEC` |
| Her (bedtime text) | Tap "Five more minutes, love" | Waking `TEXT_REPLY_WAKE` | Waking +`TEXT_IGNORE_WAKE`, Mood +`TEXT_IGNORE_MOOD` | Flip: Waking +`TEXT_FLIP_WAKE` |
| Courier (call, until `COURIER_UNTIL` 22:00, 2 a night) | Two steps: his line, three replies, get him to leave the parcel with a neighbour; one wrong reply and he leaves; `COURIER_TALK_SEC` | The parcel: one rare-or-better item at your depth, into the bag | Parcel lost (nothing else) | Parcel lost ("he leaves a note") |
| The Boys (group call, 3 a night) | On speaker: Noise +`FRIENDS_SPEAKER_NOISE`/s while open (none with the headset on). Two steps of declining politely; a rude reply = Noise +8 and a miss, `FRIENDS_MAX_MISSES` misses = fail | **Raid buff**: party +20% damage, +10% speed for 30 s | Discord on the PC rings at full volume: Noise +`FRIENDS_FAIL_NOISE` (30); headset on: it rings in your ears, no Noise | Group chat spam: Noise +`FRIENDS_DECLINE_NOISE` (15); headset: none |

Which interrupt comes is weighted (`INTERRUPT_WEIGHTS`: Mom 3, boss 3, courier 2, the boys 2), with per-night caps
(`INTERRUPT_PER_NIGHT`). Calls (Mom, courier, the boys) ring with the long buzz, show the incoming-call screen on the
desk and in your hand, can be declined with red; face-down they ring silently (the glow) until they run out. F1 has a button for each.

Sluggish (Tired 70+) shortens every phone timer to `SLUGGISH_TIMER_MULT`.

### Excel and alt-tab

**Excel is the cover.** Alt-tab (Tab or the taskbar buttons) flips the monitor between the game and an
Excel sheet that looks like Excel: green title bar, ribbon, name box and formula bar, column letters,
comma-formatted cells. The minigame is spreadsheet Tetris on an `EXCEL_COLS` × `EXCEL_ROWS` sheet:
blocks fall every `EXCEL_FALL_SEC`, A/D move, W rotates, S lowers, Space drops (ribbon buttons for the
mouse). It is optional: being on Excel is what passes her check. Overtime pay: `EXCEL_ROW_GOLD` gold per row, ×`EXCEL_MULTI` for multi-
row clears. Topping out crashes the sheet (#REF!) and the board restarts. The RPG fights on behind it,
recklessly ([dungeon.md](dungeon.md)).

**Alt-tab lag.** Every switch, both ways, takes a random `ALT_TAB_LAG_SEC` (1.0 to 2.5 s). No input
works meanwhile (only pause and debug); a second alt-tab is ignored; skills cannot be cast. Until it
finishes you count as still on the screen you left: she sees what you were switching from.

| Alt-tab on | Time until she checks | Outcome |
|---|---|---|
| Far steps | about 4.9 s | pass |
| Hallway | 2.9 s | pass (lag at most 2.5 s) |
| Handle | 0.9 s | caught (lag at least 1.0 s) |

Excel on screen when she looks is a pass. Verified by
`test/alttab.ts` (200/200 pass on the hallway cue, 200/200 caught on the handle cue).

**The switch looks like an old Windows mode change**, stretched over the lag: the last frame freezes
and tears; the teal desktop shows through (icons, grey taskbar with Start, Loot Night and
Q3_report.xls) while the window shrinks toward the taskbar in stutters, smearing stale copies; black
with a monitor label ("1024 x 768 60Hz / Analog"); the new screen arrives blocky and sharpens.
A Win9x hourglass cursor throughout; a relay click at the start, mode change and end.

### Goblin Fuel energy break

The cans are not drawn on the desk (#49): the **Goblin Fuel button** on the YOU card (or M) is the can pack. It
glows amber from `TIRED_YAWN` while a can is left (time to top up). It is also the Snack run's tell: during a
visit's footsteps it reads "Hide the cans", and a click (or M) shoves the cans under the desk (they come back out
when she leaves).

Click the button; one canvas scene in a window over the battle area, five steps, `MONSTER_PER_NIGHT` (3) cans per night:
1. Click the fridge: it opens, stocked with a dozen cans.
2. Drag any can out and drop it anywhere on the desk (natural angle).
3. Click the can: tab click and gas hiss in one action (Noise +`MONSTER_QUIET_NOISE`).
4. Hold to drink: the can rises to his mouth in profile (no hand), head tilts back, eyes close, throat
   bobs. Release in the green band (`MONSTER_GULP_GOOD`) three times. Holding too long is a cough
   (Noise). The boost starts when the can is empty.
5. Toss: the empty can floats; grab it, pull back (dashed radius), a dotted arc previews, let go to fling.
   Real physics (two-point Verlet capsule, bounces off floor, walls and the bin rim); misses reload. A clean
   or bank shot gives a little Flow (`MONSTER_SWISH_FLOW`); hard bounces add Noise. Cans in the bin
   pile up all night.

Effect: party `MONSTER_SPEED` faster for `MONSTER_BOOST_SEC`, Tiredness `MONSTER_TIRED`, no
microsleeps; then a `MONSTER_CRASH_SEC` crash (slower, Tiredness +`MONSTER_CRASH_TIRED`). The guy is drawn
in the same pixel anime style as her: profile, tousled fringe, headset round his neck.

### The dog and the cables

A shiba stands on the floor; every `DOG_EVERY_SEC` his head, chest and front paws rise over the desk
edge in front of the keyboard, whining (a little Noise). Pet him on the desk: hold and stroke gently; too fast (`DOG_FAST`) and
he flinches. One random spot (an ear or the chin) is his favourite (×`DOG_SWEET_MULT`): eyes close,
tongue out, hearts. His tail wags harder as he gets happier (no bars). Done: he licks your hand and lies
down. Ignored after `DOG_WAIT_SEC`, he leaves; after 1 to 3 ignores (random each time) he slams into the
desk and the monitor cables come out.

**Cable fix.** NO SIGNAL (the party fights on, drops are lost; the side panel goes dark with the screen). The
screen becomes the back of the monitor: 4 cables drawn from 9 plug shapes (HDMI, DisplayPort, figure-8 power, USB-A, USB-C, DVI, VGA,
Ethernet, 3.5 mm) in random colours from 9, sockets in random order. Drag each plug to the matching
shape: it clicks in or bounces back.

### Buffs bar

WoW-style squares at the top right of the battle area: green border for buffs, red for debuffs, with a
cooldown sweep and seconds. Goblin Fuel boost, sugar crash, Taunt, Ward, Guilt, Good Boy, the curio and Raid buffs.
Flow, Zone and Tired are not here (#49): they have their own place (the corner, the YOU card). Hover for the effect.

## Decisions

- **Goblin Fuel, not Monster** (0.48.2, #60): a real energy-drink trademark can't ship on Steam. Gamers calling
  each other goblins is always funny, and it nods to the loot goblin. The can is acid green with a grinning goblin
  (the old black can with green claw marks was that brand's look). Rejected: Last Pull, ZZZERO, Crit Juice,
  Overtime; Mana, Meltdown and Midnight Oil are existing drinks.
- **Goblin Fuel is a button, not a can pack on the desk** (0.45, #49): it frees the desk and puts the stimulant next to
  the Tired bar it answers. It glows only when you are tired, so it asks for attention when it matters. Rejected:
  glowing during the snack run too (two meanings for one glow; the label change says it).

- **Face-down means silent** (0.44, #47): it used to keep buzzing, so flipping the phone did not buy the quiet
  the player asked for. Now the only sign is the glow under it, which you can watch or ignore. Rejected: no
  sign at all (you would never know you are missing a call); a dimmer buzz (still a buzz).

- **One phone, one notification at a time.** Several desk objects with countdown rings (the original plan)
  read as clutter; one phone is a real-world object you already know how to handle.
- **No Looks busy meter** (cut in 0.20): Excel on screen when she looks is a pass. The meter made players
  play Excel to fill a bar they did not watch, and it caught players who switched in time (the lag ate the
  time Excel needed to fill it). The reckless autopilot now carries the cost of hiding. Rejected: keeping
  the meter but filling it faster (the same thing with extra UI).
- **Excel as Tetris** instead of a rhythm game: the rhythm game was too fast and gave nothing. Honest
  work pays (overtime gold) but is never required.
- **No hand in the drinking shot**; the toss went slingshot → floating fling at the user's request.
- **Goblin Fuel is a boost you operate, not an interrupt.** Hands busy = danger if she peeks.
- **Alt-tab lag 1.0 to 2.5 s** (0.14) against a 0.9 s handle stage: last-second saves are impossible
  by construction.
- **Decline costs less than ignoring, more than answering.** Holds for the new calls too: the boys declined =
  chat spam (15), ignored = Discord at full volume (30).
- **One reward call, one threat call** (0.28, #23): the courier only pays (a parcel, nothing lost but the
  parcel), so answering him is greed; the boys only cost (Noise) unless you handle them, and they reward the
  headset, the one time being deaf to her pays twice. Both are short dialogues instead of new verbs: the
  phone already has enough of those. Caps (2 couriers, 3 group calls a night) because once couriers stop at
  22:00 and Mom at midnight, the boys took most of the late slots (6 to 9 calls a night in the sim).
- **The courier is unforgiving, the boys forgive one rude line**: one wrong word and a courier leaves; your
  friends get louder first.

## Planned

- **Alt-tab crash** (parked idea, #16): repeated switches within 20 s risk a crash and a 15 s reload. Parked
  2026-11-16: lag plus the reckless autopilot (#15) should already make panic-switching costly. Revisit only if
  the sims show fake-outs are still free to react to.
- **Goblin Fuel stash in the kitchen fridge** (idea, #25): the desk holds 2 cans; a "Fridge run" pre-emptive
  action restocks, and backfires if she is in the kitchen or hallway.

- Real-life requests worth taking (her evening texts, dinner shout, laundry request): #23. Dropped 2026-11-19 for
  having no answer that pays: car alarm, neighbour drilling, verification SMS.
- The boys' call revealing the next node row (an interrupt payout): #29.
- Zyn as a second stimulant: #10.
- Desk upgrades (phone stand, quieter keyboard, shorter lag): #4. Choose a pet: #7.
- Every interrupt success pays out: [synergy.md](synergy.md).
- Alt-tab readability on short rolls: #8.
