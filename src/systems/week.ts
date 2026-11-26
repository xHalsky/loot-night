import { VOICE_NOTES, voiceReplay } from '../data/voice';
import { T, type NightPlan } from '../config/tuning';
import { S } from '../core/state';

// The week (#56; docs/design/night.md, the week). Nights are weekdays: Monday to Friday each bring something new,
// the weekend brings her (and more of her). The schedule is data (T.NIGHT_SCHEDULE); this turns it into tonight's
// rules. S.g.day counts the nights you got through: an unplugged night is played again ("Tuesday, again.").
// Systems ask on('dog') and the like; what is not on yet does not happen and is not shown.

export interface WeekRules {
  day: number;           // S.g.day this was made for (0 = the first Monday)
  name: string;          // Monday ... Sunday
  week: number;          // 1, 2, ...
  on: string[];          // everything on tonight
  isNew: string[];       // what came in tonight (week one; empty after it)
  visits: number; bed: number; end: number; dog: [number, number, number] | null; friends: number;
  first: string;         // week one: her first visit tonight is this type, early and safe ('' = none)
  teases: [number, number];   // her tease visits tonight (#85)
}

const WEEK = () => T.NIGHT_SCHEDULE as NightPlan[];

/** The rules for a day. Week one adds a night's things one night at a time. After Sunday the week starts again with
 *  everything on, each weekday keeping its own pressure (visits, the dog, the boys), and she goes to bed every night
 *  (WEEK_TWO_BED on weeknights). Week two is TBD (Paweł); this is the placeholder. */
export function rulesFor(day: number): WeekRules {
  const plan = WEEK(), len = plan.length, d = Math.max(0, Math.floor(day)), i = d % len, week = Math.floor(d / len) + 1;
  const upTo = week === 1 ? i : len - 1;
  const on = plan.slice(0, upTo + 1).flatMap(p => p.adds);
  const p = plan[i];
  return {
    day: d, name: p.day, week, on, isNew: week === 1 ? [...p.adds] : [],
    visits: p.visits, bed: week === 1 ? p.bed : p.bed || T.WEEK_TWO_BED, end: week === 1 ? p.end : 0, dog: p.dog, friends: p.friends,
    first: week === 1 ? p.first ?? '' : '', teases: p.teases ?? [0, 0],
  };
}

let cache: WeekRules | null = null;
/** Tonight's rules (the day being played). */
export function rules(): WeekRules {
  const d = S.g.day ?? 0;
  if (!cache || cache.day !== d) cache = rulesFor(d);
  return cache;
}
/** Is this on tonight? */
export const on = (what: string) => rules().on.includes(what);
/** Did this come in tonight? */
export const isNewTonight = (what: string) => rules().isNew.includes(what);
/** The day's name: tonight's, or another day's. */
export const dayName = (day = S.g.day ?? 0) => WEEK()[((day % WEEK().length) + WEEK().length) % WEEK().length].day;
/** When she goes to bed tonight (Infinity: she stays up). */
export const bedAt = () => rules().bed || Infinity;

/** How to hide's tiles tonight (grid doc 7k): one per thing that is on, tonight's new ones framed gold. The third
 *  tile's words follow the visit types that are on (mon: peek and snack; tue: + chat; thu: + cuddle, the cans). */
export function howtoTiles(): { ids: string[]; isNew: string[]; answer: 'mon' | 'tue' | 'thu' } {
  const ids = ['listen', 'tab', 'answer'], isNew: string[] = [];
  if (on('headset')) { ids.push('headset'); if (isNewTonight('headset')) isNew.push('headset'); }
  if (isNewTonight('cuddle') || isNewTonight('fuel')) isNew.push('answer');
  return { ids, isNew, answer: on('cuddle') || on('fuel') ? 'thu' : on('chat') ? 'tue' : 'mon' };
}
/** How to hide opens before the night: the first Monday, and any night with a new tile. */
export const howtoOpens = () => rules().day === 0 || howtoTiles().isNew.length > 0;

/** Danny's 20:00 voice note (grid doc 7m): tonight's, week one only; after the plug, the replay's. */
export function voiceNote(): { lines: string[]; date: string } | null {
  const r = rules(), res = S.g.results;
  if (res?.ending === 'unplugged' && res.day === r.day) return { lines: voiceReplay(r.name), date: `${r.name}, again` };
  if (r.week > 1 || !VOICE_NOTES[r.name]) return null;
  return { lines: VOICE_NOTES[r.name], date: 'Today 20:00' };
}
