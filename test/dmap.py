# The dungeon map (#48): the journey from floor 1 on parchment, at a few depths, plus a hovered map path.
import asyncio
from playwright.async_api import async_playwright
from PIL import Image
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
CLIP = {'x': 32, 'y': 26, 'width': 616, 'height': 352}
CASES = [  # floor, record, path kinds by floor, corpse floor, checkpoint, maps in the bag
  ('early', 2, 2, {}, 0, 1, []),
  ('mid', 7, 9, {3: 'vault', 4: 'shrine', 7: 'goblin', 8: 'elite'}, 9, 6, ['vault', 'cursed']),
  ('boss_next', 9, 9, {2: 'elite', 6: 'cursed'}, 0, 6, ['shrine']),
  ('deep', 23, 23, {3: 'vault', 12: 'goblin', 17: 'shrine', 21: 'elite', 22: 'vault'}, 0, 21, ['vault', 'goblin', 'elite', 'cursed']),
]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=2)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(400)
        await act(pg, '[data-act=newGame]'); await pg.wait_for_timeout(200); await act(pg, '[data-act=howtoClose]')
        await pg.evaluate("()=>{const g=window.__lootnight.S.g, n=g.night; n.nextInterruptAt=1e9; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup');}")
        await act(pg, '[data-act=portal]'); await pg.wait_for_timeout(500)
        shots = []
        for name, floor, rec, kinds, corpse, cp, maps in CASES:
            await pg.evaluate("""([f,rec,kinds,corpse,cp,maps])=>{const g=window.__lootnight.S.g, n=g.night;
              g.mapPath=[]; for(let i=1;i<=rec;i++) g.mapPath[i]=kinds[i]||(i%5===0?'boss':'plain');
              n.floor=f; n.deepest=rec; g.record=rec; n.checkpoint=cp; n.corpse=corpse?[{kind:'feather',id:'c1'}]:[]; n.corpseFloor=corpse;
              g.bag=g.bag.filter(e=>e.kind!=='map'); maps.forEach((m,i)=>g.bag.push({kind:'map',id:'m'+i,map:m}));
              n.enemies=[]; n.phase='mapChoice'; g.timeScale=0;}""", [floor, rec, {str(k): v for k, v in kinds.items()}, corpse, cp, maps])
            await pg.wait_for_timeout(400)
            path = f'test/dmap_{name}.png'; bb = await (await pg.query_selector('.nodemap')).bounding_box(); await pg.screenshot(path=path, clip=bb); shots.append(path)
        opts = await pg.query_selector_all('.nm-opt')
        bb = await opts[1].bounding_box(); await pg.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); await pg.wait_for_timeout(300)
        bb = await (await pg.query_selector('.nodemap')).bounding_box(); await pg.screenshot(path='test/dmap_hover.png', clip=bb); shots.append('test/dmap_hover.png')
        print('ERRORS', errs); await b.close()
    ims = [Image.open(x) for x in shots]
    W, H = ims[0].size
    sheet = Image.new('RGB', (W * 2, H * 3), '#111')
    for k, im in enumerate(ims): sheet.paste(im, ((k % 2) * W, (k // 2) * H))
    sheet.save('test/dmap_sheet.png')
asyncio.run(main())
