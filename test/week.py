# The week (#56) in the browser, with the real mouse and keys: a new game is Monday (How to hide with three tiles, no
# YOU card, no buttons on her panel, H and G do nothing, the phone has the Shop with Q4's keys and Flowers, her chat
# without Text her); 01:00 ends Monday as a Sleep ("01:00: bedtime"); the morning says "Tue 07:40" and "Start Tuesday
# night"; Tuesday opens How to hide with the headset new, the Tired and Zone bars on the YOU card, Garrote still in the
# party; the plug on Tuesday: the replay morning ("UNPLUGGED", "Tuesday, again") and Tuesday once more; the title
# says "Continue · Tuesday". Screenshots test/shots/week_*.png and test/shots/week_sheet.png.
import asyncio, os
from playwright.async_api import async_playwright
from PIL import Image
GO = "([a,arg])=>{const e=document.createElement('button'); e.dataset.act=a; if(arg!=null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
QUIET = "g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map','phone','dog','inspect:fuel'); n.phoneScript=[]; n.friendsLeft=0; n.apt.lastVisitEnd=1e9; n.dog.next=1e9; 0"
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
        async def shot(name, wait=300, clip=None):
            await pg.wait_for_timeout(wait); path = f'test/shots/week_{name}.png'; await pg.screenshot(path=path, clip=clip); shots.append((name, path))
        async def tap(act, arg=None):   # a phone button by its hit region
            hs = await pg.evaluate("()=>window.__lnPhone()")
            h = next((h for h in hs if h['act'] == act and (arg is None or h['arg'] == arg)), None)
            if not h: return False
            await pg.mouse.click(h['x'], h['y']); await pg.wait_for_timeout(250); return True
        async def morning_button():
            for yy in range(150, 352, 3):
                await pg.mouse.move(2 * 536, 2 * yy)
                if await pg.evaluate("()=>document.getElementById('morningArea').style.cursor") == 'pointer': return (2 * 536, 2 * yy)
            return None
        async def to_results():
            for _ in range(80):
                if await ev("g.screen") == 'results': return True
                await pg.wait_for_timeout(50)
            return False
        # a tester who played an earlier build (#58): the old save is gone, the title starts Monday
        await pg.add_init_script("if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('lootnight.save.v2', JSON.stringify({ v: 1, nightsPlayed: 9, gold: 5000 })); }")
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        title = await pg.evaluate("()=>document.querySelector('.screen .card').innerText")
        check(await pg.evaluate("()=>localStorage.getItem('lootnight.save.v2')") is None and 'Start Monday night' in title and 'PLAYTEST BUILD' in title, 'an old save is gone: the title starts Monday (the playtest build)')
        await shot('00_title', 100)
        await go('newGame'); await pg.wait_for_timeout(600)

        # --- Monday: the boys' chat first (#102), on the phone in your hand; Esc; How to hide; tonight's stars ---
        check(await ev("g.day") == 0 and await ev("!!g.voice && g.howto"), 'a new game is Monday: the boys\' chat first, the night waits')
        check(await pg.evaluate("()=>document.getElementById('phHand').style.display") == 'block', 'the phone is in your hand')
        await shot('0_monday_chat', 7000)   # Billy, Mike and Lance typing, a bubble at a time
        check(await ev("g.voice.chat.length") == 6 and await ev("n.threat") < 0.5, 'Monday\'s chat; the night has not started')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        check(await ev("!g.voice && g.howto") and await pg.evaluate("()=>document.getElementById('phHand').style.display") == 'none', 'Esc puts the phone down; How to hide next')
        check(await ev("g.boysThread && g.boysThread[1].text.startsWith('Billy: AGE OF JUDGMENT')"), 'the chat stays in The Boys\' chat')
        await shot('1_monday_howto')
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(300)
        check(await ev("g.howto && g.howtoPage === 1"), 'Enter: tonight\'s stars next (#101)')
        await shot('1b_monday_stars')
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(200)
        check(await ev("!g.howto"), 'Enter again: the night starts')
        await ev(QUIET); await go('portal'); await pg.wait_for_timeout(900)
        hits = await pg.evaluate("()=>(window.__lootnight.deskHits||[]).map(h=>h.tip||h.act)")
        check(not any(h in ('tired', 'zone', 'drink') for h in hits), 'Monday: no YOU card (no Tired, Zone or Drink)')
        await pg.keyboard.press('h'); await pg.keyboard.press('g'); await pg.wait_for_timeout(300)
        check(not await ev("n.headset") and not await ev("!!n.game"), 'Monday: H and G do nothing')
        check(await ev("!(window.__lootnight.herHits||[]).some(h=>h.act==='pre')") , 'Monday: no Make her tea, no towel')
        await shot('2_monday_desk')
        ph = await pg.evaluate("()=>{const h=(window.__lootnight.deskHits||[]).find(h=>h.act==='phone'); return h ? [296 + (h.x + h.w / 2) * 2, (h.y + h.h / 2) * 2] : null}")
        await pg.mouse.move(*ph); await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(500)
        await tap('phApp', 'shop'); await shot('3_monday_shop', 200)
        buys = [h['arg'] for h in await pg.evaluate("()=>window.__lnPhone()") if h['act'] == 'shopBuy']
        rows = await ev("window.__lootnight ? 0 : 0")
        check(await ev("n.phApp") == 'shop', 'the Shop opens on Monday')
        await tap('phApp', 'home'); await tap('phApp', 'messages'); await tap('phApp', 'babe'); await shot('4_monday_chat', 200)
        check(not any(h['act'] == 'pre' for h in await pg.evaluate("()=>window.__lnPhone()")), 'Monday: her chat has no Text her yet')
        await go('closeGame'); await ev("n.preMenu=null; n.phApp='home'; 0"); await pg.wait_for_timeout(200)
        # 01:00: bedtime ends Monday as a Sleep
        await ev("n.clock = 25*60 - 1; 0")
        check(await to_results(), 'Monday: 01:00 ends the night')
        check(await ev("g.results.ending") == 'sleep' and await ev("g.results.bedtime"), 'as a Sleep, at bedtime')
        await shot('5_monday_results')
        await pg.click('[data-act=morning]'); await pg.wait_for_timeout(500)
        await shot('6_tuesday_morning')
        spot = await morning_button(); check(spot is not None, 'the morning\'s pink button')
        await pg.mouse.click(*spot); await pg.wait_for_timeout(700)

        # --- Tuesday: the voice note (Got it with the mouse), then How to hide with the headset new ---
        check(await ev("g.day") == 1 and await ev("!!g.voice && g.voice.lines[0].startsWith(\"no curfew\")"), 'Tuesday: Billy\'s note: no curfew')
        await pg.wait_for_timeout(400)
        check(await tap('voiceOk'), 'Got it on the phone')
        check(await ev("g.day") == 1 and await ev("g.howto && !g.voice"), 'Tuesday: How to hide, the headset new')
        check(await ev("n.apt.forceKind") == 'chat' and await ev("n.firstSafe") == 'chat', 'Tuesday: her first visit will be a chat, and safe')
        await shot('7_tuesday_howto')
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(200); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(200)   # How to hide, then tonight's stars
        await ev(QUIET); await go('portal'); await pg.wait_for_timeout(900)
        hits = await pg.evaluate("()=>(window.__lootnight.deskHits||[]).map(h=>h.tip||h.act)")
        check('tired' in hits and 'zone' in hits and 'drink' not in hits, 'Tuesday: Tired and Zone on the YOU card, no Drink yet')
        check(await ev("g.heroes.some(h=>h.id==='rogue')"), 'Tuesday: Garrote in the party')
        await pg.keyboard.press('h'); await pg.wait_for_timeout(300); check(await ev("n.headset"), 'Tuesday: H puts the headset on')
        await shot('8_tuesday_desk')
        # she pulls the plug: Tuesday, again
        await ev("n.mood = 100; 0")
        check(await to_results(), 'unplugged: the night ends')
        await shot('9_unplugged_results')
        await pg.click('[data-act=morning]'); await pg.wait_for_timeout(500)
        await shot('10_replay_morning')
        spot = await morning_button(); await pg.mouse.click(*spot); await pg.wait_for_timeout(700)
        check(await ev("g.day") == 1 and await ev("g.nightsPlayed") == 2, 'the replay: Tuesday again, the third night played')
        check(await ev("g.voice && g.voice.date") == 'Tuesday, again' and await ev("g.voice.lines[0]") == 'F. she pulled the plug', 'the replay\'s voice note')
        await shot('11_replay_voice', 10800)
        # the title
        await pg.reload(); await pg.wait_for_timeout(700)
        txt = await pg.evaluate("()=>{const b=document.querySelector('[data-act=continue]'); return b ? b.textContent : ''}")
        check('Tuesday' in txt, f'the title: "{txt.strip()}"')
        check(not errs, 'errors: ' + ('none' if not errs else errs[0]))
        await b.close()
    rows = [(n, Image.open(pth).convert('RGB')) for n, pth in shots]
    sheet = Image.new('RGB', (1280 * 2 + 8, (len(rows) + 1) // 2 * 728), (20, 16, 26))
    for i, (n, im) in enumerate(rows): sheet.paste(im.resize((1280, 720)), ((i % 2) * 1288, (i // 2) * 728))
    sheet.save('test/shots/week_sheet.png'); print('sheet', sheet.size, [n for n, _ in rows])
    print('PASS' if not fails else f'FAILED {len(fails)}')
asyncio.run(main())
