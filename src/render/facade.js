// ---------------------------------------------------------------------------------------------------------------
// The facade (appended to the page modules by the pagekit Vite plugin, so it shares their one module scope).
// The game talks to the redesign's renderer only through PK. Everything above this line is the mockup page's code
// (design/redesign/page), kept as close to it as possible; game state goes in through PK's arguments.
// ---------------------------------------------------------------------------------------------------------------
let PK_READY = null;
function pkInit() {
  if (PK_READY) return PK_READY;
  PK_READY = (async () => {
    await Promise.all([document.fonts.load('8px silkb'), document.fonts.load('8px tiny5'), document.fonts.load('11px m5'), document.fonts.load('13px jb9'), HER_READY, CAUGHT_READY, MORNING_READY]);
    TC = document.createElement('canvas'); TC.width = 600; TC.height = 64; TX = TC.getContext('2d', { willReadFrequently: true });
    setRes(334, 232); buildDungeon();
  })();
  return PK_READY;
}
let LIVE_CANVAS = null;
/** The battle area from the game's view model (V2): a 334 x 232 canvas and the hit regions (grid px). */
function pkBattleArea(vm, t) {
  if (!LIVE_CANVAS) { LIVE_CANVAS = document.createElement('canvas'); LIVE_CANVAS.width = BA_W; LIVE_CANVAS.height = GS_H; }
  if (vm.curio && vm.curio.card) for (const c of vm.curio.card.choices) { c.label = c.label.map(([s, k]) => [s, P[k]]); c.cost = c.cost.map(([s, k]) => [s, P[k]]); }
  const hits = vm.tree ? liveTree(LIVE_CANVAS.getContext('2d'), vm.tree, t) : vm.paths ? livePaths(LIVE_CANVAS.getContext('2d'), vm.paths, t) : liveBattleArea(LIVE_CANVAS.getContext('2d'), vm, t);
  return { canvas: LIVE_CANVAS, hits };
}
let PANEL_CANVAS = null;
/** The side panel from the game's view model (V2, #53): a 140 x 232 canvas and its hit regions (panel px). */
function pkPanel(vm, t) {
  if (!PANEL_CANVAS) { PANEL_CANVAS = document.createElement('canvas'); PANEL_CANVAS.width = SP_W; PANEL_CANVAS.height = GS_H; }
  const hits = livePanel(PANEL_CANVAS.getContext('2d'), vm, t);
  return { canvas: PANEL_CANVAS, hits };
}
export const PK = {
  ready: () => !!PK_READY && TC !== null,
  battleArea: pkBattleArea,
  panel: pkPanel,
  init: pkInit,
  /** The whole 640 x 360 frame as the mockup draws it (V1's check against still 00-default). */
  drawFrame: (scene, tScreen, t, moment, her, o) => drawFrame(scene, tScreen, t, moment, her, o || {}),
  drawScreen: (scene, t, o) => drawScreen(scene, t, o || {}),
  palettes: () => ({ moonwell: PAL_BASE.PAL, pc98: PC98, desk: deskSet(DESK_VARIANT).PAL }),
};
