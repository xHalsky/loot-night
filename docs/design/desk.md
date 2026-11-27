# The desk: phone, Excel, Goblin Fuel, dog, buffs

Everything here is "real life" and uses the modern look (Inter, iOS, Windows). Every minigame window
has a grey circle with a red X just outside its top-right corner (`.mg-close`); closing counts as
ignoring the interrupt. While a minigame has your hands, skills are paused and Flow decays.

## Now

### The YOU card (desk, bottom right; #49)

Tired and Zone as bars, and the Goblin Fuel button (see Goblin Fuel energy break), each from its night (the week,
[night.md](night.md)): none on Monday (no card), Tired and Zone from Tuesday, the button from Thursday. Noise is a row in her panel, under
Goodwill ([screen.md](screen.md)).

| Meter | Rises from | Falls | Matters |
|---|---|---|---|
| Noise 0 to 100 | Every hero action `NOISE_ACTION`, crit, skill cast, level-up, boss kill, Treasure Vault, dog whining, Goblin Fuel coughs and clanks | `NOISE_DECAY_PER_SEC` | Brings her sooner, scaled by how far she is ([her.md](her.md)); wakes her after midnight |
| Tired | See [night.md](night.md) | Goblin Fuel | Yawns, microsleeps, sluggish |

### The phone

