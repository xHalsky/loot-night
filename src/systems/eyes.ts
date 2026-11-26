import { S } from '../core/state';

/** Eyes busy (fan-service step 1, #85): during a tease visit, with the pointer on the webcam view and the game on
 *  screen, you are looking at her. Manual skills and ultimates are blocked like Hands busy (the skill bar's EYES BUSY
 *  plate), bought autocasts still fire, Flow doesn't build. Excel up counts as ignoring her. */
export function eyesBusy(): boolean {
  const n = S.g.night;
  return !!n && n.visit.kind === 'tease' && n.visit.stage === 'in' && !n.visit.result && n.looking && n.monitor !== 'excel' && !n.switching && n.monitorOff <= 0;
}
