import asyncio
from playwright.async_api import async_playwright
async def center(pg, sel):
    b = await pg.evaluate("s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.x + r.width/2, r.y + r.height/2]; }", sel.replace(' >> nth=0',''))
    return b[0], b[1]
async def act(pg, sel):
    await pg.evaluate("s => { const e = document.querySelector(s); e && e.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0})); }", sel)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/lootnight/dist/index.html')
        await pg.wait_for_timeout(300)
        await act(pg, '[data-act=newGame]')
        await act(pg, '[data-act=gate]')
        await pg.keyboard.press('F1')
        await act(pg, '[data-act=dbgSpeed][data-arg="10"]')
        await act(pg, '[data-act=dbgMap]')
        await pg.wait_for_timeout(6000)
        await act(pg, '[data-act=dbgSpeed][data-arg="1"]')
        await act(pg, '[data-act=dbgEpic]')
        await pg.keyboard.press('F1')
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path='test/i0_state.png')
        x,y = await center(pg, '.bslot[data-item] >> nth=0')
        await pg.mouse.move(x,y); await pg.mouse.move(x+1,y+1)
        await pg.wait_for_timeout(200)
        await pg.screenshot(path='test/i1_hover.png')
        tx,ty = await center(pg, '[data-drop="hero:1"]')
        await pg.mouse.down(); await pg.mouse.move(x+20,y-20,steps=4); await pg.mouse.move(tx,ty,steps=10)
        await pg.screenshot(path='test/i2_drag.png')
        await pg.mouse.up(); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/i3_equipped.png')
        # mom call reading
        await pg.keyboard.press('F1'); await act(pg, '[data-act=dbgMom]'); await pg.keyboard.press('F1')
        await pg.wait_for_timeout(400)
        await act(pg, '[data-act=openPhone]')
        x,y = await center(pg, '[data-drag=answer]')
        await pg.mouse.move(x,y); await pg.mouse.down(); await pg.mouse.move(x+170,y,steps=8); await pg.mouse.up()
        await pg.wait_for_timeout(500)
        await pg.screenshot(path='test/i4_mom_read.png')
        await pg.wait_for_timeout(1800)
        await pg.screenshot(path='test/i5_mom_reply.png')
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
