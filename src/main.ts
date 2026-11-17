import './style.css';
import './ios.css';
import { T } from './config/tuning';
import { isCall, S, N, initialState } from './core/state';
import { startLoop } from './core/loop';
import { drawMonitor, MON_W, MON_H, goblinPos, XL_BUTTONS, XL_BTN_Y, XL_BTN_H } from './ui/monitor';
import { drawDoor, DOOR_W, DOOR_H } from './ui/door';
import { herHeadHtml, taskbarHtml, hover, tooltipHtml, entryIcon, updateWindowDynamics, doorInfoHtml, deskHtml, windowHtml, uiPanelHtml, screenHtml, pauseHtml, debugHtml, toastsHtml, scareHtml, preBusyHtml, morningScene } from './ui/panels';
import { toggleHeadset } from './systems/apartment';
import { initAudio, sfx, stopAmbience, audition, soundStatus, ambienceNow, loopPoints } from './ui/audio';
import { HOTKEYS } from './data/heroes';
import { queueAbility } from './systems/battle';
import { clickBagSlot, closeSelection, equipOn, dropSelected, useSelected, setHeroTab, equipItemOn, unequip } from './systems/bag';
import { skipDrop, rollBattleDrops, genItem, itemEntry, mapEntry, toggleLock } from './systems/loot';
import { chooseNextFloor, returnToTown, travelToDungeon, catchGoblin } from './systems/dungeon';
import { chooseCurio, endCurio } from './systems/curios';
import { toast } from './core/fx';
import { ACT_BY_ID } from './data/apartment';
import { startPre, cancelPre, episodeAnswer } from './systems/preemptive';
import type { PreId } from './data/preemptive';
import { identify, vendor, salvage, list, buildCity, openTownWin, serviceAction } from './systems/town';
import { monUiHtml } from './ui/town';
import { deskPileHtml } from './ui/monsterArt';
import { altTab, excelInput } from './systems/excel';
import { talkPick, openPhone, momReply, bossPick, closeGame, spawnInterrupt, answerSlide, setPhoneHold, textReply, setDeclineHold, togglePhoneDown, declineCall } from './systems/interrupts';
import { openMonster, setMonsterHold, cancelMonster } from './systems/monster';
import { drawMonsterScene } from './ui/monsterScene';
import { setPeeking } from './systems/peek';
import { drawDeskFx, lapUiHtml, setDeskScale } from './ui/deskFx';
import { drawHerBed, drawShowerPanel } from './ui/her';
import { answer as lapAnswer, startLap } from './systems/lap';
import { triggerDog, triggerUnplug } from './systems/pets';
import { keyboardSvg, mouseSvg } from './ui/peripherals';
import { wakeUp } from './systems/tired';
import { triggerVisitNow, takePlate, chatAnswer, cuddleAnswer, hideCans } from './systems/visits';
import { cuddlePointer, endCuddle } from './systems/cuddle';
import type { VisitKind } from './core/state';
import { startNight, endNight, toMorning } from './systems/night';
import { load, wipeSave } from './systems/save';
import { addMood } from './systems/meters';

(window as unknown as Record<string, unknown>).__lootnight = { S, audio: { soundStatus, ambienceNow, loopPoints } };   // test hook for the Playwright scripts

// ---------- DOM skeleton: three panels (docs/design/screen.md) ----------
const stage = document.getElementById('stage')!;
stage.innerHTML = `
  <div id="door"><canvas id="doorCanvas" width="${DOOR_W}" height="${DOOR_H}"></canvas><div id="herHead"></div><div id="doorInfo"></div><canvas id="showerCanvas" width="176" height="176"></canvas></div>
  <div id="desk">
    <div id="deskInner">
      <div class="desk-surface"></div>
      <div class="stand"></div><div class="stand-base"></div>
      <div class="bezel"></div>
      <canvas id="monitor" width="${MON_W}" height="${MON_H}"></canvas>
      <div id="monUi"></div>
      <div id="winLayer"></div>
      <div id="toasts"></div>
      <div id="taskbar"></div>
      <div class="mat"></div><div class="keyboard">${keyboardSvg()}</div><div class="mouse">${mouseSvg()}</div>
      <div id="deskObjects"></div>
      <div id="canPile"></div>
      <canvas id="deskFx" width="680" height="720"></canvas>
      <div id="lapUi"></div>
      <div id="preUi"></div>
    </div>
  </div>
  <div id="ui"></div>
  <div id="screens"></div>
  <div id="pause"></div>
  <div id="debug"></div>
  <div id="tooltipLayer"></div>
  <div id="ghost"></div>
  <div id="scare"></div>
  <div id="eyelids"><div class="lid top"></div><div class="lid bot"></div><div class="lid-txt">zzz... click or press any key</div></div>`;

