import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); if(!e) throw new Error('no '+s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel)
    await pg.wait_for_timeout(120)
async def dbg(pg, a):
    await pg.keyboard.press('F1'); await pg.wait_for_timeout(200); await act(pg,f'[data-act={a}]'); await pg.keyboard.press('F1'); await pg.wait_for_timeout(100)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/lootnight/dist/index.html'); await pg.wait_for_timeout(600)
        await act(pg,'[data-act=newGame]'); await pg.wait_for_timeout(500)
        for a in ['dbgEpic','dbgLeg','dbgMap','dbgMap']: await dbg(pg,a)
        await act(pg,'[data-act=portal]'); await pg.wait_for_timeout(1500)
        await dbg(pg,'dbgFloor'); await pg.wait_for_timeout(5000)
        await pg.screenshot(path='test/t4_map.png', clip={'x':300,'y':14,'width':640,'height':400})
        await act(pg,'.mnode >> nth=1') if False else await pg.evaluate("()=>document.querySelectorAll('.mnode')[1].dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))")
        await pg.wait_for_timeout(800)
        await pg.screenshot(path='test/t4b.png', clip={'x':300,'y':14,'width':640,'height':400})
        for i in range(30):
            if await pg.evaluate("()=>!!document.querySelector('[data-act=toTown]:not(.off)')"): break
            await pg.evaluate("()=>{const m=document.querySelector('.mnode'); if(m) m.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))}")
            await pg.wait_for_timeout(1000)
        await dbg(pg,'dbgEpic'); await pg.wait_for_timeout(1500)
        await act(pg,'[data-act=toTown]'); await pg.wait_for_timeout(400)
        await act(pg,'[data-act=townWin][data-arg=merchant]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/t5_merchant.png', clip={'x':300,'y':14,'width':640,'height':400})
        await act(pg,'[data-act=svc]'); await act(pg,'[data-act=townWin]')
        await act(pg,'[data-act=townWin][data-arg=appraiser]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/t6_appr.png', clip={'x':300,'y':14,'width':640,'height':400})
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
