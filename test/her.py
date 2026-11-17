import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(120)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720}, device_scale_factor=2)
        await pg.goto('file:///home/claude/lootnight/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]'); await act(pg,'[data-act=portal]')
        await pg.keyboard.press('F1'); await pg.wait_for_timeout(200); await act(pg,'[data-act=dbgVisit]'); await act(pg,'[data-act=dbgBusy]'); await pg.keyboard.press('F1'); await pg.keyboard.press('Tab')
        for i in range(14):
            await pg.wait_for_timeout(500)
            st = await pg.evaluate("document.querySelector('.her-note small')?.textContent")
            if st and 'in' in st and 'she' in st: break
        await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/her_door.png', clip={'x':0,'y':100,'width':280,'height':290})
        await b.close()
asyncio.run(main())
