import './style.css';
import { launchHolds, skipLaunch, launchT, launchSeek } from './systems/launch';
import { stopLaunchSound, updateLaunchSound, launchFired } from './ui/launchSound';
import { fmtClock } from './core/fx';
import { on, rules, dayName, howtoTiles, howtoOpens } from './systems/week';
import './ios.css';
import { T } from './config/tuning';
import {  S, N, initialState } from './core/state';
import { startLoop } from './core/loop';
import { drawMonitor, MON_W, MON_H } from './ui/monitor';
import { drawDoor, doorHit, DOOR_W, DOOR_H } from './ui/door';
import { hover, tooltipHtml, entryIcon, uiPopHtml, screenHtml, debugHtml, toastsHtml } from './ui/panels';
import { toggleHeadset } from './systems/apartment';
import { initAudio, sfx, stopAmbience, audition, soundStatus, ambienceNow, loopPoints } from './ui/audio';
import { HOTKEYS, HERO_NAME, HERO_CLASS, HERO_COLORS } from './data/heroes';
import { queueAbility } from './systems/battle';
import { clickBagSlot, closeSelection, equipOn, dropSelected, useSelected, setHeroTab, equipItemOn, unequip } from './systems/bag';
import { skipDrop, rollBattleDrops, genItem, itemEntry, mapEntry, toggleLock } from './systems/loot';
import { choosePath, returnToTown, travelToDungeon, catchGoblin, pickStartFloor, debugEndFloor } from './systems/dungeon';
import { chooseCurio, endCurio } from './systems/curios';
import { toast } from './core/fx';
import { startPre, cancelPre } from './systems/preemptive';
import { useDevice, orderTea } from './systems/home';
import type { DeviceId } from './data/home';
import type { PreId } from './data/preemptive';
import { buildCity, openService, servicePick, serviceRun } from './systems/town';
import { monUiLiveHtml } from './ui/town';
import { altTab } from './systems/excel';
import { q4Sum, q4PromoOk } from './systems/q4';
import { q4Down, q4Move, q4Up, q4CursorKind, q4Dragging } from './render/q4View';
import { talkPick, openPhone, momReply, bossPick, closeGame, spawnInterrupt, answerSlide, answerSpeaker, phoneAction, setPhoneHold, textReply, togglePhoneDown, declineCall } from './systems/interrupts';
import { openMonster, cancelMonster } from './systems/monster';
import { monsterView, monsterTilt, monsterDown, monsterMove, monsterUp, monsterGrabbing, EB_SCENE } from './ui/monsterScene';
import { setPeeking } from './systems/peek';
import { drawLapFx, lapUiHtml } from './ui/deskFx';
import { morningView, morningScene } from './render/morningView';
import { cuddleView, winToCuddle, CUD_WIN } from './render/herWinView';
import { demandActive } from './systems/reallife';
import { PLAN, PLAN_MIRROR } from './ui/plan';
import { caughtTick, caughtT, caughtEnd, caughtShot } from './render/caughtView';
import { dogStroked, DOG_SPOTS } from './render/dogView';
import { GRID_W, GRID_H, STAGE_K, gridScale } from './render/grid';
import { drawPreview, setPreview, previewScene, type PreviewScene } from './render/preview';
import { maxHp } from './systems/stats';
import { swapHeroes, ensureParty, hookLine, shoveLine } from './systems/positions';
import { toggleAutocast, buyNode, respec } from './systems/tree';
import type { NodeId } from './data/trees';
import type { HeroId } from './core/state';
import { setRpgTip, rpgTipShown, type RpgTip } from './render/liveRpg';
import { setPanelPtr, shakeDx } from './render/rpgView';
import { canWear } from './systems/gear';
import { drawLiveRpg, liveHitAt, liveShown, livePointer, liveDragStart, liveDragEnd, liveDragging, drawLivePanel, panelHitAt, livePanelShown, liveDrewAt } from './render/liveRpg';
import { PK } from 'virtual:pagekit';
import { phoneShown, phoneView, shopFlashed, voiceUp } from './render/phoneView';
import { deskView, deskTip } from './render/deskView';
import { herView, herTip } from './render/herView';
import { herRead, phoneScroll, boysLog } from './systems/messages';
import { answer as lapAnswer, startLap } from './systems/lap';
import { triggerDog, triggerUnplug, petStroke, plugIn } from './systems/pets';
import { wakeUp } from './systems/tired';
import { triggerVisitNow, takePlate, chatAnswer, cuddleAnswer, hideCans, comingBabe } from './systems/visits';
import { takeAsk, startAsk } from './systems/asks';
import { lapSitAnswer, onLap } from './systems/lapsit';
import { openPhoto, closePhoto, sendSelfie } from './systems/selfies';
import { leanTo, leanNotch, leanFocus, leanView } from './systems/lean';
import { cuddlePointer, endCuddle } from './systems/cuddle';
import type { VisitKind, Room } from './core/state';
import { startNight, endNight, toMorning } from './systems/night';
import { load, wipeSave } from './systems/save';
import { addMood } from './systems/meters';
import { closeCoach } from './systems/coach';
import { shopBuy, owns } from './systems/shop';
import type { ShopId } from './data/shop';
import { COACH } from './data/tips';
// the renderer's hero tables read the game's names and classes (data/heroes.ts, the one table; cast of 2026-11-27)
PK.heroNames(Object.fromEntries((['knight', 'rogue', 'mage', 'healer'] as const).map(id => [id === 'healer' ? 'priest' : id, { name: HERO_NAME[id], cls: HERO_CLASS[id] }])));

(window as unknown as Record<string, unknown>).__lootnight = { S, audio: { soundStatus, ambienceNow, loopPoints }, herView: () => herView(), launch: { t: launchT, seek: launchSeek, skip: () => actions.dbgSkipLaunch(''), fired: launchFired } };   // test hook for the Playwright scripts

