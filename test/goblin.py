# The Goblin Fuel break (#61), played with real input: drawer, can to desk, tab, pour (Space taps), one throw.
# Screenshots per step (test/goblin_*.png), then a miss that must stay on the floor for the next break.
import asyncio, math
from playwright.async_api import async_playwright
CLIP = {'x': 340, 'y': 20, 'width': 620, 'height': 410}
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def stage(pg): return await pg.evaluate("()=>{const g=window.__lootnight.S.g.night.game; return g&&g.kind==='monster'?g.stage:null}")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg, '[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g,n=g.night; n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset')}")
        await act(pg, '[data-act=portal]'); await pg.wait_for_timeout(400)
        await act(pg, '[data-act=openMonster]'); await pg.wait_for_timeout(300)
        r = await pg.evaluate("()=>{const r=document.getElementById('mcv').getBoundingClientRect(); return [r.left,r.top,r.width/600]}")
        async def W(x, y):   # world px of the current shot -> page px
            sx, sy = await pg.evaluate(f"()=>window.__lnScreen({x},{y})")
            return r[0] + sx * r[2], r[1] + sy * r[2]
        async def drag(p0, p1, steps=14, ms=25, shot=None):
            await pg.mouse.move(*p0); await pg.mouse.down()
            for i in range(1, steps + 1):
                await pg.mouse.move(p0[0] + (p1[0] - p0[0]) * i / steps, p0[1] + (p1[1] - p0[1]) * i / steps); await pg.wait_for_timeout(ms)
            if shot: await pg.wait_for_timeout(120); await pg.screenshot(path=shot, clip=CLIP)
            await pg.mouse.up()
        await pg.screenshot(path='test/goblin_1_drawer.png', clip=CLIP)
        await drag(await W(430, 180), await W(430, 240), shot='test/goblin_1b_pulling.png')
        await pg.wait_for_timeout(500); print('after drawer:', await stage(pg))
        await pg.screenshot(path='test/goblin_2_open.png', clip=CLIP)
        await drag(await W(358, 232), await W(424, 104), steps=16, shot='test/goblin_2_carry.png')
        await pg.wait_for_timeout(1300); print('after can:', await stage(pg))
        await pg.screenshot(path='test/goblin_3_lid.png', clip=CLIP)
        await drag(await W(300, 75), await W(300, 10), steps=18, ms=30)
        await pg.wait_for_timeout(180); await pg.screenshot(path='test/goblin_3b_pop.png', clip=CLIP)
        await pg.wait_for_timeout(1300); print('after tab:', await stage(pg))
        await pg.screenshot(path='test/goblin_4_drink.png', clip=CLIP)
        # pour: grab the floating can, keep the opening at his lips, feather Space (a slow, steady tilt)
        f = await pg.evaluate("()=>window.__lnFluid()")
        await pg.mouse.move(*(await W(f['x'], f['y']))); await pg.mouse.down(); await pg.wait_for_timeout(100)
        mouth = (f['mx'], f['my']); space = False; shots = 0; t0 = await pg.evaluate("()=>performance.now()")
        for i in range(600):
            f = await pg.evaluate("()=>window.__lnFluid()")
            if await stage(pg) != 'drink': break
            a = max(f['a'], 0.5)
            cx = mouth[0] - (12 * math.cos(a) + 40 * math.sin(a)); cy = mouth[1] - (12 * math.sin(a) - 40 * math.cos(a))
            await pg.mouse.move(*(await W(cx, cy)))
            now = (await pg.evaluate("()=>performance.now()") - t0) / 1000
            want = now > 0.5 and (now % 0.5) < 0.33
            if want and not space: await pg.keyboard.down(' '); space = True
            elif not want and space: await pg.keyboard.up(' '); space = False
            if shots == 0 and f['drunk'] > 20: await pg.screenshot(path='test/goblin_4b_pour.png', clip=CLIP); shots = 1
            if f['inCan'] <= 2 and f['free'] == 0: break
            await pg.wait_for_timeout(16)
        if space: await pg.keyboard.up(' ')
        await pg.mouse.up()
        f = await pg.evaluate("()=>window.__lnFluid()"); print('pour:', {k: round(v, 2) if isinstance(v, float) else v for k, v in f.items()})
        await pg.wait_for_timeout(250); await pg.screenshot(path='test/goblin_4c_result.png', clip=CLIP)
        await pg.wait_for_timeout(1400)
        g = await pg.evaluate("()=>{const g=window.__lootnight.S.g.night.game; return g?{stage:g.stage,drunk:g.drunk,result:g.result}:null}"); print('after drink:', g)
        await pg.screenshot(path='test/goblin_5_toss.png', clip=CLIP)
        print('throw in:', await pg.evaluate("()=>window.__lnThrow(403,-312)"))
        await pg.wait_for_timeout(450); await pg.screenshot(path='test/goblin_5b_flight.png', clip=CLIP)
        await pg.wait_for_timeout(2600); print('toss:', await pg.evaluate("()=>window.__lnToss()"))
        await pg.wait_for_timeout(1500)
        st = await pg.evaluate("()=>{const g=window.__lootnight.S.g; return {game:!!g.night.game, bin:g.night.bin.length, floor:g.floorCans.length, boost:g.night.boost, cans:g.monsters}}"); print('after toss:', st)
        # second can: jump to the throw and miss short; it must stay on the floor
        await act(pg, '[data-act=openMonster]'); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{const g=window.__lootnight.S.g.night.game; g.stage='toss'}"); await pg.wait_for_timeout(300)
        print('throw short:', await pg.evaluate("()=>window.__lnThrow(260,-208)"))
        await pg.wait_for_timeout(4500)
        st2 = await pg.evaluate("()=>{const g=window.__lootnight.S.g; return {game:!!g.night.game, bin:g.night.bin.length, floor:g.floorCans}}"); print('after miss:', st2)
        await act(pg, '[data-act=openMonster]'); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{const g=window.__lootnight.S.g.night.game; g.stage='toss'}"); await pg.wait_for_timeout(500)
        print('third break sees:', await pg.evaluate("()=>window.__lnToss()"))
        await pg.screenshot(path='test/goblin_5c_mess.png', clip=CLIP)
        print('ERRORS', errs); await b.close()
asyncio.run(main())
