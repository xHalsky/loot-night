# The right screen round the monitor (V3, #68; grid doc §7): the desk drawn by the renderer in the game's states.
# A call on the desk phone, a text banner, face down with a call glowing under it, Excel, the headset's Zone aura,
# Tired with the Drink button glowing, the witching hour; real clicks on the taskbar, the Drink button and the phone.
# Writes test/shots/desk_*.png and the sheet test/shots/desk_sheet.png.
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
        errs = []; pg.on('pageerror', lambda e: errs.append((e.stack or str(e))[:400]))
        go = lambda a, arg=None: pg.evaluate(GO, [a, arg]); ev = lambda js: pg.evaluate(EV, js)
        async def shot(name, wait=400):
            await pg.mouse.move(60, 100); await pg.wait_for_timeout(wait); path = f'test/shots/desk_{name}.png'; await pg.screenshot(path=path, clip=RS); shots.append(path)
        at = lambda x, y: (296 + x * 2 + 1, y * 2 + 1)   # right-screen grid px -> page px
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        await ev("g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.visit.nextAt=1e9; 0")
        await go('portal'); await shot('dungeon', 1500)
        await go('dbgMom'); await shot('call', 600)
        # a real click on the phone lying on the desk picks it up
        ph = await pg.evaluate("()=>{const r=document.getElementById('deskPhone').getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height*0.35]}")
        await pg.mouse.click(*ph); await pg.wait_for_timeout(300)
        up = await ev("!!n.game"); assert up, 'the desk phone did not pick up'
        await go('closeGame'); await ev("n.interrupts=[]; 0")
        # the red Decline on the ringing desk phone, a real click: Mom will call back
        await go('dbgMom'); await pg.wait_for_timeout(400)
        dc = await pg.evaluate("()=>{const h=window.__lootnight.deskHits.find(h=>h.act==='decline'); return h && [296+(h.x+h.w/2)*2, (h.y+h.h/2)*2]}")
        assert dc, 'no Decline on the ringing desk phone'
        await ev("n.momCallback=0; 0"); await pg.mouse.click(*dc); await pg.wait_for_timeout(200)
        dec = await ev("[n.interrupts.length, n.momCallback > 0, !!n.game]"); assert dec == [0, True, False], f'desk Decline: {dec}'
        await ev("n.momCallback=0; 0")
        await go('dbgBoss'); await shot('text', 2200)
        await ev("n.interrupts=[]; n.phoneDown=1; 0"); await go('dbgMom'); await shot('facedown_call', 700)
        await ev("n.interrupts=[]; n.phoneDown=0; 0")
        # the taskbar: Excel with a real click, then back
        await pg.mouse.click(*at(9 + 48 + 79 + 30, 241 + 8)); await pg.wait_for_timeout(2800)
        mon = await ev("n.monitor"); assert mon == 'excel', f'taskbar Excel: {mon}'
        await shot('excel', 300)
        await pg.mouse.click(*at(9 + 48 + 30, 241 + 8)); await pg.wait_for_timeout(2800)
        mon = await ev("n.monitor"); assert mon == 'rpg', f'taskbar Loot Night: {mon}'
        await ev("n.headset=true; n.zone=0.8; 0"); await shot('headset', 600)
        await ev("n.headset=false; n.zone=0; n.tired=44; 0"); await shot('tired', 400)
        cans = await ev("g.monsters")
        await pg.mouse.click(*at(355 + 90 + 20, 267 + 3 + 10)); await pg.wait_for_timeout(400)
        drink = await ev("n.game && n.game.kind")
        await ev("n.game=null; n.action='none'; 0")
        await ev("n.clock=25*60+12; n.tired=58; n.everCaught=true; 0"); await shot('witching', 500)
        print('desk Decline: ok | drink button opened:', drink, 'errors:', errs or 'none'); await b.close()
    ims = [Image.open(s).resize((492, 360)) for s in shots]
    sheet = Image.new('RGB', (2 * 498, ((len(ims) + 1) // 2) * 366), (20, 14, 24))
    for i, im in enumerate(ims): sheet.paste(im, ((i % 2) * 498, (i // 2) * 366))
    sheet.save('test/shots/desk_sheet.png'); print('sheet', sheet.size)
asyncio.run(main())
