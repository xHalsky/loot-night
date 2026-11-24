# His face in the webcam view (#37 reactions, #38 status): every expression, the eye flicks and the gear,
# cropped to him. Contact sheet: test/him_sheet.png. Run after a build.
import asyncio
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
N = "const n=window.__lootnight.S.g.night;"
RESET = N + "Object.assign(n.visit,{stage:'idle',result:'',checked:false,chat:null}); n.grin=0; n.tired=0; n.yawn=0; n.zone=0; n.headset=false; n.boost=0; n.scare=0; n.blink.state='open'; n.blink.lid=0; n.peek=0; n.peeking=false;"
CASES = [
    ('neutral', ''),
    ('she_comes_in', "Object.assign(n.visit,{stage:'in',kind:'peek',from:'tv',result:'',checked:false,t:99});"),
    ('pass_relief', "Object.assign(n.visit,{stage:'in',kind:'peek',from:'tv',result:'pass',checked:true,t:99});"),
    ('caught_panic', "Object.assign(n.visit,{stage:'in',kind:'peek',from:'tv',result:'caught',checked:true,t:99});"),
    ('cuddle_blush', "Object.assign(n.visit,{stage:'in',kind:'cuddle',from:'shower',result:'ask',checked:true,t:99});"),
    ('chat_good', "Object.assign(n.visit,{stage:'in',kind:'chat',from:'tv',result:'chat',checked:true,t:99,chat:{order:[0,1,2],asked:1,good:1,bad:0,t:5,line:'\"Hm?\"',last:0}});"),
    ('chat_meh', "Object.assign(n.visit,{stage:'in',kind:'chat',from:'tv',result:'chat',checked:true,t:99,chat:{order:[0,1,2],asked:1,good:0,bad:0,t:5,line:'\"Hm?\"',last:1}});"),
    ('chat_rude', "Object.assign(n.visit,{stage:'in',kind:'chat',from:'tv',result:'chat',checked:true,t:99,chat:{order:[0,1,2],asked:1,good:0,bad:1,t:5,line:'\"Hm?\"',last:2}});"),
    ('big_drop_grin', "n.grin=2;"),
    ('tired', "n.tired=40;"),
    ('yawn', "n.tired=40; n.yawn=1;"),
    ('nodding_off', "n.tired=60; n.blink.state='closing'; n.blink.lid=0.45;"),
    ('zone_focused', "n.headset=true; n.zone=1;"),
    ('headset', "n.headset=true; n.zone=0.4;"),
    ('peeking', "n.peek=0.5; n.peeking=true;"),
]
async def main():
    shots = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg, '[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const S=window.__lootnight.S; const n=S.g.night; n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; S.g.timeScale=0}")
        for name, js in CASES:
            await pg.evaluate("()=>{" + RESET + js + "}"); await pg.wait_for_timeout(250)
            path = f'test/him_{name}.png'
            await pg.screenshot(path=path, clip={'x': 48, 'y': 350, 'width': 200, 'height': 182}); shots.append((name, path))
        # eye flicks: a new sound from the kitchen (right) and the living room (left), headset off; then headset on
        S = "window.__lootnight.S"
        for name, room, what, hs in (('flick_kitchen', 'kitchen', 'KETTLE', False), ('flick_living', 'living', 'TV', False), ('headset_no_flick', 'kitchen', 'KETTLE2', True)):
            await pg.evaluate("([r,w,h])=>{" + RESET + f"const S={S}; S.timeScale=1; n.headset=h; n.apt.heard=r; n.apt.heardWhat=w; n.apt.heardAt=n.threat;" + "}", [room, what, hs])
            await pg.wait_for_timeout(120)
            await pg.evaluate(f"()=>{{{S}.g.timeScale=0}}")
            path = f'test/him_{name}.png'
            await pg.screenshot(path=path, clip={'x': 48, 'y': 350, 'width': 200, 'height': 182}); shots.append((name, path))
        print('ERRORS', errs); await b.close()
    cols = 6
    sheet = Image.new('RGB', (cols * 206, ((len(shots) + cols - 1) // cols) * 204), '#111')
    d = ImageDraw.Draw(sheet)
    for i, (name, path) in enumerate(shots):
        x, y = (i % cols) * 206, (i // cols) * 204
        sheet.paste(Image.open(path), (x, y + 20)); d.text((x + 4, y + 4), name, fill='#fff')
    sheet.save('test/him_sheet.png')
asyncio.run(main())
