# The smart home and the battery (step 6, #57; grid doc 7j), with the real mouse: on Thursday the phone's home screen
# has the battery widget and the Home app; the Shop's Home tab sells the devices and the New phone sells; the Home app
# shows the build's plan with what is installed; a device's sheet (the vacuum with its room chips, a speaker, the TV
# cast, the door seal) takes its battery; the bubble tea card; resting and running on the plan; low at 20% (the desk
# phone's crimson block), dead at 0% (black in your hand, only Charge it; the desk shows the empty battery);
# Charge: 15 s away (the empty chair), +40%. Screens test/shots/home_*.png, sheet test/shots/home_sheet.png next to
# stills 103, 113 to 120, 133, 134.
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
QUIET = "g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.apt.lastVisitEnd=1e9; n.dog.next=1e9; g.timeScale=0.25; 0"
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
        async def shot(name, wait=250, clip=None):
            await pg.wait_for_timeout(wait); path = f'test/shots/home_{name}.png'; await pg.screenshot(path=path, clip=clip); shots.append((name, path))
        async def hits():
            return await pg.evaluate("()=>window.__lnPhone()")
        async def tap(act, arg=None):
            h = next((h for h in await hits() if h['act'] == act and (arg is None or h['arg'] == arg)), None)
            if not h: return False
            await pg.mouse.click(h['x'], h['y']); await pg.wait_for_timeout(250); return True
        async def pick_up():
            ph = await pg.evaluate("()=>{const h=(window.__lootnight.deskHits||[]).find(h=>h.act==='phone'); return h ? [296 + (h.x + h.w / 2) * 2, (h.y + h.h / 2) * 2] : null}")
            await pg.mouse.move(*ph); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(500)
        await pg.add_init_script('window.__lnDay = 3'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        await ev(QUIET); await go('portal'); await pg.wait_for_timeout(800)

        # --- Thursday: the battery widget, the Shop's Home tab ---
        await ev("g.zl = 5000; 0")
        await pick_up()
        check(await ev("n.phApp") == 'home' and any(h['act'] == 'charge' for h in await hits()) is False, 'the home screen: Charge dim at 100%')
        check(any(h['act'] == 'phApp' and h['arg'] == 'homeapp' for h in await hits()), 'the Home app on the home screen')
        await shot('1_home_screen')
        await tap('phApp', 'shop'); await tap('shopTab', 'home'); await shot('2_shop_home')
        for it in ['vacuum', 'speaker', 'tv', 'seal']: check(await tap('shopBuy', it), f'{it} bought')
        check(not any(h['act'] == 'shopBuy' and h['arg'] == 'tea' for h in await hits()), 'bubble tea: ordered in the Home app')
        await tap('shopTab', 'you'); check(await tap('shopBuy', 'phone'), 'the New phone sells'); await ev("g.owned = g.owned.filter(x => x !== 'phone'); g.zl = 5000; 0")
        await tap('phApp', 'home')

        # --- the Home app ---
        await tap('phApp', 'homeapp')
        check(await ev("n.phApp") == 'homeapp', 'the Home app opens'); await shot('3_home_app')
        check(await tap('homePick', 'vacuum'), 'the vacuum\'s sheet'); await tap('homeRoom', 'kitchen'); await shot('4_vacuum_sheet')
        b0 = await ev("n.home.batt"); await ev("n.apt.room='kitchen'; n.apt.activity='tea'; n.apt.moving=0; n.apt.asleep=false; 0")
        calm0 = await ev("n.apt.calm")
        check(await tap('homeUse'), 'Start')
        check(await ev("n.home.batt") == b0 - 20 and await ev("n.apt.calm") >= calm0 + 44, f'the vacuum: -20%, her next visit 45 s later ({b0} -> {await ev("n.home.batt")})')
        check(await tap('homePick', 'tv'), 'the TV cast\'s sheet'); await shot('5_tv_sheet')
        await tap('homePick', ''); check(await tap('homePick', 'seal'), 'the door seal\'s sheet'); await shot('6_seal_sheet')
        await tap('homeUse'); check(await ev("n.seal") and await ev("n.home.batt") == b0 - 24, 'sealed: -4%')
        check(await tap('homeTea'), 'bubble tea ordered'); check(await ev("n.home.bells.length") == 1 and await ev("g.zl") == 4975, 'the doorbell is coming; 25 zł')
        await tap('homePick', 'speaker:kitchen'); await tap('homeUse'); await tap('homePick', '')
        await shot('7_busy')
        await tap('homePick', 'vacuum'); check(any(h['act'] == 'homeUse' for h in await hits()) is False, 'the vacuum rests: no Start'); await tap('homePick', '')

        # --- low, dead, Charge ---
        await ev("n.home.batt = 22; 0"); await tap('homePick', 'tv'); await tap('homeUse'); await tap('phApp', 'home')
        check(await ev("n.home.lowShow > 0") and await ev("n.home.batt") == 14, 'at 20%: the low alert')
        await shot('8_battery_low')
        await go('preMenu'); await pg.wait_for_timeout(300)
        await ev("n.home.lowShow = 3; 0"); await shot('9_desk_low', 200, {'x': 296, 'y': 400, 'width': 500, 'height': 320})
        await ev("n.home.batt = 4; 0"); await pick_up(); await tap('phApp', 'homeapp'); await tap('homePick', 'seal'); await tap('homeUse')
        check(await ev("n.home.batt") == 0 and await ev("n.home.deadShow > 0"), 'the seal takes the last of it: dead')
        await go('preMenu'); await pg.wait_for_timeout(300); await shot('10_desk_dead', 200, {'x': 296, 'y': 400, 'width': 500, 'height': 320})
        await pick_up(); check(any(h['act'] == 'charge' for h in await hits()), 'dead in your hand: Charge it'); await shot('11_dead')
        mood = await ev("n.mood"); await ev("n.phoneScript=[{kind:'mom', at: 0, done:false}]; n.threat = 999; 0")
        await go('preMenu'); await pg.wait_for_timeout(400)
        check(await ev("n.phoneScript[0].done") and await ev("n.mood") > mood and not await ev("n.interrupts.length"), 'dead: Mom\'s call counts as ignored (she calls Babe)')
        await pick_up(); await tap('charge')
        check(await ev("n.pre && n.pre.id") == 'charge' and await ev("n.pre.away"), 'Charge: away from the PC'); await shot('12_charging', 600)
        await ev("n.pre.t = 0.01; 0"); await pg.wait_for_timeout(400)
        check(await ev("n.home.batt") == 40 and not await ev("n.pre"), f'+40% ({await ev("n.home.batt")})')
        check(not errs, 'errors: ' + ('none' if not errs else errs[0]))
        await b.close()
    pair = {'1_home_screen': '103__interruptions__phone-in-hand__home-screen', '2_shop_home': '113__interruptions__phone-in-hand__shop-home', '3_home_app': '114__interruptions__phone-in-hand__home-app',
            '4_vacuum_sheet': '115__interruptions__phone-in-hand__home-vacuum', '5_tv_sheet': '116__interruptions__phone-in-hand__home-tv-cast', '6_seal_sheet': '117__interruptions__phone-in-hand__home-door-seal',
            '7_busy': '118__interruptions__phone-in-hand__home-busy', '8_battery_low': '119__interruptions__phone-in-hand__battery-low', '11_dead': '120__interruptions__phone-in-hand__battery-dead',
            '9_desk_low': '133__interruptions__phone-on-desk__low-battery', '10_desk_dead': '134__interruptions__phone-on-desk__dead'}
    rows = [(n, Image.open(pth).convert('RGB')) for n, pth in shots]
    sheet = Image.new('RGB', (1280 * 2 + 8, len(rows) * 728), (20, 16, 26))
    for i, (n, im) in enumerate(rows):
        sheet.paste(im.resize((1280, 720)) if im.size != (1280, 720) else im, (0, i * 728))
        if n in pair: sheet.paste(Image.open(f'design/redesign/stills/{pair[n]}.png').convert('RGB').resize((1280, 720), Image.NEAREST), (1288, i * 728))
    sheet.save('test/shots/home_sheet.png'); print('sheet', sheet.size, [n for n, _ in rows])
    print('PASS' if not fails else f'FAILED {len(fails)}')
asyncio.run(main())
