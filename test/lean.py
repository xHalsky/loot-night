# Lean in (V12, #77; grid doc 7l), with the real mouse: Tuesday, her yoga; hold the door in the webcam view and past
# 0.6 s the right screen is his view through the crack (the coach marks); the mouse leans 1 2 3 and the mirror, the
# wheel opens the door, the right button looks closer; her tell and the red bar; the plan on the approved layout;
# her other timers (the couch, the kitchen, the bath ajar, the sheet mask). Screens test/shots/lean_*.png.
import asyncio, os, time
from playwright.async_api import async_playwright
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
QUIET = "g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.apt.lastVisitEnd=1e9; n.dog.next=1e9; n.tease.left=0; n.tease.bedAt=1e9; 0"
shots, fails = [], []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append((e.stack or str(e))[:400]))
        go = lambda a, arg=None: pg.evaluate(GO, [a, arg]); ev = lambda js: pg.evaluate(EV, js)
        async def shot(name, wait=300):
            await pg.wait_for_timeout(wait); path = f'test/shots/lean_{name}.png'; await pg.screenshot(path=path); shots.append((name, path))
        await pg.add_init_script('window.__lnDay = 1'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200)
        check(await ev("g.voice && g.voice.lines[1].includes('lean in')"), "Tuesday: Billy's note names lean in")
        await go('voiceOk') if False else None
        await ev("g.voice = null; g.howto = true; 0"); await pg.wait_for_timeout(500)
        await shot('0_howto')
        await go('howtoClose')
        await ev(QUIET); await go('portal'); await pg.wait_for_timeout(1500)
        check(await ev("n.apt.activity") == 'yoga', 'her yoga first')
        check(await ev("n.coach && n.coach.id") == 'lean', 'coach mark 1 on the door')
        await shot('1_coach')
        # hold the door: find it in the webcam (cursor 'grab')
        door = None
        for yy in range(120, 420, 20):
            for xx in range(60, 260, 20):
                await pg.mouse.move(xx, yy); await pg.wait_for_timeout(15)
                if await pg.evaluate("()=>document.getElementById('herArea').style.cursor") == 'grab' and (xx, yy) != (60, 120): door = (xx, yy); break
            if door: break
        check(door is not None, f'the door in the webcam ({door})')
        await pg.mouse.move(*door); await pg.mouse.down(); await pg.wait_for_timeout(900)
        check(await ev("!!n.lean"), 'held past 0.6 s: leaning in')
        await pg.mouse.move(296 + 984 * 0.64, 300); await pg.wait_for_timeout(500)
        await shot('2_stop3_yoga', 400)
        check(await ev("n.coach && n.coach.id") == 'leanview', 'coach mark 2 on the slit')
        await pg.mouse.move(296 + 984 * 0.1, 300); await pg.wait_for_timeout(300)
        await pg.mouse.move(296 + 984 * 0.64, 300); await pg.wait_for_timeout(300)
        for _ in range(6): await pg.mouse.wheel(0, -100); await pg.wait_for_timeout(400)
        check(await ev("n.lean.slit") > 64, f'the wheel: wider ({await ev("n.lean.slit")})')
        t0 = time.time(); await pg.wait_for_timeout(1000); fr = await ev("0")
        await shot('3_wide', 400)
        await pg.mouse.down(button='right'); await pg.wait_for_timeout(300)
        check(await ev("n.lean.focus"), 'the right button: closer')
        await shot('4_focus', 400)
        await pg.mouse.up(button='right'); await pg.wait_for_timeout(200)
        check(await ev("!!n.lean && !n.lean.focus"), 'right button up: back, still leaning')
        # her tell
        await ev("n.lean.safe = 0; n.lean.lookT = 0.01; 0"); await pg.wait_for_timeout(400)
        check(await ev("n.lean.look") == 'tell' and await ev("n.coach && n.coach.id") == 'tell', 'her tell: coach mark 3')
        await shot('5_tell', 300)
        await pg.mouse.up(); await pg.wait_for_timeout(400)
        check(await ev("!n.lean && !n.peeking"), 'let go: back to the game')
        # her other timers
        await ev("g.tipsSeen.push('coach:tell', 'coach:leanview', 'coach:lean'); n.coach = null; 0")
        for name, js, u in [('couch', "n.apt.activity='tv'; n.apt.room='living'; n.apt.t=10; n.apt.dur=30", 0.64), ('kitchen', "n.apt.activity='tea'; n.apt.room='kitchen'; n.apt.t=8; n.apt.dur=16", 0.1),
                            ('bath', "n.apt.activity='bath'; n.apt.room='bathroom'; n.apt.ajar=true; n.apt.t=100; n.apt.dur=140", 0.38), ('mask', "n.apt.activity='mask'; n.apt.room='bathroom'; n.apt.t=60; n.apt.dur=80; g.owned.push('mirror')", 0.84)]:
            await ev(js + "; n.apt.moving = 0; n.apt.calm = 99; n.apt.calmHard = true; 0")
            await pg.mouse.move(*door); await pg.mouse.down(); await pg.wait_for_timeout(800)
            await ev("n.lean.lookT = 99; 0")
            await pg.mouse.move(296 + 984 * u, 300); await pg.wait_for_timeout(500)
            await shot(f'6_{name}', 300)
            await pg.mouse.up(); await pg.wait_for_timeout(300)
        # the plan on the approved layout (with the mirror)
        await ev("0"); 
        check(not errs, 'no page errors ' + ' | '.join(errs))
        await b.close()
    print('FAIL' if fails else 'PASS', len(shots), 'shots')
asyncio.run(main())
