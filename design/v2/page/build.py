import base64
FONTS = {'__SILKB__': 'silkscreen-latin-700-normal', '__TINY5__': 'tiny5-latin-400-normal', '__M5__': 'micro-5-latin-400-normal', '__JB9__': 'jacquarda-bastarda-9-latin-400-normal', '__CZD__': 'cinzel-decorative-latin-900-normal', '__CZ__': 'cinzel-latin-900-normal', '__SORA__': 'sora-latin-800-normal', '__FRED__': 'fredoka-latin-700-normal'}
ORDER = ['engine.js', 'kit.js', 'hud.js', 'dungeon.js', 'chars.js', 'enemies.js', 'screens.js', 'townkit.js', 'town.js', 'desk.js', 'win98.js', 'q4.js', 'cans_img.js', 'ebreak.js', 'dog.js', 'cables.js', 'phone.js', 'aoj.js', 'foes.js', 'logos.js']
s = open('shell.html').read().replace('__ENGINE__', '\n'.join(open(f).read() for f in ORDER))
for k, f in FONTS.items(): s = s.replace(k, base64.b64encode(open(f'../fonts/{f}.woff2', 'rb').read()).decode())
open('../out/index.html', 'w').write(s); print('built', len(s))
