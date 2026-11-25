import './style.css';
import './ios.css';
import { T } from './config/tuning';
import {  S, N, initialState } from './core/state';
import { startLoop } from './core/loop';
import { drawMonitor, MON_W, MON_H, XL_BUTTONS, XL_BTN_Y, XL_BTN_H } from './ui/monitor';
import { drawDoor, doorHit, DOOR_W, DOOR_H } from './ui/door';
import { hover, tooltipHtml, entryIcon, updateWindowDynamics, windowHtml, uiPopHtml, screenHtml, pauseHtml, debugHtml, toastsHtml, scareHtml, preBusyHtml, morningScene, planHtml, coachHtml } from './ui/panels';
import { toggleHeadset } from './systems/apartment';
import { initAudio, sfx, stopAmbience, audition, soundStatus, ambienceNow, loopPoints } from './ui/audio';
import { HOTKEYS, HERO_NAME, HERO_COLORS } from './data/heroes';
import { queueAbility } from './systems/battle';
import { clickBagSlot, closeSelection, equipOn, dropSelected, useSelected, setHeroTab, equipItemOn, unequip } from './systems/bag';
import { skipDrop, rollBattleDrops, genItem, itemEntry, mapEntry, toggleLock } from './systems/loot';
import { choosePath, returnToTown, travelToDungeon, catchGoblin, pickStartFloor, debugEndFloor } from './systems/dungeon';
import { chooseCurio, endCurio } from './systems/curios';
import { toast } from './core/fx';
import { startPre, cancelPre, episodeAnswer } from './systems/preemptive';
import type { PreId } from './data/preemptive';
import { buildCity, openService, servicePick, serviceRun } from './systems/town';
import { monUiLiveHtml } from './ui/town';
import { altTab, excelInput } from './systems/excel';
import { talkPick, openPhone, momReply, bossPick, closeGame, spawnInterrupt, answerSlide, answerSpeaker, phoneAction, setPhoneHold, textReply, togglePhoneDown, declineCall } from './systems/interrupts';
import { openMonster, cancelMonster } from './systems/monster';
import { monsterView, monsterTilt, monsterDown, monsterMove, monsterUp, monsterGrabbing, EB_SCENE } from './ui/monsterScene';
import { setPeeking } from './systems/peek';
import { drawLapFx, lapUiHtml } from './ui/deskFx';
import { dogStroked, DOG_SPOTS } from './render/dogView';
import { GRID_W, GRID_H, STAGE_K, gridScale } from './render/grid';
import { drawPreview, setPreview, previewScene, type PreviewScene } from './render/preview';
import { maxHp } from './systems/stats';
import { swapHeroes, ensureParty, hookLine, shoveLine } from './systems/ranks';
import { toggleAutocast, buyNode, respec } from './systems/tree';
import type { NodeId } from './data/trees';
import type { HeroId } from './core/state';
import { drawLiveRpg, liveHitAt, liveShown, livePointer, liveDragStart, liveDragEnd, liveDragging, drawLivePanel, panelHitAt, livePanelShown, liveDrewAt } from './render/liveRpg';
import { PK } from 'virtual:pagekit';
import { phoneShown, phoneView } from './render/phoneView';
import { deskView, deskTip } from './render/deskView';
import { herView, herTip } from './render/herView';
import { herRead, phoneScroll } from './systems/messages';
import { drawHerBed } from './ui/her';
import { answer as lapAnswer, startLap } from './systems/lap';
import { triggerDog, triggerUnplug, petStroke, plugIn } from './systems/pets';
import { wakeUp } from './systems/tired';
import { triggerVisitNow, takePlate, chatAnswer, cuddleAnswer, hideCans } from './systems/visits';
import { cuddlePointer, endCuddle } from './systems/cuddle';
import type { VisitKind } from './core/state';
import { startNight, endNight, toMorning } from './systems/night';
import { load, wipeSave } from './systems/save';
import { addMood } from './systems/meters';
import { closeCoach } from './systems/coach';
import { COACH } from './data/tips';

(window as unknown as Record<string, unknown>).__lootnight = { S, audio: { soundStatus, ambienceNow, loopPoints }, herView: () => herView() };   // test hook for the Playwright scripts