// ---------- DOM skeleton (#49, monitor-first; docs/design/screen.md) ----------
// Left: the webcam view and her panel. Right: the desk, with the monitor on top. All RPG UI lives inside the game
// screen (the battle canvas, its overlay and the side panel); the YOU card and the feed sit on the desk.
const stage = document.getElementById('stage')!;
stage.innerHTML = `
  <div id="door"><canvas id="doorCanvas" width="${DOOR_W}" height="${DOOR_H}"></canvas><canvas id="herArea" width="148" height="360"></canvas><div id="herNote" aria-hidden="true"></div><div id="headHit" data-act="headset" aria-label="Your head: click to put the headset on or off (H)"></div></div>
  <div id="desk">
    <div id="deskInner">
      <canvas id="rsArea" width="492" height="360"></canvas><div id="deskPhone" aria-hidden="true"></div><canvas id="ebArea" width="492" height="360"></canvas><canvas id="rsSmall" width="492" height="360"></canvas>
      <div id="screen">
        <canvas id="monitor" width="${MON_W}" height="${MON_H}"></canvas>
        <canvas id="rpgArea" width="334" height="232"></canvas><div id="rpgBar" aria-hidden="true"></div>
        <canvas id="spArea" width="140" height="232"></canvas><div id="spBag" aria-hidden="true"></div>
        <div id="monUi"></div>
        <div id="ui"></div>
        <div id="toasts"></div>
      </div>
      <canvas id="dogOv" width="492" height="360"></canvas>
      <div id="preUi"></div>
      <canvas id="phHand" width="126" height="252"></canvas><button id="phClose" data-act="closeGame" aria-label="Put the phone down"></button>
    </div>
  </div>
  <canvas id="lapFx" width="1280" height="720"></canvas>
  <div id="lapUi"></div>
  <div id="screens"></div>
  <canvas id="modalArea" width="640" height="360"></canvas>
  <canvas id="planArea" width="640" height="360"></canvas>
  <canvas id="morningArea" width="640" height="360"></canvas>
  <canvas id="coachArea" width="640" height="360"></canvas>
  <canvas id="tipArea" width="640" height="360"></canvas>
  <canvas id="pkFrame" width="${GRID_W}" height="${GRID_H}"></canvas>
  <div id="debug"></div>
  <div id="tooltipLayer"></div>
  <div id="ghost"></div>
  <canvas id="caughtArea" width="640" height="360"></canvas>
  <canvas id="microArea" width="640" height="360"></canvas>`;

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
  newGame: () => { wipeSave(); S.g = initialState(); S.g.day = (window as unknown as { __lnDay?: number }).__lnDay ?? 0; startNight(); },   // __lnDay: the tests start on a later night (test only)
  continue: () => { load(); startNight(); },
  startNight: () => startNight(),
  morning: () => toMorning(),
  resume: () => { S.g.paused = false; },
  howtoOpen: () => { S.g.paused = false; S.g.howto = true; S.g.howtoPage = 0; S.g.howtoAll = true; },   // the pause menu's How to play: all four cards (#124)
  howtoNext: () => { S.g.howtoPage = (S.g.howtoPage ?? 0) + 1; sfx.click(); },   // Next: the next card (#101, #124)
  howtoClose: () => { S.g.howto = false; S.g.voice = null; S.g.howtoPage = 0; S.g.howtoAll = false; },
  voiceOk: () => voiceOk(),   // the boys' chat at 20:00: Let's go (the week, #56)
  altTab: () => { if (S.g.night) altTab(); },
  showRpg: () => { if (S.g.night && N().monitor !== 'rpg') altTab(); },
  showExcel: () => { if (S.g.night && N().monitor !== 'excel') altTab(); },
  headset: () => { if (on('headset')) toggleHeadset(); },   // Tuesday on (#56)
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
  curioLeave: () => { toast('The party walks past.', '#a999bd'); endCurio(); },
  toTown: () => returnToTown(),
  goblin: () => catchGoblin(),   // the live battle area's goblin (V2)
  pickFloor: a => pickStartFloor(Number(a)),   // #52, 1.4: the town's floor picker
  gate: () => travelToDungeon(),
  sleep: () => endNight('sleep'),
  build: a => buildCity(a as 'training'),
  portal: () => travelToDungeon(),
  openPhone: () => openPhone(),
  openMonster: () => drinkOrInspect(),
  inspectClose: () => { inspectOpen = false; },
  inspectDrink: () => { inspectOpen = false; openMonster(); },
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
  phApp: a => { const n = N(); n.phApp = a as 'home'; n.phScroll = 0; n.home.pick = ''; if (a === 'babe') herRead(); sfx.click(); },
  // the Home app (step 6.2, #57): a device's sheet (speaker:kitchen picks the speaker in that room), its room, use it
  homePick: a => { const h = N().home, [id, room] = a.split(':'); h.pick = id as DeviceId | ''; if (room) h.pickRoom = room as Room; else if (id === 'vacuum') h.pickRoom = 'living'; sfx.click(); },
  homeRoom: a => { N().home.pickRoom = a as Room; sfx.click(); },
  homeUse: () => { const h = N().home; if (h.pick && useDevice(h.pick, h.pickRoom)) h.pick = ''; },
  homeTea: () => { orderTea(); },
  charge: () => startPre('charge'),
  comingBabe: () => comingBabe(),   // come to bed (#89): the night ends with her
  herAsk: () => takeAsk(),           // her towel, her wine (#93, #88)
  lapSitAnswer: a => lapSitAnswer(Number(a)),   // on your lap (#86)
  photoOpen: a => openPhoto(Number(a)),          // her photo (#92)
  photoClose: () => closePhoto(),
  photoNoop: () => {},
  shopTab: a => { N().shopTab = a as 'you'; sfx.click(); },
  shopBuy: a => { if (shopBuy(a as ShopId)) shopFlashed(a); else sfx.bad(); },
  phScroll: a => phoneScroll(a === 'end' ? 'end' : Number(a)),
  // Debug (F1)
  dbgSpeed: a => { S.g.timeScale = Number(a); },
  dbgLife: () => { S.g.realLifeOff = !S.g.realLifeOff; },   // #52, 1.1: nobody is home
  dbgVisit: a => triggerVisitNow((a || undefined) as VisitKind | undefined),
  dbgAsk: a => { const n = N(), ap = n.apt; if (n.visit.stage !== 'idle') return; ap.activity = a === 'wine' ? 'bath' : 'shower'; ap.room = 'bathroom'; ap.moving = 0; ap.asleep = false; ap.t = 60; ap.cued = false; startAsk(a as 'towel' | 'wine'); },
  dbgBath: () => { const ap = N().apt; ap.activity = 'bath'; ap.room = 'bathroom'; ap.moving = 0.5; ap.asleep = false; ap.t = 130; ap.cued = false; ap.ajar = true; ap.towelAsk = true; ap.wineAt = 110; },
  dbgSelfie: a => sendSelfie(a || undefined),   // her photo (#92)
  dbgLapSit: () => { const n = N(); if (n.visit.stage !== 'idle') return; triggerVisitNow('chat'); n.visit.lapSit = true; },   // the lap sit (#86)
  dbgBedTease: () => { const n = N(); if (n.visit.stage !== 'idle') return; triggerVisitNow('tease'); n.visit.bed = true; n.visit.from = 'night'; n.apt.asleep = false; },   // come to bed (#89)
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
  dbgSkipLaunch: () => { skipLaunch(); stopLaunchSound(); },   // the launch (#127): straight to its end, its sound stopped
  dbgDay: a => { S.g.day = Number(a); startNight(); S.g.howto = false; },   // the week (#56): play this night (0 = Monday) from 20:00
  dbgRogue: () => { if (!S.g.heroes.some(h => h.id === 'rogue')) { S.g.day = Math.max(1, S.g.day); ensureParty(); S.g.heroes.forEach(h => { h.hp = maxHp(h); }); } },   // #52, 1.7
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
// rect: the item's square in panel px; over: the drop target under it ('slot:weapon', 'hero:2', 'bag'); bad: class gear
// the hero it would land on can't wear (#113): the ghost wears a crimson ring and shakes on a slot or a card it can't go
let inv: { key: string; x0: number; y0: number; moved: boolean; shot?: HTMLCanvasElement; rect?: { x: number; y: number; w: number; h: number }; over?: string; bad?: boolean; ring?: HTMLCanvasElement } | null = null;
/** The item's own cell as the side panel drew it (grid px), for the drag ghost: the picked-up item looks the same as in the bag. */
function cellShot(h: { x: number; y: number; w: number; h: number }): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = h.w; c.height = h.h;
  c.getContext('2d')!.drawImage(el('spArea') as HTMLCanvasElement, h.x, h.y, h.w, h.h, 0, 0, h.w, h.h);
  return c;
}
/** The ghost's canvas: the cell with a 1 px border round it, crimson when it can't go on (the bag's ring, #113). */
function ghostCell(shot: HTMLCanvasElement, bad: boolean, c?: HTMLCanvasElement): HTMLCanvasElement {
  if (!c) { c = document.createElement('canvas'); c.width = shot.width + 2; c.height = shot.height + 2; c.className = 'ghost-cell'; c.style.width = `${c.width * 2}px`; c.style.height = `${c.height * 2}px`; }
  const g = c.getContext('2d')!; g.clearRect(0, 0, c.width, c.height); g.drawImage(shot, 1, 1);
  if (bad) { g.fillStyle = '#d23c5a'; g.fillRect(0, 0, c.width, 1); g.fillRect(0, c.height - 1, c.width, 1); g.fillRect(0, 0, 1, c.height); g.fillRect(c.width - 1, 0, 1, c.height); }
  return c;
}
const toStage = (ev: PointerEvent | MouseEvent) => { const r = stage.getBoundingClientRect(); return { x: (ev.clientX - r.left) / stageScale, y: (ev.clientY - r.top) / stageScale }; };
const ghost = () => el('ghost');
/** The ghost shakes (#113): the bag square's hops (shakeDx), in whole grid px (x2 on the stage). */
let ghostShakeAt = 0;
function shakeGhost() {
  const t0 = ghostShakeAt = performance.now(), dur = T.WRONG_CLASS_SHAKE_SEC * 1000;
  const step = () => {
    if (ghostShakeAt !== t0) return;
    const p = Math.min(1, (performance.now() - t0) / dur);
    ghost().style.transform = p < 1 ? `translateX(${shakeDx(p) * 2}px)` : '';
    if (p < 1) requestAnimationFrame(step);
  };
  step();
}
/** Held past PICKUP_HOLD_SEC, a bag item is picked up (#114): an open item window closes, so the gear slots it lights
 *  (and could land on) show. Let go without a drag, it is a click as before and selects the item. */
