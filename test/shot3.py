import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/lootnight/dist/index.html')
        await pg.wait_for_timeout(300)
        await pg.click('[data-act=newGame]', force=True); await pg.evaluate("()=>{window.__lootnight.S.g.howto=false}")
        await pg.click('[data-act=gate]', force=True)
        await pg.wait_for_timeout(7000)
        await pg.screenshot(path='test/f1_map.png')
        await pg.keyboard.press('h')
        await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/f2_headset.png')
        await pg.keyboard.press('F1')
        await pg.click('[data-act=dbgVisit]', force=True)
        await pg.wait_for_timeout(5150)
        await pg.screenshot(path='test/f3_scare.png')
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
