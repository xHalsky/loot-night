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
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]'); await act(pg,'[data-act=portal]')
        await dbg(pg,'dbgDog'); await pg.wait_for_timeout(900)
        await pg.screenshot(path='test/d1.png', clip={'x':296,'y':0,'width':984,'height':720})
        # pet: strokes over head at (280+340, 628)
        await pg.mouse.move(580,620); await pg.mouse.down()
        for k in range(40):
            await pg.mouse.move(580+ (k%2)*80, 620 + (k%3)*4, steps=6); await pg.wait_for_timeout(30)
            if k==10: await pg.screenshot(path='test/d2.png', clip={'x':296,'y':0,'width':984,'height':720})
        await pg.mouse.up(); await pg.wait_for_timeout(500)
        await dbg(pg,'dbgUnplug'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='test/d3.png', clip={'x':296,'y':0,'width':984,'height':720})
        # try plugging: find socket order from screenshot impossible; brute force each plug to each socket
        socks=[(190,190),(340,190),(490,190)]; home=[(200,470),(340,486),(480,470)]
        for i in range(3):
            for sx,sy in socks:
                await pg.mouse.move(280+home[i][0], home[i][1]+5); await pg.mouse.down(); await pg.mouse.move(280+sx, sy, steps=6); await pg.mouse.up(); await pg.wait_for_timeout(200)
        await pg.screenshot(path='test/d4.png', clip={'x':296,'y':0,'width':984,'height':720})
        await dbg(pg,'dbgLap'); await pg.wait_for_timeout(1800)
        await pg.screenshot(path='test/d5.png', clip={'x':296,'y':0,'width':984,'height':720})
        for k in range(3):
            await pg.wait_for_timeout(300)
            await pg.evaluate("(()=>{const e=document.querySelector('[data-act=lapAns][data-arg=\"0\"]'); if(e) e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))})()")
            await pg.wait_for_timeout(1900)
        await pg.screenshot(path='test/d6.png', clip={'x':296,'y':0,'width':984,'height':720})
        log = await pg.evaluate("[...document.querySelectorAll('.fl')].map(e=>e.textContent).join('\\n')")
        print(log); print('ERRORS', errs)
        await b.close()
asyncio.run(main())
