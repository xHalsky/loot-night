# Stars that reward greed (#54, 3.1): the Tonight note's three lines, the results' named stars and the morning's
# rewards. Writes test/shots/stars_*.png.
import asyncio, os
from playwright.async_api import async_playwright
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; g.realLifeOff=true; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map'); const n=g.night; n.deepest=2; n.mood=82}")
        await pg.wait_for_timeout(500)
        # the Tonight note is drawn on the desk (V3): its box from the renderer's hit regions (right-screen grid px, 2x CSS, stage x 296)
        box = await pg.evaluate("()=>{const h=window.__lootnight.deskHits.find(h=>h.tip==='tonight'); return {x:296+h.x*2-6,y:h.y*2-6,width:h.w*2+12,height:h.h*2+12}}")
        await pg.screenshot(path='test/shots/stars_note_risk.png', clip=box)
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.deepest=4; n.mood=30; n.everCaught=true}"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/shots/stars_note_mixed.png', clip=box)
        await pg.evaluate("()=>{const g=window.__lootnight.S.g, n=g.night; n.everCaught=false; n.catches=0; n.clock=23.5*60; g.sleepDebt=2}")
        await pg.evaluate(GO, 'sleep'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='test/shots/stars_results.png')
        await pg.evaluate(GO, 'morning'); await pg.wait_for_timeout(800)
        await pg.screenshot(path='test/shots/stars_morning.png')
        print('errors:', errs or 'none'); await b.close()
asyncio.run(main())