// ---------- DOM skeleton (#49, monitor-first; docs/design/screen.md) ----------
// Left: the webcam view and her panel. Right: the desk, with the monitor on top. All RPG UI lives inside the game
// screen (the battle canvas, its overlay and the side panel); the YOU card and the feed sit on the desk.
const stage = document.getElementById('stage')!;
stage.innerHTML = `
  <div id="door"><canvas id="doorCanvas" width="${DOOR_W}" height="${DOOR_H}"></canvas><canvas id="herArea" width="148" height="360"></canvas><div id="herNote" aria-hidden="true"></div><div id="headHit" data-act="headset" aria-label="Your head: click to put the headset on or off (H)"><span class="hh-tip" id="hhTip"></span></div></div>
  <div id="desk">
    <div id="deskInner">
      <canvas id="rsArea" width="492" height="360"></canvas><div id="deskPhone" aria-hidden="true"></div><canvas id="ebArea" width="492" height="360"></canvas>
      <div id="screen">
        <canvas id="monitor" width="${MON_W}" height="${MON_H}"></canvas>
        <canvas id="rpgArea" width="334" height="232"></canvas><div id="rpgBar" aria-hidden="true"></div>
        <canvas id="spArea" width="140" height="232"></canvas><div id="spBag" aria-hidden="true"></div>
        <div id="monUi"></div>
        <div id="ui"></div>
        <div id="winLayer"></div>
        <div id="toasts"></div>
      </div>
      <canvas id="dogOv" width="492" height="360"></canvas>
      <div id="preUi"></div>
      <canvas id="phHand" width="126" height="252"></canvas><button id="phClose" class="mg-close" data-act="closeGame" title="Put the phone down">✕</button>
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
const doorCtx = (el('doorCanvas') as HTMLCanvasElement).getContext('2d', { willReadFrequently: true })!;   // on the CPU: her panel reads it back every frame (V4)
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
  // the town map (V2): the portal goes down, a service opens in the panel's Town tab, a plot lights its build row
  townSpot: a => {
    const n = N();
    if (a === 'portal') { travelToDungeon(); return; }
    if (a === 'forge' || a === 'merchant' || a === 'appraiser' || a === 'auction') { openService(a); return; }
    n.townTab = 'town'; n.svc = null; n.plotHot = a; sfx.click();
  },
  svcClose: () => openService(null),
  svcPick: a => servicePick(a),
  svcRun: () => serviceRun(),
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
  build: a => buildCity(a as 'training'),
  portal: () => travelToDungeon(),
  openPhone: () => openPhone(),
  openMonster: () => openMonster(),
  cancelMonster: () => cancelMonster(),
  cablesHide: () => { cablesHidden = true; },
  textReply: () => textReply(),
  mom: a => momReply(Number(a)),
  speaker: () => answerSpeaker(),
  decline: () => declineCall(),   // the red button on the ringing desk phone (V3)
  talk: a => talkPick(Number(a)),
  boss: a => bossPick(Number(a)),
  closeGame: () => closeGame(false),
  // the phone in your hand (V8, #73): its apps and her chat
  phApp: a => { const n = N(); n.phApp = a as 'home'; n.phScroll = 0; if (a === 'babe') herRead(); sfx.click(); },
  phScroll: a => phoneScroll(a === 'end' ? 'end' : Number(a)),
  // Debug (F1)
  dbgSpeed: a => { S.g.timeScale = Number(a); },
  dbgLife: () => { S.g.realLifeOff = !S.g.realLifeOff; },   // #52, 1.1: nobody is home
  dbgVisit: a => triggerVisitNow((a || undefined) as VisitKind | undefined),
  hideCans: () => { hideCans(); },
  takePlate: () => takePlate(),
  chatAnswer: a => chatAnswer(Number(a)),
  cuddle: a => cuddleAnswer(a === '1'),
  cuddleQuit: () => endCuddle(null),
  dbgMom: () => spawnInterrupt('mom', true),
  dbgBoss: () => spawnInterrupt('boss', true),
  dbgCall: a => spawnInterrupt(a as 'courier', true),
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
      const entry = kind === 'bag' ? S.g.bag.find(e => e.id === a) : kind === 'gear' ? (() => { const it = S.g.heroes[Number(a)]?.gear[b as 'weapon']; return it ? { kind: 'item' as const, id: it.id, item: it } : undefined; })() : undefined;
      const h = kind === 'hero' ? S.g.heroes[Number(a)] : null;
      ghost().innerHTML = entry ? entryIcon(entry, 34) : h ? `<span class="ghost-hero" style="border-color:${HERO_COLORS[h.id]}">${HERO_NAME[h.id]}</span>` : '';
      ghost().classList.toggle('hero', !!h); ghost().style.display = 'block';
    }
    if (inv.moved) { ghost().style.left = `${p.x - 20}px`; ghost().style.top = `${p.y - 20}px`; hover.key = ''; }
  } else if (!['rpgArea', 'spArea', 'rsArea', 'herArea', 'ebArea'].includes((ev.target as HTMLElement).id)) {   // the renderer's canvases set their own hover (V2, V3)
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
    if (!moved) { if (kind === 'bag') clickBagSlot(a); else if (kind === 'hero') actions.heroTab(a); }
    else {
      const under = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const dropEl = under?.closest('[data-drop]') as HTMLElement | null;
      const drop = under?.id === 'spArea' ? panelDrop(ev) : dropEl?.dataset.drop ?? '';
      const [dk, dv] = drop.split(':');
      if (kind === 'bag' && dk === 'slot') equipItemOn(a, N().heroTab, dv);
      else if (kind === 'bag' && dk === 'hero') equipItemOn(a, Number(dv));
      else if (kind === 'gear' && dk === 'bag') unequip(Number(a), b);
      else if (kind === 'hero' && dk === 'hero' && dv !== a) actions.swap(`${a},${dv}`);
    }
  }
  setHold(false);
  if (!drag) return;
  const { id, p, t0 } = drag; drag = null;
  const ms = performance.now() - t0;
  if (id === 'answer') answerSlide(p);   // the phone's slide to answer (V8: dragged on its canvas)
  void ms;
  setDrag(0);
});
// Desk phone: grab it and swipe left or right to flip it over; a tap (no swipe) answers.
let pswipe: { x0: number; dx: number; moved: boolean } | null = null;
document.addEventListener('pointerdown', ev => {
  const t = ev.target as HTMLElement;
  if (!S.g.night || S.g.paused) return;
  if (t.id === 'rsArea' && deskHitAt(ev)?.act === 'phone') { ev.preventDefault(); ev.stopImmediatePropagation(); pswipe = { x0: ev.clientX, dx: 0, moved: false }; sfx.click(); }   // the phone lying on the desk (V3)
}, true);
document.addEventListener('pointermove', ev => {
  const box = document.getElementById('cuddleBox');
  if (box && S.g.night?.game?.kind === 'cuddle') { const r = box.getBoundingClientRect(); cuddlePointer((ev.clientX - r.left) / stageScale, (ev.clientY - r.top - 34 * stageScale) / stageScale); }
  if (!pswipe) return;
  pswipe.dx = (ev.clientX - pswipe.x0) / stageScale;
  if (Math.abs(pswipe.dx) > 6) pswipe.moved = true;
});
document.addEventListener('pointerup', () => {
  if (!pswipe) return;
  const { dx, moved } = pswipe; pswipe = null;
  if (Math.abs(dx) >= 45) togglePhoneDown();
  else if (!moved) openPhone();
  hover.key = '';   // the desk's tip goes with it (the phone is in your hand, or face down)
});
// The webcam view: hold the door to peek; click the plan on the wall to open it (#35).
let planOpen = false;
const camXY = (ev: PointerEvent) => { const r = el('herArea').getBoundingClientRect(); return [(ev.clientX - r.left) / stageScale, (ev.clientY - r.top) / stageScale] as const; };   // the webcam canvas's px (V4: under her panel, the same size)
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
  // an item: pick it up (drag to equip or unequip, as the DOM bag did); a click without a drag selects it
  if (h.act === 'bagCell') { inv = { key: `bag:${h.arg}`, x0: ev.clientX, y0: ev.clientY, moved: false }; return; }
  if (h.act === 'gearCell') { const it = S.g.heroes[N().heroTab]?.gear[h.arg as 'weapon']; if (it) inv = { key: `gear:${N().heroTab}:${h.arg}`, x0: ev.clientX, y0: ev.clientY, moved: false }; return; }
  // a party card: a click picks the hero, a drag onto another card swaps their ranks (the town had no reorder before)
  if (h.act === 'heroTab') { inv = { key: `hero:${h.arg}`, x0: ev.clientX, y0: ev.clientY, moved: false }; return; }
  actions[h.act]?.(h.arg);
});
el('spArea').addEventListener('pointermove', ev => {
  const [x, y] = spXY(ev), h = panelHitAt(x, y), p = toStage(ev);
  (el('spArea') as HTMLElement).style.cursor = h?.act ? 'pointer' : 'default';
  if (inv?.moved) return;
  hover.key = h?.tip ? (/^(bag|gear|hero|skill):|^autosalvage$/.test(h.tip) ? h.tip : `text:${h.tip}`) : ''; hover.x = p.x; hover.y = p.y;
});
el('spArea').addEventListener('contextmenu', ev => {
  ev.preventDefault();
  if (!S.g.night) return;
  const [x, y] = spXY(ev as PointerEvent), h = panelHitAt(x, y);
  if (h?.act === 'bagCell') equipItemOn(h.arg, N().heroTab);
  else if (h?.act === 'gearCell') unequip(N().heroTab, h.arg);
});
/** Where an item dragged over the side panel's canvas lands: a gear slot, a party card, or the bag. */
function panelDrop(ev: PointerEvent): string {
  const [x, y] = spXY(ev), h = panelHitAt(x, y);
  if (!h) return '';
  if (h.act === 'gearCell') return `slot:${h.arg}`;
  if (h.act === 'heroTab') return `hero:${h.arg}`;
  if (h.act === 'bagCell' || h.act === 'bagArea') return 'bag';
  return '';
}
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

// Her panel (V4, #69): the renderer's canvas over the webcam. Its UI's hit regions first, then the webcam's door and plan.
const herCanvas = el('herArea') as HTMLCanvasElement, herCtx = herCanvas.getContext('2d')!;
let herHits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] = [], herHover = '', herLast = 0, herDirty = false;
function herHitAt(ev: PointerEvent) {
  const [cx, cy] = camXY(ev), x = cx / 2, y = cy / 2;
  for (let i = herHits.length - 1; i >= 0; i--) { const h = herHits[i]; if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) return h; }
  return null;
}
function drawHerPanel() {
  const on = !!S.g.night && PK.ready();
  herCanvas.style.display = on ? 'block' : 'none';
  (el('doorCanvas') as HTMLElement).style.visibility = on ? 'hidden' : 'visible';   // still drawn: it is the webcam the panel dithers
  if (!on) { herHits = []; return; }
  const r = PK.her(el('doorCanvas') as HTMLCanvasElement, herView(herHover), performance.now() / 1000);
  herCtx.drawImage(r.canvas, 0, 0);
  herHits = r.hits; (window as unknown as { __lootnight: { herHits?: unknown } }).__lootnight.herHits = herHits;   // for the tests
  (window as unknown as { __lootnight: { ebWarm?: unknown } }).__lootnight.ebWarm = ebWarmDone;   // which can count the break is baked for
}
herCanvas.addEventListener('pointerdown', ev => {
  if (!S.g.night || S.g.paused || ev.button !== 0) return;
  const h = herHitAt(ev);
  if (h) { if (h.act) { ev.preventDefault(); actions[h.act]?.(h.arg); herDirty = true; } return; }
  const hit = camXY(ev)[1] < DOOR_H ? doorHit(...camXY(ev)) : null;
  if (hit === 'plan') { ev.preventDefault(); planOpen = true; sfx.click(); }
  else if (hit === 'door') { ev.preventDefault(); setPeeking(true); herDirty = true; }
});
herCanvas.addEventListener('pointermove', ev => {
  const h = S.g.night ? herHitAt(ev) : null, p = toStage(ev);
  const hit = !h && S.g.night && camXY(ev)[1] < DOOR_H ? doorHit(...camXY(ev)) : null;
  herCanvas.style.cursor = h?.act ? 'pointer' : hit === 'plan' ? 'zoom-in' : hit === 'door' ? 'grab' : 'default';
  const hv = h?.act ? `${h.act}:${h.arg}` : ''; if (hv !== herHover) { herHover = hv; herDirty = true; }
  const tip = h?.tip ? (h.tip.startsWith('pre:') ? h.tip : herTip(h.tip) && `text:${herTip(h.tip)}`) : hit && !S.g.night?.peeking ? `text:${herTip(hit)}` : '';
  hover.key = tip || ''; hover.x = p.x; hover.y = p.y;
});
herCanvas.addEventListener('pointerleave', () => { if (herHover) herDirty = true; herHover = ''; hover.key = ''; });
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
  if (g.howto) { if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); g.howto = false; } return; }   // the card: the night waits
  if (ev.key === 'Escape') { if (planOpen) { planOpen = false; return; } g.paused = !g.paused; return; }
  if (g.paused) return;
  if (n.switching) { ev.preventDefault(); return; }
  if (n.pre) { ev.preventDefault(); return; }     // busy with a pre-emptive action: hands full
  if (wakeUp()) { ev.preventDefault(); return; }
  if (ev.key === 'Tab') { ev.preventDefault(); altTab(); return; }
  const k = ev.key.toLowerCase();
  const handsFree = !n.game || (n.game.kind === 'phone' && !!n.game.speaker);   // a call on speaker keeps your hands free
  if (k === 'h' && handsFree) { toggleHeadset(); return; }
  if (k === 'g' && !n.game) { monsterKey(); return; }   // Goblin Fuel: the Drink button on the YOU card, its G keycap (V3)
  if (k === 'l' && hover.key) { const [kind, a, b] = hover.key.split(':'); const id = kind === 'bag' ? a : S.g.heroes[Number(a)]?.gear[b as 'weapon']?.id; if (id) toggleLock(id); return; }
  // The phone is touch only (#54, 3.2): no keys answer it. A call on speaker leaves your hands free, so the skill
  // keys and the rest still work while it lasts.
  if (n.game && !(n.game.kind === 'phone' && n.game.speaker)) {
    const gm = n.game;
    if (gm.kind === 'monster' && (ev.key === ' ' || ev.code === 'Space')) { ev.preventDefault(); monsterTilt(true); return; }   // Space tilts the can, wherever it is (#61, #62)
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

// ---------- The energy break (V5, #70; grid doc 7c): the renderer's window over the dimmed right screen ----------
const ebCanvas = el('ebArea') as HTMLCanvasElement, ebCtx = ebCanvas.getContext('2d')!;
let ebHits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] = [], ebOdd = false, ebBgLast = 0, ebWarmDone = '', ebIdle = false;
// the cable fix (V6, #71; grid doc 7d): its window, like the break's, while the cables are out. The dog's slam plays
// first (the room behind the monitor bakes meanwhile); when all are in it stays a moment ("Signal back"). Its close box
// hides it; a click on the dark monitor brings it back.
let cable: { u: object; at: number; done: number } | null = null, cablesHidden = false, cableShown = false;
function cableMode(now: number): boolean {
  const n = S.g.night, u = n?.unplugged;
  if (u && n && (!cable || cable.u !== u)) {
    const t0 = u.t0 ?? n.threat;
    cable = { u, at: now, done: 0 }; cablesHidden = false;
    PK.cableStart({ kinds: u.kinds, colors: u.colors, sockets: u.sockets, plugged: u.plugged }, (p, s) => plugIn(p, s), () => Math.max(0, N().threat - t0));
  }
  if (!u && cable && !cable.done) cable.done = now;
  if (cable && cable.done && now - cable.done > 1300) cable = null;
  const show = T.CABLE_SHOW_SEC * 1000;
  if (cable && !cable.done && now - cable.at <= show) PK.cableWarm(6);
  return !!cable && !cablesHidden && now - cable.at > show;
}
function drawEnergyBreak() {
  const now = performance.now(), cab = cableShown = PK.ready() && !!S.g.night && cableMode(now);
  const v = !cab && PK.ready() ? monsterView() : null;
  ebCanvas.style.display = v || cab ? 'block' : 'none';
  if (cab) {
    ebOdd = !ebOdd; if (!ebOdd) return;
    const bg = now - ebBgLast > 250 ? rsCanvas : null; if (bg) ebBgLast = now;
    const r = PK.cables(bg, now / 1000);
    ebCtx.drawImage(r.canvas, 0, 0); ebHits = r.hits;
    return;
  }
  if (!v) {
    ebHits = [];
    // bake the break's scenes ahead in the browser's idle time (what the frames leave over), so opening it never stalls
    const n = S.g.night, key = n && S.g.monsters > 0 ? String(Math.min(3, S.g.monsters)) : '';
    if (key && ebWarmDone !== key && PK.ready() && !ebIdle) {
      ebIdle = true;
      const rIC = (window as unknown as { requestIdleCallback?: (f: (d: { timeRemaining(): number }) => void, o?: { timeout: number }) => void }).requestIdleCallback;
      const job = (ms: number) => { ebIdle = false; if (ms > 1 && PK.ebWarm(Number(key), ms - 1)) ebWarmDone = key; };
      if (rIC) rIC(d => job(d.timeRemaining())); else setTimeout(() => job(3), 50);
    }
    return;
  }
  ebOdd = !ebOdd; if (!ebOdd) { PK.ebWarm(v.n, 6); return; }   // 30 fps (the cursor is a CSS cursor, at full rate); in between, bake what is still to come
  const bg = now - ebBgLast > 250 ? rsCanvas : null; if (bg) ebBgLast = now;   // the dimmed right screen behind it, four times a second
  const r = PK.ebreak(bg, v, now / 1000);
  ebCtx.drawImage(r.canvas, 0, 0);
  ebHits = r.hits;
}
const ebXY = (ev: PointerEvent) => { const r = ebCanvas.getBoundingClientRect(); return [((ev.clientX - r.left) / r.width) * 492, ((ev.clientY - r.top) / r.height) * 360] as const; };
const inEbScene = (x: number, y: number) => x >= EB_SCENE.x && y >= EB_SCENE.y && x < EB_SCENE.x + EB_SCENE.w && y < EB_SCENE.y + EB_SCENE.h;
ebCanvas.addEventListener('pointerdown', ev => {
  if (!S.g.night || S.g.paused || ev.button !== 0) return;
  ev.preventDefault();
  const [x, y] = ebXY(ev), h = ebHits.find(q => x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h);
  if (h) { actions[h.act]?.(h.arg); return; }
  if (cableShown) { if (inEbScene(x, y) && PK.cableDown(x - EB_SCENE.x, y - EB_SCENE.y)) { sfx.click(); ebCanvas.style.cursor = PK.ebCursor('grab'); } return; }
  if (inEbScene(x, y)) { monsterDown(x - EB_SCENE.x, y - EB_SCENE.y); ebCanvas.style.cursor = PK.ebCursor(monsterGrabbing() ? 'grab' : 'hand'); }
});
ebCanvas.addEventListener('pointermove', ev => {
  const [x, y] = ebXY(ev), p = toStage(ev), h = ebHits.find(q => x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h);
  if (cableShown) {
    const on = inEbScene(x, y) && PK.cableMove(x - EB_SCENE.x, y - EB_SCENE.y);
    ebCanvas.style.cursor = h ? 'pointer' : on ? PK.ebCursor(PK.cableDragging() ? 'grab' : 'hand') : 'default';
    hover.key = h ? 'text:Close it. Click the dark monitor to come back to the cables.' : ''; hover.x = p.x; hover.y = p.y;
    return;
  }
  monsterMove(x - EB_SCENE.x, y - EB_SCENE.y);
  ebCanvas.style.cursor = h ? 'pointer' : inEbScene(x, y) && PK.ready() ? PK.ebCursor(monsterGrabbing() ? 'grab' : 'hand') : 'default';
  hover.key = h ? 'text:Stop the energy break. Before the can is open nothing is lost.' : ''; hover.x = p.x; hover.y = p.y;
});
document.addEventListener('pointerup', () => { if (cableShown) PK.cableUp(); if (S.g.night?.game?.kind === 'monster') { monsterUp(); ebCanvas.style.cursor = PK.ready() ? PK.ebCursor('hand') : 'default'; } });

(window as unknown as Record<string, unknown>).__lnCables = () => PK.cablePoints();   // for the tests
el('screen').addEventListener('pointerdown', () => { if (S.g.night?.unplugged && cablesHidden) { cablesHidden = false; sfx.click(); } });
// ---------- The desk (V3, #68; grid doc §7): the renderer's right screen behind the monitor's live canvases ----------
const rsCanvas = el('rsArea') as HTMLCanvasElement, rsCtx = rsCanvas.getContext('2d')!;
const rsSrc = document.createElement('canvas'); rsSrc.width = 474; rsSrc.height = 232;
const dogOvCtx = (el('dogOv') as HTMLCanvasElement).getContext('2d')!;
let deskShake = 0;
let deskHits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] = [], deskLast = 0, deskPhoneHover = false, deskBuilt = false;
function drawDesk() {
  const n = S.g.night, on = !!n && PK.ready();
  rsCanvas.style.display = on ? 'block' : 'none';
  if (!on) { deskHits = []; deskBuilt = false; return; }
  const now = performance.now();
  // 15 fps, in two halves on the frames the battle area and the panel skip (they draw at 30): building the desk and
  // lighting it cost a few ms each, so neither shares a frame with them; after 200 ms a half runs anyway
  const free = now - liveDrewAt() >= 8;
  if (deskBuilt) {
    if (!free && now - deskLast < 200) return;
    deskBuilt = false;
    const r = PK.desk(rsSrc, null, now / 1000, 2);
    if (r) {
      rsCtx.drawImage(r.canvas, 0, 0); deskHitsSet(r.hits);
      dogOvCtx.clearRect(0, 0, 492, 360); if (r.overlay) dogOvCtx.drawImage(r.overlay, 0, 0);   // the dog's hearts, marks and sounds, over the monitor
      deskShake = r.shake;
    }
    return;
  }
  if (now - deskLast < 66 || (!free && now - deskLast < 200)) return;
  deskLast = now;
  // what the monitor shows, for the desk's light: the renderer's battle area and panel, or the monitor (Excel, off)
  const sc = rsSrc.getContext('2d')!; sc.imageSmoothingEnabled = false;
  if (liveShown()) { sc.drawImage(el('rpgArea') as HTMLCanvasElement, 0, 0); sc.drawImage(el('spArea') as HTMLCanvasElement, 334, 0); }
  else sc.drawImage(monCanvas, 0, 0, monCanvas.width, monCanvas.height, 0, 0, 474, 232);
  PK.desk(rsSrc, deskView(deskPhoneHover), now / 1000, 1);
  deskBuilt = true;
}
function deskHitsSet(hits: typeof deskHits) {
  deskHits = hits; (window as unknown as { __lootnight: { deskHits?: unknown } }).__lootnight.deskHits = deskHits;   // where things sit on the desk, for the tests
  const ph = deskHits.find(h => h.act === 'phone'), px = el('deskPhone');   // a DOM stand-in for the coach mark
  if (ph) {   // the part of it on screen: it lies half off the desk's left edge
    const x0 = Math.max(0, ph.x), y0 = Math.max(0, ph.y);
    Object.assign(px.style, { left: `${x0 * 2}px`, top: `${y0 * 2}px`, width: `${(ph.x + ph.w - x0) * 2}px`, height: `${(Math.min(ph.y + ph.h, 360) - y0) * 2}px` });
  }
}
const rsXY = (ev: PointerEvent) => { const r = rsCanvas.getBoundingClientRect(); return [((ev.clientX - r.left) / r.width) * 492, ((ev.clientY - r.top) / r.height) * 360] as const; };
function deskHitAt(ev: PointerEvent) { const [x, y] = rsXY(ev); for (let i = deskHits.length - 1; i >= 0; i--) { const h = deskHits[i]; if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) return h; } return null; }
rsCanvas.addEventListener('pointerdown', ev => {
  if (!S.g.night || S.g.paused || ev.button !== 0) return;
  const h = deskHitAt(ev);
  if (!h || !h.act || h.act === 'phone') return;   // the phone: the swipe handler above
  ev.preventDefault();
  actions[h.act]?.(h.arg);
});
let strokeAt: { x: number; t: number } | null = null;
rsCanvas.addEventListener('pointermove', ev => {
  const h = deskHitAt(ev), p = toStage(ev);
  if (h?.act === 'dogHead') {   // V6 (#71): stroke his head; grid px across it, his favourite spot counts more (systems/pets.ts)
    const [x, y] = rsXY(ev), [hx, hy] = h.arg.split(',').map(Number), now = performance.now(), sp = DOG_SPOTS[N().dog.sweet] ?? DOG_SPOTS[0];
    rsCanvas.style.cursor = PK.ebCursor('hand'); hover.key = '';
    if (strokeAt && !S.g.paused) {
      const dx = Math.abs(x - strokeAt.x), dt = Math.max(1, now - strokeAt.t) / 1000, sweet = Math.hypot(x - hx - sp[0], y - hy - sp[1]) < 13;
      if (dx > 0.3) { petStroke(dx, dx / dt, sweet); dogStroked(sweet, x); }
    }
    strokeAt = { x, t: now };
    return;
  }
  strokeAt = null;
  rsCanvas.style.cursor = h?.act ? (h.act === 'phone' ? 'grab' : 'pointer') : 'default';
  deskPhoneHover = h?.act === 'phone';
  const tip = h?.tip ? deskTip(h.tip) : '';
  hover.key = tip ? `text:${tip}` : ''; hover.x = p.x; hover.y = p.y;
});
rsCanvas.addEventListener('pointerleave', () => { deskPhoneHover = false; strokeAt = null; });

// ---------- The phone in your hand (V8, #73; grid doc 7f): the renderer's phone over the battle area and the desk ----------
const phCanvas = el('phHand') as HTMLCanvasElement, phCtx = phCanvas.getContext('2d')!;
let phHits: { x: number; y: number; w: number; h: number; act: string; arg: string }[] = [], phLast = 0, phWas = false;
const PH_RISE_MS = 320;
function drawPhone() {
  const n = S.g.night, on = !!n && phoneShown() && PK.ready() && !S.g.paused;
  if (on !== phWas) { phWas = on; phCanvas.style.display = on ? 'block' : 'none'; el('phClose').style.display = on ? 'grid' : 'none'; if (!on) phHits = []; }
  if (!on) return;
  const now = performance.now(), k = Math.min(1, (now - (n!.phUp ?? 0)) / PH_RISE_MS), dy = Math.round((1 - (1 - (1 - k) ** 3)) * 540);
  phCanvas.style.transform = dy ? `translateY(${dy}px)` : '';
  el('phClose').dataset.act = n!.game?.kind === 'phone' ? 'closeGame' : phoneAction() ? 'preCancel' : 'preMenu';
  if (now - phLast < 33) return;   // 30 fps is plenty for a phone
  phLast = now;
  const r = PK.phone(phoneView(), now / 1000);
  phCtx.clearRect(0, 0, phCanvas.width, phCanvas.height); phCtx.drawImage(r.canvas, 0, 0);
  phHits = r.hits;
}
const phXY = (ev: PointerEvent | WheelEvent) => { const r = phCanvas.getBoundingClientRect(); return [((ev.clientX - r.left) / r.width) * phCanvas.width, ((ev.clientY - r.top) / r.height) * phCanvas.height] as const; };
const phHitAt = (x: number, y: number) => { for (let i = phHits.length - 1; i >= 0; i--) { const h = phHits[i]; if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) return h; } return null; };
phCanvas.addEventListener('pointerdown', ev => {
  if (!S.g.night || S.g.paused || ev.button !== 0) return;
  ev.preventDefault();
  const h = phHitAt(...phXY(ev));
  if (!h) return;
  if (h.act === 'slide') { drag = { id: 'answer', axis: 'x', dir: 1, dist: 148, x0: ev.clientX, y0: ev.clientY, t0: performance.now(), p: 0 }; return; }   // slide to answer: drag the knob
  if (h.act === 'faceHold') { setHold(true); return; }   // Face ID: hold
  actions[h.act]?.(h.arg);
});
phCanvas.addEventListener('pointermove', ev => { phCanvas.style.cursor = phHitAt(...phXY(ev)) ? 'pointer' : 'default'; });
phCanvas.addEventListener('wheel', ev => { if (N()?.phApp === 'babe' && !N().game) { ev.preventDefault(); phoneScroll(ev.deltaY < 0 ? 1 : -1); } }, { passive: false });   // her chat, a bubble at a time

// ---------- Render ----------
function render() {
  const g = S.g;
  const n = g.night;
  // the webcam and her panel (V4, #69): 15 fps, a webcam's own rate (reading the webcam back and dithering it costs a
  // few ms), on the frames the battle area and the panel skip; a click or a hover on the panel shows at once
  const tNow = performance.now();
  if (herDirty || (tNow - herLast >= 62 && (tNow - liveDrewAt() >= 8 || tNow - herLast >= 150))) { herLast = tNow; herDirty = false; drawDoor(doorCtx); drawHerPanel(); }
  // under the energy break the right screen is dimmed behind its window: drawn four times a second, for the dim
  const behind = !(n?.game?.kind === 'monster' && PK.ready()) || performance.now() - ebBgLast > 200;
  if (behind) {
    drawLiveRpg(el('rpgArea') as HTMLCanvasElement);
    drawLivePanel(el('spArea') as HTMLCanvasElement);   // #53: the Skill Tree tab in the renderer
    drawDesk();    // V3 (#68): the right screen round the monitor, drawn by the renderer
  }
  drawPhone();   // V8 (#73): the phone in your hand, drawn by the renderer
  drawEnergyBreak();   // V5 (#70): the energy break over the right screen, drawn by the renderer
  { const di = el('deskInner'), a = deskShake * 6, tt = performance.now() / 1000;   // the dog's slam: the whole desk jolts (V6)
    di.style.transform = a > 0.2 ? `translate(${Math.round(Math.sin(tt * 61) * a)}px, ${Math.round(Math.cos(tt * 47) * a * 0.7)}px)` : ''; }
  document.querySelector('.keyboard')?.classList.toggle('rogue', S.g.heroes.some(h => h.id === 'rogue'));   // V2 (#67): the battle area in the new look
  drawMonitor(monCtx, liveShown());
  if (n) {
    setHtml('hhTip', n.headset ? 'Click: headset off (H)' : 'Click: headset on (H)');
    setHtml('monUi', monUiLiveHtml());   // the run end card over the town; the rest of the RPG is the renderer's
    setHtml('winLayer', windowHtml());
    el('ui').classList.toggle('cv', livePanelShown());   // the panel is drawn by the renderer: the DOM keeps only its item windows
    setHtml('ui', livePanelShown() ? `<div class="sp-top cvtop ${N().location === 'town' ? 'cvtown' : ''}">${uiPopHtml()}</div>` : '');   // dark until the renderer's fonts load
    setHtml('toasts', toastsHtml());
    updateWindowDynamics();
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
