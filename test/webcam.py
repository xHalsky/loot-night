# The webcam view (#36, #35): idle, peeking (back of his head), her in the doorway behind him (the key shot),
# the shower daydream bubble, and the plan taken off the wall. Contact sheet: test/webcam_sheet.png.
import asyncio
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
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
        await pg.evaluate("()=>{const S=window.__lootnight.S; const n=S.g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.tired=0; S.g.timeScale=0}")
        async def shot(name, js, full=False):
            await pg.evaluate("()=>{" + js + "}"); await pg.wait_for_timeout(300)
            path = f'test/webcam_{name}.png'
            await pg.screenshot(path=path, clip={'x': 0, 'y': 0, 'width': 640 if full else 280, 'height': 720})
            shots.append((name, path))
        N = "const n=window.__lootnight.S.g.night;"
        await shot('idle', N + "n.apt.heardWhat='TV'; n.apt.heard='living'; n.apt.heardAt=n.threat-4;")
        await shot('peeking', N + "n.peek=0.6; n.peeking=true; Object.assign(n.apt,{activity:'tea',room:'kitchen',moving:0});")
        await shot('her_in_door', N + "n.peek=0; n.peeking=false; Object.assign(n.visit,{stage:'in',kind:'peek',from:'tv',result:'',checked:false,t:99});")
        await shot('her_pass', N + "Object.assign(n.visit,{stage:'in',kind:'peek',from:'phone',result:'pass',checked:true,t:99});")
        await shot('headset', N + "Object.assign(n.visit,{stage:'idle'}); n.headset=true;")
        await shot('shower', N + "n.headset=false; Object.assign(n.apt,{activity:'shower',room:'bathroom',moving:0,t:60,cued:false});")
        await shot('toes', N + "Object.assign(n.apt,{activity:'tv',room:'living'}); Object.assign(n.visit,{stage:'hall',kind:'peek',t:99});")
        await shot('chat', N + "Object.assign(n.visit,{stage:'in',kind:'chat',from:'tv',result:'chat',checked:true,t:99,chat:{order:[0,1,2],asked:0,line:'\"Do you think my sister will like the scarf?\"',t:5,score:0}});")
        await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; n.visit.stage='idle';}")
        r = await pg.evaluate("()=>{const e=document.querySelector('#doorCanvas').getBoundingClientRect(); return [e.left,e.top]}")
        await pg.mouse.click(r[0] + 40, r[1] + 150); await pg.wait_for_timeout(300)
        opened = await pg.evaluate("()=>!!document.querySelector('.plan-sheet')")
        await pg.screenshot(path='test/webcam_plan.png', clip={'x': 0, 'y': 0, 'width': 640, 'height': 720})
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        closed_esc = await pg.evaluate("()=>!document.querySelector('.plan-sheet') && !window.__lootnight.S.g.paused")
        await pg.mouse.click(r[0] + 40, r[1] + 150); await pg.wait_for_timeout(200)
        await pg.mouse.click(1100, 650); await pg.wait_for_timeout(200)
        closed_out = await pg.evaluate("()=>!document.querySelector('.plan-sheet')")
        await pg.mouse.click(r[0] + 40, r[1] + 150); await pg.wait_for_timeout(200)
        await act(pg, '#planUi .mg-close'); await pg.wait_for_timeout(200)
        closed_x = await pg.evaluate("()=>!document.querySelector('.plan-sheet')")
        print('plan opens', opened, '| Esc closes (no pause)', closed_esc, '| click outside closes', closed_out, '| x closes', closed_x)
        await pg.screenshot(path='test/webcam_desk.png', clip={'x': 280, 'y': 0, 'width': 680, 'height': 60})
        print('ERRORS', errs); await b.close()
    cols = 4
    sheet = Image.new('RGB', (cols * 286, 2 * 742), '#111')
    d = ImageDraw.Draw(sheet)
    for i, (name, path) in enumerate(shots):
        x, y = (i % cols) * 286, (i // cols) * 742
        sheet.paste(Image.open(path), (x, y + 20)); d.text((x + 4, y + 4), name, fill='#fff')
    sheet.save('test/webcam_sheet.png')
asyncio.run(main())
