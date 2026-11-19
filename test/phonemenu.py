# Messages live in the phone (#63): tap the idle phone and it is in your hand at Messages; tap a chat and the
# message types itself in that chat. Nothing about it is drawn outside the phone, and no call rings meanwhile.
import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
OUTSIDE = """()=>{const w=document.querySelector('.phone-win'); if(!w) return {open:false};
  const r=w.getBoundingClientRect();
  const stray=[...document.querySelectorAll('.pre-phone, .pre-card')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.className);
  const out=[...w.querySelectorAll('.ph-screen *')].filter(e=>{const q=e.getBoundingClientRect(); return q.width && (q.left<r.left-1||q.right>r.right+1||q.top<r.top-1||q.bottom>r.bottom+1)}).map(e=>e.className||e.tagName);
  return {open:true, chats:[...w.querySelectorAll('.ios-chatrow b')].map(e=>e.textContent), out:[...w.querySelectorAll('.ph-bubble.out')].map(e=>e.textContent), stray, outside:out.slice(0,4), deskPhone: !!document.querySelector('[data-phone]')}}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=2)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(400)
        await act(pg, '[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.apt.activity='tv'; n.apt.room='living'; n.apt.moving=0}")
        await act(pg, '[data-act=portal]'); await pg.wait_for_timeout(300)
        box = await pg.evaluate("()=>{const r=document.querySelector('[data-phone]').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]}")
        await pg.mouse.move(*box); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(400)   # tap the idle phone
        menu = await pg.evaluate(OUTSIDE)
        await pg.screenshot(path='test/phonemenu_1_messages.png')
        # nothing new rings while it is in your hand
        rang = await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; const e=document.createElement('button'); e.dataset.act='dbgMom'; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); e.remove(); return n.interrupts.length}")
        row = await pg.evaluate("()=>{const r=document.querySelector('.ios-chatrow[data-arg=text]').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]}")
        await pg.mouse.click(*row); await pg.wait_for_timeout(1200)
        typing = await pg.evaluate(OUTSIDE)
        await pg.screenshot(path='test/phonemenu_2_typing.png')
        for _ in range(80):   # the send runs on game time; wait for Delivered, then for the phone to go down
            if await pg.evaluate("()=>!!document.querySelector('.ios-delivered')"): break
            await pg.wait_for_timeout(100)
        await pg.screenshot(path='test/phonemenu_3_delivered.png')
        for _ in range(80):
            if await pg.evaluate("()=>!window.__lootnight.S.g.night.pre"): break
            await pg.wait_for_timeout(100)
        await pg.wait_for_timeout(300)
        after = await pg.evaluate("()=>({pre: window.__lootnight.S.g.night.pre, win: !!document.querySelector('.phone-win'), deskPhone: !!document.querySelector('[data-phone]')})")
        print('menu', menu); print('rang while in hand', rang); print('typing', typing); print('after', after, 'ERRORS', errs)
        ok = (menu['open'] and menu['chats'] == ['Babe ♥', 'The Boys (3)'] and not menu['stray'] and not menu['outside'] and not menu['deskPhone']
              and rang == 0 and typing['open'] and typing['out'] and not typing['stray'] and not typing['outside']
              and after['pre'] is None and not after['win'] and after['deskPhone'] and not errs)
        print('PASS' if ok else 'FAIL'); await b.close()
asyncio.run(main())
