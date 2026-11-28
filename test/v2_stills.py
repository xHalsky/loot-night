# W6 of the v2 redesign (#132): stills from the build at the reference's beats, side by side with design/v2/stills/1x
# (the reference on the left, the build on the right, both at the native 474 x 232), and the F1 render times.
# Writes design/v2/review/w6-*.png and prints the frame times. Run after `npm run build`.
import asyncio, json, os, re
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

REF = 'design/v2/stills/1x'
OUT = '/tmp/w6'; os.makedirs(OUT, exist_ok=True); os.makedirs('design/v2/review', exist_ok=True)
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
PH = {'01': 0, '02': 3.2, '03': 6.2, '04': 10.6, '05': 19, '06': 27, '07': 35, '08': 42}   # each beat's start (the stills' times are from it; from the title on 4 s later since #151)
GAME = "()=>{const a=document.getElementById('rpgArea').getBoundingClientRect(); return {x:a.left,y:a.top,width:a.width*474/334,height:a.height}}"
pairs, ms = [], {}

async def game_shot(pg, name):
    box = await pg.evaluate(GAME); p = f'{OUT}/{name}.png'
    await pg.screenshot(path=p, clip=box); return p

async def render_ms(pg, ev, key, n=6):
    await ev("g.debug = true; 0"); vals = []
    for _ in range(n):
        await pg.wait_for_timeout(250)
        m = re.search(r'render ([0-9.]+) ms', await pg.evaluate("()=>(document.querySelector('.debug')||{}).innerText||''"))
        if m: vals.append(float(m.group(1)))
    await ev("g.debug = false; 0")
    ms[key] = (round(sum(vals) / len(vals), 1), max(vals)) if vals else None

async def launch(b):
    pg = await b.new_page(viewport={'width': 1280, 'height': 720}); ev = lambda js: pg.evaluate(EV, js)
    await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
    await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(1200)
    for f in sorted(x for x in os.listdir(REF) if x.startswith('desk-launch-')):
        T = float(re.search(r'T([0-9.]+)\.png', f).group(1)); T = T + 4 if T >= 15 else T   # the references' times are from before #151
        await ev(f"L.launch.seek({min(T, 41.99) if T < 42 else T}, true); 0"); await pg.wait_for_timeout(300)
        p = f'{OUT}/{f}'; await pg.screenshot(path=p)
        im = Image.open(p).convert('RGB').resize((640, 360), Image.NEAREST).crop((148, 0, 640, 360)); im.save(p)
        pairs.append(('launch', f, p))
    await pg.add_style_tag(content='#phHand,#phClose{visibility:hidden!important}')
    for f in sorted(x for x in os.listdir(REF) if x.startswith('launch-')):
        m = re.match(r'launch-(\d\d)[a-z]?-.*?-([0-9.]+)s\.png', f); T = PH[m.group(1)] + float(m.group(2))
        await ev(f"L.launch.seek({T}, true); 0"); await pg.wait_for_timeout(200)
        pairs.append(('launch', f, await game_shot(pg, f[:-4])))
    for key, T in (('launch title (23.6 s)', 23.6), ('launch login (30 s)', 30.0)):
        await ev(f"L.launch.seek({T}, true); 0"); await render_ms(pg, ev, key)
    await pg.close()

