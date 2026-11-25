# Caught (V7, #72; grid doc 7e): she peeks while the game is on screen, three times. Each catch plays the 0.8 s scare
# (flash, interlaced punch-in, shake) and holds her screen with the text window: the rung's face and what the catch
# cost. A click during the scare does nothing (and never reaches the game); a click after it, a key, or the hold running
# out puts it away. Screenshots test/shots/caught_*.png and a sheet test/shots/caught_sheet.png next to stills 031 to 033.
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
CA = "()=>window.__lnCaught()"
shots, fails = [], []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append((e.stack or str(e))[:500]))
        go = lambda a, arg=None: pg.evaluate(GO, [a, arg]); ev = lambda js: pg.evaluate(EV, js)
        async def shot(name):
            path = f'test/shots/caught_{name}.png'; await pg.screenshot(path=path); shots.append((name, path))
        async def catch():   # a peek while the RPG is on screen; she may only lean and look, so try again until she catches you
            for _ in range(8):
                await ev("n.visit.stage='idle'; n.visit.nextAt=1e9; n.apt.lastVisitEnd=-100; n.lastDemand=-100; n.monitor='rpg'; 0")
                await go('dbgVisit', 'peek'); await ev("n.visit.lean=false; 0")
                for _ in range(400):
                    c = await pg.evaluate(CA)
                    if c['t'] >= 0: return c
                    if await ev("n.visit.stage") == 'idle': break
                    await pg.wait_for_timeout(20)
            raise AssertionError('she never caught you')
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        await ev("g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','caught'); n.phoneScript=[]; n.friendsLeft=0; n.dog.nextAt=1e9; 0")
        await go('portal'); await pg.wait_for_timeout(800)
        await go('dbgSpeed', '3')

        # 1st: the scare, a click during it (ignored), then a click after it
        c = await catch(); await shot('1_scare')
        check(c['rung'] == 1 and c['line'].startswith('Caught 1 of 3 tonight') and 'Flow reset' in c['line'] and 'Guilt' in c['line'], f"1st: {c['line']}")
        await pg.mouse.click(640, 360)
        check((await pg.evaluate(CA))['t'] >= 0, 'a click during the scare does not put it away')
        await pg.wait_for_timeout(900); await shot('1_held')
        before = await ev("[g.screen, n.monitor, !!n.game]")
        await pg.mouse.click(1000, 400)
        check((await pg.evaluate(CA))['t'] < 0, 'a click after the scare puts it away')
        check(await ev("[g.screen, n.monitor, !!n.game]") == before, 'the click never reached the game')
        await pg.wait_for_timeout(5000)

        # 2nd: a key after the scare (Tab, the alt-tab key: it must not switch to Excel)
        c = await catch(); await pg.wait_for_timeout(1000); await shot('2_held')
        check(c['rung'] == 2 and c['line'].startswith('Caught 2 of 3') and 'Flow' not in c['line'], f"2nd: {c['line']}")
        await pg.keyboard.press('Tab'); await pg.wait_for_timeout(150)
        check((await pg.evaluate(CA))['t'] < 0, 'a key puts it away')
        check(not await ev("!!n.switching || n.monitor === 'excel'"), 'the key never reached the game (no alt-tab)')
        await pg.wait_for_timeout(5000)

        # 3rd: the hold runs out on its own; her monitor-off follows
        c = await catch(); await ev("g.timeScale=1; 0"); await pg.wait_for_timeout(1000); await shot('3_held')
        check(c['rung'] == 3 and 'monitor off for 8 s' in c['line'] and 'Flow reset' in c['line'], f"3rd: {c['line']}")
        await pg.wait_for_timeout(3400)
        check((await pg.evaluate(CA))['t'] < 0, 'the hold runs out (4 s)')
        check(await ev("n.monitorOff > 0"), 'the monitor is off after it')
        await shot('3_after')
        # a 4th catch keeps the 3rd face and says the count
        await ev("n.monitorOff=0; g.timeScale=3; 0"); await pg.wait_for_timeout(5000)
        c = await catch()
        check(c['rung'] == 3 and c['line'].startswith('Caught 4 ·'), f"4th: {c['line']}")
        check(not errs, 'errors: ' + ('none' if not errs else errs[0]))
        await b.close()
    # the sheet: each held screen next to its still (stills are 640 x 360: shown at 2x)
    pair = {'1_held': '031__her__caught__1st', '2_held': '032__her__caught__2nd', '3_held': '033__her__caught__3rd-and-later'}
    rows = [(n, Image.open(pth).convert('RGB')) for n, pth in shots]
    W = 1280 * 2 + 8; sheet = Image.new('RGB', (W, len(rows) * 728), (20, 16, 26))
    for i, (n, im) in enumerate(rows):
        sheet.paste(im, (0, i * 728))
        if n in pair: sheet.paste(Image.open(f'design/redesign/stills/{pair[n]}.png').convert('RGB').resize((1280, 720), Image.NEAREST), (1288, i * 728))
    sheet.save('test/shots/caught_sheet.png'); print('sheet', sheet.size, [n for n, _ in rows])
    print('PASS' if not fails else f'FAILED {len(fails)}')
asyncio.run(main())
