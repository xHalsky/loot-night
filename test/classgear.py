# Class gear in the bag (#113): with the knight selected, a mage's staff gets a crimson ring under the pointer and when
# picked up; right-click shakes it in its square; dragged onto his weapon slot it shakes in hand and, let go, flies back
# to its square. The knight's own sword and a ring go on; the staff goes on Hudzor by his party card. Writes
# test/shots/classgear_*.png and the icon sheet test/shots/classgear_icons.png.
import asyncio, os
from playwright.async_api import async_playwright
GO = "a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}"
EV = "js=>{const L=window.__lootnight, S=L.S, g=S.g, n=g.night; return eval(js)}"
fails = []
def check(ok, msg): print(('ok   ' if ok else 'FAIL ') + msg); (None if ok else fails.append(msg))
# crimson pixels in the 1 px ring round a bag square (panel px), read off the panel's own canvas
RING = "([x,y])=>{const d=document.getElementById('spArea').getContext('2d').getImageData(x-1,y-1,23,23).data; let n=0; for(let j=0;j<23;j++) for(let i=0;i<23;i++){ if(i>0&&i<22&&j>0&&j<22) continue; const k=(j*23+i)*4; if(d[k]===210&&d[k+1]===60&&d[k+2]===90) n++; } return n}"
# the class glow round a portrait (#121): pixels of its class colour in the 3 px band just outside the 22 x 24 portrait
GLOW = "([x,y,r,g,b])=>{const d=document.getElementById('spArea').getContext('2d').getImageData(x-3,y-3,28,30).data; let n=0; for(let j=0;j<30;j++) for(let i=0;i<28;i++){ if(i>=3&&i<25&&j>=3&&j<27) continue; const k=(j*28+i)*4; if(d[k]===r&&d[k+1]===g&&d[k+2]===b) n++; } return n}"
CELL = "([x,y])=>Array.from(document.getElementById('spArea').getContext('2d').getImageData(x,y,21,21).data).join(',')"
async def main():
    os.makedirs('test/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        ev = lambda js: pg.evaluate(EV, js)
        await pg.add_init_script('window.__lnDay = 4'); await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate(GO, 'newGame'); await pg.wait_for_timeout(200); await pg.evaluate(GO, 'howtoClose')
        await ev("""g.realLifeOff=true; g.tipsSeen.push('coach:loot','coach:steps','coach:door','coach:phone','coach:windup','coach:headset','map');
          const mk=(id,slot,r,name,cls)=>({kind:'item',id,item:{id,name,slot,rarity:r,ilvl:4,affixes:[{stat:'atk',amount:9}],value:40,identified:true,...(cls?{cls}:{})}});
          g.bag.push(mk('st','weapon','rare','Runed Staff','mage'), mk('sw','weapon','epic','Shadow Longsword','knight'), mk('rg','ring','uncommon','Fine Band'),
            mk('i1','helm','rare','Runed Hood','rogue'), mk('i2','armor','rare','Elven Leathers','rogue'), mk('i3','helm','rare','Runed Circlet','mage'), mk('i4','armor','epic','Arcane Robe','mage'),
            mk('i5','weapon','rare','Silver Scepter','healer'), mk('i6','helm','epic','Blessed Mitre','healer'), mk('i7','armor','legendary','Ancient Vestments','healer'), mk('i8','helm','uncommon','Sturdy Greathelm','knight'), mk('i9','armor','rare','Steel Plate','knight'), mk('i10','weapon','rare','Silver Dirk','rogue')); 0""")
        await pg.wait_for_timeout(300)
        sp = await pg.evaluate("()=>{const r=document.getElementById('spArea').getBoundingClientRect(); return [r.left,r.top,r.width/140]}")
        await pg.evaluate(GO, 'portal'); await pg.wait_for_timeout(1500)
        await ev("n.visit.nextAt=1e9; n.dog.next=1e9; n.phoneScript=[]; n.friendsLeft=0; 0")
        ki = await ev("g.heroes.findIndex(h=>h.id==='knight')"); mi = await ev("g.heroes.findIndex(h=>h.id==='mage')")
        await pg.evaluate(GO, 'heroTab'); await ev(f"n.heroTab={ki}; 0"); await pg.wait_for_timeout(200)
        pat = lambda px, py: (sp[0] + px * sp[2], sp[1] + py * sp[2])
        slot_of = lambda id: ev(f"g.bag.findIndex(e=>e.id==='{id}')")
        cell = lambda k: (4 + 2 + (k % 6) * 22, 126 + (k // 6) * 22)
        centre = lambda k: pat(cell(k)[0] + 10, cell(k)[1] + 10)
        k_st = await slot_of('st'); k_sw = await slot_of('sw')
        # the icons: every class's weapon, helm and armor in the bag
        await pg.mouse.move(*pat(70, 5)); await pg.wait_for_timeout(200)
        await pg.screenshot(path='test/shots/classgear_icons.png', clip={'x': sp[0], 'y': sp[1] + 110 * sp[2], 'width': 140 * sp[2], 'height': 80 * sp[2]})
        icons = await ev("window.__lootnight.S.g.bag.length")
        # hover: the staff rings red with the knight selected, his sword doesn't
        await pg.mouse.move(*centre(k_st)); await pg.wait_for_timeout(250)
        r_st = await pg.evaluate(RING, list(cell(k_st)))
        await pg.screenshot(path='test/shots/classgear_hover.png', clip={'x': sp[0], 'y': sp[1] + 110 * sp[2], 'width': 140 * sp[2], 'height': 60 * sp[2]})
        tip = await pg.evaluate("()=>document.getElementById('tooltipLayer').innerText")
        await pg.mouse.move(*centre(k_sw)); await pg.wait_for_timeout(250)
        r_sw = await pg.evaluate(RING, list(cell(k_sw)))
        check(r_st >= 80 and r_sw == 0, f'hover: the staff has a crimson ring ({r_st} px), the knight\'s sword none ({r_sw})')
        check('Mage' in tip and "can't use it" in tip, f'its tip says whose it is: {tip!r}'[:120])
        # the same staff with Hudzor selected: no ring
        await ev(f"n.heroTab={mi}; 0"); await pg.mouse.move(*centre(k_st)); await pg.wait_for_timeout(250)
        check(await pg.evaluate(RING, list(cell(k_st))) == 0, 'with Hudzor selected the staff has no ring')
        await ev(f"n.heroTab={ki}; 0"); await pg.wait_for_timeout(150)
        # right-click: refused, it shakes in its square, then sits still again
        still = await pg.evaluate(CELL, list(cell(k_st)))
        mage_glow = lambda: pg.evaluate(GLOW, [4 + mi * 34 + 5, 12 + 3, 139, 90, 214])
        glow0 = await mage_glow()
        await pg.mouse.click(*centre(k_st), button='right'); frames = []
        for i in range(8): await pg.wait_for_timeout(15); frames.append(await pg.evaluate(CELL, list(cell(k_st))))
        glow1 = await mage_glow()
        await pg.screenshot(path='test/shots/classgear_glow.png', clip={'x': sp[0], 'y': sp[1], 'width': 140 * sp[2], 'height': 60 * sp[2]})
        await pg.screenshot(path='test/shots/classgear_shake.png', clip={'x': sp[0], 'y': sp[1] + 110 * sp[2], 'width': 140 * sp[2], 'height': 60 * sp[2]})
        await pg.wait_for_timeout(500); after = await pg.evaluate(CELL, list(cell(k_st)))
        moved = sum(1 for f in frames if f != still)
        check(await ev("g.bag.some(e=>e.id==='st')") and not await ev("g.heroes[%d].gear.weapon && g.heroes[%d].gear.weapon.id==='st'" % (ki, ki)), 'right-click on the knight: the staff stays in the bag')
        dxs = await ev("[0,0.1,0.3,0.6,0.9,1].map(p=>window.__lnShakeDx(p))")
        check(moved >= 1 and after == still and max(abs(d) for d in dxs) == 1, f'it shakes gently in its square ({moved} of 8 frames moved, hops {dxs}) and settles')
        await pg.wait_for_timeout(900); glow2 = await mage_glow()
        check(glow0 == 0 and glow1 >= 40 and glow2 == 0, f'and Hudzor\'s portrait glows violet, whose staff it is, then fades ({glow0} -> {glow1} -> {glow2} px)')
        # held (#114): the item's slot in his gear lights, gold when he can wear it, crimson when not
        SLOTRING = "([x,y])=>{const d=document.getElementById('spArea').getContext('2d').getImageData(x-1,y-1,23,23).data; const c={gold:0,crimson:0}; for(let j=0;j<23;j++) for(let i=0;i<23;i++){ if(i>0&&i<22&&j>0&&j<22) continue; const k=(j*23+i)*4; if(d[k]===241&&d[k+1]===169&&d[k+2]===52) c.gold++; if(d[k]===210&&d[k+1]===60&&d[k+2]===90) c.crimson++; } return c}"
        WEAPON, RINGSLOT = (4 + 2, 67), (4 + 2 + 22, 67 + 22)
        async def held(k, slot, name):
            await pg.mouse.move(*centre(k)); await pg.mouse.down(); await pg.wait_for_timeout(60)
            early = await pg.evaluate(SLOTRING, list(slot)); await pg.wait_for_timeout(200)
            r = await pg.evaluate(SLOTRING, list(slot)); r['window'] = await pg.evaluate("()=>!!document.querySelector('.sp-pop')"); r['glow'] = await mage_glow()
            await pg.screenshot(path=f'test/shots/classgear_held_{name}.png', clip={'x': sp[0], 'y': sp[1] + 54 * sp[2], 'width': 140 * sp[2], 'height': 120 * sp[2]})
            await pg.mouse.up(); await pg.wait_for_timeout(150); after = await pg.evaluate(SLOTRING, list(slot))
            return early, r, after
        e0, r0, a0 = await held(k_st, WEAPON, 'staff')
        check(e0 == {'gold': 0, 'crimson': 0} and r0['crimson'] >= 80 and r0['gold'] == 0 and a0 == {'gold': 0, 'crimson': 0}, f'held, the staff lights his weapon slot crimson ({e0} at 60 ms, {r0} held, {a0} let go)')
        check(r0['glow'] >= 40 and await mage_glow() == 0, f'held, the staff lights Hudzor\'s portrait too ({r0["glow"]} px), gone when let go')
        e1, r1, a1 = await held(k_sw, WEAPON, 'sword')
        check(r1['gold'] >= 80 and r1['crimson'] == 0 and a1 == {'gold': 0, 'crimson': 0} and r1['glow'] == 0, f'held, his own sword lights it gold, no portrait glows ({r1})')
        k_rg0 = await slot_of('rg'); e2, r2, a2 = await held(k_rg0, RINGSLOT, 'ring')
        check(r2['gold'] >= 80, f'a ring lights his ring slot gold ({r2})')
        await ev("n.selected=null; 0"); await pg.wait_for_timeout(100)
        # an item window open over the gear: picking another item up closes it, so its slot shows
        await ev("n.selected='rg'; 0"); await pg.wait_for_timeout(150)
        e3, r3, a3 = await held(k_sw, WEAPON, 'over_window')
        check(r3['gold'] >= 80 and not r3['window'], f'with an item window open, holding another item closes it and lights its slot ({r3})')
        await ev("n.selected=null; 0"); await pg.wait_for_timeout(100)
        # drag onto his weapon slot: ringed in hand, its square empty, shakes on the slot, flies back when let go
        x, y = centre(k_st); gx, gy = pat(4 + 2 + 10, 67 + 10)
        await pg.mouse.move(x, y); await pg.mouse.down(); await pg.mouse.move(x - 30, y - 30, steps=4); await pg.wait_for_timeout(120)
        g0 = await pg.evaluate("()=>{const c=document.querySelector('#ghost canvas'); const d=c.getContext('2d').getImageData(0,0,1,1).data; return [c.width, d[0], d[1], d[2]]}")
        empty = await pg.evaluate(CELL, list(cell(k_st)))
        check(g0 == [23, 210, 60, 90], f'picked up: the ghost wears the crimson ring ({g0})')
        check(empty != still, 'and its square is empty while it is in hand')
        await pg.mouse.move(gx, gy, steps=8); shakes = []
        for i in range(6): await pg.wait_for_timeout(30); shakes.append(await pg.evaluate("()=>document.getElementById('ghost').style.transform"))
        await pg.screenshot(path='test/shots/classgear_drag.png', clip={'x': sp[0], 'y': sp[1], 'width': 140 * sp[2], 'height': 232 * sp[2]})
        check(any(s.startswith('translateX(') and s != 'translateX(0px)' for s in shakes) and all(s in ('', 'translateX(2px)', 'translateX(-2px)') for s in shakes), f'over his weapon slot it shakes in hand, 1 grid px ({[s for s in shakes if s][:3]})')
        lit = await pg.evaluate(SLOTRING, [6, 67])
        check(lit['crimson'] >= 20, f'and his weapon slot stays crimson while it is in hand ({lit})')
        await pg.mouse.up(); await pg.wait_for_timeout(60)
        fly = await pg.evaluate("()=>{const g=document.getElementById('ghost'); return [g.style.display, g.style.transition]}")
        check(fly[0] == 'block' and 'left' in fly[1], f'let go: it flies back ({fly})')
        await pg.wait_for_timeout(300)
        back = await pg.evaluate("()=>document.getElementById('ghost').style.display")
        check(back == 'none' and await ev("g.bag.some(e=>e.id==='st')") and await ev("!(g.heroes[%d].gear.weapon && g.heroes[%d].gear.weapon.id==='st')" % (ki, ki)), 'and lands back in the bag, not on the knight')
        await pg.wait_for_timeout(400)
        check(await pg.evaluate(CELL, list(cell(k_st))) == still, 'its square shows it again')
        # the knight's sword goes on by drag; the ring by right-click
        k_sw = await slot_of('sw'); x, y = centre(k_sw)
        await pg.mouse.move(x, y); await pg.mouse.down(); await pg.mouse.move(gx, gy, steps=8); await pg.wait_for_timeout(100)
        g1 = await pg.evaluate("()=>{const c=document.querySelector('#ghost canvas'); const d=c.getContext('2d').getImageData(0,0,1,1).data; return d[3]}")
        await pg.mouse.up(); await pg.wait_for_timeout(200)
        check(g1 == 0 and await ev("g.heroes[%d].gear.weapon.id==='sw'" % ki), 'the knight\'s sword: no ring in hand, and it goes on')
        k_rg = await slot_of('rg'); await pg.mouse.click(*centre(k_rg), button='right'); await pg.wait_for_timeout(150)
        check(await ev("g.heroes[%d].gear.ring && g.heroes[%d].gear.ring.id==='rg'" % (ki, ki)), 'a ring goes on him by right-click')
        # the staff onto Hudzor's party card: on he goes, with the knight still selected
        k_st = await slot_of('st'); x, y = centre(k_st); hx, hy = pat(4 + mi * 34 + 16, 12 + 20)
        await pg.mouse.move(x, y); await pg.mouse.down(); await pg.mouse.move(hx, hy, steps=10); await pg.wait_for_timeout(100)
        g2 = await pg.evaluate("()=>{const c=document.querySelector('#ghost canvas'); return c.getContext('2d').getImageData(0,0,1,1).data[3]}")
        await pg.mouse.up(); await pg.wait_for_timeout(200)
        check(g2 == 0 and await ev("g.heroes[%d].gear.weapon.id==='st'" % mi), 'over Hudzor\'s card the ring goes off, and the staff goes on him')
        # the empty weapon slot of each hero shows his class's shape
        await ev(f"g.heroes[{ki}].gear={{}}; n.heroTab={ki}; 0"); await pg.wait_for_timeout(150)
        await pg.screenshot(path='test/shots/classgear_slots_knight.png', clip={'x': sp[0], 'y': sp[1] + 64 * sp[2], 'width': 72 * sp[2], 'height': 48 * sp[2]})
        await ev(f"g.heroes[{mi}].gear={{}}; n.heroTab={mi}; 0"); await pg.wait_for_timeout(150)
        await pg.screenshot(path='test/shots/classgear_slots_mage.png', clip={'x': sp[0], 'y': sp[1] + 64 * sp[2], 'width': 72 * sp[2], 'height': 48 * sp[2]})
        check(not errs, f'no page errors {errs[:1]}'); await b.close()
    if fails: raise SystemExit(f'{len(fails)} failed')
asyncio.run(main())
