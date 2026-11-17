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
        await pg.keyboard.press('F1')
        await pg.click('[data-act=dbgGold]', force=True)
        await pg.click('[data-act=dbgSpeed][data-arg="1"]', force=True)
        # need a night so debug drops land: drop an epic while in town
        await pg.click('[data-act=dbgEpic]', force=True)
        await pg.wait_for_timeout(500)
        await pg.click('.bslot >> nth=0', force=True)
        await pg.wait_for_timeout(200)
        await pg.click('[data-act=identify]', force=True)
        await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/t1_identify.png')
        await pg.click('[data-act=buy][data-arg=dummy]', force=True)
        await pg.click('[data-act=sleep]', force=True)
        await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/t2_results.png')
        await pg.click('[data-act=morning]', force=True)
        await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/t3_morning.png')
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
