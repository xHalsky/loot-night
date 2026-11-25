# Screenshot: an enraged boss, with the Loved and Good Boy buffs on the bar.
import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); const m=/^\\[data-act=\\x22?(\\w+)\\x22?\\](?:\\[data-arg=\\x22?([^\\x22\\]]*)\\x22?\\])?$/.exec(s); if(!e && m){const b=document.createElement('button'); b.dataset.act=m[1]; if(m[2]!=null) b.dataset.arg=m[2]; document.getElementById('stage').appendChild(b); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); b.remove(); return;} e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.tired=0; n.apt.t=999}")
        await act(pg,'[data-act=portal]'); await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{const S=window.__lootnight.S; const n=S.g.night; n.floor=5; n.battleIdx=2; n.phase='walk'; n.phaseT=99; n.enemies=[]; S.g.heroes.forEach(h=>{h.level=6; h.hp=9999})}")
        for _ in range(60):
            await pg.wait_for_timeout(150)
            if await pg.evaluate("()=>window.__lootnight.S.g.night.enemies.some(e=>e.boss)"): break
        await pg.evaluate("""()=>{const S=window.__lootnight.S; const n=S.g.night; const bo=n.enemies.find(e=>e.boss); bo.hp=Math.round(bo.maxHp*0.2); bo.enraged=true;
          n.partyBuffs.push({name:'Loved',dmg:0.15,speed:0,crit:10,t:1,max:1,icon:'loved',fights:1}); n.goodDog=40; S.g.timeScale=0;}""")
        await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/echo_enrage.png', clip={'x':300,'y':14,'width':680,'height':420})
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
