# The RPG's sounds (#155): every action that should have its own sound plays its own cue, in a real fight, read off
# the cues the audio started (window.__lootnight.audio.soundLog). The blows, each skill and ultimate, the enemies' blows,
# every kind's fall (the bosses and the Abbot their own), the big moves' wind-ups and blows (cut where they land, or by
# Bash), an enrage, loot from the floor to the bag, the portal, the wipe. Run after `npm run build`.
import asyncio
from playwright.async_api import async_playwright

GO = "a=>{const [act, arg] = a.split('|'); const e=document.createElement('button'); e.dataset.act=act; if (arg != null) e.dataset.arg=arg; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
fails = []


def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok:
        fails.append(what)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        ev = lambda js: pg.evaluate(EV, js)
        log = lambda clear=True: pg.evaluate("c=>window.__lootnight.audio.soundLog(c)", clear)
        await pg.add_init_script('window.__lnDay = 4')
        await pg.goto('file:///home/claude/loot-night/dist/index.html')
        await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        for _ in range(100):
            st = await pg.evaluate("()=>window.__lootnight.audio.soundStatus()")
            if st['loaded'] + st['failed'] >= st['files']:
                break
            await pg.wait_for_timeout(100)
        check(st['failed'] == 0 and st['loaded'] == st['files'], f"the bank loaded: {st}")
        await ev("g.realLifeOff=true; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map');"
                 "g.trees = {knight:['s2','ult'], rogue:['s2','ult'], mage:['s2','ult'], healer:['s2','ult']}; 0")
        await log()
        await pg.evaluate(GO, 'portal'); await pg.wait_for_timeout(400)
        check('rpg_portal' in await log(), 'the portal down: rpg_portal')

        async def until(ok, ms):   # the log, once it has what ok() wants (or the time is up)
            for _ in range(ms // 100):
                h = await log(False)
                if ok(h):
                    break
                await pg.wait_for_timeout(100)
            return await log()

        async def fight():
            for _ in range(600):   # the next fight: past a floor's end (the first path) and a curio (left alone)
                ph = await ev("n.phase === 'battle' && n.enemies.some(e => e.hp > 0) ? 'go' : n.phase")
                if ph == 'go':
                    break
                if ph == 'mapChoice':
                    await pg.evaluate(GO, 'path|0')
                if ph == 'curio':
                    await pg.evaluate(GO, 'curio|leave')
                await pg.wait_for_timeout(100)
            # nobody dies unless the test says so
            await ev("n.enemies.forEach(e => { if (e.hp > 0) { e.hp = e.maxHp = 1e6; } }); n.lastStand = 1e9; 0")

        await fight()
        await log()
        await pg.wait_for_timeout(5000)
        heard = await log()
        check(any(c in heard for c in ('rpg_slash', 'rpg_stab', 'rpg_bolt', 'rpg_smite')), 'the party\'s blows: ' + ', '.join(sorted({c for c in heard if c in ('rpg_slash', 'rpg_stab', 'rpg_bolt', 'rpg_smite')})))
        check(any(c in heard for c in ('rpg_hurt', 'rpg_bite', 'rpg_hex')), 'the enemies\' blows: ' + ', '.join(sorted({c for c in heard if c in ('rpg_hurt', 'rpg_bite', 'rpg_hex')})))
        check('rpg_slash' in heard and 'rpg_stab' in heard, 'the Knight slashes, the Rogue stabs')

        # every skill and ultimate its own
        skills = [('knight', 1, 'rpg_taunt'), ('knight', 2, 'rpg_bash'), ('rogue', 1, 'rpg_backstab'), ('rogue', 2, 'rpg_smoke'),
                  ('mage', 1, 'rpg_fire'), ('mage', 2, 'rpg_frost'), ('healer', 1, 'rpg_mend'), ('healer', 2, 'rpg_ward'),
                  ('knight', 3, 'rpg_laststand'), ('rogue', 3, 'rpg_heist'), ('mage', 3, 'rpg_cataclysm'), ('healer', 3, 'rpg_miracle')]
        for hid, slot, cue in skills:
            await fight()
            i = await ev(f"g.heroes.findIndex(h => h.id === '{hid}')")
            await ev(f"const h = g.heroes[{i}]; h.cd = h.cd.map(() => 0); h.ult = 1; h.moving = 0; h.downed = false; 0")
            await log()
            await pg.evaluate(GO, f'ability|{i},{slot}'); await pg.wait_for_timeout(150)
            heard = await log()
            check(cue in heard, f'{hid} skill {slot}: {cue}' + ('' if cue in heard else f' (heard {heard})'))
        await ev("n.smoke = 0; n.heist = 0; n.ward = 0; n.taunt = 0; 0")

        # the enemies' blows by kind: a bite, a hex
        await fight()
        await ev("n.enemies.forEach(e => { if (e.hp > 0) e.defId = 'bat'; }); 0"); await log()
        heard = await until(lambda h: 'rpg_bite' in h, 8000)
        check('rpg_bite' in heard, 'an Ironwing bites: rpg_bite')

        # every kind falls its own way
        kinds = [('skeleton', None, 'die_hollow'), ('shelter', None, 'die_guardian'), ('collector', None, 'die_revenant'),
                 ('ghoul', None, 'die_penitent'), ('auditor', None, 'die_confessor'), ('junk', None, 'die_cherub'),
                 ('bat', 'ironwing', 'die_ironwing'), ('bat', 'vigil', 'die_vigil'), ('brute', None, 'die_gravedigger'),
                 ('troll', None, 'die_abbot'), ('bailiff', None, 'die_gaoler'), ('shark', None, 'die_bellringer'), ('landlord', None, 'die_inquisitor')]
        for d, look, cue in kinds:
            await fight()
            boss = 'true' if d in ('bailiff', 'shark', 'landlord') else 'false'
            lk = f"e.look = '{look}';" if look else ''
            await log()
            await ev(f"const e = n.enemies.find(e => e.hp > 0); e.defId = '{d}'; {lk} e.boss = {boss}; e.per = 0; e.hp = 0; e.maxHp = 100; 0")
            await pg.wait_for_timeout(250)
            heard = await log()
            check(cue in heard, f'{d}{"/" + look if look else ""} falls: {cue}' + ('' if cue in heard else f' (heard {heard})'))

        # the big moves: the wind-up, then the blow where it lands
        moves = [('bailiff', 1, 'smash', 3.0), ('shark', 2, 'toll', 2.0), ('landlord', 2, 'execute', 3.0), ('ghoul', 1, 'hook', 1.0), ('brute', 1, 'shove', 1.0)]
        for d, acts, mv, sec in moves:
            await fight()
            boss = 'true' if d in ('bailiff', 'shark', 'landlord') else 'false'
            await log()
            await ev(f"n.enemies.filter(e => e.hp > 0).slice(1).forEach(e => {{ e.atb = -1e9; }}); const e = n.enemies.find(e => e.hp > 0); e.defId = '{d}'; e.boss = {boss}; e.acts = {acts}; e.atb = 99.9; e.stunned = 0; e.enter = 0; e.wind = 0; e.braced = false; 0")
            await pg.wait_for_timeout(300)
            heard = await log(False)
            check(f'rpg_wind_{mv}' in heard, f'{d} winds up: rpg_wind_{mv}' + ('' if f'rpg_wind_{mv}' in heard else f' (heard {heard})'))
            await pg.wait_for_timeout(int(sec * 1000) + 400)
            heard = await log()
            check(f'rpg_{mv}' in heard, f'{d} lands it: rpg_{mv}' + ('' if f'rpg_{mv}' in heard else f' (heard {heard})'))
            await ev("n.enemies.forEach(e => { e.atb = 0; }); 0")

        # Bash stops the SMASH
        await fight()
        await ev("n.enemies.filter(e => e.hp > 0).slice(1).forEach(e => { e.atb = -1e9; }); const e = n.enemies.find(e => e.hp > 0); e.defId = 'bailiff'; e.boss = true; e.acts = 1; e.atb = 99.9; e.stunned = 0; e.enter = 0; e.wind = 0; e.braced = false; 0")
        await pg.wait_for_timeout(500)
        k = await ev("g.heroes.findIndex(h => h.id === 'knight')")
        await ev(f"const h = g.heroes[{k}]; h.cd = h.cd.map(() => 0); h.downed = false; h.moving = 0; 0")
        await log()
        await pg.evaluate(GO, f'ability|{k},2'); await pg.wait_for_timeout(200)
        heard = await log()
        check('rpg_interrupt' in heard, 'Bash interrupts SMASH: rpg_interrupt')
        check(await ev("n.enemies.some(e => e.braced)"), '...and the boss braces')
        await ev("n.enemies.forEach(e => { e.atb = 0; e.braced = false; }); 0")

        # an enrage: the boss below the line takes a blow
        await fight()
        await ev("const e = n.enemies.find(e => e.hp > 0); e.defId = 'shark'; e.boss = true; e.enraged = false; e.maxHp = 1e6; e.hp = 2e5; 0")
        await log()
        heard = await until(lambda h: 'enrage' in h, 8000)
        check('enrage' in heard, 'a boss ENRAGED: enrage')

        # loot: Heist makes every kill drop; it clinks on the stone, the looter picks it up, the bag takes it
        await fight()
        await log()
        await ev("n.heist = 30; n.enemies.forEach(e => { e.hp = 0; e.maxHp = 100; e.boss = false; e.defId = 'skeleton'; }); n.reserve = []; 0")
        await pg.wait_for_timeout(600)
        heard = await log(False)
        check('rpg_floordrop' in heard, 'drops land on the stone: rpg_floordrop')
        for _ in range(60):
            heard = await log(False)
            if 'rpg_pickup' in heard and any(c in heard for c in ('rpg_loot', 'legendary', 'bagfull')):
                break
            await pg.wait_for_timeout(150)
        heard = await log()
        check('rpg_pickup' in heard, 'the looter picks it up: rpg_pickup')
        check(any(c in heard for c in ('rpg_loot', 'legendary', 'bagfull')), 'the bag takes it: ' + ', '.join(c for c in heard if c in ('rpg_loot', 'legendary', 'bagfull')))
        await ev("n.heist = 0; 0")

        # the wipe: the dirge, and the desk slam on its last chord
        await fight()
        await ev("n.enemies.filter(e => e.hp > 0).slice(1).forEach(e => { e.atb = -1e9; }); const e = n.enemies.find(e => e.hp > 0); e.defId = 'bailiff'; e.boss = true; e.acts = 1; e.atb = 99.9; e.stunned = 0; e.enter = 0; e.wind = 0; e.braced = false; 0")
        await pg.wait_for_timeout(400)
        await log()
        await ev("n.lastStand = 0; g.heroes.forEach(h => { h.hp = 0; h.downed = true; }); 0")
        await pg.wait_for_timeout(300)
        heard = await log()
        check('wipe' in heard and 'slam' in heard, 'PARTY WIPE: the dirge, then the desk slam (real life)')
        check(await ev("n.location") == 'town', '...and the party wakes in town')
        await pg.evaluate(GO, 'townTab|tree'); await pg.wait_for_timeout(100)
        check('rpg_ui' in await log(), 'the town\'s tabs: rpg_ui')

        check(not errs, 'no page errors ' + str(errs[:2]))
        await b.close()
    print(f'{len(fails)} failed' if fails else 'all passed')

asyncio.run(main())
