# Her tease (fan-service step 1, #85) and come to bed (step 2, #89), with the real mouse: Saturday, her soft "babe?",
# she leans in the doorway (her window HER / pink, the dotted rose line); the pointer over the webcam is the eye and
# looking fills Goodwill (three hearts, Eyes busy on the skills); ignored she asks once more, then leaves pouting.
# Friday after 01:00: come to bed in your hoodie (COME TO BED), and Coming, babe ends the night on the green morning.
# Screens test/shots/tease_*.png.
import asyncio, os
from playwright.async_api import async_playwright
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
QUIET = "g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.apt.lastVisitEnd=1e9; n.dog.next=1e9; n.tease.left=0; n.tease.bedAt=1e9; 0"
LP = {'x': 0, 'y': 0, 'width': 296, 'height': 720}
CAM = (148, 260)   # over the webcam view (grid y 130)
shots, fails = [], []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for day in (5, 4):
            pg = await b.new_page(viewport={'width': 1280, 'height': 720})
            errs = []; pg.on('pageerror', lambda e: errs.append((e.stack or str(e))[:400]))
            go = lambda a, arg=None: pg.evaluate(GO, [a, arg]); ev = lambda js: pg.evaluate(EV, js)
            async def shot(name, wait=400, clip=LP):
                await pg.wait_for_timeout(wait); path = f'test/shots/tease_{name}.png'; await pg.screenshot(path=path, clip=clip); shots.append((name, path))
            async def click_hit(act):
                h = next((h for h in await pg.evaluate("()=>window.__lootnight.herHits") if h['act'] == act), None)
                if not h: return False
                await pg.mouse.click(h['x'] * 2 + h['w'], h['y'] * 2 + h['h']); await pg.wait_for_timeout(300); return True
            await pg.add_init_script(f'window.__lnDay = {day}'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
            await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
            await ev(QUIET); await go('portal'); await pg.wait_for_timeout(900)
            if day == 5:
                # --- Saturday: the tease ---
                await pg.mouse.move(800, 300)
                await ev("g.timeScale = 1; 0"); await go('dbgVisit', 'tease'); await pg.wait_for_timeout(150)
                check(await ev("n.visit.kind === 'tease' && n.apt.heardWhat === 'BABE?'"), 'Saturday: her soft "babe?", no footsteps')
                await shot('1_babe', 50)
                await pg.wait_for_timeout(2300)
                check(await ev("n.visit.stage === 'in'"), 'she leans in the doorway')
                await ev("g.paused = false; g.timeScale = 0.05; 0")
                await shot('2_doorway', 200)
                check(not await ev("n.looking"), 'pointer on the game: not looking')
                await pg.mouse.move(*CAM); await pg.wait_for_timeout(250)
                cur = await pg.evaluate("()=>document.getElementById('herArea').style.cursor")
                check(cur.startswith('url('), 'the pointer over the webcam is the eye')
                check(await ev("n.looking && L.abilitiesLocked ? true : n.looking"), 'looking at her')
                g0 = await ev("g.goodwill"); await shot('3_looking', 600)
                await shot('3b_full', 10, None)
                check(await ev("g.goodwill") > g0, f'Goodwill fills while you look ({g0} -> {round(await ev("g.goodwill"), 1)})')
                await ev("g.timeScale = 0.5; 0"); await pg.wait_for_timeout(6500)
                check(await ev("n.visit.result === 'kissed' || n.visit.stage === 'idle'"), '3 s of looking: a blown kiss')
                await ev("g.timeScale = 0.05; 0"); await shot('4_kissed', 50)
                await pg.mouse.move(800, 300); await ev("g.timeScale = 1; 0"); await pg.wait_for_timeout(2500)
                # ignored: once more, then a pout
                await ev("g.timeScale = 0.5; 0"); await go('dbgVisit', 'tease'); await pg.wait_for_timeout(4400 + 16200)
                check(await ev("!!n.visit.esc"), '"Baaabe.": once more')
                await ev("g.timeScale = 0.05; 0"); await shot('5_again', 200)
                await ev("g.timeScale = 0.5; 0"); await pg.wait_for_timeout(12500)
                check(await ev("n.visit.result === 'pout' || n.mood >= 10"), 'still ignored: she leaves pouting')
                await ev("g.timeScale = 0.05; 0"); await shot('6_pout', 50)
                check(await ev("n.catches") == 0, 'never a catch')
            else:
                # --- Friday after 01:00: come to bed ---
                await ev("n.clock = 25 * 60 + 15; n.apt.asleep = true; g.timeScale = 1; 0"); await go('dbgBedTease'); await pg.wait_for_timeout(2500)
                check(await ev("n.visit.kind === 'tease' && n.visit.bed && n.visit.stage === 'in'"), 'Friday after 01:00: come to bed')
                await ev("g.timeScale = 0.05; 0"); await pg.mouse.move(*CAM); await shot('7_bed', 500)
                await shot('7b_full', 10, None)
                check(await click_hit('comingBabe'), 'the Coming, babe pill')
                await pg.wait_for_timeout(1200)
                check(await ev("g.screen === 'results' && g.results.coming && g.results.ending === 'sleep'"), 'the night ends like Sleep')
                await shot('8_morning', 800, None)
            check(not errs, 'no page errors ' + ' | '.join(errs))
            await pg.close()
        await b.close()
    print('FAIL' if fails else 'PASS', len(shots), 'shots')
asyncio.run(main())
