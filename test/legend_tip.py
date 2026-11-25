# Loot rules (#52, 1.8): the tooltips of a legendary and a set piece in the bag. Writes test/shots/legend_*.png.
import asyncio, os
from playwright.async_api import async_playwright
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
ITEMS = """()=>{const g=window.__lootnight.S.g;
 g.bag.push({kind:'item',id:'L1',item:{id:'L1',name:'Frostbinder',slot:'weapon',rarity:'legendary',ilvl:6,affixes:[{stat:'atk',amount:41.2},{stat:'crit',amount:9.1},{stat:'speed',amount:2.6},{stat:'hp',amount:-31}],value:300,identified:true,legend:'frostbinder'}});
 g.bag.push({kind:'item',id:'S1',item:{id:'S1',name:'Ironwake Plate',slot:'armor',rarity:'epic',ilvl:6,affixes:[{stat:'armor',amount:17.3},{stat:'hp',amount:48.2},{stat:'speed',amount:-2.1}],value:200,identified:true,set:'ironwake',special:'sweet',specialAmt:8}});
 g.heroes[0].gear.weapon={id:'S2',name:'Ironwake Sword',slot:'weapon',rarity:'epic',ilvl:6,affixes:[{stat:'atk',amount:30}],value:1,identified:true,set:'ironwake'};}"""
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
        await pg.evaluate(ITEMS); await pg.wait_for_timeout(300)
        sp = await pg.evaluate("()=>{const r=document.getElementById('spArea').getBoundingClientRect(); return [r.left,r.top,r.width/140]}")
        for k, iid in [('legendary', 'L1'), ('set', 'S1')]:
            i = await pg.evaluate("id=>window.__lootnight.S.g.bag.findIndex(e=>e.id===id)", iid)
            await pg.mouse.move(sp[0] + (4 + 2 + (i % 6) * 22 + 10) * sp[2], sp[1] + (126 + (i // 6) * 22 + 10) * sp[2]); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'test/shots/legend_{k}.png', clip={'x': 640, 'y': 0, 'width': 640, 'height': 480})
        print('errors:', errs[:2] or 'none'); await b.close()
asyncio.run(main())
