# The looter's run (#52 1.3): Garrote runs ahead to each drop on the walk, grabs it and runs back into his rank.
# Writes test/shots/looter.png (frames left to right, top to bottom) and checks the walk waits for him.
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g; g.realLifeOff=true; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map')}")
        await pg.evaluate(GO, 'dbgRogue'); await pg.evaluate(GO, 'portal'); await pg.wait_for_timeout(300)
        await pg.evaluate("""()=>{const n=window.__lootnight.S.g.night; n.enemies=[]; n.reserve=[]; n.phase='walk'; n.phaseT=0; n.curioPlan=[];
          const mk=(id,r)=>({kind:'item',id,item:{id,name:'Drop '+id,slot:'helm',rarity:r,ilvl:2,affixes:[],value:5,identified:true}});
          n.floorLoot=[{entry:mk('l1','rare'),x:205,t:0},{entry:mk('l2','common'),x:250,t:0}]}""")
        r = await pg.evaluate("()=>{const r=document.getElementById('rpgArea').getBoundingClientRect(); return [r.left,r.top]}")
        frames, dxs = [], []
        for k in range(8):
            await pg.screenshot(path=f'/tmp/lf{k}.png', clip={'x': r[0], 'y': r[1] + 240, 'width': 668, 'height': 200})
            frames.append(f'/tmp/lf{k}.png')
            dxs.append(await pg.evaluate("()=>{const n=window.__lootnight.S.g.night; return [Math.round(n.looterDx||0), n.floorLoot.length, n.phase]}"))
            await pg.wait_for_timeout(260)
        ims = [Image.open(f) for f in frames]; w, h = ims[0].size
        o = Image.new('RGB', (w * 2 + 8, (h + 8) * 4), (20, 14, 24))
        for i, im in enumerate(ims): o.paste(im, ((i % 2) * (w + 8), (i // 2) * (h + 8)))
        o.save('test/shots/looter.png')
        print('looter dx, loot left, phase per frame:', dxs, 'errors:', errs or 'none')
        assert max(d[0] for d in dxs) > 40, 'the looter never ran ahead'
        assert dxs[-1][1] == 0, 'loot left on the floor'
        await b.close()
asyncio.run(main())
