# Real-life screens for the redesign (2x): the phone (in hand and on the desk), the dog, and every pop-up window.
# Writes test/rl/<group>/<nn>_<name>.png, a contact sheet per group (test/rl/sheet_<group>.png) and test/rl.zip.
# Each window is cropped to its frame (close button included); a few full frames show where they sit.
import asyncio, os, shutil, zipfile
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

OUT = 'test/rl'
DESK = {'x': 296, 'y': 360, 'width': 540, 'height': 360}
MONITOR = {'x': 304, 'y': 6, 'width': 968, 'height': 518}
README = """Loot Night, real-life screens for the redesign (test/rl_screens.py)

All PNGs are at 2x: the game's 1280 x 720 layout rendered as 2560 x 1440, so halve any pixel size you measure.
Window crops include ~14 px of margin so the grey/red close button outside the top-right corner shows.
"full_frame" files are the whole screen, for where each thing sits.

phone/    Everything on the phone happens inside the phone. In your hand (the window over the battle area,
          186 x 398): incoming calls (Mom, courier, the boys), the lock screen with 1 and 3 banners, Face ID hold,
          the boss chat (pick the sum), her texts, Mom's call (reply timing, listening), the courier and the boys'
          calls, Messages (tap the idle phone: Babe = Text her, The Boys = Raid night?) and a message typing
          itself into her chat. On the desk: screen off, an incoming call with its countdown ring, the lock-screen
          banners, face-down (glow, idle), her reply banner.
dog/      The shiba up at the desk (waiting, petted), and his revenge: the NO SIGNAL cable screen behind the monitor.
windows/  Every pop-up that stays: the how-to card, the energy break (all 5 steps), the cuddle break, the plan,
          her on the desk, being away from the PC (the empty chair: tea now, "Charge phone" in step 6), the coach
          marks, a tooltip, pause, the RPG's curio window, item details and bag full (both in the side panel), Excel
          (its content becomes Q4 in step 4), the microsleep and caught overlays, the results and morning screens.
windows_going/  Pop-ups the plan removes, for reference only (don't design a frame for them):
          - the town's service windows (merchant etc.), the build window and the appraiser's reveal card: in town,
            a building opens in the side panel instead (Pawel, 2026-11-19; goes with the town tabs, #53);
          - the tea and towel cards and the tea's "Stay for one episode?": both actions are placeholders that the
            Home app's devices replace (step 6, #57).
sheet_*.png  A labelled contact sheet per folder.
Planned windows not built yet (they need the frame too): the Windows 98/XP dialogs (the promotion alert), the
skill tree screen, the Goblin Fuel inspect window. The phone's apps (Shop, Home) live inside the phone.
"""
shots = {'phone': [], 'dog': [], 'windows': [], 'windows_going': []}
fails = []

