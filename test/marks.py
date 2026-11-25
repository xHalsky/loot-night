# Screenshots: ability marks under the enemies, combo glow on the skill bar, a skill tooltip with mark words.
import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); const m=/^\\[data-act=\\x22?(\\w+)\\x22?\\](?:\\[data-arg=\\x22?([^\\x22\\]]*)\\x22?\\])?$/.exec(s); if(!e && m){const b=document.createElement('button'); b.dataset.act=m[1]; if(m[2]!=null) b.dataset.arg=m[2]; document.getElementById('stage').appendChild(b); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); b.remove(); return;} e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(120)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9;}")
        await act(pg,'[data-act=portal]')
        await pg.evaluate("()=>{const S=window.__lootnight.S; S.g.heroes.forEach(h=>{h.level=5})}")
        for _ in range(80):
            await pg.wait_for_timeout(200)
            ok = await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; return n.phase==='battle' && n.enemies.filter(e=>e.hp>0).length>=2}")
            if ok: break
        await pg.evaluate("""()=>{const S=window.__lootnight.S; const n=S.g.night; const es=n.enemies.filter(e=>e.hp>0);
          es[0].marks={chill:4.5, judged:2.5}; es[1].marks={stagger:5.5}; if(es[2]) es[2].marks={taunted:3};
          S.g.heroes.forEach(h=>h.cd=h.cd.map(()=>0)); S.g.timeScale=0;}""")
        await pg.wait_for_timeout(300)
        print(await pg.evaluate("()=>[...document.querySelectorAll('.ie-sk.combo')].map(e=>e.dataset.tip)"))
        await pg.screenshot(path='test/marks_field.png', clip={'x':300,'y':14,'width':680,'height':470})
        bb = await pg.evaluate("()=>{const r=document.querySelector('[data-tip=\"skill:0:2\"]').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]}")
        await pg.mouse.move(bb[0], bb[1]); await pg.wait_for_timeout(250)
        await pg.screenshot(path='test/marks_tip_bash.png', clip={'x':300,'y':14,'width':680,'height':470})
        bb = await pg.evaluate("()=>{const r=document.querySelector('[data-tip=\"skill:1:3\"]').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]}")
        await pg.mouse.move(bb[0], bb[1]); await pg.wait_for_timeout(250)
        await pg.screenshot(path='test/marks_tip_storm.png', clip={'x':300,'y':14,'width':680,'height':470})
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
