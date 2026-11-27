# Party skills between fights (#122), in the browser: on the walk the skill bar dims the skills that need an enemy
# (Taunt, Bash, Backstab, Smoke Bomb, Fire, Frost, Cataclysm) and keeps the party's (Mend, Ward, Miracle, Last Stand,
# Heist); A (Mend) heals on the walk, Q (Fire) says "No enemies in reach". Writes test/shots/between_*.png.
import asyncio, os
from playwright.async_api import async_playwright
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
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
        await ev("g.realLifeOff=true; const F=['g1','g2','s2','m1','m2','m3','ult']; g.trees={knight:F,rogue:F,mage:F,healer:F}; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map'); 0")
        await pg.evaluate(GO, 'portal'); await pg.wait_for_timeout(300)
        await ev("n.visit.nextAt=1e9; n.dog.next=1e9; n.phoneScript=[]; n.friendsLeft=0; n.curioPlan=[]; g.heroes.forEach(h=>{h.ult=1; h.hp=Math.round(h.hp*0.5)}); 0")
        box = await pg.evaluate("()=>{const r=document.getElementById('rpgArea').getBoundingClientRect(); return {x:r.left,y:r.top+r.height*0.84,width:r.width,height:r.height*0.16}}")
        await pg.wait_for_timeout(300)
        check(await ev("n.phase") == 'walk', 'on the walk')
        await pg.screenshot(path='test/shots/between_walk_bar.png', clip=box)
        hp0 = await ev("g.heroes.map(h=>h.hp).join(',')")
        await pg.keyboard.press('a'); await pg.wait_for_timeout(150)
        hp1 = await ev("g.heroes.map(h=>Math.round(h.hp)).join(',')")
        check(hp1 != hp0 and await ev("g.heroes.find(h=>h.id==='healer').cd[1] > 0"), f'A (Mend) heals the party on the walk ({hp0} -> {hp1})')
        await ev("n.toasts=[]; 0"); await pg.keyboard.press('q'); await pg.wait_for_timeout(150)
        check('No enemies in reach' in (await ev("n.toasts.map(t=>t.text).join('|')")) and await ev("g.heroes.find(h=>h.id==='mage').cd[1] === 0"), 'Q (Fire) on the walk: "No enemies in reach", no cooldown')
        for _ in range(400):
            if await ev("n.phase==='battle'"): break
            await pg.wait_for_timeout(25)
        await pg.wait_for_timeout(200); await pg.screenshot(path='test/shots/between_fight_bar.png', clip=box)
        check(await ev("n.phase") == 'battle', 'the fight: every skill lit again')
        check(not errs, f'errors: {errs[:2]}')
        await b.close()
    print('FAILED: ' + '; '.join(fails) if fails else 'PASS')
asyncio.run(main())
