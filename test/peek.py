# Peek through the crack (#34): one screenshot per row of the table in docs/design/her.md, at the crack each
# row needs, plus every row fully creeped open, and a contact sheet (test/peek_sheet.png). Run after a build.
import asyncio
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
ROWS = [  # name, activity, room, asleep, visit stage, crack (0..1 of PEEK_CRACK_MAX)
    ('kitchen_tea', 'tea', 'kitchen', False, 'idle', 0.23),
    ('bathroom', 'toilet', 'bathroom', False, 'idle', 0.5),
    ('shower', 'shower', 'bathroom', False, 'idle', 0.5),
    ('bedroom_phone', 'phone', 'bedroom', False, 'idle', 1.0),
    ('asleep', 'sleep', 'bedroom', True, 'idle', 1.0),
    ('living_tv', 'tv', 'living', False, 'idle', 1.0),
    ('hallway_moving', 'phone', 'living', False, 'moving', 0.23),
    ('hallway_coming', 'tv', 'hallway', False, 'far', 0.23),
    ('at_the_door', 'tv', 'hallway', False, 'hall', 0.23),
]
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def main():
    shots = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await act(pg, '[data-act=newGame]')
        await pg.evaluate("()=>{const S=window.__lootnight.S; const n=S.g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; S.g.timeScale=0}")
        for name, act_id, room, asleep, stage, crack in ROWS:
            for c, tag in ((crack, ''), (1.0, '_wide')):
                if tag and crack == 1.0: continue
                await pg.evaluate("""([a,r,sl,st,c])=>{const n=window.__lootnight.S.g.night;
                    Object.assign(n.apt,{activity:a,room:r,asleep:sl,moving:st==='moving'?1.5:0,t:30,cued:false});
                    n.visit.stage = st==='moving' ? 'idle' : st; n.visit.from='tv'; n.visit.t=99; n.peek=c; n.peeking=false; n.peekSus=0; n.headset=false;}""",
                                  [act_id, room, asleep, stage, c])
                await pg.wait_for_timeout(250)
                path = f'test/peek_{name}{tag}.png'
                await pg.screenshot(path=path, clip={'x': 0, 'y': 20, 'width': 280, 'height': 370})
                shots.append((name + tag, path))
        print('ERRORS', errs); await b.close()
    W, H = 280, 370
    cols = 5
    sheet = Image.new('RGB', (cols * (W + 6), ((len(shots) + cols - 1) // cols) * (H + 22)), '#111')
    d = ImageDraw.Draw(sheet)
    for i, (name, path) in enumerate(shots):
        x, y = (i % cols) * (W + 6), (i // cols) * (H + 22)
        sheet.paste(Image.open(path), (x, y + 20)); d.text((x + 4, y + 4), name, fill='#fff')
    sheet.save('test/peek_sheet.png')
asyncio.run(main())
