# The morning (V10, #75; grid doc 7h): four nights, ended four ways (logged off with her happy, dawn with her
# yellow, dawn with her red, unplugged), each through the results card to the renderer's morning: her CG, the caption,
# the summary with the night's numbers and the stars' rewards. The pink button, Enter and Esc start the next night.
# Screenshots test/shots/morning_*.png and a sheet test/shots/morning_sheet.png next to stills 040 to 043.
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
shots, fails = [], []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
# how each night ends: [name, the JS that ends it, how the next night is started]
ENDS = [
    ('green', "n.mood=12; n.clock=23*60+30; g.pendingListings=[{name:'Grave Ring',zl:45},{name:'Bone Charm',zl:20}]; 0", 'sleep', 'button'),
    ('yellow', "n.mood=55; n.clock=30*60; 0", None, 'Enter'),
    ('red', "n.mood=88; n.clock=30*60; 0", None, 'Escape'),
    ('unplugged', "n.mood=100; 0", None, 'button'),
]
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append((e.stack or str(e))[:500]))
        go = lambda a, arg=None: pg.evaluate(GO, [a, arg]); ev = lambda js: pg.evaluate(EV, js)
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        for k, (scene, js, act, nxt) in enumerate(ENDS):
            await ev("g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map'); n.phoneScript=[]; n.visit.nextAt=1e9; 0")
            await ev(js)
            if act: await go(act)
            for _ in range(60):
                if await ev("g.screen") == 'results': break
                await pg.wait_for_timeout(50)
            check(await ev("g.screen") == 'results', f'{scene}: the night ends ({await ev("g.results && g.results.ending")})')
            if scene == 'green': await ev("g.results.goals={deep:true, unseen:true, sweet:true, target:g.results.goals.target}; 0")   # every star, to see every reward
            await pg.click('[data-act=morning]'); await pg.wait_for_timeout(400)
            shown = await pg.evaluate("()=>document.getElementById('morningArea').style.display")
            check(await ev("g.screen") == 'morning' and shown == 'block', f'{scene}: the morning is the renderer\'s')
            path = f'test/shots/morning_{scene}.png'; await pg.screenshot(path=path); shots.append((scene, path))
            if nxt == 'button':
                await pg.mouse.move(2 * 540, 2 * 300); await pg.wait_for_timeout(50)
                hit = await pg.evaluate("()=>document.getElementById('morningArea').style.cursor")
                # find the pink button: scan the summary's column for the pointer cursor
                spot = None
                for yy in range(200, 352, 3):
                    await pg.mouse.move(2 * 536, 2 * yy)
                    if await pg.evaluate("()=>document.getElementById('morningArea').style.cursor") == 'pointer': spot = (2 * 536, 2 * yy); break
                check(spot is not None, f'{scene}: the pink button is there')
                if spot:
                    path = f'test/shots/morning_{scene}_hover.png'; await pg.screenshot(path=path, clip={'x': 870, 'y': spot[1] - 30, 'width': 400, 'height': 60}); shots.append((scene + '_hover', path))
                    await pg.mouse.click(*spot)
            else:
                await pg.keyboard.press(nxt)
            await pg.wait_for_timeout(400)
            check(await ev("g.screen") == 'night' and await pg.evaluate("()=>document.getElementById('morningArea').style.display") == 'none', f'{scene}: {nxt} starts the next night')
            await go('howtoClose')
        check(not errs, 'errors: ' + ('none' if not errs else errs[0]))
        await b.close()
    stills = {'green': '040__her__morning__green', 'yellow': '041__her__morning__yellow', 'red': '042__her__morning__red', 'unplugged': '043__her__morning__unplugged'}
    rows = [(n, Image.open(pth).convert('RGB')) for n, pth in shots if n in stills]
    sheet = Image.new('RGB', (1280 * 2 + 8, len(rows) * 728), (20, 16, 26))
    for i, (n, im) in enumerate(rows):
        sheet.paste(im, (0, i * 728)); sheet.paste(Image.open(f'design/redesign/stills/{stills[n]}.png').convert('RGB').resize((1280, 720), Image.NEAREST), (1288, i * 728))
    sheet.save('test/shots/morning_sheet.png'); print('sheet', sheet.size, [n for n, _ in rows])
    print('PASS' if not fails else f'FAILED {len(fails)}')
asyncio.run(main())
