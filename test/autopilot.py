# Screenshot: on Excel during a fight with the party hurt -> the Loot Night taskbar button flashes; party chat in the feed.
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
        await pg.evaluate("()=>{const S=window.__lootnight.S; const n=S.g.night; n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9;}")
        await act(pg,'[data-act=portal]')
        for _ in range(40):
            await pg.wait_for_timeout(250)
            if await pg.evaluate("()=>window.__lootnight.S.g.night.phase") == 'battle': break
        await pg.keyboard.press('Tab'); await pg.wait_for_timeout(2700)
        await pg.evaluate("()=>{const S=window.__lootnight.S; S.g.heroes.forEach(h=>h.hp=Math.max(1,Math.round(h.hp*0.3)));}")
        await pg.wait_for_timeout(1500)
        print('flash:', await pg.evaluate("!!document.querySelector('.tb-app.flash')"))
        await pg.screenshot(path='test/nobusy.png')
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
