# Bake her panel's webcam view from the prototype's own screenshots: 296x720 CSS px = exactly 2x the game grid.
# Downsample 2x in linear light, then quantize with ordered dither: his room to the desk's Graphite palette, her side
# (what shows through the door: the corridor and her, the light under the door, the daydream bubble) to the PC-98 set.
import numpy as np, json, re, base64, io
from PIL import Image
UP = '/mnt/user-data/uploads/'
SRC = {'chat': ('8ab6429e-image.png', True), 'kettle': ('c5819a81-image.png', False), 'steps': ('09f0c526-image.png', False), 'shower': ('6b9bef88-image.png', False)}
# palettes (read from the game's sources so they stay in sync)
desk = open('desk.js').read(); her = open('her.js').read()
core = dict(re.findall(r"(\w+): '(#[0-9a-f]{6})'", desk[desk.index('const CORE8'):desk.index('const CORE8') + 400]))
g = desk[desk.index("graphite: {"):desk.index("// C: a gamer's room")]
gh = dict(re.findall(r"(\w+): '(#[0-9a-f]{6})'", g))
STEEL = '#5398b5'
GRAPHITE = [core['void'], gh['s1'], gh['s2'], gh['s3'], gh['s4'], gh['s5'], core['s6'], gh['g1'], gh['g2'], gh['g3'], gh['g4'], core['g5'], gh['g6'], gh['d1'], gh['d2'], gh['d3'], gh['d4'], gh['d5'], core['d6'],
            gh['u1'], gh['u2'], gh['u3'], gh['u4'], gh['u5'], gh['u6'], core['moon'], gh['wine'], gh['copper'], core['gold'], gh['pale'], core['crimson'], core['arcane'], STEEL]
pc = her[her.index('const PC98 = ['):her.index('];', her.index('const PC98 = ['))]
PC98 = []
for tok in re.findall(r"CORE8\.(\w+)|'(#[0-9a-f]{6})'", pc): PC98.append(core[tok[0]] if tok[0] else tok[1])
assert len(PC98) == 16 and len(GRAPHITE) == 33, (len(PC98), len(GRAPHITE))
hexrgb = lambda h: np.array([int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)], float) / 255
def oklab(rgb):
    c = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    l = 0.4122214708 * c[..., 0] + 0.5363325363 * c[..., 1] + 0.0514459929 * c[..., 2]
    m = 0.2119034982 * c[..., 0] + 0.6806995451 * c[..., 1] + 0.1073969566 * c[..., 2]
    s = 0.0883024619 * c[..., 0] + 0.2817188376 * c[..., 1] + 0.6299787005 * c[..., 2]
    l, m, s = np.cbrt(l), np.cbrt(m), np.cbrt(s)
    return np.stack([0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s], -1)
B8 = np.array([[0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26], [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
               [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25], [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]], float) / 64 - 0.5
def quant(img, pal, strength, mask):
    P = np.array([hexrgb(h) for h in pal]); PL = oklab(P); PL[:, 0] *= 1.3
    h, w, _ = img.shape; yy, xx = np.mgrid[0:h, 0:w]
    d = img + (B8[yy % 8, xx % 8] * strength)[..., None]
    L = oklab(np.clip(d, 0, 1)); L[..., 0] *= 1.3
    dist = ((L[:, :, None, :] - PL[None, None, :, :]) ** 2).sum(-1)
    idx = dist.argmin(-1)
    out = P[idx]
    return np.where(mask[..., None], out, 0), idx
def lin(a): return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
def srgb(a): return np.where(a <= 0.0031308, a * 12.92, 1.055 * np.clip(a, 0, None) ** (1 / 2.4) - 0.055)
out = {}
for name, (f, full) in SRC.items():
    a = np.asarray(Image.open(UP + f).convert('RGB')).astype(float)
    if full: a = a[:, :296]
    a = a[:532].copy()
    # clean the prototype's header (name and mood pill): copy the wall from row 3 of the same column
    for x in range(296):
        top = 26 if 50 <= x <= 246 else 34
        a[4:top, x] = a[3, x]
    # her side, in CSS px: what shows through the doorway (minus the leaf), the light under the door, the bubble
    lum = a.mean(2); sat = a.max(2) - a.min(2)
    M = np.zeros(a.shape[:2], bool)
    door = (slice(33, 370), slice(56, 241))
    if name in ('chat', 'kettle', 'steps'):
        starts = []
        for y in range(60, 340, 4):
            row = a[y, 56:241]; nonleaf = np.where((row.max(1) - row.min(1) > 10) | (row.mean(1) > 70))[0]
            if len(nonleaf): starts.append(56 + nonleaf[0])
        gx = int(np.median(starts)); print(name, 'gap starts at x', gx)
        M[33:370, gx:241] = True
    if name == 'shower':
        br = (lum > 175); br[:100] = False; br[:, :56] = False; br[:, 228:] = False
        ys, xs = np.where(br[:272]); cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2; r = (xs.max() - xs.min()) / 2 + 1.5
        yy, xx = np.mgrid[0:532, 0:296]; M |= (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r
        tail = br.copy(); tail[:272] = False
        for dy in (-2, -1, 0, 1, 2):
            for dx in (-2, -1, 0, 1, 2): M |= np.roll(np.roll(tail, dy, 0), dx, 1)
        print('bubble', cx, cy, r)
    GAP = np.zeros_like(M); GAP[369:377, 56:241] = (a[369:377, 56:241, 0] > 200) & (a[369:377, 56:241, 2] < 170)
    M |= GAP   # the light under the door (and the threshold's lit edge)
    # 2x downsample in linear light
    L = lin(a / 255); h2 = L.reshape(266, 2, 148, 2, 3).mean((1, 3)); img = srgb(h2)
    m2 = M.reshape(266, 2, 148, 2).mean((1, 3)) >= 0.5
    gap2 = GAP.reshape(266, 2, 148, 2).mean((1, 3)) >= 0.5
    room, ri = quant(img, GRAPHITE, 0.035, ~m2)
    # her side: the PC-98 set plus the desk's darks and greiges, so the prototype's colours stay close; dithered
    side, si = quant(img, PC98 + GRAPHITE, 0.09, m2)
    res = np.clip((room + side) * 255 + 0.5, 0, 255).astype(np.uint8)
    # the light under the door: the prototype's bright yellow bar, a pale top row over gold
    ys, xs = np.where(gap2)
    for y, x in zip(ys, xs): res[y, x] = (np.array(hexrgb(core['gold'])) * 255).astype(np.uint8) if y > ys.min() else (np.array(hexrgb(gh['pale'])) * 255).astype(np.uint8)
    Image.fromarray(res).save(f'proto/her-{name}.png')
    Image.fromarray(res).resize((296 * 2, 532 * 2), Image.NEAREST).save(f'out/bake-{name}.png')
    buf = io.BytesIO(); Image.fromarray(res).save(buf, 'PNG', optimize=True); out[name] = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
    print(name, 'png bytes', len(buf.getvalue()))
js = '// her panel\'s webcam view, baked from the prototype\'s own screenshots (bake_her.py): 2x down, palette-dithered\n'
js += 'const HER_IMG_SRC = ' + json.dumps(out) + ';\n'
open('her_img.js', 'w').write(js)
