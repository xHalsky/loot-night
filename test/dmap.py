# The floor map as the route choice (#52, 1.5): three paths with a map card, a condition hovered, the away timer
# half run, the boss floor. Writes test/shots/dmap_*.png (the battle area at x2).
import asyncio, os
from playwright.async_api import async_playwright
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
CASES = [  # name, floor just cleared, the cards (None: as generated), card hovered, seconds away
  ('three', 7, None, 1, 0),
  ('condition', 3, [{'feat': 'altar', 'cond': 'cursed'}, {'cond': 'silent'}], 0, 0),
  ('away', 3, [{'feat': 'altar', 'cond': 'cursed'}, {'cond': 'silent'}], -1, 2.5),
  ('boss', 9, None, 0, 0),
]
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; g.realLifeOff=true; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map')}")
        await pg.evaluate(GO, 'portal'); await pg.wait_for_timeout(300)
        await pg.evaluate(GO, 'dbgMap'); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.dropQueue.forEach(e=>window.__lootnight.S.g.bag.push(e)); n.dropQueue=[]}")
        for name, floor, cards, hov, away in CASES:
            await pg.mouse.move(5, 5)
            await pg.evaluate("f=>{const n=window.__lootnight.S.g.night; n.monitor='rpg'; n.floor=f; n.phase='walk'}", floor)
            await pg.evaluate(GO, 'dbgFloor'); await pg.wait_for_timeout(200)
            if cards: await pg.evaluate("c=>{const n=window.__lootnight.S.g.night; n.paths=c; n.safest=1}", cards)
            if away: await pg.evaluate("a=>{window.__lootnight.S.g.night.mapAway=a}", away)
            r = await pg.evaluate("()=>{const r=document.getElementById('rpgArea').getBoundingClientRect(); return [r.left,r.top,r.width/334]}")
            if hov >= 0:
                k = await pg.evaluate("()=>window.__lootnight.S.g.night.paths.length")
                x = {1: [118], 2: [68, 169], 3: [17, 118, 219]}[k][hov] + 49
                await pg.mouse.move(r[0] + x * r[2], r[1] + 180 * r[2])
            await pg.wait_for_timeout(900)
            await pg.screenshot(path=f'test/shots/dmap_{name}.png', clip={'x': r[0], 'y': r[1], 'width': 334 * r[2], 'height': 232 * r[2]})
        print('errors:', errs[:3] or 'none'); await b.close()
asyncio.run(main())
