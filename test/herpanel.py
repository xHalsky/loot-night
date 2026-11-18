# Her panel (#46): the last-heard line, her note, the pre-emptive row and the stats keep fixed positions in every
# state. Prints the top of each block per state (they must not move) and makes test/herpanel_sheet.png.
import asyncio
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
V = "{stage:'%s',t:5,nextAt:999,fake:false,checked:%s,result:'%s',kind:'%s'%s}"
CASES = [
  ('idle', V % ('idle', 'false', '', 'peek', ''), ''),
  ('idle_hint', V % ('idle', 'false', '', 'peek', ''), "g.nightsPlayed=0; n.apt.cued=true; n.apt.activity='tv';"),
  ('far', V % ('far', 'false', '', 'peek', ''), ''),
  ('hall_cue', V % ('hall', 'false', '', 'chat', ''), 'g.nightsPlayed=0;'),
  ('caught', V % ('in', 'false', 'caught', 'peek', ''), ''),
  ('chat', V % ('in', 'true', 'chat', 'chat', ",chat:{order:[0,1,2],asked:0,line:'Do you think I should cut my hair short?',last:-1}"), ''),
  ('offer', V % ('in', 'true', 'offer', 'snack', ''), ''),
  ('ask', V % ('in', 'true', 'ask', 'cuddle', ''), ''),
  ('asleep', V % ('idle', 'false', '', 'peek', ''), 'n.clock=25*60; n.apt.asleep=true; n.apt.wake=35;'),
  ('headset', V % ('idle', 'false', '', 'peek', ''), 'n.headset=true;'),
]
async def main():
    shots = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(400)
        await act(pg, '[data-act=newGame]'); await pg.wait_for_timeout(200); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g, n=g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; g.nightsPlayed=1; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup');}")
        tops = {}
        for name, visit, extra in CASES:
            await pg.evaluate("([v,x])=>{const g=window.__lootnight.S.g, n=g.night; g.timeScale=1; g.nightsPlayed=1; n.clock=21*60; n.headset=false; n.apt.asleep=false; n.apt.cued=false; eval(x); n.visit=eval('('+v+')'); g.timeScale=0;}", [visit, extra])
            await pg.wait_for_timeout(350)
            t = await pg.evaluate("()=>{const q=s=>{const e=document.querySelector('#doorInfo '+s); return e?Math.round(e.getBoundingClientRect().top):null}; const st=document.querySelector('#doorInfo .her-stats').getBoundingClientRect(); return {heard:q('.di-heard'), note:q('.di-note'), stats:q('.her-stats'), bottom:Math.round(st.bottom)}}")
            tops[name] = t
            print(f'{name:10}', t)
            path = f'test/herpanel_{name}.png'
            await pg.screenshot(path=path, clip={'x': 0, 'y': 440, 'width': 280, 'height': 280}); shots.append((name, path))
        print('stats top constant:', len({t['stats'] for t in tops.values()}) == 1, '· max bottom', max(t['bottom'] for t in tops.values()))
        print('ERRORS', errs); await b.close()
    ims = [Image.open(p) for _, p in shots]
    W, H = ims[0].size
    sheet = Image.new('RGB', (W * 5, (H + 20) * 2), '#111'); d = ImageDraw.Draw(sheet)
    for k, (im, (name, _)) in enumerate(zip(ims, shots)):
        x, y = (k % 5) * W, (k // 5) * (H + 20)
        d.text((x + 6, y + 4), name, fill='#fff'); sheet.paste(im, (x, y + 20))
    sheet.save('test/herpanel_sheet.png')
asyncio.run(main())
