# python3 compose.py in.png out_prefix: the ray pass (4x: material, light, depth) -> 640 x 360 in her PC-98 16 colours.
# Each material on its own ramp with flat tones and 50% checkers between them (what PC-98 painters used); line art in
# exact colours where a nearer surface meets something further back (material or depth), drawn on the nearer side.
import sys, numpy as np
from PIL import Image
PC98 = ['#0a0814', '#331122', '#553366', '#aa88cc', '#5577aa', '#ee6688', '#d9a69c', '#ffddcc', '#eeddbb', '#bb9977', '#774433', '#f1a934', '#f2efdc', '#d23c5a', '#81c1c8', '#749970']
RGB = np.array([[int(h[i:i+2], 16) for i in (1, 3, 5)] for h in PC98], np.uint8)
V, PL, PU, LI, DE, RO, PI, SK, BE, TA, BR, GO, MO, CR, CY, MS = range(16)
# material ids from scene.html
WALL, FLOOR, WOOD, SHEET, PILLOW, SKIN, SOLE, HAIR, TEE, PANTY, BLANKET, CLIP, NAIL, PHONE, GLOW, PAD = range(1, 17)
RAMP = {0: [V], WALL: [PL, BR, TA, BE, MO], FLOOR: [V, PL, BR, TA], WOOD: [V, PL, BR, TA, BE], SHEET: [TA, BE, MO], PILLOW: [TA, BE, MO],
        SKIN: [BR, PI, SK, MO], SOLE: [BR, PI, SK], PAD: [BR, RO, PI, SK], HAIR: [V, PL, PU, DE], TEE: [V, DE, CY], PANTY: [PL, CR, RO, PI], BLANKET: [PU, LI, BE, MO],
        CLIP: [CR, RO, MO], NAIL: [CR, RO], PHONE: [V, PL], GLOW: [CY, MO]}
GAIN = {SOLE: (0.02, 1.0), PAD: (0.0, 1.0), SKIN: (0.16, 1.0), SHEET: (0.0, 1.05), WALL: (0.28, 1.0), PANTY: (0.1, 1.0)}   # light offset, gain per material
import os as _os
for _kv in filter(None, _os.environ.get('GAINS', '').split(';')):   # per-scene overrides: GAINS='11:0.1,0.72;4:0,1'
    _k, _v = _kv.split(':'); GAIN[int(_k)] = tuple(map(float, _v.split(',')))
for _kv in filter(None, _os.environ.get('RAMPS', '').split(';')):   # per-scene ramp overrides: RAMPS='13:BE,MO'
    _k, _v = _kv.split(':'); RAMP[int(_k)] = [globals()[n] for n in _v.split(',')]
INK = {SKIN: BR, SOLE: BR, PAD: BR, HAIR: V, TEE: V, PANTY: PL, BLANKET: PL, PILLOW: TA, CLIP: PL, WOOD: V, NAIL: PL, PHONE: V}
def tone(ramp, L, x, y):
    t = np.clip(L, 0, 1) * (len(ramp) - 1); b = np.floor(t).astype(int); f = t - b
    up = np.where(f > 0.68, 1, np.where(f > 0.36, (x + y) & 1, 0))
    return np.array(ramp)[np.minimum(len(ramp) - 1, b + up)]
src = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(np.float32)
S = src.shape[1] // 640; H, W = 360, 640
mat4 = np.round(src[..., 0] / 255 * 16).astype(int)
L4 = src[..., 1] / 255; D4 = src[..., 2] / 255 * 600
# 1x: each pixel takes the material covering most of its 4 x 4 block, the mean light and the nearest depth of it
blk = mat4.reshape(H, S, W, S).transpose(0, 2, 1, 3).reshape(H, W, S * S)
cnt = np.stack([(blk == k).sum(-1) for k in range(17)], -1)
mat = cnt.argmax(-1)
Lb = L4.reshape(H, S, W, S).transpose(0, 2, 1, 3).reshape(H, W, S * S); Db = D4.reshape(H, S, W, S).transpose(0, 2, 1, 3).reshape(H, W, S * S)
sel = blk == mat[..., None]
L = (Lb * sel).sum(-1) / np.maximum(1, sel.sum(-1)); D = np.where(sel, Db, 1e9).min(-1)
yy, xx = np.mgrid[0:H, 0:W]
out = np.zeros((H, W), np.uint8)
for k, ramp in RAMP.items():
    m = mat == k
    if not m.any(): continue
    o, g = GAIN.get(k, (0, 1))
    out[m] = tone(ramp, L * g + o, xx, yy)[m]
