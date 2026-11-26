# What she wears (fan-service 3 and 4, #90, #91), in the browser: her doorway figure in the set (blouse, sweater, your
# hoodie with slippers, yoga, the cream tee, pajama shorts) and her gifts (Goblin Fury tee, cat-ear hoodie, pajama set,
# knee socks, fluffy socks); the light gap under the door with her socks; the Shop's For her tab.
# Screens test/shots/wardrobe_*.png and a sheet test/shots/wardrobe_sheet.png.
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
QUIET = "g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.apt.lastVisitEnd=1e9; n.dog.next=1e9; n.tease.left=0; n.tease.bedAt=1e9; g.timeScale=0.001; 0"
CAM = {'x': 0, 'y': 30, 'width': 296, 'height': 500}
LOOKS = [('blouse', 'tv', None, None, 20 * 60 + 30), ('sweater', 'tv', None, None, 22 * 60), ('kitchen', 'tea', None, None, 22 * 60), ('tee', 'toilet', None, None, 22 * 60),
         ('pj', 'phone', None, None, 23 * 60 + 45), ('fury', 'tv', 'fury', None, 22 * 60), ('cat', 'tv', 'cathoodie', 'knee', 22 * 60), ('pjset', 'toilet', 'pjset', 'fluffy', 22 * 60)]
shots, fails = [], []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append((e.stack or str(e))[:400]))
        go = lambda a, arg=None: pg.evaluate(GO, [a, arg]); ev = lambda js: pg.evaluate(EV, js)
        await pg.add_init_script('window.__lnDay = 2'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        await ev(QUIET); await go('portal'); await pg.wait_for_timeout(900)
        await pg.mouse.move(900, 300)
        for name, frm, top, feet, clock in LOOKS:
            await ev(f"n.clock = {clock}; n.wear = {{ top: {repr(top) if top else 'null'}, feet: {repr(feet) if feet else 'null'} }}; n.visit.stage = 'in'; n.visit.kind = 'peek'; n.visit.from = '{frm}'; n.visit.result = 'pass'; n.visit.checked = true; n.visit.t = 99; n.visit.lean = false; n.monitor = 'excel'; 0")
            await pg.wait_for_timeout(400)
            path = f'test/shots/wardrobe_{name}.png'; await pg.screenshot(path=path, clip=CAM); shots.append((name, path))
        # the light gap: her socks under the door
        await ev("n.wear = { top: null, feet: 'fluffy' }; n.visit.stage = 'hall'; n.visit.feet = 'fluffy'; n.visit.t = 99; 0"); await pg.wait_for_timeout(400)
        path = 'test/shots/wardrobe_gap.png'; await pg.screenshot(path=path, clip=CAM); shots.append(('gap', path))
        await ev("n.visit.stage = 'idle'; 0")
        # the Shop's For her tab
        await ev("g.zl = 300; g.owned.push('fluffy'); 0")
        ph = await pg.evaluate("()=>{const h=(window.__lootnight.deskHits||[]).find(h=>h.act==='phone'); return h ? [296 + (h.x + h.w / 2) * 2, (h.y + h.h / 2) * 2] : null}")
        await pg.mouse.move(*ph); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(500)
        await go('phApp', 'shop'); await pg.wait_for_timeout(200); await go('shopTab', 'her'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='test/shots/wardrobe_shop.png', clip={'x': 296, 'y': 120, 'width': 400, 'height': 600}); shots.append(('shop', 'test/shots/wardrobe_shop.png'))
        check(await ev("n.phApp") == 'shop', 'the Shop, For her')
        check(not errs, 'no page errors ' + ' | '.join(errs))
        await b.close()
    ims = [Image.open(pth) for _, pth in shots[:-1]]
    sheet = Image.new('RGB', (sum(i.width for i in ims) + 4 * len(ims), ims[0].height), (30, 30, 30)); x = 0
    for im in ims: sheet.paste(im, (x, 0)); x += im.width + 4
    sheet.save('test/shots/wardrobe_sheet.png')
    print('FAIL' if fails else 'PASS', len(shots), 'shots')
asyncio.run(main())
