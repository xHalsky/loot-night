# Screenshot: the door panel stats (Patience + Caught, Goodwill bar) and the phone menu with the Raid pass.
import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const S=window.__lootnight.S; const n=S.g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.tired=0; n.apt.t=999; S.g.goodwill=52; n.catches=1}")
        await act(pg,'[data-act=portal]'); await pg.wait_for_timeout(300)
        box = await pg.evaluate("()=>{const r=document.querySelector('[data-phone]').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]}")
        await pg.mouse.move(*box); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/goodwill.png', clip={'x':0,'y':400,'width':700,'height':320})
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
