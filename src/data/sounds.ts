// Sound mix (docs/design/screen.md, Audio). Files live in src/assets/sfx/: baked by tools/sfx/make.py from Kenney CC0
// recordings and synthesis. Drop your own file in src/assets/sfx/own/ with a cue's name (step.mp3, or step_0.mp3,
// step_1.mp3 for variants) and it replaces that cue. Every baked file is loudness-matched, so these gains are the mix.

/** Volume per cue (1 = full). */
export const MIX: Record<string, number> = {
  // her (apartment bus, also scaled by room distance)
  step: 0.75, stepsoft: 0.55, latch: 0.55, door: 0.5, doorclose: 0.45, plate: 0.35, hum: 0.4,
  tv: 0.42, laugh: 0.35, credits: 0.45, kettle: 0.4, kettleoff: 0.5, shower: 0.5, dryer: 0.45,
  flush: 0.55, tap: 0.5, bye: 0.65, breath: 0.25, creak: 0.4, bath: 0.5, drain: 0.55, babe: 0.7,
  // the desk
  buzz: 0.55, buzzmsg: 0.55, can: 0.6, gulp: 0.5, fridge: 0.45, tin: 0.45, bin: 0.4, key: 0.35,
  bark: 0.6, whine: 0.35,
  // the RPG (#155): Age of Judgment's own, through the console chain (tools/sfx/aoj_sfx.py). Audio-first, what you must
  // hear while Excel covers the screen (synergy.md): legendary, bagfull, goblin, goblincatch, goblinlost, down, enrage,
  // wipe, and the SMASH wind-up. The blows come about once a second all night: quiet, under everything; the skills a
  // step up; the big moves, the bosses' falls and the audio-first cues the loudest.
  legendary: 0.85, bagfull: 0.6, goblin: 0.6, goblincatch: 0.65, goblinlost: 0.5, down: 0.6, enrage: 0.8,
  wipe: 0.65, slam: 0.75, coins: 0.5, trash: 0.5,
  rpg_slash: 0.26, rpg_stab: 0.24, rpg_bolt: 0.24, rpg_smite: 0.24, rpg_bash: 0.5, rpg_backstab: 0.5, rpg_fire: 0.5,
  rpg_frost: 0.45, rpg_crit: 0.36, rpg_combo: 0.45, rpg_shieldbreak: 0.6, rpg_whiff: 0.18,
  rpg_hurt: 0.24, rpg_bite: 0.2, rpg_hex: 0.34, rpg_darkmend: 0.3,
  rpg_taunt: 0.5, rpg_smoke: 0.45, rpg_mend: 0.45, rpg_ward: 0.45, rpg_heal: 0.3,
  rpg_laststand: 0.6, rpg_heist: 0.55, rpg_cataclysm: 0.7, rpg_miracle: 0.6,
  rpg_levelup: 0.5, rpg_revive: 0.45, rpg_refuse: 0.35, rpg_ui: 0.4, rpg_swap: 0.35,
  rpg_wind_smash: 0.9, rpg_smash: 0.85, rpg_wind_toll: 0.6, rpg_toll: 0.7, rpg_wind_execute: 0.7, rpg_execute: 0.85,
  rpg_wind_hook: 0.4, rpg_hook: 0.5, rpg_wind_shove: 0.45, rpg_shove: 0.55, rpg_interrupt: 0.6,
  die_hollow: 0.45, die_guardian: 0.48, die_revenant: 0.45, die_penitent: 0.42, die_confessor: 0.42, die_cherub: 0.3,
  die_ironwing: 0.4, die_vigil: 0.4, die_gravedigger: 0.5, die_gaoler: 0.8, die_bellringer: 0.8, die_inquisitor: 0.8,
  die_abbot: 0.7,
  rpg_spotted: 0.45, rpg_portal: 0.45, rpg_victory: 0.6, rpg_floor: 0.45, rpg_page: 0.35,
  rpg_floordrop: 0.3, rpg_glint: 0.3, rpg_pickup: 0.3, rpg_loot: 0.5, rpg_identify: 0.4,
  rpg_gold: 0.45, rpg_sell: 0.45, rpg_souls: 0.4, rpg_list: 0.4, rpg_build: 0.5, rpg_tree: 0.45, rpg_respec: 0.4,
  rpg_equip: 0.45, rpg_unequip: 0.4, rpg_drop: 0.4, rpg_lock: 0.45,
  rpg_curio: 0.4, rpg_pick: 0.4, rpg_chest: 0.5, rpg_crash: 0.7, rpg_kick: 0.6, rpg_glass: 0.6, rpg_groan: 0.5,
  rpg_curse: 0.45, rpg_bless: 0.45, rpg_sneak: 0.35, rpg_withdraw: 0.4,
  // the launch on the first Monday (#127, aoj-world §7b): the real PC clean and quiet; the game's own through the console
  // chain: Halsky Labs, Procrastination Studios light, the title the heavy part (the strike the loudest), the theme
  // under the title's sounds
  mouse: 0.35, kb_clack: 0.32, crt: 0.4, cdspin: 0.14, bootline: 0.25,
  hl_line: 0.4, hl_scan: 0.22, hl_fly: 0.26, hl_hit: 0.8, hl_badge: 0.3, hl_presents: 0.3, hl_glint: 0.22,   // Halsky Labs (#133): the hit is the sting's one big beat
  ps_drop: 0.26, ps_mod: 0.5,   // Procrastination Studios (#133): the cracktro's drop and its tracker jingle
  thunder_near: 0.8, thunder_far: 0.45, rain: 0.32,
  aoj_ring: 0.8, aoj_spark: 0.6, aoj_word: 0.75, aoj_strike: 1.0, aoj_quench: 0.4, aoj_ageof: 0.65, aoj_glint: 0.3,
  ui_panel: 0.45, ui_login: 0.55, ui_verified: 0.5,
  aoj_theme: 0.6,
};

/** Seamless loops: their loop length in seconds (the baked files carry LOOP_PAD of wrap-around on both sides). */
export const LOOP_SEC: Record<string, number> = { tv: 9, kettle: 4, shower: 4, bath: 8, rain: 6 };
export const LOOP_PAD = 0.25;

/** Her activity -> its continuous sound while she is at it. */
export const AMBIENCE: Record<string, string> = { tv: 'tv', tea: 'kettle', shower: 'shower', bath: 'bath', yoga: 'tv' };   // yoga: the video on the TV
/** Her activity -> the cue that it is ending (END_CUE_SEC before she moves). */
export const END_CUE: Record<string, string> = { tv: 'credits', tea: 'kettleoff', toilet: 'tap', shower: 'dryer', bath: 'drain', phone: 'bye', yoga: 'credits', mask: 'tap' };

/** The fallen (#154, #155): each kind's own crumble, by enemy id (the bat by its look: Ironwing or Vigil). */
export const DIE_CUE: Record<string, string> = {
  skeleton: 'die_hollow', shelter: 'die_guardian', collector: 'die_revenant', ghoul: 'die_penitent', auditor: 'die_confessor',
  junk: 'die_cherub', brute: 'die_gravedigger', bailiff: 'die_gaoler', shark: 'die_bellringer', landlord: 'die_inquisitor',
  troll: 'die_abbot',
};
/** Each boss's own roar when ENRAGED (the enrage cue's variants); the Abbot's when he wakes. */
export const ENRAGE_OF: Record<string, number> = { bailiff: 0, shark: 1, landlord: 2, troll: 3 };
