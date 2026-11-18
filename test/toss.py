import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        for s in ['newGame','portal','openMonster']:
            await pg.evaluate(f"document.querySelector('[data-act={s}]').dispatchEvent(new PointerEvent('pointerdown',{{bubbles:true}}))"); await pg.wait_for_timeout(300)
        async def sc(x,y):
            r = await pg.evaluate("(()=>{const r=document.getElementById('mcv').getBoundingClientRect(); return [r.x,r.y,r.width/440,r.height/236]})()")
            return r[0]+x*r[2], r[1]+y*r[3]
        await pg.mouse.click(*(await sc(80,140))); await pg.wait_for_timeout(400)
        x,y = await sc(37,146); await pg.mouse.move(x,y); await pg.mouse.down(); await pg.mouse.move(*(await sc(240,120)), steps=8); await pg.mouse.up(); await pg.wait_for_timeout(600)
        for cx in range(180,320,20):
            if 'Open' not in (await pg.evaluate("document.querySelector('.m-steps .now')?.textContent")): break
            await pg.mouse.click(*(await sc(cx,150))); await pg.wait_for_timeout(150)
        for k in range(10):
            await pg.mouse.move(*(await sc(250,100))); await pg.mouse.down(); await pg.wait_for_timeout(780); await pg.mouse.up(); await pg.wait_for_timeout(400)
        X,Y = await sc(92,132); await pg.mouse.move(X,Y); await pg.mouse.down(); await pg.mouse.move(*(await sc(60,170)), steps=6); await pg.wait_for_timeout(200)
        await pg.screenshot(path='test/sling.png', clip={'x':380,'y':14,'width':480,'height':400})
        await pg.mouse.move(*(await sc(92,132)), steps=3); await pg.mouse.up(); await pg.wait_for_timeout(300)
        await pg.wait_for_timeout(3500)
        print("stage", await pg.evaluate("document.querySelector('.m-steps .now')?.textContent"), await pg.evaluate("window.__lnCan()"))
        for vx in [320,360,400,440,480]:
            for vy in [-500,-600]:
                ok = await pg.evaluate(f"window.__lnThrow({vx},{vy})")
                if not ok:
                    await pg.wait_for_timeout(2000); ok = await pg.evaluate(f"window.__lnThrow({vx},{vy})")
                    if not ok: print('no can'); continue
                await pg.wait_for_timeout(2500)
                st = await pg.evaluate("document.querySelector('.m-steps .now')?.textContent || 'closed'")
                can = await pg.evaluate("window.__lnCan()")
                print(vx, vy, st, can)
                if st=='closed':
                    await pg.screenshot(path='test/toss_in.png'); await b.close(); return
                await pg.wait_for_timeout(1500)
        await b.close()
asyncio.run(main())
