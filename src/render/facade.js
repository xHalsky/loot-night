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
export const PK = {
  init: pkInit,
  /** The whole 640 x 360 frame as the mockup draws it (V1's check against still 00-default). */
  drawFrame: (scene, tScreen, t, moment, her, o) => drawFrame(scene, tScreen, t, moment, her, o || {}),
  drawScreen: (scene, t, o) => drawScreen(scene, t, o || {}),
  palettes: () => ({ moonwell: PAL_BASE.PAL, pc98: PC98, desk: deskSet(DESK_VARIANT).PAL }),
};
