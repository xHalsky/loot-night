# The city (#50): a click on a building does what it says. Hover glows (cursor: pointer), a service opens its
# window, a plot opens its build window, the portal leads down. Run after a build.
import asyncio
from playwright.async_api import async_playwright
SPOTS = {'merchant': (82, 360), 'inn': (588, 330), 'library': (222, 180), 'portal': (334, 70)}   # battle-area pixels
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(400)
        await pg.evaluate("()=>document.querySelector('[data-act=newGame]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))"); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>document.querySelector('[data-act=howtoClose]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))"); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.nextInterruptAt=1e9; n.dog.next=1e9;}")
        ok = True
        for name, (x, y) in SPOTS.items():
            await pg.mouse.move(314 + x, 16 + y); await pg.wait_for_timeout(150)
            cur = await pg.evaluate("()=>document.getElementById('monitor').style.cursor")
            tip = await pg.evaluate("()=>document.querySelector('#tooltipLayer .tt-name')?.textContent || ''")
            await pg.mouse.click(314 + x, 16 + y); await pg.wait_for_timeout(250)
            st = await pg.evaluate("()=>{const g=window.__lootnight.S.g; return {win:g.townWin||null, loc:g.night.location}}")
            want = {'merchant': ('merchant', 'town'), 'inn': ('build:inn', 'town'), 'library': ('build:library', 'town'), 'portal': (None, 'dungeon')}[name]
            good = cur == 'pointer' and tip and (st['win'], st['loc']) == want
            ok &= bool(good)
            print(f"{name:9} cursor {cur:8} tip '{tip}' -> {st}  {'ok' if good else 'FAIL'}")
            await pg.evaluate("()=>{window.__lootnight.S.g.townWin=null}")
        print('ERRORS', errs); print('PASS' if ok and not errs else 'FAIL'); await b.close()
asyncio.run(main())
