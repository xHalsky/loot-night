# Screenshots: the shower panel (early, late, clearing), the hoodie walk-by at the door, the morning vignettes.
import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def shower(pg, t, cued, name):
    await pg.evaluate("([t,c])=>{const n=window.__lootnight.S.g.night; Object.assign(n.apt,{activity:'shower',room:'bathroom',moving:0,t:t,cued:c,asleep:false}); n.headset=false;}", [t, cued])
    await pg.wait_for_timeout(400)
    await pg.screenshot(path=f'test/{name}.png', clip={'x':0,'y':380,'width':280,'height':230})
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const S=window.__lootnight.S; const n=S.g.night; n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.tired=0; S.g.timeScale=0}")
        await shower(pg, 100, False, 'shower_early')
        await shower(pg, 12, False, 'shower_late')
        await shower(pg, 1.2, True, 'shower_clear')
        # the hoodie walk-by at the door
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; Object.assign(n.visit,{stage:'in',kind:'night',from:'night',result:'night',checked:true,t:99}); n.apt.activity='tv'; n.apt.room='living';}")
        await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/walkby.png', clip={'x':0,'y':0,'width':280,'height':640})
        # morning vignettes
        for scene, mood, ending in [('green', 20, 'sleep'), ('yellow', 55, 'sleep'), ('red', 85, 'sleep'), ('unplugged', 100, 'unplugged')]:
            await pg.evaluate("([m,e])=>{const S=window.__lootnight.S; S.g.results={ending:e,endClock:1500,stars:1,depth:5,prevRecord:4,debtBefore:0,debtAfter:0,mood:m,caught:false,unidentified:0,nearMisses:[]}; S.g.morning={paid:0,listings:0}; S.g.screen='morning'}", [mood, ending])
            await pg.wait_for_timeout(400)
            await pg.screenshot(path=f'test/morning_{scene}.png')   # V10: the renderer's morning, full frame
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
