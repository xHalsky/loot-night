# Tooltips (V11, #76; grid doc 7k) in the look of where the pointer is, with the real mouse: the desk's glass on the
# Drink button, Windows 98's yellow on the taskbar's Sleep, her paper on the plan's corner in the webcam view, the RPG's
# leather card on a skill (battle area) and on the panel; an item in the bag keeps its DOM card. Screenshots
# test/shots/tips_*.png and a sheet test/shots/tips_sheet.png next to stills 072 to 074.
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
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
        tip_on = lambda: pg.evaluate("()=>document.getElementById('tipArea').style.display === 'block'")
        dom_on = lambda: pg.evaluate("()=>!!document.querySelector('#tooltipLayer .tooltip')")
        async def shot(name):
            await pg.wait_for_timeout(250); path = f'test/shots/tips_{name}.png'; await pg.screenshot(path=path); shots.append((name, path))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        await ev("g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.visit.nextAt=1e9; n.apt.lastVisitEnd=1e9; n.dog.nextAt=1e9; g.timeScale=0.2; 0")
        await go('portal'); await pg.wait_for_timeout(900)
        hit = lambda tip: pg.evaluate(f"()=>{{const h=(window.__lootnight.deskHits||[]).find(h=>h.tip==='{tip}'); return h ? [296 + (h.x + h.w / 2) * 2, (h.y + h.h / 2) * 2] : null}}")
        # the desk: the Drink button (glass, + and - lines, the count)
        xy = await hit('drink'); await pg.mouse.move(*xy); await shot('1_desk_drink')
        check(await tip_on() and not await dom_on(), 'the Drink button: the desk\'s glass')
        # the PC: the taskbar's Sleep (Windows 98)
        xy = await hit('sleep'); await pg.mouse.move(*xy); await shot('2_pc_sleep')
        check(await tip_on() and not await dom_on(), 'Sleep on the taskbar: Windows 98')
        # hers: the plan's corner in the webcam view
        await pg.mouse.move(14, 118); await shot('3_her_plan')
        check(await tip_on() and not await dom_on(), 'the plan\'s corner: her paper')
        # the RPG: a skill on the bar (the battle area draws the card)
        await pg.mouse.move(314 + (6 + 28 + 7) * 2, 16 + (206 + 15) * 2); await shot('4_rpg_skill')
        check(not await tip_on() and not await dom_on(), 'a skill: the RPG\'s card, in the battle area')
        # an item in the bag keeps its DOM card
        await ev("n.dropQueue=[]; n.phase='mapChoice'; 0"); await go('dbgEpic'); await pg.wait_for_timeout(600)   # between floors a drop goes to the bag
        bag = await pg.evaluate("()=>{const r=document.getElementById('spArea').getBoundingClientRect(); return [r.left, r.top, r.width / 140]}")
        found = False
        for yy in range(130, 200, 6):
            for xx in range(6, 134, 6):
                await pg.mouse.move(bag[0] + xx * bag[2], bag[1] + yy * bag[2]); await pg.wait_for_timeout(30)
                if await dom_on(): found = True; break
            if found: break
        await shot('5_item')
        check(found, 'an item in the bag: its DOM card')
        check(not errs, 'errors: ' + ('none' if not errs else errs[0]))
        await b.close()
    pair = {'1_desk_drink': '072__small-pieces__tooltips__desk-drink', '2_pc_sleep': '073__small-pieces__tooltips__windows-sleep', '3_her_plan': '074__small-pieces__tooltips__hers-the-plan'}
    rows = [(n, Image.open(pth).convert('RGB')) for n, pth in shots]
    sheet = Image.new('RGB', (1280 * 2 + 8, len(rows) * 728), (20, 16, 26))
    for i, (n, im) in enumerate(rows):
        sheet.paste(im, (0, i * 728))
        if n in pair: sheet.paste(Image.open(f'design/redesign/stills/{pair[n]}.png').convert('RGB').resize((1280, 720), Image.NEAREST), (1288, i * 728))
    sheet.save('test/shots/tips_sheet.png'); print('sheet', sheet.size, [n for n, _ in rows])
    print('PASS' if not fails else f'FAILED {len(fails)}')
asyncio.run(main())
