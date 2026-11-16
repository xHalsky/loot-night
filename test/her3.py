import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); if(!e) throw new Error('no '+s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(120)
async def dbg(pg, a):
    await pg.keyboard.press('F1'); await pg.wait_for_timeout(200); await act(pg,f'[data-act={a}]'); await pg.keyboard.press('F1'); await pg.wait_for_timeout(100)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/lootnight/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg,'[data-act=portal]')
        shots=0
        for v in range(3):
            await dbg(pg,'dbgBusy'); await dbg(pg,'dbgVisit')
            if v==0: await pg.keyboard.press('Tab')
            for i in range(60):
                await pg.wait_for_timeout(250)
                st = await pg.evaluate("document.querySelector('.her-note small')?.textContent")
                if st=='at the door' and shots==0:
                    await pg.screenshot(path='test/hd_toes.png', clip={'x':0,'y':300,'width':280,'height':110}); shots=1
                if st == 'she is in': break
            await pg.wait_for_timeout(500)
            await pg.screenshot(path=f'test/hd_in{v}.png', clip={'x':0,'y':0,'width':280,'height':400})
            for i in range(40):
                await pg.wait_for_timeout(250)
                if await pg.evaluate("document.querySelector('.her-note small')?.textContent") != 'she is in': break
            await pg.evaluate("(()=>{const n=window; })()")
        txt = await pg.evaluate("document.querySelector('[data-act=sleep]')?.outerHTML")
        print('sleep btn', txt)
        for i in range(4): await dbg(pg,'dbgClock')
        await pg.wait_for_timeout(400)
        print('sleep btn', await pg.evaluate("document.querySelector('[data-act=sleep]')?.outerHTML"))
        for i in range(60):
            await act(pg,'[data-act=sleep]'); await pg.wait_for_timeout(500)
            if await pg.evaluate("!!document.querySelector('[data-act=morning]')"): break
        print(await pg.evaluate("[...document.querySelectorAll('#screens [data-act]')].map(e=>e.dataset.act)"))
        await act(pg,'[data-act=morning]'); await pg.wait_for_timeout(800)
        await pg.screenshot(path='test/h_morning.png')
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
