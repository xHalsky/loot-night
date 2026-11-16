import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); if(!e) throw new Error('no '+s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(120)
async def dbg(pg, a):
    await pg.keyboard.press('F1'); await pg.wait_for_timeout(200); await act(pg,f'[data-act={a}]'); await pg.keyboard.press('F1'); await pg.wait_for_timeout(100)
async def center(pg, sel):
    return await pg.evaluate(f"(()=>{{const e=document.querySelector('{sel}'); const r=e.getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height/2];}})()")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/lootnight/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg,'[data-act=portal]'); await pg.wait_for_timeout(500)
        x,y = await center(pg,'#doorCanvas'); await pg.mouse.move(x,y); await pg.mouse.down(); await pg.wait_for_timeout(900)
        await pg.screenshot(path='test/pk1.png', clip={'x':0,'y':140,'width':280,'height':380})
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path='test/pk2.png', clip={'x':0,'y':0,'width':280,'height':720})
        await pg.mouse.up(); await pg.wait_for_timeout(300)
        await dbg(pg,'dbgMom'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/ph1.png', clip={'x':280,'y':440,'width':300,'height':280})
        x,y = await center(pg,'[data-decline]'); await pg.mouse.move(x,y); await pg.mouse.down(); await pg.wait_for_timeout(900)
        await pg.screenshot(path='test/ph2.png', clip={'x':280,'y':440,'width':300,'height':280})
        await pg.wait_for_timeout(1000); await pg.mouse.up(); await pg.wait_for_timeout(300)
        await dbg(pg,'dbgBoss'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/ph3.png', clip={'x':280,'y':440,'width':300,'height':280})
        x,y = await center(pg,'[data-flip]'); await pg.mouse.move(x,y); await pg.mouse.down()
        for i in range(1,8): await pg.mouse.move(x,y+i*10); await pg.wait_for_timeout(30)
        await pg.screenshot(path='test/ph4.png', clip={'x':280,'y':440,'width':300,'height':280})
        await pg.mouse.up(); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='test/ph5.png', clip={'x':280,'y':440,'width':300,'height':280})
        await pg.screenshot(path='test/ph6.png', clip={'x':0,'y':0,'width':280,'height':150})
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
