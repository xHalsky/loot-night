# Screenshot: party panel with Power on portraits, rebuilt equip window and stat block; item tooltip with Power change.
import asyncio, json
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(120)
GEAR = """()=>{const S=window.__lootnight.S; let id=1000;
 const mk=(slot,rarity,ilvl,affixes)=>({id:'t'+(id++),name:rarity[0].toUpperCase()+rarity.slice(1)+' '+slot,slot,rarity,ilvl,affixes,value:ilvl*20,identified:true});
 const [k,m,h]=S.g.heroes; k.level=6; m.level=6; h.level=5;
 k.gear={weapon:mk('weapon','epic',8,[{stat:'atk',amount:14},{stat:'crit',amount:3}]),helm:mk('helm','rare',7,[{stat:'hp',amount:40}]),armor:mk('armor','rare',6,[{stat:'armor',amount:6}]),boots:mk('boots','uncommon',5,[{stat:'speed',amount:2}]),ring:mk('ring','rare',7,[{stat:'crit',amount:4}]),trinket:mk('trinket','uncommon',4,[{stat:'luck',amount:3}])};
 m.gear={weapon:mk('weapon','rare',7,[{stat:'atk',amount:11}]),helm:mk('helm','uncommon',5,[{stat:'hp',amount:22}]),ring:mk('ring','uncommon',4,[{stat:'crit',amount:2}])};
 h.gear={weapon:mk('weapon','common',2,[{stat:'atk',amount:3}])};
 S.g.bag.push({kind:'item',id:'b1',item:mk('armor','epic',8,[{stat:'armor',amount:9},{stat:'hp',amount:30}])});
 S.g.bag.push({kind:'item',id:'b2',item:mk('boots','legendary',9,[{stat:'speed',amount:4},{stat:'hp',amount:20}])});
 S.g.night.heroTab=2; S.g.night.nextInterruptAt=1e9; S.g.night.dog.next=1e9; S.g.night.apt.lastVisitEnd=1e9;}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]')
        await pg.evaluate(GEAR); await pg.wait_for_timeout(300)
        bb = await pg.evaluate("()=>{const r=document.querySelector('[data-item=\"bag:b1\"]').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]}")
        await pg.screenshot(path='test/party_full3.png', clip={'x':960,'y':0,'width':320,'height':720})
        await pg.mouse.move(bb[0], bb[1]); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/party_power3.png', clip={'x':700,'y':200,'width':580,'height':520})
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
