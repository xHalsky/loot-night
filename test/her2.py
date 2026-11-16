import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); if(!e) throw new Error('no '+s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(120)
async def dbg(pg, a):
    await pg.keyboard.press('F1'); await pg.wait_for_timeout(200); await act(pg,f'[data-act={a}]'); await pg.keyboard.press('F1'); await pg.wait_for_timeout(100)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/lootnight/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg,'[data-act=portal]')
        await dbg(pg,'dbgBusy'); await pg.keyboard.press('Tab'); await dbg(pg,'dbgVisit')
        for i in range(30):
            await pg.wait_for_timeout(300)
            st = await pg.evaluate("document.querySelector('.her-note small')?.textContent")
            if st == 'she is in': break
        await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/h_door.png', clip={'x':0,'y':0,'width':280,'height':720})
        await pg.keyboard.press('Tab')
        await dbg(pg,'dbgLap'); await pg.wait_for_timeout(1800)
        await pg.screenshot(path='test/h_lap.png')
        for k in range(3):
            await pg.wait_for_timeout(300)
            await pg.evaluate("(()=>{const e=document.querySelector('[data-act=lapAns][data-arg=\"0\"]'); if(e) e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))})()")
            await pg.wait_for_timeout(1700)
            if k==1: await pg.screenshot(path='test/h_lap2.png')
        await dbg(pg,'dbgDog'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='test/h_dog.png', clip={'x':280,'y':300,'width':680,'height':420})
        await dbg(pg,'dbgUnplug'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='test/h_cab.png', clip={'x':280,'y':0,'width':680,'height':720})
        for i in range(4): await dbg(pg,'dbgClock')
        await pg.wait_for_timeout(500)
        await pg.evaluate("(()=>{const e=document.querySelector('[data-act=sleep]'); e&&e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))})()")
        await pg.wait_for_timeout(800)
        await act(pg,'[data-act=morning]'); await pg.wait_for_timeout(800)
        await pg.screenshot(path='test/h_morning.png')
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
