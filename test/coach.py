# Coach marks and the Tonight tracker (#42). Brings the game to each core-loop moment, checks the coach mark
# appears, that the game crawls while it is up, that doing the thing clears it, that a more important mark bumps
# a less important one, and screenshots each (test/coach_*.png). Run after a build.
import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    # a DOM button, or an action the renderer draws (the town's portal): a stand-in button carries it
    await pg.evaluate("s=>{let e=document.querySelector(s), tmp=null; const m=s.match(/^\\[data-act=(\\w+)\\]$/); if(!e&&m){tmp=e=document.createElement('button'); e.dataset.act=m[1]; document.getElementById('stage').appendChild(e)} e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); if(tmp) tmp.remove()}", sel); await pg.wait_for_timeout(150)
N = "const g=window.__lootnight.S.g, n=g.night;"
def fresh(cid):   # forget a coach mark was seen, clear the current one, nobody at the door
    return N + f"g.tipsSeen=g.tipsSeen.filter(t=>t!=='coach:{cid}'); n.coach=null; Object.assign(n.visit,{{stage:'idle',result:'',chat:null}}); n.game=null; n.interrupts=[];"
async def dbg(pg, sel):
    for _ in range(2):
        if await pg.evaluate("s=>!!document.querySelector(s)", sel): break
        await pg.keyboard.press('F1'); await pg.wait_for_timeout(150)
    await act(pg, sel)
    if await pg.evaluate("()=>!!document.querySelector('.debug')"): await pg.keyboard.press('F1')
async def main():
    ok = True
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(400)
        await act(pg, '[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{" + N + "n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9;}")
        tn = await pg.evaluate("()=>getComputedStyle(document.getElementById('rsArea')).display")   # the Tonight note is drawn on the desk (V3)
        print('desk drawn:', tn); ok &= tn == 'block'
        await act(pg, '[data-act=portal]'); await pg.wait_for_timeout(300)
        coach = lambda: pg.evaluate("()=>window.__lootnight.S.g.night.coach?.id || null")
        async def rate():
            t0 = await pg.evaluate("()=>window.__lootnight.S.g.night.threat"); await pg.wait_for_timeout(1000)
            return (await pg.evaluate("()=>window.__lootnight.S.g.night.threat")) - t0
        # 1. footsteps: crawl until Tab
        await pg.evaluate("()=>{" + fresh('steps') + "}"); await dbg(pg, '[data-act=dbgVisit]'); await pg.wait_for_timeout(300)
        c = await coach(); r = await rate()
        print(f'footsteps: {c} | game speed {r:.2f}x'); ok &= c == 'steps' and r < 0.4
        await pg.screenshot(path='test/coach_steps.png')
        await pg.keyboard.press('Tab'); await pg.wait_for_timeout(300)
        c = await coach(); print('  Tab clears it:', c is None); ok &= c is None
        # 2. her in the doorway: the handle turns, she comes in
        await pg.evaluate("()=>{" + fresh('door') + "n.monitor='excel'; n.switching=null; Object.assign(n.visit,{stage:'handle',kind:'chat',from:'tv',t:0.01});}"); await pg.wait_for_timeout(400)
        c = await coach(); print('doorway:', c); ok &= c == 'door'
        await pg.screenshot(path='test/coach_door.png')
        await pg.wait_for_timeout(200); xy = await pg.evaluate("()=>{const h=(window.__lnCoach()||[])[0]; return h ? [(h.x + h.w / 2) * 2, (h.y + h.h / 2) * 2] : null}")   # the renderer's close box (V11)
        if xy: await pg.mouse.click(*xy); await pg.wait_for_timeout(200)
        c = await coach(); print('  x closes it:', c is None); ok &= c is None
        # 3. the phone: a real tap opens it
        await pg.evaluate("()=>{" + fresh('phone') + "n.scare=0; n.monitor='rpg';}"); await dbg(pg, '[data-act=dbgMom]'); await pg.wait_for_timeout(300)
        c = await coach(); print('phone:', c); ok &= c == 'phone'
        await pg.screenshot(path='test/coach_phone.png')
        r2 = await pg.evaluate("()=>{const e=document.querySelector('#deskPhone').getBoundingClientRect(); return [e.left+e.width/2, e.top+e.height/2]}")
        await pg.mouse.click(r2[0], r2[1]); await pg.wait_for_timeout(300)
        c = await coach(); print('  opening the phone clears it:', c is None); ok &= c is None
        # 4. loot, then footsteps bump it
        await pg.evaluate("()=>{" + fresh('loot') + "n.phase='mapChoice';}"); await dbg(pg, '[data-act=dbgEpic]'); await pg.wait_for_timeout(500)   # between floors a drop goes straight to the bag
        c = await coach(); print('loot:', c); ok &= c == 'loot'
        await pg.screenshot(path='test/coach_loot.png')
        await pg.evaluate("()=>{" + N + "g.tipsSeen=g.tipsSeen.filter(t=>t!=='coach:steps'); n.visit.stage='idle'; n.monitor='rpg';}")
        await dbg(pg, '[data-act=dbgVisit]'); await pg.wait_for_timeout(300)
        c = await coach(); back = await pg.evaluate("()=>!window.__lootnight.S.g.tipsSeen.includes('coach:loot')")
        print(f'  footsteps bump it: {c} | loot comes back next time: {back}'); ok &= c == 'steps' and back
        # 5. boss wind-up (state: a wind-up on screen)
        await pg.evaluate("()=>{" + fresh('windup') + "n.monitor='rpg'; n.enemies.forEach(e=>{e.wind=2; e.windMax=2;}); n.coach={id:'windup',t:0,mark:0};}")
        await pg.wait_for_timeout(300); await pg.screenshot(path='test/coach_windup.png')
        await pg.screenshot(path='test/coach_tonight.png', clip={'x': 700, 'y': 470, 'width': 320, 'height': 160})
        print('ERRORS', errs); ok &= not errs
        await b.close()
    print('PASS' if ok else 'FAIL')
asyncio.run(main())
