# Screenshots: a curio card (ask), the Abbot's sneak in progress, the shrine; then the card's close box closes it
# (every interrupt is escapable). Run after `npm run build`. The curios' looks: test/curio_stills.py.
import asyncio, sys
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); const m=/^\\[data-act=\\x22?(\\w+)\\x22?\\](?:\\[data-arg=\\x22?([^\\x22\\]]*)\\x22?\\])?$/.exec(s); if(!e && m){const b=document.createElement('button'); b.dataset.act=m[1]; if(m[2]!=null) b.dataset.arg=m[2]; document.getElementById('stage').appendChild(b); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); b.remove(); return;} e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(120)
CLIP={'x':314,'y':16,'width':948,'height':464}   # the game screen (#49)
async def curio(pg, cid, stage='ask', t=5, mx=7):
    await pg.evaluate("([c,s,t,m])=>{const S=window.__lootnight.S; const n=S.g.night; n.enemies=[]; n.phase='curio'; n.curio={id:c,stage:s,t:t,max:m}; S.g.timeScale=0;}", [cid, stage, t, mx])
    await pg.wait_for_timeout(250)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.tired=0}")
        await act(pg,'[data-act=portal]')
        await pg.wait_for_timeout(600)
        await curio(pg, 'strongbox'); await pg.screenshot(path='test/curio_box.png', clip=CLIP)
        await curio(pg, 'troll', 'sneak', 3.4, 6); await pg.screenshot(path='test/curio_sneak.png', clip=CLIP)
        await pg.evaluate("()=>{window.__lootnight.S.g.monsters=0; window.__lootnight.S.g.night.partyBuffs=[{name:'Curse',dmg:-0.15,speed:0,t:1,max:1,icon:'curse',floor:true},{name:'Green flame',dmg:0.3,speed:0.2,t:41,max:60,icon:'blessing'}]; window.__lootnight.S.g.night.sulk=30}")
        await curio(pg, 'shrine'); await pg.screenshot(path='test/curio_shrine.png', clip=CLIP)
        # the card's close box (drawn in the canvas since the redesign: the curioLeave hit at its top right) really closes it
        await pg.evaluate("()=>{window.__lootnight.S.g.timeScale=1}")
        r = await pg.evaluate("()=>{const a=document.getElementById('rpgArea').getBoundingClientRect(); return [a.left,a.top,a.width/334]}")
        await pg.mouse.click(r[0] + 268 * r[2], r[1] + 5 * r[2]); await pg.wait_for_timeout(250)
        st = await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; return [n.phase, !!n.curio]}")
        ok = st[0] != 'curio' and not st[1]
        print(('ok   ' if ok else 'FAIL ') + f'the close box walks past the curio (phase {st[0]})')
        print('ERRORS', errs)
        if not ok or errs: sys.exit(1)
        await b.close()
asyncio.run(main())