function pickUp(key: string) { window.setTimeout(() => { if (inv?.key === key && S.g.night) S.g.night.selected = null; }, T.PICKUP_HOLD_SEC * 1000); }
/** Where a drag would land: a gear slot ('slot:weapon'), a party card ('hero:2'), the bag ('bag'), or nowhere (''). */
function dropAt(ev: PointerEvent): string {
  const under = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
  const dropEl = under?.closest('[data-drop]') as HTMLElement | null;
  return under?.id === 'spArea' ? panelDrop(ev) : dropEl?.dataset.drop ?? '';
}
/** A bag item whose drop target can't wear it (class gear, #113): a party card under it, else the selected hero. */
function dragBad(key: string, over: string): boolean {
  const [kind, a] = key.split(':'), e = kind === 'bag' ? S.g.bag.find(x => x.id === a) : undefined;
  if (!e || e.kind !== 'item') return false;
  const [dk, dv] = over.split(':'), h = S.g.heroes[dk === 'hero' ? Number(dv) : N().heroTab];
  return !!h && !canWear(h, e.item);
}
/** Let go where it can't go: the item flies back to its square, then lands there (and shakes, if it was refused). */
let homeTimer = 0;
function ghostHome(rect: { x: number; y: number }, lift: string, id: string) {
  const g = ghost(), sp = el('spArea').getBoundingClientRect(), st = stage.getBoundingClientRect(), k = sp.width / 140 / stageScale;
  g.style.transition = `left ${T.GHOST_RETURN_SEC}s ease-in, top ${T.GHOST_RETURN_SEC}s ease-in`;
  void g.offsetWidth;
  g.style.left = `${(sp.left - st.left) / stageScale + (rect.x - 1) * k}px`; g.style.top = `${(sp.top - st.top) / stageScale + (rect.y - 1) * k}px`;
  clearTimeout(homeTimer);
  homeTimer = window.setTimeout(() => {
    g.style.display = 'none'; g.style.transition = ''; setPanelPtr({ lift: null });
    const n = S.g.night; if (n?.reject?.id === id) n.reject.t = T.WRONG_CLASS_SHAKE_SEC;   // it shakes once it's back in its square
  }, T.GHOST_RETURN_SEC * 1000);
}
function ghostDone() { clearTimeout(homeTimer); const g = ghost(); g.style.display = 'none'; g.style.transition = ''; g.style.transform = ''; ghostShakeAt = 0; setPanelPtr({ lift: null }); }

document.addEventListener('pointermove', ev => {
  const p = toStage(ev);
  if (inv) {
    if (!inv.moved && Math.hypot(ev.clientX - inv.x0, ev.clientY - inv.y0) > 6) {
      inv.moved = true;
      ghostDone();
      const [kind, a, b] = inv.key.split(':');
      const entry = kind === 'bag' ? S.g.bag.find(e => e.id === a) : kind === 'gear' ? (() => { const it = S.g.heroes[Number(a)]?.gear[b as 'weapon']; return it ? { kind: 'item' as const, id: it.id, item: it } : undefined; })() : undefined;
      const h = kind === 'hero' ? S.g.heroes[Number(a)] : null;
      ghost().innerHTML = entry && inv.shot ? '' : entry ? entryIcon(entry, 34) : h ? `<span class="ghost-hero" style="border-color:${HERO_COLORS[h.id]}">${HERO_NAME[h.id]} <small>${HERO_CLASS[h.id]}</small></span>` : '';
      if (entry && inv.shot) { inv.bad = dragBad(inv.key, ''); inv.ring = ghostCell(inv.shot, inv.bad); ghost().appendChild(inv.ring); }   // the item's own cell, at the grid's pixel (x2 on the stage)
      ghost().classList.toggle('hero', !!h); ghost().classList.toggle('cell', !!(entry && inv.shot)); ghost().style.display = 'block';
      if (entry && inv.shot) setPanelPtr({ lift: kind === 'bag' ? `bag:${a}` : `gear:${b}`, hover: null });   // in your hand: its square is empty
    }
    if (inv.moved) {
      const half = inv.ring ? inv.ring.width : 20; ghost().style.left = `${p.x - half}px`; ghost().style.top = `${p.y - half}px`; hover.key = '';
      if (inv.ring && inv.shot) {
        const over = dropAt(ev), bad = dragBad(inv.key, over);
        if (bad !== inv.bad) { inv.bad = bad; ghostCell(inv.shot, bad, inv.ring); }
        if (over !== inv.over) { inv.over = over; if (bad && /^(slot|hero):/.test(over)) shakeGhost(); }   // onto a slot or a card it can't go on
      }
    }
  } else if (!['rpgArea', 'spArea', 'rsArea', 'herArea', 'ebArea', 'headHit'].includes((ev.target as HTMLElement).id)) {   // the renderer's canvases (V2, V3) and his head (#103) set their own hover
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
    const { key, moved, rect, ring } = inv; inv = null; setPanelPtr({ hold: null });
    const [kind, a, b] = key.split(':');
    let went = false;
    if (!moved) { if (kind === 'bag') clickBagSlot(a); else if (kind === 'hero') actions.heroTab(a); }
    else {
      const [dk, dv] = dropAt(ev).split(':');
      if (kind === 'bag' && dk === 'slot') went = equipItemOn(a, N().heroTab, dv);
      else if (kind === 'bag' && dk === 'hero') went = equipItemOn(a, Number(dv));
      else if (kind === 'gear' && dk === 'bag') went = unequip(Number(a), b);
      else if (kind === 'hero' && dk === 'hero' && dv !== a) actions.swap(`${a},${dv}`);
    }
    // an item that didn't go anywhere goes back to its square (#113); anything else, the ghost just goes
    if (moved && ring && rect && !went) ghostHome(rect, kind === 'bag' ? `bag:${a}` : `gear:${b}`, kind === 'bag' ? a : '');
    else ghostDone();
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
  if (S.g.night?.game?.kind === 'cuddle') {   // V9 (#74): her heart follows the mouse anywhere, the hand only over her window
    const [x, y] = ebXY(ev), wx = x - CUD_WIN.x, wy = y - CUD_WIN.y;
    cuddlePointer(...winToCuddle(wx, wy));
    cudMouse = wx >= 0 && wy >= 0 && wx < CUD_WIN.w && wy < CUD_WIN.h ? [wx, wy] : null;
  }
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
  if (h.act === 'bagCell') { inv = { key: `bag:${h.arg}`, x0: ev.clientX, y0: ev.clientY, moved: false, shot: cellShot(h), rect: h }; setPanelPtr({ hold: { id: h.arg, at: performance.now() } }); pickUp(`bag:${h.arg}`); return; }   // held: its slot lights (#114)
  if (h.act === 'gearCell') { const it = S.g.heroes[N().heroTab]?.gear[h.arg as 'weapon']; if (it) inv = { key: `gear:${N().heroTab}:${h.arg}`, x0: ev.clientX, y0: ev.clientY, moved: false, shot: cellShot(h), rect: h }; return; }
  // a party card: a click picks the hero, a drag onto another card swaps their positions (the town had no reorder before)
  if (h.act === 'heroTab') { inv = { key: `hero:${h.arg}`, x0: ev.clientX, y0: ev.clientY, moved: false }; return; }
  actions[h.act]?.(h.arg);
});
el('spArea').addEventListener('pointermove', ev => {
  const [x, y] = spXY(ev), h = panelHitAt(x, y), p = toStage(ev);
  (el('spArea') as HTMLElement).style.cursor = h?.act ? 'pointer' : 'default';
  if (inv?.moved) return;
  setPanelPtr({ hover: h?.act === 'bagCell' ? h.arg : null });   // its ring, when the selected hero can't wear it (#113)
  hover.key = h?.tip ? (/^(bag|gear|hero|skill):|^autosalvage$/.test(h.tip) ? h.tip : `text:${h.tip}`) : ''; hover.x = p.x; hover.y = p.y;
  hover.src = 'rpg'; hover.area = 'sp'; hover.ax = x; hover.ay = y;
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
el('spArea').addEventListener('pointerleave', () => { hover.key = ''; setPanelPtr({ hover: null }); });
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
  hover.src = 'rpg'; hover.area = 'ba'; hover.ax = x; hover.ay = y;
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
  if (herHover && !herHits.some(h => `${h.act}:${h.arg}` === herHover)) { herHover = ''; if (hover.src === 'her') hover.key = ''; }   // the pill went away under a still pointer: so does its tip
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
// the eye (grid doc 7m): the pointer over the webcam view while you look at her during a tease (#85), 11 x 6 at 2x
const EYE_CURSOR = (() => {
  const c = document.createElement('canvas'); c.width = 22; c.height = 12; const g = c.getContext('2d')!;
  const rows = ['   xxxxx   ', ' xxmmmmmxx ', 'xmmmpppmmmx', 'xmmmpvpmmmx', ' xxmmmmmxx ', '   xxxxx   '];
  const col: Record<string, string> = { x: '#0c0a10', m: '#f2ecdc', p: '#7a4fa0', v: '#0c0a10' };
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (col[ch]) { g.fillStyle = col[ch]; g.fillRect(i * 2, j * 2, 2, 2); } }));
  return `url(${c.toDataURL()}) 11 6, default`;
})();
herCanvas.addEventListener('pointermove', ev => {
  const h = S.g.night ? herHitAt(ev) : null, p = toStage(ev);
  const overCam = !!S.g.night && camXY(ev)[1] < DOOR_H;
  if (S.g.night) S.g.night.looking = overCam && !h;   // during a tease, pointing at the webcam is looking at her (#85)
  const hit = !h && S.g.night && camXY(ev)[1] < DOOR_H ? doorHit(...camXY(ev)) : null;
  const tease = S.g.night?.visit.kind === 'tease' && S.g.night.visit.stage === 'in';
  herCanvas.style.cursor = h?.act ? 'pointer' : tease && overCam ? EYE_CURSOR : hit === 'plan' ? 'zoom-in' : hit === 'door' ? 'grab' : 'default';
  const hv = h?.act ? `${h.act}:${h.arg}` : ''; if (hv !== herHover) { herHover = hv; herDirty = true; }
  const tip = h?.tip ? (h.tip.startsWith('pre:') ? h.tip : herTip(h.tip) && `text:${herTip(h.tip)}`) : hit && !S.g.night?.peeking && !(tease && overCam) ? `text:${herTip(hit)}` : '';   // looking at her: no door tip in the way
  hover.key = tip || ''; hover.x = p.x; hover.y = p.y; hover.src = 'her';
});
herCanvas.addEventListener('pointerleave', () => { if (herHover) herDirty = true; herHover = ''; hover.key = ''; if (S.g.night) S.g.night.looking = false; });
// his head is the headset's button (#103): its tip is the shared one in her panel's look, not a DOM label of its own
el('headHit').addEventListener('pointermove', ev => { const p = toStage(ev); hover.key = S.g.night ? `text:${herTip('headset')}` : ''; hover.x = p.x; hover.y = p.y; hover.src = 'her'; });
el('headHit').addEventListener('pointerleave', () => { hover.key = ''; });
document.addEventListener('pointerup', () => { if (S.g.night) setPeeking(false); });
// lean in (#77): the mouse across the right screen leans, the wheel opens the door a notch, the right button looks closer
// the buttons as pointer events report them (a second button pressed or let go fires pointermove, not down or up)
const leanButtons = (ev: PointerEvent) => {
  const n = S.g.night;
  if (!n?.lean || ev.pointerType !== 'mouse') return;
  leanFocus((ev.buttons & 2) !== 0);
  if (!(ev.buttons & 1) && n.peeking) setPeeking(false);   // let go of the door (the right button may still be down)
};
document.addEventListener('pointermove', ev => { if (S.g.night?.lean) { leanTo((toStage(ev).x - 296) / 984); leanButtons(ev); } });
document.addEventListener('pointerdown', leanButtons, true);
document.addEventListener('wheel', ev => { if (!S.g.night?.lean) return; ev.preventDefault(); leanNotch(ev.deltaY < 0 ? 1 : -1); }, { passive: false });
document.addEventListener('contextmenu', ev => { if (S.g.night?.lean || S.g.night?.peeking) ev.preventDefault(); });
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

