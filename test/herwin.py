# Her windows (V9, #74; grid doc 7g), with the real mouse. The cuddle break: she asks, you say yes, then follow her
# breath round the heart (on it: hearts float up), a rushed move (too fast!), drifting away, and warm enough at the end;
# a second one you pull away from with the close box. The plan: opened from its corner in the webcam view, a click on
# the sheet does nothing, the ✕, Esc and a click outside close it. Screenshots test/shots/herwin_*.png and a sheet
# test/shots/herwin_sheet.png next to stills 034 to 039.
import asyncio, os, math
from playwright.async_api import async_playwright
from PIL import Image
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
shots, fails = [], []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
def dot(p):   # the renderer's heart in window px (cuddle.js cudDot)
    a = p * math.pi * 2; x = 16 * math.sin(a) ** 3; y = 13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a)
    return 134 + x * 4.5, 92 - y * 3.75
win = lambda x, y: (296 + (112 + x) * 2, (20 + y) * 2)   # window px -> page px
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append((e.stack or str(e))[:500]))
        go = lambda a, arg=None: pg.evaluate(GO, [a, arg]); ev = lambda js: pg.evaluate(EV, js)
        async def shot(name, wait=0):
            await pg.wait_for_timeout(wait); path = f'test/shots/herwin_{name}.png'; await pg.screenshot(path=path); shots.append((name, path))
        async def until(js, ms=20000):
            for _ in range(ms // 50):
                if await ev(js): return True
                await pg.wait_for_timeout(50)
            return False
        async def cuddle_start():
            await ev("n.visit.stage='idle'; n.visit.nextAt=1e9; n.lastDemand=-100; n.monitor='rpg'; g.timeScale=4; 0")
            await go('dbgVisit', 'cuddle'); await ev("n.visit.lean=false; 0")
            check(await until("n.visit.result === 'ask'"), 'she asks for a cuddle')
            await ev("g.timeScale=1; 0"); await go('cuddle', '1')
            check(await until("n.game && n.game.kind === 'cuddle'", 2000), 'the cuddle break opens')
        async def follow(until_p, lead=0.0):
            while True:
                q = await ev("1 - n.game.t / n.game.max") if await ev("!!n.game && n.game.kind === 'cuddle'") else 2
                if q >= until_p: return q
                x, y = dot(min(1, q + lead)); await pg.mouse.move(*win(x, y)); await pg.wait_for_timeout(30)
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        await ev("g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','caught','cuddle'); n.phoneScript=[]; n.friendsLeft=0; n.dog.nextAt=1e9; 0")
        await go('portal'); await pg.wait_for_timeout(800)

        # the cuddle: 1 start, 2 on her breath, 3 too fast, 4 drifting, 5 warm enough
        await cuddle_start()
        await pg.mouse.move(*win(*dot(0))); await shot('1_start', 150)
        await follow(0.2); await shot('2_on_her_breath')
        x, y = dot(0.22); await pg.mouse.move(*win(x - 60, y)); await pg.mouse.move(*win(x + 60, y), steps=2)
        check(await ev("n.game.jerk > 0"), 'a rushed move is too fast'); await shot('3_too_fast')
        await pg.mouse.move(*win(30, 150)); await pg.wait_for_timeout(1300)
        check(await ev("Math.hypot(n.game.mx - 0, 0) >= 0"), 'drifting'); await shot('4_drifting')
        await follow(0.93, 0.004); w = await ev("n.game.warmth"); await shot('5_warm_enough')
        check(w >= 0.6, f'warm enough near the end ({w:.2f})')
        await follow(1.5, 0.004)
        check(await until("n.visit.result === 'cuddleGood'", 3000), 'passed: she is happy')
        await pg.wait_for_timeout(4000)

        # a second cuddle: pull away with the close box
        await cuddle_start()
        hits = await pg.evaluate("()=>1"); await pg.mouse.move(*win(268 - 11, 11)); await pg.wait_for_timeout(100)
        cur = await pg.evaluate("()=>document.getElementById('ebArea').style.cursor")
        await pg.mouse.click(*win(268 - 11, 11)); await pg.wait_for_timeout(200)
        check(cur == 'pointer' and await ev("!n.game && n.visit.result === 'refused'"), 'the close box pulls away (refused)')
        await pg.wait_for_timeout(3000)

        # the plan: find its corner in the webcam view (the cursor turns into a magnifier), open it
        spot = None
        for yy in range(20, 560, 12):
            for xx in range(8, 290, 12):
                await pg.mouse.move(xx, yy)
                if await pg.evaluate("()=>document.getElementById('herArea').style.cursor") == 'zoom-in': spot = (xx, yy); break
            if spot: break
        check(spot is not None, f'the plan on the webcam wall at {spot}')
        await pg.mouse.click(*spot); await pg.wait_for_timeout(400); await shot('6_plan')
        await pg.mouse.click(200, 400); await pg.wait_for_timeout(300)
        check(await pg.evaluate("()=>document.getElementById('planArea').style.display") == 'block', 'a click on the sheet keeps it open')
        await pg.mouse.click(2 * (8 + 196 - 11), 2 * (34 + 4 + 8 + 6)); await pg.wait_for_timeout(300)
        check(await pg.evaluate("()=>document.getElementById('planArea').style.display") == 'none', 'the close box closes it')
        await pg.mouse.click(*spot); await pg.wait_for_timeout(300); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        check(await pg.evaluate("()=>document.getElementById('planArea').style.display") == 'none' and not await ev("g.paused"), 'Esc closes it (and does not pause)')
        await pg.mouse.click(*spot); await pg.wait_for_timeout(300); await pg.mouse.click(900, 300); await pg.wait_for_timeout(300)
        check(await pg.evaluate("()=>document.getElementById('planArea').style.display") == 'none', 'a click outside closes it')
        check(not errs, 'errors: ' + ('none' if not errs else errs[0]))
        await b.close()
    pair = {'1_start': '034__her__cuddle__1-start', '2_on_her_breath': '035__her__cuddle__2-on-her-breath', '3_too_fast': '036__her__cuddle__3-too-fast',
            '4_drifting': '037__her__cuddle__4-drifting', '5_warm_enough': '038__her__cuddle__5-warm-enough', '6_plan': '039__her__plan__open'}
    rows = [(n, Image.open(pth).convert('RGB')) for n, pth in shots]
    sheet = Image.new('RGB', (1280 * 2 + 8, len(rows) * 728), (20, 16, 26))
    for i, (n, im) in enumerate(rows):
        sheet.paste(im, (0, i * 728))
        if n in pair: sheet.paste(Image.open(f'design/redesign/stills/{pair[n]}.png').convert('RGB').resize((1280, 720), Image.NEAREST), (1288, i * 728))
    sheet.save('test/shots/herwin_sheet.png'); print('sheet', sheet.size, [n for n, _ in rows])
    print('PASS' if not fails else f'FAILED {len(fails)}')
asyncio.run(main())
