import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(120)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{window.__lootnight.S.g.townWin='auction'}"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='test/at1.png', clip={'x':300,'y':14,'width':640,'height':400})
        await pg.evaluate("()=>{window.__lootnight.S.g.townWin=null}")
        await pg.keyboard.press('Tab'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/at2.png', clip={'x':300,'y':14,'width':640,'height':400})
        await pg.keyboard.press('Tab')   # should be ignored mid-switch
        await pg.wait_for_timeout(2600)
        print('monitor after:', await pg.evaluate("document.querySelector('.tb-app.on')?.textContent"))
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
