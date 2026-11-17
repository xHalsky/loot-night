import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s => { const e = document.querySelector(s); e && e.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0})); }", sel)
async def center(pg, sel):
    b = await pg.evaluate("s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width/2, r.y + r.height/2]; }", sel)
    return b
async def drag(pg, sel, dx, dy, steps=12):
    c = await center(pg, sel)
    if not c: print('missing', sel); return
    x,y = c
    await pg.mouse.move(x,y); await pg.mouse.down(); await pg.mouse.move(x+dx/2,y+dy/2,steps=steps)
    return x,y
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/lootnight/dist/index.html')
        await pg.wait_for_timeout(300)
        await act(pg, '[data-act=newGame]'); await act(pg, '[data-act=howtoClose]'); await act(pg, '[data-act=gate]')
        await pg.wait_for_timeout(500)
        await act(pg, '[data-act=openMonster]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path='test/mo1.png', clip={'x':300,'y':10,'width':650,'height':410})
        x,y = await drag(pg, '[data-drag=door]', -100, 0)
        await pg.screenshot(path='test/mo1b.png', clip={'x':300,'y':10,'width':650,'height':410})
        await pg.mouse.move(x-100,y,steps=6); await pg.mouse.up(); await pg.wait_for_timeout(150)
        await pg.screenshot(path='test/mo2.png', clip={'x':300,'y':10,'width':650,'height':410})
        x,y = await drag(pg, '[data-drag=can]', 180, 0)
        await pg.mouse.move(x+180,y,steps=6); await pg.mouse.up(); await pg.wait_for_timeout(150)
        await pg.screenshot(path='test/mo3.png', clip={'x':300,'y':10,'width':650,'height':410})
        for _ in range(3): await act(pg, '[data-act=monsterTab]'); await pg.wait_for_timeout(80)
        await pg.screenshot(path='test/mo4.png', clip={'x':300,'y':10,'width':650,'height':410})
        x,y = await drag(pg, '[data-drag=pull]', 0, -70, 20)
        await pg.wait_for_timeout(300)
        await pg.mouse.move(x,y-70,steps=10); await pg.mouse.up(); await pg.wait_for_timeout(150)
        for i in range(3):
            c = await center(pg, '[data-hold=drink]')
            await pg.mouse.move(*c); await pg.mouse.down(); await pg.wait_for_timeout(750)
            if i == 0: await pg.screenshot(path='test/mo5.png', clip={'x':300,'y':10,'width':650,'height':410})
            await pg.mouse.up(); await pg.wait_for_timeout(150)
        await pg.screenshot(path='test/mo6.png', clip={'x':300,'y':10,'width':650,'height':410})
        x,y = await drag(pg, '[data-drag=toss]', 140, 0)
        await pg.mouse.move(x+140,y,steps=6); await pg.mouse.up(); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/mo7.png')
        await pg.keyboard.press('Tab'); await pg.wait_for_timeout(1500)
        await pg.keyboard.press('a'); await pg.keyboard.press('w'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='test/xl1.png', clip={'x':300,'y':10,'width':650,'height':410})
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