const el = (id: string) => document.getElementById(id)!;
const doorCtx = (el('doorCanvas') as HTMLCanvasElement).getContext('2d')!;
const monCanvas = el('monitor') as HTMLCanvasElement;
const monCtx = monCanvas.getContext('2d')!;
const cache = new Map<string, string>();
function setHtml(id: string, html: string) {
  if (cache.get(id) === html) return;
  cache.set(id, html);
  el(id).innerHTML = html;
}

// ---------- Scale the 1280x720 stage to the window ----------
let stageScale = 1;
function fit() {
  const s = stageScale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  setDeskScale(s);
  stage.style.transform = `scale(${s})`;
  const vp = el('viewport');
  vp.style.width = `${1280 * s}px`; vp.style.height = `${720 * s}px`;
}
window.addEventListener('resize', fit); fit();

// ---------- Actions ----------
const actions: Record<string, (arg: string) => void> = {
  newGame: () => { wipeSave(); S.g = initialState(); startNight(); },
  continue: () => { load(); startNight(); },
  startNight: () => startNight(),
  morning: () => toMorning(),
  resume: () => { S.g.paused = false; },
  altTab: () => { if (S.g.night) altTab(); },
  showRpg: () => { if (S.g.night && N().monitor !== 'rpg') altTab(); },
  showExcel: () => { if (S.g.night && N().monitor !== 'excel') altTab(); },
  headset: () => toggleHeadset(),
  ability: a => { const [h, s] = a.split(',').map(Number); queueAbility(h, s); },
  bag: id => clickBagSlot(id),
  closeSel: () => closeSelection(),
  equip: a => equipOn(Number(a)),
  dropSel: () => dropSelected(),
  useSel: () => useSelected(),
  heroTab: a => setHeroTab(Number(a)),
  skipDrop: () => skipDrop(),
  nextFloor: a => chooseNextFloor(a || null),
  curio: a => chooseCurio(a),
  pre: a => startPre(a as PreId),
  preMenu: () => { N().preMenu = null; },
  preCancel: () => cancelPre(),
  episode: a => episodeAnswer(a === '1'),
  curioLeave: () => { toast('The party walks past.', '#a999bd'); endCurio(); },
  toTown: () => returnToTown(),
  gate: () => travelToDungeon(),
  sleep: () => endNight('sleep'),
  identify: () => identify(), vendor: () => vendor(), salvage: () => salvage(), list: () => list(),
  build: a => buildCity(a as 'training'),
  townWin: a => openTownWin((a || null) as 'merchant' | null),
  svc: a => { const [k, id] = a.split(':'); serviceAction(k as 'vendor', id); },
  portal: () => { S.g.townWin = null; travelToDungeon(); },
  openPhone: () => openPhone(),
  openMonster: () => openMonster(),
  cancelMonster: () => cancelMonster(),
  textReply: () => textReply(),
  mom: a => momReply(Number(a)),
  talk: a => talkPick(Number(a)),
  boss: a => bossPick(Number(a)),
  closeGame: () => closeGame(false),
  // Debug (F1)
  dbgSpeed: a => { S.g.timeScale = Number(a); },
  dbgVisit: a => triggerVisitNow((a || undefined) as VisitKind | undefined),
  hideCans: () => { hideCans(); },
  takePlate: () => takePlate(),
  chatAnswer: a => chatAnswer(Number(a)),
  cuddle: a => cuddleAnswer(a === '1'),
  cuddleQuit: () => endCuddle(null),
  dbgMom: () => spawnInterrupt('mom'),
  dbgBoss: () => spawnInterrupt('boss'),
  dbgCall: a => spawnInterrupt(a as 'courier'),
  dbgGoblin: () => { N().goblin = { t: T.GOBLIN_SEC }; sfx.goblin(); },
  dbgSfx: a => audition(a),
  dbgCalm: () => { N().apt.calm += 30; toast(`Debug: her next visit waits (calm ${Math.round(N().apt.calm)} s).`, '#a999bd'); },   // the framework's debug action (#19)
  dbgEpic: () => dbgDrop(itemEntry(genItem(N().floor, 3))),
  dbgLeg: () => dbgDrop(itemEntry(genItem(N().floor, 4))),
  dbgMap: () => N().dropQueue.push(mapEntry('vault')),
  dbgGold: () => { S.g.gold += 1000; S.g.mats += 30; },
  dbgMood: () => addMood(20),
  dbgClock: () => { N().clock += 60; },
  dbgFloor: () => { const n = N(); if (n.location === 'dungeon') { n.phase = 'mapChoice'; n.enemies = []; } },
  lapAns: a => lapAnswer(Number(a)),
  dbgDog: () => triggerDog(),
  dbgUnplug: () => triggerUnplug(),
  dbgLap: () => startLap(),
  autoSalvage: () => { S.g.autoSalvage = !S.g.autoSalvage; sfx.click(); },
  lock: a => toggleLock(a),
  dbgDebt: () => { N().tired = Math.min(100, N().tired + 20); },
};
void rollBattleDrops;
function dbgDrop(e: ReturnType<typeof itemEntry>) { const n = N(); if (n.location === 'dungeon' && n.phase !== 'mapChoice') n.floorLoot.push({ entry: e, x: 330 + n.floorLoot.length * 30, t: 0 }); else n.dropQueue.push(e); }

