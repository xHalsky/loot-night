# Every place she appears, for redrawing her (2x). Writes test/her/<group>/<nn>_<name>.png, a board per group
# (test/her/board_<group>.png) and test/her.zip. Run after `npm run build`.
import asyncio, os, shutil, zipfile
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

OUT = 'test/her'
DOOR = {'x': 0, 'y': 0, 'width': 296, 'height': 526}      # the webcam view (left column)
GROUPS = {
    '1_doorway': 'At your door: every outfit, the plate, leaning on the frame, caught, her toes under the door',
    '2_crack': 'Through the crack: the hallway, the kitchen, the shower, the TV',
    '3_daydream': 'His shower daydream (a thought bubble in the webcam view)',
    '4_leans_in': 'She leans into your face (the questions), over the whole screen',
    '5_morning': 'The morning vignettes',
    '6_caught': 'Caught: the "We need to talk." jumpscare (a generic face, not her look yet)',
    '7_model_sheet': 'Model sheet, drawn by the game: every outfit, every face (game pixels, enlarged)',
}
shots = {k: [] for k in GROUPS}
fails = []

async def ev(pg, js, arg=None):
    return await pg.evaluate("(arg)=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; " + js + "}", arg)
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); if(!e) throw new Error('no '+s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def dbg(pg, a):
    await pg.evaluate("a=>{const e=document.createElement('button'); e.dataset.act=a; e.style.display='none'; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}", a); await pg.wait_for_timeout(200)
async def shot(pg, group, name, clip=None, sel=None, pad=0, zoom=1):
    try:
        if sel:
            bb = await pg.evaluate("s=>{const e=document.querySelector(s); if(!e) return null; const r=e.getBoundingClientRect(); return {x:r.left,y:r.top,w:r.width,h:r.height}}", sel)
            if not bb or bb['w'] == 0: raise Exception('not on screen: ' + sel)
            clip = {'x': max(0, bb['x'] - pad), 'y': max(0, bb['y'] - pad), 'width': bb['w'] + pad * 2, 'height': bb['h'] + pad * 2}
        path = f"{OUT}/{group}/{len(shots[group]) + 1:02d}_{name}.png"
        await pg.screenshot(path=path, clip=clip) if clip else await pg.screenshot(path=path)
        if zoom > 1:   # close-ups: game pixels enlarged, nearest neighbour
            im = Image.open(path); im.resize((im.width * zoom, im.height * zoom), Image.NEAREST).save(path)
        shots[group].append((name, path))
    except Exception as e:
        fails.append(f'{group}/{name}: {e}')

async def door_clip(pg, x, y, w, h):   # a box on the webcam canvas (its own px), as a page clip
    r = await pg.evaluate("()=>{const r=document.getElementById('doorCanvas').getBoundingClientRect(); return [r.left, r.top, r.width/296]}")
    return {'x': r[0] + x * r[2], 'y': r[1] + y * r[2], 'width': w * r[2], 'height': h * r[2]}
CLOSE = {'kitchen_counter_from_behind': (196, 96, 96, 250), 'shower_frosted_glass': (168, 116, 70, 130), 'tv_her_feet_on_the_armrest': (100, 130, 90, 100)}

QUIET = "n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.apt.calm=1e9; n.tired=10; n.peekSus=-1e9;"
def visit(stage, frm='tv', kind='visit', result='chatMeh', lean=False, extra=''):
    return f"{QUIET} n.peeking=false; n.peek=0; n.visit={{...n.visit, stage:'{stage}', t:999, from:'{frm}', kind:'{kind}', result:'{result}', checked:true, lean:{'true' if lean else 'false'}, chat:null}}; {extra}"
def crack(room, activity, moving=0, stage='idle'):
    return f"{QUIET} n.visit={{...n.visit, stage:'{stage}', t:999, from:'{activity}', checked:false, result:''}}; const a=n.apt; a.room='{room}'; a.activity='{activity}'; a.t=999; a.moving={moving}; a.asleep=false; n.peeking=true; n.peek=1; n.headset=false;"

SHEET_JS = r"""
([kind]) => {
  const H = window.__lnHer, cv = document.createElement('canvas'); cv.id = 'sheet';
  const c = cv.getContext('2d');
  const label = (t, x, y) => { c.fillStyle = '#e8e4f0'; c.font = '13px Inter, sans-serif'; c.textAlign = 'center'; t.split(': ').forEach((l, i) => c.fillText(l, x, y + i * 16)); };
  if (kind === 'outfits') {
    const list = [['TV: tee, shorts, remote', 'tv', {}], ['Tea: hoodie, mug', 'tea', {}], ['Bathroom: tank', 'toilet', {}], ['Phone: tank, phone', 'phone', {}],
      ['Shower: towel', 'shower', {}], ['Woken: sleep shirt', 'sleep', {}], ['Night walk-by: your hoodie', 'night', {}], ['Snack: the plate', 'tv', { item: 'plate' }], ['Lean visit: on the frame', 'tv', { pose: 'lean', item: 'none' }]];
    cv.width = list.length * 138 + 24; cv.height = 396;
    c.fillStyle = '#2a2230'; c.fillRect(0, 0, cv.width, cv.height);
    list.forEach(([t, act, o], i) => {
      const x = 81 + i * 138, look = H.OUTFIT_BY_ACTIVITY[act];
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, 336, 30, 6, 0, 0, Math.PI * 2); c.fill();
      H.drawHer(c, x, 40, 1.24, { outfit: look.outfit, item: look.item, face: 'neutral', pose: 'stand', ...o });
      label(t, x, 368);
    });
  } else {
    const faces = ['neutral', 'smile', 'blush', 'wink', 'pout', 'sleepy', 'suspicious', 'angry', 'furious', 'surprised'];
    const tmp = document.createElement('canvas'); tmp.width = 120; tmp.height = 120; const tc = tmp.getContext('2d');
    cv.width = 5 * 250 + 20; cv.height = 2 * 280 + 20;
    c.fillStyle = '#2a2230'; c.fillRect(0, 0, cv.width, cv.height); c.imageSmoothingEnabled = false;
    faces.forEach((f, i) => {
      tc.clearRect(0, 0, 120, 120); tc.fillStyle = '#f0b874'; tc.fillRect(0, 0, 120, 120);
      H.drawHer(tc, 60, 22, 1.24, { outfit: 'lounge', item: 'none', face: f, pose: 'stand' });
      const x = 20 + (i % 5) * 250, y = 20 + Math.floor(i / 5) * 280;
      c.drawImage(tmp, 20, 14, 80, 80, x, y, 230, 230);
      label(f, x + 115, y + 254);
    });
  }
  cv.style.cssText = `position:fixed;left:0;top:0;z-index:9999;image-rendering:pixelated;width:${cv.width}px;height:${cv.height}px`;
  document.body.appendChild(cv);
  return [cv.width, cv.height];
}
"""

async def main():
    for g in GROUPS: os.makedirs(f'{OUT}/{g}', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=2)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg, '[data-act=newGame]'); await pg.wait_for_timeout(300); await act(pg, '[data-act=howtoClose]')
        await ev(pg, QUIET + " g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','peek');")
        await ev(pg, "n.monitor='excel'")   # the safe screen, so nothing she sees ends the scene

        # ---- 1 doorway ----
        for name, frm in [('tv_tee_and_shorts_remote', 'tv'), ('tea_hoodie_mug', 'tea'), ('bathroom_tank', 'toilet'), ('phone_tank_phone', 'phone'),
                          ('shower_towel', 'shower'), ('woken_sleep_shirt', 'sleep'), ('night_walk_by_your_hoodie', 'night')]:
            await ev(pg, visit('in', frm, result='night' if frm == 'night' else 'chatMeh')); await pg.wait_for_timeout(250)
            await shot(pg, '1_doorway', name, clip=DOOR)
        await ev(pg, visit('in', 'tv', kind='snack', result='offer')); await pg.wait_for_timeout(250)
        await shot(pg, '1_doorway', 'snack_with_the_plate', clip=DOOR)
        await ev(pg, visit('in', 'tv', result='look', lean=True)); await pg.wait_for_timeout(250)
        await shot(pg, '1_doorway', 'leaning_on_the_frame', clip=DOOR)
        await ev(pg, visit('in', 'tv', result='caught', extra='n.catches=2;')); await pg.wait_for_timeout(250)
        await shot(pg, '1_doorway', 'caught_furious', clip=DOOR)
        await ev(pg, visit('in', 'tv', result='chatGood', extra='n.catches=0;')); await pg.wait_for_timeout(250)
        await shot(pg, '1_doorway', 'at_the_door_full_frame')
        await ev(pg, visit('hall', 'tv')); await pg.wait_for_timeout(250)
        await shot(pg, '1_doorway', 'her_toes_under_the_door', clip=DOOR)
        await shot(pg, '1_doorway', 'her_toes_close_up', clip=await door_clip(pg, 40, 350, 216, 44), zoom=3)

        # ---- 2 crack ----
        for name, js in [('walking_by_in_the_hallway', crack('living', 'tv', moving=999)), ('right_outside_your_door', crack('hallway', 'tv', stage='hall')),
                         ('kitchen_counter_from_behind', crack('kitchen', 'tea')), ('shower_frosted_glass', crack('bathroom', 'shower')),
                         ('tv_her_feet_on_the_armrest', crack('living', 'tv'))]:
            await ev(pg, js); await pg.wait_for_timeout(350)
            await ev(pg, "n.peekSus=-1e9")
            await shot(pg, '2_crack', name, clip=DOOR)
            if name in CLOSE: await shot(pg, '2_crack', name + '_close_up', clip=await door_clip(pg, *CLOSE[name]), zoom=3)
        await ev(pg, crack('kitchen', 'tea')); await pg.wait_for_timeout(350)
        await shot(pg, '2_crack', 'kitchen_full_frame')

        # ---- 3 daydream ----
        base = QUIET + " n.peeking=false; n.peek=0; n.visit={...n.visit, stage:'idle', t:999}; const a=n.apt; a.room='bathroom'; a.activity='shower'; a.moving=0; a.asleep=false; n.headset=false;"
        await ev(pg, base + " a.cued=false; a.t=40;"); await pg.wait_for_timeout(300)
        await shot(pg, '3_daydream', 'shower_fogged', clip=DOOR)
        await ev(pg, base + " a.cued=true; a.t=1.6;"); await pg.wait_for_timeout(120)
        await shot(pg, '3_daydream', 'shower_glass_clearing', clip=DOOR)
        await ev(pg, base + " a.cued=false; a.t=40;"); await pg.wait_for_timeout(300)
        await shot(pg, '3_daydream', 'daydream_full_frame')

        # ---- 4 leans in ----
        await ev(pg, QUIET + " n.visit={...n.visit, stage:'idle', t:999}; n.apt.room='living'; n.apt.activity='tv'; n.apt.t=999; n.monitor='rpg'"); await pg.wait_for_timeout(200)
        await dbg(pg, 'dbgLap'); await pg.wait_for_timeout(1700)
        await shot(pg, '4_leans_in', 'asking_finger_on_her_lips')
        await ev(pg, "n.lap.sweet=1; n.lap.face='blush'"); await pg.wait_for_timeout(300)
        await shot(pg, '4_leans_in', 'one_sweet_answer_hair_twirl')
        await ev(pg, "n.lap.sweet=2; n.lap.face='wink'"); await pg.wait_for_timeout(300)
        await shot(pg, '4_leans_in', 'two_sweet_answers_chin_on_fist')
        await ev(pg, "n.lap.sweet=0; n.lap.face='pout'; n.lap.stage='react'; n.lap.t=99; n.lap.line='\"Wow. Rude.\"'"); await pg.wait_for_timeout(300)
        await shot(pg, '4_leans_in', 'after_a_rude_answer_pout')
        await ev(pg, "n.lap=null"); await pg.wait_for_timeout(300)

        # ---- 6 caught (before the night ends) ----
        await ev(pg, "n.scare=0.8"); await pg.wait_for_timeout(250)
        await shot(pg, '6_caught', 'we_need_to_talk_full_frame')
        await pg.wait_for_timeout(900)

        # ---- 5 morning ----
        await ev(pg, "g.results={ending:'sleep',endClock:n.clock+200,stars:2,depth:4,prevRecord:3,debtBefore:1,debtAfter:2,mood:10,caught:false,unidentified:0,nearMisses:[]}; g.screen='results'"); await pg.wait_for_timeout(500)
        await act(pg, '[data-act=morning]'); await pg.wait_for_timeout(600)
        for name, js in [('green_asleep_in_your_shirt', "g.results.mood=10"), ('yellow_back_turned_phone_lit', "g.results.mood=50"), ('red_asleep_on_the_couch', "g.results.mood=95")]:
            await ev(pg, js); await pg.wait_for_timeout(400)
            await shot(pg, '5_morning', name, sel='.screen .card canvas', pad=4)
        await shot(pg, '5_morning', 'morning_full_frame')

        # ---- 7 model sheet ----
        for kind in ['outfits', 'faces']:
            await pg.evaluate("()=>{const e=document.getElementById('sheet'); if(e) e.remove()}")
            await pg.evaluate(SHEET_JS, [kind]); await pg.wait_for_timeout(200)
            await shot(pg, '7_model_sheet', kind, sel='#sheet')
        print('ERRORS', errs); await b.close()

    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 20); big = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
    except Exception: font = big = ImageFont.load_default()
    for k, title in GROUPS.items():
        items = shots[k]
        if not items: continue
        thumbs = []
        for name, path in items:
            im = Image.open(path).convert('RGB'); h = 520 if 'full_frame' in name or k == '4_leans_in' else 900
            s = min(h / im.height, 2340 / im.width, 1.0); im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
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
    with zipfile.ZipFile('test/her.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(OUT):
            for fn in sorted(files): z.write(os.path.join(root, fn), os.path.relpath(os.path.join(root, fn), 'test'))
    print({k: len(v) for k, v in shots.items()}); print('FAILS', fails)

if os.path.isdir(OUT): shutil.rmtree(OUT)
asyncio.run(main())
