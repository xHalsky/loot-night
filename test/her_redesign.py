# Prototype shots and plates for the scenes being redesigned with the new look (fan-service pass, #59).
# Writes test/her_redesign/<scene>/*.png (game render at 2x, plus 'where' with her box and size in game px),
# test/her_redesign/board.png and test/her_redesign.zip. Run after `npm run build`.
import asyncio, os, shutil, zipfile
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

OUT = 'test/her_redesign'
DOOR = {'x': 0, 'y': 0, 'width': 296, 'height': 532}
SCENES = {
    '1_couch_feet_up': 'Couch glimpse, feet up (planned): seen through the crack, in the living-room opening',
    '2_feet_on_armrest': 'Feet on the sofa armrest through the crack (in the game now)',
    '3_desk_sit': 'Sitting on the desk, foot toward the camera (new): full screen, from the right like the lean-in',
    '4_kitchen_from_behind': 'Kitchen counter, from behind (in the game now): through the crack',
    '5_yoga': 'Yoga glimpse (planned): through the crack, in the living-room opening',
    '6_breakfast': 'Breakfast in your shirt (planned): the morning picture',
    '7_walk_away': 'Walking away, looking back (new): in the doorway',
}
made = {k: [] for k in SCENES}
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22); FB = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30); FS = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 20)
except Exception: F = FB = FS = ImageFont.load_default()

async def ev(pg, js):
    return await pg.evaluate("()=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; " + js + "}")
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def dbg(pg, a):
    await pg.evaluate("a=>{const e=document.createElement('button'); e.dataset.act=a; e.style.display='none'; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}", a); await pg.wait_for_timeout(200)
async def shot(pg, scene, name, clip=None):
    p = f'{OUT}/{scene}/{name}.png'
    await (pg.screenshot(path=p, clip=clip) if clip else pg.screenshot(path=p)); made[scene].append(p); return p
def where(scene, src, name, box, label, k=2):   # box in game px; the shot is at k x
    im = Image.open(src).convert('RGB'); d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = [v * k for v in box]
    for i in range(4): d.rectangle([x0 - i, y0 - i, x1 + i, y1 + i], outline='#ff3ea5')
    tw = d.textlength(label, font=F); tx = min(max(4, x0), im.width - tw - 8); ty = y1 + 8 if y1 + 40 < im.height else (y0 - 34 if y0 > 40 else y0 + 12)
    d.rectangle([tx - 4, ty - 2, tx + tw + 4, ty + 28], fill='#ff3ea5'); d.text((tx, ty), label, fill='white', font=F)
    p = f'{OUT}/{scene}/{name}.png'; im.save(p); made[scene].append(p)
def closeup(scene, src, name, box, zoom, k=2):
    im = Image.open(src); x0, y0, x1, y1 = [v * k for v in box]
    im = im.crop((x0, y0, x1, y1)); im = im.resize((im.width * zoom, im.height * zoom), Image.NEAREST)
    p = f'{OUT}/{scene}/{name}.png'; im.save(p); made[scene].append(p)
def native(scene, fn, name):
    p = f'{OUT}/{scene}/{name}.png'; shutil.copy(f'test/her_native/{fn}', p); made[scene].append(p)

QUIET = "n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.apt.calm=1e9; n.tired=10; n.peekSus=-1e9;"
def crack(room, activity):
    return f"{QUIET} n.visit={{...n.visit, stage:'idle', t:999, from:'{activity}', checked:false, result:''}}; const a=n.apt; a.room='{room}'; a.activity='{activity}'; a.t=999; a.moving=0; a.asleep=false; n.peeking=true; n.peek=1; n.headset=false;"
LIVING = (112, 138, 148, 214)   # the living-room opening at the hallway's far end, webcam canvas px