# line art: a pixel is on an outline if a 4-neighbour is further back by more than 2.5 cm, or a different material that
# lies behind it; the line takes the nearer part's ink colour
ink = np.full((H, W), -1, np.int16)
for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
    nm = np.roll(mat, (dy, dx), (0, 1)); nd = np.roll(D, (dy, dx), (0, 1))
    edge = ((nd - D) > 2.5) | ((nm != mat) & (nd >= D - 0.5))
    for k, c in INK.items():
        ink[edge & (mat == k)] = c
out = np.where(ink >= 0, ink, out).astype(np.uint8)
# a screen's glow (argv[4]: the same view rendered without it): where it adds light, the surface takes the cool ramp
if len(sys.argv) > 4:
    g4 = np.asarray(Image.open(sys.argv[4]).convert('RGB')).astype(np.float32)[..., 1] / 255
    Gb = g4.reshape(H, S, W, S).transpose(0, 2, 1, 3).reshape(H, W, S * S)
    G = L - (Gb * sel).sum(-1) / np.maximum(1, sel.sum(-1))
    gm = (G > 0.1) & (mat != GLOW) & (mat != PHONE) & (mat != HAIR)
    cool = tone([PL, DE, CY, MO], np.clip(L * 1.05, 0, 1), xx, yy)
    out[gm & (ink < 0)] = cool[gm & (ink < 0)]
# her soles: drawn art laid over the 3D feet (sole.js); their light is the drawing's, carrying the 3D light's stripes
import os
def lay(name):
    pre = sys.argv[3] if len(sys.argv) > 3 else 'out/s-'
    if not os.path.exists(f'{pre}{name}.png'): return None, None
    im = np.asarray(Image.open(f'{pre}{name}.png').convert('RGBA')).astype(np.float32) / 255
    a = im[..., 3].reshape(H, S, W, S).mean(axis=(1, 3))
    v = (im[..., 0] * im[..., 3]).reshape(H, S, W, S).sum(axis=(1, 3)) / np.maximum(1e-6, im[..., 3].reshape(H, S, W, S).sum(axis=(1, 3)))
    return a, v
sa, sv = lay('sole'); pa, pv = lay('pad'); ia, _ = lay('ink-sole')
if sa is not None:
    m = sa > 0.5; mat[m] = SOLE; L[m] = np.clip(sv[m] * (0.62 + 0.5 * L[m]), 0, 1); D[m] = np.minimum(D[m], 60)
    m = (pa > 0.5) & (sa > 0.5); mat[m] = PAD; L[m] = np.clip(pv[m] * (0.62 + 0.5 * L[m]), 0, 1)
if sa is not None:
    for k, ramp in ((SOLE, RAMP[SOLE]), (PAD, RAMP[PAD])):
        m = mat == k; o, gg = GAIN.get(k, (0, 1))
        if m.any(): out[m] = tone(ramp, L * gg + o, xx, yy)[m]
    out[(ia > 0.3)] = BR
np.save(sys.argv[2] + '.npy', out)
Image.fromarray(RGB[out]).save(sys.argv[2] + '.png')
Image.fromarray(RGB[out]).resize((W * 2, H * 2), Image.NEAREST).save(sys.argv[2] + '-2x.png')
print('colours', len(np.unique(out)))
