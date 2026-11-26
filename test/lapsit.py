# The lap sit (fan-service step 10, #86; grid doc 7m), in the browser: Saturday at Goodwill 80 her chat visit is a lap
# sit: the back of her head over the battle's left third, her on his lap in the webcam, ON YOUR LAP 1/3 · KEEP PLAYING
# in her window; ignored, SHE HAS THE MOUSE on the skill bar and "my turn!" by her head; a sweet answer gets it back.
# Screens test/shots/lapsit_*.png.
import asyncio, os
from playwright.async_api import async_playwright
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
QUIET = "g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.apt.lastVisitEnd=1e9; n.dog.next=1e9; n.tease.left=0; n.tease.bedAt=1e9; g.goodwill=80; 0"
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
        async def shot(name, wait=400, clip=None):
            await pg.wait_for_timeout(wait); path = f'test/shots/lapsit_{name}.png'; await pg.screenshot(path=path, clip=clip); shots.append((name, path))
        async def click_hit(act, arg):
            h = next((h for h in await pg.evaluate("()=>window.__lootnight.herHits") if h['act'] == act and h['arg'] == arg), None)
            if not h: return False
            await pg.mouse.click(h['x'] * 2 + h['w'], h['y'] * 2 + h['h']); await pg.wait_for_timeout(300); return True
        await pg.add_init_script('window.__lnDay = 5'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        await ev(QUIET); await go('portal'); await pg.wait_for_timeout(1500)
        await pg.mouse.move(900, 300)
        await go('dbgLapSit')
        for _ in range(60):
            if await ev("n.visit.stage === 'in'"): break
            await pg.wait_for_timeout(200)
        await pg.wait_for_timeout(300)
        check(await ev("n.visit.result === 'lap' && n.catches === 0"), 'Saturday, Goodwill 80: she sits on your lap, no check')
        await ev("g.timeScale = 0.05; 0"); await shot('1_lap', 500)
        await ev("n.floorLoot.push({ entry: { kind: 'item', item: { rarity: 'rare' } }, x: 0, y: 0 }); g.timeScale = 1; 0"); await pg.wait_for_timeout(150)
        check(await ev("n.lapSay && n.lapSay.text") == 'ooh, shiny', '"ooh, shiny" on a rare drop')
        await ev("n.floorLoot.pop(); g.timeScale = 0.05; 0"); await shot('2_shiny', 300)
        await ev("g.timeScale = 1; n.visit.chat.t = 0.05; 0"); await pg.wait_for_timeout(300)
        check(await ev("n.lapMouse > 0 && n.visit.chat.mouse"), 'ignored: she has the mouse')
        await ev("g.timeScale = 0.05; 0"); await shot('3_mouse', 300)
        check(await click_hit('lapSitAnswer', '0'), 'answer her')
        check(await ev("n.lapMouse === 0"), 'the mouse is yours again')
        await ev("g.timeScale = 1; 0")
        check(not errs, 'no page errors ' + ' | '.join(errs))
        await b.close()
    print('FAIL' if fails else 'PASS', len(shots), 'shots')
asyncio.run(main())
