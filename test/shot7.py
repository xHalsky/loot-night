import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html')
        await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('[data-act=newGame]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))"); await pg.evaluate("()=>{window.__lootnight.S.g.howto=false}")
        await pg.evaluate("document.querySelector('[data-act=gate]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))")
        await pg.wait_for_timeout(5500)
        await pg.keyboard.press('w')
        await pg.keyboard.press('2')
        await pg.keyboard.press('s')
        for i in range(8):
            await pg.wait_for_timeout(350)
            await pg.screenshot(path=f'test/v{i}.png', clip={'x':300,'y':10,'width':650,'height':410})
        await pg.screenshot(path='test/v_full.png')
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