// A click outside the phone closes it, as its close box does (#104): not on the RPG (the monitor), not on anything that
// does something (a button, a desk thing, her panel's buttons, the door in the webcam). Runs after the clicks above.
document.addEventListener('pointerdown', ev => {
  if (!phWas || ev.button !== 0 || !S.g.night) return;
  const t = ev.target as HTMLElement;
  if (t.closest('#phHand, #phClose, #screen, [data-act], [data-item], [data-drag], [data-hold]')) return;
  if (t.id === 'rsArea' && deskHitAt(ev)?.act) return;
  if (t.id === 'herArea' && (herHitAt(ev)?.act || (camXY(ev)[1] < DOOR_H && doorHit(...camXY(ev))))) return;
  if (['rsSmall', 'ebArea', 'modalArea', 'microArea', 'dogOv', 'lapFx'].includes(t.id) && t.style.display !== 'none') return;   // a window of its own is up there
  const act = el('phClose').dataset.act;
  if (act) actions[act]?.('');
});

document.addEventListener('contextmenu', ev => {
  const it = (ev.target as HTMLElement).closest('[data-item]') as HTMLElement | null;
  if (!it || !S.g.night) return;
  ev.preventDefault();
  const [kind, a, b] = it.dataset.item!.split(':');
  if (kind === 'bag') equipItemOn(a, N().heroTab); else unequip(Number(a), b);
});

// Q4 (step 4, #55): the mouse on Excel, in the game screen's px (474 x 232); drags go on outside the monitor
const q4XY = (ev: PointerEvent) => { const r = monCanvas.getBoundingClientRect(); return [((ev.clientX - r.left) / r.width) * 474, ((ev.clientY - r.top) / r.height) * 232] as const; };
const q4On = () => { const n = S.g.night; return !!n && !S.g.paused && n.monitor === 'excel' && !n.switching && n.monitorOff <= 0 && !n.game; };
monCanvas.addEventListener('pointerdown', ev => {
  if (!q4On() || ev.button !== 0) return;
  if (q4Down(...q4XY(ev), performance.now())) ev.preventDefault();
});
monCanvas.addEventListener('pointermove', ev => {
  if (!q4On()) { monCanvas.style.cursor = 'default'; return; }
  const [x, y] = q4XY(ev), k = q4CursorKind(x, y);
  monCanvas.style.cursor = k === 'pointer' ? PK.q4Cursor('arrow') : PK.q4Cursor(k);
});
document.addEventListener('pointermove', ev => { if (q4Dragging() && S.g.night) q4Move(...q4XY(ev), performance.now()); });
document.addEventListener('pointerup', () => { if (q4Dragging()) q4Up(performance.now()); });

// Away from the desk (a pre-emptive action): nothing on the desk reacts, only the away card.
window.addEventListener('pointerdown', ev => {
  const t = ev.target as HTMLElement;
  if (S.g.night?.pre?.away && !S.g.paused && !t.closest('#preUi') && !t.closest('#rsSmall') && !t.closest('#debug') && !t.closest('#modalArea')) { ev.preventDefault(); ev.stopImmediatePropagation(); }
}, true);
// Alt-tab blackout: no input reaches anything until the switch finishes (window capture runs before every other listener).
window.addEventListener('pointerdown', ev => {
  if (S.g.night?.switching && !(ev.target as HTMLElement).closest('#debug')) { ev.preventDefault(); ev.stopImmediatePropagation(); }
}, true);

window.addEventListener('keydown', ev => {
  initAudio();
  const g = S.g;
  if (ev.key === 'F1') { ev.preventDefault(); g.debug = !g.debug; return; }
  if (g.screen === 'morning' && (ev.key === 'Escape' || ev.key === 'Enter')) { ev.preventDefault(); actions.startNight(''); return; }   // her pink button (V10)
  if (g.screen !== 'night' || !g.night) return;
  const n = g.night;
  if (inspectOpen) {   // the inspect window: G drinks, Esc or Enter closes it (V11)
    if (ev.key.toLowerCase() === 'g') { ev.preventDefault(); actions.inspectDrink(''); return; }
    if (ev.key === 'Escape' || ev.key === 'Enter') { ev.preventDefault(); actions.inspectClose(''); return; }
  }
  if (caughtT(performance.now()) >= 0) { ev.preventDefault(); caughtEnd(performance.now()); return; }   // her screen takes the key (V7)
  if (g.howto) { if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); if (g.voice) voiceOk(); else if (ev.key !== 'Escape' && howtoGame().next) actions.howtoNext(''); else actions.howtoClose(''); } return; }   // the voice note, the cards (Enter: the next one; Esc skips them): the night waits
  if (ev.key === 'Escape') { if (planOpen) { planOpen = false; return; } if (g.night?.photo) { closePhoto(); return; } g.paused = !g.paused; return; }   // her photo (#92): Esc closes it
  if (g.paused) return;
  if (n.switching) { ev.preventDefault(); return; }
  if (n.pre) { ev.preventDefault(); return; }     // busy with a pre-emptive action: hands full
  if (wakeUp()) { ev.preventDefault(); return; }
  if (ev.key === 'Tab') { ev.preventDefault(); altTab(); return; }
  const k = ev.key.toLowerCase();
  const handsFree = !n.game || (n.game.kind === 'phone' && !!n.game.speaker);   // a call on speaker keeps your hands free
  if (k === 'h' && handsFree && on('headset')) { toggleHeadset(); return; }
  if (k === 'g' && !n.game) { monsterKey(); return; }   // Goblin Fuel: the Drink button on the YOU card, its G keycap (V3)
  if (k === 'l' && hover.key) { const [kind, a, b] = hover.key.split(':'); const id = kind === 'bag' ? a : S.g.heroes[Number(a)]?.gear[b as 'weapon']?.id; if (id) toggleLock(id); return; }
  // The phone is touch only (#54, 3.2): no keys answer it. A call on speaker leaves your hands free, so the skill
  // keys and the rest still work while it lasts.
  if (n.game && !(n.game.kind === 'phone' && n.game.speaker)) {
    const gm = n.game;
    if (gm.kind === 'monster' && (ev.key === ' ' || ev.code === 'Space')) { ev.preventDefault(); monsterTilt(true); return; }   // Space tilts the can, wherever it is (#61, #62)
    return;
  }
  if (n.monitor === 'excel') {   // Q4: Space is AutoSum; Enter closes the promotion
    if (ev.key === ' ' || ev.code === 'Space') { ev.preventDefault(); if (!ev.repeat) q4Sum(); }
    else if (ev.key === 'Enter' && n.q4.promo) { ev.preventDefault(); q4PromoOk(); }
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
  if (!on('fuel')) return;   // Thursday on (#56)
  const coming = n.visit.stage !== 'idle' && n.visit.stage !== 'passing' && n.visit.stage !== 'in';
  if (coming && S.g.monsters > 0 && !n.cansHidden) hideCans();
  else if (!n.pre) drinkOrInspect();
}
/** The first reach for the drink shows what it is first (V11): Drink G in the window goes on to the break. */
function drinkOrInspect() {
  if (S.g.monsters > 0 && !S.g.tipsSeen.includes('inspect:fuel')) { S.g.tipsSeen.push('inspect:fuel'); inspectOpen = true; sfx.click(); return; }
  openMonster();
}

