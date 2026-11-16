import { T } from '../config/tuning';
import { N } from '../core/state';
import { chance, pick } from '../core/rng';
import { addMood, moodZone } from './meters';
import { toast } from '../core/fx';
import { sfx } from '../ui/audio';
import { PEEK_PASS, PEEK_CAUGHT, FAKEOUT_LINES } from '../data/content';
import { maybeLap } from './lap';
import { updateApartment, afterVisit, sendHerSoon, hearsApartment, initApartment } from './apartment';

// Night 1: Peek visits only (docs/design/her.md). Her movements come from apartment.ts.
const FAR = T.TELEGRAPH_SEC.far - T.TELEGRAPH_SEC.hall;
const HALL = T.TELEGRAPH_SEC.hall - T.TELEGRAPH_SEC.handle;
const HANDLE = T.TELEGRAPH_SEC.handle;
let stepTimer = 0;

export function initVisits() {
  const v = N().visit;
  v.stage = 'idle'; v.checked = false; v.result = '';
  initApartment();
  N().apt.lastVisitEnd = -(T.DOOR_MAX_GAP_SEC - T.VISIT_FIRST_DELAY_SEC);
}

function endVisit() { const v = N().visit; v.stage = 'idle'; v.checked = false; afterVisit(); }

export function startVisit(woken = false) {
  const v = N().visit;
  if (v.stage !== 'idle') return;
  v.stage = 'far'; v.t = FAR; v.fake = !woken && chance(T.FAKEOUT_CHANCE); v.checked = false; v.result = '';
  v.from = woken ? 'sleep' : N().apt.activity;
  v.lean = !woken && !v.fake && moodZone(N().mood) === 'green' && chance(T.LEAN_CHANCE);
}
export const visitSooner = () => sendHerSoon();
export const triggerVisitNow = () => startVisit();

export function updateVisits(dt: number) {
  const n = N();
  const v = n.visit;
  n.scare = Math.max(0, n.scare - dt);
  if (n.lap) return;                 // she is on your desk: the apartment waits
  if (v.stage === 'idle') {
    const r = updateApartment(dt);
    if (r) startVisit(r === 'wake');
    return;
  }
  v.t -= dt;
  if (v.stage === 'far' || v.stage === 'hall' || v.stage === 'passing') {
    stepTimer -= dt;
    if (stepTimer <= 0) {
      stepTimer = 0.45;
      sfx.step(v.stage === 'hall' ? 0.7 : v.stage === 'passing' ? 0.25 : 0.35);
      if (hearsApartment()) { n.apt.heard = 'hallway'; n.apt.heardWhat = 'STEPS'; n.apt.heardAt = n.threat; }
    }
  }
  if (v.t > 0) {
    if (v.stage === 'in' && !v.checked) { if (v.lean) lookOnly(); else check(); }
    if (v.stage === 'in' && v.checked && v.result === 'pass' && n.monitor === 'rpg' && n.monitorOff <= 0) {
      v.result = 'caught'; caught();
    }
    return;
  }
  switch (v.stage) {
    case 'far':
      if (v.fake) { v.stage = 'passing'; v.t = 2; } else { v.stage = 'hall'; v.t = HALL; }
      break;
    case 'passing': if (hearsApartment()) toast(pick(FAKEOUT_LINES), '#a999bd'); endVisit(); break;
    case 'hall': v.stage = 'handle'; v.t = HANDLE; sfx.handle(); break;
    case 'handle': v.stage = 'in'; v.t = T.VISIT_IN_SEC; v.checked = false; sfx.door(); break;
    case 'in': endVisit(); break;
  }
}

/** She just leans on the door frame and looks at you: no check, a little warmth. */
function lookOnly() {
  const v = N().visit;
  v.checked = true; v.result = 'look';
  addMood(T.LEAN_MOOD);
  toast(pick(['She leans on the door frame, barefoot, watching you. "Nothing. Carry on."', '"Just checking on my nerd." She smiles and stays a moment.', 'She leans in the doorway, rubbing one foot against her calf. "...Hi."']), '#ff9ab8');
}

function check() {
  const n = N();
  const v = n.visit;
  v.checked = true;
  const pass = n.monitorOff > 0 || (n.monitor === 'excel' && n.busy >= T.BUSY_PASS);
  if (pass) {
    v.result = 'pass';
    addMood(T.PEEK_PASS_MOOD);
    toast(`Peek passed. ${pick(PEEK_PASS)}`, '#6fcf7f'); sfx.good();
    if (maybeLap()) { afterVisit(); return; }
  } else { v.result = 'caught'; caught(); }
}

function caught() {
  const n = N();
  n.everCaught = true;
  n.catches++;
  n.scare = T.SCARE_SEC;
  sfx.sting();
  const step = Math.min(n.catches, 3);
  toast(`CAUGHT! ${pick(PEEK_CAUGHT)}`, '#ff8a80');
  addMood(T.CATCH_MOOD[step - 1]);
  if (step === 1) { n.flow = T.FLOW_MIN; toast('Warning: Flow reset.', '#ff8a80'); }
  if (step === 2) { n.guilt = T.GUILT_SEC; toast('Guilt: party -10% damage for 30 s.', '#ff8a80'); }
  if (step === 3) { n.monitorOff = T.MONITOR_OFF_SEC; n.flow = T.FLOW_MIN; toast('She turned the monitor off!', '#ff8a80'); }
}
