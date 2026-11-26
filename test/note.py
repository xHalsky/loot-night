# The Tonight note on the monitor (#98): big enough to read (Tiny5 at 2x on a 134 x 66 note), a click peels it off for
# good (S.g.noteOff, saved), its tooltip goes with it, a feed line says the stars still count. Writes
# test/shots/note.png (the desk with the note, then without it).
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
QUIET = "g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.apt.lastVisitEnd=1e9; n.dog.next=1e9; 0"
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
        await ev(QUIET); await go('portal'); await pg.wait_for_timeout(600); await ev(QUIET)
        hit = await ev("window.__lootnight.deskHits.find(h=>h.tip==='tonight')")
        check(hit and hit['w'] >= 130 and hit['h'] >= 64 and hit['act'] == 'noteOff', f'the note: {hit and (hit["w"], hit["h"])} grid px, a click takes it off')
        CL = {'x': 560, 'y': 440, 'width': 720, 'height': 280}
        await pg.screenshot(path='/tmp/note_a.png', clip=CL)
        cx, cy = 296 + (hit['x'] + hit['w'] / 2) * 2, (hit['y'] + hit['h'] / 2) * 2
        await pg.mouse.move(cx, cy); await pg.wait_for_timeout(300)
        await pg.mouse.click(cx, cy); await pg.wait_for_timeout(300)
        check(await ev("g.noteOff === true"), 'clicked: off for good (saved with the game)')
        check(not await ev("window.__lootnight.deskHits.some(h=>h.tip==='tonight')"), 'no hit region left where it was')
        check(await ev("n.log.some(l=>l.text.startsWith('Note off'))"), 'a feed line: the stars still count')
        await pg.mouse.move(cx + 1, cy + 1); await pg.wait_for_timeout(300)
        await pg.screenshot(path='/tmp/note_b.png', clip=CL)
        a, c = Image.open('/tmp/note_a.png'), Image.open('/tmp/note_b.png')
        o = Image.new('RGB', (720, 566), (20, 14, 24)); o.paste(a, (0, 0)); o.paste(c, (0, 286)); o.save('test/shots/note.png')
        print('errors:', errs or 'none')
        if errs: fails.append('page errors')
        await b.close()
    print(f'{len(fails)} failed' if fails else 'all passed')
asyncio.run(main())
