import asyncio
from playwright.async_api import async_playwright
CLIP={'x':300,'y':14,'width':640,'height':400}
async def center(pg, sel):
    return await pg.evaluate(f"(()=>{{const e=document.querySelector('{sel}'); if(!e) return null; const r=e.getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height/2];}})()")
async def drag(pg, sel, dx, dy, steps=10, ms=60):
    c = await center(pg, sel); x,y=c
    await pg.mouse.move(x,y); await pg.mouse.down()
    for i in range(1,steps+1):
        await pg.mouse.move(x+dx*i/steps, y+dy*i/steps); await pg.wait_for_timeout(ms)
    await pg.mouse.up(); await pg.wait_for_timeout(250)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/lootnight/dist/index.html'); await pg.wait_for_timeout(500)
        for s in ['newGame','portal']:
            await pg.evaluate(f"document.querySelector('[data-act={s}]').dispatchEvent(new PointerEvent('pointerdown',{{bubbles:true}}))"); await pg.wait_for_timeout(300)
        for rnd in range(3):
            await pg.evaluate("document.querySelector('[data-act=openMonster]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))")
            await pg.wait_for_timeout(300)
            if rnd==0: await pg.screenshot(path='test/mn1.png', clip=CLIP)
            await drag(pg,'[data-drag=door]',120,0)
            if rnd==0: await pg.screenshot(path='test/mn2.png', clip=CLIP)
            await drag(pg,'[data-drag=can]',200,0)
            if rnd==0: await pg.screenshot(path='test/mn3.png', clip=CLIP)
            for i in range(3):
                await pg.evaluate("document.querySelector('[data-act=monsterTab]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))"); await pg.wait_for_timeout(150)
                if rnd==0 and i==1: await pg.screenshot(path='test/mn3b.png', clip=CLIP)
            if rnd==0: await pg.screenshot(path='test/mn4.png', clip=CLIP)
            await drag(pg,'[data-drag=pull]',0,-90,steps=12,ms=80)
            if rnd==0: await pg.screenshot(path='test/mn5.png', clip=CLIP)
            for k in range(12):
                c = await center(pg,'[data-hold=drink]')
                if not c: break
                await pg.mouse.move(*c); await pg.mouse.down(); await pg.wait_for_timeout(750)
                if rnd==0 and k==0: await pg.screenshot(path='test/mn6.png', clip=CLIP)
                await pg.mouse.up(); await pg.wait_for_timeout(500)
            if rnd==0: await pg.screenshot(path='test/mn7.png', clip=CLIP)
            await drag(pg,'[data-drag=toss]',170,0)
            await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/mn8.png')
        print('ERRORS', errs, await pg.evaluate("document.querySelector('.m-instr')?.textContent"))
        await b.close()
asyncio.run(main())
