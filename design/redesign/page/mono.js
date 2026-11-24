// ---------------------------------------------------------------- the RPG in one colour (a test: battle only)
// The battle is drawn as usual in Moonwell 32, then each pixel is mapped by its brightness onto a single-hue ramp, so the
// game's own dither patterns carry over. moonwell: the first redesign's blue hour, gold kept for loot only;
// green: an old green-phosphor monitor; white: one bit, black and white, ordered dither (World of Horror).
const MONO = {
  moonwell: { ramp: ['#060816', '#18214a', '#34519a', '#7ea6d8', '#dbe8f2'], gold: ['#8a5a12', '#ffc23f'] },
  green: { ramp: ['#020a04', '#0a3314', '#156a27', '#2cb346', '#8dfc8a'] },
  white: { bit: ['#000000', '#ffffff'] },
};
let RPG_MONO = 'full', MONO_CANVAS = null;
const MONO_CACHE = new Map();
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const MONO_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function monoScreen(src) {
  const w = src.width, h = src.height;
  if (!MONO_CANVAS) { MONO_CANVAS = document.createElement('canvas'); MONO_CANVAS.width = w; MONO_CANVAS.height = h; }
  const sctx = src.getContext('2d'), img = sctx.getImageData(0, 0, w, h), D = img.data, M = MONO[RPG_MONO];
  let cache = MONO_CACHE.get(RPG_MONO); if (!cache) { cache = new Map(); MONO_CACHE.set(RPG_MONO, cache); }
  const ramp = M.ramp && M.ramp.map(hexRGB), gold = M.gold && M.gold.map(hexRGB), bit = M.bit && M.bit.map(hexRGB);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4, r = D[o], g = D[o + 1], b = D[o + 2];
    // brightness, lifted a little so the dark crypt keeps its steps
    const l0 = (0.3 * r + 0.59 * g + 0.11 * b) / 255, l = Math.pow(l0, 0.8);
    let c;
    if (bit) c = bit[Math.pow(l0, 1.3) * 1.15 > (MONO_BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16 ? 1 : 0];   // one bit: kept dark, so the crypt stays black and the figures read
    else {
      const key = (r << 16) | (g << 8) | b; c = cache.get(key);
      if (!c) {
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), s = mx ? (mx - mn) / mx : 0;
        let hue = 0; if (mx !== mn) { if (mx === r) hue = 60 * (((g - b) / (mx - mn)) % 6); else if (mx === g) hue = 60 * ((b - r) / (mx - mn) + 2); else hue = 60 * ((r - g) / (mx - mn) + 4); } if (hue < 0) hue += 360;
        if (gold && hue >= 28 && hue <= 58 && s > 0.45 && mx > 110) c = gold[mx > 200 ? 1 : 0];   // loot gold stays gold
        else c = ramp[Math.min(ramp.length - 1, Math.floor(l * ramp.length * 1.05))];
        cache.set(key, c);
      }
    }
    D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2];
  }
  MONO_CANVAS.getContext('2d').putImageData(img, 0, 0);
  return MONO_CANVAS;
}
