# The drag ghost (#111): an item picked up from the side panel looks like its own cell in the bag (the panel's pixels at
# the grid's x2), not the generic slot icon. Writes test/shots/ghost_*.png.
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
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await pg.evaluate("""()=>{const g=window.__lootnight.S.g; g.realLifeOff=true; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map');
          const mk=(id,slot,r,name)=>({kind:'item',id,item:{id,name,slot,rarity:r,ilvl:4,affixes:[{stat:'atk',amount:9}],value:40,identified:true}});
          g.bag.push(mk('a','weapon','rare','Bone Dagger'),mk('b','helm','epic','Shadow Hood'),mk('c','ring','uncommon','Grave Ring')); g.night.townTab='inv'}""")
        await pg.wait_for_timeout(800)
        sp = await pg.evaluate("()=>{const r=document.getElementById('spArea').getBoundingClientRect(); return [r.left,r.top,r.width/140]}")
        await pg.evaluate(GO, 'portal'); await pg.wait_for_timeout(1500)
        pat = lambda px, py: (sp[0] + px * sp[2], sp[1] + py * sp[2])
        # bag in the dungeon: party tab, bag from y 113+13
        for k in [0, 1]:
            x, y = pat(4 + 2 + k * 22 + 10, 126 + 10)
            await pg.mouse.move(x, y); await pg.mouse.down(); await pg.mouse.move(x - 60, y - 40, steps=6); await pg.wait_for_timeout(200)
            await pg.screenshot(path=f'test/shots/ghost_{k}.png', clip={'x': x - 160, 'y': y - 110, 'width': 260, 'height': 160})
            info = await pg.evaluate("()=>{const gh=document.getElementById('ghost'); return [gh.className, gh.innerHTML.slice(0,60), gh.style.display]}")
            check(info[0] == 'cell' and info[1].startswith('<canvas width="23" height="23"') and info[2] == 'block', f'item {k}: the ghost is its own 21 x 21 cell in a 1 px border ({info[0]})')
            px = await pg.evaluate("()=>{const c=document.querySelector('#ghost canvas'); const d=c.getContext('2d').getImageData(1,1,21,21).data; let n=0; for(let i=3;i<d.length;i+=4) if(d[i]) n++; return n}")
            check(px > 300, f'item {k}: the copy has the cell\'s pixels ({px})')
            await pg.mouse.move(x, y, steps=3); await pg.mouse.up(); await pg.wait_for_timeout(300)
        check(not errs, f'no page errors {errs[:1]}'); await b.close()
    if fails: raise SystemExit(f'{len(fails)} failed')
asyncio.run(main())