// ---------- Tactile input: drag (slide, lift, pull) and hold (face unlock, drink) ----------
let drag: { id: string; axis: string; dir: number; dist: number; x0: number; y0: number; t0: number; p: number } | null = null;
function setDrag(p: number) { const g = S.g.night?.game; if (g && g.kind !== 'cuddle') g.drag = p; }
function setHold(on: boolean) { if (!S.g.night) return; setPhoneHold(on); setMonsterHold(on); }

// ---------- Inventory: hover tooltips, drag to equip / unequip, right-click to equip ----------
let inv: { key: string; x0: number; y0: number; moved: boolean } | null = null;
const toStage = (ev: PointerEvent | MouseEvent) => { const r = stage.getBoundingClientRect(); return { x: (ev.clientX - r.left) / stageScale, y: (ev.clientY - r.top) / stageScale }; };
const ghost = () => el('ghost');

document.addEventListener('pointermove', ev => {
  const p = toStage(ev);
  if (inv) {
    if (!inv.moved && Math.hypot(ev.clientX - inv.x0, ev.clientY - inv.y0) > 6) {
      inv.moved = true;
      const [kind, a, b] = inv.key.split(':');
      const entry = kind === 'bag' ? S.g.bag.find(e => e.id === a) : (() => { const it = S.g.heroes[Number(a)]?.gear[b as 'weapon']; return it ? { kind: 'item' as const, id: it.id, item: it } : undefined; })();
      ghost().innerHTML = entry ? entryIcon(entry, 34) : '';
      ghost().style.display = 'block';
    }
    if (inv.moved) { ghost().style.left = `${p.x - 20}px`; ghost().style.top = `${p.y - 20}px`; hover.key = ''; }
  } else {
    const t = (ev.target as HTMLElement).closest('[data-item],[data-tip]') as HTMLElement | null;
    hover.key = t ? (t.dataset.item ?? t.dataset.tip!) : ''; hover.x = p.x; hover.y = p.y;
  }
  if (!drag) return;
  const d = ((drag.axis === 'x' ? ev.clientX - drag.x0 : ev.clientY - drag.y0) * drag.dir) / stageScale / drag.dist;
  drag.p = Math.max(0, Math.min(1, d));
  setDrag(drag.p);
});
document.addEventListener('pointerup', ev => {
  if (inv && S.g.night) {
    const { key, moved } = inv; inv = null;
    ghost().style.display = 'none';
    const [kind, a, b] = key.split(':');
    if (!moved) { if (kind === 'bag') clickBagSlot(a); }
    else {
      const dropEl = (document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)?.closest('[data-drop]') as HTMLElement | null;
      const drop = dropEl?.dataset.drop ?? '';
      const [dk, dv] = drop.split(':');
      if (kind === 'bag' && dk === 'slot') equipItemOn(a, N().heroTab, dv);
      else if (kind === 'bag' && dk === 'hero') equipItemOn(a, Number(dv));
      else if (kind === 'gear' && dk === 'bag') unequip(Number(a), b);
    }
  }
  setHold(false);
  if (!drag) return;
  const { id, p, t0 } = drag; drag = null;
  const ms = performance.now() - t0;
  if (id === 'answer') answerSlide(p);
  void ms;
  setDrag(0);
});
// Desk phone: grab it and swipe left or right to flip it over; a tap (no swipe) answers.
let pswipe: { x0: number; dx: number; moved: boolean } | null = null;
let phoneAngle = 0, downSign = 1;
document.addEventListener('pointerdown', ev => {
  const t = ev.target as HTMLElement;
  if (!S.g.night || S.g.paused) return;
  if (t.closest('[data-decline]')) { ev.preventDefault(); ev.stopImmediatePropagation(); declineCall(); return; }
  if (t.closest('[data-phone]')) { ev.preventDefault(); ev.stopImmediatePropagation(); pswipe = { x0: ev.clientX, dx: 0, moved: false }; sfx.click(); }
}, true);
document.addEventListener('pointermove', ev => {
  const box = document.getElementById('cuddleBox');
  if (box && S.g.night?.game?.kind === 'cuddle') { const r = box.getBoundingClientRect(); cuddlePointer((ev.clientX - r.left) / stageScale, (ev.clientY - r.top - 34 * stageScale) / stageScale); }
  if (!pswipe) return;
  pswipe.dx = (ev.clientX - pswipe.x0) / stageScale;
  if (Math.abs(pswipe.dx) > 6) pswipe.moved = true;
});
document.addEventListener('pointerup', () => {
  if (S.g.night) setDeclineHold(false);   // (a click on the title screen has no night yet)
  if (!pswipe) return;
  const { dx, moved } = pswipe; pswipe = null;
  if (Math.abs(dx) >= 45) { if (!(S.g.night && S.g.night.phoneDown > 0)) downSign = dx > 0 ? 1 : -1; togglePhoneDown(); }
  else if (!moved) openPhone();
});
/** The phone's 3D pose: follows the swipe, then eases to face-up (0) or face-down (180). Vibration shakes it in a
 *  call rhythm (long buzzes) or a message rhythm (short double buzz). All transforms are set here, never by CSS animations. */
