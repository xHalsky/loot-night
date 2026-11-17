// Every tunable number lives here (docs/design/README.md, rules for builders).
// Times: night clock in minutes after midnight of the evening (20:00 = 1200, 01:00 = 1500).

export const T = {
  // --- Night clock ---
  NIGHT_START: 20 * 60,
  BEDTIME: 25 * 60,
  EARLIEST_SLEEP: 23 * 60,          // can't log off before 23:00 (closes the 'sleep at 20:00 for 3 stars' exploit)
  DAWN: 30 * 60,
  SEC_PER_GAME_HOUR: 96,          // dungeon: 1 in-game hour per 96 s real time (bedtime ~8 min, dawn ~16 min)
  MENU_CLOCK_SPEED: 0.25,         // bag detail, map choice, drop popup
  COST_IDENTIFY_MIN: 10,
  COST_FURNITURE_MIN: 15,
  COST_LIST_MIN: 5,
  COST_TRAVEL_MIN: 15,

  // --- Sleep debt ---
  SLEEP_DEBT_STEP_MIN: 15,
  SLEEP_DEBT_MAX: 20,
  // --- Tiredness: the live form of sleep debt ---
  TIRED_BASE: 10,                 // long day at work: everyone starts a bit tired
  TIRED_PER_DEBT: 3,              // starting tiredness = base + sleep debt x 3
  TIRED_FROM: 22 * 60,            // tiredness grows after 22:00...
  TIRED_PER_GAME_MIN: 0.25,       // ...+15 per in-game hour (dungeon clock only): fresh = microsleeps from about 00:30
  TIRED_YAWN: 30, TIRED_MICROSLEEP: 50, TIRED_SLUGGISH: 70, TIRED_WRECKED: 90,
  YAWN_EVERY_SEC: 60, YAWN_SEC: 2,
  MICROSLEEP_EVERY_SEC: [30, 50] as [number, number],
  MICROSLEEP_CLOSE_SEC: 1.6,      // eyelids drift shut over this long; any click or key snaps them open
  SLUGGISH_TIMER_MULT: 0.85, SLUGGISH_FLOW_MULT: 0.75,

  // --- Monster ---
  MONSTER_PER_NIGHT: 3,           // prototype: topped up to this at night start (desk shop later)
  MONSTER_TIRED: -35,
  MONSTER_BOOST_SEC: 60, MONSTER_SPEED: 0.30,   // party acts 30% faster
  MONSTER_CRASH_SEC: 20, MONSTER_CRASH_SPEED: -0.15, MONSTER_CRASH_TIRED: 10,
  MONSTER_GULP_SEC: 1.0,          // hold to fill the gulp meter; release in the green band
  MONSTER_GULP_GOOD: [0.6, 1.0] as [number, number],
  MONSTER_COUGH_NOISE: 6,
  MONSTER_QUIET_NOISE: 3,         // the click + psst of opening
  MONSTER_CLANK_NOISE: 4,         // a hard bounce of a thrown can
  MONSTER_SWISH_FLOW: 0.15,       // clean bin shot: a little Flow
  // Phone declines: slower than nothing, faster than answering
  DECLINE_SEC: 1.6, FLIP_SEC: 1.0, PHONE_DOWN_SEC: 25,
  MOM_DECLINE_MOOD: 3, MOM_CALLBACK_SEC: [40, 60] as [number, number],
  BOSS_FLIP_FOLLOWUP_SEC: [20, 30] as [number, number],   // flipping the phone on the boss: he pings again soon
  TEXT_FLIP_WAKE: 12, TEXT_FLIP_MOOD: 3,
  // Door peek (hold the door)
  // Peeking: hold the door. It opens to a narrow crack in PEEK_OPEN_SEC, then creeps wider to PEEK_CRACK_MAX over
  // PEEK_CREEP_SEC (fractions of the door's width). Narrow shows the kitchen, medium the bathroom, wide the far end.
  PEEK_OPEN_SEC: 0.5, PEEK_CRACK_MIN: 0.15, PEEK_CRACK_MAX: 0.66, PEEK_CREEP_SEC: 7,
  PEEK_SEEN: { hallway: 1.4, living: 0.45, tv: 0.18 } as Record<string, number>,
  PEEK_CAUGHT_MOOD: 8,
  LEAN_CHANCE: 0.25, LEAN_MOOD: -2,      // a visit where she only leans on the frame and looks
  // The dog: pops up for attention; ignored 1-3 times -> bumps the desk, cables out
  DOG_FIRST_SEC: 50, DOG_EVERY_SEC: [70, 120] as [number, number], DOG_AGAIN_SEC: [25, 40] as [number, number], DOG_WAIT_SEC: 12, DOG_WHINE_NOISE: 0.6,
  DOG_PET_RATE: 0.0032, DOG_SWEET_MULT: 3, DOG_FAST: 2200,
  // She sits on your desk (only when she is happy): sweet-talk her off
  LAP_CHANCE: 0.4, LAP_MIN_GAP_SEC: 180, LAP_ASK_SEC: 7, LAP_QUESTIONS: 3, LAP_HAPPY_MOOD: -15, LAP_RUDE_MOOD: 6, LAP_SULK_MOOD: 10, LAP_CALM_SEC: 60,

  // --- Flow ---
  FLOW_MIN: 1, FLOW_MAX: 3, FLOW_BUILD_SEC: 60, FLOW_DECAY_MULT: 2,

  // --- Dungeon ---
  BATTLES_PER_FLOOR: 3,
  CHECKPOINT_EVERY: 5,
  WALK_SEC: 4,
  LOOT_PAUSE_SEC: 2.5,
  ATB_RATE: 3,                    // atb gain per second per point of speed; acts at 100 (speed 10 = a turn every 3.3 s)
  BATTLE_MENU_SPEED: 0.3,         // battle/walking speed while an item, the full-bag popup or the map choice is open (threats keep full speed)
  ENEMY_HP_PER_FLOOR: 0.25,
  ENEMY_ATK_PER_FLOOR: 0.24,
  INTEREST_AFTER_TURNS: 3,
  INTEREST_PER_TURN: 0.10,
  HERO_LEVEL_SCALE: 0.10,
  XP_PER_KILL: 5, XP_PER_BOSS: 40, XP_PER_LEVEL: 40, XP_LEVEL_EXP: 1.7,
  ABILITY_UNLOCK: [1, 1, 3, 5, 99],   // slot 4 (ultimates) is for later nights
  // Ability marks (docs/design/dungeon.md): a skill marks an enemy, another skill cashes the mark in.
  MARK_SEC: 6,                    // how long a mark stays on an enemy (Taunted lasts as long as the taunt)
  MARK_STAGGER_FIRE: 2,           // Fire on a Staggered enemy (Bash marks it)
  MARK_CHILL_BASH: 2.5,           // Bash on a Chilled enemy shatters it (Frost marks it)
  MARK_JUDGED_HEAL: 0.3,          // every skill hit (not auto attacks) on a Judged enemy heals the most hurt hero for this share (Smite marks it)
  MARK_TAUNT_REFLECT: 0.5,        // with Ward up, a Taunted enemy takes back this share of the damage it deals
  DOWNED_REVIVE_PCT: 0.3,
  FEATHER_REVIVE_PCT: 0.5,
  WIPE_TIME_MIN: 60, WIPE_GOLD_PCT: 0.10, WIPE_BAG_LEFT: 0.5,
  ELITE_MULT: 1.5,
  // Boss big attack (FINAL NOTICE): telegraphed, answerable with Bash (interrupt), Ward (halve) or Taunt (knight only)
  BOSS_SLAM_EVERY: 2,             // every Nth boss action is a wind-up instead of a hit
  BOSS_WINDUP_SEC: 3,             // red bar over the boss; you can hear it from Excel
  BOSS_SLAM_PCT: 0.6,            // unanswered: every hero loses this share of max HP
  BOSS_SLAM_TAUNT_PCT: 0.55,      // taunted: only the knight is hit, for this share of his max HP
  BOSS_SLAM_WARD_MULT: 0.5,
  // The Loan Shark (floor 10): every LOAN_EVERY-th action calls in a friend (Auditor or Junk Mail); a friend still
  // standing is refinanced instead: full HP and x LOAN_REFI attack. Kill friends before the next loan.
  LOAN_EVERY: 3, LOAN_WINDUP_SEC: 2, LOAN_REFI: 1.3,
  // The Landlord (floor 15): a deposit shield Bash breaks; every EVICT_EVERY-th action, EVICTION on the most hurt hero.
  EVICT_EVERY: 3, EVICT_WINDUP_SEC: 3, EVICT_PCT: 0.9,   // taunted: the knight takes BOSS_SLAM_TAUNT_PCT; Ward halves
  // Enemy roles (docs/design/dungeon.md).
  SHIELD_TAKEN: 0.25,             // a shielded enemy takes this share of damage until a Bash breaks the shield
  AUDITOR_HEAL: 0.6,              // the Auditor heals a friend for this share of his own max HP
  AUDITOR_HEAL_BELOW: 0.75,       // ...when that friend is under this share of their max HP; else he attacks
  // Reckless autopilot: when the player chose to leave the game (Excel, switching, minigames, cables out)
  AUTOPILOT_HEAL_BELOW: 0.35,      // the healer only heals below this (normal: 0.6)
  AUTOPILOT_NO_TANK: true,        // nobody holds aggro: enemies pick targets at random
  AUTOPILOT_PACE: 1.6,            // walking and the loot pause run this much faster: they pull without resting
  AUTOPILOT_AMBUSH_ATB: [40, 80] as [number, number],   // a careless pull: enemies start with this much ATB
  AUTOPILOT_CHAT_GAP_SEC: 12,
  AUTOPILOT_FLASH_HP: 0.5,        // the Loot Night taskbar button flashes when party HP is under this (or someone is down)     // party chat lines about you being away, at most this often

  // --- Loot ---
  BAG_SIZE: 18,
  POWER_PER_ILVL: 10,             // item power = 10 x item level x rarity multiplier; hero Power = average of 6 slots
  POWER_BEHIND: 0.85,             // a hero under this share of the party's best Power gets a 'needs gear' tag
  DROP_WAIT_SEC: 8,
  BATTLE_DROP_CHANCE: 0.6,        // a normal battle drops 1 item 60% of the time
  BOSS_DROPS: 3, VAULT_DROPS: 5,
  RARITY_WEIGHTS: [60, 25, 10, 4, 1],
  RARITY_SHIFT_PER_FLOOR: [-1, 0.5, 0.3, 0.15, 0.05],
  PITY_EPIC: 40,
  GOBLIN_CHANCE: 0.03, GOBLIN_SEC: 6, GOBLIN_DROPS: 3,
  // Special affixes (docs/design/loot.md): chance per rarity to roll one; life ones only from epic up.
  AFFIX_CROSS_CHANCE: { rare: 0.3, epic: 0.45, legendary: 0.35 } as Record<string, number>,
  AFFIX_LIFE_CHANCE: { epic: 0.35, legendary: 0.65 } as Record<string, number>,
  AFFIX_QUICK: 0.3, AFFIX_TIRED: 0.2, AFFIX_OWL: 0.3, AFFIX_EXCUSE_MOOD: 10,
  AFFIX_CROSS_PCT: 0.6,           // a cross-system stat bonus = this share of a main stat line at the item's level and rarity
  AFFIX_SPREADSHEET_GOLD: 3,      // per kill while Excel is up, per item
  AFFIX_QUIET_NOISE: 30, AFFIX_DOG_SEC: 60,
  // Curios in the corridor (docs/design/dungeon.md, #30). Content: data/curios.ts.
  CURIO_PER_FLOOR: [1, 2] as [number, number],   // on battle floors; none on vault or shrine floors
  CURIO_WAIT_SEC: 7,              // real seconds the party waits at a curio before walking past
  CURIO_AWAY_RECKLESS: 0.5,       // away when the party reaches one: this often they do the loud thing, else walk past
  CURIO_PICK_SEC: 8, CURIO_SMASH_NOISE: 25, CURIO_BOX_DROPS: 2,
  CURIO_GROAN_NOISE: 5, CURIO_MAIL_GOLD: 20, CURIO_MAIL_ODDS: [0.5, 0.3] as [number, number],   // gold, rare; the rest a late fee
  CURIO_FEE_DMG: 0.15,            // late fee: party damage down until the next floor
  CURIO_CAN_DMG: 0.3, CURIO_CAN_SPD: 0.2, CURIO_CAN_SEC: 60,   // offering a real can
  CURIO_PRAY_DMG: 0.15, CURIO_PRAY_SEC: 30, CURIO_BURP_NOISE: 10,
  CURIO_SNEAK_SEC: 6, CURIO_ROAR_NOISE: 15, CURIO_TROLL_DROPS: 2,
  CURIO_BANK_NOTICE_SEC: [40, 90] as [number, number], CURIO_SULK_DMG: 0.2, CURIO_SULK_SEC: 45,   // Rafał sulks: mage damage down
  CURIO_VEND_GOLD: 12, CURIO_VEND_HEAL: 0.3, CURIO_KICK_NOISE: 15,   // vend gold is per floor
  // Pre-emptive actions (docs/design/preemptive.md, #19). Content: data/preemptive.ts.
  PRE_SECOND_MULT: 0.5,           // the 2nd use of the same action in a night has this much effect
  PRE_SUSPICIOUS_AT: 3,           // ...from this use on she gets suspicious: no effect, the next visit is a Peek
  PRE_SUSPICIOUS_MOOD: 5,
  PRE_TEXT_SEC: 3, PRE_TEXT_CALM: 40, PRE_TEXT_MOOD: -5, PRE_TEXT_SOON: 10, PRE_TEXT_WAKE: 25,
  PRE_REPLY_SEC: [2, 4] as [number, number], PRE_REPLY_SHOW: 7,   // her reply lights the phone (the tell)
  PRE_TEA_SEC: 15, PRE_TEA_MOOD: -15, PRE_TEA_CALM: 60,
  PRE_EPISODE_ASK_SEC: 8, PRE_EPISODE_SEC: 60, PRE_EPISODE_CALM: 120, PRE_EPISODE_DECLINE_MOOD: 10,
  PRE_CALM_BREAK_NOISE: 70,       // heard Noise above this ends a calm: she comes to check
  PRE_TEA_HUG_SEC: 12, PRE_TEA_HUG_MOOD: -5, PRE_TEA_COLD_MOOD: -5,
  PRE_TOWEL_SEC: 2, PRE_TOWEL_NOISE: 0.4, PRE_TOWEL_SLOW: 0.3, PRE_TOWEL_STEPS: 0.5, PRE_TOWEL_SEEN_MOOD: 5,
  // Cross-layer echoes and payouts (docs/design/synergy.md, #29).
  ECHO_YELL_NOISE: 15, ECHO_YELL_HEADSET: 5,   // a legendary drop: he yells (into the mic with the headset on)
  ECHO_SLAM_NOISE: 10,                          // a wipe: he slams the desk, the dog comes over
  ECHO_ENRAGE_HP: 0.25, ECHO_ENRAGE_FLOW: 1.5,  // a boss below this HP enrages: Flow builds faster; alt-tab resets Flow
  ECHO_LOVED_DMG: 0.15, ECHO_LOVED_CRIT: 10,    // after a good cuddle, for the next fight
  ECHO_DROWSY_MISS: 0.1,                        // hero hits miss this often at Tired TIRED_SLUGGISH+
  GOOD_BOY_SEC: 60, GOOD_BOY_GOBLIN: 2, GOOD_BOY_SWEET_SHARE: 0.5,   // petted mostly on his favourite spot
  CABLE_FAST_SEC: 6,                            // cables back in this fast: Flow comes back too
  // Goodwill (docs/design/synergy.md, #29): earned from good moments with her, spent on the Raid pass and Forgiveness.
  GOODWILL_MAX: 100, GOODWILL_CARRY: 0.5,
  GOODWILL_CUDDLE: 20, GOODWILL_LAP: 20, GOODWILL_CHAT: 8, GOODWILL_TEXT: 5, GOODWILL_LEAN: 3, GOODWILL_CATCH: -15,
  GOODWILL_FORGIVE: 60,           // automatic, once a night: the next catch does not count (spends this much)
  GOODWILL_RAID: 40, RAID_CALM_SEC: 150,   // the Raid pass: no visits for 2.5 real minutes, even if you get loud
  // Witching Hour (docs/design/synergy.md, #29): from WITCHING_FROM to dawn, staying up pays.
  WITCHING_FROM: 25 * 60, WITCHING_UPGRADE: 0.35,   // each drop: chance to shift up one rarity
  WITCHING_INSOMNIAC: 0.5,        // a cross-system affix rolled in the Witching Hour is insomniac this often
  DAWN_CHASER_FROM: 27 * 60,      // Dawn Chaser counts from 03:00
  // Eye-candy (docs/design/eye-candy.md, #22).
  WALKBY_MOOD: -5, WALKBY_SEC: 3,   // green Mood at bedtime: she says good night in your hoodie (no check, once a night)
  CURSED_HEAL: 0.5,               // Cursed Floor: your heals do half; every drop is one rarity better
  GOBLIN_DEN_DROPS: 2, GOBLIN_DEN_NOISE: 8,   // Goblin Den: a goblin after every battle; catching one is loud
  MAP_DROP_CHANCE: 0.08,
  FEATHER_DROP_CHANCE: 0.04,
  FLOW_LUCK: 0.15,                // per point of flow above 1
  GREEN_MOOD_LUCK: 0.10,

  // --- Real life meters ---
  MOOD_START: 15,
  MOOD_DRIFT_EVERY_SEC: 30,
  MOOD_GREEN: 40, MOOD_RED: 75, MOOD_MAX: 100,
  NOISE_DECAY_PER_SEC: 2,
  NOISE_ACTION: 0.3,              // every hero action (keyboard clacking)
  NOISE_CRIT: 3, NOISE_ABILITY: 3.5, NOISE_BOSS_KILL: 20, NOISE_VAULT: 30, NOISE_LEVEL: 6,

  // --- Visits (night 1: Peek only) ---
  VISIT_INTERVAL_SEC: [60, 90] as [number, number],
  VISIT_FIRST_DELAY_SEC: 35,
  TELEGRAPH_SEC: { far: 5, hall: 3, handle: 0.9 },   // handle stage < the shortest alt-tab lag: too late to switch
  VISIT_IN_SEC: 2.5,
  FAKEOUT_CHANCE: 0.2,
  VISIT_RED_SPEEDUP: 0.7,
  PEEK_PASS_MOOD: -5,
  // Visit types (Monday set). Weights when she comes to your door; Cuddle only while she is happy (green).
  // The type depends on what she was doing (VISIT_BIAS, docs/design/her.md); VISIT_RANDOM of the time it ignores that
  // and draws from VISIT_FLAT instead, so the cue is a good bet and never a promise. Cuddle only while she is green.
  VISIT_RANDOM: 0.25,
  VISIT_FLAT: { peek: 2, snack: 1, chat: 1, cuddle: 1 } as Record<string, number>,
  VISIT_BIAS: {
    tv:     { chat: 1, cuddle: 1 },
    tea:    { snack: 1 },
    toilet: { peek: 1 },
    phone:  { peek: 1 },
    shower: { cuddle: 2, peek: 1 },
  } as Record<string, Record<string, number>>,
  END_CUE_SEC: 3.5,               // her activity ends with a sound this long before she moves
  SNACK_TAKE_SEC: 3, SNACK_HEAL: 0.2, SNACK_PASS_MOOD: -5, SNACK_IGNORE_MOOD: 3, SNACK_FAIL_MOOD: 8,   // fail = cans in sight: she takes one
  CHAT_QUESTIONS: 3, CHAT_ASK_SEC: 5, CHAT_PASS_MOOD: -8, CHAT_MEH_MOOD: -2, CHAT_BAD_MOOD: 10, CHAT_HEADSET_MOOD: 10,
  CUDDLE_ASK_SEC: 6, CUDDLE_SEC: 12, CUDDLE_PASS: 0.6, CUDDLE_RADIUS: 34, CUDDLE_JERK: 900,   // px/s of mouse speed that counts as rushing
  CUDDLE_PASS_MOOD: -20, CUDDLE_FAIL_MOOD: 5, CUDDLE_REFUSE_MOOD: 12,
  CATCH_MOOD: [15, 10, 25],
  GUILT_SEC: 30, GUILT_DMG: 0.10,
  MONITOR_OFF_SEC: 8,

  // --- Apartment / FNAF layer (night 1 = Netflix mode) ---
  ZONE_FILL_SEC: 30,              // headset on this long without a break = full Zone
  ZONE_FLOW_MULT: 1.25,           // full Zone: Flow builds 25% faster...
  ZONE_LUCK: 0.10,                // ...and +10% loot luck. Headset off empties Zone instantly.
  HEADSET_APT_VOLUME: 0.15,       // ...but apartment sounds are muffled and the map stops updating
  HEADSET_APT_LOWPASS: 500,       // Hz: what is left of her through the headset
  // His face in the webcam view (#37, #38): reactions and status, no gameplay effect (yet: #39 poker face)
  HIS_GRIN_RARITY: 3,             // an epic or better drop makes him grin...
  HIS_GRIN_SEC: 2.5,              // ...for this long
  HIS_FLICK_SEC: 0.9,             // his eyes flick toward a new sound for this long (not with the headset on)
  HIS_RELIEF_SEC: 2,              // after she leaves happy, relief lingers
  // What you hear of her by distance (her sounds, not your Noise): volume and the walls' low-pass (Hz).
  APT_ROOM_GAIN: { next: 1, middle: 0.65, far: 0.45 } as Record<string, number>,
  APT_ROOM_LOWPASS: { next: 2800, middle: 1600, far: 1000 } as Record<string, number>,
  AMB_FADE_SEC: 0.6,              // her TV, kettle and shower fade in and out this fast
  TV_LAUGH_CHANCE: 0.35,          // at each TV sound tick (2.5 s): the laugh track
  SLEEP_BREATH_CHANCE: 0.25,      // at each sleep tick (3 s): you hear her breathe (bedroom, very quiet)
  APT_MOVE_SEC: 2,
  APT_STALE_SEC: 15,              // map shows "last heard" as stale after this
  DOOR_MIN_GAP_SEC: 40,           // no visit sooner than this after the last one
  DOOR_MAX_GAP_SEC: 100,          // a visit is guaranteed after this long
  DOOR_BASE_CHANCE: 0.35,         // chance her next move is to your door, at each activity end
  DOOR_NOISE_CHANCE: 0.005,       // + per point of Noise
  DOOR_RED_CHANCE: 0.2,
  SHOWER_FROM: 21 * 60 + 30, SHOWER_CHANCE: 0.25,
  // Noise by distance and masking: how much of your Noise reaches her. Never shown to the player.
  HEAR_DISTANCE: { next: 2, middle: 1, far: 0.5 } as Record<string, number>,
  HEAR_MASK: { tv: 0.5, shower: 0 } as Record<string, number>,   // her activity covers your noise
  SCARE_SEC: 0.8,

  // --- After midnight: she goes to bed ---
  BED_FROM: 24 * 60,
  WAKE_NOISE_FLOOR: 30,           // Noise above this wakes her
  WAKE_RATE: 0.15,                 // wake per second per point of Noise above the floor
  WAKE_DECAY: 0.5,
  WAKE_TEXT: 60,                  // "are you coming to bed?" text
  WAKE_UP: 100,                   // she gets up and comes to your door
  WAKE_AFTER_VISIT: 30,
  TEXT_TIMER: 8, TEXT_REPLY_WAKE: -35, TEXT_REPLY_MOOD: -3, TEXT_IGNORE_WAKE: 25, TEXT_IGNORE_MOOD: 5,

  // --- Interrupts ---
  INTERRUPT_INTERVAL_SEC: [20, 35] as [number, number],
  INTERRUPT_FIRST_DELAY_SEC: 18,
  INTERRUPT_CAP: 1,               // one phone: one notification at a time
  // Which interrupt comes next (weights; Mom sleeps after midnight, couriers stop at COURIER_UNTIL).
  INTERRUPT_WEIGHTS: { mom: 3, boss: 3, courier: 2, friends: 2 } as Record<string, number>,
  INTERRUPT_PER_NIGHT: { courier: 2, friends: 3 } as Record<string, number>,   // at most this many a night
  // Courier (#23): pick the right reply twice; the parcel is a rare+ item in your bag. Lost if not.
  COURIER_TIMER: 8, COURIER_TALK_SEC: 8, COURIER_UNTIL: 22 * 60,
  // The boys' group call (#23): on speaker while open (Noise per second, none with the headset on); decline them
  // politely twice for a raid buff. Ignored or rude twice: Discord rings at full volume. Declined: chat spam.
  FRIENDS_TIMER: 8, FRIENDS_TALK_SEC: 8, FRIENDS_SPEAKER_NOISE: 4, FRIENDS_RUDE_NOISE: 8, FRIENDS_MAX_MISSES: 2,
  FRIENDS_FAIL_NOISE: 30, FRIENDS_DECLINE_NOISE: 15, FRIENDS_BUFF_DMG: 0.2, FRIENDS_BUFF_SPD: 0.1, FRIENDS_BUFF_SEC: 30,
  MOM_TIMER: 8, MOM_FAIL_MOOD: 10, MOM_BEATS: 3, MOM_MAX_MISSES: 4, MOM_SWEEP_SEC: 2.4, MOM_ZONE: 0.3, MOM_READ_SEC: 1.6,   // she talks first (marker waits), then you reply
  BOSS_TIMER: 12, BOSS_WINDOW_SEC: 15, BOSS_FAIL_MOOD: 8, BOSS_ROWS: 2,
  BOSS_GOLD: 40, BOSS_QUIET_SEC: 150,   // answering the boss: an overtime bonus, and he leaves you alone for a while
  TEXT_CHAT_SEC: 8,
  FACE_UNLOCK_SEC: 1.2,           // hold the phone to your face
  SLIDE_DIST: 150, DOOR_DIST: 70, TAKE_DIST: 170, PULL_DIST: 60, TOSS_DIST: 130,

  // --- Excel rhythm ---
  EXCEL_COLS: 8, EXCEL_ROWS: 12,
  EXCEL_FALL_SEC: 0.8,            // one row per 0.8 s: slow and readable
  EXCEL_ROW_GOLD: 6,              // overtime pay per cleared row
  EXCEL_MULTI: [0, 1, 2.5, 4, 6], // pay multiplier for 1-4 rows at once

  // --- Economy ---
  START_GOLD: 100, START_ZL: 50,
  // Alt-tab lag: every switch between the game and Excel blacks out the screen like a fullscreen game
  ALT_TAB_LAG_SEC: [1.0, 2.5] as [number, number],
  IDENTIFY_COST: { epic: 40, legendary: 100 },
  UNIDENTIFIED_VENDOR_MULT: 0.5,
  SALVAGE_YIELD: [1, 2, 4, 8, 16],
  ZL_PER_VALUE: 1 / 6,
  MARKET_RANGE: [0.8, 1.3] as [number, number],
};
