# Screenshots: a curio panel (ask), the troll sneak in progress, the shrine with no cans left.
import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(120)
CLIP={'x':300,'y':14,'width':680,'height':470}
async def curio(pg, cid, stage='ask', t=5, mx=7):
    await pg.evaluate("([c,s,t,m])=>{const S=window.__lootnight.S; const n=S.g.night; n.enemies=[]; n.phase='curio'; n.curio={id:c,stage:s,t:t,max:m}; S.g.timeScale=0;}", [cid, stage, t, mx])
    await pg.wait_for_timeout(250)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]')
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.tired=0}")
        await act(pg,'[data-act=portal]')
        await pg.wait_for_timeout(600)
        await curio(pg, 'strongbox'); await pg.screenshot(path='test/curio_box.png', clip=CLIP)
        await curio(pg, 'troll', 'sneak', 3.4, 6); await pg.screenshot(path='test/curio_sneak.png', clip=CLIP)
        await pg.evaluate("()=>{window.__lootnight.S.g.monsters=0; window.__lootnight.S.g.night.curioBuffs=[{name:'Late fee',dmg:-0.15,speed:0,t:1,floor:true},{name:'Monster blessing',dmg:0.3,speed:0.2,t:41}]; window.__lootnight.S.g.night.sulk=30}")
        await curio(pg, 'shrine'); await pg.screenshot(path='test/curio_shrine.png', clip=CLIP)
        # the escape button really closes it
        await pg.evaluate("()=>{window.__lootnight.S.g.timeScale=1}")
        await act(pg, '#monUi .mg-close'); await pg.wait_for_timeout(200)
        print('phase after close:', await pg.evaluate("()=>window.__lootnight.S.g.night.phase"))
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
