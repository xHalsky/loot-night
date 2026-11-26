# The bath and her requests (fan-service steps 8 and 13, #93, #88), with the real mouse: Saturday, her bath (MUSIC in
# the last-heard line); "Babe, bring my wine?" in her window with Bring it to her; the away card says why (Bringing
# her wine, the empty chair); her thank-you; "Babe, towel!" ignored: she comes to your door in her towel, dripping.
# Screens test/shots/asks_*.png.
import asyncio, os
from playwright.async_api import async_playwright
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
QUIET = "g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.apt.lastVisitEnd=1e9; n.dog.next=1e9; n.tease.left=0; n.tease.bedAt=1e9; 0"
LP = {'x': 0, 'y': 0, 'width': 296, 'height': 720}
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
        async def shot(name, wait=400, clip=LP):
            await pg.wait_for_timeout(wait); path = f'test/shots/asks_{name}.png'; await pg.screenshot(path=path, clip=clip); shots.append((name, path))
        async def click_hit(act):
            h = next((h for h in await pg.evaluate("()=>window.__lootnight.herHits") if h['act'] == act), None)
            if not h: return False
            await pg.mouse.click(h['x'] * 2 + h['w'], h['y'] * 2 + h['h']); await pg.wait_for_timeout(300); return True
        await pg.add_init_script('window.__lnDay = 5'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        await ev(QUIET); await go('portal'); await pg.wait_for_timeout(900)
        await pg.mouse.move(800, 300)
        # --- her bath ---
        await go('dbgBath'); await ev("n.apt.towelAsk=false; n.apt.wineAt=-1; 0"); await pg.wait_for_timeout(2500)
        check(await ev("n.apt.activity === 'bath' && n.apt.moving <= 0"), 'Saturday: her bath')
        await ev("n.apt.heardAt = n.threat; n.apt.heard = 'bathroom'; n.apt.heardWhat = 'MUSIC'; 0"); await shot('1_bath')
        # --- the wine ---
        await go('dbgAsk', 'wine'); await pg.wait_for_timeout(300)
        check(await ev("n.herAsk && n.herAsk.kind === 'wine'"), '"Babe, bring my wine?"')
        await shot('2_wine')
        g0 = await ev("g.goodwill")
        check(await click_hit('herAsk'), 'Bring it to her')
        check(await ev("n.pre && n.pre.id === 'wine' && n.pre.away"), 'away from the PC')
        await shot('3_away', 600, None)
        await ev("n.pre.t = 0.05; 0"); await pg.wait_for_timeout(500)
        check(await ev("!n.pre && n.herThanks && g.goodwill") and await ev("g.goodwill") >= g0 + 15, 'back: her thank-you, Goodwill +15')
        await shot('4_thanks', 100)
        await pg.wait_for_timeout(4500)
        # --- the towel, ignored ---
        await ev("g.timeScale = 1; 0"); await go('dbgAsk', 'towel'); await pg.wait_for_timeout(300)
        check(await ev("n.herAsk && n.herAsk.kind === 'towel'"), '"Babe, towel!"')
        await shot('5_towel', 100)
        await ev("n.herAsk.t = 0.05; n.monitor"); await pg.wait_for_timeout(400)
        check(await ev("n.visit.ask === 'towel' && n.visit.stage !== 'idle'"), 'ignored: she comes to get one herself')
        await ev("n.monitor = 'excel'; 0")
        for _ in range(40):
            if await ev("n.visit.stage === 'in'"): break
            await pg.wait_for_timeout(250)
        await ev("g.timeScale = 0.05; 0"); await shot('6_dripping', 400)
        check(await ev("n.catches") == 0, 'Excel up: no catch')
        check(not errs, 'no page errors ' + ' | '.join(errs))
        await b.close()
    print('FAIL' if fails else 'PASS', len(shots), 'shots')
asyncio.run(main())
