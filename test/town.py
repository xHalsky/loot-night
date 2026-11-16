import asyncio
from playwright.async_api import async_playwright
CLIP={'x':0,'y':0,'width':1280,'height':720}
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); if(!e) throw new Error('no '+s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/lootnight/dist/index.html')
        await pg.wait_for_timeout(600)
        await act(pg,'[data-act=newGame]'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='test/t1_city.png')
        await pg.keyboard.press('F1'); await pg.wait_for_timeout(200); await act(pg,'[data-act=dbgGold]'); await act(pg,'[data-act=dbgGold]'); await pg.keyboard.press('F1')
        await act(pg,'[data-act=build][data-arg=training]'); await act(pg,'[data-act=build][data-arg=inn]'); await act(pg,'[data-act=build][data-arg=inn]')
        await act(pg,'[data-act=build][data-arg=library]');await act(pg,'[data-act=build][data-arg=library]');await act(pg,'[data-act=build][data-arg=library]')
        await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/t2_built.png')
        await pg.keyboard.press('F1'); await pg.wait_for_timeout(200); await act(pg,'[data-act=dbgEpic]'); await act(pg,'[data-act=dbgMap]'); await pg.keyboard.press('F1')
        await act(pg,'[data-act=portal]'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path='test/t3_dungeon.png')
        await pg.evaluate("()=>{}")
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
