// ===========================================================================
// Caught: the full-screen scare (0.8 s and a sting). Her, head and shoulders, in your doorway with the hallway light
// behind her, drawn like a late PC-98 dating-sim portrait in her panel's 16 colours: flat tones with 50% checkers
// between them, crisp line art. One face per rung of the night's ladder: 1st a stern glare; 2nd her glasses go
// blank white and her face falls into shadow; 3rd and later, furious: a shout, an anger mark, the hallway lit red.
// A PC-98 text window says it. The portraits are baked (caught/gf_svg.js -> render.js -> compose.py).
// ===========================================================================
const CAUGHT_IDX = [];
const CAUGHT_READY = Promise.all(CAUGHT_SRC.map((src, k) => new Promise((res) => {
  const im = new Image();
  im.onload = () => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 360; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, 640, 360).data, a = new Uint8Array(640 * 360), key = new Map(PC98_RGB.map((q, i) => [(q[0] << 16) | (q[1] << 8) | q[2], i]));
    for (let i = 0; i < a.length; i++) a[i] = key.get((d[i * 4] << 16) | (d[i * 4 + 1] << 8) | d[i * 4 + 2]) ?? 0;
    CAUGHT_IDX[k] = a; res();
  };
  im.onerror = () => res(); im.src = src;
})));
// what this catch costs (the ladder per night)
const CAUGHT_COST = ['Caught 1 of 3 tonight · Flow reset', 'Caught 2 of 3 · Guilt: the party deals 10% less for 30 s', 'Caught 3 · she turns your monitor off for 8 s · Flow reset'];
const CAUGHT_SCARE = 0.8;
let CAUGHT_CANVAS = null;
// n: 1, 2, 3 (the rung); T: seconds since the catch; cost: the line under WE NEED TO TALK. (the game passes its own)
function drawCaught(n, T, cost = CAUGHT_COST[n - 1]) {
  if (!CAUGHT_CANVAS) { CAUGHT_CANVAS = document.createElement('canvas'); CAUGHT_CANVAS.width = 640; CAUGHT_CANVAS.height = 360; }
  setRes(640, 360); CLIP = null;
  const F = buf('caught', 640, 360); F.I.fill(-1); bind(F);
  const src = CAUGHT_IDX[Math.max(0, Math.min(2, n - 1))];
  // the scare: a white flash, an interlaced punch-in, then a shake that settles over the 0.8 s
  const sh = T < CAUGHT_SCARE ? (1 - T / CAUGHT_SCARE) ** 1.5 * (n === 3 ? 7 : 5) : 0, dx = Math.round(Math.sin(T * 93) * sh), dy = Math.round(Math.cos(T * 71) * sh * 0.6);
  if (T < 0.05) rectI(0, 0, 640, 360, C9.moon);
  else if (src) {
    const inter = T < 0.1;
    for (let y = 0; y < 360; y++) {
      const sy = Math.max(0, Math.min(359, y - dy)), row = sy * 640, o = y * 640;
      for (let x = 0; x < 640; x++) F.I[o + x] = inter && (y & 1) ? C9.void : src[row + Math.max(0, Math.min(639, x - dx))];
    }
  }
  // the text window (PC-98): plum with a lilac edge and a purple bevel, her name on a pink tab, the line in crimson
  if (T >= 0.12) {
    const wx = 104, wy = 286, ww = 432, wh = 64;
    win9(wx, wy, ww, wh, { fill: C9.plum, hi: C9.purple, lo: C9.void, edge: C9.lilac });
    for (let j = wy + 3; j < wy + wh - 3; j++) for (let i = wx + 3; i < wx + ww - 3; i++) if (((i + j) & 3) === 0 && j > wy + wh - 18) putI(i, j, C9.void);
    win9(wx + 10, wy - 9, 42, 13, { fill: C9.pink, hi: C9.skin, lo: C9.rose, edge: C9.plum });
    heart9(wx + 14, wy - 6, true);
    text('Babe', wx + 24, wy - 6, 'tiny', C9.plum);
    text('WE NEED TO TALK.', wx + 18, wy + 12, 'tinyL', C9.crimson, { shadow: C9.void });
    text(cost, wx + 18, wy + 40, 'tiny', C9.lilac);
    if (Math.floor(T * 2.5) % 2 === 0) spr(wx + ww - 18, wy + wh - 13, ['xxxxx', '.xxx.', '..x..'], { x: C9.moon });
  }
  const ctx = CAUGHT_CANVAS.getContext('2d'), img = ctx.createImageData(640, 360), D = img.data;
  for (let i = 0; i < 640 * 360; i++) { const q = PC98_RGB[F.I[i] < 0 ? 0 : F.I[i]], p = i * 4; D[p] = q[0]; D[p + 1] = q[1]; D[p + 2] = q[2]; D[p + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  return CAUGHT_CANVAS;
}

// ---------------------------------------------------------------- live (V7, #72): the game's catch
// After the scare the picture only changes with the blinking ▼, so the held screen is drawn once per blink.
let CAUGHT_KEY = '';
function drawCaughtLive(n, T, cost) {
  const key = T >= CAUGHT_SCARE ? n + '|' + cost + '|' + (Math.floor(T * 2.5) % 2) : '';
  if (key && key === CAUGHT_KEY && CAUGHT_CANVAS) return CAUGHT_CANVAS;
  CAUGHT_KEY = key;
  return drawCaught(n, T, cost);
}
