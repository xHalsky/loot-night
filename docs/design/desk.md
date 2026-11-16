# The desk: phone, Excel, Monster, dog, buffs

Everything here is "real life" and uses the modern look (Inter, iOS, Windows). Every minigame window
has a grey circle with a red X just outside its top-right corner (`.mg-close`); closing counts as
ignoring the interrupt. While a minigame has your hands, skills are paused and Flow decays.

## Now

### Meters in the YOU box (right panel)

| Meter | Rises from | Falls | Matters |
|---|---|---|---|
| Noise 0 to 100 | Every hero action `NOISE_ACTION`, crit, skill cast, level-up, boss kill, Treasure Vault, dog whining, Monster coughs and clanks | `NOISE_DECAY_PER_SEC` | Brings her sooner (up to `VISIT_NOISE_SPEEDUP`); wakes her after midnight |
| Looks busy 0 to 100 | Excel | `BUSY_DECAY_PER_SEC` | ≥ `BUSY_PASS` passes her check |
| Tired | See [night.md](night.md) | Monster | Yawns, microsleeps, sluggish |

### The phone

One iPhone on the desk (iPhone proportions, Dynamic Island, left of the keyboard), one notification at a
time (`INTERRUPT_CAP`), every `INTERRUPT_INTERVAL_SEC`. The screen stays off until something arrives.

- **Vibration you can count.** Calls: a long rattling buzz every 1.4 s. Messages come in bursts of 1 to 3;
  each one is one short double buzz, the phone visibly jumps, and a banner pops onto the lock screen at
  the same moment. The boss may follow up halfway through.
- **On the desk.** A call shows the iOS incoming-call screen; the red Decline declines at once, a tap
  anywhere else picks up. Messages wake it to the lock screen with banners.
- **In your hand.** The phone leaves the desk and opens as a 186 × 398 window over the monitor with iOS
  screens: incoming call (slide to answer), lock screen with Face ID (hold `FACE_UNLOCK_SEC`), in-call
  screen, iMessage thread with blue quick-reply buttons. Every screen can be left (put down, Decline, red
  end button, back chevron, home bar, the close X); leaving counts as ignoring.
- **Flip it face-down.** Grab and swipe left or right, any time; it lifts and turns in 3D. Face-down
  for `PHONE_DOWN_SEC`: new notifications only buzz; flipping a message face-down dismisses it (cheaper
  than ignoring); messages that expire face-down count as unseen (half penalty).

| Who | Minigame | Success | Ignore or fail | Decline |
|---|---|---|---|---|
| Mom (call, before midnight) | 3 lines; her line's ending (… ? !) tells the reply (mhm / really?! / wow), tapped while a marker sweeps through a zone; `MOM_MAX_MISSES` | Full party heal | Mood +`MOM_FAIL_MOOD` and she calls your girlfriend (next visit soon) | Mood +`MOM_DECLINE_MOOD`, she calls back in 40 to 60 s |
| Boss (messages) | Two easy sums in a chat, `BOSS_WINDOW_SEC`; wrong total −2 s | Looks busy +`BOSS_BUSY` | Mood +`BOSS_FAIL_MOOD` | Flip: Looks busy `BOSS_FLIP_BUSY` |
| Her (bedtime text) | Tap "Five more minutes, love" | Waking `TEXT_REPLY_WAKE` | Waking +`TEXT_IGNORE_WAKE`, Mood +`TEXT_IGNORE_MOOD` | Flip: Waking +`TEXT_FLIP_WAKE` |

Sluggish (Tired 70+) shortens every phone timer to `SLUGGISH_TIMER_MULT`.

### Excel and alt-tab

