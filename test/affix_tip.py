# Screenshot: item tooltips with a real-life affix and a cross-system affix.
import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(120)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("""()=>{const S=window.__lootnight.S; const n=S.g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9;
          S.g.bag.push({kind:'item',id:'t1',item:{id:'t1',name:'Arcane Circlet of Vigilance',slot:'helm',rarity:'epic',ilvl:8,affixes:[{stat:'hp',amount:88},{stat:'armor',amount:9.1},{stat:'luck',amount:5.2},{stat:'speed',amount:-2.1}],value:300,identified:true,special:'earplugs'}});
          S.g.bag.push({kind:'item',id:'t2',item:{id:'t2',name:'Audited Tax Axe of the Headset Hero',slot:'weapon',rarity:'rare',ilvl:8,affixes:[{stat:'atk',amount:19.4},{stat:'crit',amount:4.1},{stat:'armor',amount:-4.2}],value:200,identified:true,special:'headset',specialAmt:7.5}});
          S.g.timeScale=0;}""")
        await pg.wait_for_timeout(300)
        for i, tid in enumerate(['t1','t2']):
            bb = await pg.evaluate(f"()=>{{const r=document.querySelector('[data-item=\"bag:{tid}\"]').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]}}")
            await pg.mouse.move(bb[0], bb[1]); await pg.wait_for_timeout(250)
            await pg.screenshot(path=f'test/affix_tip{i+1}.png', clip={'x':640,'y':200,'width':640,'height':520})
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
