import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(120)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        await pg.goto('file:///home/claude/lootnight/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]'); await act(pg,'[data-act=portal]')
        await pg.keyboard.press('F1'); await pg.wait_for_timeout(200); await act(pg,'[data-act=dbgMom]'); await pg.keyboard.press('F1')
        r = await pg.evaluate("(()=>{const r=document.querySelector('.phone3d').getBoundingClientRect(); return [r.x+r.width/2, r.y+30]})()")
        await pg.mouse.move(*r); await pg.mouse.down(); await pg.mouse.move(r[0]+90, r[1], steps=8); await pg.mouse.up()
        vals=[]
        for i in range(12):
            await pg.wait_for_timeout(250)
            vals.append(await pg.evaluate("document.querySelector('.phone3d').style.transform + ' | ' + getComputedStyle(document.querySelector('.phone3d')).animationName"))
        print('\n'.join(vals[::3]))
        await pg.screenshot(path='test/phone.png', clip={'x':280,'y':440,'width':200,'height':280})
        await b.close()
asyncio.run(main())
