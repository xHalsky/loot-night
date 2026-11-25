# The phone in your hand (V8, #73; grid doc 7f) and the phone retune (#54, 3.2): every screen of the renderer's
# phone, driven through the game: a call ringing (Speaker, slide, Decline), the lock screen, the boss's sums, her text
# in her chat, Mom's beat, the courier and the boys (on speaker), the home screen, Messages, her chat kept across
# nights, The Boys' chat, a message typing itself; and the desk's call with Decline and Speaker. Real clicks on the
# canvas check the hit regions. Writes test/shots/phone_*.png and a contact sheet test/shots/phone_sheet.png.
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image

GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
CLIP = {'x': 300, 'y': 200, 'width': 300, 'height': 520}
shots = []

async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append((e.stack or str(e))[:500]))
        go = lambda a, arg=None: pg.evaluate(GO, [a, arg])
        ev = lambda js: pg.evaluate(EV, js)
        async def shot(name, wait=500):
            await pg.wait_for_timeout(wait); path = f'test/shots/phone_{name}.png'; await pg.screenshot(path=path, clip=CLIP); shots.append((name, path))
        async def tap(act, arg=None):   # a real click on the hit region with this act (and arg)
            r = await pg.evaluate("""([act,arg])=>{const c=document.getElementById('phHand'), r=c.getBoundingClientRect(); return {r:[r.x,r.y,r.width/c.width], ok:true}}""", [act, arg])
            return r
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await go('newGame'); await pg.wait_for_timeout(200); await go('howtoClose')
        await ev("g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog'); n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.apt.lastVisitEnd=1e9; n.visit.nextAt=1e9; 0")
        # her chat across nights (the thread is kept for good)
        await ev("g.herThread=[{s:'l',text:'dinner was nice ♥',night:-1,clock:1300},{s:'r',text:'it was ♥',night:-1,clock:1302},{s:'l',text:'going to bed',night:0,clock:1385},{s:'l',text:'dont stay up too late',night:0,clock:1386}]; g.nightsPlayed=1; g.herSeen=2; 0")
        await go('dbgMom'); await pg.wait_for_timeout(200)
        await shot('desk_call', 300)
        dp = await pg.evaluate("()=>{const r=document.getElementById('deskPhone').getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height*0.35]}")   # the phone on the desk (V3): a real click
        await pg.mouse.click(*dp)
        await shot('ring', 700)
        # slide to answer, with the mouse
        c = await pg.evaluate("()=>{const c=document.getElementById('phHand'), r=c.getBoundingClientRect(); return [r.x,r.y,r.width/c.width]}")
        at = lambda x, y: (c[0] + (x + 7) * c[2], c[1] + (y + 6) * c[2])   # screen px -> page (the screen starts at 7, 6 in the canvas)
        x0, y0 = at(19, 183)
        await pg.mouse.move(x0, y0); await pg.mouse.down(); await pg.mouse.move(x0 + 80, y0, steps=5); await pg.mouse.move(x0 + 160, y0, steps=5); await pg.mouse.up()
        st = await ev("n.game&&n.game.stage")
        assert st == 'call', f'slide to answer: {st}'
        await ev("n.game.read=0; n.game.sweep=n.game.zone+0.1; 0"); await shot('mom', 200)
        await go('closeGame'); await pg.wait_for_timeout(200)
        await ev("n.interrupts=[]; n.game=null; n.action='none'; 0")
        await go('dbgCall', 'courier'); await ev("n.game=null; 0")
        await ev("const L2=window.__lootnight; 0")
        await go('openPhone'); await go('speaker'); await shot('courier_speaker', 400)
        await go('closeGame'); await ev("n.interrupts=[]; n.game=null; n.action='none'; n.headset=false; 0")
        await go('dbgCall', 'friends'); await go('speaker'); await shot('boys_speaker', 600)
        hands = await ev("n.action")
        await go('closeGame'); await ev("n.interrupts=[]; n.game=null; n.action='none'; n.noise=0; 0")
        await go('dbgBoss'); await pg.wait_for_timeout(1800); await go('openPhone'); await shot('lock', 300)
        # Face ID: hold with the mouse
        fx, fy = at(56, 196)
        await pg.mouse.move(fx, fy); await pg.mouse.down(); await pg.wait_for_timeout(1500); await pg.mouse.up()
        st = await ev("n.game&&n.game.stage"); assert st == 'chat', f'Face ID: {st}'
        await shot('boss', 200)
        r0 = await ev("[n.game.rows[0].a+n.game.rows[0].b, n.game.rows[0].options.indexOf(n.game.rows[0].a+n.game.rows[0].b)]")
        zl0 = await ev("g.zl")
        bx, by = at(8 + r0[1] * 33 + 15, 187)
        await pg.mouse.click(bx, by); await pg.wait_for_timeout(300)
        zl1 = await ev("g.zl"); assert zl1 == zl0 + 50, f'boss paid {zl1 - zl0}'
        await ev("n.interrupts=[]; n.game=null; n.action='none'; 0")
        await ev("const it={kind:'text',t:60,max:60,msgs:['are you coming to bed?','babe'],pend:[],pingAt:0}; n.interrupts.push(it); 0")
        await go('openPhone'); await ev("n.game.stage='chat'; n.game.t=8; n.game.max=8; 0"); await shot('her', 300)
        await go('textReply'); await pg.wait_for_timeout(200)
        # the idle phone: home, Messages, her chat, The Boys
        await ev("n.interrupts=[]; n.game=null; n.action='none'; 0")
        await go('openPhone'); await shot('home', 600)
        mx, my = at(22, 86); await pg.mouse.click(mx, my); await shot('messages', 300)
        app = await ev("n.phApp"); assert app == 'messages', app
        cx_, cy_ = at(56, 58); await pg.mouse.click(cx_, cy_); await shot('babe', 300)
        app = await ev("n.phApp"); assert app == 'babe', app
        await pg.mouse.move(*at(56, 120)); await pg.mouse.wheel(0, -100); await pg.mouse.wheel(0, -100); await shot('babe_scrolled', 300)
        await go('phApp', 'boys'); await shot('boys', 300)
        await go('phApp', 'babe'); await go('pre', 'text'); await pg.wait_for_timeout(1200); await shot('texting', 0)
        print('hands on speaker:', hands, 'her thread:', await ev("g.herThread.length"), 'errors:', errs or 'none')
        await b.close()
    ims = [Image.open(p_) for _, p_ in shots]
    w, h = ims[0].size; cols = 5; rows = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * (w + 6), rows * (h + 6)), (20, 14, 24))
    for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * (w + 6), (i // cols) * (h + 6)))
    sheet.save('test/shots/phone_sheet.png'); print('sheet:', sheet.size, [n for n, _ in shots])
asyncio.run(main())
