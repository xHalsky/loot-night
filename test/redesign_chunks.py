# Windows for the redesign, grouped by purpose so they can be designed in chunks (2x).
# Writes test/chunks/<chunk>/<nn>_<name>.png, a board per chunk (test/chunks/board_<chunk>.png) and test/chunks.zip.
import asyncio, os, shutil, zipfile
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

OUT = 'test/chunks'
MONITOR = {'x': 304, 'y': 6, 'width': 968, 'height': 518}
CHUNKS = {
    '1_her': 'Her: her windows (warm, handwritten)',
    '2_hints': 'Hints: tooltip and coach marks (teaching the controls)',
    '3_rpg_windows': 'RPG windows: in the battle band and the side panel (fantasy frames)',
    '4_night_overlays': 'Night overlays: things that take over the screen mid-night',
    '5_end_of_night': 'End of the night: results and morning',
}
shots = {k: [] for k in CHUNKS}
fails = []

async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); const m=/^\\[data-act=\\x22?(\\w+)\\x22?\\](?:\\[data-arg=\\x22?([^\\x22\\]]*)\\x22?\\])?$/.exec(s); if(!e && m){const b=document.createElement('button'); b.dataset.act=m[1]; if(m[2]!=null) b.dataset.arg=m[2]; document.getElementById('stage').appendChild(b); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); b.remove(); return;} if(!e) throw new Error('no '+s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def dbg(pg, a, arg=None):
    await pg.evaluate("([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!==null) e.dataset.arg=arg; e.style.display='none'; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}", [a, arg]); await pg.wait_for_timeout(200)
async def ev(pg, js, arg=None):
    return await pg.evaluate("(arg)=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; " + js + "}", arg)
async def shot(pg, chunk, name, clip=None, sel=None, pad=14):
    try:
        if sel:
            bb = await pg.evaluate("s=>{const els=[...document.querySelectorAll(s)].filter(e=>e.getBoundingClientRect().width>0); if(!els.length) return null; const r=els.map(e=>e.getBoundingClientRect()); const x=Math.min(...r.map(q=>q.left)), y=Math.min(...r.map(q=>q.top)), X=Math.max(...r.map(q=>q.right)), Y=Math.max(...r.map(q=>q.bottom)); return {x, y, w: X-x, h: Y-y}}", sel)
            if not bb: raise Exception('not on screen: ' + sel)
            x = max(0, bb['x'] - pad); y = max(0, bb['y'] - pad)
            clip = {'x': x, 'y': y, 'width': min(1280 - x, bb['w'] + pad * 2), 'height': min(720 - y, bb['h'] + pad * 2)}
        path = f"{OUT}/{chunk}/{len(shots[chunk]) + 1:02d}_{name}.png"
        await pg.screenshot(path=path, clip=clip) if clip else await pg.screenshot(path=path)
        shots[chunk].append((name, path))
    except Exception as e:
        fails.append(f'{chunk}/{name}: {e}')

async def main():
    for k in CHUNKS: os.makedirs(f'{OUT}/{k}', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=2)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg, '[data-act=newGame]'); await pg.wait_for_timeout(300); await act(pg, '[data-act=howtoClose]')
        await ev(pg, "n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.tired=10; n.apt.t=999; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset');")
        await dbg(pg, 'dbgEpic'); await pg.wait_for_timeout(300)   # in town the drop goes straight to the bag
        await act(pg, '[data-act=portal]'); await pg.wait_for_timeout(700)

        # ---- 1 her ----
        await ev(pg, "n.game={kind:'cuddle',t:20,max:20,warmth:0.45,mx:0,my:0,lastMx:0,lastMy:0,jerk:0}; n.action='miniGame'"); await pg.wait_for_timeout(500)
        await shot(pg, '1_her', 'cuddle_break', sel='.cuddle-win')
        await shot(pg, '1_her', 'cuddle_break_full_frame')
        await ev(pg, "n.game=null; n.action='none'"); await pg.wait_for_timeout(300)
        await shot(pg, '1_her', 'the_plan_corner_in_the_webcam_view', clip={'x': 0, 'y': 60, 'width': 296, 'height': 300})
        cr = await pg.evaluate("()=>{const r=document.getElementById('doorCanvas').getBoundingClientRect(); return [r.left, r.top, r.width/296]}")
        await pg.mouse.click(cr[0] + 18 * cr[2], cr[1] + 160 * cr[2]); await pg.wait_for_timeout(400)
        await shot(pg, '1_her', 'the_plan', sel='.plan-sheet')
        await shot(pg, '1_her', 'the_plan_full_frame')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        if await ev(pg, "return g.paused"): await pg.keyboard.press('Escape')
        await dbg(pg, 'dbgLap'); await pg.wait_for_timeout(1900)
        await shot(pg, '1_her', 'her_leans_in_question')            # the whole stage: she covers it all (#65)
        await ev(pg, "n.lap.sweet=1; n.lap.face='blush'"); await pg.wait_for_timeout(300)
        await shot(pg, '1_her', 'her_leans_in_after_a_sweet_answer')
        await ev(pg, "n.lap.sweet=2; n.lap.face='wink'"); await pg.wait_for_timeout(300)
        await shot(pg, '1_her', 'her_leans_in_two_sweet_answers')
        await ev(pg, "n.lap.stage='arrive'; n.lap.t=0.6"); await pg.wait_for_timeout(60)
        await shot(pg, '1_her', 'her_leans_in_arriving')
        await ev(pg, "n.lap=null"); await pg.wait_for_timeout(300)

        # ---- 2 hints ----
        tb = await pg.evaluate("()=>{const e=[...document.querySelectorAll('[data-tip^=\"skill:\"]')].find(e=>e.getBoundingClientRect().width>0); if(!e) return null; const r=e.getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]}")
        if tb: await pg.mouse.move(*tb); await pg.wait_for_timeout(500)
        await shot(pg, '2_hints', 'tooltip_on_a_skill', clip={'x': 296, 'y': 260, 'width': 620, 'height': 300})
        await pg.mouse.move(640, 300)
        await ev(pg, "n.interrupts=[{kind:'mom',t:12,max:20,msgs:[],pend:[],pingAt:-9}]; n.coach={id:'phone',t:0,mark:0}"); await pg.wait_for_timeout(500)
        await shot(pg, '2_hints', 'coach_mark_phone', sel='.coach, .coach-ring', pad=10)
        await shot(pg, '2_hints', 'coach_mark_phone_full_frame')
        await ev(pg, "n.interrupts=[]; n.coach={id:'headset',t:0,mark:0}"); await pg.wait_for_timeout(400)
        await shot(pg, '2_hints', 'coach_mark_headset', sel='.coach, .coach-ring', pad=10)
        await shot(pg, '2_hints', 'coach_mark_headset_full_frame')
        await ev(pg, "n.coach=null"); await pg.wait_for_timeout(200)

        # ---- 3 rpg windows ----
        await ev(pg, "n.phase='curio'; n.enemies=[]; n.curio={id:'strongbox',stage:'ask',t:12,max:12}"); await pg.wait_for_timeout(500)
        await shot(pg, '3_rpg_windows', 'curio_window', sel='.curio')
        await shot(pg, '3_rpg_windows', 'curio_window_on_the_monitor', clip=MONITOR)
        await ev(pg, "n.curio=null; n.phase='walk'")
        sel_id = await ev(pg, "const e=g.bag.find(x=>x.kind==='item'); if(e) e.item.identified=true; return e?e.id:null")   # identified: the full card (stats, affixes, a compare per hero)
        if not sel_id: fails.append('no item in the bag for the details window')
        else:
            await ev(pg, "n.selected=arg", sel_id); await pg.wait_for_timeout(400)
            await shot(pg, '3_rpg_windows', 'item_details', sel='.sp-pop')
            await shot(pg, '3_rpg_windows', 'item_details_on_the_monitor', clip=MONITOR)
            await ev(pg, "n.selected=null; n.dropPopup={entry:g.bag.find(x=>x.id===arg), t:8}", sel_id); await pg.wait_for_timeout(400)
            await shot(pg, '3_rpg_windows', 'bag_full_new_drop', sel='.sp-pop')
            await ev(pg, "n.dropPopup=null")

        # ---- 4 night overlays ----
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await shot(pg, '4_night_overlays', 'pause', sel='.screen.dark .card')
        await shot(pg, '4_night_overlays', 'pause_full_frame')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await ev(pg, "n.blink={state:'closed',lid:1,nextIn:9}"); await pg.wait_for_timeout(300)
        await shot(pg, '4_night_overlays', 'microsleep_full_frame')
        await ev(pg, "n.blink={state:'closing',lid:0.55,nextIn:9}"); await pg.wait_for_timeout(120)
        await shot(pg, '4_night_overlays', 'microsleep_eyelids_closing_full_frame')
        await ev(pg, "n.blink={state:'open',lid:0,nextIn:999}; n.catches++; n.scare=0.8"); await pg.wait_for_timeout(250)
        await shot(pg, '4_night_overlays', 'caught_full_frame')
        await pg.wait_for_timeout(900)

        # ---- 5 end of the night ----
        await ev(pg, "g.results={ending:'sleep',endClock:n.clock+200,stars:2,depth:4,prevRecord:3,debtBefore:1,debtAfter:2,mood:64,caught:false,unidentified:2,nearMisses:['She almost saw the screen at 23:40.']}; g.screen='results'"); await pg.wait_for_timeout(500)
        await shot(pg, '5_end_of_night', 'results', sel='.screen .card')
        await shot(pg, '5_end_of_night', 'results_full_frame')
        await act(pg, '[data-act=morning]'); await pg.wait_for_timeout(700)
        await shot(pg, '5_end_of_night', 'morning', sel='.screen .card')
        await shot(pg, '5_end_of_night', 'morning_full_frame')
        print('ERRORS', errs); await b.close()

    # one board per chunk: crops large, full frames smaller, labelled
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 20); big = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
    except Exception: font = big = ImageFont.load_default()
    for k, title in CHUNKS.items():
        items = shots[k]
        if not items: continue
        thumbs = []
        for name, path in items:
            im = Image.open(path).convert('RGB'); h = 520 if 'full_frame' in name else 760
            s = min(h / im.height, 1100 / im.width, 1.0); im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
            thumbs.append((name, im))
        W = 2400; x = 30; y = 90; rowh = 0; places = []
        for name, im in thumbs:
            if x + im.width > W - 30: x = 30; y += rowh + 70; rowh = 0
            places.append((name, im, x, y)); x += im.width + 30; rowh = max(rowh, im.height)
        board = Image.new('RGB', (W, y + rowh + 50), '#141218'); d = ImageDraw.Draw(board)
        d.text((30, 26), title, fill='#ffd27a', font=big)
        for i, (name, im, px, py) in enumerate(places):
            d.text((px, py + 6), f'{i + 1:02d} ' + name.replace('_', ' '), fill='#e8e4f0', font=font); board.paste(im, (px, py + 40))
        board.save(f'{OUT}/board_{k}.png')
    with zipfile.ZipFile('test/chunks.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(OUT):
            for fn in sorted(files): z.write(os.path.join(root, fn), os.path.relpath(os.path.join(root, fn), 'test'))
    print({k: len(v) for k, v in shots.items()}); print('FAILS', fails)

if os.path.isdir(OUT): shutil.rmtree(OUT)
asyncio.run(main())
