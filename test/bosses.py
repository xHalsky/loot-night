# Screenshots: the three bosses mid-move, the new enemy types, and the node map with the new maps.
import asyncio, sys
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(120)
CLIP={'x':300,'y':14,'width':680,'height':470}
async def boss_shot(pg, floor, name, cond):
    await pg.evaluate("f=>{const S=window.__lootnight.S; const n=S.g.night; n.floor=f; n.battleIdx=2; n.phase='walk'; n.phaseT=0; n.enemies=[]; S.g.timeScale=1; S.g.heroes.forEach(h=>{h.level=9; h.hp=9999; h.downed=false})}", floor)
    for _ in range(150):
        await pg.wait_for_timeout(150)
        if await pg.evaluate(cond): break
    await pg.evaluate("()=>{window.__lootnight.S.g.timeScale=0}"); await pg.wait_for_timeout(200)
    await pg.screenshot(path=f'test/{name}.png', clip=CLIP)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.tired=0}")
        await act(pg,'[data-act=portal]')
        # new enemies: a hand-made pack
        await pg.evaluate("()=>{const S=window.__lootnight.S; const n=S.g.night; n.floor=4; S.g.heroes.forEach(h=>{h.level=6})}")
        for _ in range(80):
            await pg.wait_for_timeout(150)
            if await pg.evaluate("()=>window.__lootnight.S.g.night.phase==='battle'"): break
        await pg.evaluate("""()=>{const S=window.__lootnight.S; const n=S.g.night; const L=window.__lootnight;
          const mk=(id,hp)=>({uid:900+Math.random(),defId:id,name:id,hp,maxHp:hp,atk:5,armor:1,speed:0,atb:0,turnsAlive:0,stunned:0,boss:false,flash:0});
          const a=mk('auditor',90); a.name='The Auditor'; const s=mk('shelter',180); s.name='Tax Shelter'; s.shield=true; const j=mk('junk',120); j.name='Junk Mail'; j.per=24; j.hp=90;
          n.enemies=[s,a,j]; S.g.timeScale=0;}""")
        await pg.wait_for_timeout(250)
        await pg.screenshot(path='test/enemies_new.png', clip=CLIP)
        await boss_shot(pg, 10, 'boss_shark', "()=>window.__lootnight.S.g.night.enemies.some(e=>e.boss&&e.wind>0.5)")
        await boss_shot(pg, 15, 'boss_landlord', "()=>window.__lootnight.S.g.night.enemies.some(e=>e.boss&&e.wind>1&&e.evict!==undefined)")
        # node map with all map kinds in the bag
        await pg.evaluate("""()=>{const S=window.__lootnight.S; const n=S.g.night; ['cursed','goblin','vault','elite','shrine'].forEach((m,i)=>S.g.bag.push({kind:'map',id:'m'+i,map:m})); n.floor=9; n.enemies=[]; n.phase='mapChoice'; S.g.timeScale=0;}""")
        await pg.wait_for_timeout(250)
        bb = await pg.evaluate("()=>{const r=[...document.querySelectorAll('.mnode')][1].getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]}")
        await pg.mouse.move(bb[0], bb[1]); await pg.wait_for_timeout(250)
        await pg.screenshot(path='test/nodemap_maps.png', clip=CLIP)
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
