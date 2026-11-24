# Skill trees (#53; grid doc §6c): the Skill Tree tab in town, the constellation over the town, hover, buying a node,
# then another hero's tree. Writes test/shots/tree_*.png (the battle area and the side panel at x2).
import asyncio, os
from playwright.async_api import async_playwright
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e) + (e.stack or '')[:300]))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; g.realLifeOff=true; g.mats=260; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map')}")
        await pg.evaluate(GO, 'dbgRogue')
        await pg.wait_for_timeout(400)
        sp = await pg.evaluate("()=>{const r=document.getElementById('spArea').getBoundingClientRect(); return [r.left,r.top,r.width/140]}")
        await pg.mouse.move(sp[0] + 117 * sp[2], sp[1] + 5 * sp[2]); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(500)
        r = await pg.evaluate("()=>{const r=document.getElementById('rpgArea').getBoundingClientRect(); return [r.left,r.top,r.width/334]}")
        clip = {'x': r[0], 'y': r[1], 'width': 334 * r[2] + 280, 'height': 232 * r[2]}
        at = lambda gx, gy: (r[0] + gx * r[2], r[1] + gy * r[2])
        await pg.mouse.move(*at(204, 202)); await pg.wait_for_timeout(500)
        await pg.screenshot(path='test/shots/tree_hover.png', clip=clip)
        # buy g1 then g2 then s2 via the panel's Buy button
        for node in ['g1', 'g2', 's2', 'm1']:
            await pg.mouse.move(*at({'g1': 204, 'g2': 236, 's2': 262, 'm1': 167}[node], {'g1': 202, 'g2': 190, 's2': 170, 'm1': 174}[node]))
            await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(200)
            await pg.mouse.move(r[0] + 334 * r[2] + 140, r[1] + 179 * 2); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(250)
        await pg.mouse.move(*at(167, 52)); await pg.wait_for_timeout(500)
        await pg.screenshot(path='test/shots/tree_bought.png', clip=clip)
        trees = await pg.evaluate("()=>JSON.stringify(window.__lootnight.S.g.trees)+' souls '+window.__lootnight.S.g.mats")
        # Healero's tree
        await pg.mouse.move(r[0] + 334 * r[2] + (4 + 2 * 34 + 16) * 2, r[1] + 35 * 2); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(400)
        await pg.mouse.move(*at(72, 140)); await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/shots/tree_other.png', clip=clip)
        print(trees, 'errors:', errs[:3] or 'none'); await b.close()
asyncio.run(main())
