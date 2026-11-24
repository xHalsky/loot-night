# bundle shell.html + JS + fonts into rpg-screens.html
import base64, sys
FONTS = {'__SILKB__': 'silkscreen-latin-700-normal', '__TINY5__': 'tiny5-latin-400-normal', '__M5__': 'micro-5-latin-400-normal', '__JB9__': 'jacquarda-bastarda-9-latin-400-normal', '__PS2P__': 'press-start-2p-latin-400-normal', '__VT323__': 'vt323-latin-400-normal', '__J10__': 'jersey-10-latin-400-normal', '__DG16__': 'dotgothic16-latin-400-normal'}
ORDER = ['engine.js', 'kit.js', 'hud.js', 'dungeon.js', 'chars.js', 'enemies.js', 'screens.js', 'pathicons.js', 'paths.js', 'ranks.js', 'mono.js', 'townkit.js', 'town.js', 'townpanel.js', 'tree.js', 'desk.js', 'win98.js', 'q4.js', 'cans_img.js', 'ebreak.js', 'dog.js', 'cables.js', 'phone.js', 'her_img.js', 'her.js', 'caught_img.js', 'caught.js', 'cuddle.js', 'blueprint.js', 'morning_img.js', 'morning.js', 'small.js', 'lean.js', 'textlab.js']
def build(sep):
    s = open('shell.html').read()
    s = s.replace('__ENGINE__', sep.join(open(f).read() for f in ORDER))
    for k, f in FONTS.items(): s = s.replace(k, base64.b64encode(open(f'../fonts/{f}.woff2', 'rb').read()).decode())
    return s
if __name__ == '__main__':
    out = build('\n')
    if len(sys.argv) > 1 and sys.argv[1] == 'check':
        cur = open('rpg-screens.html').read()
        for sep in ['\n', '\n\n', '']:
            print(repr(sep), build(sep) == cur)
    else:
        open('rpg-screens.html', 'w').write(out); print('built', len(out))