async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); if(!e) throw new Error('no '+s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def dbg(pg, a, arg=None):
    await pg.evaluate("([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!==null) e.dataset.arg=arg; e.style.display='none'; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}", [a, arg]); await pg.wait_for_timeout(200)
async def ev(pg, js, arg=None):
    return await pg.evaluate("(arg)=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; " + js + "}", arg)

async def shot(pg, group, name, clip=None, sel=None, pad=14):
    """Crop to a selector's box (plus pad, so the close button outside the corner shows), a clip, or the full frame."""
    try:
        if sel:
            bb = await pg.evaluate("s=>{const els=[...document.querySelectorAll(s)].filter(e=>e.getBoundingClientRect().width>0); if(!els.length) return null; const r=els.map(e=>e.getBoundingClientRect()); const x=Math.min(...r.map(q=>q.left)), y=Math.min(...r.map(q=>q.top)), X=Math.max(...r.map(q=>q.right)), Y=Math.max(...r.map(q=>q.bottom)); return {x, y, w: X-x, h: Y-y}}", sel)
            if not bb: raise Exception('not on screen: ' + sel)
            x = max(0, bb['x'] - pad); y = max(0, bb['y'] - pad)
            clip = {'x': x, 'y': y, 'width': min(1280 - x, bb['w'] + pad * 2), 'height': min(720 - y, bb['h'] + pad * 2)}
        path = f"{OUT}/{group}/{len(shots[group]) + 1:02d}_{name}.png"
        await pg.screenshot(path=path, clip=clip) if clip else await pg.screenshot(path=path)
        shots[group].append((name, path))
    except Exception as e:
        fails.append(f'{group}/{name}: {e}')

BASE = dict(kind='phone', t=12, max=20, unlock=0, holding=False, drag=0, beat=0, misses=0, sweep=0, zone=0.45, need=0, line='', read=0, row=0, rows=[], feedback='', msgs=[])
PHONE = [
  ('incoming_call_mom', dict(app='mom', stage='ringing')),
  ('incoming_call_courier', dict(app='courier', stage='ringing')),
  ('incoming_call_friends', dict(app='friends', stage='ringing')),
  ('lock_screen_1_message', dict(app='boss', stage='locked', msgs=['you there?'])),
  ('lock_screen_3_messages', dict(app='boss', stage='locked', msgs=['you there?', 'quick question', 'need the Q4 totals for the deck'])),
  ('lock_screen_face_id_hold', dict(app='text', stage='locked', msgs=['are you coming to bed?', 'babe', 'its really late'], unlock=0.55, holding=True)),
  ('chat_boss_pick_the_sum', dict(app='boss', stage='chat', msgs=['you there?', 'quick question', 'need the Q4 totals for the deck', 'asap pls'], row=1, rows=[{'a': 7, 'b': 8, 'options': [15, 19, 12]}, {'a': 9, 'b': 6, 'options': [12, 15, 19]}, {'a': 4, 'b': 5, 'options': [9, 13, 6]}], feedback='Wrong. Try again.')),
  ('chat_her_texts', dict(app='text', stage='chat', msgs=['are you coming to bed?', 'babe', 'its really late', 'hello??'])),
  ('call_mom_reply_timing', dict(app='mom', stage='call', line='Did you see my message on Facebook?', need=1, misses=1, beat=1, feedback='Too slow. She keeps talking.')),
  ('call_mom_listening', dict(app='mom', stage='call', line='So Basia said the pierogi were too salty...', need=0, read=1)),
  ('call_courier_talk', dict(app='courier', stage='talk', line='"Hi, courier. Intercom is broken. Can you come out?"', opts=['Can a neighbour take it?', 'Leave it on the street', 'One sec, boss fight'], need=0)),
  ('call_friends_talk', dict(app='friends', stage='talk', line='Danny: "BRO. Raid. Now. Bring snacks."', opts=["Shh, she's next door. Text only, love you guys.", "WHAT? I CAN'T HEAR YOU", 'Nah'], need=0, misses=1, feedback='On speaker!')),
]

async def main():
    for gname in shots: os.makedirs(f'{OUT}/{gname}', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=2)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg, '[data-act=newGame]'); await pg.wait_for_timeout(300)
        # the how-to card opens on the first night: a pop-up too
        await shot(pg, 'windows', 'howto_card', sel='.howto .card')
        await act(pg, '[data-act=howtoClose]')
        await ev(pg, "n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.tired=10; n.apt.t=999; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset');")
        await pg.wait_for_timeout(300)
        # ---- town windows (the night starts in town) ----
        await ev(pg, "g.townWin='merchant'"); await pg.wait_for_timeout(300)
        await shot(pg, 'windows_going', 'rpg_service_window_merchant__to_the_town_side_panel', sel='.svc-win')
        await ev(pg, "g.townWin='build:inn'"); await pg.wait_for_timeout(300)
        await shot(pg, 'windows_going', 'rpg_build_window_inn__to_the_town_side_panel', sel='.svc-win')
        await ev(pg, "g.townWin=null")
        await act(pg, '[data-act=portal]'); await pg.wait_for_timeout(600)

        # ---- the phone in your hand ----
        await ev(pg, "g.timeScale=0")
        for name, c in PHONE:
            game = dict(BASE); game.update(c)
            await pg.evaluate("g=>{const n=window.__lootnight.S.g.night; n.game=g; n.action='miniGame';}", game); await pg.wait_for_timeout(350)
            await shot(pg, 'phone', 'in_hand_' + name, sel='.phone-win')
            if name == 'call_mom_reply_timing': await shot(pg, 'phone', 'in_hand_context_full_frame')
        await ev(pg, "n.game=null; n.action='none'"); await pg.wait_for_timeout(300)
        # ---- the phone on the desk ----
        await shot(pg, 'phone', 'desk_idle_screen_off', clip=DESK)
        await ev(pg, "n.interrupts=[{kind:'mom',t:12,max:20,msgs:[],pend:[],pingAt:-9}]"); await pg.wait_for_timeout(300)
        await shot(pg, 'phone', 'desk_incoming_call_ring', clip=DESK)
        await ev(pg, "n.interrupts=[{kind:'boss',t:12,max:20,msgs:['you there?','quick question','need the Q4 totals for the deck','asap pls'],pend:[],pingAt:-9}]"); await pg.wait_for_timeout(300)
        await shot(pg, 'phone', 'desk_lock_screen_banners', clip=DESK)
        await ev(pg, "n.phoneDown=999; n.interrupts[0].pingAt=n.clock"); await pg.wait_for_timeout(400)
        await shot(pg, 'phone', 'desk_face_down_glow', clip=DESK)
        await ev(pg, "n.interrupts=[]"); await pg.wait_for_timeout(300)
        await shot(pg, 'phone', 'desk_face_down_idle', clip=DESK)
        await ev(pg, "n.phoneDown=0; g.timeScale=1"); await pg.wait_for_timeout(400)
        # tap the idle phone: Messages in your hand; tap a chat: the message types itself in it (#63)
        await ev(pg, "n.preMenu='phone'"); await pg.wait_for_timeout(400)
        await shot(pg, 'phone', 'in_hand_messages', sel='.phone-win')
        await ev(pg, "n.apt.activity='tv'; n.apt.room='living'; n.apt.moving=0")
        await dbg(pg, 'pre', 'text'); await pg.wait_for_timeout(1100)
        await shot(pg, 'phone', 'in_hand_texting_her', sel='.phone-win')
        for _ in range(80):
            if await ev(pg, "return !n.pre"): break
            await pg.wait_for_timeout(100)
        await ev(pg, "n.preUses={}")
        await ev(pg, "n.herReply={msg:'ok but 10 min max ♥', t:6, wait:0}"); await pg.wait_for_timeout(400)
        await shot(pg, 'phone', 'desk_her_reply_banner', clip=DESK)
        await ev(pg, "n.herReply=null")

        # ---- the dog ----
        await dbg(pg, 'dbgDog'); await pg.wait_for_timeout(1200)
        await shot(pg, 'dog', 'dog_up_waiting_full_frame')
        await shot(pg, 'dog', 'dog_up_waiting_desk', clip={'x': 420, 'y': 380, 'width': 640, 'height': 340})
        await pg.mouse.move(580, 620); await pg.mouse.down()
        for k in range(16):
            await pg.mouse.move(580 + (k % 2) * 80, 620 + (k % 3) * 4, steps=6); await pg.wait_for_timeout(30)
        await shot(pg, 'dog', 'dog_petted_desk', clip={'x': 420, 'y': 380, 'width': 640, 'height': 340})
        await pg.mouse.up(); await pg.wait_for_timeout(300)
        await ev(pg, "n.dog.stage='away'; n.dog.next=1e9")
        await dbg(pg, 'dbgUnplug'); await pg.wait_for_timeout(700)
        await shot(pg, 'dog', 'dog_revenge_no_signal_cables', clip=MONITOR)
        await shot(pg, 'dog', 'dog_revenge_full_frame')
        await ev(pg, "if(n.unplugged){n.unplugged.plugged=n.unplugged.plugged.map(()=>true)}"); await pg.wait_for_timeout(800)
        await ev(pg, "n.unplugged=null"); await pg.wait_for_timeout(300)

        # ---- the energy break, all five steps (real input for the first three) ----
        await dbg(pg, 'openMonster'); await pg.wait_for_timeout(400)
        r = await pg.evaluate("()=>{const r=document.getElementById('mcv').getBoundingClientRect(); return [r.left,r.top,r.width/600]}")
        async def W(x, y):
            sx, sy = await pg.evaluate(f"()=>window.__lnScreen({x},{y})"); return r[0] + sx * r[2], r[1] + sy * r[2]
        async def drag(p0, p1, steps=14):
            await pg.mouse.move(*p0); await pg.mouse.down()
            for i in range(1, steps + 1): await pg.mouse.move(p0[0] + (p1[0] - p0[0]) * i / steps, p0[1] + (p1[1] - p0[1]) * i / steps); await pg.wait_for_timeout(25)
            await pg.mouse.up()
        await shot(pg, 'windows', 'energy_break_1_drawer', sel='.monster-win')
        await shot(pg, 'windows', 'energy_break_context_full_frame')
        await drag(await W(430, 180), await W(430, 240)); await pg.wait_for_timeout(600)
        await shot(pg, 'windows', 'energy_break_2_grab', sel='.monster-win')
        await drag(await W(358, 232), await W(424, 104), 16); await pg.wait_for_timeout(1300)
        await shot(pg, 'windows', 'energy_break_3_open', sel='.monster-win')
        await drag(await W(300, 75), await W(300, 10), 18); await pg.wait_for_timeout(1500)
        await shot(pg, 'windows', 'energy_break_4_drink', sel='.monster-win')
        f = await pg.evaluate("()=>window.__lnFluid()")
        await pg.mouse.click(*(await W(f['x'], f['y'])))
        import math
        for i in range(40):
            a = max((await pg.evaluate("()=>window.__lnFluid()"))['a'], 0.5)
            await pg.mouse.move(*(await W(f['mx'] - (12 * math.cos(a) + 40 * math.sin(a)), f['my'] - (12 * math.sin(a) - 40 * math.cos(a)))))
            if i % 3 == 0: await pg.keyboard.down(' ')
            if i % 3 == 2: await pg.keyboard.up(' ')
            await pg.wait_for_timeout(40)
        await shot(pg, 'windows', 'energy_break_4b_pouring', sel='.monster-win')
        await pg.keyboard.up(' ')
        await ev(pg, "n.game.stage='toss'"); await pg.wait_for_timeout(500)
        await shot(pg, 'windows', 'energy_break_5_toss', sel='.monster-win')
        await dbg(pg, 'cancelMonster'); await pg.wait_for_timeout(400)

        # ---- her windows: the cuddle break, the plan, her on the desk ----
        await ev(pg, "n.game={kind:'cuddle',t:20,max:20,warmth:0.45,mx:0,my:0,lastMx:0,lastMy:0,jerk:0}; n.action='miniGame'"); await pg.wait_for_timeout(500)
        await shot(pg, 'windows', 'her_cuddle_break', sel='.cuddle-win')
        await ev(pg, "n.game=null; n.action='none'"); await pg.wait_for_timeout(300)
        cr = await pg.evaluate("()=>{const r=document.getElementById('doorCanvas').getBoundingClientRect(); return [r.left, r.top, r.width/296]}")
        await pg.mouse.click(cr[0] + 18 * cr[2], cr[1] + 160 * cr[2]); await pg.wait_for_timeout(400)
        await shot(pg, 'windows', 'her_plan_sheet', sel='.plan-sheet')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        if await ev(pg, "return g.paused"): await pg.keyboard.press('Escape')
        await dbg(pg, 'dbgLap'); await pg.wait_for_timeout(1900)
        await shot(pg, 'windows', 'her_on_the_desk_question', clip=MONITOR)
        await ev(pg, "n.lap=null"); await pg.wait_for_timeout(300)

        # ---- pre-emptive actions (the phone menu, texting her, tea, the episode question, the towel) ----
        tb = await pg.evaluate("()=>{const e=[...document.querySelectorAll('[data-tip^=\"skill:\"]')].find(e=>e.getBoundingClientRect().width>0); if(!e) return null; const r=e.getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]}")
        if tb: await pg.mouse.move(*tb); await pg.wait_for_timeout(500)
        await shot(pg, 'windows', 'tooltip_on_a_skill', clip={'x': 296, 'y': 260, 'width': 620, 'height': 300})
        await pg.mouse.move(640, 300)
        await ev(pg, "n.preUses={}; n.apt.calm=0; n.apt.activity='tv'; n.apt.room='living'; n.apt.moving=0")
        await dbg(pg, 'pre', 'tea'); await pg.wait_for_timeout(500)
        await shot(pg, 'windows', 'away_from_the_pc_empty_chair_full_frame')
        await shot(pg, 'windows_going', 'pre_busy_card_tea__removed_step_6', sel='.pre-card')
        await ev(pg, "if(n.pre) n.pre.t=0.05"); await pg.wait_for_timeout(500)
        await shot(pg, 'windows_going', 'pre_tea_stay_for_an_episode__removed_step_6', sel='.pre-card')
        await dbg(pg, 'episode', '0'); await pg.wait_for_timeout(300)
        await ev(pg, "n.pre=null; n.action='none'; n.preUses={}")
        await dbg(pg, 'pre', 'towel'); await pg.wait_for_timeout(500)
        await shot(pg, 'windows_going', 'pre_busy_card_towel__removed_step_6', sel='.pre-card')
        await ev(pg, "n.pre=null; n.action='none'"); await pg.wait_for_timeout(300)

        # ---- coach marks ----
        await ev(pg, "n.interrupts=[{kind:'mom',t:12,max:20,msgs:[],pend:[],pingAt:-9}]; n.coach={id:'phone',t:0,mark:0}"); await pg.wait_for_timeout(500)
        await shot(pg, 'windows', 'coach_mark_phone', sel='.coach, .coach-ring', pad=10)
        await ev(pg, "n.interrupts=[]; n.coach={id:'headset',t:0,mark:0}"); await pg.wait_for_timeout(400)
        await shot(pg, 'windows', 'coach_mark_headset', sel='.coach, .coach-ring', pad=10)
        await ev(pg, "n.coach=null"); await pg.wait_for_timeout(200)

        # ---- RPG windows (for the shared frame) ----
        await ev(pg, "n.phase='curio'; n.enemies=[]; n.curio={id:'strongbox',stage:'ask',t:12,max:12}"); await pg.wait_for_timeout(500)
        await shot(pg, 'windows', 'rpg_curio_window', sel='.curio')
        await ev(pg, "n.curio=null; n.phase='walk'")
        sel_id = await ev(pg, "const e=g.bag.find(x=>x.kind==='item')||g.bag[0]; return e?e.id:null")
        if not sel_id:
            await dbg(pg, 'dbgMap'); await pg.wait_for_timeout(800); sel_id = await ev(pg, "return g.bag[0]?g.bag[0].id:null")
        if sel_id:
            await ev(pg, "n.selected=arg", sel_id); await pg.wait_for_timeout(400)
            await shot(pg, 'windows', 'rpg_item_details', sel='.sp-pop')
            await ev(pg, "n.selected=null; n.dropPopup={entry:g.bag.find(x=>x.id===arg), t:8}", sel_id); await pg.wait_for_timeout(400)
            await shot(pg, 'windows', 'rpg_bag_full_new_drop', sel='.sp-pop')
            await ev(pg, "n.dropPopup=null")
        await ev(pg, "n.reveal={name:'Ironbark Greatsword', t:3}"); await pg.wait_for_timeout(300)
        await shot(pg, 'windows_going', 'rpg_appraiser_reveal__to_the_town_side_panel', sel='.reveal')
        await ev(pg, "n.reveal=null")

        # ---- the monitor's other app, and full-screen overlays ----
        await ev(pg, "n.monitor='excel'"); await pg.wait_for_timeout(500)
        await shot(pg, 'windows', 'monitor_app_excel', clip=MONITOR)
        await ev(pg, "n.monitor='rpg'"); await pg.wait_for_timeout(300)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await shot(pg, 'windows', 'pause_card', sel='.screen.dark .card')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await ev(pg, "n.blink={state:'closed',lid:1,nextIn:9}"); await pg.wait_for_timeout(300)
        await shot(pg, 'windows', 'overlay_microsleep_full_frame')
        await ev(pg, "n.blink={state:'open',lid:0,nextIn:999}; n.scare=0.8"); await pg.wait_for_timeout(250)
        await shot(pg, 'windows', 'overlay_caught_scare_full_frame')
        await pg.wait_for_timeout(900)
        await ev(pg, "g.results={ending:'sleep',endClock:n.clock+200,stars:2,depth:4,prevRecord:3,debtBefore:1,debtAfter:2,mood:64,caught:false,unidentified:2,nearMisses:['She almost saw the screen at 23:40.']}; g.screen='results'"); await pg.wait_for_timeout(500)
        await shot(pg, 'windows', 'screen_results_full_frame')
        await act(pg, '[data-act=morning]'); await pg.wait_for_timeout(700)
        await shot(pg, 'windows', 'screen_morning_full_frame')
        print('ERRORS', errs)
        await b.close()

    # contact sheets: every shot scaled to a 340 px tall thumbnail (full frames 300), labelled
    try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    except Exception: font = ImageFont.load_default()
    for gname, items in shots.items():
        if not items: continue
        thumbs = []
        for name, path in items:
            im = Image.open(path).convert('RGB'); h = 300 if 'full_frame' in name else 340
            if im.height > h or im.width > 560:
                k = min(h / im.height, 560 / im.width); im = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
            thumbs.append((name, im))
        W = 1800; x = 16; y = 34; rowh = 0; places = []
        for name, im in thumbs:
            if x + im.width > W - 16: x = 16; y += rowh + 62; rowh = 0
            places.append((name, im, x, y)); x += im.width + 18; rowh = max(rowh, im.height)
        sheet = Image.new('RGB', (W, y + rowh + 50), '#141218'); d = ImageDraw.Draw(sheet)
        for i, (name, im, px, py) in enumerate(places):
            words, lines, cur = f'{i + 1:02d} {name}'.replace('_', ' ').split(' '), [], ''
            for w in words:
                t = (cur + ' ' + w).strip()
                if d.textlength(t, font=font) > max(im.width, 120) and cur: lines.append(cur); cur = w
                else: cur = t
            lines.append(cur)
            for li, line in enumerate(lines[:2]): d.text((px, py - 18 + li * 18), line, fill='#e8e4f0', font=font)
            sheet.paste(im, (px, py + 22))
        sheet.save(f'{OUT}/sheet_{gname}.png')
    open(f'{OUT}/README.txt', 'w').write(README)
    with zipfile.ZipFile('test/rl.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(OUT):
            for fn in sorted(files): z.write(os.path.join(root, fn), os.path.relpath(os.path.join(root, fn), 'test'))
    print({k: len(v) for k, v in shots.items()}); print('FAILS', fails)

if os.path.isdir(OUT): shutil.rmtree(OUT)
asyncio.run(main())
