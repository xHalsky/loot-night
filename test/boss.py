# Screenshot: the boss winding up SMASH.
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
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.checkpoint=5;}")
        await act(pg,'[data-act=portal]')
        await pg.evaluate("()=>{const S=window.__lootnight.S; S.g.heroes.forEach(h=>{h.level=4}); const n=S.g.night; n.battleIdx=2;}")
        for _ in range(80):
            await pg.wait_for_timeout(200)
            w = await pg.evaluate("()=>window.__lootnight.S.g.night.enemies.some(e=>e.wind>1.2)")
            if w: break
        await pg.evaluate("()=>{window.__lootnight.S.g.timeScale=0}"); await pg.wait_for_timeout(150)
        bb = await pg.evaluate("()=>{const r=document.querySelector('[data-tip=\"skill:0:2\"]').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]}")
        await pg.mouse.move(bb[0], bb[1]); await pg.wait_for_timeout(250)
        await pg.screenshot(path='test/boss_tooltip.png', clip={'x':300,'y':14,'width':640,'height':420})
        print('winding', w, 'ERRORS', errs)
        await b.close()
asyncio.run(main())
