# The side panel in the renderer (V2 with #53; grid doc §5, §6b): the Town tab, the Inventory tab, the party in the
# dungeon, an item dragged from the bag onto a gear slot, and the item window. Writes test/shots/panel_*.png.
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
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; g.realLifeOff=true; g.gold=700; g.mats=40; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map')}")
        await pg.evaluate(GO, 'dbgRogue'); await pg.evaluate(GO, 'dbgEpic'); await pg.evaluate(GO, 'dbgMap')
        for _ in range(4): await pg.evaluate(GO, 'dbgDrop') if False else None
        await pg.wait_for_timeout(400)
        r = await pg.evaluate("()=>{const r=document.getElementById('spArea').getBoundingClientRect(); return [r.left,r.top,r.width/140]}")
        clip = {'x': r[0] - 668, 'y': r[1], 'width': 668 + 280, 'height': 464}
        at = lambda gx, gy: (r[0] + gx * r[2], r[1] + gy * r[2])
        await pg.screenshot(path='test/shots/panel_town.png', clip=clip)
        await pg.mouse.move(*at(4 + 46 + 24, 5)); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/shots/panel_inventory.png', clip=clip)
        # into the dungeon: items drop, walk picks them up
        await pg.mouse.move(*at(70, 113)); await pg.wait_for_timeout(100)
        await pg.evaluate(GO, 'portal'); await pg.wait_for_timeout(300)
        for k in range(3): await pg.evaluate(GO, 'dbgEpic')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; const n=g.night; n.dropQueue.forEach(e=>g.bag.push(e)); n.dropQueue=[]; n.floorLoot.forEach(l=>g.bag.push(l.entry)); n.floorLoot=[]; g.bag.forEach(e=>{if(e.kind==='item'){e.item.identified=true}})}")
        await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/shots/panel_dungeon.png', clip=clip)
        # drag the first bag item onto the weapon slot (or whichever slot it is)
        slot = await pg.evaluate("()=>{const e=window.__lootnight.S.g.bag.find(e=>e.kind==='item'); return e?e.item.slot+'|'+e.id:''}")
        print('dragging', slot)
        sl, iid = slot.split('|')
        idx = ['weapon', 'helm', 'armor', 'boots', 'ring', 'trinket'].index(sl)
        k = await pg.evaluate("id=>window.__lootnight.S.g.bag.findIndex(e=>e.id===id)", iid)
        bx, by = 4 + 2 + (k % 6) * 22 + 10, 126 + (k // 6) * 22 + 10
        gx, gy = 4 + 2 + (idx % 3) * 22 + 10, 67 + (idx // 3) * 22 + 10
        await pg.mouse.move(*at(bx, by)); await pg.mouse.down(); await pg.mouse.move(*at(bx + 20, by - 20), steps=4); await pg.mouse.move(*at(gx, gy), steps=6)
        await pg.screenshot(path='test/shots/panel_drag.png', clip=clip)
        await pg.mouse.up(); await pg.wait_for_timeout(300)
        worn = await pg.evaluate("s=>{const g=window.__lootnight.S.g; const h=g.heroes[g.night.heroTab]; return h.name+' '+(h.gear[s]?h.gear[s].name:'none')}", sl)
        # click a bag item: the item window
        await pg.mouse.move(*at(4 + 2 + 10, 126 + 10)); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/shots/panel_window.png', clip=clip)
        print('worn:', worn, 'errors:', errs[:3] or 'none'); await b.close()
asyncio.run(main())
