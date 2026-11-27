# Stills of every v2 curio (#131): waiting, the choice's moment and after it, from the build, for Paweł's review.
# Writes test/curio_stills/<id>_<state>.png (the corridor round the curio, 4x) and two contact sheets
# design/v2/review/curios-w5-a.png and -b.png. Usage: python3 test/curio_stills.py [id ...]
import asyncio, sys, os
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

OUT = 'test/curio_stills'; os.makedirs(OUT, exist_ok=True)
CLIP = {'x': 314, 'y': 16, 'width': 948, 'height': 464}   # the game screen at 2x (474 x 232 grid px)
STOP_X = 210
# id: [(label, done, out)] for after each choice
AFTER = {
    'strongbox': [('pick', 'pick', None), ('smash', 'smash', None)],
    'mailbox': [('open: gold', 'open', 'gold'), ('open: rare', 'open', 'rare'), ('open: curse', 'open', 'curse')],
    'shrine': [('pray', 'shrine', None)],
    'pilgrim': [('swear', 'pilgrim', None)],
    'supply': [('eat', 'supply', None)],
    'altar': [('bleed', 'altar', None)],
    'moonwell': [('drink', 'moonwell', None)],
    'ritual': [('join', 'ritual', None)],
    'troll': [('sneak', 'sneak', None)],
    'bank': [('take', 'withdraw', None), ('close', 'leave', None)],
    'vending': [('shake: caught', 'potion', 'caught'), ('shake: glass', 'potion', 'glass')],
}
NAMES = {'strongbox': 'Locked chest', 'mailbox': 'Sealed coffin', 'shrine': 'Wayside Shrine', 'pilgrim': 'Pilgrim', 'supply': 'Supply Cart', 'altar': 'Blood Altar', 'moonwell': 'Moonwell', 'ritual': 'Ritual Circle', 'troll': 'The Abbot, asleep', 'bank': 'Guild bank vault', 'vending': 'Potion cart'}
STAGES = {'strongbox': ('picking', 'pick'), 'troll': ('sneaking', 'sneak')}
MOMENT = 0.8   # s after the choice

async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); const m=/^\\[data-act=\\x22?(\\w+)\\x22?\\]$/.exec(s); if(!e && m){const b=document.createElement('button'); b.dataset.act=m[1]; document.getElementById('stage').appendChild(b); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); b.remove(); return;} e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel)
    await pg.wait_for_timeout(120)

async def shot(pg, name):
    p = f'{OUT}/{name}_full.png'; await pg.screenshot(path=p, clip=CLIP)
    im = Image.open(p).convert('RGB')
    # the corridor round the curio: 130 x 104 grid px, its feet near the bottom
    x0, y0 = (STOP_X - 65) * 2, (188 - 96) * 2
    im = im.crop((x0, y0, x0 + 130 * 2, y0 + 104 * 2)).resize((130 * 4, 104 * 4), Image.NEAREST)
    im.save(f'{OUT}/{name}.png'); return im

async def main():
    only = sys.argv[1:]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg, '[data-act=newGame]'); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.tired=0}")
        await act(pg, '[data-act=portal]'); await pg.wait_for_timeout(600)
        rows = []
        for cid, afters in AFTER.items():
            if only and cid not in only: continue
            row = []
            # waiting: the card up, the curio at its stop (the party stands at it)
            await pg.evaluate("([c,x])=>{const S=window.__lootnight.S, n=S.g.night; n.enemies=[]; n.loot=[]; n.phase='curio'; n.curio={id:c,stage:'ask',t:5,max:7}; n.curioAt={id:c,x:x,passed:false}; S.g.timeScale=0;}", [cid, STOP_X])
            await pg.wait_for_timeout(500); row.append(('waiting', await shot(pg, f'{cid}_waiting')))
            if cid in STAGES:
                lab, st = STAGES[cid]
                await pg.evaluate("([c,x,st])=>{const S=window.__lootnight.S, n=S.g.night; n.phase='curio'; n.curio={id:c,stage:st,t:2,max:4}; n.curioAt={id:c,x:x,passed:false};}", [cid, STOP_X, st])
                await pg.wait_for_timeout(500); row.append((lab, await shot(pg, f'{cid}_{st}')))
            for lab, done, out in afters:
                key = lab.replace(': ', '_').replace(' ', '_')
                await pg.evaluate("([c,x,d,o])=>{const S=window.__lootnight.S, n=S.g.night; n.curio=null; n.phase='walk'; n.curioAt={id:c,x:x,passed:false,done:d}; if(o) n.curioAt.out=o; S.g.timeScale=0;}", [cid, STOP_X, done, out])
                await pg.wait_for_timeout(int(MOMENT * 1000)); row.append((lab + ' (moment)', await shot(pg, f'{cid}_{key}_moment')))
                await pg.wait_for_timeout(3600 - int(MOMENT * 1000)); row.append((lab + ' (after)', await shot(pg, f'{cid}_{key}_after')))
            rows.append((cid, row))
        print('ERRORS', errs)
        await b.close()
    # the contact sheets: a row per curio, in two halves
    if not only:
        W, H, pad, lab = 520, 416, 8, 22
        try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
        except Exception: font = None
        os.makedirs('design/v2/review', exist_ok=True)
        for half, part in (('a', rows[:6]), ('b', rows[6:])):
            cols = max(len(r) for _, r in part)
            sheet = Image.new('RGB', (pad + cols * (W + pad), pad + len(part) * (H + lab + pad)), (16, 14, 20))
            d = ImageDraw.Draw(sheet)
            for r, (cid, row) in enumerate(part):
                for c, (l, im) in enumerate(row):
                    x, y = pad + c * (W + pad), pad + r * (H + lab + pad)
                    d.text((x, y + 2), f'{NAMES.get(cid, cid)} · {l}', fill=(220, 214, 200), font=font)
                    sheet.paste(im, (x, y + lab))
            sheet.save(f'design/v2/review/curios-w5-{half}.png')
            print('sheet', half, sheet.size)

asyncio.run(main())
