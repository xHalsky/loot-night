// ---------------------------------------------------------------------------------------------------------------
// The facade (appended to the page modules by the pagekit Vite plugin, so it shares their one module scope).
// The game talks to the redesign's renderer only through PK. Everything above this line is the mockup page's code
// (design/redesign/page), kept as close to it as possible; game state goes in through PK's arguments.
// ---------------------------------------------------------------------------------------------------------------
let PK_READY = null;
function pkInit() {
  if (PK_READY) return PK_READY;
  PK_READY = (async () => {
    await Promise.all([document.fonts.load('60px czd'), document.fonts.load('16px cz'), document.fonts.load('30px sora'), document.fonts.load('24px fred'), document.fonts.load('8px silkb'), document.fonts.load('8px tiny5'), document.fonts.load('11px m5'), document.fonts.load('13px jb9'), document.fonts.load(`${1400 / 75}px j10`), HER_READY, CAUGHT_READY, MORNING_READY]);
    TC = document.createElement('canvas'); TC.width = 600; TC.height = 64; TX = TC.getContext('2d', { willReadFrequently: true });
    setRes(334, 232); buildDungeon(); cryptTells();   // the crypt's tells (#129): the ribs, the iron angel, the halo banner
  })();
  return PK_READY;
}
let LIVE_CANVAS = null;
/** The battle area from the game's view model (V2): a 334 x 232 canvas and the hit regions (grid px). */
function pkBattleArea(vm, t) {
  if (!LIVE_CANVAS) { LIVE_CANVAS = document.createElement('canvas'); LIVE_CANVAS.width = BA_W; LIVE_CANVAS.height = GS_H; }
  if (vm.curio && vm.curio.card) for (const c of vm.curio.card.choices) { c.label = c.label.map(([s, k]) => [s, P[k]]); c.cost = c.cost.map(([s, k]) => [s, P[k]]); }
  const hits = vm.town ? liveTown(LIVE_CANVAS.getContext('2d'), vm.town, t) : vm.tree ? liveTree(LIVE_CANVAS.getContext('2d'), vm.tree, t) : vm.paths ? livePaths(LIVE_CANVAS.getContext('2d'), vm.paths, t) : liveBattleArea(LIVE_CANVAS.getContext('2d'), vm, t);
  return { canvas: LIVE_CANVAS, hits };
}
let PANEL_CANVAS = null;
/** The side panel from the game's view model (V2, #53): a 140 x 232 canvas and its hit regions (panel px). */
function pkPanel(vm, t) {
  if (!PANEL_CANVAS) { PANEL_CANVAS = document.createElement('canvas'); PANEL_CANVAS.width = SP_W; PANEL_CANVAS.height = GS_H; }
  const hits = livePanelAll(PANEL_CANVAS.getContext('2d'), vm, t);
  return { canvas: PANEL_CANVAS, hits };
}
/** The party's names and classes from the game (data/heroes.ts, the one table; cast of 2026-11-27), keyed by the page's
 *  ids (knight, rogue, mage, priest): the page's own tables (HEROES, HNAME, the feed's hero tags) take them. */
