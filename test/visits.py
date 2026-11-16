# Screenshots of the Monday visit types: Snack run (offer), Chat (question), Cuddle (ask + minigame).
import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def wait_stage(pg, st, result=None):
    for _ in range(80):
        await pg.wait_for_timeout(150)
        v = await pg.evaluate("()=>{const v=window.__lootnight.S.g.night.visit; return [v.stage, v.result]}")
        if v[0] == st and (result is None or v[1] == result): return True
    return False
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]')
        calm = "()=>{const n=window.__lootnight.S.g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=n.threat+1e6; n.mood=10;}"
        await pg.evaluate(calm)
        await act(pg,'[data-act=portal]')
        await pg.keyboard.press('F1'); await pg.wait_for_timeout(200)
        # Snack run: hide the cans during the footsteps, then the plate offer
        await act(pg,'[data-act=dbgVisit][data-arg=snack]'); await pg.keyboard.press('F1'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='test/visit_snack0.png')
        await act(pg,'[data-act=hideCans]')
        await wait_stage(pg,'in','offer'); await pg.wait_for_timeout(200)
        await pg.screenshot(path='test/visit_snack.png')
        await act(pg,'[data-act=takePlate]'); await wait_stage(pg,'idle')
        # Chat: Excel up, then her question
        await pg.evaluate("()=>{window.__lootnight.S.g.night.busy=100}")
        await pg.keyboard.press('F1'); await pg.wait_for_timeout(150)
        await act(pg,'[data-act=dbgVisit][data-arg=chat]'); await pg.keyboard.press('F1'); await pg.keyboard.press('Tab')
        await wait_stage(pg,'in','chat'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/visit_chat.png')
        for _ in range(3): 
            await act(pg,'[data-act=chatAnswer][data-arg="0"]'); await pg.wait_for_timeout(200)
        await wait_stage(pg,'idle'); await pg.keyboard.press('Tab'); await pg.wait_for_timeout(2700)
        # Cuddle
        await pg.evaluate(calm); await pg.evaluate("()=>{window.__lootnight.S.g.night.lap=null}")
        await pg.keyboard.press('F1'); await pg.wait_for_timeout(150)
        await act(pg,'[data-act=dbgVisit][data-arg=cuddle]'); await pg.keyboard.press('F1'); await wait_stage(pg,'in','ask'); await pg.wait_for_timeout(200)
        await pg.screenshot(path='test/visit_cuddle_ask.png')
        await act(pg,'[data-act="cuddle"][data-arg="1"]'); await pg.wait_for_timeout(300)
        print('game', await pg.evaluate("()=>window.__lootnight.S.g.night.game?.kind"))
        box = await pg.evaluate("()=>{const r=document.getElementById('cuddleBox').getBoundingClientRect(); return [r.left, r.top]}")
        import math
        for i in range(200):
            d = await pg.evaluate("()=>{const g=window.__lootnight.S.g.night.game; return g? 1-g.t/g.max : -1}")
            if d < 0: break
            a = d*2*math.pi; x = 16*math.sin(a)**3; y = 13*math.cos(a)-5*math.cos(2*a)-2*math.cos(3*a)-math.cos(4*a)
            await pg.mouse.move(box[0]+210+x*9, box[1]+34+115-10-y*7.5, steps=3); await pg.wait_for_timeout(30)
            if i == 3:
                await pg.evaluate("()=>{window.__lootnight.S.g.timeScale=0}"); await pg.wait_for_timeout(100)
                await pg.screenshot(path='test/visit_cuddle_during3.png'); print('shot at', d, await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; return [n.visit.stage,n.visit.result,n.game&&n.game.t, document.getElementById('winLayer').innerHTML.length, n.clock]}"))
                await pg.evaluate("()=>{window.__lootnight.S.g.timeScale=1}")

        await pg.screenshot(path='test/visit_cuddle_end.png')
        print('result', await pg.evaluate("()=>window.__lootnight.S.g.night.visit.result"))
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