async def main():
    for s in SCENES: os.makedirs(f'{OUT}/{s}', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=2)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg, '[data-act=newGame]'); await pg.wait_for_timeout(300); await act(pg, '[data-act=howtoClose]')
        await ev(pg, QUIET + " g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','peek'); n.monitor='excel'")

        # living room through the crack (1, 2, 5)
        await ev(pg, crack('living', 'tv')); await pg.wait_for_timeout(400); await ev(pg, "n.peekSus=-1e9")
        cam = await shot(pg, '2_feet_on_armrest', 'prototype_webcam_view', DOOR)
        await shot(pg, '2_feet_on_armrest', 'prototype_full_screen')
        closeup('2_feet_on_armrest', cam, 'prototype_close_up_6x', (108, 134, 152, 218), 3)
        where('2_feet_on_armrest', cam, 'where', LIVING, 'living-room opening 36 x 76 px, her feet ~8 x 6 px each')
        for sc in ['1_couch_feet_up', '5_yoga']:
            p0 = await shot(pg, sc, 'plate_webcam_view', DOOR)
            where(sc, p0, 'where', LIVING, 'glimpse window 36 x 76 px (Gallery still: any size)')

        # kitchen through the crack (4)
        await ev(pg, crack('kitchen', 'tea')); await pg.wait_for_timeout(400); await ev(pg, "n.peekSus=-1e9")
        cam = await shot(pg, '4_kitchen_from_behind', 'prototype_webcam_view', DOOR)
        await shot(pg, '4_kitchen_from_behind', 'prototype_full_screen')
        closeup('4_kitchen_from_behind', cam, 'prototype_close_up_3x', (204, 96, 296, 346), 3, k=2)
        where('4_kitchen_from_behind', cam, 'where', (216, 154, 252, 296), 'her sprite 34 x 142 px')
        native('4_kitchen_from_behind', '12_kitchen_from_behind.png', 'native_sprite_34x142')

        # the doorway (7)
        await ev(pg, QUIET + " n.peeking=false; n.peek=0; n.visit={...n.visit, stage:'in', t:999, from:'tv', kind:'visit', result:'chatMeh', checked:true, lean:false, chat:null};"); await pg.wait_for_timeout(400)
        cam = await shot(pg, '7_walk_away', 'prototype_webcam_view', DOOR)
        where('7_walk_away', cam, 'where', (56, 34, 240, 370), 'doorway 184 x 336 px, her sprite 82 x 306 px')
        native('7_walk_away', '01_stand_tv_tee_shorts_remote.png', 'native_front_82x306')
        native('7_walk_away', '12_kitchen_from_behind.png', 'native_only_back_view_today_34x142')

        # the desk view (3): empty, then the lean-in that takes the same spot today
        await ev(pg, QUIET + " n.visit={...n.visit, stage:'idle', t:999}; n.apt.room='living'; n.apt.activity='tv'; n.apt.t=999; n.peeking=false; n.peek=0; n.monitor='rpg'"); await pg.wait_for_timeout(500)
        p0 = await shot(pg, '3_desk_sit', 'plate_desk_view_empty')
        where('3_desk_sit', p0, 'where', (620, 4, 1276, 716), 'her area: right side, body cut by the right edge (stage 1280 x 720)')
        await dbg(pg, 'dbgLap'); await pg.wait_for_timeout(1700)
        await shot(pg, '3_desk_sit', 'prototype_lean_in_same_spot')
        await ev(pg, "n.lap=null"); await pg.wait_for_timeout(300)

        # the morning screen (6)
        await ev(pg, "g.results={ending:'sleep',endClock:n.clock+200,stars:2,depth:4,prevRecord:3,debtBefore:1,debtAfter:2,mood:10,caught:false,unidentified:0,nearMisses:[]}; g.screen='results'"); await pg.wait_for_timeout(500)
        await act(pg, '[data-act=morning]'); await pg.wait_for_timeout(700)
        full = await shot(pg, '6_breakfast', 'plate_morning_screen')
        bb = await pg.evaluate("()=>{const r=document.querySelector('#morningArt').getBoundingClientRect(); return [r.left,r.top,r.right,r.bottom]}")
        where('6_breakfast', full, 'where', tuple(round(v) for v in bb), 'the morning picture: 240 x 120 px, shown at 2x (480 x 240)')
        native('6_breakfast', '18_morning_green_asleep_in_your_shirt.png', 'native_morning_today_240x120')
        print('ERRORS', errs); await b.close()

    # board
    Wd = 2400; rows = []
    for sc, title in SCENES.items():
        ims = []
        for pth in made[sc]:
            im = Image.open(pth).convert('RGB'); h = 420
            s = min(h / im.height, 1.0 if im.width < 300 else 9, 900 / im.width); s = s if im.height * s <= h else h / im.height
            ims.append((os.path.basename(pth)[:-4], im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.NEAREST if im.width < 300 else Image.LANCZOS)))
        rows.append((title, ims))
    H = sum(70 + max(i.height for _, i in ims) + 40 for _, ims in rows) + 40
    board = Image.new('RGB', (Wd, H), '#1a1620'); d = ImageDraw.Draw(board); y = 20
    for title, ims in rows:
        d.text((30, y), title, fill='#ffd27a', font=FB); y += 46; x = 30; rh = 0
        for name, im in ims:
            if x + im.width > Wd - 30: break
            d.text((x, y), name.replace('_', ' '), fill='#cfc8dc', font=FS); board.paste(im, (x, y + 26)); x += max(im.width, int(d.textlength(name.replace('_', ' '), font=FS))) + 26; rh = max(rh, im.height)
        y += rh + 64
    board.save(f'{OUT}/board.png')

if os.path.isdir(OUT): shutil.rmtree(OUT)
asyncio.run(main())