function pkHeroNames(t) {
  const TAG = { mage: 'arcane', priest: 'g5' };   // the colours the mage's and the priest's chat tags already had
  for (const h of HEROES) {
    const n = t[h.id]; if (!n) continue;
    if (TAG[h.id]) { delete FEED_TAG[h.name.toUpperCase()]; FEED_TAG[n.name.toUpperCase()] = TAG[h.id]; }
    h.name = n.name; h.short = n.name; h.cls = n.cls; HNAME[h.id] = n.name;
  }
}
/** The launch on the first Monday (#127): the game screen at launch second T, 474 x 232 (null once it is the game). */
function pkLaunch(T) { const c = launchScreen(T); if (c) setRes(BA_W, GS_H); return c; }
export const PK = {
  /** The launch (#127, aoj.js): the game screen at its second T (474 x 232: the battle area, then the side panel), or null
   *  from LAUNCH_END on; ditherBlack(canvas, a) is its palette-exact fade to black (the town fading in); its cue sheet. */
  launch: pkLaunch,
  ditherBlack: (c, a) => ditherBlack(c, a),
  /** Age of Judgment's desktop icon, the broken halo, 18 x 18 (the monitor's own desktop, ui/monitor.ts). */
  aojIcon: () => { const c = aojIconCanvas(); setRes(BA_W, GS_H); return c; },
  launchSheet: () => ({ sound: LAUNCH_SOUND, loops: LAUNCH_LOOPS, music: LAUNCH_MUSIC, end: LAUNCH_END }),
  ready: () => !!PK_READY && TC !== null,
  /** The party's names and classes (see pkHeroNames), once at start. */
  heroNames: pkHeroNames,
  /** A class's colour on the RPG's palette (knight steel, rogue ember, mage violet, priest gold), as #rrggbb, for the DOM. */
  classHex: (cls) => PAL_BASE.PAL[P[CLASS_COL[cls]]],
  battleArea: pkBattleArea,
  panel: pkPanel,
  /** The phone in your hand (V8, #73): a 126 x 252 canvas and its hit regions (its pixels). */
  phone: (vm, t) => livePhone(vm, t),
  /** Her panel (V4, #69; grid doc 7b): the game's webcam canvas (296 x 532) dithered onto the grid, her PC-98 UI under it;
   *  148 x 360 and the UI's hit regions. */
  her: (src, st, t) => drawHerLive(src, st, t),
  /** The energy break (V5, #70; grid doc 7c) over the right screen, 492 x 360: bg (the right screen, when it should be
   *  dimmed anew) or null, the game's view of the step; and its hit regions. ebWarm bakes ahead (ms), ebMap says where
   *  things are on screen, ebCursor gives the CSS cursor. */
  ebreak: (bg, st, t) => drawEbLive(bg, st, t),
  ebWarm: (n, ms) => ebWarm(n, ms),
  ebMap: EB_MAP,
  ebCursor: (kind) => ebCursorURL(kind),
  /** The dog's NO SIGNAL (V6, #71): the monitor's message box drifting on black, 474 x 232. */
  noSignal: (t) => drawNoSignal(t),
  /** The cuddle break (V9, #74; grid doc 7g) over the right screen, 492 x 360: bg (the right screen, four times a second,
   *  or null), st { p, warmth, jerk, near, mx, my (window px, null off it), secs }, and the close box's hit. */
  cuddle: (bg, st, t) => drawCuddleLive(bg, st, t),
  /** The plan (V9, #74; grid doc 7g) over the whole frame, 640 x 360: frame (what is behind, or null to keep it), the
   *  game's layout (ui/plan.ts); hits: the close box, then the sheet. */
  plan: (frame, layout, t) => drawPlanLive(frame, layout, t),
  /** The morning (V10, #75; grid doc 7h): her CG by how the night ended, the summary, the caption; 640 x 360 and the
   *  pink button's hit. scene: green, yellow, red or unplugged. */
  morning: (scene, data, hover) => drawMorningLive(scene, data, hover),
  /** The small pieces (V11, #76; grid doc 7k). Full frame, 640 x 360: pause; How to hide over the frame dimmed
   *  (frame or null to keep; black when paused); the microsleep's lids (lid 0..1) over the frame. Right screen,
   *  492 x 360: away from the PC (st { what, left, total } or { ask, yes, no }); the Goblin Fuel inspect window. */
  pause: (t) => drawPauseLive(t),
  howto: (frame, o, t, black) => drawHowtoLive(frame, o, t, black),
  micro: (frame, lid, t) => drawMicroLive(frame, lid, t),
  away: (bg, st, t) => drawAwayLive(bg, st, t),
  /** The lap sit (fan-service 10, #86; grid doc 7m): the back of her head and her shoulder over the battle's left third,
   *  transparent, 640 x 360. o { say: her line by her head ('ooh, shiny'), mouse }. */
  /** Her photo opened beside the phone (fan-service 5, #92): 640 x 360, transparent; hits: the close box, the window
   *  (nothing), then the rest of the frame (closes it). o { first (the Goodwill chip), time }. */
  /** The phone's close box (#104): the grey disc with the red cross (the old .mg-close), at the grid's own pixel,
   *  12 x 12, a dark rim so it reads on anything; hot = pointed at. */
  closeBox: (hot) => {
    const c = document.createElement('canvas'); c.width = 12; c.height = 12;
    c.getContext('2d').drawImage(smLayer(12, 12, () => {
      for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) {
        const d = Math.hypot(i + 0.5 - 6, j + 0.5 - 6); if (d > 6) continue;
        putI(i, j, d > 5 ? P.void : d > 4.1 ? P.moon : j < 5 ? (hot ? P.moon : P.s5) : (hot ? P.s5 : P.s4));
      }
      for (let k = 0; k < 5; k++) for (const o of [0, 1]) { putI(3 + k + o, 3 + k, P.crimson); putI(8 - k - o, 3 + k, P.crimson); }
    }), 0, 0);
    return c;
  },
  photo: (key, t, o) => {
    const c = smCanvas('photo', 640, 360), g = c.getContext('2d'); g.clearRect(0, 0, 640, 360);
    PHONEOS.photoWindow(g, key, t, o || {});
    const w = PHONEOS.SELFIE_W + 12, h = PHONEOS.SELFIE_H + 22, x = 356, y = 50;
    return { canvas: c, hits: [{ x: x + w - 15, y, w: 14, h: 14, act: 'photoClose', arg: '' }, { x, y, w, h, act: 'photoNoop', arg: '' }, { x: 0, y: 0, w: 640, h: 360, act: 'photoClose', arg: '' }] };
  },
  /** Lean in (V12, #77; grid doc 7l): his view through the crack, 492 x 360 over the right screen. o { act, stage, u,
   *  slit, focus, mirror: 'off' | 'clear' | 'fog', look: 'busy' | 'tell' | 'sees', bar, t }. */
  lean: (o) => drawLean(o),
  lap: (t, o) => { const c = smCanvas('lap', 640, 360), g = c.getContext('2d'); g.clearRect(0, 0, 640, 360); lapOver(g, t, o || {}); return c; },
  inspect: (bg, o, t) => drawInspectLive(bg, o, t),
  /** A coach mark over the whole frame, transparent (V11): id, { title, text }; hits: the close box, then the callout. */
  /** Q4, the Excel clicker (step 4, #55; grid doc 7i): the game screen, 474 x 232, from the game's view; hits in its px. */
  q4: (st, t) => drawQ4Live(st, t),
  /** Excel's pointers as CSS cursors: 'arrow', 'cell', 'fill'. */
  q4Cursor: (kind) => q4Cursor(kind),
  coach: (id, o, t) => drawCoachLive(id, o, t),
  /** A tooltip over the whole frame, transparent (V11): { style: desk | pc | her, title, key, lines, note } at the pointer. */
  tip: (tip, x, y) => drawTipLive(tip, x, y),
  /** Caught (V7, #72; grid doc 7e): the full-frame scare, 640 x 360. rung 1 to 3, T seconds since the catch, cost the line. */
  caught: (rung, T, cost) => drawCaughtLive(rung, T, cost),
  /** The cable fix (V6): start it on the game's deal and rule; the pointer in scene px; draw it over the right screen. */
  cableStart: (deal, plug, elapsed) => { cableGame(deal, plug, elapsed); },
  cableDown: (x, y) => !!(CABLE.live && CABLE.live.down(x, y)),
  cableMove: (x, y) => !!(CABLE.live && CABLE.live.move(x, y)),
  cableUp: () => { if (CABLE.live) CABLE.live.up(); },
  cableWarm: (ms) => ebBakeStep(cableJob(), ms),
  /** Where each lying plug's face and each socket are (scene px), for the tests. */
  cablePoints: () => { const d = CABLE.deal; return { plugs: [0, 1, 2, 3].map((p) => camP(CABLE_CAM, CB.rest[p][0], (PORTS[d.kinds[p]].hh * PS) / 2, CB.rest[p][1] + (PORTS[d.kinds[p]].L * PS) / 2)), slots: CB.slots.map((x) => camP(CABLE_CAM, x, CB.y, CB.back + 4.6)) }; },
  cableDragging: () => !!(CABLE.live && CABLE.live.drag),
  cables: (bg, t) => drawCablesLive(bg, t),
  /** The right screen around the game screen (V3, #68): desk, bezel, taskbar, keyboard, phone, cards; 492 x 360.
   *  phase 1 builds the frame and returns null, phase 2 lights it and returns it (two frames' work); 0 does both. */
  desk: (src, st, t, phase = 0) => drawDeskLive(src, st, t, phase),
  init: pkInit,
  /** The whole 640 x 360 frame as the mockup draws it (V1's check against still 00-default). */
  drawFrame: (scene, tScreen, t, moment, her, o) => drawFrame(scene, tScreen, t, moment, her, o || {}),
  drawScreen: (scene, t, o) => drawScreen(scene, t, o || {}),
  palettes: () => ({ moonwell: PAL_BASE.PAL, pc98: PC98, desk: deskSet(DESK_VARIANT).PAL }),
};
