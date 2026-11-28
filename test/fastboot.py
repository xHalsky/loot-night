# The fast boot (#149): every night after the first, the login and the typing at their pace, then from the Log in
# press the rest flies by: the town about 7.4 real s after the chat comes up (it was 15). Stills along the way, the
# real time each was taken at, and the phone's Let's go once the town is in. Writes test/shots/fastboot_*.png and
# test/shots/fastboot_sheet.png. Run after `npm run build`.
import asyncio, os, time
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
fails = []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        ev = lambda js: pg.evaluate(EV, js)
        await pg.add_init_script('window.__lnDay = 1'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame')
        t0 = time.time(); shots = []
        for want in (28.0, 30.5, 32.2, 33.5, 35.6, 37.4, 39.5, 41.6, 42.6):
            while True:
                t = await ev("L.launch.t()")
                if t >= want or t < 0 or time.time() - t0 > 30: break
                await pg.wait_for_timeout(15)
            real = time.time() - t0
            path = f'test/shots/fastboot_{int(want * 10)}.png'
            await pg.screenshot(path=path); shots.append((t, real, path))
            print(f'T {t:5.2f} at {real:4.2f} s')
        town = next((r for t, r, _ in shots if t >= 42), None)
        check(town is not None and 6.6 < town < 9.5, f'the town in about 7.4 real s ({town and round(town, 2)} s, with the screenshots\' own time)')
        lg = next((r for t, r, _ in shots if t >= 32.2), 99)
        check(4.8 < lg < 6.8, f'the login and the typing at their pace: Log in pressed about 5.2 s in ({round(lg, 2)} s)')
        check(await ev("!!g.voice && g.voice.launch === 'login'"), 'the phone still up, waiting for Let\'s go')
        check(not errs, 'no page errors ' + str(errs[:2]))
        await b.close()
    ims = [Image.open(pth).convert('RGB').resize((640, 360)) for _, _, pth in shots]
    sheet = Image.new('RGB', (640 * 3 + 16, (len(ims) + 2) // 3 * 384), (20, 16, 26))
    d = ImageDraw.Draw(sheet)
    for i, ((t, real, _), im) in enumerate(zip(shots, ims)):
        x, y = (i % 3) * 648, (i // 3) * 384; sheet.paste(im, (x, y)); d.text((x + 6, y + 364), f'T {t:.1f}   {real:.1f} s real', fill=(242, 233, 216))
    sheet.save('test/shots/fastboot_sheet.png')
    print(f'{len(fails)} failed' if fails else 'all passed')
asyncio.run(main())
