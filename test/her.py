# Her panel (V4, #69; grid doc 7b): the webcam dithered onto the grid and her PC-98 UI, in the game's states, next to
# the redesign's stills where there is one (028 kettle, 029 footsteps, 030 shower). Real clicks on her buttons and
# answers. Writes test/shots/her_*.png and the sheet test/shots/her_sheet.png.
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
LP = {'x': 0, 'y': 0, 'width': 296, 'height': 720}
shots = []
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append((e.stack or str(e))[:400]))
        go = lambda a, arg=None: pg.evaluate(GO, [a, arg]); ev = lambda js: pg.evaluate(EV, js)
        async def shot(name, wait=500):
            await pg.mouse.move(700, 60); await pg.wait_for_timeout(wait)
            path = f'test/shots/her_{name}.png'; await pg.screenshot(path=path, clip=LP); shots.append((name, path))
        hits = lambda: pg.evaluate("()=>window.__lootnight.herHits")
        async def click_hit(act, arg=None):
            hs = await hits(); h = next((h for h in hs if h['act'] == act and (arg is None or h['arg'] == str(arg))), None)
            assert h, f'no {act}:{arg} on her panel: {[x["act"] + ":" + x["arg"] for x in hs if x["act"]]}'
            await pg.mouse.click(h['x'] * 2 + h['w'], h['y'] * 2 + h['h'])
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        await ev("g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog'); n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.visit.nextAt=1e9; g.nightsPlayed=1; 0")
        await go('portal'); await pg.wait_for_timeout(800)
        # the kettle, the door ajar (he peeks): still 028
        await ev("n.apt.activity='kettle'; n.apt.room='kitchen'; n.apt.heard='kitchen'; n.apt.heardWhat='KETTLE'; n.apt.heardAt=n.threat; n.peek=0.55; n.peeking=true; 0")
        await shot('kettle')
        await ev("n.peek=0; n.peeking=false; 0")
        # footsteps: still 029
        await ev("n.apt.heardWhat='STEPS'; n.apt.heard='hallway'; n.apt.heardAt=n.threat; n.visit.stage='far'; n.visit.t=30; n.visit.kind='chat'; 0")
        await shot('steps')
        await ev("n.visit.stage='idle'; 0")
        # the shower daydream: still 030
        await ev("n.apt.activity='shower'; n.apt.room='bathroom'; n.apt.heard='bathroom'; n.apt.heardWhat='SHOWER'; n.apt.heardAt=n.threat; n.apt.moving=0; n.apt.t=5; 0")
        await shot('shower', 800)
        # a chat in the doorway: her question and three answers; a real click answers
        await ev("n.apt.activity='tv'; n.visit.stage='in'; n.visit.kind='chat'; n.visit.checked=true; n.visit.t=8; n.visit.result='chat'; n.monitor='excel'; n.visit.chat={order:[0,1,2], asked:0, good:0, bad:0, t:8, line:'\"Do you think I should cut my hair short?\"', last:-1}; 0")
        await shot('chat', 600)
        await click_hit('chatAnswer'); await pg.wait_for_timeout(150)
        asked = await ev("n.visit.chat ? n.visit.chat.asked : -1"); assert asked != 0, 'a click on her answer did nothing'
        # the snack run at the door: the plate
        await ev("n.visit.chat=null; n.visit.result='offer'; n.visit.kind='snack'; n.visit.t=3; 0"); await shot('plate')
        await click_hit('takePlate'); await pg.wait_for_timeout(150)
        took = await ev("n.visit.result"); assert took != 'offer', f'take the plate: {took}'
        # a cuddle ask
        await ev("n.visit.result='ask'; n.visit.kind='cuddle'; n.visit.t=6; 0"); await shot('cuddle')
        await ev("n.visit.stage='idle'; n.visit.result=''; n.monitor='rpg'; 0")
        # headset on; asleep after midnight
        await ev("n.headset=true; 0"); await shot('headset')
        await ev("n.headset=false; n.clock=24*60+40; n.apt.asleep=true; n.apt.wake=35; n.noise=22; n.apt.heardWhat='ZZZ'; n.apt.heard='bedroom'; n.apt.heardAt=n.threat; 0"); await shot('asleep')
        await ev("n.apt.asleep=false; n.apt.wake=0; n.clock=21*60; 0")
        # away from the PC (charging the phone, #57): the chair stands empty
        await ev("n.home.batt = 30; 0"); await go('charge'); await pg.wait_for_timeout(300)
        away = await ev("!!(n.pre && n.pre.away)"); assert away, 'Charge did not start'
        await shot('away', 300)
        print('errors:', errs or 'none'); await b.close()
    stills = {'kettle': '028__her__panel__kettle-peeking.png', 'steps': '029__her__panel__footsteps.png', 'shower': '030__her__panel__shower.png'}
    tiles = []
    for name, path in shots:
        tiles.append(Image.open(path).convert('RGB'))
        if name in stills: tiles.append(Image.open('design/redesign/stills/' + stills[name]).convert('RGB').crop((0, 0, 148, 360)).resize((296, 720), Image.NEAREST))
    cols = 6; sheet = Image.new('RGB', (cols * 300, ((len(tiles) + cols - 1) // cols) * 724), (20, 14, 24))
    for i, im in enumerate(tiles): sheet.paste(im, ((i % cols) * 300, (i // cols) * 724))
    sheet.save('test/shots/her_sheet.png'); print('sheet', sheet.size, [n for n, _ in shots])
asyncio.run(main())
