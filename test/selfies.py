# Selfies (fan-service step 5, #92), with the real mouse: Friday after midnight, her photo in her chat (the crop, the
# gold ring and its 60 s), tap it: the whole photo beside the phone (Goodwill +5 the first time); Esc closes it; one in
# her cat-ear hoodie (her gift). Screens test/shots/selfies_*.png.
import asyncio, os
from playwright.async_api import async_playwright
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
QUIET = "g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.apt.lastVisitEnd=1e9; n.dog.next=1e9; n.tease.left=0; n.tease.bedAt=1e9; n.clock = 24 * 60 + 41; g.timeScale=0.2; 0"
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
        async def shot(name, wait=400):
            await pg.wait_for_timeout(wait); path = f'test/shots/selfies_{name}.png'; await pg.screenshot(path=path); shots.append((name, path))
        async def hits(): return await pg.evaluate("()=>window.__lnPhone()")
        async def tap(act, arg=None):
            h = next((h for h in await hits() if h['act'] == act and (arg is None or h['arg'] == arg)), None)
            if not h: return False
            await pg.mouse.click(h['x'], h['y']); await pg.wait_for_timeout(300); return True
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        await ev(QUIET); await go('portal'); await pg.wait_for_timeout(900)
        await go('dbgSelfie', 'jersey'); await pg.wait_for_timeout(200)
        check(await ev("g.herThread.some(l => l.s === 'photo')"), 'her photo in her chat')
        ph = await pg.evaluate("()=>{const h=(window.__lootnight.deskHits||[]).find(h=>h.act==='phone'); return h ? [296 + (h.x + h.w / 2) * 2, (h.y + h.h / 2) * 2] : null}")
        await pg.mouse.move(*ph); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(500)
        await go('phApp', 'babe'); await pg.wait_for_timeout(500)
        await shot('1_chat')
        check(await tap('photoOpen'), 'tap the crop')
        check(await ev("!!n.photo && n.photo.first"), 'the photo opens beside the phone')
        await shot('2_open', 600)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        check(await ev("!n.photo && !g.paused"), 'Esc closes it')
        # in her gift
        await ev("n.wear.top = 'cathoodie'; 0"); await go('dbgSelfie', 'jersey'); await pg.wait_for_timeout(400)
        await go('phApp', 'babe'); await pg.wait_for_timeout(400)
        check(await tap('photoOpen', str(await ev("g.herThread.length - 1"))), 'the new one')
        check(await ev("n.photo && n.photo.key") == 'jersey:cathoodie', 'in her cat-ear hoodie')
        await shot('3_cat', 600)
        check(not errs, 'no page errors ' + ' | '.join(errs))
        await b.close()
    print('FAIL' if fails else 'PASS', len(shots), 'shots')
asyncio.run(main())
