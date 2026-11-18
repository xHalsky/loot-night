# Tooltip pass (#43): hover each kind of tooltip and screenshot it (test/tip_*.png, sheet test/tips_sheet.png).
# Every tooltip should carry only what you need to decide; the script also prints each one's text length.
import asyncio
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def main():
    shots = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(400)
        await act(pg, '[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g, n=g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup');}")
        await act(pg, '[data-act=portal]'); await pg.wait_for_timeout(300)
        # an identified item in the bag, a map, gear on Pawel
        await pg.keyboard.press('F1'); await pg.wait_for_timeout(100)
        await pg.evaluate("()=>{window.__lootnight.S.g.night.phase='mapChoice'}")
        for a in ('dbgEpic', 'dbgMap'): await act(pg, f'[data-act={a}]')
        await pg.keyboard.press('F1'); await pg.wait_for_timeout(500)
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; g.bag.forEach(e=>{if(e.kind==='item') e.item.identified=true}); g.timeScale=0;}")
        async def hover(name, sel, idx=0):
            els = await pg.query_selector_all(sel)
            if len(els) <= idx: print('MISSING', name, sel); return
            bb = await els[idx].bounding_box()
            await pg.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); await pg.wait_for_timeout(350)
            t = await pg.query_selector('.tooltip')
            if not t: print('NO TOOLTIP', name); return
            tb = await t.bounding_box(); txt = (await t.inner_text()).replace('\n', ' / ')
            print(f'{name:9} {int(tb["width"])}x{int(tb["height"])}  {txt}')
            path = f'test/tip_{name}.png'; await pg.screenshot(path=path, clip={'x': tb['x'] - 4, 'y': tb['y'] - 4, 'width': tb['width'] + 8, 'height': tb['height'] + 8}); shots.append((name, path))
        await hover('hero', '[data-tip^="hero:"]')
        await pg.evaluate("()=>{window.__lootnight.S.g.night.phase='walk'}"); await pg.wait_for_timeout(300)
        await hover('skill', '[data-tip^="skill:"]', 1)
        await hover('item', '[data-item^="bag:"]', 0)
        await hover('map', '[data-item^="bag:"]', 1)
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; const e=g.bag.find(x=>x.kind==='item'); if(e){g.heroes[0].gear[e.item.slot]=e.item;}}"); await pg.wait_for_timeout(300)
        await hover('gear', '[data-item^="gear:"]', 0)
        await act(pg, '[data-act=portal]') if await pg.evaluate("()=>!!document.querySelector('[data-act=portal]')") else None
        await hover('towel', '[data-tip="pre:towel"]')
        await hover('tea', '[data-tip="pre:tea"]')
        print('ERRORS', errs); await b.close()
    W = max(Image.open(p).width for _, p in shots) + 10
    sheet = Image.new('RGB', (W * 2, sum(Image.open(p).height + 22 for _, p in shots[::2]) + 30), '#111'); d = ImageDraw.Draw(sheet)
    y = [0, 0]
    for i, (name, path) in enumerate(shots):
        im = Image.open(path); c = i % 2
        d.text((c * W + 4, y[c] + 4), name, fill='#fff'); sheet.paste(im, (c * W, y[c] + 18)); y[c] += im.height + 22
    sheet.save('test/tips_sheet.png')
asyncio.run(main())
