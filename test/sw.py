import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(120)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/lootnight/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]'); await act(pg,'[data-act=portal]'); await pg.wait_for_timeout(1200)
        await pg.keyboard.press('Tab')
        for i in range(9):
            await pg.screenshot(path=f'test/sw{i}.png', clip={'x':332,'y':40,'width':616,'height':352})
            await pg.wait_for_timeout(190)
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
