# One native-resolution PNG per place she appears (1 image px = 1 game px, transparent where the game is). Writes
# test/her_native/NN_name.png, sizes.md, board.png and test/her_native.zip. Run after `npm run build`.
import asyncio, os, shutil, zipfile, base64, io, json
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

OUT = 'test/her_native'
rows = []   # (name, where, w, h, shown_as)

JS_HER = r"""
async ([kind, args]) => {
  const H = window.__lnHer, W = 1000, Hh = 1000, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
  const c = cv.getContext('2d', { willReadFrequently: true }); c.imageSmoothingEnabled = false;
  let scale = 1, opaque = false;
  if (kind === 'stand') { const [act, o, s] = args; const look = H.OUTFIT_BY_ACTIVITY[act]; H.drawHer(c, 300, 100, s, { outfit: look.outfit, item: look.item, face: 'neutral', pose: 'stand', ...o }); }
  else if (kind === 'back') { H.drawHerBack(c, 300, 100, 0.6, 'hoodie'); }
  else if (kind === 'frosted') { H.drawHer(c, 300, 100, 0.36, { outfit: 'towel', face: 'neutral', pose: 'stand' }); }
  else if (kind === 'peek') { H.drawHerPeek(c, { outfit: 'lounge', face: args[1], blink: false }, args[0], 120, 120); scale = 3; }
  else if (kind === 'shower') { H.drawShowerPanel(c, 1, 0.6, 0); opaque = true; }
  // back to game pixels
  let src = cv;
  if (scale > 1) { const sm = document.createElement('canvas'); const sw = Math.floor(W / scale), sh = Math.floor(Hh / scale); sm.width = sw; sm.height = sh; const sc = sm.getContext('2d', { willReadFrequently: true });
    const id = c.getImageData(0, 0, W, Hh), od = sc.createImageData(sw, sh);
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { const i = ((y * scale + 1) * W + x * scale + 1) * 4, o = (y * sw + x) * 4; for (let k = 0; k < 4; k++) od.data[o + k] = id.data[i + k]; }
    sc.putImageData(od, 0, 0); src = sm; }
  const sc2 = src.getContext('2d', { willReadFrequently: true }); const w = src.width, h = src.height, d = sc2.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  if (opaque) { x0 = 0; y0 = 0; x1 = 175; y1 = 175; }
  else for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext('2d').drawImage(src, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return [out.toDataURL('image/png'), out.width, out.height];
}
"""

