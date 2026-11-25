# The small pieces (V11, #76; grid doc 7k), the full-frame and right-screen ones, with the real mouse and keys:
# How to hide at the night's start (Got it), pause (Esc, Resume, How to hide from it), the microsleep (closing, shut,
# a click wakes you), away from the PC (making her tea; her "Stay for one episode?"; the close box comes back early)
# and the Goblin Fuel inspect window (once, when you first get tired; G drinks; never again). Screenshots
# test/shots/small_*.png and a sheet test/shots/small_sheet.png next to stills 062 to 065, 075 and 076.
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
shots, fails = [], []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
disp = lambda pg, i: pg.evaluate(f"()=>document.getElementById('{i}').style.display")
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append((e.stack or str(e))[:500]))
        go = lambda a, arg=None: pg.evaluate(GO, [a, arg]); ev = lambda js: pg.evaluate(EV, js)
        async def shot(name, wait=200):
            await pg.wait_for_timeout(wait); path = f'test/shots/small_{name}.png'; await pg.screenshot(path=path); shots.append((name, path))
        async def find(cid, cw, ch, want='pointer', x0=0, x1=None, y0=0, y1=None, step=4):   # a button by the cursor it sets
            x1 = x1 or cw; y1 = y1 or ch
            box = await pg.evaluate(f"()=>{{const r=document.getElementById('{cid}').getBoundingClientRect(); return [r.left, r.top, r.width / {cw}]}}")
            for y in range(y0, y1, step):
                for x in range(x0, x1, step):
                    await pg.mouse.move(box[0] + x * box[2], box[1] + y * box[2])
                    if await pg.evaluate(f"()=>document.getElementById('{cid}').style.cursor") == want: return (box[0] + x * box[2], box[1] + y * box[2])
            return None
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(600)

        # How to hide at the start of the night: the night waits; Got it
        check(await ev("g.howto") and await disp(pg, 'modalArea') == 'block', 'How to hide opens the first night')
        await shot('1_howto', 300)
        btn = await find('modalArea', 640, 360, x0=250, x1=390, y0=250, y1=330)
        check(btn is not None, 'its Got it button'); await pg.mouse.click(*btn); await pg.wait_for_timeout(200)
        check(not await ev("g.howto") and await disp(pg, 'modalArea') == 'none', 'Got it closes it')
        await ev("g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog'); n.phoneScript=[]; n.friendsLeft=0; n.visit.nextAt=1e9; n.apt.lastVisitEnd=1e9; n.dog.nextAt=1e9; 0")
        await go('portal'); await pg.wait_for_timeout(800)

        # pause: Esc, the card, Resume; Esc again, How to hide from it, Esc closes that
        await pg.keyboard.press('Escape'); await shot('2_pause')
        check(await ev("g.paused") and await disp(pg, 'modalArea') == 'block', 'Esc pauses: the frame goes black')
        btn = await find('modalArea', 640, 360, x0=210, x1=320, y0=180, y1=240)
        check(btn is not None, 'Resume'); await pg.mouse.click(*btn); await pg.wait_for_timeout(200)
        check(not await ev("g.paused"), 'Resume resumes')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        btn = await find('modalArea', 640, 360, x0=330, x1=440, y0=180, y1=240)
        check(btn is not None, 'How to hide on the pause card'); await pg.mouse.click(*btn); await pg.wait_for_timeout(300)
        check(await ev("g.howto && !g.paused"), 'How to hide from pause')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        check(not await ev("g.howto"), 'Esc closes How to hide')

        # the microsleep: closing, shut, a click wakes you
        await ev("n.blink={state:'closing', lid:0.55, nextIn:999}; g.timeScale=0; 0"); await shot('3_micro_closing', 300)
        await ev("n.blink={state:'closed', lid:1, nextIn:999, shut:30}; 0"); await shot('4_micro_shut', 300)
        check(await disp(pg, 'microArea') == 'block', 'the lids are drawn')
        await ev("g.timeScale=1; 0"); await pg.mouse.click(700, 300); await pg.wait_for_timeout(300)
        check(await ev("n.blink.state") == 'open' and await disp(pg, 'microArea') == 'none', 'a click wakes you')

        # away from the PC: making her tea; her question; back early with the close box
        await ev("n.apt.activity='tv'; n.apt.room='living'; 0"); await go('pre', 'tea'); await pg.wait_for_timeout(400)
        check(await ev("!!n.pre && n.pre.away") and await disp(pg, 'rsSmall') == 'block', 'making her tea: away from the PC')
        await shot('5_away')
        await ev("n.pre.stage='ask'; n.pre.t=8; 0"); await shot('6_away_ask', 300)
        btn = await find('rsSmall', 492, 360, x0=250, x1=330, y0=126, y1=144, step=3)
        check(btn is not None, 'her question has Back to the PC')
        if btn: await pg.mouse.click(*btn); await pg.wait_for_timeout(300)
        check(not await ev("!!n.pre"), 'Back to the PC ends it')
        await go('pre', 'tea'); await pg.wait_for_timeout(400)
        btn = await find('rsSmall', 492, 360, x0=318, x1=336, y0=98, y1=112, step=2)
        if btn: await pg.mouse.click(*btn); await pg.wait_for_timeout(300)
        check(btn is not None and not await ev("!!n.pre"), 'the close box: back early')

        # the Goblin Fuel inspect window: once, the first time you get tired; G drinks
        await pg.wait_for_timeout(16000)   # the one-demand gap after the tea
        await ev("n.tired=34; 0"); await pg.wait_for_timeout(600)
        check(await disp(pg, 'rsSmall') == 'block', 'tired: the inspect window opens by itself'); await shot('7_inspect')
        await pg.keyboard.press('g'); await pg.wait_for_timeout(400)
        check(await ev("n.game && n.game.kind") == 'monster', 'G drinks (the energy break)')
        await go('cancelMonster'); await pg.wait_for_timeout(600)
        await pg.keyboard.press('g'); await pg.wait_for_timeout(400)
        check(await ev("n.game && n.game.kind") == 'monster' and await disp(pg, 'rsSmall') == 'none', 'never again: G goes straight to the break')
        check(not errs, 'errors: ' + ('none' if not errs else errs[0]))
        await b.close()
    pair = {'1_howto': '063__small-pieces__windows__how-to-hide', '2_pause': '064__small-pieces__windows__pause', '3_micro_closing': '075__small-pieces__microsleep__closing',
            '4_micro_shut': '076__small-pieces__microsleep__shut', '5_away': '065__small-pieces__windows__away-charging', '7_inspect': '062__small-pieces__windows__goblin-fuel'}
    rows = [(n, Image.open(pth).convert('RGB')) for n, pth in shots]
    sheet = Image.new('RGB', (1280 * 2 + 8, len(rows) * 728), (20, 16, 26))
    for i, (n, im) in enumerate(rows):
        sheet.paste(im, (0, i * 728))
        if n in pair: sheet.paste(Image.open(f'design/redesign/stills/{pair[n]}.png').convert('RGB').resize((1280, 720), Image.NEAREST), (1288, i * 728))
    sheet.save('test/shots/small_sheet.png'); print('sheet', sheet.size, [n for n, _ in rows])
    print('PASS' if not fails else f'FAILED {len(fails)}')
asyncio.run(main())
