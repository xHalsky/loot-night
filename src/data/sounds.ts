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
  // the RPG: the five events you must hear while Excel covers the screen (synergy.md, audio-first loot)
  legendary: 0.85, bagfull: 0.6, goblin: 0.6, goblincatch: 0.65, goblinlost: 0.5, down: 0.6, enrage: 0.8,
  wipe: 0.65, slam: 0.75, coins: 0.5,
  // the launch on the first Monday (#127, aoj-world §7b): the real PC clean and quiet; the game's own through the console
  // chain: Halsky Labs, Procrastination Studios light, the title the heavy part (the strike the loudest), the theme
  // under the title's sounds
  mouse: 0.35, kb_clack: 0.42, crt: 0.4, cdspin: 0.14, bootline: 0.25,
  hl_point: 0.5, hl_trace: 0.45, hl_seal: 0.45, hl_develop: 0.45, hl_land: 0.62, hl_slide: 0.35, hl_labs: 0.35, hl_out: 0.4, hl_blink: 0.3,
  ps_wait: 0.22, ps_pop: 0.35, ps_move: 0.22, ps_letters: 0.3, ps_late: 0.32, ps_type: 0.22, ps_flip: 0.3,
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
