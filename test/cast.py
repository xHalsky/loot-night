# The cast of 2026-11-27 (Dutch, Hixx, Hudzor, Arkbishop) and their classes on every screen that names a hero: the
# battle card over a hovered hero, a portrait's tooltip, the party cards, the party tab's strip, the tree (header and
# strip), the Appraiser's reveal of a legendary, the item window's equip buttons, and the feed.
# Writes test/shots/cast_*.png and checks the names in the views.
import asyncio, os
from playwright.async_api import async_playwright
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
fails = []
def check(ok, msg): print(('ok   ' if ok else 'FAIL ') + msg); (None if ok else fails.append(msg))
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e) + (e.stack or '')[:300]))
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; g.realLifeOff=true; g.gold=900; g.mats=40; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map'); g.heroes.forEach(h=>h.level=6)}")
        names = await pg.evaluate("()=>window.__lootnight.S.g.heroes.map(h=>h.name+'/'+h.role).join(',')")
        check(names == 'Dutch/Knight,Hixx/Rogue,Hudzor/Mage,Arkbishop/Priest', f'a new game: names and classes ({names})')
        r = await pg.evaluate("()=>{const r=document.getElementById('rpgArea').getBoundingClientRect(); return [r.left,r.top,r.width/334]}")
        sp = await pg.evaluate("()=>{const r=document.getElementById('spArea').getBoundingClientRect(); return [r.left,r.top,r.width/140]}")
        clip = {'x': r[0], 'y': r[1], 'width': 334 * r[2] + 280, 'height': 232 * r[2]}
        at = lambda gx, gy: (r[0] + gx * r[2], r[1] + gy * r[2])
        pat = lambda px, py: (sp[0] + px * sp[2], sp[1] + py * sp[2])
        async def click(x, y): await pg.mouse.move(x, y); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(300)
        # the tree: header in the battle area, strip in the panel
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.townTab='tree'; n.treeHero='healer'}"); await pg.wait_for_timeout(700)
        await pg.screenshot(path='test/shots/cast_tree.png', clip=clip)
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.townTab='town'}"); await pg.wait_for_timeout(300)
        # the Appraiser reveals a legendary of the priest's
        await pg.evaluate("""()=>{const g=window.__lootnight.S.g; g.bag.push({kind:'item',id:'L1',item:{id:'L1',name:'Ash Choir',slot:'weapon',rarity:'legendary',ilvl:6,affixes:[{stat:'atk',amount:6}],value:90,identified:false,legend:'ashchoir'}})}""")
        await click(*at(30, 30))    # the appraiser
        k = await pg.evaluate("()=>window.__lootnight.S.g.bag.findIndex(e=>e.id==='L1')")
        await click(*pat(4 + 2 + (k % 6) * 22 + 10, 36 + (k // 6) * 22 + 10)); await click(*pat(70, 138))
        await pg.wait_for_timeout(2300)
        await pg.screenshot(path='test/shots/cast_reveal.png', clip=clip)
        # the dungeon: the party tab, a portrait's tooltip, then a hovered hero's card in the fight
        await pg.evaluate(GO, 'portal'); await pg.wait_for_timeout(300)
        for _ in range(60):
            if await pg.evaluate("()=>window.__lootnight.S.g.night.phase==='battle'"): break
            await pg.wait_for_timeout(250)
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.enemies.forEach(e=>{e.hp=e.maxHp=99999; e.atk=1})}")
        await pg.mouse.move(*pat(4 + 3 * 34 + 16, 30)); await pg.wait_for_timeout(600)
        await pg.screenshot(path='test/shots/cast_portrait_tip.png', clip=clip)
        await pg.mouse.move(*pat(4 + 1 * 34 + 16, 30)); await pg.wait_for_timeout(600)
        await pg.screenshot(path='test/shots/cast_portrait_tip_rogue.png', clip=clip)
        await pg.mouse.move(*at(87, 175)); await pg.wait_for_timeout(600)
        await pg.screenshot(path='test/shots/cast_card.png', clip=clip)
        # the item window: one equip button per hero, the class under the name
        await pg.mouse.move(5, 5)
        await pg.evaluate("""()=>{const g=window.__lootnight.S.g; g.bag.push({kind:'item',id:'E1',item:{id:'E1',name:'Grave Ring',slot:'ring',rarity:'rare',ilvl:6,affixes:[{stat:'crit',amount:4}],value:30,identified:true}})}""")
        k = await pg.evaluate("()=>window.__lootnight.S.g.bag.findIndex(e=>e.id==='E1')")
        await pg.evaluate("k=>{const n=window.__lootnight.S.g.night; n.selected=window.__lootnight.S.g.bag[k].id}", k); await pg.wait_for_timeout(500)
        await pg.screenshot(path='test/shots/cast_equip.png', clip={'x': sp[0] - 10, 'y': sp[1], 'width': 300, 'height': 470})
        eq = await pg.evaluate("()=>Array.from(document.querySelectorAll('.pop-eq-btn')).map(b=>b.querySelector('b').textContent+'/'+(b.querySelector('i')?.textContent||'')).join(',')")
        check(eq in ('Dutch/Knight,Hixx/Rogue,Hudzor/Mage,Arkbishop/Priest'), f'equip buttons: name over class ({eq or "window not open"})')
        # the feed: a few real lines (down, revived, level up)
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.selected=null}")
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; const h=g.heroes.find(h=>h.id==='healer'); h.hp=1; const n=g.night; n.enemies.forEach(e=>{e.atk=999})}")
        await pg.wait_for_timeout(2500)
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.enemies.forEach(e=>{e.atk=1})}")
        log = await pg.evaluate("()=>window.__lootnight.S.g.night.log.map(l=>l.tag+' '+l.text).join(' | ')")
        check('Arkbishop (Priest) is down!' in log, 'the feed: "Arkbishop (Priest) is down!"')
        d = await pg.evaluate("()=>{const r=document.getElementById('rsArea').getBoundingClientRect(); return [r.left,r.top,r.width/492]}")
        await pg.screenshot(path='test/shots/cast_feed.png', clip={'x': d[0] + 350 * d[2], 'y': d[1] + 292 * d[2], 'width': 142 * d[2], 'height': 68 * d[2]})
        # an old save (the old cast's names, the priest's old role) keeps working: its heroes come back with the new names
        await pg.evaluate("()=>{const k='lootnight.save.v3'; window.__lootnight.S.g.night && 0; const g=window.__lootnight.S.g, d={v:1}; for (const f of ['heroes','bag','bagSize','gold','mats','day','nightsPlayed','tipsSeen']) d[f]=JSON.parse(JSON.stringify(g[f])); const old={knight:'Knightenstein',rogue:'Garrote',mage:'Magoo',healer:'Healero'}; d.heroes.forEach(h=>{h.name=old[h.id]; if(h.id==='healer') h.role='Healer'}); localStorage.setItem(k, JSON.stringify(d))}")
        had = await pg.evaluate("()=>!!localStorage.getItem('lootnight.save.v3')")
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'continue'); await pg.wait_for_timeout(400)
        back = await pg.evaluate("()=>window.__lootnight.S.g.heroes.map(h=>h.id+':'+h.name+'/'+h.role).join(',')")
        check(had and back == 'knight:Dutch/Knight,rogue:Hixx/Rogue,mage:Hudzor/Mage,healer:Arkbishop/Priest', f'an old save loads with the new cast, ids kept ({back})')
        print('errors:', errs[:3] or 'none'); await b.close()
    if fails: raise SystemExit(f'{len(fails)} failed')
asyncio.run(main())