/** The shower panel covers the apartment map while she showers and you can hear it (docs/design/eye-candy.md). */

// ---------- The energy break (V5, #70; grid doc 7c): the renderer's window over the dimmed right screen ----------
const ebCanvas = el('ebArea') as HTMLCanvasElement, ebCtx = ebCanvas.getContext('2d')!;
let cudMouse: [number, number] | null = null;   // the cursor over her cuddle window (window px), or off it
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
  const v = !cab && PK.ready() ? monsterView() : null, cud = !cab && PK.ready() && S.g.night?.game?.kind === 'cuddle';
  ebCanvas.style.display = v || cab || cud ? 'block' : 'none';
  if (cud) {   // V9 (#74): the cuddle break in her window over the dimmed right screen, 30 fps
    ebOdd = !ebOdd; if (!ebOdd) return;
    const bg = now - ebBgLast > 250 ? rsCanvas : null; if (bg) ebBgLast = now;
    const r = PK.cuddle(bg, cuddleView(cudMouse), now / 1000);
    ebCtx.drawImage(r.canvas, 0, 0); ebHits = r.hits;
    return;
  }
  cudMouse = null;
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
    const n = S.g.night, key = n && on('fuel') && S.g.monsters > 0 ? String(Math.min(3, S.g.monsters)) : '';
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
  if (S.g.night?.game?.kind === 'cuddle') {   // your hand is the cursor over her window (drawn by the renderer)
    ebCanvas.style.cursor = h ? 'pointer' : cudMouse ? 'none' : 'default';
    hover.key = h ? `text:Pull away, back to the game. She won't like it (Mood +${T.CUDDLE_REFUSE_MOOD}).` : ''; hover.x = p.x; hover.y = p.y; hover.src = 'cud';
    return;
  }
  if (cableShown) {
    const on = inEbScene(x, y) && PK.cableMove(x - EB_SCENE.x, y - EB_SCENE.y);
    ebCanvas.style.cursor = h ? 'pointer' : on ? PK.ebCursor(PK.cableDragging() ? 'grab' : 'hand') : 'default';
    hover.key = h ? 'text:Close it. Click the dark monitor to come back to the cables.' : ''; hover.x = p.x; hover.y = p.y; hover.src = 'eb';
    return;
  }
  monsterMove(x - EB_SCENE.x, y - EB_SCENE.y);
  ebCanvas.style.cursor = h ? 'pointer' : inEbScene(x, y) && PK.ready() ? PK.ebCursor(monsterGrabbing() ? 'grab' : 'hand') : 'default';
  hover.key = h ? 'text:Stop the energy break. Before the can is open nothing is lost.' : ''; hover.x = p.x; hover.y = p.y; hover.src = 'eb';
});
document.addEventListener('pointerup', () => { if (cableShown) PK.cableUp(); if (S.g.night?.game?.kind === 'monster') { monsterUp(); ebCanvas.style.cursor = PK.ready() ? PK.ebCursor('hand') : 'default'; } });

(window as unknown as Record<string, unknown>).__lnCables = () => PK.cablePoints();   // for the tests

// Caught (V7, #72): the renderer's full-frame scare, then her screen held until a click or a key (or CAUGHT_HOLD_SEC).
// Clicks and keys during it go to it, never to the game under it.
const caughtCanvas = el('caughtArea') as HTMLCanvasElement, caughtCtx = caughtCanvas.getContext('2d')!;
function drawCaughtScreen() {
  const now = performance.now(); caughtTick(now);
  const t = PK.ready() ? caughtT(now) : -1;
  caughtCanvas.style.display = t >= 0 ? 'block' : 'none';
  if (t < 0) return;
  hover.key = '';
  const c = caughtShot();
  caughtCtx.drawImage(PK.caught(c.rung, t, c.line), 0, 0);
}
window.addEventListener('pointerdown', ev => {
  const now = performance.now();
  if (caughtT(now) < 0 || (ev.target as HTMLElement).closest('#debug')) return;
  ev.preventDefault(); ev.stopImmediatePropagation(); caughtEnd(now);
}, true);
// The plan (V9, #74): the renderer's blueprint off the wall over her panel; everything behind it dims. The sheet is
// drawn once; what is behind, four times a second (it is dimmed, and the plan is read, not played over).
const planCanvas = el('planArea') as HTMLCanvasElement, planCtx = planCanvas.getContext('2d')!;
const planFrame = document.createElement('canvas'); planFrame.width = 640; planFrame.height = 360;
let planHits: { x: number; y: number; w: number; h: number; act: string }[] = [], planAt = 0, planWas = false;
function drawPlanScreen() {
  const on = planOpen && PK.ready() && !!S.g.night && S.g.screen === 'night';
  if (on !== planWas) { planWas = on; planCanvas.style.display = on ? 'block' : 'none'; planAt = 0; if (!on) planHits = []; }
  if (!on) return;
  const now = performance.now(); if (now - planAt < 250) return; planAt = now;
  const f = planFrame.getContext('2d')!; f.drawImage(herCanvas, 0, 0); f.drawImage(rsCanvas, 148, 0);   // her panel and the right screen (the game screen is in it)
  const r = PK.plan(planFrame, owns('mirror') ? PLAN_MIRROR : PLAN, now / 1000);   // the hall mirror on it once you buy it (#77)
  planCtx.drawImage(r.canvas, 0, 0); planHits = r.hits;
}
const planXY = (ev: PointerEvent) => { const r = planCanvas.getBoundingClientRect(); return [((ev.clientX - r.left) / r.width) * 640, ((ev.clientY - r.top) / r.height) * 360] as const; };
const planHitAt = (ev: PointerEvent) => { const [x, y] = planXY(ev); return planHits.find(q => x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h) ?? null; };
planCanvas.addEventListener('pointerdown', ev => {   // the ✕ or a click outside the sheet closes it; a click on the sheet does nothing
  ev.preventDefault(); ev.stopPropagation();
  const h = planHitAt(ev);
  if (!h || h.act === 'planClose') { planOpen = false; sfx.click(); }
});
planCanvas.addEventListener('pointermove', ev => { const h = planHitAt(ev); planCanvas.style.cursor = !h || h.act === 'planClose' ? 'pointer' : 'default'; hover.key = ''; });

// The morning (V10, #75): her CG by how the night ended, the summary and the caption, all the renderer's. Still, so it
// is drawn again only when something changes (the renderer keeps the last picture).
const morningCanvas = el('morningArea') as HTMLCanvasElement, morningCtx = morningCanvas.getContext('2d')!;
let morningHits: { x: number; y: number; w: number; h: number; act: string }[] = [], morningHover = false;
function drawMorningScreen() {
  const on = S.g.screen === 'morning' && !!S.g.morning && PK.ready();
  morningCanvas.style.display = on ? 'block' : 'none';
  if (!on) return;
  const r = PK.morning(morningScene(), morningView(), morningHover);
  morningCtx.drawImage(r.canvas, 0, 0); morningHits = r.hits;
}
const morningHitAt = (ev: PointerEvent) => { const b = morningCanvas.getBoundingClientRect(), x = ((ev.clientX - b.left) / b.width) * 640, y = ((ev.clientY - b.top) / b.height) * 360; return morningHits.find(q => x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h) ?? null; };
morningCanvas.addEventListener('pointerdown', ev => { initAudio(); const h = morningHitAt(ev); if (h) { ev.preventDefault(); sfx.click(); actions[h.act]?.(''); } });
morningCanvas.addEventListener('pointermove', ev => { morningHover = !!morningHitAt(ev); morningCanvas.style.cursor = morningHover ? 'pointer' : 'default'; });
morningCanvas.addEventListener('pointerleave', () => { morningHover = false; });

