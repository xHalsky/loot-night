# Screenshots: the door panel's "before she comes" row, the idle phone's menu, texting, away for tea with
# "stay for one episode?", her reply on the phone, the towel on the door.
import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.tired=0; n.apt.t=999}")
        await act(pg,'[data-act=portal]'); await pg.wait_for_timeout(400)
        # phone menu (tap the idle phone = pointerdown + pointerup on it)
        box = await pg.evaluate("()=>{const r=document.querySelector('[data-phone]').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]}")
        await pg.mouse.move(box[0], box[1]); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(250)
        bb = await pg.evaluate("()=>{const r=document.querySelector('[data-tip=\"pre:tea\"]').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]}")
        await pg.mouse.move(bb[0], bb[1]); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/pre_menus.png')
        await pg.mouse.move(640, 300)
        await act(pg, '[data-act=pre][data-arg=text]'); await pg.wait_for_timeout(700)
        await pg.screenshot(path='test/pre_typing.png', clip={'x':296,'y':360,'width':984,'height':360})
        await pg.wait_for_timeout(6500)
        await pg.screenshot(path='test/pre_reply.png', clip={'x':296,'y':360,'width':400,'height':360})
        # tea while she watches TV, fast-forward to the question
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.preUses={}; n.apt.calm=0; n.apt.activity='tv'; n.apt.room='living'; n.apt.moving=0}")
        await act(pg, '[data-act=pre][data-arg=tea]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/pre_away.png')
        await pg.evaluate("()=>{window.__lootnight.S.g.night.pre.t=0.05}"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/pre_episode.png')
        await act(pg, '[data-act=episode][data-arg="0"]')
        await act(pg, '[data-act=pre][data-arg=towel]'); await pg.wait_for_timeout(2600)
        await pg.screenshot(path='test/pre_towel.png', clip={'x':0,'y':0,'width':296,'height':720})
        print('towel:', await pg.evaluate("()=>window.__lootnight.S.g.night.towel"), 'ERRORS', errs)
        await b.close()
asyncio.run(main())
