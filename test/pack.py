# The pack in the corridor (#118), in the browser: the next pack comes in from the right as the party walks, a red "!"
# pops over every head as its front enemy comes into view and is gone after PACK_ALERT_SEC (#120), no HP bars until the
# fight. Writes test/shots/pack_*.png.
import asyncio, os
from playwright.async_api import async_playwright
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
# crimson pixels of the "!" in a band over the heads (rpgArea is the 334 x 232 battle area)
RED = "([x0,x1,y0,y1])=>{const d=document.getElementById('rpgArea').getContext('2d').getImageData(x0,y0,x1-x0,y1-y0).data; let n=0; for(let i=0;i<d.length;i+=4){ if(d[i]>185&&d[i+1]<90&&d[i+2]>60&&d[i+2]<125) n++; } return n}"
fails = []
def check(ok, msg): print(('ok   ' if ok else 'FAIL ') + msg); (None if ok else fails.append(msg))
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        ev = lambda js: pg.evaluate(EV, js)
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await ev("g.realLifeOff=true; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map'); 0")
        await pg.evaluate(GO, 'portal'); await pg.wait_for_timeout(300)
        await ev("n.visit.nextAt=1e9; n.dog.next=1e9; n.phoneScript=[]; n.friendsLeft=0; n.curioPlan=[]; 0")
        box = await pg.evaluate("()=>{const r=document.getElementById('rpgArea').getBoundingClientRect(); return {x:r.left,y:r.top,width:r.width,height:r.height}}")
        shot = lambda name: pg.screenshot(path=f'test/shots/pack_{name}.png', clip=box)
        # wait for the pack, then catch it coming in, right after it sees the party, halfway, and in position
        for _ in range(400):
            if await ev("!!n.pack"): break
            await pg.wait_for_timeout(25)
        print('  pack placed:', await ev("n.pack ? n.phase + ' at ' + n.pack.at.toFixed(0) : n.phase + ' ' + n.phaseT.toFixed(1)"))
        check(await ev("!!n.pack && n.phase==='walk'"), 'the walk places the next pack in the corridor')
        for _ in range(200):
            if await ev("n.pack && n.pack.front + n.pack.at < 345"): break
            await pg.wait_for_timeout(10)
        await shot('1_coming')
        before = await pg.evaluate(RED, [150, 334, 60, 150])
        for _ in range(300):
            if await ev("n.pack && n.pack.spot >= 0.12"): break
            await pg.wait_for_timeout(5)
        await shot('2_spotted')
        at = await ev("n.pack ? n.pack.at : -1")
        red = await pg.evaluate(RED, [150, 334, 60, 150])
        check(at > 0 and red > before + 6, f'a red "!" pops over the heads as it comes into view (red px {before} -> {red}, {at:.0f} px still to walk)')
        for _ in range(300):
            if await ev("!n.pack || n.pack.spot >= 0.65"): break
            await pg.wait_for_timeout(10)
        gone = await pg.evaluate(RED, [150, 334, 60, 150])
        check(await ev("!!n.pack") and gone < red - 6, f'half a second later it is gone, the pack still coming (red px {red} -> {gone})')
        for _ in range(300):
            if await ev("!n.pack || n.pack.at < 70"): break
            await pg.wait_for_timeout(10)
        await shot('3_closer')
        for _ in range(400):
            if await ev("n.phase==='battle'"): break
            await pg.wait_for_timeout(10)
        await pg.wait_for_timeout(120); await shot('4_fight')
        check(await ev("n.phase==='battle'"), 'in position: the fight starts')
        check(not errs, f'errors: {errs[:2]}')
        await b.close()
    print('FAILED: ' + '; '.join(fails) if fails else 'PASS')
asyncio.run(main())
