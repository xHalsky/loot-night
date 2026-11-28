# The fallen (#154): every kind's pile of iron bones (the twelve figures and the Abbot), the fall (a figure crumbling
# into its pile, frame by frame) and the fade, read off the battle area's own canvas (334 x 232, x3) while paused, so
# each still is exact. Then a real kill in a real fight. Writes test/shots/corpses_*.png. Run after `npm run build`.
import asyncio, base64, io, os
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
KIND = {'hollow': ('skeleton', None), 'guardian': ('shelter', None), 'revenant': ('collector', None), 'penitent': ('ghoul', None), 'confessor': ('auditor', None),
        'cherub': ('junk', None), 'ironwing': ('bat', 'ironwing'), 'vigil': ('bat', 'vigil'), 'gravedigger': ('brute', None),
        'gaoler': ('bailiff', None), 'bellringer': ('shark', None), 'inquisitor': ('landlord', None), 'abbot': ('troll', None)}
SLOT_X = [186, 226, 266, 205, 245, 300]
fails = []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
def corpse(kind, x, t, slot=0, uid=1):
    d, look = KIND[kind]; boss = kind in ('gaoler', 'bellringer', 'inquisitor', 'abbot')
    if boss: slot = 5
    c = {'uid': uid, 'defId': d, 'slot': slot, 'boss': boss, 'dx': SLOT_X[slot] - x, 't': t}
    if look: c['look'] = look
    if kind == 'cherub': c['body'] = 0
    return c
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        ev = lambda js: pg.evaluate(EV, js)
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await ev("g.realLifeOff=true; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map'); 0")
        await pg.evaluate(GO, 'portal'); await pg.wait_for_timeout(600)
        async def grab(name, corpses, label=None):
            import json
            await ev(f"n.corpses = {json.dumps(corpses)}; n.pack = null; n.enemies = []; n.phase = 'battle'; g.paused = true; 0"); await pg.wait_for_timeout(120)   # the fight's light
            url = await pg.evaluate("()=>document.getElementById('rpgArea').toDataURL()")
            im = Image.open(io.BytesIO(base64.b64decode(url.split(',')[1]))).convert('RGB')
            im = im.resize((im.width * 3, im.height * 3), Image.NEAREST)
            await ev("n.phase = 'walk'; g.paused = false; 0")
            im.save(f'test/shots/corpses_{name}.png'); return im
        # every pile, landed (its embers still going out), then gone
        rows = [['hollow', 'guardian'], ['revenant', 'penitent'], ['confessor', 'cherub'], ['ironwing', 'vigil'], ['gravedigger'], ['abbot'], ['gaoler'], ['bellringer'], ['inquisitor']]
        ims = []
        for r, kinds in enumerate(rows):
            xs = [200, 285] if len(kinds) == 2 else [245]
            cs = [corpse(k, xs[i], 1.6, slot=i % 3, uid=11 + i + r * 7) for i, k in enumerate(kinds)]
            im = await grab(f'piles_{r}', cs); ims.append((kinds, im))
        n_now = await ev("(n.corpses||[]).length")
        await ev("n.corpses = [ {uid: 3, defId: 'skeleton', slot: 0, boss: false, dx: 0, t: 99} ]; 0"); await pg.wait_for_timeout(300)
        check(await ev("(n.corpses||[]).length") == 0, 'a corpse past CORPSE_SEC + its fade is gone')
        # the fall, frame by frame: a Hollow, an Ironwing (from the air) and the Gaoler
        seq = []
        for kind, x in (('hollow', 186), ('ironwing', 186), ('gaoler', 260)):
            fr = []
            for t in (0.0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 2.0, 9.6):
                fr.append(await grab(f'fall_{kind}_{t}', [corpse(kind, x, t, uid=5)]))
            seq.append((kind, fr))
        # a real kill: into a fight, the front enemy to 0 HP, the fall and the pile in place
        await ev("g.paused = false; n.corpses = []; 0")
        for _ in range(120):
            if await ev("n.phase") == 'battle': break
            await pg.wait_for_timeout(100)
        check(await ev("n.phase") == 'battle', 'a fight')
        await ev("const e = n.enemies.find(e => e.hp > 0); e.hp = 0; 0"); await pg.wait_for_timeout(300)
        check(await ev("(n.corpses||[]).length") >= 1, 'a kill lays a corpse')
        url = await pg.evaluate("()=>document.getElementById('rpgArea').toDataURL()")
        Image.open(io.BytesIO(base64.b64decode(url.split(',')[1]))).convert('RGB').resize((1002, 696), Image.NEAREST).save('test/shots/corpses_kill.png')
        await pg.wait_for_timeout(1200)
        url = await pg.evaluate("()=>document.getElementById('rpgArea').toDataURL()")
        Image.open(io.BytesIO(base64.b64decode(url.split(',')[1]))).convert('RGB').resize((1002, 696), Image.NEAREST).save('test/shots/corpses_kill_pile.png')
        check(not errs, 'no page errors ' + str(errs[:2]))
        await b.close()
    # the sheets
    W0, H0, X0 = 560, 260, 1002 - 560
    sheet = Image.new('RGB', (W0 * 3 + 16, (H0 + 24) * 3), (20, 16, 26)); d = ImageDraw.Draw(sheet)
    for k, (kinds, im) in enumerate(ims):
        x, y = (k % 3) * (W0 + 8), (k // 3) * (H0 + 24); d.text((x + 6, y + 6), ' · '.join(kinds), fill=(242, 233, 216)); sheet.paste(im.crop((X0, 696 - H0 - 36 - 60, 1002, 696 - 36 - 60)), (x, y + 24))
    sheet.save('test/shots/corpses_sheet.png')
    cw = 260
    fs = Image.new('RGB', (cw * 9, 300 * len(seq)), (20, 16, 26))
    for r, (kind, fr) in enumerate(seq):
        for c, im in enumerate(fr):
            x0 = {'hollow': 186, 'ironwing': 186, 'gaoler': 260}[kind] * 3 - cw // 2
            fs.paste(im.crop((x0, 696 - 300 - 36, x0 + cw, 696 - 36)), (c * cw, r * 300))
    fs.save('test/shots/corpses_fall.png')
    print(f'{len(fails)} failed' if fails else 'all passed')
asyncio.run(main())