function applyPhoneDrag() {
  const n = S.g.night;
  const ph = document.querySelector('.phone3d') as HTMLElement | null;
  if (!n || !ph) return;
  const base = n.phoneDown > 0 ? 180 * downSign : 0;
  let target = base, lift = 0;
  if (pswipe) { target = base + Math.max(-180, Math.min(180, pswipe.dx * 1.6)); lift = 1; }
  phoneAngle += (target - phoneAngle) * (pswipe ? 0.5 : 0.2);
  if (!pswipe && Math.abs(phoneAngle - base) < 0.5) phoneAngle = base;
  let vx = 0, vr = 0;
  const it = n.interrupts[0];
  if (it && !pswipe) {
    const e = it.max - it.t, now = performance.now() / 1000;
    const d = e - it.pingAt;     // each message: one short double buzz, in sync with its banner popping in
    const on = isCall(it.kind) ? e % 1.4 < 0.75 : d < 0.14 || (d > 0.2 && d < 0.34);
    if (on) { vx = Math.sin(now * 90) * 2.2; vr = Math.sin(now * 70) * 1.4; }
  }
  const wrap = ph.parentElement as HTMLElement;
  wrap.style.transform = `rotate(${-7 + vr}deg) translate(${vx}px, ${-lift * 10}px) scale(${1 + lift * 0.06})`;
  wrap.classList.toggle('held', !!pswipe);
  ph.style.transform = `perspective(600px) rotateY(${phoneAngle}deg)`;
}
el('doorCanvas').addEventListener('pointerdown', ev => { if (S.g.night && !S.g.paused) { ev.preventDefault(); setPeeking(true); } });
document.addEventListener('pointerup', () => { if (S.g.night) setPeeking(false); });
document.addEventListener('pointercancel', () => { drag = null; setDrag(0); setHold(false); });

