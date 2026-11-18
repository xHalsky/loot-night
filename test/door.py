import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1440,'height':900}, device_scale_factor=2)
        await pg.goto('file:///home/claude/loot-night/dist/index.html')
        await pg.wait_for_timeout(300)
        for s in ['newGame','gate']:
            await pg.evaluate(f"document.querySelector('[data-act={s}]').dispatchEvent(new PointerEvent('pointerdown',{{bubbles:true}}))")
        await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('[data-act=openMonster]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))")
        await pg.wait_for_timeout(200)
        r = await pg.evaluate("(() => { const e=document.querySelector('[data-drag=door]'); const r=e.getBoundingClientRect(); const t=document.elementFromPoint(r.x+r.width/2, r.y+r.height/2); return [r.x+r.width/2, r.y+r.height/2, t.className]; })()")
        print('handle', r)
        x,y = r[0], r[1]
        await pg.mouse.move(x,y); await pg.mouse.down()
        for i in range(1,8):
            await pg.mouse.move(x+i*9,y); await pg.wait_for_timeout(40)
        await pg.mouse.up(); await pg.wait_for_timeout(200)
        print('stage text', await pg.evaluate("document.querySelector('.m-instr')?.textContent"))
        await b.close()
asyncio.run(main())
