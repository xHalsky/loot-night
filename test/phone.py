# Phone minigames (#45): every stage of every phone game, one screenshot each, plus a contact sheet
# (test/phone_sheet.png). Builds each game state directly so long lines and full threads are covered.
import asyncio, json
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
BASE = dict(kind='phone', t=12, max=20, unlock=0, holding=False, drag=0, beat=0, misses=0, sweep=0, zone=0.45, need=0, line='', read=0, row=0, rows=[], feedback='', msgs=[])
CASES = [
  ('ring_mom', dict(app='mom', stage='ringing')),
  ('ring_courier', dict(app='courier', stage='ringing')),
  ('lock_boss1', dict(app='boss', stage='locked', msgs=['you there?'])),
  ('lock_boss3', dict(app='boss', stage='locked', msgs=['you there?', 'quick question', 'need the Q4 totals for the deck'])),
  ('lock_her3', dict(app='text', stage='locked', msgs=['are you coming to bed?', 'babe', 'its really late'], unlock=0.4)),
  ('chat_boss', dict(app='boss', stage='chat', msgs=['you there?', 'quick question', 'need the Q4 totals for the deck', 'asap pls'], row=1, rows=[{'a': 7, 'b': 8, 'options': [15, 19, 12]}, {'a': 9, 'b': 6, 'options': [12, 15, 19]}, {'a': 4, 'b': 5, 'options': [9, 13, 6]}], feedback='Wrong. Try again.')),
  ('chat_her', dict(app='text', stage='chat', msgs=['are you coming to bed?', 'babe', 'its really late', 'hello??'])),
  ('call_mom', dict(app='mom', stage='call', line='Did you see my message on Facebook?', need=1, misses=1, beat=1, feedback='Too slow. She keeps talking.')),
  ('call_mom2', dict(app='mom', stage='call', line='So Basia said the pierogi were too salty...', need=0, read=1)),
  ('talk_courier', dict(app='courier', stage='talk', line='"Hi, courier. Intercom is broken. Can you come out?"', opts=['Can a neighbour take it?', 'Leave it on the street', 'One sec, boss fight'], need=0, feedback='')),
  ('talk_friends', dict(app='friends', stage='talk', line='Rafał: "BRO. Raid. Now. Bring snacks."', opts=["Shh, she's next door. Text only, love you guys.", "WHAT? I CAN'T HEAR YOU", 'Nah'], need=0, misses=1, feedback='On speaker!')),
]
async def main():
    shots = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=2)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(400)
        await act(pg, '[data-act=newGame]'); await pg.wait_for_timeout(200); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g, n=g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup');}")
        for name, c in CASES:
            game = dict(BASE); game.update(c)
            await pg.evaluate("g=>{const L=window.__lootnight, n=L.S.g.night; n.game=g; n.action='miniGame'; L.S.g.timeScale=0;}", game)
            await pg.wait_for_timeout(350)
            el = await pg.query_selector('.phone-win')
            bb = await el.bounding_box()
            over = await pg.evaluate("""()=>{const out=[]; const scr=document.querySelector('.ph-screen').getBoundingClientRect();
              document.querySelectorAll('.ph-screen *').forEach(e=>{const r=e.getBoundingClientRect(); if(r.width&&(r.right>scr.right+0.5||r.left<scr.left-0.5||r.bottom>scr.bottom+0.5)) out.push((e.className||e.tagName)+':'+Math.round(r.right-scr.right)+','+Math.round(r.bottom-scr.bottom));
                if(e.scrollWidth>e.clientWidth+1 && getComputedStyle(e).overflow!=='visible' && e.clientWidth) out.push('clip:'+(e.className||e.tagName));}); return out}""")
            print(f'{name:13}', 'OK' if not over else over[:6])
            path = f'test/phone_{name}.png'
            await pg.screenshot(path=path, clip={'x': bb['x'] - 6, 'y': bb['y'] - 6, 'width': bb['width'] + 12, 'height': bb['height'] + 12})
            shots.append((name, path))
        # the desk phone: idle menu, an incoming call, a burst of messages (face up and face down)
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.game=null; n.action='idle'; n.preMenu='phone'}"); await pg.wait_for_timeout(300)
        DESK = {'x': 296, 'y': 420, 'width': 480, 'height': 300}   # the desk's left part (#49)
        await pg.screenshot(path='test/phone_desk_menu.png', clip=DESK); shots.append(('desk_menu', 'test/phone_desk_menu.png'))
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.preMenu=null; n.interrupts=[{kind:'mom',t:12,max:20,msgs:[],pend:[],pingAt:-9}]}"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/phone_desk_call.png', clip=DESK); shots.append(('desk_call', 'test/phone_desk_call.png'))
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.interrupts=[{kind:'boss',t:12,max:20,msgs:['you there?','quick question','need the Q4 totals for the deck','asap pls'],pend:[],pingAt:-9}]}"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/phone_desk_msgs.png', clip=DESK); shots.append(('desk_msgs', 'test/phone_desk_msgs.png'))
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.phoneDown=999; n.interrupts[0].pingAt=7}"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/phone_desk_down.png', clip=DESK); shots.append(('desk_down', 'test/phone_desk_down.png'))
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.interrupts=[]}"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='test/phone_desk_down_idle.png', clip=DESK); shots.append(('desk_down_idle', 'test/phone_desk_down_idle.png'))
        print('ERRORS', errs); await b.close()
    ims = [Image.open(p) for _, p in shots]
    W, H = max(i.width for i in ims), max(i.height for i in ims)
    cols = 6; rows = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGB', (W * cols, (H + 30) * rows), '#111'); d = ImageDraw.Draw(sheet)
    for k, (im, (name, _)) in enumerate(zip(ims, shots)):
        x, y = (k % cols) * W, (k // cols) * (H + 30)
        d.text((x + 8, y + 8), name, fill='#fff'); sheet.paste(im, (x, y + 26))
    sheet.save('test/phone_sheet.png')
asyncio.run(main())
