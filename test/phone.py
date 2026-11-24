# The phone (#54, 3.2): a call on the desk with Decline and Speaker, the same in your hand, a call on speaker
# (hands free) and a silent text on the lock screen. Writes test/shots/phone_*.png.
import asyncio, os
from playwright.async_api import async_playwright
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog'); const n=g.night; n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9}")
        await pg.evaluate(GO, 'dbgMom'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='test/shots/phone_desk_call.png', clip={'x': 290, 'y': 380, 'width': 260, 'height': 340})
        await pg.evaluate("()=>{document.querySelector('[data-phone]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); document.querySelector('[data-phone]').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0}))}")
        await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/shots/phone_hand_ringing.png')
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.game=null; n.action='none'}")
        await pg.evaluate(GO, 'dbgCall'); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.game=null; n.action='none'; n.interrupts=[]}")
        await pg.evaluate("()=>{const e=document.createElement('button'); e.dataset.act='dbgCall'; e.dataset.arg='friends'; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}")
        await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{const e=document.querySelector('[data-speaker]'); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}")
        await pg.wait_for_timeout(1500)
        st = await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; return {action:n.action, speaker:!!n.game?.speaker, stage:n.game?.stage, noise:Math.round(n.noise)}}")
        await pg.screenshot(path='test/shots/phone_speaker.png')
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.game=null; n.action='none'; n.interrupts=[]}")
        await pg.evaluate(GO, 'dbgBoss'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path='test/shots/phone_desk_text.png', clip={'x': 290, 'y': 380, 'width': 260, 'height': 340})
        print('speaker:', st, 'errors:', errs or 'none'); await b.close()
asyncio.run(main())
