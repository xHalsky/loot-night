# Space tilts the Goblin Fuel can the way a player does it: real clicks (the Drink button, the can), then Space
# held without holding the mouse button, away from his mouth. The can must tilt. (#62)
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.click('[data-act=newGame]'); await pg.wait_for_timeout(300)
        if await pg.locator('[data-act=howtoClose]').count(): await pg.click('[data-act=howtoClose]')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g,n=g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset')}")
        await pg.click('[data-act=portal]'); await pg.wait_for_timeout(400)
        await pg.click('[data-act=openMonster]'); await pg.wait_for_timeout(300)        # a real click: focus lands on the button
        await pg.evaluate("()=>{const g=window.__lootnight.S.g.night.game; g.stage='drink'; g.opened=true}"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("()=>{const r=document.getElementById('mcv').getBoundingClientRect(); return [r.left,r.top,r.width/600]}")
        async def W(x, y):
            sx, sy = await pg.evaluate(f"()=>window.__lnScreen({x},{y})"); return r[0] + sx * r[2], r[1] + sy * r[2]
        f = await pg.evaluate("()=>window.__lnFluid()")
        out = {}
        # 1. Space with the can untouched, floating where it rests
        await pg.keyboard.down(' '); await pg.wait_for_timeout(400); out['untouched'] = round((await pg.evaluate("()=>window.__lnFluid()"))['a'], 2); await pg.keyboard.up(' ')
        await pg.wait_for_timeout(1500)
        # 2. one click on the can (press and release), move away from his mouth, then Space
        await pg.mouse.click(*(await W(f['x'], f['y']))); await pg.wait_for_timeout(100)
        await pg.mouse.move(*(await W(260, 120)), steps=5); await pg.wait_for_timeout(300)
        await pg.keyboard.down(' '); await pg.wait_for_timeout(400)
        f2 = await pg.evaluate("()=>window.__lnFluid()"); out['clicked_away'] = {'a': round(f2['a'], 2), 'held': f2['held'], 'x': round(f2['x']), 'y': round(f2['y'])}
        await pg.keyboard.up(' '); await pg.wait_for_timeout(600)
        out['eased_back'] = round((await pg.evaluate("()=>window.__lnFluid()"))['a'], 2)
        out['focus'] = await pg.evaluate("()=>document.activeElement && document.activeElement.tagName")
        print(out, 'ERRORS', errs)
        ok = out['untouched'] > 0.3 and out['clicked_away']['a'] > 0.3 and out['clicked_away']['held'] and out['eased_back'] < out['clicked_away']['a']
        print('PASS' if ok else 'FAIL'); await b.close()
asyncio.run(main())
