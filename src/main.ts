import './style.css';
import './ios.css';
import { T } from './config/tuning';
import { isCall, S, N, initialState } from './core/state';
import { startLoop } from './core/loop';
import { drawMonitor, MON_W, MON_H, XL_BUTTONS, XL_BTN_Y, XL_BTN_H } from './ui/monitor';
import { DESK_W, BATTLE_W, BAND_H } from './ui/layout';
import { townHit, townHover } from './ui/townMap';
import { drawDoor, doorHit, DOOR_W, DOOR_H } from './ui/door';
import { youHtml, feedHtml, herHeadHtml, taskbarHtml, hover, tooltipHtml, entryIcon, updateWindowDynamics, doorInfoHtml, deskHtml, windowHtml, uiPanelHtml, screenHtml, pauseHtml, debugHtml, toastsHtml, scareHtml, preBusyHtml, morningScene, planHtml, coachHtml, tonightHtml } from './ui/panels';
import { toggleHeadset } from './systems/apartment';
import { initAudio, sfx, stopAmbience, audition, soundStatus, ambienceNow, loopPoints } from './ui/audio';
import { HOTKEYS } from './data/heroes';
import { queueAbility } from './systems/battle';
import { clickBagSlot, closeSelection, equipOn, dropSelected, useSelected, setHeroTab, equipItemOn, unequip } from './systems/bag';
import { skipDrop, rollBattleDrops, genItem, itemEntry, mapEntry, toggleLock } from './systems/loot';
import { choosePath, returnToTown, travelToDungeon, catchGoblin, pickStartFloor, debugEndFloor } from './systems/dungeon';
import { chooseCurio, endCurio } from './systems/curios';
import { toast } from './core/fx';
import { ACT_BY_ID } from './data/apartment';
import { startPre, cancelPre, episodeAnswer } from './systems/preemptive';
import type { PreId } from './data/preemptive';
import { identify, vendor, salvage, list, buildCity, openTownWin, serviceAction } from './systems/town';
import { monUiHtml } from './ui/town';
import { altTab, excelInput } from './systems/excel';
import { talkPick, openPhone, momReply, bossPick, closeGame, spawnInterrupt, answerSlide, setPhoneHold, textReply, setDeclineHold, togglePhoneDown, declineCall } from './systems/interrupts';
import { openMonster, cancelMonster } from './systems/monster';
import { drawMonsterScene, monsterTilt } from './ui/monsterScene';
import { setPeeking } from './systems/peek';
import { drawDeskFx, drawLapFx, lapUiHtml, setDeskScale } from './ui/deskFx';
import { GRID_W, GRID_H, STAGE_K, gridScale } from './render/grid';
import { drawPreview, setPreview, previewScene, type PreviewScene } from './render/preview';
import { maxHp } from './systems/stats';
import { swapHeroes, ensureParty, hookLine, shoveLine } from './systems/ranks';
import { toggleAutocast, buyNode, respec } from './systems/tree';
import type { NodeId } from './data/trees';
import type { HeroId } from './core/state';
import { drawLiveRpg, liveHitAt, liveShown, livePointer, liveDragStart, liveDragEnd, liveDragging, drawLivePanel, panelHitAt } from './render/liveRpg';
import { drawHerBed } from './ui/her';
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
import { closeCoach } from './systems/coach';
import { COACH } from './data/tips';

(window as unknown as Record<string, unknown>).__lootnight = { S, audio: { soundStatus, ambienceNow, loopPoints } };   // test hook for the Playwright scripts