document.addEventListener('pointerdown', ev => {
  initAudio();
  if (S.g.night && !S.g.paused && wakeUp()) { ev.preventDefault(); return; }
  const target = ev.target as HTMLElement;
  const dg = target.closest('[data-drag]') as HTMLElement | null;
  if (dg && S.g.night?.game) {
    ev.preventDefault();
    drag = { id: dg.dataset.drag!, axis: dg.dataset.axis ?? 'x', dir: Number(dg.dataset.dir ?? 1), dist: Number(dg.dataset.dist ?? 100), x0: ev.clientX, y0: ev.clientY, t0: performance.now(), p: 0 };
    return;
  }
  if (target.closest('[data-hold]') && S.g.night?.game) { ev.preventDefault(); setHold(true); return; }
  const it = target.closest('[data-item]') as HTMLElement | null;
  if (it && S.g.night && !S.g.paused && ev.button === 0) { ev.preventDefault(); inv = { key: it.dataset.item!, x0: ev.clientX, y0: ev.clientY, moved: false }; hover.key = ''; return; }
  const t = target.closest('[data-act]') as HTMLElement | null;
  if (!t) return;
  const act = t.dataset.act!;
  if (!S.g.night && !['newGame', 'continue', 'startNight', 'morning'].includes(act)) return;
  ev.preventDefault();
  actions[act]?.(t.dataset.arg ?? '');
});

document.addEventListener('contextmenu', ev => {
  const it = (ev.target as HTMLElement).closest('[data-item]') as HTMLElement | null;
  if (!it || !S.g.night) return;
  ev.preventDefault();
  const [kind, a, b] = it.dataset.item!.split(':');
  if (kind === 'bag') equipItemOn(a, N().heroTab); else unequip(Number(a), b);
});

monCanvas.addEventListener('pointerdown', ev => {
  const n = S.g.night;
  if (!n || S.g.paused) return;
  const r = monCanvas.getBoundingClientRect();
  const x = (ev.clientX - r.left) * (MON_W / r.width);
  const y = (ev.clientY - r.top) * (MON_H / r.height);
  if (n.monitor === 'excel') {
    const b = XL_BUTTONS.find(b => x >= b.x && x <= b.x + b.w && y >= XL_BTN_Y && y <= XL_BTN_Y + XL_BTN_H);
    if (b) excelInput(b.cmd);
    return;
  }
  const g = goblinPos();
  if (g && Math.abs(x - (g.x + 18)) < 34 && Math.abs(y - (g.y + 20)) < 34) catchGoblin();
});

// Away from the desk (a pre-emptive action): nothing on the desk reacts, only the away card.
window.addEventListener('pointerdown', ev => {
  const t = ev.target as HTMLElement;
  if (S.g.night?.pre?.away && !S.g.paused && !t.closest('#preUi') && !t.closest('#debug') && !t.closest('#pause')) { ev.preventDefault(); ev.stopImmediatePropagation(); }
}, true);
// Alt-tab blackout: no input reaches anything until the switch finishes (window capture runs before every other listener).
window.addEventListener('pointerdown', ev => {
  if (S.g.night?.switching && !(ev.target as HTMLElement).closest('#debug')) { ev.preventDefault(); ev.stopImmediatePropagation(); }
}, true);

