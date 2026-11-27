# Stars that reward greed (#54, 3.1): tonight's stars card after How to hide (#101), the results' named stars and the morning's
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
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; g.realLifeOff=true; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map'); const n=g.night; n.deepest=2; n.mood=82}")
        await pg.wait_for_timeout(500)
        # tonight's three stars (#101): the card after How to hide (the sticky note is gone)
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; g.howto=true; g.howtoPage=1}"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/shots/stars_card.png')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; g.howto=false; g.howtoPage=0}"); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{const g=window.__lootnight.S.g, n=g.night; n.everCaught=false; n.catches=0; n.clock=23.5*60; g.sleepDebt=2}")
        await pg.evaluate(GO, 'sleep'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='test/shots/stars_results.png')
        await pg.evaluate(GO, 'morning'); await pg.wait_for_timeout(800)
        await pg.screenshot(path='test/shots/stars_morning.png')
        print('errors:', errs or 'none'); await b.close()
asyncio.run(main())
