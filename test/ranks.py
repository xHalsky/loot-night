# Marching order (#52, 1.6) and Garrote (1.7): the four in a fight with auras, a hovered hero's card after a Hook,
# a drag in progress, Shove's wind-up. Writes test/shots/ranks_*.png (the battle area at x2).
import asyncio, os
from playwright.async_api import async_playwright
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e) + (e.stack or '')[:400]))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; g.realLifeOff=true; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map'); g.heroes.forEach(h=>h.level=6)}")
        await pg.evaluate(GO, 'dbgRogue'); await pg.evaluate(GO, 'portal'); await pg.wait_for_timeout(300)
        r = await pg.evaluate("()=>{const r=document.getElementById('rpgArea').getBoundingClientRect(); return [r.left,r.top,r.width/334]}")
        clip = {'x': r[0], 'y': r[1], 'width': 334 * r[2], 'height': 232 * r[2]}
        at = lambda gx, gy: (r[0] + gx * r[2], r[1] + gy * r[2])
        # wait for the first battle
        for _ in range(60):
            if await pg.evaluate("()=>window.__lootnight.S.g.night.phase==='battle'"): break
            await pg.wait_for_timeout(250)
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.enemies.forEach(e=>{e.hp=e.maxHp=99999; e.atk=1})}")
        await pg.wait_for_timeout(600)
        await pg.screenshot(path='test/shots/ranks_four.png', clip=clip)
        # a Hook: Healero to the front, then hover him
        await pg.evaluate(GO, 'dbgHook'); await pg.wait_for_timeout(450)
        await pg.screenshot(path='test/shots/ranks_hooked.png', clip=clip)
        await pg.wait_for_timeout(900)
        await pg.mouse.move(*at(126, 175)); await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/shots/ranks_card.png', clip=clip)
        # drag Healero's portrait (rank 1, bar x 6) onto the last group's portrait (x 252)
        await pg.mouse.move(*at(17, 219)); await pg.mouse.down()
        await pg.mouse.move(*at(120, 219), steps=6); await pg.mouse.move(*at(262, 219), steps=8); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/shots/ranks_drag.png', clip=clip)
        await pg.mouse.up(); await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/shots/ranks_swap.png', clip=clip)
        order = await pg.evaluate("()=>window.__lootnight.S.g.heroes.map(h=>h.id).join(',')")
        print('order after drag:', order)
        await pg.mouse.move(5, 5); await pg.wait_for_timeout(1200)
        # Shove wind-up on an enemy
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; const e=n.enemies.find(e=>e.hp>0&&!e.boss); e.defId='brute'; e.name='Brute'; e.wind=e.windMax=1; }")
        await pg.wait_for_timeout(500)
        await pg.screenshot(path='test/shots/ranks_shove.png', clip=clip)
        await pg.wait_for_timeout(1500)
        order2 = await pg.evaluate("()=>window.__lootnight.S.g.heroes.map(h=>h.id).join(',')")
        print('order after shove:', order2, 'errors:', errs[:3] or 'none'); await b.close()
asyncio.run(main())
