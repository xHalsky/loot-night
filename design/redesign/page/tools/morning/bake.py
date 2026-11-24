# bake the composed CGs (indices into her 16 colours) into ../rpg/morning_img.js as indexed PNGs
import sys, base64, io, numpy as np
from PIL import Image
PC98 = ['#0a0814', '#331122', '#553366', '#aa88cc', '#5577aa', '#ee6688', '#d9a69c', '#ffddcc', '#eeddbb', '#bb9977', '#774433', '#f1a934', '#f2efdc', '#d23c5a', '#81c1c8', '#749970']
pal = [int(h[i:i+2], 16) for h in PC98 for i in (1, 3, 5)] + [0] * (768 - 48)
out = {}
for name in sys.argv[1:]:
    a = np.load(f'out/c-{name}.npy').astype(np.uint8); im = Image.fromarray(a, 'P'); im.putpalette(pal)
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); out[name] = 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
js = '// the morning CGs: 640 x 360, her PC-98 16 colours (indexed PNGs), one per way the night ended (morning/ pipeline)\nconst MORNING_SRC = {\n' + ',\n'.join(f'  {k}: "{v}"' for k, v in out.items()) + '\n};\n'
open('../rpg/morning_img.js', 'w').write(js); print({k: len(v) for k, v in out.items()})
