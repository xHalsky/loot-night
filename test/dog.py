# The dog and the cable fix (V6, #71; grid doc 7d), with the real mouse: he jumps up and waits, you stroke his head
# (slowly; on his favourite spot for the lucky sock), a too-fast stroke makes him flinch, an ignored dog is offended,
# then he slams the desk: NO SIGNAL, and the cable fix behind the monitor, every plug dragged to its socket (one wrong
# try first). Screenshots test/shots/dog_*.png and a sheet test/shots/dog_sheet.png next to stills 082 to 091.
import asyncio, os, glob
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
        rs = lambda x, y: (296 + x * 2, y * 2)   # right-screen grid px -> page px
        async def shot(name, wait=200, move=True):
            if move: await pg.mouse.move(700, 60)
            await pg.wait_for_timeout(wait); path = f'test/shots/dog_{name}.png'; await pg.screenshot(path=path, clip=RS); shots.append((name, path))
        async def head():
            for _ in range(40):
                h = await pg.evaluate("()=>(window.__lootnight.deskHits||[]).find(h=>h.act==='dogHead')")
                if h: return [float(v) for v in h['arg'].split(',')]
                await pg.wait_for_timeout(100)
            raise AssertionError('no dog on the desk')
        async def stroke(hx, hy, dy, n=6, step=6, wait=22, sweep=34):
            for _ in range(n):
                for k in range(-sweep // step, sweep // step + 1): await pg.mouse.move(*rs(hx + k * step, hy + dy)); await pg.wait_for_timeout(wait)
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        await ev("g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog'); n.phoneScript=[]; n.friendsLeft=0; n.visit.nextAt=1e9; n.apt.lastVisitEnd=1e9; n.lastDemand=-100; n.apt.calm=0; 0")
        await go('portal'); await pg.wait_for_timeout(800)
        # 1 he jumps up; 2 he waits (the first time: the card)
        await ev("n.dog.sweet=2; n.lastDemand=-100; n.apt.activity='tv'; 0"); await go("dbgDog"); await pg.wait_for_timeout(250); await shot('1_jump', 0)
        await shot('2_wait', 1200)
        hx, hy = await head()
        # 3 petting, slowly, over his crown
        await stroke(hx, hy, -30, n=1); await shot('3_petting', 0, move=False)
        # 5 too fast: a quick swipe
        await pg.mouse.move(700, 60); await pg.mouse.move(*rs(hx - 36, hy - 30)); await pg.mouse.move(*rs(hx + 36, hy - 30), steps=3)   # one quick flick (about 1400 grid px/s)
        fl = await ev("n.dog.flinch > 0 && n.dog.stage === 'up'")
        await shot('5_too_fast', 60, move=False)
        # 4 his favourite spot (the chin, sweet 2), then 7 good boy and the lucky sock (mostly on the spot: start him over)
        await ev("n.dog.pet=0; n.dog.sweetPet=0; 0")
        await stroke(hx, hy + 22, 0, n=2, step=4, sweep=10); await shot('4_favourite', 0, move=False)
        for _ in range(30):
            if await ev("n.dog.stage") != 'up': break
            await stroke(hx, hy + 22, 0, n=1, step=4, sweep=10)
        st = await ev("[n.dog.stage, n.goodDog > 0]"); print('petted:', st)
        await shot('6_good_boy', 500)
        await shot('7_lucky_sock', 3000)
        # 8 ignored: offended (the limit not reached)
        await ev("n.dog.limit=3; n.dog.ignores=0; n.lastDemand=-100; 0"); await go("dbgDog"); await pg.wait_for_timeout(1400)
        await ev("n.dog.t=0.05; 0"); await shot('8_ignored', 900)
        await pg.wait_for_timeout(3500)
        # 9 he slams the desk: NO SIGNAL
        await ev("n.dog.limit=1; n.dog.ignores=0; n.lastDemand=-100; 0"); await go("dbgDog"); await pg.wait_for_timeout(1400)
        await ev("n.dog.t=0.05; 0"); await shot('9_slam', 650)
        assert await ev("!!n.unplugged"), 'no slam'
        # 10 the cable fix: a wrong try, then each plug to its socket
        await pg.wait_for_timeout(1800)
        pts = await pg.evaluate("()=>window.__lnCables()"); sock = await ev("n.unplugged.sockets")
        sc = lambda x, y: rs(50 + x, 68 + y)
        async def drag(a, z):
            await pg.mouse.move(*sc(*a[:2])); await pg.mouse.down()
            for k in range(1, 13): await pg.mouse.move(*sc(a[0] + (z[0] - a[0]) * k / 12, a[1] + (z[1] - a[1]) * k / 12)); await pg.wait_for_timeout(30)
            await pg.mouse.up(); await pg.wait_for_timeout(300)
        p0 = 0; wrong = [s for s in range(4) if sock[s] != p0][0]
        await drag(pts['plugs'][p0], pts['slots'][wrong]); await shot('10_cables_wrong', 80, move=False)
        plugged = await ev("n.unplugged ? n.unplugged.plugged.filter(Boolean).length : -1"); assert plugged == 0, f'a wrong socket took it: {plugged}'
        for pi in [1, 2, 0]: await drag(pts['plugs'][pi], pts['slots'][sock.index(pi)])
        await shot('11_cables', 100, move=False)
        await drag(pts['plugs'][3], pts['slots'][sock.index(3)])
        done = await ev("!n.unplugged"); print('cables back in:', done, '| flinched:', fl)
        await shot('12_signal_back', 300)
        print('errors:', errs or 'none'); await b.close()
    stills = {s.split('__')[-1][:-4]: s for s in glob.glob('design/redesign/stills/0[89]*__interruptions__dog__*')}
    pair = {'1_jump': 'jumps-up', '2_wait': 'waits-pet-him', '3_petting': 'petting', '4_favourite': 'favourite-spot', '5_too_fast': 'too-fast', '6_good_boy': 'good-boy', '7_lucky_sock': 'lucky-sock', '8_ignored': 'ignored', '9_slam': 'slams-the-desk', '11_cables': 'cables'}
    rows = []
    for name, path in shots:
        im = Image.open(path).convert('RGB').resize((492, 360), Image.NEAREST)
        st = stills.get(pair.get(name, ''), None)
        rows.append((im, Image.open(st).convert('RGB').crop((148, 0, 640, 360)) if st else None))
    sheet = Image.new('RGB', (2 * 498, len(rows) * 366), (20, 14, 24))
    for i, (a, c) in enumerate(rows):
        sheet.paste(a, (0, i * 366))
        if c: sheet.paste(c, (498, i * 366))
    sheet.save('test/shots/dog_sheet.png'); print('sheet', sheet.size, [n for n, _ in shots])
asyncio.run(main())
