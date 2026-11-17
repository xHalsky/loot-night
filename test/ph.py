import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); if(!e) throw new Error('no '+s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(100)
async def dbg(pg, a):
    await pg.keyboard.press('F1'); await pg.wait_for_timeout(150); await act(pg,f'[data-act={a}]'); await pg.keyboard.press('F1'); await pg.wait_for_timeout(80)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/lootnight/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]'); await act(pg,'[data-act=portal]')
        await pg.keyboard.press('h'); await dbg(pg,'dbgDebt'); await dbg(pg,'dbgDebt')
        await dbg(pg,'dbgBoss'); await pg.wait_for_timeout(2200)
        await pg.screenshot(path='test/p1.png')
        r = await pg.evaluate("(()=>{const r=document.querySelector('.phone3d').getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height/2]})()")
        await pg.mouse.click(*r); await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/p2.png', clip={'x':440,'y':0,'width':300,'height':440})
        await act(pg,'[data-hold=unlock]'); await pg.wait_for_timeout(1500)
        await pg.mouse.up()
        await pg.screenshot(path='test/p3.png', clip={'x':440,'y':0,'width':300,'height':440})
        await act(pg,'.ios-back'); await pg.wait_for_timeout(400)
        await dbg(pg,'dbgMom'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='test/p4.png', clip={'x':280,'y':440,'width':260,'height':280})
        r = await pg.evaluate("(()=>{const r=document.querySelector('.phone3d').getBoundingClientRect(); return [r.x+r.width/2, r.y+40]})()")
        await pg.mouse.click(*r); await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/p5.png', clip={'x':440,'y':0,'width':300,'height':440})
        print('game?', await pg.evaluate("document.querySelector('.phone-win')? 'open':'closed'"))
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