// The small pieces (V11, #76; grid doc 7k), the renderer's. Full frame (#modalArea): pause and How to hide, with their
// buttons; the microsleep's lids (#microArea, no input of its own: any click or key wakes you). Over the right screen
// (#rsSmall): away from the PC and the Goblin Fuel inspect window. What is behind a dimmed piece is the frame the game
// shows (her panel and the right screen), dimmed four times a second, or once for the pieces that stop the night.
const frameCanvas = document.createElement('canvas'); frameCanvas.width = 640; frameCanvas.height = 360;
function composeFrame() { const f = frameCanvas.getContext('2d')!; f.drawImage(herCanvas, 0, 0); f.drawImage(rsCanvas, 148, 0); return frameCanvas; }
const modalCanvas = el('modalArea') as HTMLCanvasElement, modalCtx = modalCanvas.getContext('2d')!;
const microCanvas = el('microArea') as HTMLCanvasElement, microCtx = microCanvas.getContext('2d')!;
const rsSmallCanvas = el('rsSmall') as HTMLCanvasElement, rsSmallCtx = rsSmallCanvas.getContext('2d')!;
type SmHit = { x: number; y: number; w: number; h: number; act: string; arg: string };
let modalHits: SmHit[] = [], rsSmallHits: SmHit[] = [], modalWas = '', modalAt = 0, rsSmallAt = 0, rsSmallBg = 0, microAt = 0, inspectOpen = false;
/** Let's go on the boys' chat at 20:00 (the week, #56; #108): the phone goes down, the chat stays in The Boys' until the
 *  next call; How to hide next on a night with a new tile, else the night starts. */
