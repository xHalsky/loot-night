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
        await act(pg,'[data-act=newGame]'); await act(pg,'[data-act=portal]')
        await pg.keyboard.press('F1'); await pg.wait_for_timeout(150); await act(pg,'[data-act=dbgBoss]'); await pg.keyboard.press('F1')
        await pg.wait_for_timeout(1200)
        r = await pg.evaluate("(()=>{const r=document.querySelector('.phone3d').getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height/2]})()")
        await pg.mouse.click(*r); await pg.wait_for_timeout(300)
        print('open, on desk:', await pg.evaluate("!!document.querySelector('.phone3d')"), '| window:', await pg.evaluate("!!document.querySelector('.phone-win')"))
        await pg.screenshot(path='test/pick1.png', clip={'x':280,'y':0,'width':680,'height':720})
        await act(pg,'.mg-close'); await pg.wait_for_timeout(300)
        print('closed, on desk:', await pg.evaluate("!!document.querySelector('.phone3d')"), '| window:', await pg.evaluate("!!document.querySelector('.phone-win')"))
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
