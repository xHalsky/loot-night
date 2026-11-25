import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html')
        await pg.wait_for_timeout(300)
        for s in ['newGame','gate']:
            await pg.evaluate(f"document.querySelector('[data-act={s}]').dispatchEvent(new PointerEvent('pointerdown',{{bubbles:true}}))")
        await pg.wait_for_timeout(500)
        await pg.keyboard.press('Tab')
        for k in ['a','a',' ','d','d','d',' ','w','d',' ','a','a','a',' ']:
            await pg.keyboard.press(k); await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(900)
        await pg.screenshot(path='test/xl2.png', clip={'x':300,'y':10,'width':650,'height':410})
        await b.close()
asyncio.run(main())