function voiceOk() {
  const v = S.g.voice;
  if (!v || launchHolds()) return;   // the first Monday: nothing starts the night before Age of Judgment has loaded (#127)
  boysLog([['sys', v.date], ...v.chat.map(([w, s]) => ['l', `${w}: ${s}`] as ['l', string])]);   // their chat stays in The Boys (#102)
  S.g.voice = null; S.g.howto = howtoOpens(); sfx.click();
}
// The cards before the night (#124): the first Monday (and the pause menu's How to play) shows all four, one area
// each: the party, How to hide, the job, tonight's stars. A later night with a new tile shows How to hide and the
// stars (#101). Each card's tiles and its foot are about its own area only.
const HOWTO_ANSWER = {
  mon: 'Quick light steps: she checks your screen, so have Excel up. Plates clinking: a snack. She only looks at the desk; take the plate from her note, it heals the party.',
  tue: 'Quick light steps: she checks your screen, so have Excel up. Plates clinking: a snack; take the plate. Humming: a chat. Excel up, headset off, answer her.',
  thu: 'Quick light steps: she checks your screen. Plates clinking: a snack; hide your cans (G), take the plate. Humming: a chat; headset off, answer her. Slow steps: a cuddle.',
};
type HowtoCardId = 'party' | 'her' | 'job' | 'stars';
function howtoDeck(): HowtoCardId[] { return rules().day === 0 || S.g.howtoAll ? ['party', 'her', 'job', 'stars'] : ['her', 'stars']; }
function howtoGame() {
  const deck = howtoDeck(), page = Math.min(S.g.howtoPage ?? 0, deck.length - 1), id = deck[page];
  const base = { head: `${dayName()}, 20:00`, isNew: [] as string[], next: page < deck.length - 1, page: deck.length > 2 ? [page + 1, deck.length] : null };
  if (id === 'party') return { ...base, kicker: 'Your party', title: 'The party fights by itself.', ids: ['runs', 'skills', 'loot', 'bank'],
    tiles: {
      runs: ['Runs', 'Go down through the Dungeon Portal. The party walks and fights on its own, floor after floor. At each floor\'s end you pick the next floor on the map.'],
      skills: ['Skills', 'Each hero\'s skills sit under the fight. Press a lit one\'s key to cast it: 1, Z, Q or A. Grey ones are locked, or have nothing to hit.'],
      loot: ['Loot', 'Drops land where enemies fall; the front hero picks them up. A green arrow marks an upgrade: right-click it to equip. Weapons, helms and armor fit one class.'],
      bank: ['Bank it', 'A run\'s loot is safe once the town portal (top left, between fights) takes you to the city. If the whole party falls, the run\'s loot and gold are lost.'],
    },
    foot: `In the city, sell loot to the Merchant for gold or melt it at the Salvage Forge for Souls, then spend them on buildings and skills. Each trip costs ${T.COST_TRAVEL_MIN} minutes of the night.`,
  };
  if (id === 'job') return { ...base, kicker: 'Your job', title: 'Excel is your cover. It pays, too.', ids: ['cover', 'work', 'spend'],
    tiles: {
      cover: ['Your cover', 'Tab (or the taskbar) flips between the game and Excel. The party fights on behind it, but without your skills.'],
      work: ['Work', `Click the sheet to earn dollars: Sum (or Space), drag the corner of the Fill cell, Sort for x${T.Q4_SORT_MULT}. Right after you tab in, Hustle pays up to x${T.Q4_HUSTLE_MAX}.`],
      spend: ['Spend', 'Dollars buy macros in Excel\'s right pane (they earn while you play) and things in the Shop on your phone: flowers for her, upgrades for you.'],
    },
    foot: 'When she peeks, keep working: busy, she leaves sooner; idle, she lingers and asks what you are doing.',
  };
  if (id === 'stars') {   // tonight's stars (#101): what a good night is (the sticky note's old job)
    const f = N().deepTarget, end = rules().end;
    return { ...base, ids: ['deep', 'unseen', 'sweet'], kicker: 'Tonight', title: 'Three stars make a good night.', floor: f,
      tiles: {
        deep: [`Floor ${f}`, `Reach floor ${f} in any run tonight, and a chest with an item waits in the morning.`],
        unseen: ["Don't get caught", `Never let her see the game, and she starts tomorrow with ${T.STAR_UNSEEN_GOODWILL} more Goodwill.`],
        sweet: ['Keep her happy', 'Log off before the tag by her name says furious, and she makes you breakfast.'],
      },
      foot: `Stars count when you log off with Sleep on the taskbar, from ${fmtClock(T.EARLIEST_SLEEP)}.${end ? ` Tonight the night also ends by itself at ${fmtClock(end)}, your run banked.` : ''} If she pulls the plug, you get none.`,
    };
  }
  const k = howtoTiles();
  return { ...base, ids: k.ids, isNew: k.isNew,
    tiles: {
      listen: ['Listen', 'Her TV, the kettle, the shower: you hear where she is. The line under your door names the last sound. Footsteps mean she is coming to you.'],
      tab: ['Tab to Excel', 'Footsteps? Press Tab now. Switching takes a second or two, so never wait for the handle. If she sees the game, you are caught.'],
      peek: ['Peek', 'Hold your door to open it a crack and see where she is. The wider it opens, the more you see, and the more she can see you.'],
      answer: ['What she wants', HOWTO_ANSWER[k.answer]],
      headset: ['Headset (H)', 'Click your head or press H. After 30 s you are in the Zone: faster Flow, more loot. But you cannot hear her coming.'],
      lean: ['Lean in', 'Hold the door open: you lean in and see what she is doing. Move the mouse to look. While you look you cannot play, and she can see you.'],
    },
    foot: 'Her hearts are her patience. It wears thin as the night goes on; every visit you get through wins some back, and every catch costs a lot and weakens the party for a while. When it runs out, she pulls the plug and the night starts over.',
  };
}
function inspectView() {
  const pct = (v: number) => Math.round(Math.abs(v) * 100);
  return {
    cans: S.g.monsters, max: Math.max(T.MONSTER_DRAWER, S.g.monsters),
    bullets: [['+', `Party ${pct(T.MONSTER_SPEED)}% faster for ${T.MONSTER_BOOST_SEC} s.`], ['+', `Tiredness ${T.MONSTER_TIRED}.`],
      ['-', `Then a sugar crash: ${pct(T.MONSTER_CRASH_SPEED)}% slower for ${T.MONSTER_CRASH_SEC} s, Tiredness +${T.MONSTER_CRASH_TIRED}.`]],
    pour: `Pour it well: ${pct(T.MONSTER_DRINK_FULL)}% down for the full boost, ${pct(T.MONSTER_DRINK_HALF)}% for half.`,
    shop: { zl: T.SHOP_ZL.fuel, cans: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'][T.SHOP_FUEL_CANS] ?? String(T.SHOP_FUEL_CANS) }, tag: rules().isNew.includes('fuel') ? 'New tonight' : '',
  };
}
function drawSmallPieces() {
  const g = S.g, n = g.night, now = performance.now(), t = now / 1000, ready = PK.ready() && !!n && g.screen === 'night';
  // the inspect window opens by itself the first time the drink matters: tired enough to yawn (the Drink button lights)
  if (ready && !inspectOpen && on('fuel') && g.monsters > 0 && !g.tipsSeen.includes('inspect:fuel') && !g.paused && !g.howto && n.tired >= T.TIRED_YAWN && !demandActive() && !n.switching && n.monitor === 'rpg') { g.tipsSeen.push('inspect:fuel'); inspectOpen = true; }
  if (inspectOpen && (!ready || n.game || n.pre || n.switching)) inspectOpen = false;
  // pause, How to hide
  const modal = !ready ? '' : g.paused ? 'pause' : g.howto && !g.voice ? `howto${g.howtoPage ?? 0}` : n.photo ? 'photo' : '';   // each card draws its own dimmed frame (#124: they differ in height)   // the boys' chat comes first (#56); her photo beside the phone (#92)
  if (modal !== modalWas) { modalWas = modal; modalCanvas.style.display = modal ? 'block' : 'none'; modalAt = 0; if (!modal) modalHits = []; }
  if (modal && now - modalAt >= 66) {
    const first = modalAt === 0; modalAt = now;
    if (modal === 'photo') modalCtx.clearRect(0, 0, modalCanvas.width, modalCanvas.height);
    const r = modal === 'pause' ? PK.pause(t) : modal === 'photo' ? PK.photo(n!.photo!.key, n!.photo!.t, { first: n!.photo!.first, time: fmtClock(n!.photo!.clock) }) : PK.howto(first ? composeFrame() : null, howtoGame(), t, false);
    modalCtx.drawImage(r.canvas, 0, 0); modalHits = r.hits;
  }
  // the microsleep: the lids close over the frame; shut, zzz
  const lid = ready && !g.paused ? (n.blink.state === 'open' ? 0 : n.blink.state === 'closed' ? 1 : n.blink.lid) : 0;
  microCanvas.style.display = lid > 0 ? 'block' : 'none';
  if (lid > 0 && (lid >= 1 || now - microAt >= 50)) {   // closing: 20 fps (the frame through the lids, greyed); shut: the renderer keeps it
    microAt = now;
    microCtx.drawImage(PK.micro(lid >= 1 ? null : composeFrame(), lid, t).canvas, 0, 0);
  }
  // over the right screen: away from the PC, the inspect window
  const p = ready ? n.pre : null, away = !!p && p.away && !g.paused;
  const rs = away ? 'away' : inspectOpen && !g.paused ? 'inspect' : ready && n.lean && !g.paused ? 'lean' : '';   // lean in (#77): his view through the crack
  rsSmallCanvas.style.display = rs ? 'block' : 'none';
  rsSmallCanvas.style.cursor = rs === 'lean' ? 'none' : '';   // leaning, the pointer is his head
  if (!rs) { rsSmallHits = []; return; }
  if (now - rsSmallAt < 33) return; rsSmallAt = now;
  if (rs === 'lean') { rsSmallCtx.drawImage(PK.lean(leanView(t)), 0, 0); rsSmallHits = []; return; }
  const bg = now - rsSmallBg > 250 ? rsCanvas : null; if (bg) rsSmallBg = now;
  const what = p?.id === 'charge' ? 'Charging your phone' : p?.id === 'towel' ? 'Bringing her a towel' : p?.id === 'wine' ? 'Bringing her wine' : 'Away from the PC';   // the away card says why (V13)
  const r = rs === 'away'
    ? PK.away(bg, { what, left: p!.t, total: p!.max }, t)
    : PK.inspect(bg, inspectView(), t);
  rsSmallCtx.drawImage(r.canvas, 0, 0); rsSmallHits = r.hits;
}
const smXY = (c: HTMLCanvasElement, ev: PointerEvent) => { const b = c.getBoundingClientRect(); return [((ev.clientX - b.left) / b.width) * c.width, ((ev.clientY - b.top) / b.height) * c.height] as const; };
const smHitAt = (hits: SmHit[], x: number, y: number) => hits.find(q => x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h) ?? null;
for (const [c, hits] of [[modalCanvas, () => modalHits], [rsSmallCanvas, () => rsSmallHits]] as const) {
  c.addEventListener('pointerdown', ev => {
    ev.preventDefault(); initAudio();
    const h = smHitAt(hits(), ...smXY(c, ev));
    if (h) { sfx.click(); actions[h.act]?.(h.arg); modalAt = 0; }
  });
  c.addEventListener('pointermove', ev => { c.style.cursor = smHitAt(hits(), ...smXY(c, ev)) ? 'pointer' : 'default'; hover.key = ''; });
}

// Coach marks (V11, #76): the renderer's ring and callout over the frame; the pointer goes through to what it points
// at, except on the callout (its close box closes it).
const coachCanvas = el('coachArea') as HTMLCanvasElement, coachCtx = coachCanvas.getContext('2d')!;
let coachHits: SmHit[] = [], coachAt = 0;
function drawCoachScreen() {
  const g = S.g, c = g.night?.coach, now = performance.now();
  const on = !!c && PK.ready() && g.screen === 'night' && !g.paused && !g.howto && !g.night?.scare && caughtT(now) < 0 && !inspectOpen;
  coachCanvas.style.display = on ? 'block' : 'none';
  if (!on) { coachHits = []; return; }
  if (now - coachAt < 66) return; coachAt = now;   // the ring marches at 15 fps
  const d = COACH[c!.id], r = PK.coach(c!.id, { title: d.title, text: d.text }, now / 1000);
  coachCtx.clearRect(0, 0, 640, 360); coachCtx.drawImage(r.canvas, 0, 0); coachHits = r.hits;
}
window.addEventListener('pointerdown', ev => {
  if (!coachHits.length || coachCanvas.style.display !== 'block') return;
  const [x, y] = smXY(coachCanvas, ev), h = smHitAt(coachHits, x, y);
  if (!h) return;
  ev.preventDefault(); ev.stopImmediatePropagation();
  if (h.act) { sfx.click(); actions[h.act]?.(''); coachAt = 0; }
}, true);

// Tooltips (V11, #76; grid doc 7k): the look of where the pointer is. The desk's glass on the desk, Windows 98's yellow
// on the PC's taskbar, her paper on her panel and her windows, the RPG's leather card in the game screen (drawn by the
// battle area or the panel). Items keep their DOM card (the side panel's item details).
const tipCanvas = el('tipArea') as HTMLCanvasElement, tipCtx = tipCanvas.getContext('2d')!;
const PC_TIPS = new Set(['tab:rpg', 'tab:excel', 'sleep', 'witching']);
type TipModel = { style: 'desk' | 'pc' | 'her'; title?: string; key?: string; lines: [string, string][]; note?: string };
/** The DOM tooltip's HTML as card lines: the name, plain lines, and its coloured notes as + (green), - (red) or a note. */
function htmlLines(html: string): [string, string][] {
  const box = document.createElement('div'); box.innerHTML = html;
  const root = box.querySelector('.tooltip') ?? box, out: [string, string][] = [];
  for (const e of Array.from(root.children) as HTMLElement[]) {
    const t = (e.textContent ?? '').replace(/\s+/g, ' ').trim(); if (!t) continue;
    const col = e.style.color;
    if (e.classList.contains('tt-name')) out.push(['h', t]);
    else if (e.classList.contains('tt-class')) out.push(['c', t]);   // the hero's class, drawn in its class colour
    else if (col === 'rgb(255, 138, 128)') out.push(['-', t]);
    else if (col === 'rgb(159, 224, 138)') out.push(['+', t]);
    else if (e.classList.contains('tt-sub') || e.classList.contains('tt-hint')) out.push(['n', t]);
    else out.push(['b', t]);
  }
  return out;
}
const titled = (s: string): TipModel => { const m = /^([^:.]{2,24}): (.+)$/.exec(s); return m ? { style: 'her', title: m[1], lines: [['', m[2][0].toUpperCase() + m[2].slice(1)]] } : { style: 'her', lines: [['', s]] }; };
function realTip(): TipModel | null {
  const k = hover.key, n = S.g.night;
  if (!k || !n) return null;
  if (hover.src === 'desk' && k.startsWith('desk:')) {
    const id = k.slice(5);
    if (PC_TIPS.has(id)) return { style: 'pc', lines: [['', deskTip(id)]] };
    if (id === 'drink' && S.g.monsters > 0) {
      const pct = (v: number) => Math.round(Math.abs(v) * 100);
      return { style: 'desk', title: 'Goblin Fuel', key: 'Drink (G)', lines: [['+', `Party ${pct(T.MONSTER_SPEED)}% faster for ${T.MONSTER_BOOST_SEC} s, Tiredness ${T.MONSTER_TIRED}.`], ['-', `Then a crash: ${pct(T.MONSTER_CRASH_SPEED)}% slower for ${T.MONSTER_CRASH_SEC} s.`], ['', 'While she is coming, G hides the cans.']], note: `${S.g.monsters} of ${Math.max(T.MONSTER_DRAWER, S.g.monsters)} in the drawer.` };
    }
    return { style: 'desk', lines: [['', deskTip(id)]] };
  }
  if (hover.src === 'eb' && k.startsWith('text:')) return { style: 'desk', lines: [['', k.slice(5)]] };
  if ((hover.src === 'her' || hover.src === 'cud') && k.startsWith('text:')) return titled(k.slice(5));
  if (hover.src === 'her' && k.startsWith('pre:')) { const L = htmlLines(tooltipHtml()), h = L.find(l => l[0] === 'h'); return { style: 'her', title: h?.[1], lines: L.filter(l => l[0] !== 'h').map(([, t]) => ['', t] as [string, string]) }; }
  return null;
}
function rpgTipNow(): RpgTip | null {
  const k = hover.key;
  if (!k || hover.src !== 'rpg' || !/^(text|skill|hero):|^autosalvage$/.test(k)) return null;
  const lines: [string, string][] = k.startsWith('text:') ? [['b', k.slice(5)]] : k === 'autosalvage' ? [['h', 'Auto-salvage'], ['b', 'Common and uncommon drops turn straight into Souls.']] : htmlLines(tooltipHtml());
  return lines.length ? { area: hover.area as 'ba' | 'sp', x: hover.ax, y: hover.ay, w: hover.area === 'sp' ? 132 : 150, lines } : null;
}
function drawTips() {
  const g = S.g, quiet = !g.night || inv?.moved || g.screen !== 'night' || g.paused || g.howto;
  const real = quiet || !PK.ready() ? null : realTip(), rpg = quiet || !PK.ready() ? null : rpgTipNow();
  setRpgTip(rpg);
  tipCanvas.style.display = real ? 'block' : 'none';
  if (real) { tipCtx.clearRect(0, 0, 640, 360); tipCtx.drawImage(PK.tip(real, Math.round(hover.x / 2), Math.round(hover.y / 2)), 0, 0); }
  setHtml('tooltipLayer', quiet || real || (rpg && rpgTipShown()) ? '' : tooltipHtml());
}

(window as unknown as Record<string, unknown>).__lnPhone = () => { const r = phCanvas.getBoundingClientRect(); return phHits.map(h => ({ act: h.act, arg: h.arg, x: r.left + (h.x + h.w / 2) * r.width / phCanvas.width, y: r.top + (h.y + h.h / 2) * r.height / phCanvas.height })); };   // for the tests
(window as unknown as Record<string, unknown>).__lnCoach = () => coachHits;   // for the tests: the close box, then the callout
(window as unknown as Record<string, unknown>).__lnShakeDx = shakeDx;   // for the tests: the shake's hops (#114)
(window as unknown as Record<string, unknown>).__lnCaught = () => ({ t: caughtT(performance.now()), ...caughtShot() });   // for the tests
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
  hover.key = h?.tip && deskTip(h.tip) ? `desk:${h.tip}` : ''; hover.x = p.x; hover.y = p.y; hover.src = 'desk';   // the tooltip's look follows the key (V11)
});
rsCanvas.addEventListener('pointerleave', () => { deskPhoneHover = false; strokeAt = null; });

