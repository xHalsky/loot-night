import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); const m=/^\\[data-act=\\x22?(\\w+)\\x22?\\](?:\\[data-arg=\\x22?([^\\x22\\]]*)\\x22?\\])?$/.exec(s); if(!e && m){const b=document.createElement('button'); b.dataset.act=m[1]; if(m[2]!=null) b.dataset.arg=m[2]; document.getElementById('stage').appendChild(b); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); b.remove(); return;} if(!e) throw new Error('no '+s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(100)
async def dbg(pg, a):
    await pg.keyboard.press('F1'); await pg.wait_for_timeout(150); await act(pg,f'[data-act={a}]'); await pg.keyboard.press('F1'); await pg.wait_for_timeout(80)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]'); await act(pg,'[data-act=portal]')
        await dbg(pg,'dbgEpic'); await dbg(pg,'dbgLeg'); await dbg(pg,'dbgEpic')
        for i in range(12):
            await pg.wait_for_timeout(250)
            if i in (2,7): await pg.screenshot(path=f'test/lt{i}.png', clip={'x':300,'y':14,'width':640,'height':400})
        await pg.screenshot(path='test/lt_bag.png', clip={'x':960,'y':560,'width':320,'height':160})
        # lock test: hover first item and press L
        r = await pg.evaluate("(()=>{const e=document.querySelector('[data-item^=\"bag:\"]'); if(!e) return null; const r=e.getBoundingClientRect(); return [r.x+10,r.y+10]})()")
        if r:
            await pg.mouse.move(*r); await pg.wait_for_timeout(100); await pg.keyboard.press('l'); await pg.wait_for_timeout(200)
        await act(pg,'[data-act=autoSalvage]')
        await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/lt_bag2.png', clip={'x':960,'y':560,'width':320,'height':160})
        print(await pg.evaluate("[...document.querySelectorAll('.fl')].slice(-5).map(e=>e.textContent).join('\\n')"))
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
