import asyncio, sys
from playwright.async_api import async_playwright
CLIP={'x':300,'y':14,'width':640,'height':400}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        for s in ['newGame','portal']:
            await pg.evaluate(f"document.querySelector('[data-act={s}]').dispatchEvent(new PointerEvent('pointerdown',{{bubbles:true}}))"); await pg.wait_for_timeout(300)
        async def sc(x,y):
            r = await pg.evaluate("(()=>{const r=document.getElementById('mcv').getBoundingClientRect(); return [r.x,r.y,r.width/440,r.height/236]})()")
            return r[0]+x*r[2], r[1]+y*r[3]
        for rnd in range(int(sys.argv[1]) if len(sys.argv)>1 else 1):
            await pg.evaluate("document.querySelector('[data-act=openMonster]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))")
            await pg.wait_for_timeout(300)
            if rnd==0: await pg.screenshot(path='test/q1.png', clip=CLIP)
            x,y = await sc(80,140); await pg.mouse.click(x,y); await pg.wait_for_timeout(500)
            if rnd==0: await pg.screenshot(path='test/q2.png', clip=CLIP)
            x,y = await sc(37+27*(rnd%4),92+54); await pg.mouse.move(x,y); await pg.mouse.down()
            tx,ty = await sc(230+rnd*20,120)
            for i in range(1,12): await pg.mouse.move(x+(tx-x)*i/11, y+(ty-y)*i/11); await pg.wait_for_timeout(30)
            if rnd==0: await pg.screenshot(path='test/q3.png', clip=CLIP)
            await pg.mouse.up(); await pg.wait_for_timeout(600)
            if rnd==0: await pg.screenshot(path='test/q4.png', clip=CLIP)
            cx = await pg.evaluate("(()=>0)()")
            x,y = await sc(240+rnd*20,140); await pg.mouse.click(x,y); await pg.wait_for_timeout(200)
            if rnd==0: await pg.screenshot(path='test/q5.png', clip=CLIP)
            for k in range(10):
                if await pg.evaluate("!document.querySelector('.m-steps .now') || !document.querySelector('.m-steps .now').textContent.includes('Drink')"): break
                await pg.mouse.move(*(await sc(250,100))); await pg.mouse.down(); await pg.wait_for_timeout(780)
                if rnd==0 and k==0: await pg.screenshot(path='test/q6.png', clip=CLIP)
                await pg.mouse.up(); await pg.wait_for_timeout(450)
            await pg.wait_for_timeout(300)
            if rnd==0: await pg.screenshot(path='test/q7.png', clip=CLIP)
            # throw: grab at hand, swing up-right fast
            x,y = await sc(86,118); await pg.mouse.move(x,y); await pg.mouse.down()
            f=[1.35,1.6,1.9][rnd%3]
            pts=[(86+i*5.5*f,118-i*7.5*f) for i in range(7)]
            for (px,py) in pts:
                X,Y = await sc(px,py); await pg.mouse.move(X,Y); await pg.wait_for_timeout(16)
            await pg.mouse.up(); await pg.wait_for_timeout(300)
            if rnd==0: await pg.screenshot(path='test/q8.png', clip=CLIP)
            await pg.wait_for_timeout(2500)
            if rnd==0: await pg.screenshot(path='test/q9.png', clip=CLIP)
            print('after throw instr:', await pg.evaluate("document.querySelector('.m-instr')?.textContent"))
            await pg.evaluate("document.querySelector('[data-act=cancelMonster]')?.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))")
            await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/q10.png')
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
