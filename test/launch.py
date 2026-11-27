# The launch on the first Monday in Chrome (#127): it plays on a fresh save while the boys' chat comes in; nothing starts
# the night before 38 s (Let's go, Esc, Enter, the close box); the cue sheet fires each cue once, in order, on the
# launch's clock; pause holds it; the skip stops it and nothing fires after; then Let's go and the town fades in. Also
# the render time of the title and the login (F1). Stills: test/shots/launch_*.png. Run after `npm run build`.
import asyncio, os
from playwright.async_api import async_playwright
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
ok = True
def check(c, msg):
    global ok
    print(('ok   ' if c else 'FAIL ') + msg); ok = ok and bool(c)
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        ev = lambda js: pg.evaluate(EV, js)
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(600)
        await pg.mouse.click(640, 360)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(1500)
        st = await ev("L.audio.soundStatus()")
        check(st['loaded'] == st['files'] and not st['failed'], f"every sound decoded ({st['loaded']} files)")
        check(await ev("!!g.voice && g.voice.launch && L.launch.t() > 0.5"), 'a fresh save: the first Monday plays the launch with the boys\' chat')
        px = await pg.evaluate("()=>{const c=document.getElementById('rpgArea'); const d=c.getContext('2d').getImageData(200,150,1,1).data; return [d[0],d[1],d[2]]}")
        check(await ev("L.launch.t()") < 3 and px[1] > 80 and px[0] < 60, f'the monitor runs it: the Windows desktop first {px}')
        # nothing starts the night before it ends
        for key in ('Escape', 'Enter', ' '):
            await pg.keyboard.press(key); await pg.wait_for_timeout(80)
        await pg.evaluate(GO, 'voiceOk'); await pg.wait_for_timeout(80)
        check(await ev("!!g.voice && g.howto"), 'Esc, Enter, Space and Let\'s go do nothing while it loads')
        check(await pg.evaluate("()=>getComputedStyle(document.getElementById('phClose')).visibility") == 'hidden', 'no close box on the phone while it loads')
        check(await ev("n.threat") < 0.5, 'the night has not started')
        # pause holds the clock
        t0 = await ev("L.launch.t()"); await ev("g.paused = true; 0"); await pg.wait_for_timeout(700); t1 = await ev("L.launch.t()"); await ev("g.paused = false; 0")
        check(abs(t1 - t0) < 0.05, f'pause holds it ({t0:.2f} -> {t1:.2f})')
        # the render time of the title and the login (the frames the desk waits on)
        await ev("g.debug = true; 0")
        ms = {}
        for name, T in (('title', 19.6), ('login', 26.0), ('halsky', 8.5)):
            await ev(f"L.launch.seek({T}); 0"); await pg.wait_for_timeout(1200)
            txt = await pg.evaluate("()=>document.querySelector('.debug').innerText")
            import re
            m = re.search(r'render ([0-9.]+) ms', txt); ms[name] = float(m.group(1)) if m else -1
            await pg.screenshot(path=f'test/shots/launch_{name}.png')
        print('render ms', ms)
        check(all(0 < v < 33 for v in ms.values()), 'the launch draws inside a 30 fps frame (title, login, Halsky Labs)')
        await ev("g.debug = false; 0")
        # back to the start: let it play for real and listen to the cue sheet
        await ev("L.launch.seek(0); 0"); await pg.wait_for_timeout(100)
        await ev("L.launch.fired.length = 0; 0")
        await pg.wait_for_timeout(15200)
        fired = await ev("L.launch.fired.map(f=>f.join(':'))")
        times = [float(f.split(':')[0]) for f in fired]
        check(times == sorted(times), f'the cues fire in order ({len(fired)} by 15 s)')
        check(len(fired) == len(set(fired)), 'each once')
        names = [f.split(':')[1] for f in fired]
        check(names[:4] == ['mouse', 'mouse', 'hdd', 'crt'] and 'hl_land' in names and 'ps_flip' in names, 'the PC, then Halsky Labs, then Procrastination Studios')
        # the skip: straight to the end, nothing after
        await pg.keyboard.press('F1'); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{const b=[...document.querySelectorAll('[data-act=dbgSkipLaunch]')][0]; b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}")
        await pg.wait_for_timeout(300)
        n_after_skip = await ev("L.launch.fired.length")
        await pg.wait_for_timeout(1500)
        check(await ev("L.launch.fired.length") == n_after_skip and await ev("L.launch.t()") >= 38, 'Skip the launch: at its end, nothing fires after it')
        await pg.keyboard.press('F1')
        await pg.wait_for_timeout(500)
        await pg.screenshot(path='test/shots/launch_after_skip.png')
        await pg.evaluate(GO, 'voiceOk'); await pg.wait_for_timeout(300)
        check(await ev("!g.voice"), "after it: Let's go works")
        check(await ev("n.log.some(l=>l.text.startsWith('Welcome to Age of Judgment'))"), 'the welcome line in the feed')
        print('ERRORS', errs); check(not errs, 'no page errors')
        await b.close()
    print('PASS' if ok else 'FAIL')
asyncio.run(main())
