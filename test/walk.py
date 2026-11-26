# The walk (#95, #99): nobody runs ahead for the loot, the front hero picks it up by walking over it, and after the
# floor's last fight the party still walks forward (out of the floor) over the drops; a curio comes into view off the
# right edge, the party stops at it, and after the choice walks on past it (it goes by behind them, off the left edge)
# before the next fight. Writes test/shots/walk_loot.png and test/shots/walk_curio.png (frames left to right, top to bottom).
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
QUIET = "g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.apt.lastVisitEnd=1e9; n.dog.next=1e9; 0"
CLIP = {'x': 300, 'y': 230, 'width': 680, 'height': 200}
fails = []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
def sheet(frames, path):
    ims = [Image.open(f) for f in frames]; w, h = ims[0].size
    o = Image.new('RGB', (w * 2 + 8, (h + 8) * ((len(ims) + 1) // 2)), (20, 14, 24))
    for i, im in enumerate(ims): o.paste(im, ((i % 2) * (w + 8), (i // 2) * (h + 8)))
    o.save(path)
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        go = lambda a, arg=None: pg.evaluate(GO, [a, arg]); ev = lambda js: pg.evaluate(EV, js)
        await pg.add_init_script('window.__lnDay = 0'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await ev("g.voice=null; g.howto=false; 0"); await go('howtoClose')
        await ev(QUIET); await go('portal'); await pg.wait_for_timeout(500); await ev(QUIET)
        check(await ev("g.heroes.map(h=>h.id).join()") == 'knight,rogue,mage,healer', 'Monday: Garrote in the party, second (#96)')
        await go('toDungeon'); await pg.wait_for_timeout(300)
        # 1. after the floor's last fight: three drops ahead; the party walks out over them
        await ev("""(()=>{n.enemies=[]; n.reserve=[]; n.curioPlan=[]; n.curio=null; n.curioAt=null; n.battleIdx=3; n.phase='walk'; n.phaseT=0;
          const mk=(id,r)=>({kind:'item',id,item:{id,name:'Drop '+id,slot:'helm',rarity:r,ilvl:2,affixes:[],value:5,identified:true}});
          n.floorLoot=[{entry:mk('l1','rare'),x:190,t:0},{entry:mk('l2','common'),x:240,t:0},{entry:mk('l3','epic'),x:300,t:0}]; 0})()""")
        frames, seen = [], []
        for k in range(8):
            f = f'/tmp/walk_l{k}.png'; await pg.screenshot(path=f, clip=CLIP); frames.append(f)
            seen.append(await ev("[n.phase, n.floorLoot.map(l=>Math.round(l.x)), g.bag.length]"))
            await pg.wait_for_timeout(420)
        sheet(frames, 'test/shots/walk_loot.png')
        check(all('looterDx' not in str(s) for s in seen) and await ev("n.looterDx === undefined"), 'no looter run any more')
        check(seen[0][0] == 'walk' and seen[0][2] == 0, 'after the last fight the party walks, the drops still on the floor')
        picked = [s for s in seen if s[0] == 'walk']
        check(all(min(s[1] or [999]) > 126 for s in picked), f'drops are picked up at the front hero\'s feet, never behind him ({[s[1] for s in picked]})')
        await pg.wait_for_timeout(2500)
        check(await ev("g.bag.length") == 3 and await ev("n.phase") == 'mapChoice', 'all three walked over, then the floor ends (the map)')
        # 2. a curio: comes in off the right edge, the party stops at it, then walks past it
        await go('path', '0'); await pg.wait_for_timeout(300)
        await ev("n.enemies=[]; n.reserve=[]; n.floorLoot=[]; n.curioPlan=[0]; n.curio=null; n.curioAt=null; n.battleIdx=0; n.phase='walk'; n.phaseT=0; 0")
        await pg.wait_for_timeout(150)
        x0 = await ev("n.curioAt && n.curioAt.x")
        check(x0 is not None and x0 > 330, f'it comes into view off the right edge (x {x0})')
        frames = []
        for k in range(3):
            f = f'/tmp/walk_c{k}.png'; await pg.screenshot(path=f, clip=CLIP); frames.append(f); await pg.wait_for_timeout(1400)
        for _ in range(40):
            if await ev("n.phase") == 'curio': break
            await pg.wait_for_timeout(150)
        check(await ev("n.phase") == 'curio' and abs(await ev("n.curioAt.x") - 210) < 6, f'the party stops at it ({await ev("n.curioAt && Math.round(n.curioAt.x)")})')
        f = '/tmp/walk_c3.png'; await pg.screenshot(path=f, clip=CLIP); frames.append(f)
        await go('curioLeave'); await pg.wait_for_timeout(100)
        check(await ev("n.phase") == 'walk' and await ev("n.curioAt && n.curioAt.passed"), 'after the choice it stays, and the party walks on')
        xs = []
        for k in range(4, 8):
            await pg.wait_for_timeout(1000); f = f'/tmp/walk_c{k}.png'; await pg.screenshot(path=f, clip=CLIP); frames.append(f)
            xs.append(await ev("[n.phase, n.curioAt ? Math.round(n.curioAt.x) : null]"))
        sheet(frames, 'test/shots/walk_curio.png')
        moving = [x[1] for x in xs if x[1] is not None]
        check(len(moving) >= 2 and all(a > b for a, b in zip(moving, moving[1:])), f'it goes by behind them ({xs})')
        check(all(x[0] == 'walk' or x[1] is None for x in xs), 'no fight while it is still on screen')
        for _ in range(30):
            if await ev("n.phase") == 'battle': break
            await pg.wait_for_timeout(200)
        check(await ev("n.phase") == 'battle' and await ev("!n.curioAt"), 'off the left edge: the next fight')
        print('errors:', errs or 'none')
        if errs: fails.append('page errors')
        await b.close()
    print(f'{len(fails)} failed' if fails else 'all passed')
asyncio.run(main())
