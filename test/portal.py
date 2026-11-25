# The Town portal plate (0.62.1): what it banks on the plate, wide enough for it, in the battle corner and on the
# floor map; empty run ("15 min") and a big one ("bank 12 · 1240 g"). Writes test/shots/portal_*.png.
import asyncio, os
from playwright.async_api import async_playwright
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
HAUL = """([n, gold])=>{const g=window.__lootnight.S.g; for(let k=0;k<n;k++) g.bag.push({kind:'item',id:'u'+k,run:true,item:{id:'u'+k,name:'Loot',slot:'helm',rarity:'common',ilvl:4,affixes:[{stat:'atk',amount:5}],value:30,identified:true}}); g.night.run.gold=gold}"""
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; g.realLifeOff=true; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map')}")
        await pg.evaluate(GO, 'portal'); await pg.wait_for_timeout(400)
        r = await pg.evaluate("()=>{const r=document.getElementById('rpgArea').getBoundingClientRect(); return [r.left,r.top]}")
        corner = {'x': r[0], 'y': r[1], 'width': 200, 'height': 110}
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.phase='walk'}"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/shots/portal_empty.png', clip=corner)
        await pg.evaluate(HAUL, [12, 1240]); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/shots/portal_big.png', clip=corner)
        await pg.evaluate(GO, 'dbgFloor'); await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/shots/portal_map.png', clip={'x': r[0], 'y': r[1], 'width': 668, 'height': 464})
        # the plate's whole width answers the click: its right end, past the old 54 px, goes to town
        hit = await pg.evaluate("()=>{const r=document.getElementById('rpgArea').getBoundingClientRect(); return [r.left,r.top,r.width/334]}")
        x, y = hit[0] + (334 - 18 - 3) * hit[2], hit[1] + 25 * hit[2]
        await pg.mouse.move(x, y); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(500)
        loc = await pg.evaluate("()=>window.__lootnight.S.g.night.location+' '+(window.__lootnight.S.g.night.switching?'':'')")
        print("after clicking the plate's right end:", loc, 'errors:', errs or 'none'); await b.close()
asyncio.run(main())
