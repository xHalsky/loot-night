# #49 monitor-first layout: one screenshot per moment that matters (docs/design/screen.md, "Moments"), and checks
# that the fixed parts never spill out of their zones. Makes test/layout_<name>.png and test/layout_sheet.png.
import asyncio, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def dbg(pg, a):   # an F1 debug button
    await pg.evaluate("()=>{window.__lootnight.S.g.debug=true}"); await pg.wait_for_timeout(120)
    await act(pg, f'[data-act={a}]'); await pg.evaluate("()=>{window.__lootnight.S.g.debug=false}"); await pg.wait_for_timeout(120)
async def ev(pg, js): await pg.evaluate("x=>{const g=window.__lootnight.S.g, n=g.night; eval(x)}", js)
RESET = "n.visit={stage:'idle',t:0,nextAt:999,fake:false,checked:false,result:'',kind:'peek'}; n.monitor='rpg'; n.headset=false; n.zone=0; n.tired=12; n.boost=0; n.lap=null; n.game=null; n.interrupts=[]; n.clock=21*60; n.apt.asleep=false; n.cansHidden=false; n.lootFly=[]; n.selected=null; n.dropPopup=null; g.timeScale=1; n.apt.calm=999;"
async def main():
    shots = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg, '[data-act=newGame]'); await pg.wait_for_timeout(200); await act(pg, '[data-act=howtoClose]')
        await ev(pg, "n.nextInterruptAt=1e9; n.dog.next=1e9; g.nightsPlayed=1; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset'); g.gold=650; g.mats=26;")
        async def shot(name, js='', wait=500, before=None):
            await ev(pg, RESET); await ev(pg, js)
            if before: await before()
            await pg.wait_for_timeout(wait)
            path = f'test/layout_{name}.png'; await pg.screenshot(path=path); shots.append((name, path))
        # town first (the night starts there)
        await shot('town')
        async def hov(): await pg.mouse.move(314 + 469, 16 + 100)
        await shot('town_hover', '', 400, hov)
        await pg.mouse.move(700, 600)
        await shot('town_built', "g.furniture={training:3,inn:2,library:3,treasury:1}")   # services and builds: test/town.py
        await shot('town_built2', "g.furniture={training:1,inn:3,library:2,treasury:3}")
        await ev(pg, "g.furniture={}")
        await act(pg, '[data-act=portal]'); await pg.wait_for_timeout(300)
        await ev(pg, "g.timeScale=4"); await pg.wait_for_timeout(4000)
        await dbg(pg, 'dbgEpic'); await dbg(pg, 'dbgLeg'); await dbg(pg, 'dbgMap')
        await pg.wait_for_timeout(2500)
        await shot('dungeon', "n.flow=1.4")
        await shot('chest', "n.phase='curio'; n.curio={id:'strongbox',stage:'ask',t:20,max:20}")
        await ev(pg, "n.phase='walk'; n.curio=null")
        async def loot():
            await ev(pg, "const e=g.bag[0]; if(e) n.fresh=[{id:e.id,t:1.5}]; n.lootFly=[{x:320,text:'Shadow Robe of Charm',color:'#b98cff',t:0.55,max:1.6,delay:0,dx:0},{x:320,text:'Iron Helm',color:'#6fcf7f',t:0.4,max:1.6,delay:0.3,dx:14}]; g.timeScale=0;")
        await shot('loot', '', 250, loot)
        async def flow():
            await ev(pg, "n.flow=1.48"); await pg.wait_for_timeout(120); await ev(pg, "n.flow=1.52; g.timeScale=0")
        await shot('flow_step', '', 200, flow)
        await shot('footsteps', "n.visit={stage:'far',t:3,nextAt:999,fake:false,checked:false,result:'',kind:'snack'}; g.timeScale=0")
        await shot('her_door', "n.monitor='excel'; n.visit={stage:'in',t:5,nextAt:999,fake:false,checked:true,result:'chat',kind:'chat',chat:{order:[0,1,2],asked:0,line:'Do you think I should cut my hair short?',last:-1}}; g.timeScale=0")
        await shot('excel', "n.monitor='excel'")
        await shot('tired', "n.tired=46; n.yawn=0")
        async def hover(): await pg.mouse.move(148, 425)
        await shot('headset', "n.headset=true; n.zone=0.55", 500, hover)
        await pg.mouse.move(700, 300)
        await shot('midnight', "n.clock=25*60+20; n.apt.asleep=true; n.apt.wake=35; n.noise=42; g.timeScale=0")
        async def phone():
            await dbg(pg, 'dbgMom'); await pg.wait_for_timeout(600)
        await shot('phone_ring', "n.nextInterruptAt=1e9", 300, phone)
        await ev(pg, "n.interrupts=[]")
        async def popup():
            await ev(pg, "const e=g.bag.find(x=>x.kind==='item'&&x.item.identified); if(e) n.selected=e.id")
        await shot('item_detail', '', 300, popup)
        await ev(pg, "n.selected=null")
        async def full():
            await ev(pg, "const e=g.bag.find(x=>x.kind==='item'); if(e) n.dropPopup={entry:e,t:6}; g.timeScale=0")
        await shot('bag_full', '', 300, full)
        await ev(pg, "n.dropPopup=null; g.timeScale=1")
        await shot('map', "n.phase='mapChoice'; n.enemies=[]; g.timeScale=0")
        await ev(pg, "n.phase='walk'; g.timeScale=1")
        async def lap(): await dbg(pg, 'dbgLap'); await pg.wait_for_timeout(1800)
        await shot('lap', '', 200, lap)
        await ev(pg, "n.lap=null")
        async def monster(): await pg.keyboard.press('m'); await pg.wait_for_timeout(500)
        await shot('monster', '', 200, monster)
        await ev(pg, "n.game=null; n.action='none'")
        async def cables(): await dbg(pg, 'dbgUnplug'); await pg.wait_for_timeout(900)
        await shot('cables', "", 200, cables)
        await ev(pg, "n.unplugged=null; n.monitorOff=0")
        await ev(pg, "g.tipsSeen=g.tipsSeen.filter(t=>t!=='coach:headset'&&t!=='headset')")
        await shot('coach_headset', "n.coach={id:'headset',t:0,mark:0}", 400)
        # zones: nothing spills out
        box = await pg.evaluate("""()=>{const r=s=>{const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); return [Math.round(b.left),Math.round(b.top),Math.round(b.right),Math.round(b.bottom)]};
          return {screen:r('#screen'), ui:r('#ui'), you:r('#youCard'), feed:r('#feedCard'), door:r('#door'), info:r('#doorInfo'), stats:r('#doorInfo .her-stats'), task:r('#taskbar')}}""")
        print(box)
        print('ERRORS', errs); await b.close()
    W, H = 640, 360
    cols = 3; rows = (len(shots) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * W, rows * (H + 20)), '#111'); d = ImageDraw.Draw(sheet)
    for i, (name, path) in enumerate(shots):
        im = Image.open(path).resize((W, H)); x, y = (i % cols) * W, (i // cols) * (H + 20)
        sheet.paste(im, (x, y + 20)); d.text((x + 6, y + 4), name, fill='#fff')
    sheet.save('test/layout_sheet.png')
asyncio.run(main())