window.addEventListener('keydown', ev => {
  initAudio();
  const g = S.g;
  if (ev.key === 'F1') { ev.preventDefault(); g.debug = !g.debug; return; }
  if (g.screen !== 'night' || !g.night) return;
  const n = g.night;
  if (ev.key === 'Escape') { g.paused = !g.paused; return; }
  if (g.paused) return;
  if (n.switching) { ev.preventDefault(); return; }
  if (n.pre) { ev.preventDefault(); return; }     // busy with a pre-emptive action: hands full
  if (wakeUp()) { ev.preventDefault(); return; }
  if (ev.key === 'Tab') { ev.preventDefault(); altTab(); return; }
  const k = ev.key.toLowerCase();
  if (k === 'h' && !n.game) { toggleHeadset(); return; }
  if (k === 'l' && hover.key) { const [kind, a, b] = hover.key.split(':'); const id = kind === 'bag' ? a : S.g.heroes[Number(a)]?.gear[b as 'weapon']?.id; if (id) toggleLock(id); return; }
  if (n.game) {
    const i = ['1', '2', '3'].indexOf(k);
    const gm = n.game;
    if (i >= 0 && gm.kind === 'phone' && gm.stage === 'call') momReply(i);
    else if (i >= 0 && gm.kind === 'phone' && gm.stage === 'chat' && gm.app === 'boss') bossPick(gm.rows[gm.row].options[i]);
    return;
  }
  if (n.monitor === 'excel') {
    const map: Record<string, 'left' | 'right' | 'rotate' | 'down' | 'drop'> = { a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right', w: 'rotate', arrowup: 'rotate', s: 'down', arrowdown: 'down', ' ': 'drop' };
    const cmd = map[k];
    if (cmd) { ev.preventDefault(); excelInput(cmd); }
    return;
  }
  g.heroes.forEach((h, hi) => {
    const slot = HOTKEYS[h.id].indexOf(k);
    if (slot > 0) queueAbility(hi, slot);
  });
});
void sfx;

/** The shower panel covers the apartment map while she showers and you can hear it (docs/design/eye-candy.md). */
const showerCtx = (el('showerCanvas') as HTMLCanvasElement).getContext('2d')!;
function showerPanel(n: NonNullable<typeof S.g.night>) {
  const cv = el('showerCanvas') as HTMLCanvasElement;
  const a = n.apt;
  const on = a.activity === 'shower' && a.moving <= 0 && !n.headset && n.visit.stage === 'idle' && n.peek <= 0;
  cv.style.display = on ? 'block' : 'none';
  if (!on) return;
  const bp = document.querySelector('#doorInfo .bp svg') as HTMLElement | null;
  if (bp) { const d = el('door').getBoundingClientRect(), r = bp.getBoundingClientRect(); cv.style.left = `${(r.left - d.left) / stageScale}px`; cv.style.top = `${(r.top - d.top) / stageScale}px`; }
  const fog = Math.max(0, Math.min(1, 1 - a.t / ACT_BY_ID.shower.dur[1]));
  const clear = a.cued ? Math.max(0, Math.min(1, 1 - a.t / T.END_CUE_SEC)) : 0;   // the hair dryer: water off, the glass clears
  drawShowerPanel(showerCtx, performance.now() / 1000, fog, clear);
}

// ---------- Render ----------
function render() {
  const g = S.g;
  const n = g.night;
  drawDoor(doorCtx);
  drawMonitor(monCtx);
  if (n) {
    setHtml('doorInfo', doorInfoHtml());
    showerPanel(n);
    setHtml('herHead', herHeadHtml());
    setHtml('deskObjects', deskHtml());
    setHtml('canPile', deskPileHtml());
    setHtml('monUi', monUiHtml());
    setHtml('winLayer', windowHtml());
    setHtml('ui', uiPanelHtml());
    setHtml('toasts', toastsHtml());
    setHtml('taskbar', taskbarHtml());
    updateWindowDynamics();
    drawMonsterScene();
    applyPhoneDrag();
    drawDeskFx();
    setHtml('lapUi', lapUiHtml());
    setHtml('preUi', preBusyHtml());
    const lid = n.blink.state === 'open' ? 0 : n.blink.lid;
    const eye = el('eyelids');
    eye.style.setProperty('--lid', `${lid * 50}%`);
    eye.classList.toggle('closed', n.blink.state === 'closed');
    eye.style.display = lid > 0 && g.screen === 'night' ? 'block' : 'none';
    el('desk').classList.toggle('yawn', n.yawn > 0);
    el('ui').classList.toggle('dimmed', n.monitor === 'excel');
  }
  if (g.screen !== 'night' || g.paused) stopAmbience();   // her TV does not follow you to the title or the morning
  setHtml('screens', screenHtml());
  const ma = document.getElementById('morningArt') as HTMLCanvasElement | null;
  if (ma) drawHerBed(ma.getContext('2d')!, performance.now() / 1000, morningScene());
  setHtml('pause', pauseHtml());
  setHtml('debug', debugHtml());
  setHtml('scare', scareHtml());
  setHtml('tooltipLayer', inv?.moved ? '' : tooltipHtml());
}

startLoop(render);
