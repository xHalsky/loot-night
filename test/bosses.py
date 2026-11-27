# Screenshots: the three bosses mid-move and two packs of the roster (test/*.png). The floor map is test/dmap.py's;
# the bosses beat by beat beside the references, test/v2_stills.py. Run after `npm run build`.
import asyncio, sys
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); const m=/^\\[data-act=\\x22?(\\w+)\\x22?\\](?:\\[data-arg=\\x22?([^\\x22\\]]*)\\x22?\\])?$/.exec(s); if(!e && m){const b=document.createElement('button'); b.dataset.act=m[1]; if(m[2]!=null) b.dataset.arg=m[2]; document.getElementById('stage').appendChild(b); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); b.remove(); return;} e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(120)
CLIP={'x':314,'y':16,'width':948,'height':464}   # the game screen (#49)
async def boss_shot(pg, floor, name, defId, extra):
    # the boss staged mid-move on its floor (the floor flow itself is test/routes.ts's and test/dmap.py's)
    await pg.evaluate("""([f,id,x])=>{const S=window.__lootnight.S; const n=S.g.night; n.floor=f; n.phase='battle'; n.reserve=[]; S.g.timeScale=0;
      n.enemies=[Object.assign({uid:990, defId:id, name:id, hp:1500, maxHp:1700, atk:28, armor:5, speed:8, atb:0, aliveSec:5, stunned:0, boss:true, flash:0, slot:5}, x)]}""", [floor, defId, extra])
    await pg.wait_for_timeout(400)
    await pg.screenshot(path=f'test/{name}.png', clip=CLIP)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.tired=0}")
        await act(pg,'[data-act=portal]')
        # new enemies: a hand-made pack
        await pg.evaluate("()=>{const S=window.__lootnight.S; const n=S.g.night; n.floor=4; S.g.heroes.forEach(h=>{h.level=6})}")
        for _ in range(80):
            await pg.wait_for_timeout(150)
            if await pg.evaluate("()=>window.__lootnight.S.g.night.phase==='battle'"): break
        await pg.evaluate("""()=>{const S=window.__lootnight.S; const n=S.g.night; const L=window.__lootnight;
          const mk=(id,hp)=>({uid:900+Math.random(),defId:id,name:id,hp,maxHp:hp,atk:5,armor:1,speed:0,atb:0,turnsAlive:0,stunned:0,boss:false,flash:0});
          const a=mk('auditor',90); a.name='Confessor'; const s=mk('shelter',180); s.name='Guardian'; s.shield=true; const j=mk('junk',120); j.name='Cherubs'; j.per=24; j.hp=90;
          n.enemies=[s,a,j]; S.g.timeScale=0;}""")
        await pg.wait_for_timeout(250)
        await pg.screenshot(path='test/enemies_new.png', clip=CLIP)
        await pg.evaluate("""()=>{const S=window.__lootnight.S; const n=S.g.night;
          const mk=(id,hp)=>({uid:950+Math.random(),defId:id,name:{collector:'Revenant',skeleton:'Hollow',bat:'Ironwing'}[id],hp,maxHp:hp,atk:5,armor:1,speed:0,atb:0,turnsAlive:0,stunned:0,boss:false,flash:0});
          n.enemies=[mk('collector',120),mk('skeleton',80),mk('bat',50)]; S.g.timeScale=0;}""")
        await pg.wait_for_timeout(250)
        await pg.screenshot(path='test/enemies_basic.png', clip=CLIP)
        await boss_shot(pg, 5, 'boss_ogre', 'bailiff', {'wind': 1.5, 'windMax': 3})          # the Gaoler whirling the ball (Smash)
        await boss_shot(pg, 10, 'boss_shark', 'shark', {'wind': 1.2, 'windMax': 2})          # the Bellringer hauling the rope (Summon)
        await boss_shot(pg, 15, 'boss_landlord', 'landlord', {'wind': 0.3, 'windMax': 3, 'evict': 3})   # the Inquisitor's sword raised (Execute)
        print('ERRORS', errs)
        await b.close()
        if errs: sys.exit(1)
asyncio.run(main())
