# The phone's Messages menu (#63): fully on the desk, below the taskbar, nothing drawn over it.
import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=2)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(400)
        await act(pg, '[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9}")
        await act(pg, '[data-act=portal]'); await pg.wait_for_timeout(300)
        box = await pg.evaluate("()=>{const r=document.querySelector('[data-phone]').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]}")
        await pg.mouse.move(*box); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(300)   # tap the idle phone
        res = await pg.evaluate("""()=>{const m=document.querySelector('.pre-phone'); if(!m) return {open:false};
          const r=m.getBoundingClientRect(), t=document.getElementById('taskbar').getBoundingClientRect();
          const covered=[...m.querySelectorAll('button, .pp-app')].filter(e=>{const q=e.getBoundingClientRect(); const hit=document.elementFromPoint(q.left+q.width/2, q.top+Math.min(6,q.height/2)); return !m.contains(hit);}).map(e=>e.textContent.trim().slice(0,20));
          return {open:true, top:Math.round(r.top), bottom:Math.round(r.bottom), left:Math.round(r.left), right:Math.round(r.right), taskbarBottom:Math.round(t.bottom), covered}}""")
        await pg.screenshot(path='test/phonemenu.png', clip={'x': 296, 'y': 400, 'width': 520, 'height': 320})
        ok = res.get('open') and res['top'] >= res['taskbarBottom'] and res['bottom'] <= 720 and not res['covered']
        print(res, 'ERRORS', errs); print('PASS' if ok else 'FAIL'); await b.close()
asyncio.run(main())