**Excel is the cover.** Alt-tab (Tab or the taskbar buttons) flips the monitor between the game and an
Excel sheet that looks like Excel: green title bar, ribbon, name box and formula bar, column letters,
comma-formatted cells. The minigame is spreadsheet Tetris on an `EXCEL_COLS` × `EXCEL_ROWS` sheet:
blocks fall every `EXCEL_FALL_SEC`, A/D move, W rotates, S lowers, Space drops (ribbon buttons for the
mouse). Looks busy +`EXCEL_PASSIVE_BUSY` per second just for having it open, +`EXCEL_PIECE_BUSY` per
block, +`EXCEL_ROW_BUSY` per row. Overtime pay: `EXCEL_ROW_GOLD` gold per row, ×`EXCEL_MULTI` for multi-
row clears. Topping out crashes the sheet (#REF!), Busy `EXCEL_CRASH_BUSY`. The RPG fights on behind it.

**Alt-tab lag.** Every switch, both ways, takes a random `ALT_TAB_LAG_SEC` (1.0 to 2.5 s). No input
works meanwhile (only pause and debug); a second alt-tab is ignored; skills cannot be cast. Until it
finishes you count as still on the screen you left: she sees what you were switching from.

| Alt-tab on | Time until she checks | Outcome |
|---|---|---|
| Far steps | about 4.9 s | pass |
| Hallway | 2.9 s | pass (lag at most 2.5 s) |
| Handle | 0.9 s | caught (lag at least 1.0 s) |

Passing still needs 60 Looks busy, and Excel only builds it once the switch lands. Verified by
`test/alttab.ts` (200/200 pass on the hallway cue, 200/200 caught on the handle cue).

**The switch looks like an old Windows mode change**, stretched over the lag: the last frame freezes
and tears; the teal desktop shows through (icons, grey taskbar with Start, Loot Night and
Q3_report.xls) while the window shrinks toward the taskbar in stutters, smearing stale copies; black
with a monitor label ("1024 x 768 60Hz / Analog"); the new screen arrives blocky and sharpens.
A Win9x hourglass cursor throughout; a relay click at the start, mode change and end.

### Monster energy break

Click the mini fridge on the desk; one canvas scene, five steps, `MONSTER_PER_NIGHT` (3) cans per night:
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
edge, whining (a little Noise). Pet him on the desk: hold and stroke gently; too fast (`DOG_FAST`) and
he flinches. One random spot (an ear or the chin) is his favourite (×`DOG_SWEET_MULT`): eyes close,
tongue out, hearts. His tail wags harder as he gets happier (no bars). Done: he licks your hand and lies
down. Ignored after `DOG_WAIT_SEC`, he leaves; after 1 to 3 ignores (random each time) he slams into the
desk and the monitor cables come out.

**Cable fix.** NO SIGNAL (the party fights on, drops are lost). The screen becomes the back of the
monitor: 4 cables drawn from 9 plug shapes (HDMI, DisplayPort, figure-8 power, USB-A, USB-C, DVI, VGA,
Ethernet, 3.5 mm) in random colours from 9, sockets in random order. Drag each plug to the matching
shape: it clicks in or bounces back.

### Buffs bar

WoW-style squares at the top right of the game screen: green border for buffs, red for debuffs, with a
cooldown sweep and seconds. Monster boost, sugar crash, Zone (% while building, ∞ when full), Flow
multiplier, Taunt, Ward, Guilt, Tiredness I / II / III. Hover for the effect.

## Decisions

- **One phone, one notification at a time.** Several desk objects with countdown rings (the original plan)
  read as clutter; one phone is a real-world object you already know how to handle.
- **Excel as Tetris** instead of a rhythm game: the rhythm game was too fast and gave nothing. Honest
  work pays (overtime gold) but is never required.
- **No hand in the drinking shot**; the toss went slingshot → floating fling at the user's request.
- **Monster is a boost you operate, not an interrupt.** Hands busy = danger if she peeks.
- **Alt-tab lag 1.0 to 2.5 s** (0.14) against a 0.9 s handle stage: last-second saves are impossible
  by construction.
- **Decline costs less than ignoring, more than answering.**

## Planned

- **Alt-tab crash** (parked idea, #16): repeated switches within 20 s risk a crash and a 15 s reload. Parked
  2026-11-16: lag plus the reckless autopilot (#15) should already make panic-switching costly. Revisit only if
  the sims show fake-outs are still free to react to.
- **Monster stash in the kitchen fridge** (idea, #25): the desk holds 2 cans; a "Fridge run" pre-emptive
  action restocks, and backfires if she is in the kitchen or hallway.

- More interrupts (courier, car alarm, drilling, verification SMS, friends' call, dinner shout, laundry request): #23.
- Zyn as a second stimulant: #10.
- Desk upgrades (phone stand, quieter keyboard, shorter lag): #4. Choose a pet: #7.
- Every interrupt success pays out; Alibi stacks from Excel rows: [synergy.md](synergy.md).
- Alt-tab readability on short rolls: #8.
