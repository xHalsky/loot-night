# Halsky Labs mark: Paweł's logo (a black-and-white stipple sticker, RGBA PNG) to the launch's palette mark.
# python3 halsky_mark.py [source.png] [height]  ->  halsky_mark.js (HALSKY_MARK, one string per row)
#   '.' outside the sticker   'r' the white sticker rim (moon)   '0' inside, dark (void)
#   '1'..'9' inside, lit (moon); the digit is how bright the face is there, so the face can develop brightest first
# Two tones only (void and moon), Atkinson-dithered so it keeps the source's stipple. Needs numpy, scipy, Pillow.
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

SRC = sys.argv[1] if len(sys.argv) > 1 else 'halsky-labs-logo-source.png'
HT = int(sys.argv[2]) if len(sys.argv) > 2 else 88
GAMMA, LO, HI, BLUR = 1.2, 3, 97, 0.55


def build(src=SRC, h=HT):
    im = Image.open(src).convert('RGBA')
    im = im.crop(im.getbbox())
    a = np.asarray(im).astype(float) / 255
    inside = a[..., 3] > 0.5
    g = a[..., 0] * 0.3 + a[..., 1] * 0.59 + a[..., 2] * 0.11
    # the rim: white joined to the outside through white, near the edge
    d = ndi.distance_transform_edt(inside)
    white = (g > 0.5) & inside
    lab, _ = ndi.label(white & (d < 90))
    keep = np.unique(lab[(d < 3) & white])
    rim = ndi.binary_closing(np.isin(lab, keep[keep > 0]), iterations=3) & inside
    face = inside & ~rim
    s = im.height / h
    w = round(im.width / s)

    def blur(x):
        return np.asarray(Image.fromarray((x * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(s * BLUR))).astype(float) / 255

    def down(x):
        return np.asarray(Image.fromarray((np.clip(x, 0, 1) * 255).astype(np.uint8)).resize((w, h), Image.BOX)).astype(float) / 255

    G, F = down(blur(g * face)), down(blur(face.astype(float)))
    m = down(inside.astype(float)) > 0.5
    rimT = m & (down(rim.astype(float)) > 0.45)
    faceT = m & ~rimT
    gv = np.where(F > 0.01, G / np.maximum(F, 1e-3), 0)
    core = ndi.binary_erosion(faceT, iterations=1)
    a0, b0 = np.percentile(gv[core], [LO, HI])
    v = np.clip((gv - a0) / (b0 - a0), 0, 1) ** GAMMA
    v[~faceT] = 0
    # Atkinson error diffusion inside the face only
    e, on = v.copy(), np.zeros_like(m)
    H, W = m.shape
    for y in range(H):
        for x in range(W):
            if not faceT[y, x]:
                continue
            o = e[y, x] > 0.5
            on[y, x] = o
            err = (e[y, x] - o) / 8
            for dx, dy in ((1, 0), (2, 0), (-1, 1), (0, 1), (1, 1), (0, 2)):
                X, Y = x + dx, y + dy
                if 0 <= X < W and 0 <= Y < H and faceT[Y, X]:
                    e[Y, X] += err
    rows = []
    for y in range(H):
        r = ''
        for x in range(W):
            if not m[y, x]:
                r += '.'
            elif rimT[y, x]:
                r += 'r'
            elif on[y, x]:
                r += str(max(1, min(9, 1 + int(v[y, x] * 9))))
            else:
                r += '0'
        rows.append(r)
    # trim empty columns and rows
    cols = [x for x in range(W) if any(r[x] != '.' for r in rows)]
    rows = [r[cols[0]:cols[-1] + 1] for r in rows if r.strip('.')]
    return rows


if __name__ == '__main__':
    rows = build()
    js = ('// Halsky Labs mark (tools: halsky_mark.py from Paweł\'s logo, design/v2/assets/halsky-labs-logo-source.png).\n'
          f'// {len(rows[0])} x {len(rows)}: . outside, r rim (moon), 0 dark (void), 1-9 lit (moon), the digit its brightness.\n'
          'const HALSKY_MARK = [\n' + ',\n'.join(f"  '{r}'" for r in rows) + '];\n')
    open('halsky_mark.js', 'w').write(js)
    print(len(rows[0]), 'x', len(rows))