// ---------- The phone in your hand (V8, #73; grid doc 7f): the renderer's phone over the battle area and the desk ----------
const phCanvas = el('phHand') as HTMLCanvasElement, phCtx = phCanvas.getContext('2d')!;
let phHits: { x: number; y: number; w: number; h: number; act: string; arg: string }[] = [], phLast = 0, phWas = false;
const PH_RISE_MS = 320;
let phCloseArt = false;
function drawPhone() {
  const n = S.g.night, on = !!n && phoneShown() && PK.ready() && !S.g.paused;
  if (!phCloseArt && PK.ready()) {   // the close box in pixels (#104): the renderer's, set once as the button's picture
    phCloseArt = true; const b = el('phClose');
    b.style.setProperty('--x', `url(${PK.closeBox(false).toDataURL()})`); b.style.setProperty('--x-hot', `url(${PK.closeBox(true).toDataURL()})`);
  }
  if (on !== phWas) { phWas = on; phCanvas.style.display = on ? 'block' : 'none'; el('phClose').style.display = on ? 'block' : 'none'; if (!on) phHits = []; }
  if (!on) return;
  const now = performance.now(), k = Math.min(1, (now - (n!.phUp ?? 0)) / PH_RISE_MS), dy = Math.round((1 - (1 - (1 - k) ** 3)) * 540);
  phCanvas.style.transform = dy ? `translateY(${dy}px)` : '';
  el('phClose').style.visibility = launchHolds() ? 'hidden' : '';   // the launch (#127): not escapable, it sets the mood; its 38 s are the night's waiting
  el('phClose').dataset.act = voiceUp() ? 'voiceOk' : n!.game?.kind === 'phone' ? 'closeGame' : phoneAction() ? 'preCancel' : 'preMenu';
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
  const tNow = performance.now(), covered = PK.ready() && caughtT(tNow) >= 0;   // her caught screen covers the whole frame (V7): nothing under it draws
  if (!covered && (herDirty || (tNow - herLast >= 62 && (tNow - liveDrewAt() >= 8 || tNow - herLast >= 150)))) { herLast = tNow; herDirty = false; drawDoor(doorCtx); drawHerPanel(); }
  // under the energy break the right screen is dimmed behind its window: drawn four times a second, for the dim
  const behind = !((n?.game?.kind === 'monster' || n?.game?.kind === 'cuddle') && PK.ready()) || performance.now() - ebBgLast > 200;
  if (behind && !covered) {
    drawLiveRpg(el('rpgArea') as HTMLCanvasElement);
    drawLivePanel(el('spArea') as HTMLCanvasElement);   // #53: the Skill Tree tab in the renderer
    drawDesk();    // V3 (#68): the right screen round the monitor, drawn by the renderer
  }
  drawPhone();   // V8 (#73): the phone in your hand, drawn by the renderer
  updateLaunchSound();   // the launch's sound and music (#127), on its clock
  drawEnergyBreak();   // V5 (#70): the energy break over the right screen, drawn by the renderer
  { const di = el('deskInner'), a = deskShake * 6, tt = performance.now() / 1000;   // the dog's slam: the whole desk jolts (V6)
    di.style.transform = a > 0.2 ? `translate(${Math.round(Math.sin(tt * 61) * a)}px, ${Math.round(Math.cos(tt * 47) * a * 0.7)}px)` : ''; }
  document.querySelector('.keyboard')?.classList.toggle('rogue', S.g.heroes.some(h => h.id === 'rogue'));   // V2 (#67): the battle area in the new look
  drawMonitor(monCtx, liveShown());
  if (n) {
    el('headHit').style.display = on('headset') ? 'block' : 'none';   // Tuesday's (#56): nothing to click on Monday (#103)
    setHtml('monUi', monUiLiveHtml());   // the run end card over the town; the rest of the RPG is the renderer's
    el('ui').classList.toggle('cv', livePanelShown());   // the panel is drawn by the renderer: the DOM keeps only its item windows
    setHtml('ui', livePanelShown() ? `<div class="sp-top cvtop ${N().location === 'town' ? 'cvtown' : ''}">${uiPopHtml()}</div>` : '');   // dark until the renderer's fonts load
    setHtml('toasts', toastsHtml());
    drawLapFx();
    if (onLap() && PK.ready()) {   // the lap sit (#86): the back of her head over the battle's left third; you play around her
      const lc = (el('lapFx') as HTMLCanvasElement).getContext('2d')!; lc.imageSmoothingEnabled = false;
      lc.drawImage(PK.lap(performance.now() / 1000, { say: n.lapSay?.text, mouse: n.lapMouse > 0 }), 0, 0, 1280, 720);
    }
    setHtml('lapUi', lapUiHtml());
    el('desk').classList.toggle('yawn', n.yawn > 0);
    el('ui').classList.toggle('off', n.monitor === 'excel' || n.monitorOff > 0 || !!n.switching);   // the side panel is on the screen: it goes with it
  }
  if (g.screen !== 'night' || g.paused || g.howto) stopAmbience();   // her TV does not follow you to the title or the morning
  setHtml('screens', screenHtml());
  drawMorningScreen();   // V10 (#75): the morning, drawn by the renderer
  if (!g.night || g.screen !== 'night') planOpen = false;
  drawPlanScreen();   // V9 (#74): the plan off the wall, drawn by the renderer
  drawCoachScreen();   // V11 (#76): the coach mark, the renderer's; never over the caught screen
  setHtml('debug', debugHtml());
  drawPreview(el('pkFrame') as HTMLCanvasElement);
  drawCaughtScreen();   // V7 (#72)
  drawSmallPieces();   // V11 (#76): pause, How to hide, the microsleep, away from the PC, the Goblin Fuel inspect
  drawTips();   // V11 (#76): the tooltip in the look of where the pointer is; the DOM one for items
}

startLoop(render);
