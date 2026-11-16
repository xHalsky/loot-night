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
  BOSS_FLIP_BUSY: -20, TEXT_FLIP_WAKE: 12, TEXT_FLIP_MOOD: 3,
  // Door peek (hold the door)
  PEEK_OPEN_SEC: 0.5, PEEK_REVEAL_SEC: 7, PEEK_FORGET_SEC: 3,   // the cloud over the map shrinks to her over 7 s of peeking
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
  ABILITY_UNLOCK: [1, 1, 4, 8, 12],
  DOWNED_REVIVE_PCT: 0.3,
  FEATHER_REVIVE_PCT: 0.5,
  WIPE_TIME_MIN: 60, WIPE_GOLD_PCT: 0.10, WIPE_BAG_LEFT: 0.5,
  ELITE_MULT: 1.5,
  // Reckless autopilot: when the player chose to leave the game (Excel, switching, minigames, cables out)
  AUTOPILOT_HEAL_BELOW: 0.35,      // the healer only heals below this (normal: 0.6)
  AUTOPILOT_NO_TANK: true,        // nobody holds aggro: enemies pick targets at random
  AUTOPILOT_PACE: 1.6,            // walking and the loot pause run this much faster: they pull without resting
  AUTOPILOT_AMBUSH_ATB: [40, 80] as [number, number],   // a careless pull: enemies start with this much ATB
  AUTOPILOT_CHAT_GAP_SEC: 12,
  AUTOPILOT_FLASH_HP: 0.5,        // the Loot Night taskbar button flashes when party HP is under this (or someone is down)     // party chat lines about you being away, at most this often

  // --- Loot ---
  BAG_SIZE: 18,
  DROP_WAIT_SEC: 8,
  BATTLE_DROP_CHANCE: 0.6,        // a normal battle drops 1 item 60% of the time
  BOSS_DROPS: 3, VAULT_DROPS: 5,
  RARITY_WEIGHTS: [60, 25, 10, 4, 1],
  RARITY_SHIFT_PER_FLOOR: [-1, 0.5, 0.3, 0.15, 0.05],
  PITY_EPIC: 40,
  GOBLIN_CHANCE: 0.03, GOBLIN_SEC: 6, GOBLIN_DROPS: 3,
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
  NOISE_CRIT: 3, NOISE_ABILITY: 4, NOISE_BOSS_KILL: 20, NOISE_VAULT: 30, NOISE_LEVEL: 6,
  BUSY_DECAY_PER_SEC: 1, BUSY_PASS: 60,

  // --- Visits (night 1: Peek only) ---
  VISIT_INTERVAL_SEC: [60, 90] as [number, number],
  VISIT_FIRST_DELAY_SEC: 35,
  TELEGRAPH_SEC: { far: 5, hall: 3, handle: 0.9 },   // handle stage < the shortest alt-tab lag: too late to switch
  VISIT_IN_SEC: 2.5,
  FAKEOUT_CHANCE: 0.2,
  VISIT_NOISE_SPEEDUP: 0.5,       // at 100 noise the wait is halved
  VISIT_RED_SPEEDUP: 0.7,
  PEEK_PASS_MOOD: -5,
  CATCH_MOOD: [15, 10, 25],
  GUILT_SEC: 30, GUILT_DMG: 0.10,
  MONITOR_OFF_SEC: 8,

  // --- Apartment / FNAF layer (night 1 = Netflix mode) ---
  ZONE_FILL_SEC: 30,              // headset on this long without a break = full Zone
  ZONE_FLOW_MULT: 1.25,           // full Zone: Flow builds 25% faster...
  ZONE_LUCK: 0.10,                // ...and +10% loot luck. Headset off empties Zone instantly.
  HEADSET_APT_VOLUME: 0.15,       // ...but apartment sounds are muffled and the map stops updating
  APT_MOVE_SEC: 2,
  APT_STALE_SEC: 15,              // map shows "last heard" as stale after this
  DOOR_MIN_GAP_SEC: 40,           // no visit sooner than this after the last one
  DOOR_MAX_GAP_SEC: 100,          // a visit is guaranteed after this long
  DOOR_BASE_CHANCE: 0.35,         // chance her next move is to your door, at each activity end
  DOOR_NOISE_CHANCE: 0.005,       // + per point of Noise
  DOOR_RED_CHANCE: 0.2,
  SHOWER_FROM: 21 * 60 + 30, SHOWER_CHANCE: 0.25,
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
  MOM_TIMER: 8, MOM_FAIL_MOOD: 10, MOM_BEATS: 3, MOM_MAX_MISSES: 4, MOM_SWEEP_SEC: 2.4, MOM_ZONE: 0.3, MOM_READ_SEC: 1.6,   // she talks first (marker waits), then you reply
  BOSS_TIMER: 12, BOSS_WINDOW_SEC: 15, BOSS_FAIL_MOOD: 8, BOSS_BUSY: 40, BOSS_ROWS: 2,
  TEXT_CHAT_SEC: 8,
  FACE_UNLOCK_SEC: 1.2,           // hold the phone to your face
  SLIDE_DIST: 150, DOOR_DIST: 70, TAKE_DIST: 170, PULL_DIST: 60, TOSS_DIST: 130,

  // --- Excel rhythm ---
  EXCEL_COLS: 8, EXCEL_ROWS: 12,
  EXCEL_FALL_SEC: 0.8,            // one row per 0.8 s: slow and readable
  EXCEL_PASSIVE_BUSY: 14,         // Busy per second just for having Excel open
  EXCEL_PIECE_BUSY: 4,
  EXCEL_ROW_BUSY: 15,
  EXCEL_ROW_GOLD: 6,              // overtime pay per cleared row
  EXCEL_MULTI: [0, 1, 2.5, 4, 6], // pay multiplier for 1-4 rows at once
  EXCEL_CRASH_BUSY: -20,

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
