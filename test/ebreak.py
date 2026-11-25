# The energy break (V5, #70; grid doc 7c), played with the real mouse through the renderer's window: pull the drawer,
# drag a can to its spot, pull the tab, pick the can up and pour with Space held at his mouth, then one throw.
# Screenshots per step (test/shots/eb_*.png) and a contact sheet (test/shots/eb_sheet.png) next to stills 077 to 081.
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
RS = {'x': 296, 'y': 0, 'width': 984, 'height': 720}
shots = []
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append((e.stack or str(e))[:500]))
        go = lambda a, arg=None: pg.evaluate(GO, [a, arg]); ev = lambda js: pg.evaluate(EV, js)
        sc = lambda x, y: (296 + (50 + x) * 2, (68 + y) * 2)   # scene px -> page px
        eb = lambda: pg.evaluate("()=>window.__lnEb()")
        stage = lambda: ev("n.game ? n.game.stage : null")
        async def until(want, ms=12000):   # game time runs slower than real time on a slow machine: wait for the step
            for _ in range(ms // 100):
                if await stage() == want: return True
                await pg.wait_for_timeout(100)
            return False
        async def shot(name, wait=250):
            await pg.wait_for_timeout(wait); path = f'test/shots/eb_{name}.png'; await pg.screenshot(path=path, clip=RS); shots.append(path)
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        await ev("g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.visit.nextAt=1e9; g.monsters=3; g.floorCans=[{x:300,y:263.5,a:0},{x:400,y:263.5,a:0},{x:560,y:263.5,a:3.14}]; 0")
        await go('portal'); await pg.wait_for_timeout(4000)   # the scenes bake ahead in the background
        await go('openMonster'); await pg.wait_for_timeout(400)
        # 1 the drawer: grab the handle, pull it toward you
        h = (await eb())['handle']; x, y = sc(h[0], h[1])
        await pg.mouse.move(x, y); await pg.mouse.down()
        for k in range(1, 13): await pg.mouse.move(x, y + k * 9); await pg.wait_for_timeout(30)
        await shot('1_drawer', 60)
        await pg.mouse.up()
        assert await until('grab'), f'drawer: {await stage()} {await eb()}'
        # 2 a can to its spot
        e = await eb(); c = e['cans'][0]; s = e['spot']; x0, y0 = sc(c[0], c[1]); x1, y1 = sc(s[0], s[1])
        await pg.mouse.move(x0, y0); await pg.mouse.down()
        for k in range(1, 16): await pg.mouse.move(x0 + (x1 - x0) * k / 15 * 0.6, y0 + (y1 - y0) * k / 15 * 0.6); await pg.wait_for_timeout(30)
        await shot('2_grab', 80)
        for k in range(1, 8): await pg.mouse.move(x0 + (x1 - x0) * (0.6 + 0.4 * k / 7), y0 + (y1 - y0) * (0.6 + 0.4 * k / 7)); await pg.wait_for_timeout(30)
        await pg.mouse.up()
        assert await until('open'), f'grab: {await stage()} {await eb()}'
        # 3 the tab: pull it up
        t = (await eb())['tabAt']; x, y = sc(t[0], t[1])
        await pg.mouse.move(x, y); await pg.mouse.down()
        for k in range(1, 9): await pg.mouse.move(x, y - k * 6); await pg.wait_for_timeout(30)
        await pg.mouse.up(); await shot('3_open', 200)
        assert await until('drink'), f'open: {await stage()} {await eb()}'
        # 4 the drink: click the can, bring it to his mouth, hold Space
        f = await pg.evaluate("()=>window.__lnFluid()"); o = (await eb())['drinkOff']
        await pg.mouse.click(*sc(f['x'] + o[0], f['y'] + o[1])); await pg.wait_for_timeout(100)
        # where to hold it so the opening sits on his lips at a mid tilt: the physics' canFor, done by hand here
        import math
        def can_for(a): return (f['mx'] - (12 * math.cos(a) + 40 * math.sin(a)), f['my'] - (12 * math.sin(a) - 40 * math.cos(a)))
        cx, cy = can_for(0.0); await pg.mouse.move(*sc(cx + o[0], cy + o[1])); await pg.wait_for_timeout(500)
        await pg.keyboard.down(' ')
        for k in range(40):
            fl = await pg.evaluate("()=>window.__lnFluid()"); cx, cy = can_for(fl['a'])
            await pg.mouse.move(*sc(cx + o[0], cy + o[1])); await pg.wait_for_timeout(60)
            if k == 14: await shot('4_drink', 0); print('fps in the break:', await pg.evaluate("()=>new Promise(r=>{let k=0,t0=performance.now();const f=()=>{if(++k<30)requestAnimationFrame(f);else r(Math.round(30000/(performance.now()-t0)))};requestAnimationFrame(f)})"))
            if fl['inCan'] == 0: break
        fl = await pg.evaluate("()=>window.__lnFluid()"); print('poured: drunk', fl['drunk'], 'left in the can', fl['inCan'])
        await pg.keyboard.up(' ')
        assert await until('toss'), f'drink: {await stage()}'
        drunk = await ev("n.boost > 0 ? 'boost ' + Math.round(n.boost) + ' s' : 'none'")
        # 5 the throw: grab the can at his hand, pull back, let go
        hd = (await eb())['hand']; x, y = sc(hd[0], hd[1])
        await pg.mouse.move(x, y); await pg.mouse.down()
        for k in range(1, 9): await pg.mouse.move(x - k * 7, y + k * 4); await pg.wait_for_timeout(30)
        await shot('5_toss', 80)
        await pg.mouse.up(); await pg.wait_for_timeout(400)
        res = await pg.evaluate("()=>window.__lnToss()")
        st = 'closed' if await until(None) else await stage()
        fps = await pg.evaluate("()=>new Promise(r=>{let k=0,t0=performance.now();const f=()=>{if(++k<60)requestAnimationFrame(f);else r(Math.round(60000/(performance.now()-t0)))};requestAnimationFrame(f)})")
        print('drink:', drunk, '| toss:', res['verdict'], '| the break:', st, '| errors:', errs or 'none')
        await b.close()
    names = ['077__interruptions__energy-break__1-drawer.png', '078__interruptions__energy-break__2-grab.png', '079__interruptions__energy-break__3-open.png', '080__interruptions__energy-break__4-drink.png', '081__interruptions__energy-break__5-toss.png']
    sheet = Image.new('RGB', (2 * 498, len(shots) * 366), (20, 14, 24))
    for i, s in enumerate(shots):
        sheet.paste(Image.open(s).convert('RGB').resize((492, 360), Image.NEAREST), (0, i * 366))
        sheet.paste(Image.open('design/redesign/stills/' + names[i]).convert('RGB').crop((148, 0, 640, 360)), (498, i * 366))
    sheet.save('test/shots/eb_sheet.png'); print('sheet', sheet.size)
asyncio.run(main())
