# Screenshots: courier ringing on the desk, the courier dialogue in your hand, the boys' group call on speaker.
import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def ring(pg, kind):
    await pg.evaluate("k=>{const n=window.__lootnight.S.g.night; n.interrupts=[{kind:k,t:8,max:8,msgs:[],pend:[],pingAt:-9}]}", kind); await pg.wait_for_timeout(300)
async def answer(pg):
    box = await pg.evaluate("()=>{const r=document.querySelector('[data-phone]').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/3]}")
    await pg.mouse.move(*box); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(300)
    k = await pg.evaluate("()=>{const r=document.querySelector('#dragEl').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]}")
    await pg.mouse.move(*k); await pg.mouse.down(); await pg.mouse.move(k[0]+200, k[1], steps=8); await pg.mouse.up(); await pg.wait_for_timeout(400)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.tired=0; n.apt.t=999}")
        await act(pg,'[data-act=portal]'); await pg.wait_for_timeout(300)
        await ring(pg, 'courier'); await pg.screenshot(path='test/call_desk.png', clip={'x':280,'y':440,'width':400,'height':280})
        await answer(pg); await pg.screenshot(path='test/call_courier.png')
        print('stage', await pg.evaluate("()=>window.__lootnight.S.g.night.game?.stage"))
        await act(pg, '[data-act=closeGame]')
        await ring(pg, 'friends'); await answer(pg); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='test/call_boys.png')
        print('noise', await pg.evaluate("()=>Math.round(window.__lootnight.S.g.night.noise)"), 'ERRORS', errs)
        await b.close()
asyncio.run(main())
