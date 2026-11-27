import { S, N, type ChatLine } from '../core/state';

// The phone's chats (V8, #73; grid doc 7f, decided 2026-11-20): her thread is kept for good across the nights; The
// Boys' chat shows the last call's exchange until the next one. A grey separator (the day, or the time after a gap)
// goes between sittings when the chat is drawn (render/phoneView.ts).
const HER_MAX = 40;

const now = (): { night: number; day: number; clock: number } => ({ night: S.g.nightsPlayed, day: S.g.day ?? S.g.nightsPlayed, clock: Math.floor(S.g.night?.clock ?? 0) });

/** She texts you (l), you text her (r), or a grey note (sys). */
export function herSay(s: ChatLine['s'], text: string) {
  const t = (S.g.herThread ??= []);
  t.push({ s, text, ...now() });
  if (t.length > HER_MAX) { const cut = t.length - HER_MAX; t.splice(0, cut); S.g.herSeen = Math.max(0, (S.g.herSeen ?? 0) - cut); }
}
/** The Boys' chat becomes this exchange. */
export function boysLog(lines: [ChatLine['s'], string][]) {
  S.g.boysThread = lines.map(([s, text]) => ({ s, text, ...now() }));
}
/** Her messages you haven't seen in her chat. */
export function herUnread(): number {
  const t = S.g.herThread ?? [];
  return t.slice(S.g.herSeen ?? 0).filter(l => l.s === 'l' || l.s === 'photo').length;
}
export function herRead() { S.g.herSeen = (S.g.herThread ?? []).length; }
