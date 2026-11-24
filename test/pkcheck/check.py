# V1 check: the renderer in the build draws the mockup's default frame; compare with still 00-default at 1x.
import asyncio, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageChops
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 640, 'height': 360}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        await pg.goto('file:///home/claude/loot-night/.pkcheck/index.html')
        await pg.wait_for_function('window.PKT && window.PKT.ready', timeout=20000)
        ms = await pg.evaluate("()=>{const t0=performance.now(); for(let i=0;i<20;i++) window.PKT.draw('dungeon', 8.2+i/60, i/60, 'calm', 'chat'); return (performance.now()-t0)/20}")
        await pg.evaluate("()=>window.PKT.draw('dungeon', 8.2, 0, 'calm', 'chat')")
        await pg.screenshot(path='/tmp/pk_default.png', clip={'x': 0, 'y': 0, 'width': 640, 'height': 360})
        print('ms/frame', round(ms, 1), 'errors', errs[:5]); await b.close()
    a = Image.open('/tmp/pk_default.png').convert('RGB'); s = Image.open('design/redesign/stills/00-default__dungeon-calm-chat.png').convert('RGB')
    d = ImageChops.difference(a, s).convert('L'); n = sum(1 for v in d.getdata() if v > 0)
    print('differing px', n, 'of', 640 * 360, f'({100 * n / (640 * 360):.1f}%)')
    Image.fromarray if False else None
    side = Image.new('RGB', (1280, 360)); side.paste(a, (0, 0)); side.paste(s, (640, 0)); side.save('/tmp/pk_side.png')
asyncio.run(main())
