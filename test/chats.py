# The chats (#138 to #140), with the real mouse: the game chat is its own layer in the column under the monitor (the
# whole column on Monday, under the YOU card from Tuesday), every line at full brightness, newest at the bottom; it
# scrolls back by drag and by wheel and comes back with its chip; the phone's chats scroll the same way; what she says
# shows as a speech bubble from behind the door. Screens test/shots/chats_*.png and a sheet test/shots/chats_sheet.png.
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
QUIET = "g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel','her_show'); n.phoneScript=[]; n.friendsLeft=0; n.dog.next=1e9; n.visit.nextAt=1e9; n.apt.t=999; n.apt.lastVisitEnd=1e9; 0"
shots, fails = [], []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        ev = lambda js: pg.evaluate(EV, js)
        async def shot(name, clip=None, wait=300):
            await pg.wait_for_timeout(wait); path = f'test/shots/chats_{name}.png'; await pg.screenshot(path=path, clip=clip); shots.append((name, path))
        async def box(i): return await pg.evaluate(f"()=>{{const r=document.getElementById('{i}').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]}}")
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(900)
        await ev("L.launch.skip(); 0"); await pg.wait_for_timeout(400)
        await ev("g.howto=false; " + QUIET); await pg.wait_for_timeout(300)

        # Monday: the whole column, from under the monitor to the bottom
        fb = await box('feedArea')
        check(abs(fb[0] - (296 + 338 * 2)) < 2 and abs(fb[1] - 267 * 2) < 2 and abs(fb[2] - 151 * 2) < 2 and abs(fb[3] - 90 * 2) < 2, f'Monday: the feed is the whole column {fb}')
        z = await pg.evaluate("()=>[getComputedStyle(document.getElementById('feedArea')).zIndex, getComputedStyle(document.getElementById('dogOv')).zIndex]")
        check(int(z[0]) > int(z[1]), f'its own layer, over the desk and the dog\'s overlay {z}')
        await ev("for (let k = 0; k < 30; k++) n.log.push({ text: 'Floor ' + k + ' cleared: +' + (k * 7) + ' gold, +' + k + ' Souls.', color: '#f2b84b', time: '20:' + String(10 + k).padStart(2, '0'), tag: 'GAME' }); 0")
        await pg.wait_for_timeout(300)
        crop = {'x': 900, 'y': 500, 'width': 380, 'height': 220}
        await shot('1_monday', crop)
        # full brightness on the bottom rows (no fade): the bottom third has text as bright as the top third
        im = Image.open('test/shots/chats_1_monday.png').convert('L'); W, H = im.size
        def bright(y0, y1): return sum(1 for y in range(y0, y1) for x in range(W // 2, W) if im.getpixel((x, y)) > 200)
        check(bright(int(H * 0.75), H - 6) > 0.5 * bright(int(H * 0.2), int(H * 0.45)), 'the bottom lines as bright as the top ones')
        # the wheel: back a line at a time
        await pg.mouse.move(fb[0] + fb[2] / 2, fb[1] + fb[3] / 2)
        await pg.mouse.wheel(0, -100); await pg.wait_for_timeout(150); o1 = await ev("L.feedScroll.off")
        await pg.mouse.wheel(0, -100); await pg.wait_for_timeout(150); o2 = await ev("L.feedScroll.off")
        check(0 < o1 < o2, f'the wheel scrolls back, a line at a time ({o1}, {o2})')
        await pg.mouse.wheel(0, 100); await pg.mouse.wheel(0, 100); await pg.wait_for_timeout(150)
        check(await ev("L.feedScroll.off") == 0, 'and forward to the newest')
        # drag: grab and pull down to read back; it settles on a line's edge
        await pg.mouse.move(fb[0] + 150, fb[1] + 40); await pg.mouse.down()
        for k in range(1, 9): await pg.mouse.move(fb[0] + 150, fb[1] + 40 + k * 10); await pg.wait_for_timeout(30)
        mid = await ev("L.feedScroll.off"); await shot('2_dragging', crop, 50)
        await pg.mouse.up(); await pg.wait_for_timeout(200)
        off = await ev("L.feedScroll.off")
        check(mid > 25 and off > 0, f'dragging down reads back ({mid:.1f} px while held, {off} at rest)')
        await shot('3_back', crop)
        # a new line while reading back doesn't move it; the chip goes back to the newest
        await ev("n.log.push({ text: 'Floor 31 cleared.', color: '#f2b84b', time: '20:41', tag: 'GAME' }); 0"); await pg.wait_for_timeout(300)
        check(await ev("L.feedScroll.off") > off, 'a new line while you read back: your place is kept')
        await pg.mouse.click(fb[0] + fb[2] - 28, fb[1] + fb[3] - 16); await pg.wait_for_timeout(250)
        check(await ev("L.feedScroll.off") == 0, 'the chip: back to the newest')

        # what she says: from behind the door
        await ev("n.say = [{ text: 'Fine. Enjoy your elves.', t: 30, max: 30 }]; 0"); await pg.wait_for_timeout(500)
        await shot('4_door', {'x': 0, 'y': 0, 'width': 296, 'height': 420})
        im = Image.open('test/shots/chats_4_door.png').convert('RGB')
        cream = sum(1 for y in range(40, 120) for x in range(40, 240) if sum(im.getpixel((x, y))) > 600)
        check(cream > 1500, f'her line: a white speech bubble over the door ({cream} px)')
        await ev("n.say = [{ text: 'What are you doing?!', t: 30, max: 30 }]; 0"); await pg.wait_for_timeout(500)
        await shot('5_door_shout', {'x': 0, 'y': 0, 'width': 296, 'height': 420})
        await ev("n.say = []; 0")

        # the phone: The Boys' chat scrolls the same way
        await ev("g.boysThread = Array.from({ length: 24 }, (_, k) => ({ s: 'l', text: (k % 3 ? 'Mike: ' : 'Billy: ') + 'line ' + k + ' of the raid talk', time: '20:00' })); 0")
        await pg.evaluate(GO, 'openPhone'); await pg.wait_for_timeout(600)
        await ev("n.phApp = 'boys'; 0"); await pg.wait_for_timeout(500)
        ph = await box('phHand')
        await pg.mouse.move(ph[0] + ph[2] / 2, ph[1] + 260)
        await pg.mouse.wheel(0, -100); await pg.wait_for_timeout(200)
        p1 = await ev("L.phScroll.off")
        await pg.mouse.down()
        for k in range(1, 7): await pg.mouse.move(ph[0] + ph[2] / 2, ph[1] + 260 + k * 12); await pg.wait_for_timeout(40)
        await pg.mouse.up(); await pg.wait_for_timeout(250)
        p2 = await ev("L.phScroll.off")
        check(0 < p1 < p2, f"the phone: the wheel, then a drag, read back The Boys' chat ({p1}, {p2})")
        await shot('6_phone', {'x': 296, 'y': 200, 'width': 320, 'height': 520})
        check(not errs, 'errors: ' + ('none' if not errs else errs[0]))

        # Tuesday: the YOU card above, the feed under it (the same column)
        pg2 = await b.new_page(viewport={'width': 1280, 'height': 720})
        await pg2.add_init_script('window.__lnDay = 1'); await pg2.goto('file:///home/claude/loot-night/dist/index.html'); await pg2.wait_for_timeout(500)
        await pg2.evaluate(GO, 'newGame'); await pg2.wait_for_timeout(900)
        await pg2.evaluate(EV, "L.launch.skip(); 0"); await pg2.wait_for_timeout(400); await pg2.evaluate(EV, "g.howto=false; " + QUIET); await pg2.wait_for_timeout(400)
        fb2 = await pg2.evaluate("()=>{const r=document.getElementById('feedArea').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]}")
        check(await pg2.evaluate(EV, "g.day") == 1 and abs(fb2[1] - 296 * 2) < 2 and abs(fb2[3] - 61 * 2) < 2 and abs(fb2[0] - fb[0]) < 2, f'Tuesday: under the YOU card, the same column {fb2}')
        path = 'test/shots/chats_7_tuesday.png'; await pg2.screenshot(path=path, clip=crop); shots.append(('7_tuesday', path))
        await b.close()
    print('PASS' if not fails else f'FAILED {len(fails)}')
    ims = [Image.open(pth).convert('RGB') for _, pth in shots]
    w = max(i.width for i in ims); h = sum(i.height for i in ims) + 6 * len(ims)
    sheet = Image.new('RGB', (w, h), (20, 20, 28)); y = 0
    for i in ims: sheet.paste(i, (0, y)); y += i.height + 6
    sheet.save('test/shots/chats_sheet.png')
asyncio.run(main())
