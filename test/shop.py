# The Shop app (step 4.6, #55; grid doc 7i, 7f), with the real mouse: pick the idle phone up (the home screen has
# Messages and Shop), open the Shop, buy Flowers for her (Goodwill, then "tonight"), switch to For you, buy the
# lasting things (owned), Goblin Fuel up to the drawer's 8 (then "full"), the dog chew (his next visit later), the new
# phone listed as "soon"; the mini fridge starts the energy break at the can; Back goes home. Screenshots
# test/shots/shop_*.png and a sheet test/shots/shop_sheet.png next to stills 103, 111 and 112.
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
shots, fails = [], []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append((e.stack or str(e))[:500]))
        go = lambda a, arg=None: pg.evaluate(GO, [a, arg]); ev = lambda js: pg.evaluate(EV, js)
        async def shot(name, wait=250):
            await pg.wait_for_timeout(wait); path = f'test/shots/shop_{name}.png'; await pg.screenshot(path=path); shots.append((name, path))
        async def tap(act, arg=None):   # a phone button by its hit region
            hs = await pg.evaluate("()=>window.__lnPhone()")
            h = next((h for h in hs if h['act'] == act and (arg is None or h['arg'] == arg)), None)
            if not h: return False
            await pg.mouse.click(h['x'], h['y']); await pg.wait_for_timeout(250); return True
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        await ev("g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.visit.nextAt=1e9; n.apt.lastVisitEnd=1e9; n.dog.nextAt=1e9; g.timeScale=0.2; 0")
        await go('portal'); await pg.wait_for_timeout(700)
        # pick the idle phone up from the desk
        ph = await pg.evaluate("()=>{const h=(window.__lootnight.deskHits||[]).find(h=>h.act==='phone'); return h ? [296 + (h.x + h.w / 2) * 2, (h.y + h.h / 2) * 2] : null}")
        await pg.mouse.move(*ph); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(500)
        await shot('1_home')
        check(await tap('phApp', 'shop'), 'the home screen has the Shop')
        check(await ev("n.phApp") == 'shop', 'the Shop opens'); await shot('2_for_you')
        # For her: Flowers (the 50 zl you start with)
        await tap('shopTab', 'her'); gw = await ev("g.goodwill")
        check(await tap('shopBuy', 'flowers'), 'Flowers can be bought')
        check(await ev("g.goodwill") >= gw + 19 and await ev("n.shopTonight.includes('flowers')"), f'Flowers: Goodwill +{await ev("g.goodwill") - gw}, then "tonight"')
        await shot('3_for_her', 100)
        check(not await tap('shopBuy', 'flowers'), 'once a night')
        # For you: money in the wallet, the lasting things
        await ev("g.zl = 2000; 0"); await tap('shopTab', 'you')
        for it in ['keys', 'chair', 'fridge']: check(await tap('shopBuy', it), f'{it} bought')
        check(await ev("['keys','chair','fridge'].every(k => g.owned.includes(k))"), 'they are yours (saved)')
        cans = await ev("g.monsters")
        await tap('shopBuy', 'fuel'); await tap('shopBuy', 'fuel')
        check(await ev("g.monsters") == 8 and not await tap('shopBuy', 'fuel'), f'Goblin Fuel up to the drawer\'s 8 ({cans} -> {await ev("g.monsters")}), then full')
        nxt = await ev("n.dog.next"); await tap('shopBuy', 'chew')
        check(await ev("n.dog.next") >= nxt + 119, 'the chew: his next visit 2 min later')
        check(not await tap('shopBuy', 'phone'), 'the new phone: soon')
        await shot('4_bought')
        check(await tap('phApp', 'home'), 'Back to the home screen')
        await go('closeGame'); await pg.wait_for_timeout(300); await ev("n.preMenu=null; n.phApp='home'; 0"); await pg.wait_for_timeout(300)
        # the fridge: a cold can on the desk, the break starts at it
        await ev("g.timeScale=1; 0"); await pg.keyboard.press('g'); await pg.wait_for_timeout(600)
        check(await ev("n.game && n.game.kind === 'monster' && n.game.stage") == 'open', f'the fridge: the break starts at the can ({await ev("n.game && n.game.stage")})')
        await shot('5_fridge', 200)
        check(not errs, 'errors: ' + ('none' if not errs else errs[0]))
        await b.close()
    pair = {'1_home': '103__interruptions__phone-in-hand__home-screen', '2_for_you': '111__interruptions__phone-in-hand__shop-for-you', '3_for_her': '112__interruptions__phone-in-hand__shop-for-her'}
    rows = [(n, Image.open(pth).convert('RGB')) for n, pth in shots]
    sheet = Image.new('RGB', (1280 * 2 + 8, len(rows) * 728), (20, 16, 26))
    for i, (n, im) in enumerate(rows):
        sheet.paste(im, (0, i * 728))
        if n in pair: sheet.paste(Image.open(f'design/redesign/stills/{pair[n]}.png').convert('RGB').resize((1280, 720), Image.NEAREST), (1288, i * 728))
    sheet.save('test/shots/shop_sheet.png'); print('sheet', sheet.size, [n for n, _ in rows])
    print('PASS' if not fails else f'FAILED {len(fails)}')
asyncio.run(main())
