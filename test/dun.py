import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); const m=/^\\[data-act=\\x22?(\\w+)\\x22?\\](?:\\[data-arg=\\x22?([^\\x22\\]]*)\\x22?\\])?$/.exec(s); if(!e && m){const b=document.createElement('button'); b.dataset.act=m[1]; if(m[2]!=null) b.dataset.arg=m[2]; document.getElementById('stage').appendChild(b); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); b.remove(); return;} if(!e) throw new Error('no '+s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(120)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg,'[data-act=newGame]'); await act(pg, '[data-act=howtoClose]'); await act(pg,'[data-act=portal]')
        await pg.wait_for_timeout(1500); await pg.screenshot(path='test/dn1.png')
        await pg.keyboard.press('h')
        for i in range(40):
            await pg.wait_for_timeout(500)
            st = await pg.evaluate("document.querySelector('.ie-bar') ? 1 : 0")
            ph = await pg.evaluate("(()=>{try{return 0}catch(e){}})()")
            if i==6: await pg.screenshot(path='test/dn2.png')
            if i==22: await pg.screenshot(path='test/dn3.png')
        await pg.screenshot(path='test/dn4.png')
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
