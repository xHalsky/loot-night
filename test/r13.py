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
        await dbg(pg,'dbgMom'); await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/r1.png', clip={'x':280,'y':440,'width':200,'height':280})
        r = await pg.evaluate("(()=>{const r=document.querySelector('[data-decline]').getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height/2]})()")
        await pg.mouse.click(*r); await pg.wait_for_timeout(200)
        print('after decline interrupts:', await pg.evaluate("document.querySelector('.ios.call') ? 'still ringing' : 'declined'"))
        # wait for a battle, cast skill with key 2 (knight bash)
        for i in range(40):
            await pg.wait_for_timeout(400)
            if await pg.evaluate("[...document.querySelectorAll('.fl')].some(e=>e.textContent.includes('xx'))"): break
            if i==12:
                await pg.keyboard.press('1'); await pg.wait_for_timeout(150)
                await pg.screenshot(path='test/r2.png', clip={'x':300,'y':14,'width':640,'height':400})
        await pg.screenshot(path='test/r3.png', clip={'x':300,'y':14,'width':640,'height':400})
        print(await pg.evaluate("[...document.querySelectorAll('.fl')].slice(-6).map(e=>e.textContent).join('\\n')"))
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