async def ev(pg, js, arg=None):
    return await pg.evaluate("(arg)=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; " + js + "}", arg)
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); const m=/^\\[data-act=\\x22?(\\w+)\\x22?\\](?:\\[data-arg=\\x22?([^\\x22\\]]*)\\x22?\\])?$/.exec(s); if(!e && m){const b=document.createElement('button'); b.dataset.act=m[1]; if(m[2]!=null) b.dataset.arg=m[2]; document.getElementById('stage').appendChild(b); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); b.remove(); return;} if(!e) throw new Error('no '+s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
QUIET = "n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.apt.calm=1e9; n.tired=10; n.peekSus=-1e9;"
def crack(room, activity, stage='idle'):
    return f"{QUIET} n.visit={{...n.visit, stage:'{stage}', t:999, from:'{activity}', checked:false, result:''}}; const a=n.apt; a.room='{room}'; a.activity='{activity}'; a.t=999; a.moving=0; a.asleep=false; n.peeking=true; n.peek=1; n.headset=false;"

def save(name, where, shown, data, w, h):
    n = len(rows) + 1
    Image.open(io.BytesIO(base64.b64decode(data.split(',')[1]))).save(f'{OUT}/{n:02d}_{name}.png')
    rows.append((f'{n:02d}_{name}', where, w, h, shown))

async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg, '[data-act=newGame]'); await pg.wait_for_timeout(300); await act(pg, '[data-act=howtoClose]')
        await ev(pg, QUIET + " g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','peek'); n.monitor='excel'")

        async def sprite(name, where, shown, kind, args):
            d, w, h = await pg.evaluate(JS_HER, [kind, args]); save(name, where, shown, d, w, h)

        DOOR = 'doorway, standing (webcam view)'; S1 = '1:1 (1 sprite px = 1 game px)'
        for name, a, o in [('stand_tv_tee_shorts_remote', 'tv', {}), ('stand_tea_hoodie_mug', 'tea', {}), ('stand_bathroom_tank', 'toilet', {}), ('stand_phone_tank_phone', 'phone', {}),
                           ('stand_shower_towel', 'shower', {}), ('stand_woken_sleep_shirt', 'sleep', {}), ('stand_night_your_hoodie', 'night', {}),
                           ('stand_snack_plate', 'tv', {'item': 'plate'}), ('lean_on_the_frame', 'tv', {'pose': 'lean', 'item': 'none'})]:
            await sprite(name, DOOR + (', leaning' if 'lean' in name else ''), S1, 'stand', [a, o, 1.24])
        await sprite('hallway_near_at_your_door', 'crack: hallway, right outside your door', S1, 'stand', ['tv', {}, 1.18])
        await sprite('hallway_far_walking_by', 'crack: hallway, walking by (far)', S1, 'stand', ['tv', {}, 0.66])
        await sprite('kitchen_from_behind', 'crack: kitchen counter, from behind', S1, 'back', [])
        await sprite('shower_frosted_silhouette', 'crack: bathroom frosted glass (blurred 3px in game)', S1, 'frosted', [])
        await sprite('shower_daydream_panel', 'daydream bubble (drawn at 176x176, shown ~0.82x in a circle)', '176 px sprite, scaled down to 144 px in the bubble', 'shower', [])
        for name, pose, face in [('peek_ask_finger_on_lips', 0, 'neutral'), ('peek_hair_twirl', 1, 'blush'), ('peek_chin_on_fist', 2, 'wink')]:
            await sprite(name, 'leans into your face (questions), full stage', '3x (each sprite px = 3 game px)', 'peek', [pose, face])
        # the morning vignettes are gone: the renderer's CGs replaced them (V10, test/morning.py)

        # drawn straight onto the webcam canvas (no sprite): crop the 296 x 532 canvas at 1:1
        async def door_crop(name, where, x, y, w, h):
            d = await pg.evaluate("()=>document.getElementById('doorCanvas').toDataURL('image/png')")
            im = Image.open(io.BytesIO(base64.b64decode(d.split(',')[1]))).convert('RGBA').crop((x, y, x + w, y + h))
            n = len(rows) + 1; im.save(f'{OUT}/{n:02d}_{name}.png'); rows.append((f'{n:02d}_{name}', where, w, h, '1:1, crop of the 296x532 webcam canvas (background included)'))
        await ev(pg, QUIET + " n.peeking=false; n.peek=0; n.visit={...n.visit, stage:'hall', t:999, from:'tv', kind:'visit', result:'chatMeh', checked:true, chat:null};"); await pg.wait_for_timeout(300)
        await door_crop('toes_under_the_door', 'under your door: her bare toes in the light gap', 40, 364, 216, 18)
        await ev(pg, crack('living', 'tv')); await pg.wait_for_timeout(350); await ev(pg, "n.peekSus=-1e9")
        await door_crop('feet_on_the_armrest', 'crack: living room, her feet on the sofa armrest', 116, 170, 40, 30)
        print('ERRORS', errs); await b.close()

    # sizes.md, board, zip
    with open(f'{OUT}/sizes.md', 'w') as f:
        f.write('| file | where | size (game px) | shown as |\n|---|---|---|---|\n')
        for n, wh, w, h, sh in rows: f.write(f'| {n}.png | {wh} | {w} x {h} | {sh} |\n')
    try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16); big = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26)
    except Exception: font = big = ImageFont.load_default()
    Wd = 2400; x = 30; y = 80; rowh = 0; items = []
    for n, wh, w, h, sh in rows:
        im = Image.open(f'{OUT}/{n}.png').convert('RGBA'); z = 1 if w > 200 else (3 if w > 60 else 6)
        if h * z > 520: z = max(1, 520 // h)
        im = im.resize((w * z, h * z), Image.NEAREST); cw = max(im.width, 170)
        if x + cw > Wd - 30: x = 30; y += rowh + 74; rowh = 0
        items.append((n, w, h, z, im, x, y)); x += cw + 30; rowh = max(rowh, im.height)
    board = Image.new('RGB', (Wd, y + rowh + 70), '#2a2230'); d = ImageDraw.Draw(board)
    d.text((30, 24), 'Every place she appears, native resolution (enlarged only where tiny; zoom noted)', fill='#ffd27a', font=big)
    for n, w, h, z, im, px, py in items:
        d.text((px, py), n[3:].replace('_', ' '), fill='#e8e4f0', font=font); d.text((px, py + 20), f'{w}x{h}' + (f'  (shown {z}x)' if z > 1 else ''), fill='#9ad0ff', font=font)
        board.paste(im, (px, py + 44), im)
    board.save(f'{OUT}/board.png')
    with zipfile.ZipFile('test/her_native.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for fn in sorted(os.listdir(OUT)): z.write(f'{OUT}/{fn}', f'her_native/{fn}')
    print(open(f'{OUT}/sizes.md').read())

if os.path.isdir(OUT): shutil.rmtree(OUT)
asyncio.run(main())
