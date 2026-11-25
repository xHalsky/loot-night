# Q4, the Excel clicker (step 4, #55; grid doc 7i), with the real mouse and keys: alt-tab in (Hustle starts full),
# AutoSum by click and by Space (it pays, the column rolls), a fill flick (cells cascade, each pays), Sort (x2, then the
# cooldown), the promotion dialog (OK), the pivot spinner (grab and fling: turns pay), a macro bought in the pane (it
# then earns on its own, in the RPG too), and looking busy while she is in (busy: she leaves sooner; idle: "What are you
# working on?"). Screenshots test/shots/q4_*.png and a sheet test/shots/q4_sheet.png next to stills 004, 011 to 014.
import asyncio, os, math
from playwright.async_api import async_playwright
from PIL import Image
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
shots, fails = [], []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append((e.stack or str(e))[:500]))
        go = lambda a, arg=None: pg.evaluate(GO, [a, arg]); ev = lambda js: pg.evaluate(EV, js)
        box = None
        async def at(x, y):   # game-screen px -> page px (the monitor canvas)
            return (box[0] + x * box[2], box[1] + y * box[3])
        async def shot(name, wait=150):
            await pg.wait_for_timeout(wait); path = f'test/shots/q4_{name}.png'; await pg.screenshot(path=path, clip={'x': 296, 'y': 0, 'width': 984, 'height': 720}); shots.append((name, path))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        await ev("g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.visit.nextAt=1e9; n.apt.lastVisitEnd=1e9; n.dog.nextAt=1e9; 0")
        await go('portal'); await pg.wait_for_timeout(600)
        await pg.keyboard.press('Tab')
        for _ in range(60):
            if await ev("n.monitor === 'excel' && !n.switching"): break
            await pg.wait_for_timeout(100)
        await pg.wait_for_timeout(300)
        r = await pg.evaluate("()=>{const e=document.getElementById('monitor').getBoundingClientRect(); return [e.left, e.top, e.width / 474, e.height / 232]}")
        box = r
        check(await ev("n.q4.hustle") > 0.9, f'Hustle starts full ({await ev("n.q4.hustle.toFixed(2)")})')
        zl0 = await ev("g.zl")
        # AutoSum: the big sigma (B rows 10-11), then Space
        await pg.mouse.click(*await at(98, 184)); await pg.wait_for_timeout(80); await shot('1_sum', 60)
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(100)
        check(await ev("n.q4.sums") == 2 and await ev("g.zl") > zl0 + 1.5, f'AutoSum pays (+{await ev("g.zl") - zl0:.2f} zl, x{await ev("(1 + 2 * n.q4.hustle).toFixed(1)")} Hustle)')
        # the fill flick: grab C4's corner, drag down fast, let go
        h = await at(167 + 2, 109 + 2); await pg.mouse.move(*h); await pg.mouse.down()
        await pg.mouse.move(h[0], h[1] + 6 * 12 * box[3], steps=3); await pg.mouse.up()
        await pg.wait_for_timeout(200); await shot('2_fill', 0)
        await pg.wait_for_timeout(400)
        check(await ev("n.q4.last") == 'fill' and await ev("n.q4.tonight") > 2, f'the flick fills cells (tonight +{await ev("n.q4.tonight.toFixed(2)")} zl)')
        # Sort: x2 for 5 s, then the cooldown greys it out
        await pg.mouse.click(*await at(194, 184)); await pg.wait_for_timeout(700); await shot('3_sort', 0)
        check(await ev("n.q4.sortT") > 3 and await ev("n.q4.sortCd") > 8, 'Sort: x2 and its cooldown')
        # a promotion: past Junior Analyst's 50 zl and Analyst's 300, the dialog; OK closes it
        await ev("g.q4.life = 299.9; 0"); await pg.keyboard.press('Space'); await pg.wait_for_timeout(900); await shot('4_promotion', 0)
        check(await ev("!!n.q4.promo") and await ev("g.q4.rank") == 2, f'promoted to {await ev("g.q4.rank")} (the dialog)')
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(100)
        check(await ev("!!n.q4.promo"), 'the dialog first: Space does nothing under it')
        ok = await at(60 + 3 + 207 / 2 - 24 + 20, 70 + 15 + 48 + 7); await pg.mouse.click(*ok); await pg.wait_for_timeout(200)
        check(not await ev("!!n.q4.promo"), 'OK closes it')
        # the pivot spinner (Analyst): grab the disc and fling it round
        await pg.wait_for_timeout(5000)
        c = (266, 134); pts = [await at(c[0] + 30 * math.cos(a), c[1] + 30 * 0.42 * math.sin(a)) for a in [k * 0.45 for k in range(0, 18)]]
        await pg.mouse.move(*pts[0]); await pg.mouse.down()
        for q in pts[1:]: await pg.mouse.move(*q); await pg.wait_for_timeout(8)
        await pg.mouse.up(); await pg.wait_for_timeout(300); await shot('5_pivot', 0)
        om = await ev("n.q4.pivot.om"); await pg.wait_for_timeout(3000)
        check(abs(om) > 2, f'the fling spins it ({om:.1f} rad/s)')
        # a macro: money in the wallet, Buy the Intern; then it earns on its own, in the RPG too
        await ev("g.zl += 100; 0"); await pg.wait_for_timeout(200)
        await pg.mouse.click(*await at(324 + 150 - 45 + 20, 54 + 13 + 12 + 5)); await pg.wait_for_timeout(300)
        check(await ev("g.q4.macros.intern") == 1, 'the Intern bought')
        await shot('6_macros', 0)
        await pg.keyboard.press('Tab')
        for _ in range(60):
            if await ev("n.monitor === 'rpg' && !n.switching"): break
            await pg.wait_for_timeout(100)
        t0 = await ev("n.q4.tonight"); await pg.wait_for_timeout(4000)
        check(await ev("n.q4.tonight") > t0 + 0.4, f'the macro earns in the RPG (+{await ev("n.q4.tonight") - t0:.2f} zl in 4 s)')
        # looking busy: she is in, Excel up; idle she asks and waits; busy her visit runs x1.5
        await pg.keyboard.press('Tab')
        for _ in range(60):
            if await ev("n.monitor === 'excel' && !n.switching"): break
            await pg.wait_for_timeout(100)
        await ev("n.q4.lastAct = n.threat - 10; Object.assign(n.visit, {stage:'in', kind:'peek', checked:true, result:'pass', t:4}); 0"); await pg.wait_for_timeout(1200)
        t1 = await ev("n.visit.t")
        check(await ev("n.q4.asked") and abs(t1 - 4) < 0.05, f'idle: she waits and asks ({t1:.2f} s left)')
        await shot('7_asked', 0)
        for _ in range(4): await pg.keyboard.press('Space'); await pg.wait_for_timeout(250)
        t2 = await ev("n.visit.t")
        check(not await ev("n.q4.asked") and t2 < 4 - 1.2, f'busy: her visit runs on, faster ({t2:.2f} s left)')
        check(not errs, 'errors: ' + ('none' if not errs else errs[0]))
        await b.close()
    pair = {'1_sum': '004__the-rpg-monitor__screen__excel', '2_fill': '011__the-rpg-monitor__q4-excel__fill-flick', '3_sort': '012__the-rpg-monitor__q4-excel__sort',
            '5_pivot': '013__the-rpg-monitor__q4-excel__pivot-spinner', '4_promotion': '014__the-rpg-monitor__q4-excel__promotion'}
    rows = [(n, Image.open(pth).convert('RGB')) for n, pth in shots]
    sheet = Image.new('RGB', (984 * 2 + 8, len(rows) * 728), (20, 16, 26))
    for i, (n, im) in enumerate(rows):
        sheet.paste(im, (0, i * 728))
        if n in pair:
            st = Image.open(f'design/redesign/stills/{pair[n]}.png').convert('RGB')
            st = st.resize((st.width * 2, st.height * 2), Image.NEAREST) if st.width <= 640 else st
            sheet.paste(st.crop((296, 0, 1280, 720)) if st.width >= 1280 else st, (992, i * 728))
    sheet.save('test/shots/q4_sheet.png'); print('sheet', sheet.size, [n for n, _ in rows])
    print('PASS' if not fails else f'FAILED {len(fails)}')
asyncio.run(main())
