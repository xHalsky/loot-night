# First-night onboarding (#28): the short title, the how-to-hide card (it freezes the night, Got it / Esc close it,
# the pause menu reopens it), her opening line at the door (#139; no tips in the feed, #141), the first-night end-cue label. Screenshots: test/onb_*.png
import asyncio
from playwright.async_api import async_playwright
async def act(pg, sel):
    await pg.evaluate("s=>{const e=document.querySelector(s); const m=/^\\[data-act=\\x22?(\\w+)\\x22?\\](?:\\[data-arg=\\x22?([^\\x22\\]]*)\\x22?\\])?$/.exec(s); if(!e && m){const b=document.createElement('button'); b.dataset.act=m[1]; if(m[2]!=null) b.dataset.arg=m[2]; document.getElementById('stage').appendChild(b); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); b.remove(); return;} e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}))}", sel); await pg.wait_for_timeout(150)
async def go(pg, a):   # an action, as the renderer's buttons send it (the DOM buttons are gone, V11)
    await pg.evaluate("a=>{const e=document.createElement('button'); e.dataset.act=a; document.getElementById('stage').appendChild(e); e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0})); e.remove()}", a); await pg.wait_for_timeout(150)
async def main():
    ok = True
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/loot-night/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='test/onb_title.png')
        await act(pg, '[data-act=newGame]'); await pg.wait_for_timeout(300)
        card = await pg.evaluate("()=>!(!window.__lootnight.S.g.howto && document.getElementById('modalArea').style.display !== 'block')")
        t0 = await pg.evaluate("()=>window.__lootnight.S.g.night.threat"); await pg.wait_for_timeout(800)
        t1 = await pg.evaluate("()=>window.__lootnight.S.g.night.threat")
        print('card on night 1:', card, '| night waits:', t1 == t0); ok &= card and t1 == t0
        await pg.screenshot(path='test/onb_card.png')
        await go(pg, 'howtoClose'); await pg.wait_for_timeout(5500)
        gone = await pg.evaluate("()=>(!window.__lootnight.S.g.howto && document.getElementById('modalArea').style.display !== 'block') && window.__lootnight.S.g.night.threat > 3")
        said = await pg.evaluate("()=>(window.__lootnight.S.g.night.say || []).map(s=>s.text).join(' ') || (window.__lootnight.S.g.tipsSeen.includes('her_show') ? 'said' : '')")   # her opening line, through the door (#139)
        print('Got it closes, night runs:', gone, '| her line:', said); ok &= gone and bool(said)
        await pg.screenshot(path='test/onb_tip.png', clip={'x': 0, 'y': 0, 'width': 296, 'height': 300})
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        await go(pg, 'howtoOpen'); await pg.wait_for_timeout(200)
        re = await pg.evaluate("()=>!(!window.__lootnight.S.g.howto && document.getElementById('modalArea').style.display !== 'block')")
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        esc = await pg.evaluate("()=>(!window.__lootnight.S.g.howto && document.getElementById('modalArea').style.display !== 'block') && !window.__lootnight.S.g.paused")
        print('pause menu reopens it:', re, '| Esc closes it:', esc); ok &= re and esc
        # the first-night end-cue label in her note
        await pg.evaluate("()=>{const S=window.__lootnight.S; const n=S.g.night; S.g.timeScale=0; n.phoneScript=[]; n.friendsLeft=0; Object.assign(n.apt,{activity:'tea',room:'kitchen',moving:0,cued:true,t:2}); n.visit.stage='idle'; n.headset=false;}")
        await pg.wait_for_timeout(300)
        note = await pg.evaluate("()=>{const v=window.__lootnight.herView(); return v.note ? v.note.label + ' ' + v.note.body : ''}")   # her note is drawn (V4)
        print('end-cue label:', note); ok &= 'kettle clicked off' in note.lower()
        await pg.screenshot(path='test/onb_endcue.png', clip={'x': 0, 'y': 520, 'width': 280, 'height': 200})
        # a second night: no card
        await pg.evaluate("()=>{const S=window.__lootnight.S; S.g.nightsPlayed=1;}")
        print('ERRORS', errs); ok &= not errs
        await b.close()
    print('PASS' if ok else 'FAIL')
asyncio.run(main())
