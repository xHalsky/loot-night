import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html')
        await pg.wait_for_timeout(300)
        await pg.click('[data-act=newGame]', force=True); await pg.evaluate("()=>{window.__lootnight.S.g.howto=false}")
        await pg.click('[data-act=gate]', force=True)
        await pg.keyboard.press('F1')
        for i in range(4): await pg.click('[data-act=dbgClock]', force=True)
        await pg.click('[data-act=dbgSpeed][data-arg="10"]', force=True)
        await pg.wait_for_timeout(5000)
        await pg.click('[data-act=dbgSpeed][data-arg="1"]', force=True)
        await pg.keyboard.press('F1')
        await pg.screenshot(path='test/g1_bed.png')
        await pg.keyboard.down('Space')
        await pg.wait_for_timeout(1400)
        await pg.screenshot(path='test/g2_listen.png')
        await pg.keyboard.up('Space')
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