async def night(b):
    pg = await b.new_page(viewport={'width': 1280, 'height': 720}); ev = lambda js: pg.evaluate(EV, js)
    await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
    await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
    await ev("g.realLifeOff=true; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map'); n.phoneScript=[]; 0")
    await pg.wait_for_timeout(1500)
    pairs.append(('world', 'world-ravenhold-rain.png', await game_shot(pg, 'ravenhold')))
    await render_ms(pg, ev, 'Ravenhold in the rain')
    await pg.evaluate(GO, 'portal'); await pg.wait_for_timeout(300)
    for _ in range(400):
        if await ev("n.phase==='walk'"): break
        await pg.wait_for_timeout(20)
    await ev("g.timeScale=0; n.walkScroll=0; 0"); await pg.wait_for_timeout(400)
    pairs.append(('world', 'world-crypt-walk-tells.png', await game_shot(pg, 'walk')))
    # the iron angel close: the statue's alcove at 2x, as the reference frames it
    p = await game_shot(pg, 'angel'); im = Image.open(p).convert('RGB').resize((474, 232), Image.NEAREST)
    sx = 172   # the statue's x at this scroll (its alcove on the mid layer)
    close = Image.new('RGB', (474, 232), (10, 8, 20)); close.paste(im.crop((sx - 59, 0, sx + 59, 116)).resize((236, 232), Image.NEAREST), (119, 0))
    close.save(p); pairs.append(('world', 'world-crypt-iron-angel-close.png', p))
    await ev("g.timeScale=1; 0")
    for _ in range(800):
        if await ev("n.phase==='battle'"): break
        await pg.wait_for_timeout(20)
    await pg.wait_for_timeout(600)

    async def stage(foes, extra=''):
        js = "(()=>{g.timeScale=0; let u=9000; n.enemies = " + json.dumps(foes) + ".map(([id,slot,x])=>Object.assign({uid:u++, defId:id, name:id, hp:80, maxHp:100, atk:5, armor:1, speed:6, atb:0, aliveSec:5, stunned:0, boss:slot===5, flash:0, slot}, x||{})); n.reserve=[]; " + extra + "; return 0})()"
        await ev(js); await pg.wait_for_timeout(350)
    async def shot(ref, name): pairs.append(('battle', ref, await game_shot(pg, name)))
    await stage([['skeleton', 0], ['shelter', 1], ['auditor', 2]]); await shot('world-crypt-battle-roster.png', 'roster_a')
    await stage([['ghoul', 0], ['collector', 1], ['junk', 2, {'per': 25, 'hp': 75}]]); await shot('world-crypt-battle-roster.png', 'roster_b')
    await stage([['junk', 0, {'per': 25, 'hp': 75}], ['auditor', 1], ['skeleton', 2]]); await render_ms(pg, ev, 'crypt battle with Cherubs and a Confessor')
    await stage([['bat', 0, {'look': 'ironwing'}], ['bat', 1, {'look': 'ironwing'}], ['bat', 2, {'look': 'ironwing'}]]); await shot('battle-f1-ironwings.png', 'ironwings')
    await stage([['bat', 0, {'look': 'vigil'}], ['bat', 1, {'look': 'vigil'}], ['bat', 2, {'look': 'vigil'}]]); await shot('battle-f1-vigils.png', 'vigils')
    await stage([['skeleton', 0], ['brute', 1], ['skeleton', 2]]); await shot('battle-f6-gravedigger.png', 'gravedigger')
    await stage([['skeleton', 0], ['brute', 1, {'wind': 0.3, 'windMax': 1}], ['skeleton', 2]]); await shot('battle-f6-gravedigger-shove.png', 'gravedigger_shove')
    await stage([['shark', 5, {'wind': 1.2, 'windMax': 2}]]); await shot('battle-bellringer-summon.png', 'bellringer')
    await render_ms(pg, ev, 'the Bellringer through Summon')
    # the Gaoler's Smash: whirled, over, down (the cast), the impact and the drag back (after it resolves)
    G = [['bailiff', 5, {'wind': 1.5, 'windMax': 3}]]
    await stage(G); await shot('battle-gaoler-smash-1-whirl.png', 'gaoler1'); await render_ms(pg, ev, 'the Gaoler through Smash', 3)
    await ev("n.enemies[0].wind=0.15; 0"); await pg.wait_for_timeout(250); await shot('battle-gaoler-smash-2-over.png', 'gaoler2')
    await ev("n.enemies[0].wind=0.05; 0"); await pg.wait_for_timeout(250); await shot('battle-gaoler-smash-3-down.png', 'gaoler3')
    await ev("n.enemies[0].wind=0; 0"); await pg.wait_for_timeout(100); await shot('battle-gaoler-smash-4-impact.png', 'gaoler4')
    await pg.wait_for_timeout(600); await shot('battle-gaoler-smash-5-drag-back.png', 'gaoler5')
    # the Inquisitor's Execute: rest, raised (the cast), the 0.15 s cut, the follow-through, the recovery
    await stage([['landlord', 5]]); await shot('battle-inquisitor-execute-0-rest.png', 'inq0')
    await ev("Object.assign(n.enemies[0], {wind: 0.3, windMax: 3, evict: 0}); 0"); await pg.wait_for_timeout(250); await shot('battle-inquisitor-execute-1-raised.png', 'inq1')
    await render_ms(pg, ev, 'the Inquisitor through Execute', 3)
    await ev("n.enemies[0].wind=0.05; 0"); await pg.wait_for_timeout(250); await shot('battle-inquisitor-execute-2-cut.png', 'inq2')
    await ev("n.enemies[0].wind=0; 0"); await pg.wait_for_timeout(200); await shot('battle-inquisitor-execute-3-follow-through.png', 'inq3')
    await pg.wait_for_timeout(700); await shot('battle-inquisitor-execute-4-recover.png', 'inq4')
    # the Abbot's swing on his own attack clock (speed 6: 50 ATB a second): raised, the swing, the follow-through
    await stage([['troll', 5, {'atb': 85}]]); await shot('battle-abbot-1-raised.png', 'abbot1'); await render_ms(pg, ev, 'the Abbot through his swing', 3)
    await ev("n.enemies[0].atb=96; 0"); await pg.wait_for_timeout(250); await shot('battle-abbot-2-swing.png', 'abbot2')
    await ev("n.enemies[0].atb=0; n.enemies[0].lunge=0.3; 0"); await pg.wait_for_timeout(250); await shot('battle-abbot-3-follow-through.png', 'abbot3')
    # the Abbot asleep on the tithe, the curio
    await ev("n.enemies=[]; n.loot=[]; n.phase='curio'; n.curio={id:'troll',stage:'ask',t:5,max:7}; n.curioAt={id:'troll',x:210,passed:false}; 0"); await pg.wait_for_timeout(400)
    await shot('curio-abbot-asleep-on-the-tithe.png', 'curio_abbot')
    await pg.close()

