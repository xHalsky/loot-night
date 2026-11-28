# The RPG's music in play (#159): Ravenhold in town, the Crypt in the dungeon, Judgment while a boss stands (from its
# pack waiting in the corridor), back to the Crypt when he falls; paused it holds silently; none while the first
# Monday's launch runs (it has its own theme). Run after `npm run build`.
import asyncio
from playwright.async_api import async_playwright
GO = "a=>{const [act, arg] = a.split('|'); const e=document.createElement('button'); e.dataset.act=act; if (arg != null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
fails = []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        # the first Monday: the launch plays its own theme, no music under it
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        ev = lambda js: pg.evaluate(EV, js)
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(2500)
        check(await ev("L.launch.t()") > 0 and await ev("L.audio.musicNow()") is None, 'the first launch: no music under its theme')
        await pg.close()
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        pg.on('pageerror', lambda e: errs.append(str(e)))
        ev = lambda js: pg.evaluate(EV, js)
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await ev("g.realLifeOff = true; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map'); 0")
        for _ in range(60):
            st = await ev("L.audio.soundStatus()")
            if st['loaded'] + st['failed'] >= st['files']: break
            await pg.wait_for_timeout(100)
        await pg.wait_for_timeout(300)
        now = await ev("L.audio.musicNow()")
        check(now and now['cue'] == 'mus_town' and now['level'] == 1, f'in town: Ravenhold {now}')
        await ev("g.paused = true; 0"); await pg.wait_for_timeout(200)
        now = await ev("L.audio.musicNow()")
        check(now and now['cue'] == 'mus_town' and now['level'] == 0, f'paused: it holds, silent {now}')
        await ev("g.paused = false; 0"); await pg.wait_for_timeout(200)
        await pg.evaluate(GO, 'portal'); await pg.wait_for_timeout(400)
        now = await ev("L.audio.musicNow()")
        check(now and now['cue'] == 'mus_dungeon', f'down the portal: the Crypt {now}')
        for _ in range(200):
            if await ev("n.enemies.some(e => e.hp > 0)"): break
            await pg.wait_for_timeout(100)
        await ev("const e = n.enemies.find(e => e.hp > 0); e.boss = true; e.defId = 'bailiff'; e.hp = e.maxHp = 1e6; 0"); await pg.wait_for_timeout(300)
        now = await ev("L.audio.musicNow()")
        check(now and now['cue'] == 'mus_boss', f'a boss stands: Judgment {now}')
        await ev("n.enemies.forEach(e => { e.hp = 0; e.maxHp = 0; }); n.reserve = []; 0"); await pg.wait_for_timeout(500)
        now = await ev("L.audio.musicNow()")
        check(now and now['cue'] == 'mus_dungeon', f'he falls: back to the Crypt {now}')
        lp = await ev("L.audio.loopPoints()")
        for cue, sec in (('mus_town', 76.8), ('mus_dungeon', 64), ('mus_boss', 60)):
            s, e = lp[cue]
            check(abs((e - s) - sec) < 0.01 and 0.24 < s < 0.4, f'{cue} loops {s:.3f}..{e:.3f}')
        check(not errs, 'no page errors ' + str(errs[:2]))
        await b.close()
    print(f'{len(fails)} failed' if fails else 'all passed')
asyncio.run(main())