One iPhone on the desk (iPhone proportions, Dynamic Island, left of the keyboard), one thing at a time. The screen
stays off until something arrives; it rings from Wednesday (the week; Monday and Tuesday you only pick it up for the
Shop and her chat). At 20:00 in week one it comes into your hand for the boys' chat in The Boys' (always text, #108)
([night.md](night.md), the week). **Fewer events, each worth taking** (#54, 3.2; `systems/interrupts.ts`): a night
has 4 to 6 of them before 01:00, each done in about 5 s with 1 or 2 taps.

**The night script** (`PHONE_SCRIPT`, made at 20:00 by `planPhone`; F1 shows what is left):

| When | Who | Answer | Ignore or fail | Decline |
|---|---|---|---|---|
| 20:30 to 21:30, once | Courier (call) | Two steps of his line and three replies, get the parcel left with a neighbour; one wrong reply and he leaves (`COURIER_TALK_SEC`). **Your new gaming mouse: skill cooldowns -`COURIER_MOUSE_CD` (10%) until dawn** | No parcel | No parcel ("he leaves a note") |
| about 21:00, once (+1 callback) | Mom (call) | `MOM_BEATS` (2) lines; her line's ending (… ? !) tells the reply (mhm / really?! / wow), tapped while a marker sweeps through a zone; `MOM_MAX_MISSES` (3). **Party fully healed, the fallen get up** | Mood +`MOM_FAIL_MOOD` and she calls your girlfriend (next visit soon) | Mood +`MOM_DECLINE_MOOD`, she calls back once in 40 to 60 s |
| about 22:00, once | Boss (texts, with an optional follow-up) | One row of sums (`BOSS_ROWS`), `BOSS_WINDOW_SEC`; wrong total -2 s. **Overtime pay +$50 (`BOSS_ZL`)** | Nothing ("The boss gave up. No overtime tonight.") | (texts can't be declined) |
| from Thursday, once a night (`NIGHT_SCHEDULE` friends), on the floor before a boss floor | The Boys (group call) | Billy calls (one of four openers), then Mike or Lance (#109): two steps of declining politely; a rude reply = Noise +8 on speaker and a miss, `FRIENDS_MAX_MISSES` misses = fail. **Raid buff: +20% damage, +10% speed until that boss fight ends** | Discord on the PC rings at full volume: Noise +`FRIENDS_FAIL_NOISE` (30); headset on: in your ears, no Noise | Group chat spam: Noise +`FRIENDS_DECLINE_NOISE` (15); headset: none |
| when she wakes (from Friday, in bed) | Her (text) | Tap "Five more minutes, love": waking `TEXT_REPLY_WAKE` | Waking +`TEXT_IGNORE_WAKE`, Mood +`TEXT_IGNORE_MOOD` | (texts can't be declined) |

Each time is picked in its window at 20:00; nothing comes before `PHONE_FIRST_SEC` (45 s) into the night. Money rule:
real life pays in dollars or buffs, never RPG loot or gold (the courier's parcel was an item; the boss paid gold).

**One demand at a time from real life** (`systems/reallife.ts`): a phone event or the dog's arrival starts only when
nothing else asks for you (the phone, a minigame, a pre-emptive action, the dog, her visit), `REAL_LIFE_GAP_SEC` (15 s)
after the last thing did, and never while she is in the shower, during a boss wind-up or during a calm you earned
(tea, the Raid pass, Text her). Scripted events slide later; they never drop. Her bedtime text only waits for the
phone itself (she is awake and wondering; holding it back would let her walk in unannounced).

- **Only calls buzz.** A call rattles every 1.4 s. Texts arrive silently: they only light the lock screen with
  banners, and wait `TEXT_DEADLINE_SEC` (60 s). You notice them by looking at the desk.
- **Speaker or pick up, on every call.** On the incoming-call screen in your hand: **Speaker** answers with the
  phone back on the desk; your hands stay free (keep playing, skills still cast, the headset key works) but the
  call adds Noise +`SPEAKER_NOISE`/s while it lasts (none with the headset on: it plays in your ears). **Pick up**
  (tap the phone, slide to answer) is hands busy and quiet.
- **Touch only.** Every answer is a tap, a slide or a hold with the mouse; the 1 2 3 keys for Mom's replies and the
  boss's sums are gone.
- **Face-down is Do Not Disturb.** Grab and swipe it over (45 px), any time; it lies with its back up until you
  flip it back. Everything is silent: no buzz, no shake, no countdown ring; a call or a text only lights the desk
  around it (a soft cool glow). Whatever runs out meanwhile counts as ignored (Mom calls your girlfriend).
- **On the desk** (V3, #68; grid doc §7): the renderer draws it lying on the desk in perspective, half off the right
  screen's left edge, lit by the monitor and lighting the desk in turn. Off: dark glass with the monitor in it.
  Ringing: the caller's colours, the slide pill and a red **Decline** (a click declines without picking up), and
  one gold chip above it, "pick up · 8 s"; it jumps with the buzz and lights the desk in the caller's warmth. Texts:
  the lock screen with the newest banners. Face down: the back, and a cool glow round it for a call or a message.
  Pointed at, idle, a gold "pick up" chip. A click anywhere else on it picks it up.
- **In your hand** (V8, #73; grid doc 7f): the renderer draws the phone (`render/page/phone.js`, the live screens at
  its end; the view in `render/phoneView.ts`), 124 × 252 on the grid at 2x over the heroes' side of the battle area,
  its bottom running off the frame; it rises from below in 0.32 s. One night-mode OS in the desk's Graphite: gold is
  what you can tap (every reply, every timer), moss accept, crimson decline and misses, her pink is her. Screens:
  the incoming call (the caller's wallpaper and avatar, the ring's seconds in a gold chip, **Speaker**, slide to answer
  with the mouse, Decline); the lock screen (the two newest banners, "+N more", Face ID: hold the ring); the boss's
  Work chat (his texts, one row of sums, three gold totals); her text in her chat (her thread, the one reply); Mom's
  call (her line, the beat bar, mhm / really?! / wow, misses, End); the courier and the boys (their line, the time,
  the goal, three replies, a wine "She can hear it" strip on speaker). Every screen can be left (Decline, Put down,
  End, the back chevron, the home bar, the close box at the top-right corner, a click outside); leaving counts as
  ignoring. A bubble that would be cut is left out (#45). **The close box** (#104) is the grey disc with the red cross
  drawn by the renderer at the grid's pixel (12 × 12, `PK.closeBox`, lighter when pointed at), not the old iOS DOM
  button. **A click outside the phone closes it** as the close box does, unless it lands on the RPG (the monitor) or on
  something that does something there (a button, a desk thing with an action, her panel's buttons, the door in the
  webcam, a window of its own).
- **The idle phone, picked up** (tap it on the desk): the home screen (the night, the big clock, the apps: Messages
  with her unread count, and the Shop; from Thursday the battery widget instead of the clock, and Home, below). **Messages** lists Babe and The Boys (3).
  **Her chat is kept for good** (`S.g.herThread`, `systems/messages.ts`): her texts, your answers, Text her and her
  replies, across the nights, with a grey separator per sitting (the day, "Today 23:12", the time after a gap); the
  wheel scrolls it a bubble at a time, a chip goes back to the newest; Text her at the bottom (dim, with a lock and
  why, when it can't). **The Boys' chat** shows the last call's exchange (their lines, your replies, how it ended)
  until the next, and their lines between the calls ([night.md](night.md), #109), with Raid night? at the bottom (dim with "Needs 40 Goodwill" while it can't). Sending types the
  message into the chat (hands busy), then Delivered.
- **The Shop** (step 4.6, #55; grid doc 7i and 7f; `systems/shop.ts`, `data/shop.ts`): real-life things for dollars,
  the money Q4 pays. The header has the back chevron, "Shop" and the wallet; tabs **For you**, **For her** and, from
  Thursday, **Home** (the smart home's devices). Each row: an icon, the name, what it does, and the price as a button (gold when you can
  pay, dim when you can't) or its state: *owned*, *tonight* (one use, bought tonight), *full*, *soon*. Buying is
  instant, with a coin and a line in the feed; the phone is in your hand (hands busy) the whole time.

  | Item | $ (`SHOP_ZL`) | Does |
  |---|---|---|
  | Goblin Fuel | 29 | `SHOP_FUEL_CANS` (4) cans into the drawer, up to its 8; *full* when it is |
  | Dog chew | 29 | His next visit comes `SHOP_CHEW_SEC` (2 min) later (bought while he is in: the one after); once a night |
  | Silent keys | 249 | Q4 makes half the Noise (kept) |
  | Mini fridge | 599 | The energy break starts at the cold can on the desk, the drawer and the grab done (kept) |
  | Ergo chair | 899 | Tiredness builds at `SHOP_CHAIR_TIRED` (15% slower) (kept) |
  | New phone | 2,999 | The battery drains at `NEW_PHONE_DRAIN` (40% slower) (kept) |
  | Flowers (For her) | 49 | +`SHOP_FLOWERS_GOODWILL` (20) Goodwill at once; once a night |
  | Fluffy socks, Knee socks, Fury tee, Pajama set, Cat-ear hoodie (For her) | 79, 99, 129, 149, 199 | Her gifts (#91): she wears one per slot a night, +20 Goodwill the first time; each with a trade-off ([her.md](her.md)) (kept) |
  | Robot vacuum, Speakers, TV cast, Door seal (Home) | 899, 199, 149, 39 | Installed for the Home app (below) (kept) |
  | Hall mirror (Home, from Tuesday) | 199 | Furniture for lean in: past stop 3 it shows round the corner; she sees you in it too ([her.md](her.md)) (kept) |
  | Bubble tea (Home) | 25 | Listed as *Home*: it is ordered in the Home app |

  What you keep is saved (`S.g.owned`); the one-use things reset each night. A thing is listed from the night its
  thing comes in (the week): Silent keys and Flowers Monday, the Ergo chair Tuesday, the Goblin Fuel, the Mini fridge,
  the Dog chew, the New phone and the Home tab Thursday. For her lists the flowers and her five gifts from Monday. The Goblin Fuel inspect window says where more cans come from.
- **The battery** (step 6.1, #57; grid doc 7j; `systems/home.ts`; FNAF's power), from Thursday: 100% at the start of
  every night. Every call or text you answer takes `BATTERY_ANSWER` (2%), each device use its own (below); the New phone
  makes everything `NEW_PHONE_DRAIN` (x0.6). It shows in the status bar (crimson from 20%), on the home screen's
  widget (the glyph, the %, "Phone" or "Low", "+40%" and the gold **Charge · 15 s away**, dim and "Full" at 100%), in
  the Home app's header and on the desk phone's lock screen. At 20% and 10% the desk phone wakes with a crimson block
  (`LOW_SHOW_SEC`). **Charge** takes you away from the PC for `CHARGE_SEC` (15 s; the empty chair, "Charging your
  phone" on the away card, preemptive.md) for +`CHARGE_ADD` (40%). **Dead at 0%:** black in your hand ("Dead. No
  calls, no texts, no Home app.", only **Charge it**), black on the desk (the empty battery as it dies). Nothing
  reaches it: what is due counts as ignored, so Mom calls your girlfriend, the boys ring Discord on the PC (Noise),
  the courier and the boss give up, her texts don't come (she keeps waking). Text her and Raid night? can't be sent.
- **The Home app** (step 6.2): the header (back, "Home", the battery, "Tap a device to use it."); the flat as room
  tiles from the build's plan (`ui/plan.ts`: Bedroom, Bath, Kitchen, Hallway, Living, You in gold), the installed
  devices on it as discs (a gold ring blinking: ready; a grey sweep and its time: resting; moss: on or running, the
  vacuum moving round its room). **It never shows where she is.** Under it the bubble tea card. Tap a device: its sheet
  rises (what it does with its condition, never whether it is met; a note; the vacuum's room chips; the battery before
  and after; one gold button with the cost, or why not now: resting, not enough battery, dead; Cancel).

  | Device | Battery (`HOME_BATT`) | Does | Rest |
  |---|---|---|---|
  | Robot vacuum | 20% | Runs `VACUUM_RUN_SEC` in the room you pick. If she is in that room or next door (`ROOM_NEXT`) she goes to stop it: her next visit `VACUUM_CALM` (45) s later | `VACUUM_REST` 3 min |
  | Speakers (a pair: kitchen, bath; tap the one you want) | 10% | A timer rings: she goes to check it, next visit `SPEAKER_CALM` (30) s later. From the 3rd in a night, Mood +5 | `SPEAKER_REST` 60 s, the pair together |
  | TV cast | 8% | While her show's credits roll (its end cue): Next episode, she stays on the couch for one more. Any other time nothing happens. Twice a night; the 3rd time she notices: Mood +10, she comes to your door | `TV_REST` 90 s |
  | Door seal | 4% a toggle | The towel's effect and downside: your Noise `SEAL_NOISE` (40%) quieter, her routine 30% slower, her steps half as loud; no light under your door; every visit "Why is your door sealed?" Mood +5 | none |
  | Bubble tea (an order) | 6%, $25 | The doorbell `TEA_DELAY_SEC` (120 s) later, sliding later while real life isn't free: she takes it to the couch, no visits for `TEA_CALM` (120 s). Asleep: it wakes her a bit (+30). Twice a night | |

  A device she has to walk to works while she is up: asleep she sleeps through it, the shower is hers. She walks to
  the room and stays there `CHECK_SEC`, then back to her own things. `npx tsx test/home.ts` checks every rule;
  `python3 test/home.py` the screens next to stills 103 and 113 to 120, 133 and 134. The sim's `HOME=1` bot installs
  everything and uses it where it works.

Sluggish (Tired 70+) shortens every call timer to `SLUGGISH_TIMER_MULT`. F1 has a button for each call (it skips the
one-demand rule). `npx tsx test/phone.ts` checks the script, the spacing, each event, speaker and Do Not Disturb.

### Excel and alt-tab

**Excel is the cover, and your job: Q4** (step 4, #55; grid doc 7i; `systems/q4.ts`, `render/q4View.ts`). Alt-tab
(Tab or the taskbar buttons) flips the monitor between the game and a maximised Windows 98 Excel,
"Q4_report_FINAL_v3.xls", over the whole game screen. Being on Excel is what passes her check; working in it pays
dollars into the wallet the Auction House pays into. The RPG fights on behind it, recklessly ([dungeon.md](dungeon.md)).
- **The sheet:** your job title and an Excel data bar to the next one (lifetime dollars); what the macros pay a
  second; Sort's x2 chip; the Hustle bar; the report (five regions and a Total) with the four toys in its columns;
  the Macros pane on the right; the status bar with "Q4 tonight: +$N" and the wallet. Excel's own pointers.
- **The toys, each pays** (times the title, Sort and Hustle), each with its sound, a moss "+$N" rising over it and
  a little animation: **AutoSum** (the big Σ or Space, `Q4_SUM`; the column rolls `Q4_ROLL_SEC`; `Q4_BALANCED_CHANCE`
  lands a BALANCED stamp with a shake, x`Q4_BALANCED_MULT`); the **fill flick** (drag the corner of C4 down and let
  go: the further and faster, the more cells, up to `Q4_FILL_MAX`; they fill in a cascade, `Q4_FILL_CELL` each, then
  the column resets); **Sort** (the column reshuffles like a split-flap board; everything, toys and macros, pays
  x`Q4_SORT_MULT` for `Q4_SORT_SEC`; `Q4_SORT_CD` cooldown, 3 s less from Team Lead); the **pivot spinner** (from
  Analyst: grab the PivotTable, turn it by hand or fling it; it spins with momentum and friction, `Q4_PIVOT_TURN` a
  full turn).
- **Macros** (the pane: name, level, what it does, Buy at `Q4_MACRO_BASE` x 1.5^level; locked until their title):
  Intern (AutoSum by itself), AutoFill (cells a second), VLOOKUP (+25% a filled cell), Conditional Formatting (+2%
  BALANCED, 40% at most), Pivot macro (turns a second), Power Query (+100% of all the macros earn, a level). They run
  all night, in the RPG and the town too (not while paused); Hustle doesn't touch them.
- **Titles** by lifetime dollars (`Q4_TITLE_AT`): Intern, Junior Analyst, Analyst, Senior Analyst, Team Lead, Manager,
  Director; each x`Q4_TITLE_MULT` on all of Q4. A promotion is Excel's dialog ("Congrats on your promotion!", the new
  title, what it unlocked, OK or Enter) with confetti; earned in the RPG, it waits for Excel and the feed says so.
  Q4 lasts across nights (the save); the morning shows what it paid.
- **Hustle:** after an alt-tab into Excel the toys pay up to x`Q4_HUSTLE_MAX`, falling to x1 over `HUSTLE_DECAY_SEC`;
  it charges back up while the RPG is on screen (`HUSTLE_RECHARGE_SEC`). Short stints, her visits, pay best.
- **Looking busy** (FNAF 2's mask): while she is in on a Peek and Excel is up, a toy in the last `Q4_BUSY_SEC` runs
  her visit x`Q4_BUSY_MULT` (she leaves sooner); idle `Q4_IDLE_SEC` and her timer waits, her note asking "What are you
  working on?", until you act. It never causes a catch by itself; switching back to the RPG while she is there still
  does.
- **Noise:** every toy action makes `Q4_NOISE` (a flick or a fling `Q4_NOISE_FLICK`, a sort `Q4_NOISE_SORT`); the
  Silent keys (Shop) halve it. The "of Greed" affix (gold a kill while Excel is up) is unchanged.

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
and tears; the teal desktop shows through (icons, grey taskbar with Start, Age of Judgment and
Q3_report.xls) while the window shrinks toward the taskbar in stutters, smearing stale copies; black
with a monitor label ("1024 x 768 60Hz / Analog"); the new screen arrives blocky and sharpens.
A Win9x hourglass cursor throughout; a relay click at the start, mode change and end.

### The Goblin Fuel inspect window

Once per save, the first time the drink matters (grid doc 7k): when you first get tired enough to yawn (`TIRED_YAWN`,
the Drink button lights) with cans in the drawer and nothing else asking for you, or when you first reach for it (G or
the Drink button), whichever comes first. A glass window over the dimmed right screen: "In your drawer" (and "New
tonight" the night the drink comes in, Thursday), the can at full size on an acid glow, bobbing; "Goblin Fuel", "100% greed. Tastes like a
loot drop."; what it does as + and - lines and how to pour it, from the tuning; the cans you have as eight slots
(`MONSTER_DRAWER`), the empty ones dark; "More in the Shop: $29 for four." (from the tuning);
Drink (G) goes on to the energy break, Later, the close box, Esc or Enter shut it. After that G and Drink go straight
to the break.

### Goblin Fuel energy break

The cans are not drawn on the desk (#49): the **Goblin Fuel button** on the YOU card (or G) is the can pack. It
glows gold from `TIRED_YAWN` while a can is left (time to top up). It is also the Snack run's tell: during a
visit's footsteps it reads "Hide cans", and a click (or G) shoves the cans under the desk (they come back out when
she leaves).

Click the button; the desk's glass window opens over the right screen, which dims behind it (V5, #70; grid doc 7c):
"Energy break", "Hands busy: abilities paused", a close box, five step pills (done moss, now gold, to come dim), the
step's line, and the scene, 392 x 258 on the grid. `MONSTER_PER_NIGHT` (3) cans per night from Thursday (a new game has none). Real life, so the desk's
world: Graphite lit by the monitor, the can in its own print colours, Tiny5. **One camera per scene**: every scene is
ray-cast through a pinhole camera in centimetres, so the desk, the drawer, the cans and the room share one
perspective (`render/page/ebreak.js`). The cursor does the handling (the game's pixel hand, open and grabbing, as a
CSS cursor); he appears only in the drink. The rules are `systems/monster.ts`, the physics `systems/fuelPhysics.ts`
(unchanged by the new look); `ui/monsterScene.ts` keeps each step's input and hands the renderer a view of it, and
the renderer's cameras say where things are on screen (`PK.ebMap`).
1. **Drawer** (from above the desk's front edge: the mouse mat and a black gaming mouse, the keyboard's corner, a
   receipt, coins, the white mug, the ring stains on his spot; the pedestal's two drawers; the floor's planks, cables,
   a power strip). Grab the handle and pull toward you: the drawer follows the hand, sticks for a moment, slides with
   a wooden rasp; let go past half and it runs out with a thunk. Inside: the cans lying down, a dead gamepad,
   batteries, a cable, a receipt.
2. **Grab**: drag a can up out of the drawer; it turns upright on the way and lands on its spot right of the mouse
   mat (the ring gold, then moss with a check, a tin clink). Let go short of the spot and it drops back.
3. **Open**: the whole can standing on the desk, from the front left, lit from the monitor's side: its branding in
   view (see The can below). Pull the tab up: it creaks, then the seal pops: "psssht", acid fizz out of the mouth.
   Noise +`MONSTER_QUIET_NOISE`, one can used.
4. **Drink** (a liquid-physics puzzle, close on him from his left, level with his glasses; the monitor at the far left
   with the game on its glass, the moonlit blinds behind him). He tips his head back (`HEAD_TILT` in
   `systems/fuelPhysics.ts`), which turns his mouth up toward the can. The can floats: one click picks it up and from
   then on it follows the mouse; bring the opening to his lips. The can is see-through and the drink in it is one
   body: its surface stays level as the can turns and sloshes with the tilt; what comes out is drawn drop by drop
   from the physics. His lips in the picture sit on the physics' mouth and the can is drawn 1:1 with the physics' can,
   so what you see is where it pours. Hold Space to
   tilt it toward him wherever it is (`MONSTER_TILT_SPEED`), let go and it eases back (`MONSTER_TILT_BACK`, slower,
   so tapping holds an angle). Tilting away from his mouth pours it on the floor. The drink is
   `MONSTER_FLUID_N` particles in a see-through can with a solid outline and a faint label. With his lips on the rim
   (`MONSTER_LIPS`) what comes out goes in, but he swallows only `MONSTER_SWALLOW` a second and his mouth holds
   `MONSTER_MOUTH_CAP`: pour faster and it runs down his chin; enough of that at once is a cough (spray, Noise
   +`MONSTER_COUGH_NOISE`). His cheeks puff as his mouth fills ("mmf!"), his throat bobs on each gulp. A meter shows
   "IN YOU" with the half and full marks, and the Space key shows pressed while it tilts. When the can is empty: `MONSTER_DRINK_FULL` (85%) or more is the full
   boost, `MONSTER_DRINK_HALF` (60%) or more half of it (half the time, half the Tiredness drop), less is nothing.
   How it plays (`test/pour.ts`): holding Space the whole time about 50% (nothing), tilting until his mouth is
   full about 72% (half), easing off as his cheeks fill 80-93%, a slow feathered tilt about 90% in 6 s (full).
5. **Toss**: from his chair, turned round: a dark corner (the window and blinds, a radiator, a low cabinet with a plant,
   a little castle and game boxes, a dragon-eye poster), the mesh bin, last nights' misses lying round it. One throw:
   grab the can, pull back (slingshot, dashed reach), the first part of the arc shows, let go. The throw's 2D physics
   stands at the bin's depth (its bin on the bin, its floor on the floor), so the can keeps its size as it flies;
   last nights' misses lie at their own depths round the bin. Rigid capsules with friction and sleeping (`systems/fuelPhysics.ts`). In: Swish, Bank shot (off the wall or
   ceiling) or In off the rim; a clean or bank shot gives a little Flow (`MONSTER_SWISH_FLOW`); hard bounces add
   Noise. **A miss stays where it lands, for good**: `S.g.floorCans` keeps every missed can across nights (up to
   `MONSTER_FLOOR_CANS_MAX`), later throws land among them and knock them about, and the mess grows. Cans in the
   bin pile up for the night. Closing the window at this step drops the can on the floor (it stays too).

**The can** is B "Chest Burst" (chosen in the design chat; canvas https://claude.ai/artifact/35VGMvUbqxQJ7eqztBALP1):
a plum neck band with "100% GREED" in gold, an acid-green field, a gold comic burst, a crowned goblin bursting out of
a loot chest with a coin and a ruby held up, gold spilling over the lip, a plum band with "Goblin" over a gold "FUEL".
The renderer uses its pixel sprites (`render/page/cans_img.js`): 72 x 174 standing, 36 x 87 in the drink, 15 x 36
thrown and lying, and the cylinder in the drawer wrapped in the 36 x 87 one.

Effect: party `MONSTER_SPEED` faster for `MONSTER_BOOST_SEC`, Tiredness `MONSTER_TIRED`, no
microsleeps; then a `MONSTER_CRASH_SEC` crash (slower, Tiredness +`MONSTER_CRASH_TIRED`).

### The dog and the cables

A shiba stands on the floor; from Thursday (the week: first at 90 s, then every 120 to 180 s) he jumps up and rests his head and front paws on the desk edge
in front of the keyboard, whining (a little Noise). He keeps to the one-demand rule (the phone above): his
arrival slides later while something else asks for you, never drops. The renderer draws him on the desk (grid doc
7d) and on an overlay over the screen's bottom edge, so his ears rise in front of the taskbar. The first time, a card
says *stroke his head, gently*.

Pet him by moving the mouse across his head (no button: the cursor turns into a hand there). Speed is measured in grid
pixels: faster than `DOG_FAST` and he flinches (*gently!*, ears back, a little petting lost). One random spot (an ear
or the chin) is his favourite (×`DOG_SWEET_MULT`): eyes close, tongue out, hearts; elsewhere he just leans in. His
tail wags harder as he gets happier (no bars). Done: he licks your hand and lies down. Petted mostly on his
favourite spot (`GOOD_BOY_SWEET_SHARE`) he is a Good Boy and leaves a lucky sock on the desk while its buff lasts.
Ignored for `DOG_WAIT_SEC`, he gives up and lies down offended (*hmph*); after 1 to 3 ignores (random each time) he
slams into the desk instead: the desk jolts, *BONK*, and the monitor cables come out.

**Cable fix.** NO SIGNAL on the monitor (the party fights on, drops are lost; the side panel goes dark with the
screen). After the slam (`CABLE_SHOW_SEC`) the back of the monitor opens in a window over the screen, the same frame
as the Goblin Fuel break: 4 cables drawn from 9 plug shapes (HDMI, DisplayPort, figure-8 power, USB-A, USB-C, DVI,
VGA, Ethernet, 3.5 mm) in random colours from 9, sockets in random order, the legend at the top. Drag each plug to
the matching shape: it clicks in or bounces back. Back in within `CABLE_FAST_SEC` of the window showing and Flow
comes back too (the header counts it down). The window's close box hides it (the cables stay out, NO SIGNAL
stays); a click on the screen opens it again.

### Buffs bar

WoW-style squares at the top right of the battle area: green border for buffs, red for debuffs, with a
cooldown sweep and seconds. Goblin Fuel boost, sugar crash, Taunt, Ward, Guilt, Good Boy, the curio and Raid buffs.
Flow, Zone and Tired are not here (#49): they have their own place (the corner, the YOU card). Hover for the effect.

## Decisions

- **Real money is dollars** (0.88, #105; Paweł after the first playtest). The same numbers relabelled (`SHOP_ZL`,
  `BOSS_ZL`, Q4's pay, the Auction House's `ZL_PER_VALUE`; the names and the save's `zl` field stay so saves carry
  over): balance and friends' saves are untouched. Some prices read high in dollars (knee socks $99, the cat hoodie
  $199); they are tuned with the economy, not here. Rejected: converting at about 4 to 1 (a one-time conversion of
  every saved wallet).
- **A click outside puts the phone down** (0.88, #104): the phone covers the battle area and the desk, so reaching
  for the close box was the slowest part of putting it down. The RPG and anything with an action are left alone so a
  click there still does its own thing.

- **The phone in the renderer** (0.65, V8 #73). The DOM iPhone was the prototype's placeholder; the redesign's
  phone is the game's pixel OS, so the phone matches the battle area and the desk. Left out for now: the incoming
  call's Message button (no rule behind it; Speaker sits alone), the battery widget and the Home app (step 6; the
  Shop came in 0.76), her photos in the chat (fan-service step 5, #59). Rejected: keeping the DOM phone under the new look (two phone looks in one game).
- **The desk phone is drawn too, and declines on the desk** (0.66, V3 #68): the same OS seen lying down, through the
  desk's camera and in its light. Its red Decline stays clickable, so a call can be turned down without picking it
  up, as before; Speaker moved into your hand (pick up, then Speaker), which the redesign's ringing desk screen has
  no room for. Declining in your hand now counts as a decline too (it had counted as ignoring since 0.65: Mom called
  your girlfriend). Rejected: making the desk phone a picture you only pick up (a red button that does nothing).
- **The phone retune: fewer events, each worth taking** (0.64, #54 3.2; Paweł's brief from testing v0.48). A
  random timer every 20 to 35 s made the phone noise: Mood taxes you could only avoid by stopping play. Now a night
  script places 4 to 6 events, each pays something you want (a heal and revive, dollars, a cooldown mouse, a raid buff)
  and takes about 5 s. Speaker gives every call a choice (hands free but loud), face-down is an honest Do Not
  Disturb, and real life asks for one thing at a time. Ignoring the boss costs nothing: he is an offer, not a
  threat. Rejected: keeping the random timer with lower odds (still noise); Mood for ignoring the boss (a tax);
  the courier's loot parcel (money rule: loot only from the game); letting the one-demand rule hold her visits back
  too (she is the game's threat and isn't scripted; the rule shapes the phone and the dog around her; Paweł
  confirmed, 2026-11-24).
- **The Goblin Fuel break is hands-on physics** (0.49, #61). The fridge is out (he has no fridge at the desk; the
  cans live in the drawer). Drinking is a pour you control, not a timing bar: the three hold-and-release gulps
  were too simple. Lips on the rim count as in: without it the stream fell past his mouth and even perfect play
  stopped near 60%. Tilting back is slower than tilting forward so tapping Space can hold an angle; with a fast
  return (2.2 rad/s) a steady pour was close to impossible. One throw and misses stay for good: the growing
  mess is the joke (a gamer's room). Rejected: keeping the fridge step; a meter that pours for you; a throw that
  reloads until it goes in. The physics lives in `systems/fuelPhysics.ts` so the pour and the throw are tested
  headless (`test/pour.ts`, `test/toss.ts`).
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
- **Q4 instead of Tetris** (0.75, step 4, #55). The handoff made Excel your job: it must be fun to touch, pay
  something on every action, level up fast and keep earning while you play, in dollars (the real-life money; gold
  stays the RPG's). The numbers are grid doc 7i's (2026-11-20), not the handoff's first ones: AutoSum $0.4, a cell
  0.15, a turn 1.2, titles x1.25, macros at base x 1.5^level and Power Query added, not multiplied (doubling made
  millions a night). Looking busy brings back a reason to act in Excel without the old meter's flaw: it never
  causes a catch, it only decides how long she stays. Rejected: keeping Tetris beside Q4 (two jobs on one sheet);
  Hustle on the macros (it would punish leaving Excel, the opposite of the RPG loop); a promotion dialog over the RPG
  (it waits for Excel, where it means something).
- **The smart home as the grid doc has it** (0.79, step 6, #57; decided 2026-11-20 with Paweł's approval of the
  mockups): the doubled battery costs, the speaker pair, the TV cast always tappable, Charge dim at 100%. It comes in
  on Thursday (the week doc; the handoff said Wednesday). My readings, for Paweł to check: the speakers rest 60 s and
  the TV cast 90 s (the page shows both resting; the handoff gives no rest); asleep or in the shower she ignores the
  devices; the doorbell wakes her a bit if she is asleep; a dead phone makes what is due count as ignored (the boys
  then ring the PC); the Home app draws the build's flat until the plan change goes in with lean in (#77). Measured
  with the `HOME=1` bot (every device, used where it works; Thursday to Sunday, 8 seeds a night): vacuum 1.1 to 1.4,
  speakers 2 to 2.5, TV cast 1.8 to 2, bubble tea 1, 0.1 to 0.6 charges, never dead, 3 stars, caught 0. The grid
  doc's typical night charges once; the bot uses the vacuum less (its 3 min rest). Rejected: lighting the TV cast
  only at the credits (it would tell a headset player where she is); the approved plan in the Home app now (it would
  disagree with the plan on the wall).
- **The Shop as the grid doc has it** (0.76, step 4, #55). Prices and effects are grid doc 7i's (Flowers 49, lowered
  from the handoff's 89 so the first night's Q4 at one click a second pays for them). Only Flowers is in For her:
  the gifts she wears (socks, tee, pajamas, hoodie) and their trade-offs come with fan service (#59), and the Home tab
  and the new phone's battery with step 6 (0.79). The free top-up to `MONSTER_PER_NIGHT` cans each night stays, from
  Thursday when the drink comes in (0.77); the Shop's pack is on top of it, so cans are never scarce yet.
  The chew is once a night so one purchase cannot push the dog off a whole night. Rejected: the shop in the morning
  (campaign.md's first plan: buying with the phone in your hand costs hands busy, which is the point); showing the
  her gifts dimmed as "soon" (a wall of things you can't buy on the first night); a Goblin Fuel price per can (four
  for 29 is one tap).
- **Excel as Tetris** (0.20 to 0.74) instead of a rhythm game: the rhythm game was too fast and gave nothing. Honest
  work paid (overtime gold) but was never required. Replaced by Q4.
- **No hands; he is only in the drink** (0.49.1, #62). The cursor handles the drawer, the can and the tab, and the
  can floats in the drink and the throw. Showing him in every shot (0.49.0) cluttered the drawer and throw shots
  without adding anything. In the drink he tips his head back, which turns his mouth up toward the can: drinking
  reads right and pouring is a little easier (a careful pour reaches full more often; holding Space still fails).
  The drawer and drink shots are drawn closer (less desk, more of what you handle); the open step shows the whole
  can so its branding is seen. Rejected: a hand holding the can (it covered the liquid), keeping the wide shots.
- **The energy break in the redesign's look, on the game's own physics** (0.68, V5, #70): the five scenes are the
  mockup's, ray-cast through one camera each; the drink's particles and the throw's rigid cans stay as they were
  (their tests and the feel of a careful pour carry over). The renderer draws them where the physics has them: the
  drink 1:1 at his lips, the throw on the bin's plane. The head stays at the physics' tilt: tipping it further as the
  can tilts (as the mockup's loop does) would move his mouth away from where the physics pours. Rejected: the mockup's
  continuous liquid driving the drink (a new pour to tune, and `test/pour.ts`'s marks would mean nothing).
- **The scenes are baked ahead in idle time** (0.68): a scene's static part is 0.2 to 0.7 s of ray casting on a slow
  machine, and the drawer needs one per 3 cm of pull, so the break bakes them in the browser's idle time during the
  night (about a minute on a slow machine), each pull past the first only the drawer's part of the picture. Opened
  early, the drawer moves in bigger steps until its pulls are ready, and the bakes go on between the break's frames.
  The break draws at 30 fps, and the right screen behind it four times a second. Rejected: baking on demand (the drawer
  stalled at every 3 cm); baking every scene at load (seconds at the title).
- **The dog and the cable fix in the redesign's look** (0.69, V6 #71). The dog is the renderer's shiba on the desk,
  his rise drawn on a transparent overlay so he comes up in front of the screen's bottom edge; the cable fix is the
  mockup's back-of-the-monitor scene in the energy break's window. Petting is measured in grid pixels now (the old desk
  canvas was 2x), so the numbers were converted, not retuned: `DOG_FAST` 2200 → 1100 and `DOG_PET_RATE` 0.0032 →
  0.0064 per pixel (the bots' strokes too, so the sims did not move). The flinch is held 0.6 s on screen: at the desk's
  15 fps a 0.4 s flinch could fall between frames. The fast fix counts from the window showing, not from the slam
  (`CABLE_SHOW_SEC`): the 1.3 s of BONK and NO SIGNAL are the dog's, not the player's. The cable window can be
  closed, as every interrupt must be escapable; the cables stay out until fixed. Rejected: keeping the DOM dog over
  the new desk (a different pixel scale in one picture); a stricter `DOG_FAST` (760, tried during the build: a normal
  quick stroke flinched); counting the fast fix from the slam (the window had not opened yet).
- **The inspect window opens when the drink first matters** (0.73, V11 #76). The handoff's call was "the first time you
  have cans"; in this build that is the start of the first night, right after the How-to card, so it would be the
  second card in a row before anything has happened. It opens instead the first time you get tired enough to yawn
  (the moment the Drink button lights and the drink is the answer) or the first time you reach for it, whichever is
  first, and only while nothing else asks for you. On the week's Thursday, when the drink comes in, that is still the
  night it arrives. Rejected: at the night's start (two cards in a row); only on G (a player who never presses it never
  learns what it does).
- **One click picks the can up; Space tilts it anywhere** (0.49.2, #62). Holding the mouse button down while
  tapping Space was easy to miss: one click without holding left the can floating and Space did nothing.
  Rejected: tilting only near his mouth (Space looked broken everywhere else).
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