def sheets():
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
    rows = []
    for fam, ref, mine in pairs:
        r = Image.open(f'{REF}/{ref}').convert('RGB'); me = Image.open(mine).convert('RGB')
        if me.size != r.size: me = me.resize(r.size, Image.NEAREST) if me.size[0] >= r.size[0] else me
        w, h = r.size; row = Image.new('RGB', (w * 2 + 12, h + 18), (16, 14, 20)); d = ImageDraw.Draw(row)
        d.text((2, 2), f'reference: {ref}', fill=(200, 194, 180), font=font); d.text((w + 12, 2), 'the build', fill=(200, 194, 180), font=font)
        row.paste(r, (0, 18)); row.paste(me.resize(r.size, Image.NEAREST), (w + 12, 18)); rows.append((fam, row))
    for fam in ('launch', 'world', 'battle'):
        rs = [r for f, r in rows if f == fam]
        for k in range(0, len(rs), 8):
            part = rs[k:k + 8]; W = max(r.size[0] for r in part)
            sheet = Image.new('RGB', (W, sum(r.size[1] + 6 for r in part)), (16, 14, 20)); y = 0
            for r in part: sheet.paste(r, (0, y)); y += r.size[1] + 6
            sheet.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(f'design/v2/review/w6-{fam}-{k // 8 + 1}.png', optimize=True)   # palette art: no loss; print('sheet', fam, k // 8 + 1, sheet.size)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        await launch(b); await night(b)
        await b.close()
    sheets()
    print('F1 render ms (mean, max):', json.dumps(ms, indent=1))
asyncio.run(main())
