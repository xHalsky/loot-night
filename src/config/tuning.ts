// Every tunable number lives here (docs/design/README.md, rules for builders).
// Times: night clock in minutes after midnight of the evening (20:00 = 1200, 01:00 = 1500).

/** One night of the week (NIGHT_SCHEDULE). */
export interface NightPlan { day: string; adds: string[]; visits: number; bed: number; end: number; dog: [number, number, number] | null; friends: number; first?: string; teases?: [number, number] }

export const T = {
  // --- Night clock ---
  NIGHT_START: 20 * 60,
  BEDTIME: 25 * 60,
  EARLIEST_SLEEP: 23 * 60,          // can't log off before 23:00 (closes the 'sleep at 20:00 for 3 stars' exploit)
  DAWN: 30 * 60,
  RUN_WARN_DAWN_MIN: 15,            // a run still going this close to dawn gets a warning: dawn loses it (#52, 1.4)
  SEC_PER_GAME_HOUR: 96,          // dungeon: 1 in-game hour per 96 s real time (bedtime ~8 min, dawn ~16 min)
  MENU_CLOCK_SPEED: 0.25,         // the night clock while you choose the next floor on the map (item windows do not slow anything, #49)
  COST_IDENTIFY_MIN: 10,
  COST_FURNITURE_MIN: 15,
  COST_LIST_MIN: 5,
  COST_TRAVEL_MIN: 15,

  // --- The week (#56; docs/design/night.md, the week; claude/loot-night-week-one.md, approved for now 2026-11-24) ---
  // One entry a night, Monday first. adds: what comes in that night; everything from earlier nights stays on. The
  // numbers are that night's own: visits (how often she comes, x), bed (she goes to bed at this clock; 0 = she stays
  // up), end (the night ends at this clock: Monday, no Tiredness yet), dog ([first visit s, then every min, max s];
  // null = no dog), friends (the boys' calls tonight), teases (her tease visits tonight, min to max), first (in week one: her first visit is this type, early and safe:
  // a catch on it is let go, the night's new visit taught by happening; 2b in the week doc). After Sunday the week starts again with everything on (week
  // two is TBD: systems/week.ts). Ids not built yet sit in the list so they come in on their night once they are:
  // lean, mirror (#77, #59), mask, comeToBed, selfies, tease, lapSit, towelReq, bath, wine (#59). home: the Home app, the
  // devices and the battery (step 6, #57).
  NIGHT_SCHEDULE: [
    { day: 'Monday', adds: ['her', 'peek', 'snack', 'q4', 'shop'], visits: 1, bed: 0, end: 25 * 60, dog: null, friends: 0 },
    { day: 'Tuesday', adds: ['chat', 'headset', 'onDesk', 'tired', 'lean', 'mirror'], visits: 1.2, bed: 0, end: 0, dog: null, friends: 0, first: 'chat' },
    { day: 'Wednesday', adds: ['phone', 'messages'], visits: 1.2, bed: 0, end: 0, dog: null, friends: 0 },
    { day: 'Thursday', adds: ['dog', 'cuddle', 'friends', 'fuel', 'home'], visits: 1.2, bed: 0, end: 0, dog: [90, 120, 180], friends: 1, first: 'snack' },
    { day: 'Friday', adds: ['bed', 'witching', 'mask', 'comeToBed', 'selfies'], visits: 1.2, bed: 24 * 60, end: 0, dog: [90, 120, 180], friends: 1 },
    { day: 'Saturday', adds: ['tease', 'lapSit', 'towelReq', 'bath', 'wine'], visits: 1.4, bed: 25 * 60, end: 0, dog: [90, 120, 180], friends: 1, teases: [1, 2] },
    { day: 'Sunday', adds: [], visits: 1.6, bed: 25 * 60, end: 0, dog: [90, 120, 180], friends: 1, teases: [2, 3] },
  ] as NightPlan[],
  WEEK_TWO_BED: 24 * 60,          // after the first week she goes to bed every night: this on weeknights, the weekend's own on Sat and Sun
  BEDTIME_WARN_MIN: 15,           // a night that ends at a set time (Monday) warns this long before

  // --- Her moments (the fan-service pass, #59) ---
  // The tease visit (step 1, #85): she wants you, not proof. No footsteps: her call, then the doorway.
  TEASE_CALL_SEC: 2,              // her soft "babe?" before she is in the doorway
  TEASE_SEC: 8, TEASE_ESCALATE_SEC: 6,   // she poses this long; ignored, once more ("Baaabe.")
  TEASE_LOOK_SEC: 3,              // looking at her this long in total: she's happy (a blown kiss) and goes
  TEASE_GOODWILL_PER_SEC: 4, TEASE_IGNORE_MOOD: 10,
  TEASE_FIRST_SEC: [50, 90] as [number, number],   // the first one this far into the night (play seconds)...
  TEASE_GAP_SEC: [70, 110] as [number, number],    // ...then one this long after the last, when real life is free
  TEASE_HOT_EARLY_SEC: 40,        // a boss wind-up or a legendary on the floor brings her up to this much early (the worst moments)
  // "Come to bed" (step 2, #89), Friday on: once a night after 01:00, half asleep in your hoodie
  BED_TEASE_AT: [25 * 60 + 10, 25 * 60 + 45] as [number, number],   // when she gets up for it (clock minutes)
  BED_TEASE_GOODWILL_MULT: 2, BED_TEASE_MOOD_MULT: 1.5,

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
  MONSTER_PER_NIGHT: 3,           // topped up to this at night start once the Goblin Fuel is in (Thursday on); the Shop sells more
  MONSTER_DRAWER: 8,              // the drawer holds this many (the inspect window shows the slots; the Shop, #55, fills them)
  MONSTER_TIRED: -35,
  MONSTER_BOOST_SEC: 60, MONSTER_SPEED: 0.30,   // party acts 30% faster
  MONSTER_CRASH_SEC: 20, MONSTER_CRASH_SPEED: -0.15, MONSTER_CRASH_TIRED: 10,
  MONSTER_DRINK_FULL: 0.85, MONSTER_DRINK_HALF: 0.6, MONSTER_HALF_MULT: 0.5,   // share drunk: full boost / half of it / none (#61)
  MONSTER_FLUID_N: 80,            // drink particles in a can
  MONSTER_TILT_SPEED: 1.2, MONSTER_TILT_BACK: 1.0, MONSTER_TILT_MAX: 2.6,   // rad/s: hold Space to tilt, it eases back when you let go
  MONSTER_LIPS: 16,                      // px: the opening this close to his mouth = lips on the rim
  MONSTER_SWALLOW: 30, MONSTER_MOUTH_CAP: 14,   // particles per second he can swallow; what fits in his mouth before it spills
  MONSTER_FLOOR_CANS_MAX: 40,     // missed throws kept on the floor
  MONSTER_COUGH_NOISE: 6,
  MONSTER_QUIET_NOISE: 3,         // the click + psst of opening
  MONSTER_CLANK_NOISE: 4,         // a hard bounce of a thrown can
  MONSTER_SWISH_FLOW: 0.15,       // clean bin shot: a little Flow
  // Phone declines: costs less than ignoring, more than answering
  MOM_DECLINE_MOOD: 3, MOM_CALLBACK_SEC: [40, 60] as [number, number],
  // Door peek (hold the door)
  // Peeking: hold the door. It opens to a narrow crack in PEEK_OPEN_SEC, then creeps wider to PEEK_CRACK_MAX over
  // PEEK_CREEP_SEC (fractions of the door's width). Narrow shows the kitchen, medium the bathroom, wide the far end.
  PEEK_OPEN_SEC: 0.5, PEEK_CRACK_MIN: 0.15, PEEK_CRACK_MAX: 0.66, PEEK_CREEP_SEC: 7,
  PEEK_SEEN: { hallway: 1.4, living: 0.45, tv: 0.18 } as Record<string, number>,
  PEEK_CAUGHT_MOOD: 8,
  // Lean in (fan-service 7 and 12, V12 #77; grid doc 7l), from Tuesday: hold the door open past LEAN_DELAY and the
  // right screen is his view through the crack. Eyes busy the whole time; she can see you
  LEAN_DELAY: 0.6,
  LEAN_SLIT: [24, 160] as [number, number], LEAN_SLIT_START: 64, LEAN_NOTCH: 8,   // px; the wheel opens or closes it a notch
  LEAN_CREAK_SEC: 0.3, LEAN_CREAK_NOISE: 8,   // two notches this close together creak
  LEAN_LOOK_GAP: [5, 12] as [number, number],   // her next glance toward your door, while she's somewhere she can see it
  SPOT_TELL_SEC: 0.5,             // her tell: she pauses, her head turns (let go now)
  LEAN_LOOK_SEC: 1.6,             // then she looks this long
  LEAN_SPOT_RATE: 0.45,           // the red bar a second while she looks, at the narrowest slit...
  LEAN_SPOT_MIN: 1, LEAN_SPOT_MAX: 2.5,   // ...x this at 24 px to x this at 160
  LEAN_FOCUS_SPOT: 1.5, MIRROR_SPOT: 2,   // the closer framing; in the mirror (it works both ways)
  LEAN_SPOT_DECAY: 0.25,          // the bar drains this fast while she's busy
  LEAN_FIRST_SAFE_SEC: 6,         // the first lean ever: no tell this soon
  LEAN_SPOT_GOODWILL: 40, LEAN_SPOT_GW: 10, LEAN_SPOT_MOOD: 5,   // spotted: "Enjoying the view?" flustered (Goodwill 40+: +10) or teasing (Mood +5); never a catch
  MIRROR_DEFOG_SEC: 20,           // the hall mirror clears this long after her steam
  MASK_BEFORE_BED_MIN: 45,        // the sheet mask: once, in the last this-many minutes before she goes to bed
  LEAN_CHANCE: 0.25, LEAN_MOOD: -2,      // a visit where she only leans on the frame and looks
  // The dog: pops up for attention; ignored 1-3 times -> bumps the desk, cables out
  // when he comes is the week's (NIGHT_SCHEDULE dog: first at 90 s, then every 120 to 180 s; the build's 50 and 70 to 120 before #56)
  DOG_AGAIN_SEC: [25, 40] as [number, number], DOG_WAIT_SEC: 12, DOG_WHINE_NOISE: 0.6,
  DOG_PET_RATE: 0.0064, DOG_SWEET_MULT: 3, DOG_FAST: 1100,  // per grid px stroked across his head; faster than this (grid px/s) and he flinches (V6: was 0.0032 / 2200 in 2x desk px)
  // She leans into your face (only when she is happy): sweet-talk her away
  // The lap sit (fan-service 10, #86): from Saturday, with this much Goodwill a chat visit becomes her on your lap
  LAP_GOODWILL: 70,
  // What she wears (fan-service 3, #90): home from work, getting ready for bed; her feet change her footsteps
  WORK_CLOTHES_UNTIL: 21 * 60,    // weekdays: her work blouse till then
  BED_CLOTHES_FROM: 23 * 60 + 30, // on her phone in the bedroom after this: her pajama shorts
  SLIPPERS_EARLY_SEC: 2, SLIPPERS_STEP_VOL: 1.4,   // slippers: her steps start this much earlier, louder
  SOCKS_STEP_VOL: 0.6,            // socks: quieter, and heard only from the hallway (the far stage's 2 s are silent)
  // Her gifts (fan-service 4, #91; trade-offs Paweł 2026-11-26)
  GIFT_GOODWILL: 20,              // the first time she wears one
  // Selfies (fan-service 5, #92): her texts after midnight (the waking meter's) carry a photo this often
  SELFIE_CHANCE: 1 / 3,
  SELFIE_SEC: 60,                 // not opened in this long: "Babe unsent a photo."
  SELFIE_GOODWILL: 5,             // opening one, the first time
  GIFT_FURY_CATCH_MOOD: 0.5,      // the Goblin Fury tee: a catch costs half the Mood...
  GIFT_FURY_PEEK: 2,              // ...but peeks weigh this much more in her visits
  GIFT_PJ_BED_MIN: 30,            // the pajama set: on nights she goes to bed, this much earlier...
  GIFT_PJ_WAKE: 1.25,             // ...and the waking meter fills this much faster
  GIFT_CAT_TEASES: 1,             // the cat-ear hoodie: one more tease a night (any night)...
  GIFT_CAT_GOODWILL: 1.5,         // ...and looking at her pays this much more
  LAP_SIT_SEC: 20,                // she stays this long at most (or till the chat's three are asked)
  LAP_SIT_ASK_SEC: 10,            // each question waits this long; ignored, she takes your mouse...
  LAP_MOUSE_SEC: 3,               // ...for this long (skills blocked: SHE HAS THE MOUSE), unless you answer her
  LAP_SAY_SEC: 2,                 // "ooh, shiny" by her head on a rare or better drop
  LAP_CHANCE: 0.4, LAP_MIN_GAP_SEC: 180, LAP_ASK_SEC: 7, LAP_QUESTIONS: 3, LAP_HAPPY_MOOD: -15, LAP_RUDE_MOOD: 6, LAP_SULK_MOOD: 10, LAP_CALM_SEC: 60,

  // --- Flow ---
  FLOW_MIN: 1, FLOW_MAX: 3, FLOW_BUILD_SEC: 60, FLOW_DECAY_MULT: 2,
  FLOW_GLOW_STEP: 0.5, FLOW_GLOW_SEC: 1,   // the corner's Flow text glows each time the multiplier passes a step of 0.5 (#49)

  // --- Dungeon ---
  BATTLES_PER_FLOOR: 3,
  CHECKPOINT_EVERY: 5,
  WALK_SEC: 4,                    // the walk out after a floor's last fight lasts at least this; before a fight the pack sets it (PACK_*, #118)
  SWING_SEC: 0.42,                // a melee hit's weapon swing (the Knight, the Rogue; #97): wind-up, the cut, back to the guard
  // the boys' chat between the calls (#109; systems/boys.ts): text pacing only, no effect on play
  BOYS_GAP_SEC: 40,               // at least this long (night seconds) between two posts
  BOYS_SAME_GAP_SEC: 240,         // ...and between two posts for the same moment
  BOYS_RANDOM_SEC: [150, 240] as [number, number],   // a line with no moment of its own, now and then in the dungeon
  BOYS_THREAD_MAX: 30,            // The Boys' chat keeps this many lines
  CHAT_FIRST_SEC: 0.4, CHAT_TYPE_SEC: 0.25, CHAT_TYPE_PER_CHAR: 0.012, CHAT_TYPE_MAX: 0.8, CHAT_GAP_SEC: 0.2,   // the other 20:00 chats (#102): typing dots, then the bubble
  // The launch on the first Monday (#127, the v2 redesign; aoj-world §7): Age of Judgment launches on the PC for 40 s while
  // the boys' first chat comes in, its bubbles arriving at these launch seconds, each after the typing dots. Nothing
  // starts the night before the launch ends; then the town fades in from black, dithered. Since #151 the developer's
  // logo holds 2 s longer (10.6 to 17; #153), so everything from the title on is 2 s later than it was (38 then).
  LAUNCH_SEC: 40, LAUNCH_FADE_SEC: 0.9, LAUNCH_SOUND_END: 42,
  CHAT_LAUNCH_AT: [2.6, 5.0, 8.4, 10.2, 12.8, 23.4, 29.6, 37.0], CHAT_LAUNCH_TYPING: 1.6,   // four to read while it boots (#133); none from 15 to 23 (the developer's scroller, the title's sounds); the last 3 s before the town (#135)
  // Every night after the first Monday starts from the login (#127, Paweł 2026-11-27): T starts at 25, a dithered fade in
  // from black over it, the sound from T 25 (the theme at its offset and the rain faded in)
  LAUNCH_LOGIN_AT: 25, LAUNCH_LOGIN_FADE_SEC: 0.6, LAUNCH_LOGIN_SOUND_FADE_SEC: 1.5,
  // every night after the first (#149): the login and the typing at their pace, then from the Log in press the
  // connecting, verified and the loading bar run fast, LAUNCH_FAST_FROM to LAUNCH_SEC in LAUNCH_FAST_SEC real seconds
  // (the town in about 7.4 s after the chat comes up, not 15). The chat lands from CHAT_LOGIN_FROM to CHAT_LOGIN_TO,
  // its last 3 real s before the town comes in.
  LAUNCH_FAST_FROM: 30.4, LAUNCH_FAST_SEC: 2.0, CHAT_LOGIN_FROM: 26.6, CHAT_LOGIN_TO: 29.4,
  // the fallen (#154): an enemy at 0 HP crumbles to the ground over DEATH_SEC (its iron pieces drop and pile up, then
  // its own pile of iron bones dithers in), lies there CORPSE_SEC, then dithers out over CORPSE_FADE_SEC
  DEATH_SEC: 0.9, CORPSE_SEC: 9, CORPSE_FADE_SEC: 1.2,
  WALK_PACE: 40, WALK_HURRY_PACE: 75,   // the walk's pace (render/rpgView.ts cam units/s; the grid moves at 0.7 of it): hurry while loot lies ahead or a curio is behind
  // Packs (#52, 1.3): an encounter is a pack; six on screen, the rest wait off screen and step in as the front ones die
  PACK_MIN: 5, PACK_MAX: 12,      // pack size = min(PACK_MAX, PACK_MIN + floor(floor / 2))
  PACK_HP_MULT: 1.25,              // a pack member's HP and attack against a lone enemy's (*start*, tuned to 8 to 12 s fights)
  PACK_ATK_MULT: 0.7,
  STEP_IN_SEC: 0.6,               // a waiting enemy takes this long to step into a free position (it doesn't attack meanwhile); it comes in from off the right edge
  // the pack stands in the corridor and the party walks up to it (#118; systems/dungeon.ts): it is placed off the right
  // edge once the walk has gone PACK_PLANT_SEC (and any loot is behind it), comes in at PACK_PACE, and the fight starts
  // when it is in position. Its front enemy in view (x at most PACK_SPOT_X): a red "!" pops over every head for
  // PACK_ALERT_SEC and is gone (#120).
  PACK_PLANT_SEC: 1, PACK_PACE: 75,
  PACK_ENTER_X: 350, PACK_SPOT_X: 326,   // grid px (core/arena.ts): the front enemy starts here, just off the 334 px area; spotted here
  PACK_ALERT_SEC: 0.5,            // the "!" when the pack sees the party: it hops up, then is gone (#120; was until the fight)
  // Drops per kill (#52, 1.3): they fall where the enemy died; the front hero walks over them on the next walk (#95)
  DROP_CHANCE: 0.35,              // each kill drops an item; elites always; bosses BOSS_DROPS
  LEGENDARY_FIRST_BY: 40,         // the first legendary of a save drops within its first 40 drops (night 1 has 45 to 75)
  // Runs (#52, 1.4): from the town portal until the town portal (banked) or a wipe (lost)
  SOULS_PER_FLOOR_BASE: 3,        // each floor cleared gives 3 + floor Souls
  SOULS_PER_BOSS: 20,
  RUN_CARD_SEC: 2.5,              // the run end card over the battle area
  // The route choice (#52, 1.5): path cards on the floor map
  PATHS_EARLY: 2, PATHS_LATE: 3, PATHS_LATE_FROM: 6,   // cards for the next floor: 2 up to floor 5, 3 after (a map item adds one)
  PATHS_MAX: 3,                   // what fits on the map; a map item's card takes a generated one's place
  NODE_FEATURE_CHANCE: 0.5, NODE_CONDITION_CHANCE: 0.35,
  MAP_AWAY_SEC: 5,                // the map off screen this long in all while the choice is open: the safest path is taken
  COND_SILENT_DROPS: 0.2,         // Silent Halls: drops -20%; crits and skills make no Noise
  COND_HAUNTED_NOISE: 1, COND_HAUNTED_ULT: 0.5,   // Haunted: every kill Noise +1; ultimates charge 50% faster
  COND_FLOODED_CD: 0.2, COND_FLOODED_DROPS: 0.3,  // Flooded: cooldowns +20%; drops +30%
  COND_DARK_ATK: 0.15, COND_DARK_GOLD: 0.5,       // Pitch Dark: enemies hit 15% harder; gold +50%
  COND_SWARM_PACK: 0.5, COND_SWARM_SOULS: 0.5,    // Swarming: packs 50% bigger; Souls +50%
  // Real-time combat (#52, 1.2): every unit attacks on its own timer, attack interval = BASE_ATTACK_SEC x 10 / speed
  BASE_ATTACK_SEC: 1.2,           // speed 10: an attack every 1.2 s
  FLOW_SPEED: 0.25,               // at max Flow the party attacks this much faster, linear from Flow x1
  // Big numbers (#52, 1.2): compounding per floor and per item level; numbers show as 1.2K, 34.5K, 1.2M
  ENEMY_HP_GROWTH: 1.15,          // enemy HP x this per floor
  ENEMY_ATK_GROWTH: 1.15,         // enemy attack x this per floor
  ITEM_POWER_GROWTH: 1.12,        // item stats x this per item level
  FURY_AFTER_SEC: 10,             // Fury: an enemy alive longer than this hits harder every second (was "Interest")
  FURY_PER_SEC: 0.03,
  BASH_STUN_SEC: 1.5,             // Bash stuns for this long (was "a turn")
  // Ultimates (#52, 1.2): the third slot, a charge that fills only during fights; always manual, never autocast
  ULT_CHARGE_SEC: 20,
  LAST_STAND_SEC: 6,              // Knight: for this long no hero can drop below 1 HP
  CATACLYSM_POWER: 8,             // Mage: hits every enemy for this x attack...
  CATACLYSM_MARK_MULT: 2,         // ...and Staggered or Chilled ones take this much more
  HEALER_AUTO_HEAL_BELOW: 0.6,    // Smite heals an ally under this share of max HP instead of smiting
  HERO_LEVEL_SCALE: 0.04,         // levels unlock skills; strength comes from gear (#49)
  XP_PER_KILL: 5, XP_PER_BOSS: 40, XP_PER_LEVEL: 40, XP_LEVEL_EXP: 1.7,
  // Skill trees (#53; grid doc §6c): skills come only from the tree. Costs set 2026-11-20 against the Souls income
  TREE_COST: { stat: 20, unlock: 40, rule: 40, auto: 60, ult: 120 } as Record<string, number>,
  TREE_COST_STEP: 0.15,           // each node x (1 + this x nodes already bought in that tree)
  TREE_ULT_NEEDS: 6,              // the ultimate needs this many nodes bought in his tree
  RULE_HOLD_ARMOR: 0.3, RULE_THORNS: 0.3, RULE_CONCUSSION: 2,
  RULE_SHIV: 0.3, RULE_CHOKE_DPS: 0.25,
  RULE_WILDFIRE: 0.3, RULE_WILDFIRE_SEC: 3, RULE_INFERNO_DMG: 0.4, RULE_INFERNO_CD: 3, RULE_LINGER: 2, RULE_SHATTER: 4,
  RULE_SANCTUARY_ARMOR: 0.2, RULE_SANCTUARY_SEC: 5, RULE_GREATER_MEND: 0.3, RULE_AEGIS_SEC: 3, RULE_RETRIBUTION: 0.25,
  // Ability marks (docs/design/dungeon.md): a skill marks an enemy, another skill cashes the mark in.
  MARK_SEC: 6,                    // how long a mark stays on an enemy (Taunted lasts as long as the taunt)
  MARK_STAGGER_FIRE: 2,           // Fire on a Staggered enemy (Bash marks it)
  MARK_STAGGER_BACKSTAB: 2,       // Backstab on a Staggered enemy
  // the rogue (Hixx), the fourth hero (#52, 1.7): in the party from night 1 (#96)
  SMOKE_SEC: 4, SMOKE_MISS: 0.5,  // Smoke Bomb: enemies miss this share of their attacks
  HEIST_SEC: 8,                   // Heist (ultimate): every kill drops an item for this long
  // Marching order (#52, 1.6; docs/design/dungeon.md): position 1 is the front
  OUT_OF_POSITION_MULT: 0.7,          // damage and healing of a hero outside his home positions
  SWAP_SEC: 1,                    // a swap: both heroes stop acting while they pass each other (Hook and Shove too)
  AURA_KNIGHT_TAKEN: 0.25,        // Knight: the hero directly behind takes this much less damage
  AURA_ROGUE_CRIT: 10,            // the rogue: the hero directly in front gets this much crit
  AURA_MAGE_CD: 0.1,              // the mage: the hero directly in front gets this much shorter cooldowns
  AURA_PRIEST_REGEN: 0.01,        // the priest: the heroes in front and behind regenerate this share of max HP a second (in the dungeon)
  LINE_BREAK_FROM: 6,             // from this floor an encounter may bring a Ghoul (Hook) or a Brute (Shove)
  LINE_BREAK_CHANCE: 0.35,        // per encounter, not on boss fights
  LINE_BREAK_FIRST: 2, LINE_BREAK_EVERY: 4,   // its first move on its 2nd action, then every 4th
  LINE_BREAK_WINDUP_SEC: 1,
  MARK_CHILL_BASH: 2.5,           // Bash on a Chilled enemy shatters it (Frost marks it)
  MARK_JUDGED_HEAL: 0.3,          // every skill hit (not auto attacks) on a Judged enemy heals the most hurt hero for this share (Smite marks it)
  MARK_TAUNT_REFLECT: 0.5,        // with Ward up, a Taunted enemy takes back this share of the damage it deals
  DOWNED_REVIVE_PCT: 0.3,
  FEATHER_REVIVE_PCT: 0.5,
  ELITE_MULT: 1.5,
  // Boss big attack (the Ogre's SMASH): telegraphed, answerable with Bash (interrupt), Ward (halve) or Taunt (knight only)
  BOSS_SLAM_EVERY: 2,             // every Nth boss action is a wind-up instead of a hit
  BOSS_WINDUP_SEC: 3,             // red bar over the boss; you can hear it from Excel
  BOSS_SLAM_PCT: 0.6,            // unanswered: every hero loses this share of max HP
  BOSS_SLAM_TAUNT_PCT: 0.55,      // taunted: only the knight is hit, for this share of his max HP
  BOSS_SLAM_WARD_MULT: 0.5,
  // The Warlock (floor 10): every LOAN_EVERY-th action SUMMONs a friend (Shaman or Imps); a friend still
  // standing is EMPOWERed instead: full HP and x LOAN_REFI attack. Kill friends before the next summon.
  LOAN_EVERY: 3, LOAN_WINDUP_SEC: 2, LOAN_REFI: 1.3,
  // The Black Knight (floor 15): a shield Bash breaks; every EVICT_EVERY-th action, EXECUTE on the most hurt hero.
  EVICT_EVERY: 3, EVICT_WINDUP_SEC: 3, EVICT_PCT: 0.9,   // taunted: the knight takes BOSS_SLAM_TAUNT_PCT; Ward halves
  // Enemy roles (docs/design/dungeon.md).
  SHIELD_TAKEN: 0.25,             // a shielded enemy takes this share of damage until a Bash breaks the shield
  AUDITOR_HEAL: 0.6,              // the Shaman heals a friend for this share of his own max HP
  AUDITOR_HEAL_BELOW: 0.75,       // ...when that friend is under this share of their max HP; else he attacks
  // Away from the game (Excel, switching, minigames, cables out): no manual skills, auto attacks only (#52, 1.2)
  AUTOPILOT_CHAT_GAP_SEC: 12,     // party chat lines about you being away, at most this often
  AUTOPILOT_FLASH_HP: 0.5,        // the Loot Night taskbar button flashes when party HP is under this (or someone is down)

  // --- Loot ---
  BAG_SIZE: 18,
  TREASURY_ROW: 6,                // the bag's last row: the Treasury opens 2 slots per level; the rest show a lock (#49)
  BAG_NEW_SEC: 1.5,               // a fresh item's bag slot gets a yellow outline this long
  WRONG_CLASS_SHAKE_SEC: 0.2,     // class gear on the wrong hero (#113, gentler in #114): the item shakes in its square (or in hand) this long
  WRONG_CLASS_SHAKE_PX: 1,        // this far either way, in grid px (x2 on the stage)
  WRONG_CLASS_SHAKE_HOPS: 4,      // in this many hops (right, left, right, left), then still
  RIGHT_CLASS_GLOW_SEC: 1.2,      // refused (right-click, or let go on his slot): the portrait of the class it is for glows this long (#121); in hand, as long as you hold it
  PICKUP_HOLD_SEC: 0.12,          // held this long on a bag item (or dragged), it is picked up: its gear slot lights (#114)
  GHOST_RETURN_SEC: 0.16,         // an item let go where it can't go flies back to its square in this long
  TRASH_GHOST_SCALE: 0.6,         // the item in hand shrinks to this over the trash can, so the bin and its glow show round it (#148)
  TRASH_CLAP_SEC: 0.35,           // the bag's trash can (#148): its lid claps shut over this long after an item goes in
  LOOT_FLY_SEC: 1.6, LOOT_FLY_LEGENDARY_SEC: 2.6, LOOT_FLY_STAGGER_SEC: 0.3,   // picked-up loot: its name flies up from the floor (#49)
  POWER_PER_ILVL: 10,             // item power = 10 x item level x rarity multiplier; hero Power = average of 6 slots
  POWER_BEHIND: 0.85,             // a hero under this share of the party's best Power gets a 'needs gear' tag
  DROP_WAIT_SEC: 8,
  BOSS_DROPS: 3, VAULT_DROPS: 5,
  RARITY_WEIGHTS: [68, 28, 3.3, 0.55, 0.15],   // 1.9: a rare or better about every 30 s of combat (was 60/25/10/4/1: every 12 to 16 s)
  RARITY_SHIFT_PER_FLOOR: [-0.6, 0.4, 0.13, 0.05, 0.02],
  PITY_EPIC: 40,
  GOBLIN_CHANCE: 0.03, GOBLIN_SEC: 6, GOBLIN_DROPS: 3,
  // Special affixes (docs/design/loot.md): chance per rarity to roll one; life ones only from epic up.
  AFFIX_CROSS_CHANCE: { rare: 0.3, epic: 0.45, legendary: 0.35 } as Record<string, number>,
  AFFIX_LIFE_CHANCE: { epic: 0.35, legendary: 0.65 } as Record<string, number>,
  AFFIX_QUICK: 0.3, AFFIX_TIRED: 0.2, AFFIX_OWL: 0.3, AFFIX_EXCUSE_MOOD: 10,
  // Loot rules (#52, 1.8): affix lines beyond the main stat (a downside and a special affix each count as one)
  AFFIX_LINES: { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 3 } as Record<string, number>,
  SET_CHANCE: 0.3,                // an epic is a set piece (for a hero in the party)
  LEGEND_TITHE_GOLD: 2,           // The Tithe: gold x floor per hit a Taunted enemy lands on the Knight
  LEGEND_VIGIL_WARD_SEC: 4,       // Vigil Censer: Miracle raises Ward this long
  SET_IRONWAKE_ARMOR: 0.15, SET_IRONWAKE_HEAL: 0.1,
  SET_EMBERVOW_SKILL: 0.1, SET_EMBERVOW_KILLS: 3,
  SET_DAWNWARD_HEAL: 0.15, SET_DAWNWARD_REGEN: 0.03,
  SET_NIGHTGLASS_CRIT: 10,
  AFFIX_CROSS_PCT: 0.6,           // a cross-system stat bonus = this share of a main stat line at the item's level and rarity
  AFFIX_SPREADSHEET_GOLD: 3,      // per kill while Excel is up, per item
  AFFIX_QUIET_NOISE: 30, AFFIX_DOG_SEC: 60,
  // Curios in the corridor (docs/design/dungeon.md, #30). Content: data/curios.ts.
  CURIO_PER_FLOOR: [1, 2] as [number, number],   // on battle floors; none on vault or shrine floors
  CURIO_WAIT_SEC: 7,              // real seconds the party waits at a curio before walking past
  CURIO_ENTER_X: 355, CURIO_STOP_X: 210, CURIO_GONE_X: -24,   // grid px (core/arena.ts): it comes in off the right edge, the party stops with it here, walks on until it is off the left edge (#99)
  CURIO_PACE: 55,                 // the walk's pace while a curio comes up
  CURIO_AWAY_RECKLESS: 0.5,       // away when the party reaches one: this often they do the loud thing, else walk past
  CURIO_PICK_SEC: 8, CURIO_SMASH_NOISE: 25, CURIO_BOX_DROPS: 2,
  CURIO_GROAN_NOISE: 5, CURIO_MAIL_GOLD: 20, CURIO_MAIL_ODDS: [0.5, 0.3] as [number, number],   // coffin: gold, rare; the rest a curse
  CURIO_FEE_DMG: 0.15,            // coffin curse: party damage down until the next floor
  CURIO_SNEAK_SEC: 6, CURIO_ROAR_NOISE: 15, CURIO_TROLL_DROPS: 2,
  CURIO_BANK_NOTICE_SEC: [40, 90] as [number, number], CURIO_SULK_DMG: 0.2, CURIO_SULK_SEC: 45,   // the mage sulks: his damage down
  CURIO_KICK_NOISE: 15,           // shaking the potion cart
  // Run blessings (#52, 1.5b): each lasts the run and stacks (multiplies) with itself
  BLESS_SHRINE_DMG: 0.2, BLESS_SHRINE_NOISE: 15,
  BLESS_PILGRIM_CD: 0.15,
  BLESS_SUPPLY_DROPS: 0.25, BLESS_SUPPLY_HP: 0.1,
  BLESS_POTION_HEAL: 0.3, BLESS_POTION_GLASS: 0.1,   // the other half: broken glass, the party loses 10% HP now
  BLESS_ALTAR_CRIT: 30, BLESS_ALTAR_DRAIN: 0.01,      // crit points; HP share a second outside fights
  BLESS_MOON_ULT: 0.4,
  BLESS_RITUAL_SOULS: 0.5, BLESS_RITUAL_HP: 0.2,
  // Pre-emptive actions (docs/design/preemptive.md, #19). Content: data/preemptive.ts.
  PRE_SECOND_MULT: 0.5,           // the 2nd use of the same action in a night has this much effect
  PRE_SUSPICIOUS_AT: 3,           // ...from this use on she gets suspicious: no effect, the next visit is a Peek
  PRE_SUSPICIOUS_MOOD: 5,
  PRE_TEXT_SEC: 3, PRE_TEXT_CALM: 40, PRE_TEXT_MOOD: -5, PRE_TEXT_SOON: 10, PRE_TEXT_WAKE: 25,
  PRE_REPLY_SEC: [2, 4] as [number, number], PRE_REPLY_SHOW: 7,   // her reply lights the phone (the tell)
  PRE_CALM_BREAK_NOISE: 70,       // heard Noise above this ends a calm: she comes to check
  // --- The smart home and the battery (step 6, #57; grid doc 7j; docs/design/desk.md, the Home app). Thursday on ---
  BATTERY_ANSWER: 2,              // % for each call or text you answer (doubled 2026-11-20, like the devices)
  CHARGE_SEC: 15, CHARGE_ADD: 40, // Charge: this long away from the PC (the empty chair), then +this %
  NEW_PHONE_DRAIN: 0.6,           // the New phone (Shop): everything drains at this rate
  BATTERY_LOW: [20, 10] as number[], LOW_SHOW_SEC: 3,   // the desk phone wakes with a crimson block at these %
  HOME_BATT: { vacuum: 20, speaker: 10, tv: 8, seal: 4, tea: 6 } as Record<string, number>,   // % a use (a seal toggle, a tea order)
  VACUUM_RUN_SEC: 20,             // it runs this long in the picked room (she stops it sooner if she goes)
  VACUUM_CALM: 45, VACUUM_REST: 180,   // she is in that room or next door: she goes to stop it, her next visit 45 s later
  SPEAKER_CALM: 30, SPEAKER_REST: 60,  // a timer rings: she goes to check it, next visit 30 s later (the rest is ours: start)
  SPEAKER_MOOD_FROM: 3, SPEAKER_MOOD: 5,   // from the 3rd timer in a night, Mood +5 each time
  TV_MAX: 2, TV_NOTICE_MOOD: 10, TV_REST: 90,   // Next episode twice a night; the 3rd she notices (Mood, your door)
  TEA_DELAY_SEC: 120, TEA_CALM: 120, TEA_MAX: 2, TEA_WAKE: 30,   // bubble tea: the doorbell later; asleep, it wakes her a bit
  CHECK_SEC: 6,                   // she spends this long at a device she went to (then back to her own things)
  SEAL_NOISE: 0.4, SEAL_SLOW: 0.3, SEAL_STEPS: 0.5, SEAL_SEEN_MOOD: 5,   // the door seal: the towel's effect and downside
  // Cross-layer echoes and payouts (docs/design/synergy.md, #29).
  ECHO_YELL_NOISE: 15, ECHO_YELL_HEADSET: 5,   // a legendary drop: he yells (into the mic with the headset on)
  ECHO_SLAM_NOISE: 10,                          // a wipe: he slams the desk, the dog comes over
  ECHO_ENRAGE_HP: 0.25, ECHO_ENRAGE_FLOW: 1.5,  // a boss below this HP enrages: Flow builds faster; alt-tab resets Flow
  ECHO_LOVED_DMG: 0.15, ECHO_LOVED_CRIT: 10,    // after a good cuddle, for the next fight
  ECHO_DROWSY_MISS: 0.1,                        // hero hits miss this often at Tired TIRED_SLUGGISH+
  GOOD_BOY_SEC: 60, GOOD_BOY_GOBLIN: 2, GOOD_BOY_SWEET_SHARE: 0.5,   // petted mostly on his favourite spot
  CABLE_FAST_SEC: 6,                            // cables back in this fast: Flow comes back too
  CABLE_SHOW_SEC: 1.3,                          // the dog's slam plays before the cables show; the fast fix counts from then (V6)
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
  // Stars that reward greed (#54, 3.1): Deep (tonight's floor), Unseen (never caught), Sweet (Mood under red).
  STAR_DEEP_MIN: 3, STAR_DEEP_OFFSET: 0,   // tonight's floor = max(min, record + offset), fixed at the start of the night
  STAR_UNSEEN_GOODWILL: 20,               // Unseen's reward, Trust: the next night starts with this much more Goodwill
  STAR_SWEET_DEBT: 1,                     // Sweet's reward, Breakfast: sleep debt down this much
  MOOD_START: 15,
  MOOD_DRIFT_EVERY_SEC: 30,
  MOOD_GREEN: 40, MOOD_RED: 75, MOOD_MAX: 100,
  NOISE_DECAY_PER_SEC: 2,
  NOISE_HURRY: 70,                // heard Noise above this: she finishes what she is doing twice as fast
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
    bath:   { cuddle: 2, peek: 1 },
    yoga:   { chat: 1, cuddle: 1 },
    mask:   { peek: 1, cuddle: 1 },
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
  // First-night onboarding (#28): tips pinned at the top of the feed, two timed ones on a fresh save
  TIP_HER_AT: 4,   // her opening line on a fresh save, said through the door (#139); the pinned tips went with #141
  COACH_SLOW: 0.25, COACH_MAX_SEC: 14,   // coach marks (#42): the game runs at a quarter speed until you act; real-second cap
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
  // The bath (#88): on the weekend her shower is a bath, from SHOWER_FROM, likelier (most weekend nights have one)
  BATH_CHANCE: 0.5,               // at each of her activity ends after 21:30, until she has had it
  BATH_DOOR_AJAR: 0.5,            // of her baths she leaves the door ajar for her music (you hear it better, lean in sees in, #77)
  // "Babe, towel!" (#93) and "Babe, bring my wine?" (#88): her requests from the bathroom, worth taking either way
  TOWEL_CHANCE: 0.5,              // of her showers and baths (from the night towelReq comes in): at the end, she forgot her towel
  WINE_CHANCE: 0.5,               // of her baths: the wine, partway in...
  WINE_AT_SEC: [25, 60] as [number, number],   // ...this long after she gets in
  ASK_SEC: 15,                    // her window waits this long
  TOWEL_AWAY_SEC: 10, WINE_AWAY_SEC: 12,   // away from the PC to bring it (the empty chair)
  ASK_GOODWILL: 15,               // brought it
  ASK_THANKS_SEC: 4,              // her thank-you in her window
  ASK_IGNORE_MOOD: 10,            // ignored: she gets it herself, in a towel, dripping, by way of your door (a normal visit)
  // Noise by distance and masking: how much of your Noise reaches her. Never shown to the player.
  HEAR_DISTANCE: { next: 2, middle: 1, far: 0.5 } as Record<string, number>,
  HEAR_MASK: { tv: 0.5, shower: 0, bath: 0.35, yoga: 0.7 } as Record<string, number>,   // her activity covers your noise (her bath music some of it)
  BATH_AJAR_HEAR: 2,              // the bath's door ajar: she hears you this much better (and you her music)
  SCARE_SEC: 0.8,
  CAUGHT_HOLD_SEC: 3.2,           // after the scare her screen stays this long so the cost can be read; a click or a key ends it (V7)

  // --- She goes to bed (when: NIGHT_SCHEDULE bed, Friday on) ---
  WAKE_NOISE_FLOOR: 30,           // Noise above this wakes her
  WAKE_RATE: 0.15,                 // wake per second per point of Noise above the floor
  WAKE_DECAY: 0.5,
  WAKE_TEXT: 60,                  // "are you coming to bed?" text
  WAKE_UP: 100,                   // she gets up and comes to your door
  WAKE_AFTER_VISIT: 30,
  TEXT_REPLY_WAKE: -35, TEXT_REPLY_MOOD: -3, TEXT_IGNORE_WAKE: 25, TEXT_IGNORE_MOOD: 5,

  // --- The phone (#54, 3.2): fewer events, each worth taking ---
  // A night script instead of a random timer: each kind's window in clock minutes (a time is picked in it at 20:00).
  // The boys call during the floor before a boss floor (how often: NIGHT_SCHEDULE friends). The first event waits PHONE_FIRST_SEC.
  PHONE_SCRIPT: { courier: [20 * 60 + 30, 21 * 60 + 30], mom: [20 * 60 + 45, 21 * 60 + 15], boss: [21 * 60 + 45, 22 * 60 + 15] } as Record<string, [number, number]>,
  PHONE_FIRST_SEC: 45,
  // One demand at a time from real life (phone, dog): this far apart, and never while she is coming, at the door, in
  // the room or in the shower, during a boss wind-up or a calm you earned. Scripted events slide later, never drop.
  REAL_LIFE_GAP_SEC: 15,
  TEXT_DEADLINE_SEC: 60,          // texts arrive silently on the lock screen and wait this long (only calls buzz)
  SPEAKER_NOISE: 4,               // per second on speaker, headset off: your hands stay free, she may hear
  // Courier (#23): pick the right reply twice; your new gaming mouse: skill cooldowns down until dawn.
  COURIER_TIMER: 8, COURIER_TALK_SEC: 8, COURIER_MOUSE_CD: 0.1,
  // The boys' group call (#23): decline them politely twice for a raid buff until that boss fight ends. Ignored or
  // rude twice: Discord rings at full volume. Declined: chat spam.
  FRIENDS_TIMER: 8, FRIENDS_TALK_SEC: 8, FRIENDS_RUDE_NOISE: 8, FRIENDS_MAX_MISSES: 2,
  FRIENDS_FAIL_NOISE: 30, FRIENDS_DECLINE_NOISE: 15, FRIENDS_BUFF_DMG: 0.2, FRIENDS_BUFF_SPD: 0.1,
  MOM_TIMER: 8, MOM_FAIL_MOOD: 10, MOM_BEATS: 2, MOM_MAX_MISSES: 3, MOM_SWEEP_SEC: 2.4, MOM_ZONE: 0.3, MOM_READ_SEC: 1.6,   // she talks first (marker waits), then you reply
  BOSS_WINDOW_SEC: 10, BOSS_ROWS: 1,
  BOSS_ZL: 50,                    // answering the boss: overtime pay in dollars (not gold: money rule). Ignoring him costs nothing
  TEXT_CHAT_SEC: 8,
  FACE_UNLOCK_SEC: 1.2,           // hold the phone to your face
  SLIDE_DIST: 150, DOOR_DIST: 70, TAKE_DIST: 170, PULL_DIST: 60, TOSS_DIST: 130,

  // --- Q4, the Excel clicker (handoff step 4, #55; numbers from grid doc 7i, 2026-11-20: all to be tuned in playtests) ---
  // The toys pay on every action, times the title, Sort and Hustle; the macros pay on their own all night (not Hustle).
  Q4_SUM: 0.4,                    // zl an AutoSum (Space or the big sigma)
  Q4_BALANCED_CHANCE: 0.10, Q4_BALANCED_MULT: 5,   // an AutoSum lands BALANCED this often and pays this many times
  Q4_ROLL_SEC: 0.4,               // the column rolls this long after an AutoSum
  Q4_FILL_CELL: 0.15,             // zl a filled cell
  Q4_FILL_MAX: 10,                // cells one flick can fill (a faster flick fills more)
  Q4_FILL_TICK_SEC: 0.04,         // the cascade: a cell every 40 ms
  Q4_SORT_MULT: 2, Q4_SORT_SEC: 5, Q4_SORT_CD: 10, Q4_SORT_CD_LEAD: 3,   // Sort: everything x2 for 5 s; 10 s cooldown, 3 s less from Team Lead
  Q4_SORT_FLAP_SEC: 0.6,          // the split-flap reshuffle
  Q4_PIVOT_TURN: 1.2,             // zl a full turn of the pivot table
  Q4_PIVOT_FRICTION: 0.5,         // its spin slows by this share a second
  Q4_PIVOT_MAX: 20,               // rad/s: the fastest fling
  Q4_HUSTLE_MAX: 3,               // toys pay up to x3 right after you switch to Excel...
  HUSTLE_DECAY_SEC: 15,           // ...down to x1 over this...
  HUSTLE_RECHARGE_SEC: 30,        // ...and it charges back up while the RPG is on screen
  Q4_TITLE_AT: [0, 50, 300, 1500, 6000, 25000, 100000],   // lifetime zl for each title (data/q4.ts names them)
  Q4_TITLE_MULT: 1.25,            // each title: all of Q4 x1.25 (stacking)
  Q4_MACRO_GROWTH: 1.5,           // a macro level costs base x 1.5^level
  // the macros: base cost, the title that unlocks them (index), what a level does
  Q4_MACRO_BASE: { intern: 20, autofill: 60, vlookup: 150, cond: 300, pivotm: 800, pq: 4000 } as Record<string, number>,
  Q4_MACRO_AT: { intern: 0, autofill: 1, vlookup: 2, cond: 3, pivotm: 3, pq: 5 } as Record<string, number>,
  Q4_INTERN_SUMS: 0.5,            // AutoSums a second, a level
  Q4_AUTOFILL_CELLS: 1,           // cells a second, a level
  Q4_VLOOKUP: 0.25,               // +25% a filled cell, a level
  Q4_COND: 0.02, Q4_COND_MAX: 0.40,   // +2% BALANCED chance a level, 40% at most
  Q4_PIVOTM_TURNS: 0.3,           // turns a second, a level
  Q4_PQ: 1,                       // Power Query: +100% of what the macros earn, a level (added, not multiplied)
  Q4_PIVOT_AT: 2,                 // the pivot spinner unlocks at Analyst
  Q4_NOISE: 0.5, Q4_NOISE_FLICK: 1, Q4_NOISE_SORT: 1.5, Q4_NOISE_SPIN: 1,   // Noise a toy action makes (the Silent keys halve it)
  Q4_BUSY_SEC: 2, Q4_IDLE_SEC: 3, Q4_BUSY_MULT: 1.5,   // looking busy while she is in: acted in the last 2 s, her visit runs x1.5; idle 3 s, it waits

  // --- The Shop app (step 4.6, #55; prices from grid doc 7i, to be tuned in playtests) ---
  SHOP_ZL: { fuel: 29, chew: 29, keys: 249, fridge: 599, chair: 899, phone: 2999, flowers: 49, fluffy: 79, knee: 99, fury: 129, pjset: 149, cathoodie: 199, mirror: 199, vacuum: 899, speaker: 199, tv: 149, seal: 39, tea: 25 } as Record<string, number>,
  SHOP_FUEL_CANS: 4,              // Goblin Fuel: a pack of four for the drawer (MONSTER_DRAWER holds 8)
  SHOP_CHEW_SEC: 120,             // the dog chew: his next visit comes this much later
  SHOP_CHAIR_TIRED: 0.85,         // the ergo chair: Tiredness builds at this rate
  SHOP_FLOWERS_GOODWILL: 20,      // flowers for her: Goodwill at once

  // --- Economy --- (real money: the names say ZL and the save field is `zl`, from when it was złoty; it shows in dollars, the same numbers, #105)
  START_GOLD: 100, START_ZL: 50,
  FLOOR_GOLD_BASE: 5, FLOOR_GOLD_PER: 3,   // a cleared floor pays BASE + PER x floor: steady income besides selling drops (#2)
  // Alt-tab lag: every switch between the game and Excel blacks out the screen like a fullscreen game
  ALT_TAB_LAG_SEC: [1.0, 2.5] as [number, number],
  IDENTIFY_COST: { epic: 40, legendary: 100 },
  UNIDENTIFIED_VENDOR_MULT: 0.5,
  SALVAGE_YIELD: [1, 2, 4, 8, 16],
  ZL_PER_VALUE: 1 / 6,
  MARKET_RANGE: [0.8, 1.3] as [number, number],
};
