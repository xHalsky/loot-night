# The town in the redesign's look (V2, #53; grid doc §6, §6b): Ravenhold with a building hovered, a plot clicked (its
# build row lit), the Salvage Forge and the Merchant in the panel with items picked, and the Appraiser's reveal.
# Writes test/shots/town_*.png.
import asyncio, os
from playwright.async_api import async_playwright
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
ITEMS = """()=>{const g=window.__lootnight.S.g, mk=(id,slot,r,ident,name)=>({kind:'item',id,item:{id,name,slot,rarity:r,ilvl:4,affixes:[{stat:'atk',amount:9}],value:40,identified:ident}});
 g.bag.push(mk('a','weapon','common',true,'Worn Sword'),mk('b','helm','uncommon',true,'Iron Helm'),mk('c','ring','rare',true,'Runed Band'),mk('d','armor','epic',false,'Shadow Robe'),mk('e','boots','legendary',false,'x'));
 g.bag[3].item.affixes=[{stat:'armor',amount:12},{stat:'hp',amount:30},{stat:'speed',amount:-1.5}]; g.bag[3].item.special='quick';}"""
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e) + (e.stack or '')[:300]))
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; g.realLifeOff=true; g.gold=700; g.mats=40; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map')}")
        await pg.evaluate(ITEMS); await pg.wait_for_timeout(1200)
        r = await pg.evaluate("()=>{const r=document.getElementById('rpgArea').getBoundingClientRect(); return [r.left,r.top,r.width/334]}")
        sp = await pg.evaluate("()=>{const r=document.getElementById('spArea').getBoundingClientRect(); return [r.left,r.top,r.width/140]}")
        clip = {'x': r[0], 'y': r[1], 'width': 334 * r[2] + 280, 'height': 232 * r[2]}
        at = lambda gx, gy: (r[0] + gx * r[2], r[1] + gy * r[2])
        pat = lambda px, py: (sp[0] + px * sp[2], sp[1] + py * sp[2])
        async def click(x, y): await pg.mouse.move(x, y); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(300)
        await pg.mouse.move(*at(30, 40)); await pg.wait_for_timeout(600)
        await pg.screenshot(path='test/shots/town_hover.png', clip=clip)
        await click(*at(104, 40)); await pg.mouse.move(*at(160, 120)); await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/shots/town_plot.png', clip=clip)
        await click(*at(220, 160))   # the forge
        for k in [0, 1]: await click(*pat(4 + 2 + (k % 6) * 22 + 10, 36 + (k // 6) * 22 + 10))
        await pg.screenshot(path='test/shots/town_forge.png', clip=clip)
        await click(*pat(70, 138))   # Salvage 2
        await click(*at(230, 100))   # the merchant
        await click(*pat(4 + 2 + 0 * 22 + 10, 36 + 10))   # the Runed Band (the forge took the first two)
        await pg.screenshot(path='test/shots/town_merchant.png', clip=clip)
        await click(*pat(70, 138))   # Sell 1
        await click(*at(30, 30))    # the appraiser
        k = await pg.evaluate("()=>window.__lootnight.S.g.bag.findIndex(e=>e.kind==='item'&&!e.item.identified)")
        await click(*pat(4 + 2 + (k % 6) * 22 + 10, 36 + (k // 6) * 22 + 10))
        await click(*pat(70, 138))   # Identify
        await pg.wait_for_timeout(700)
        await pg.screenshot(path='test/shots/town_looking.png', clip=clip)
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path='test/shots/town_reveal.png', clip=clip)
        state = await pg.evaluate("()=>{const g=window.__lootnight.S.g; return 'bag '+g.bag.length+' gold '+g.gold+' souls '+g.mats+' identified '+g.bag.filter(e=>e.kind==='item'&&e.item.identified).length}")
        print(state, 'errors:', errs[:3] or 'none'); await b.close()
        assert state == 'bag 2 gold 700 souls 43 identified 1', state   # 2 melted (+1 +2), the band sold (+40), the robe identified (-40)
asyncio.run(main())
