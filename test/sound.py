# Sound check in Chrome: every inlined file decodes, loops sit where they should, her loops follow her activity,
# the headset does not stop them, and the F1 sound board renders. Run after `npm run build`.
import asyncio, json
from playwright.async_api import async_playwright
LOOPS = {'tv': 9, 'kettle': 4, 'shower': 4}
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def main():
    ok = True
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.mouse.click(640, 360)
        await act(pg, '[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.wait_for_timeout(2500)
        st = await pg.evaluate("()=>window.__lootnight.audio.soundStatus()")
        print('status', st)
        if st['loaded'] != st['files'] or st['failed']: ok = False; print('FAIL: not every file decoded')
        lp = await pg.evaluate("()=>window.__lootnight.audio.loopPoints()")
        for cue, sec in LOOPS.items():
            s, e = lp[cue]
            good = abs((e - s) - sec) < 0.01 and 0.24 < s < 0.4
            print(f'loop {cue}: {s:.3f}..{e:.3f}', 'ok' if good else 'FAIL'); ok &= good
        await pg.evaluate("()=>{const S=window.__lootnight.S; const n=S.g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9;}")
        cases = [("tv", "living", 30, False, 'tv'), ("tea", "kitchen", 15, False, 'kettle'), ("shower", "bathroom", 80, False, 'shower'),
                 ("shower", "bathroom", 2, True, None), ("phone", "bedroom", 10, False, None)]
        for act_id, room, t, cued, want in cases:
            await pg.evaluate("([a,r,t,c])=>{const n=window.__lootnight.S.g.night; Object.assign(n.apt,{activity:a,room:r,moving:0,t:t,cued:c,asleep:false,calm:999}); n.visit.stage='idle';}", [act_id, room, t, cued])
            await pg.wait_for_timeout(300)
            now = await pg.evaluate("()=>window.__lootnight.audio.ambienceNow()")
            got = now['cue'] if now else None
            print(f'{act_id:6} cued={cued!s:5} -> {got}', 'ok' if got == want else f'FAIL (want {want})'); ok &= got == want
        await pg.keyboard.press('h'); await pg.wait_for_timeout(300)   # headset on: still looping (muffled, not stopped)
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; Object.assign(n.apt,{activity:'tv',room:'living',moving:0,t:30,cued:false});}")
        await pg.wait_for_timeout(300)
        now = await pg.evaluate("()=>window.__lootnight.audio.ambienceNow()")
        print('headset on ->', now and now['cue'], 'ok' if now and now['cue'] == 'tv' else 'FAIL'); ok &= bool(now and now['cue'] == 'tv')
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.visit.stage='far';}"); await pg.wait_for_timeout(200)
        now = await pg.evaluate("()=>window.__lootnight.audio.ambienceNow()")
        print('visit ->', now, 'ok' if now is None else 'FAIL'); ok &= now is None
        await pg.keyboard.press('F1'); await pg.wait_for_timeout(300)
        r = await pg.evaluate("()=>{const e=document.querySelector('.debug').getBoundingClientRect(); return [e.left,e.top,e.width,e.height]}")
        await pg.screenshot(path='test/sound_board.png', clip={'x': r[0], 'y': r[1], 'width': r[2], 'height': r[3]})
        print('ERRORS', errs); ok &= not errs
        await b.close()
    print('PASS' if ok else 'FAIL')
asyncio.run(main())
