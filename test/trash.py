# The bag's trash can (#148): at rest in the footer's corner, the lid up with an item in hand, hot with the item over
# it, an item dropped in (gone, the bag one smaller), a locked item refused (it flies back), and a worn piece dragged
# from a gear slot into it. Inventory tab in town, and the party panel in the dungeon. Writes test/shots/trash_*.png.
import asyncio, os
from playwright.async_api import async_playwright
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
fail = 0
def ok(c, what):
    global fail
    print(('ok   ' if c else 'FAIL ') + what)
    if not c: fail += 1
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; g.realLifeOff=true; g.gold=700; g.mats=40; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map')}")
        for a in ['dbgRogue', 'dbgEpic', 'dbgMap', 'dbgEpic']: await pg.evaluate(GO, a)
        await pg.wait_for_timeout(300)
        r = await pg.evaluate("()=>{const r=document.getElementById('spArea').getBoundingClientRect(); return [r.left,r.top,r.width/140]}")
        clip = {'x': r[0], 'y': r[1] + 100 * r[2], 'width': 140 * r[2], 'height': 132 * r[2]}
        at = lambda gx, gy: (r[0] + gx * r[2], r[1] + gy * r[2])
        bag = lambda: pg.evaluate("()=>window.__lootnight.S.g.bag.map(e=>e.id)")
        await pg.mouse.move(*at(4 + 46 + 24, 5)); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(300)   # the Inventory tab
        await pg.mouse.move(*at(40, 60)); await pg.wait_for_timeout(200)
        await pg.screenshot(path='test/shots/trash_rest.png', clip=clip)
        BIN = (4 + 136 - 10, 226)
        # hover the bin: its tooltip
        await pg.mouse.move(*at(*BIN)); await pg.wait_for_timeout(300)
        tip = await pg.evaluate("()=>window.__lootnight ? document.getElementById('spArea') && 1 : 0")
        await pg.screenshot(path='test/shots/trash_tip.png', clip={'x': r[0] - 140 * r[2], 'y': r[1] + 100 * r[2], 'width': 280 * r[2], 'height': 132 * r[2]})
        # pick up the first bag item: the lid lifts
        ids = await bag(); k = 0
        bx, by = 4 + 2 + (k % 6) * 22 + 10, 126 + (k // 6) * 22 + 10
        await pg.mouse.move(*at(bx, by)); await pg.mouse.down(); await pg.mouse.move(*at(bx + 20, by + 20), steps=4); await pg.wait_for_timeout(150)
        await pg.screenshot(path='test/shots/trash_open.png', clip=clip)
        await pg.mouse.move(*at(*BIN), steps=6); await pg.wait_for_timeout(150)
        await pg.screenshot(path='test/shots/trash_hot.png', clip=clip)
        await pg.mouse.up(); await pg.wait_for_timeout(60)
        await pg.screenshot(path='test/shots/trash_clap.png', clip=clip)
        after = await bag()
        ok(ids[0] not in after and len(after) == len(ids) - 1, f'dropped on the bin: the item is gone ({len(ids)} -> {len(after)})')
        feed = await pg.evaluate("()=>(window.__lootnight.S.g.night.log||[]).slice(-3).map(l=>l.text||l[0]||String(l))")
        print('feed:', feed)
        # a locked item: refused, it stays
        await pg.evaluate("()=>{const e=window.__lootnight.S.g.bag.find(e=>e.kind==='item'); e.item.locked=true; window.__lk=e.id}")
        lk = await pg.evaluate("()=>window.__lk"); k = (await bag()).index(lk)
        bx, by = 4 + 2 + (k % 6) * 22 + 10, 126 + (k // 6) * 22 + 10
        await pg.mouse.move(*at(bx, by)); await pg.mouse.down(); await pg.mouse.move(*at(bx + 20, by + 20), steps=4); await pg.mouse.move(*at(*BIN), steps=6); await pg.wait_for_timeout(150)
        await pg.screenshot(path='test/shots/trash_locked.png', clip=clip)
        await pg.mouse.up(); await pg.wait_for_timeout(400)
        ok(lk in await bag(), 'a locked item dropped on the bin stays in the bag')
        # a worn piece, in the dungeon: drag it from its gear slot into the bin
        await pg.mouse.move(*at(4 + 23, 5)); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(300)   # the Town tab: the bin there too
        await pg.mouse.move(*at(40, 40)); await pg.wait_for_timeout(200)
        await pg.screenshot(path='test/shots/trash_town.png', clip=clip)
        # a hero wears something (moved from the bag), then into the dungeon
        await pg.evaluate("()=>{const g=window.__lootnight.S.g, h=g.heroes[0]; g.night.heroTab=0; g.bag.forEach(e=>{if(e.kind==='item')e.item.locked=false}); const i=g.bag.findIndex(e=>e.kind==='item'); if(i>=0){const it=g.bag[i].item; h.gear[it.slot]=it; g.bag.splice(i,1)}}")
        await pg.evaluate(GO, 'portal'); await pg.wait_for_timeout(300)
        worn = await pg.evaluate("()=>{const g=window.__lootnight.S.g, h=g.heroes[g.night.heroTab]; const s=['weapon','helm','armor','boots','ring','trinket'].find(s=>h.gear[s]&&!h.gear[s].locked); return s||''}")
        if worn:
            idx = ['weapon', 'helm', 'armor', 'boots', 'ring', 'trinket'].index(worn)
            gx, gy = 4 + 2 + (idx % 3) * 22 + 10, 67 + (idx // 3) * 22 + 10
            await pg.mouse.move(*at(gx, gy)); await pg.mouse.down(); await pg.mouse.move(*at(gx + 20, gy + 20), steps=4); await pg.mouse.move(*at(*BIN), steps=8); await pg.wait_for_timeout(150)
            await pg.screenshot(path='test/shots/trash_gear.png', clip=clip)
            await pg.mouse.up(); await pg.wait_for_timeout(300)
            gone = await pg.evaluate("s=>{const g=window.__lootnight.S.g, h=g.heroes[g.night.heroTab]; return !h.gear[s]}", worn)
            ok(gone, f'a worn {worn} dragged into the bin is gone')
        else:
            print('note: the hero wears nothing unlocked, gear drag skipped')
        await pg.screenshot(path='test/shots/trash_dungeon.png', clip=clip)
        ok(not errs, 'no page errors ' + str(errs[:2]))
        await b.close()
    print(f'{fail} failed' if fail else 'all passed')
asyncio.run(main())
