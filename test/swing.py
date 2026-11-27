# Melee swings (#97): the Knight's Slash and Bash swing the sword off his shoulder, over the top and down at the enemy;
# Hixx's Stab and Backstab cut with both daggers; both leave a smear. The game is paused and the swing
# held at eight points of its 0.42 s. Writes test/shots/swing.png (left to right, top to bottom: q 0.12 .. 0.8) and
# test/shots/swing_rogue.png (Hixx alone, closer: his two daggers cross in an X).
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
QUIET = "g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.apt.lastVisitEnd=1e9; n.dog.next=1e9; 0"
SWING_SEC = 0.42   # tuning.ts SWING_SEC
fails = []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        go = lambda a, arg=None: pg.evaluate(GO, [a, arg]); ev = lambda js: pg.evaluate(EV, js)
        await pg.add_init_script('window.__lnDay = 0'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await ev("g.voice=null; g.howto=false; 0"); await go('howtoClose')
        await ev(QUIET); await go('portal'); await pg.wait_for_timeout(500); await ev(QUIET); await go('toDungeon'); await pg.wait_for_timeout(300)
        await ev("n.curioPlan=[]; n.curio=null; n.curioAt=null; n.phaseT=99; 0")
        for _ in range(40):
            if await ev("n.phase") == 'battle': break
            await pg.wait_for_timeout(100)
        await pg.wait_for_timeout(600)
        await ev("n.enemies.forEach(e=>{e.hp=e.maxHp=1e6}); g.heroes.forEach(h=>{h.hp=1e5}); 0")
        # the rules: auto attacks and the melee skills set the swing; the others don't
        await ev("g.heroes.forEach(h=>{h.swing=0; h.atb=99.99}); 0"); await pg.wait_for_timeout(80)
        sw = await ev("Object.fromEntries(g.heroes.map(h=>[h.id, (h.swing||0)>0]))")
        check(sw['knight'] and sw['rogue'] and not sw['mage'] and not sw['healer'], f'auto attacks: the Knight and Hixx swing, the casters do not ({sw})')
        await ev("g.timeScale=0; 0")
        frames = []
        for k, q in enumerate([0.12, 0.25, 0.32, 0.38, 0.44, 0.5, 0.58, 0.8]):
            await ev(f"g.heroes.forEach(h=>{{ h.swing = (h.id==='knight'||h.id==='rogue') ? {SWING_SEC * (1 - q)} : 0; h.lunge=0 }}); 0"); await pg.wait_for_timeout(120)
            f = f'/tmp/swing{k}.png'; await pg.screenshot(path=f, clip={'x': 420, 'y': 210, 'width': 240, 'height': 200}); frames.append(f)
        ims = [Image.open(f).resize((360, 300), Image.NEAREST) for f in frames]; w, h = ims[0].size
        o = Image.new('RGB', (w * 4 + 18, h * 2 + 6), (20, 14, 24))
        for i, im in enumerate(ims): o.paste(im, ((i % 4) * (w + 6), (i // 4) * (h + 6)))
        o.save('test/shots/swing.png')
        # Hixx alone, closer: both daggers, the near one cuts up, the far one a beat later down over the top (an X)
        frames = []
        for k, q in enumerate([0.15, 0.3, 0.38, 0.45, 0.52, 0.6, 0.68, 0.85]):
            await ev(f"g.heroes.forEach(h=>{{ h.swing = h.id==='rogue' ? {SWING_SEC * (1 - q)} : 0; h.lunge=0 }}); 0"); await pg.wait_for_timeout(120)
            f = f'/tmp/swing_g{k}.png'; await pg.screenshot(path=f, clip={'x': 450, 'y': 270, 'width': 130, 'height': 140}); frames.append(f)
        ims = [Image.open(f).resize((260, 280), Image.NEAREST) for f in frames]; w, h = ims[0].size
        o = Image.new('RGB', (w * 4 + 18, h * 2 + 6), (20, 14, 24))
        for i, im in enumerate(ims): o.paste(im, ((i % 4) * (w + 6), (i // 4) * (h + 6)))
        o.save('test/shots/swing_rogue.png')
        print('errors:', errs or 'none')
        if errs: fails.append('page errors')
        await b.close()
    print(f'{len(fails)} failed' if fails else 'all passed')
asyncio.run(main())