// ---------- DOM skeleton (#49, monitor-first; docs/design/screen.md) ----------
// Left: the webcam view and her panel. Right: the desk, with the monitor on top. All RPG UI lives inside the game
// screen (the battle canvas, its overlay and the side panel); the YOU card and the feed sit on the desk.
const stage = document.getElementById('stage')!;
stage.innerHTML = `
  <div id="door"><canvas id="doorCanvas" width="${DOOR_W}" height="${DOOR_H}"></canvas><div id="headHit" data-act="headset" aria-label="Your head: click to put the headset on or off (H)"><span class="hh-tip" id="hhTip"></span></div><div id="herHead"></div><div id="doorInfo"></div></div>
  <div id="desk">
    <div id="deskInner">
      <div class="desk-surface"></div>
      <div class="bezel"></div><div class="webcam" title="The webcam: the left panel is what it sees"><i></i></div>
      <div id="screen">
        <canvas id="monitor" width="${MON_W}" height="${MON_H}"></canvas>
        <canvas id="rpgArea" width="334" height="232"></canvas><div id="rpgBar" aria-hidden="true"></div>
        <canvas id="spArea" width="140" height="232"></canvas>
        <div id="monUi"></div>
        <div id="ui"></div>
        <div id="winLayer"></div>
        <div id="toasts"></div>
      </div>
      <div id="taskbar"></div>
      <div class="kb"><div class="mat"></div><div class="keyboard">${keyboardSvg()}</div><div class="mouse">${mouseSvg()}</div></div>
      <div id="deskObjects"></div>
      <div id="tonight"></div>
      <div id="youCard"></div>
      <div id="feedCard"></div>
      <canvas id="deskFx" width="${DESK_W}" height="720"></canvas>
      <div id="preUi"></div>
    </div>
  </div>
  <canvas id="lapFx" width="1280" height="720"></canvas>
  <div id="lapUi"></div>
  <div id="screens"></div>
  <div id="pause"></div>
  <div id="planUi"></div>
  <div id="coachUi"></div>
  <canvas id="pkFrame" width="${GRID_W}" height="${GRID_H}"></canvas>
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
// V1 (#66): the 640 x 360 grid at a whole number of device pixels per grid pixel, letterboxed. The DOM stage is laid
// out at x2 (1280 x 720), so it scales by k / 2; the viewport sits on whole device pixels so nothing lands between them.
let stageScale = 1;
function fit() {
  const dpr = window.devicePixelRatio || 1, k = gridScale(window.innerWidth, window.innerHeight, dpr);
  const s = stageScale = k / dpr / STAGE_K;
  setDeskScale(s);
  stage.style.transform = `scale(${s})`;
  const vp = el('viewport'), w = GRID_W * k / dpr, h = GRID_H * k / dpr;
  Object.assign(vp.style, { width: `${w}px`, height: `${h}px`, left: `${Math.round((window.innerWidth * dpr - GRID_W * k) / 2) / dpr}px`, top: `${Math.round((window.innerHeight * dpr - GRID_H * k) / 2) / dpr}px` });
}
window.addEventListener('resize', fit); fit();

// ---------- Actions ----------
const actions: Record<string, (arg: string) => void> = {
  newGame: () => { wipeSave(); S.g = initialState(); startNight(); },
  continue: () => { load(); startNight(); },
  startNight: () => startNight(),
  morning: () => toMorning(),
  resume: () => { S.g.paused = false; },
  howtoOpen: () => { S.g.paused = false; S.g.howto = true; },
  howtoClose: () => { S.g.howto = false; },
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
  swap: a => { const [i, j] = a.split(',').map(Number); swapHeroes(i, j); },   // marching order (#52, 1.6)
  townTab: a => { N().townTab = a as 'town' | 'inventory' | 'tree'; sfx.click(); },   // the town side panel's tabs (#53)
  treeHero: a => { N().treeHero = a as HeroId; N().treeSel = undefined; sfx.click(); },
  treeNode: a => { N().treeSel = a; sfx.click(); },
  treeBuy: a => { const n = N(); if (n.treeHero || S.g.heroes[0]) buyNode((n.treeHero ?? S.g.heroes[0].id) as HeroId, a as NodeId); },
  treeRespec: a => respec(a as HeroId),
  skipDrop: () => skipDrop(),
  nextFloor: () => choosePath(N().safest),   // the old map's button
  path: a => choosePath(Number(a)),          // a path card on the floor map (#52, 1.5)
  curio: a => chooseCurio(a),
  pre: a => startPre(a as PreId),
  preMenu: () => { N().preMenu = null; },
  preCancel: () => cancelPre(),
  episode: a => episodeAnswer(a === '1'),
  curioLeave: () => { toast('The party walks past.', '#a999bd'); endCurio(); },
  toTown: () => returnToTown(),
  goblin: () => catchGoblin(),   // the live battle area's goblin (V2)
  pickFloor: a => pickStartFloor(Number(a)),   // #52, 1.4: the town's floor picker
  gate: () => travelToDungeon(),
  sleep: () => endNight('sleep'),
  identify: () => identify(), vendor: () => vendor(), salvage: () => salvage(), list: () => list(),
  build: a => buildCity(a as 'training'),
  townWin: a => openTownWin((a || null) as 'merchant' | null),
  buildWin: a => openTownWin(a ? `build:${a}` as 'build:inn' : null),
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
  dbgLife: () => { S.g.realLifeOff = !S.g.realLifeOff; },   // #52, 1.1: nobody is home
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
  coachClose: () => closeCoach(),
  dbgCalm: () => { N().apt.calm += 30; toast(`Debug: her next visit waits (calm ${Math.round(N().apt.calm)} s).`, '#a999bd'); },   // the framework's debug action (#19)
  dbgEpic: () => dbgDrop(itemEntry(genItem(N().floor, 3))),
  dbgLeg: () => dbgDrop(itemEntry(genItem(N().floor, 4))),
  dbgMap: () => N().dropQueue.push(mapEntry('vault')),
  dbgGold: () => { S.g.gold += 1000; S.g.mats += 30; },
  dbgMood: () => addMood(20),
  dbgClock: () => { N().clock += 60; },
  dbgFloor: () => debugEndFloor(),
  dbgRogue: () => { if (!S.g.heroes.some(h => h.id === 'rogue')) { S.g.nightsPlayed = Math.max(1, S.g.nightsPlayed); ensureParty(); S.g.heroes.forEach(h => { h.hp = maxHp(h); }); } },   // #52, 1.7
  dbgHook: () => hookLine(),
  dbgShove: () => shoveLine(),
  lapAns: a => lapAnswer(Number(a)),
  dbgDog: () => triggerDog(),
  dbgUnplug: () => triggerUnplug(),
  dbgLap: () => startLap(),
  dbgFrame: a => setPreview(!a || previewScene() === a ? null : a as PreviewScene),
  autoSalvage: () => { S.g.autoSalvage = !S.g.autoSalvage; sfx.click(); },
  lock: a => toggleLock(a),
  dbgDebt: () => { N().tired = Math.min(100, N().tired + 20); },
};
void rollBattleDrops;
function dbgDrop(e: ReturnType<typeof itemEntry>) { const n = N(); if (n.location === 'dungeon' && n.phase !== 'mapChoice') n.floorLoot.push({ entry: e, x: 330 + n.floorLoot.length * 30, t: 0 }); else n.dropQueue.push(e); }

// ---------- Tactile input: drag (slide, lift, pull) and hold (face unlock, drink) ----------
let drag: { id: string; axis: string; dir: number; dist: number; x0: number; y0: number; t0: number; p: number } | null = null;
function setDrag(p: number) { const g = S.g.night?.game; if (g && g.kind === 'phone') g.drag = p; }
function setHold(on: boolean) { if (!S.g.night) return; setPhoneHold(on); }

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
  } else if ((ev.target as HTMLElement).id !== 'rpgArea') {   // the live battle area sets its own hover (V2)
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
  let vx = 0, vr = 0, glow = 0;
  const it = n.interrupts[0];
  if (it && n.phoneDown > 0) {   // face-down (#47): no shaking, the screen glows out from under the phone
    const e = it.max - it.t, d = e - it.pingAt, now = performance.now() / 1000;
    glow = isCall(it.kind) ? 0.55 + Math.sin(now * 4.5) * 0.12 : d < 4 ? 0.9 - d * 0.12 : 0.42;
  } else if (it && !pswipe) {
    const e = it.max - it.t, now = performance.now() / 1000;
    const d = e - it.pingAt;     // each message: one short double buzz, in sync with its banner popping in
    const on = isCall(it.kind) ? e % 1.4 < 0.75 : d < 0.14 || (d > 0.2 && d < 0.34);
    if (on) { vx = Math.sin(now * 90) * 2.2; vr = Math.sin(now * 70) * 1.4; }
  }
  const wrap = ph.parentElement as HTMLElement;
  wrap.style.transform = `rotate(${-7 + vr}deg) translate(${vx}px, ${-lift * 10}px) scale(${1 + lift * 0.06})`;
  wrap.classList.toggle('held', !!pswipe);
  const gl = wrap.querySelector('.ph-glow') as HTMLElement | null;
  if (gl) gl.style.opacity = glow.toFixed(2);
  ph.style.transform = `perspective(600px) rotateY(${phoneAngle}deg)`;
}
// The webcam view: hold the door to peek; click the plan on the wall to open it (#35).
let planOpen = false;
const camXY = (ev: PointerEvent) => { const r = el('doorCanvas').getBoundingClientRect(); return [(ev.clientX - r.left) / stageScale, (ev.clientY - r.top) / stageScale] as const; };
// The live battle area (V2): its hit regions are in grid px; the tooltip keys are the old ones ('skill:h:s', 'text:...').
const rpgXY = (ev: PointerEvent) => { const r = el('rpgArea').getBoundingClientRect(); return [((ev.clientX - r.left) / r.width) * 334, ((ev.clientY - r.top) / r.height) * 232] as const; };
el('rpgArea').addEventListener('pointerdown', ev => {
  if (ev.button !== 0 || !S.g.night || S.g.paused) return;
  const [x, y] = rpgXY(ev), h = liveHitAt(x, y);
  if (!h || !h.act) return;
  ev.preventDefault(); ev.stopPropagation(); hover.key = '';
  if (liveDragStart(x, y)) { (el('rpgArea') as HTMLElement).setPointerCapture(ev.pointerId); return; }   // a portrait or a hero: maybe a swap
  actions[h.act]?.(h.arg);
});
// the side panel's canvas (#53): its hit regions are in panel px (140 x 232)
const spXY = (ev: PointerEvent) => { const r = el('spArea').getBoundingClientRect(); return [((ev.clientX - r.left) / r.width) * 140, ((ev.clientY - r.top) / r.height) * 232] as const; };
el('spArea').addEventListener('pointerdown', ev => {
  if (ev.button !== 0 || !S.g.night || S.g.paused) return;
  const [x, y] = spXY(ev), h = panelHitAt(x, y);
  if (!h || !h.act) return;
  ev.preventDefault(); ev.stopPropagation(); hover.key = '';
  actions[h.act]?.(h.arg);
});
el('spArea').addEventListener('pointermove', ev => {
  const [x, y] = spXY(ev), h = panelHitAt(x, y), p = toStage(ev);
  (el('spArea') as HTMLElement).style.cursor = h?.act ? 'pointer' : 'default';
  hover.key = h?.tip ? `text:${h.tip}` : ''; hover.x = p.x; hover.y = p.y;
});
el('spArea').addEventListener('pointerleave', () => { hover.key = ''; });
// right-click a skill well: switch its autocast on or off (#53, 2.3)
el('rpgArea').addEventListener('contextmenu', ev => {
  ev.preventDefault();
  const [x, y] = rpgXY(ev as PointerEvent), h = liveHitAt(x, y);
  if (h?.act === 'ability') { const [hi, si] = h.arg.split(',').map(Number); const hero = S.g.heroes[hi]; if (hero) toggleAutocast(hero.id, si); }
});
el('rpgArea').addEventListener('pointerup', () => {
  const d = liveDragEnd();
  if (!d) return;
  if (!d.moved) actions.heroTab(String(d.from));                       // a click selects the hero
  else if (d.to >= 0 && d.to !== d.from) actions.swap(`${d.from},${d.to}`);
});
el('rpgArea').addEventListener('pointermove', ev => {
  const [x, y] = rpgXY(ev), h = liveHitAt(x, y), p = toStage(ev);
  livePointer([x, y]);
  (el('rpgArea') as HTMLElement).style.cursor = liveDragging() ? 'grabbing' : h?.act === 'hero' || h?.act === 'heroTab' ? 'grab' : h?.act ? 'pointer' : 'default';
  hover.key = h?.tip ? (h.tip.startsWith('skill:') ? h.tip : `text:${h.tip}`) : ''; hover.x = p.x; hover.y = p.y;
});
el('rpgArea').addEventListener('pointerleave', () => { hover.key = ''; livePointer(null); });

el('doorCanvas').addEventListener('pointerdown', ev => {
  if (!S.g.night || S.g.paused) return;
  const hit = doorHit(...camXY(ev));
  if (hit === 'plan') { ev.preventDefault(); planOpen = true; sfx.click(); }
  else if (hit === 'door') { ev.preventDefault(); setPeeking(true); }
});
el('doorCanvas').addEventListener('pointermove', ev => {
  const hit = S.g.night ? doorHit(...camXY(ev)) : null;
  el('doorCanvas').style.cursor = hit === 'plan' ? 'zoom-in' : hit === 'door' ? 'grab' : 'default';
});
el('planUi').addEventListener('pointerdown', ev => {   // a click outside the sheet closes it
  if (!(ev.target as HTMLElement).closest('.plan-sheet') || (ev.target as HTMLElement).closest('.mg-close')) { ev.preventDefault(); ev.stopPropagation(); planOpen = false; }
});
document.addEventListener('pointerup', () => { if (S.g.night) setPeeking(false); });
document.addEventListener('keyup', ev => { if (ev.key === ' ' || ev.code === 'Space') { monsterTilt(false); if (S.g.night?.game?.kind === 'monster') ev.preventDefault(); } });
window.addEventListener('blur', () => monsterTilt(false));
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
  if (t.dataset.tip) hover.key = '';   // the button you just used: its tooltip goes (it may be gone, e.g. a chat in the phone)
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
  if (n.location === 'town') {   // the city (#50): click a building
    const id = x < BATTLE_W ? townHit(x, y) : null;
    if (id === 'portal') { S.g.townWin = null; travelToDungeon(); }
    else if (id === 'training' || id === 'inn' || id === 'library' || id === 'treasury') openTownWin(`build:${id}`);
    else if (id) openTownWin(id);
    return;
  }
});

// The city (#50): a building under the mouse glows and shows its tooltip; the cursor says it can be clicked.
monCanvas.addEventListener('pointermove', ev => {
  const n = S.g.night;
  const r = monCanvas.getBoundingClientRect();
  const x = (ev.clientX - r.left) * (MON_W / r.width), y = (ev.clientY - r.top) * (MON_H / r.height);
  const id = n && n.location === 'town' && n.monitor === 'rpg' && !n.switching && x < BATTLE_W ? townHit(x, y) : null;
  townHover.id = id;
  monCanvas.style.cursor = id ? 'pointer' : 'default';
  if (id) monCanvas.dataset.tip = `town:${id}`; else delete monCanvas.dataset.tip;
});
monCanvas.addEventListener('pointerleave', () => { townHover.id = null; delete monCanvas.dataset.tip; });

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
  if (g.howto) { if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); g.howto = false; } return; }   // the card: the night waits
  if (ev.key === 'Escape') { if (planOpen) { planOpen = false; return; } g.paused = !g.paused; return; }
  if (g.paused) return;
  if (n.switching) { ev.preventDefault(); return; }
  if (n.pre) { ev.preventDefault(); return; }     // busy with a pre-emptive action: hands full
  if (wakeUp()) { ev.preventDefault(); return; }
  if (ev.key === 'Tab') { ev.preventDefault(); altTab(); return; }
  const k = ev.key.toLowerCase();
  if (k === 'h' && !n.game) { toggleHeadset(); return; }
  if (k === 'm' && !n.game) { monsterKey(); return; }   // the Monster button on the YOU card (#49)
  if (k === 'l' && hover.key) { const [kind, a, b] = hover.key.split(':'); const id = kind === 'bag' ? a : S.g.heroes[Number(a)]?.gear[b as 'weapon']?.id; if (id) toggleLock(id); return; }
  if (n.game) {
    const i = ['1', '2', '3'].indexOf(k);
    const gm = n.game;
    if (gm.kind === 'monster' && (ev.key === ' ' || ev.code === 'Space')) { ev.preventDefault(); monsterTilt(true); return; }   // Space tilts the can, wherever it is (#61, #62)
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
/** M: drink a Monster; while her footsteps are on and the cans are out, hide them instead. */
function monsterKey() {
  const n = N();
  const coming = n.visit.stage !== 'idle' && n.visit.stage !== 'passing' && n.visit.stage !== 'in';
  if (coming && S.g.monsters > 0 && !n.cansHidden) hideCans();
  else if (!n.pre) openMonster();
}

/** The shower panel covers the apartment map while she showers and you can hear it (docs/design/eye-candy.md). */
// Coach mark: put the bubble next to its anchor and a ring around the anchor (stage coordinates).
function placeCoach() {
  const c = S.g.night?.coach;
  const box = document.querySelector('#coachUi .coach') as HTMLElement | null;
  const ring = document.querySelector('#coachUi .coach-ring') as HTMLElement | null;
  if (!c || !box || !ring) return;
  const a = document.querySelector(COACH[c.id].anchor) as HTMLElement | null;
  if (!a) { box.style.visibility = ring.style.visibility = 'hidden'; return; }
  const s = stage.getBoundingClientRect(), r = a.getBoundingClientRect();
  const x = (r.left - s.left) / stageScale, y = (r.top - s.top) / stageScale, w = r.width / stageScale, h = r.height / stageScale;
  Object.assign(ring.style, { left: `${x - 4}px`, top: `${y - 4}px`, width: `${w + 8}px`, height: `${h + 8}px`, visibility: 'visible' });
  const bw = box.offsetWidth, bh = box.offsetHeight;
  let bx = x + w / 2 - bw / 2, by = y + h / 2 - bh / 2;
  const side = COACH[c.id].side;
  if (side === 'over') by = y + 70;
  if (side === 'right') { bx = x + w + 16; by = y + h / 2 - bh / 2; }
  if (side === 'left') { bx = x - bw - 16; by = y + Math.min(h / 2, 60) - bh / 2; }
  if (side === 'above') { by = y - bh - 16; }
  bx = Math.max(8, Math.min(1280 - bw - 8, bx)); by = Math.max(8, Math.min(720 - bh - 8, by));
  Object.assign(box.style, { left: `${bx}px`, top: `${by}px`, visibility: 'visible' });
}

// ---------- Render ----------
function render() {
  const g = S.g;
  const n = g.night;
  drawDoor(doorCtx);
  drawLiveRpg(el('rpgArea') as HTMLCanvasElement);
  drawLivePanel(el('spArea') as HTMLCanvasElement);   // #53: the Skill Tree tab in the renderer
  document.querySelector('.keyboard')?.classList.toggle('rogue', S.g.heroes.some(h => h.id === 'rogue'));   // V2 (#67): the battle area in the new look
  drawMonitor(monCtx, liveShown());
  if (n) {
    setHtml('doorInfo', doorInfoHtml());
    setHtml('herHead', herHeadHtml());
    setHtml('tonight', tonightHtml());
    setHtml('deskObjects', deskHtml());
    setHtml('hhTip', n.headset ? 'Click: headset off (H)' : 'Click: headset on (H)');
    setHtml('youCard', youHtml());
    setHtml('feedCard', feedHtml());
    setHtml('monUi', liveShown() ? '' : monUiHtml());
    setHtml('winLayer', windowHtml());
    setHtml('ui', uiPanelHtml());
    setHtml('toasts', toastsHtml());
    setHtml('taskbar', taskbarHtml());
    updateWindowDynamics();
    drawMonsterScene();
    applyPhoneDrag();
    drawDeskFx();
    drawLapFx();
    setHtml('lapUi', lapUiHtml());
    setHtml('preUi', preBusyHtml());
    const lid = n.blink.state === 'open' ? 0 : n.blink.lid;
    const eye = el('eyelids');
    eye.style.setProperty('--lid', `${lid * 50}%`);
    eye.classList.toggle('closed', n.blink.state === 'closed');
    eye.style.display = lid > 0 && g.screen === 'night' ? 'block' : 'none';
    el('desk').classList.toggle('yawn', n.yawn > 0);
    el('ui').classList.toggle('off', n.monitor === 'excel' || n.monitorOff > 0 || !!n.switching);   // the side panel is on the screen: it goes with it
  }
  if (g.screen !== 'night' || g.paused || g.howto) stopAmbience();   // her TV does not follow you to the title or the morning
  setHtml('screens', screenHtml());
  const ma = document.getElementById('morningArt') as HTMLCanvasElement | null;
  if (ma) drawHerBed(ma.getContext('2d')!, performance.now() / 1000, morningScene());
  if (!g.night || g.screen !== 'night') planOpen = false;
  setHtml('planUi', planOpen ? planHtml() : '');
  setHtml('coachUi', g.screen === 'night' && !g.paused && !g.howto && !(g.night?.scare) ? coachHtml() : '');   // never over the jumpscare
  placeCoach();
  setHtml('pause', pauseHtml());
  setHtml('debug', debugHtml());
  drawPreview(el('pkFrame') as HTMLCanvasElement);
  setHtml('scare', scareHtml());
  setHtml('tooltipLayer', inv?.moved ? '' : tooltipHtml());
}

startLoop(render);
