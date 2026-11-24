# python3 compose.py face -> out/face<face>.png (640 x 360, her PC-98 16 colours) and out/face<face>.idx (indices)
import sys, json, numpy as np
from PIL import Image
PC98 = ['#0a0814', '#331122', '#553366', '#aa88cc', '#5577aa', '#ee6688', '#d9a69c', '#ffddcc', '#eeddbb', '#bb9977', '#774433', '#f1a934', '#f2efdc', '#d23c5a', '#81c1c8', '#749970']
RGB = np.array([[int(h[i:i+2], 16) for i in (1, 3, 5)] for h in PC98], np.uint8)
V, PL, PU, LI, DE, RO, PI, SK, BE, TA, BR, GO, MO, CR, CY, MS = range(16)
RAMP = { 'bg': [V, PL, BR, TA, GO, BE], 'hairback': [V, PL, PU, DE, LI], 'hair': [V, PL, PU, DE, LI], 'body': [BR, PI, SK, MO], 'face': [BR, PI, SK, MO],
  'tee': [TA, BE, MO], 'sclera': [PI, MO], 'iris': [V, MS, CY], 'mouth': [V, PL, CR, RO], 'teeth': [MO], 'clip': [CR, RO, MO], 'glare': [CY, MO] }
EXACT = { 'ink-hairback': V, 'ink-body': BR, 'ink-tee': BR, 'ink-face': BR, 'ink-eyes': V, 'x-shine': MO, 'ink-mouth': PL, 'ink-nose': BR, 'ink-hair': V, 'ink-brows': V, 'ink-clip': CR, 'ink-glasses': V, 'x-moon': MO, 'x-hatch': CR, 'x-blush': PI, 'x-glint': MO, 'x-vein': CR, 'x-gloom': PU }
B4 = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 + 1 / 32
def tone_smooth(ramp, L, x, y):
    t = np.clip(L, 0, 1) * (len(ramp) - 1); b = np.floor(t).astype(int); f = t - b
    return np.array(ramp)[np.minimum(len(ramp) - 1, b + (f > B4[y & 3, x & 3]))]
def tone(ramp, L, x, y):
    t = np.clip(L, 0, 1) * (len(ramp) - 1); b = np.floor(t).astype(int); f = t - b
    chk = ((x + y) & 1)
    up = np.where(f > 0.68, 1, np.where(f > 0.36, chk, 0))
    return np.array(ramp)[np.minimum(len(ramp) - 1, b + up)]
face = sys.argv[1]
if face == '2': RAMP['bg'] = [V, V, PL, BR, TA, GO]      # the gloom: the hallway a step darker
if face == '3': RAMP['bg'] = [V, PL, BR, CR, RO, BE]     # the fury: red-lit behind her
J = json.load(open(f'out/f{face}-layers.json')); layers, smooth = J['layers'], set(J['smooth'])
H, W, S = 360, 640, 4
yy, xx = np.mgrid[0:H, 0:W]
out = np.zeros((H, W), np.uint8)
lay = np.zeros((H, W), np.int16)
for id in layers:
    im = np.asarray(Image.open(f'out/f{face}-{id}.png').convert('RGBA')).astype(np.float32) / 255
    a = im[..., 3].reshape(H, S, W, S).mean(axis=(1, 3))
    if a.max() == 0: continue
    if id in EXACT:
        m = a > 0.3
        out[m] = EXACT[id]; lay[m] = layers.index(id)
    elif id in RAMP and a.max() > 0:
        v = (im[..., 0] * im[..., 3]).reshape(H, S, W, S).sum(axis=(1, 3)) / np.maximum(1e-6, im[..., 3].reshape(H, S, W, S).sum(axis=(1, 3)))
        m = a > 0.5
        t = (tone_smooth if id in smooth else tone)(RAMP[id], v, xx, yy)
        out[m] = t[m]; lay[m] = layers.index(id)
# the hallway light behind her: a warm rim one pixel inside her outline, on the hair and the shoulders
bgi = layers.index('bg'); fig = lay != bgi
rimmable = np.isin(lay, [layers.index(n) for n in ('hair', 'hairback', 'tee', 'body') if n in layers])
for y in range(H):
    xs = np.where(fig[y])[0]
    if len(xs) < 4: continue
    for x in (xs[0] + 1, xs[-1] - 1):
        if rimmable[y, x]: out[y, x] = BR if lay[y, x] in [layers.index('hair'), layers.index('hairback')] else BE
for x in range(W):
    ys = np.where(fig[:, x])[0]
    if len(ys) and ys[0] < 120 and rimmable[ys[0] + 1, x]: out[ys[0] + 1, x] = BR
np.save(f'out/face{face}.npy', out)
Image.fromarray(RGB[out]).save(f'out/face{face}.png')
pim = Image.fromarray(out, 'P'); pim.putpalette([c for rgb in RGB.tolist() for c in rgb] + [0] * (768 - 48)); pim.save(f'out/face{face}-p.png', optimize=True)
Image.fromarray(RGB[out]).resize((W * 2, H * 2), Image.NEAREST).save(f'out/face{face}-2x.png')
print('face', face, 'colours used', len(np.unique(out)))
