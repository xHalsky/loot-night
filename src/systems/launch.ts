// The launch on the first Monday (#127, the v2 redesign; docs/design/aoj-world.md §7): before the first night the PC
// launches Age of Judgment on the monitor for 40 s while the boys' first chat comes in on the phone in your hand. Every
// night after it starts at the login (T 25) and, once Log in is pressed, runs fast to the town (#149). One
// clock for the monitor, the chat and the sound: T starts when the chat comes up and stops while paused. Not
// interactive; nothing starts the night before it ends. The render side is render/page/aoj.js (launchScreen), the
// sound ui/launchSound.ts.
import { S } from '../core/state';
import { T as TU } from '../config/tuning';
import { toast } from '../core/fx';

// the realm's own welcome, in its own voice: the MMO knows nothing of her or of the room it runs in (#145)
export const WELCOME = 'Welcome to Age of Judgment. The sky has judged. Ravenhold endures.';

let T = 0, running = false, of: unknown = null, skipped = false, frozen = false, from = 0;
/** Where tonight's launch started: 0 (the whole launch, the first Monday) or the login's T (every night after). */
export const launchFrom = () => from;
/** The launch's seconds, or -1 when no launch is running tonight. */
export const launchT = () => (running ? T : -1);
/** Tonight's chat is up with its launch (the voice flag), whether or not it has finished. */
export const launchNight = () => !!S.g.voice?.launch;
/** True while the launch still holds the night (no Let's go yet; Esc, Enter, the home bar and the close box do
 *  nothing). At its end the gold Let's go comes up and the player starts the night (#142: not by itself, Paweł). */
export const launchHolds = () => running && T < TU.LAUNCH_SEC;
/** Whether the last jump of T was a skip (the sound fires nothing it jumped over). */
export const launchSkipped = () => skipped;

/** How fast the launch's clock runs (#149): every night after the first Monday, once Log in is pressed, the
 *  connecting, verified and the loading bar fly by (LAUNCH_FAST_FROM to LAUNCH_SEC in LAUNCH_FAST_SEC real seconds).
 *  The first Monday's long boot sets the mood and plays at 1. */
export function launchRate(t = T, start = from): number {
  return start > 0 && t >= TU.LAUNCH_FAST_FROM && t < TU.LAUNCH_SEC ? (TU.LAUNCH_SEC - TU.LAUNCH_FAST_FROM) / TU.LAUNCH_FAST_SEC : 1;
}
/** Real seconds, every frame. The clock runs while the chat is up (it stops while paused) and keeps running past the
 *  end until the town has faded in and the music's last chord is out. */
export function updateLaunch(real: number) {
  const g = S.g, v = g.voice;
  if (v?.launch && v !== of) { of = v; from = v.launch === 'login' ? TU.LAUNCH_LOGIN_AT : 0; T = from; running = true; skipped = false; }   // a new night's launch: from the start, or from the login
  if (!running) return;
  if (!v && T < TU.LAUNCH_SEC) { running = false; return; }   // the chat closed before it loaded (the tests' and F1's shortcuts): no launch tonight
  if (g.paused || g.screen !== 'night') return;
  if (v?.launch && !(g.howto)) return;   // up but not shown (debug)
  const was = T;
  if (!frozen) T = Math.min(T + real * launchRate(), Math.max(T + real, TU.LAUNCH_SEC));   // fast from the Log in press on later nights (#149); the fast part stops on the town's T
  if (was < TU.LAUNCH_SEC && T >= TU.LAUNCH_SEC && !skipped) toast(WELCOME, '#f2e9d8', 'GAME');   // the town is in: its welcome
  if (T >= TU.LAUNCH_SOUND_END && !v?.launch) running = false;   // done: the town is in, the chord rang out
}
/** For the tests and the stills: put the clock at t (a jump: the sound fires nothing it passes). */
export function launchSeek(t: number, freeze = false) { if (running) { T = t; frozen = freeze; } }
/** F1's "Skip the launch" (and the tests): straight to the end; the sound stops and fires nothing it jumped over. */
export function skipLaunch() { if (!running) return; if (T < TU.LAUNCH_SEC) toast(WELCOME, '#f2e9d8', 'GAME'); T = Math.max(T, TU.LAUNCH_SEC); skipped = true; }
/** When the k-th of n bubbles lands: the first Monday's at CHAT_LAUNCH_AT; from the login, spread evenly from
 *  CHAT_LOGIN_FROM to CHAT_LOGIN_TO. */
export function launchChatTime(k: number, n: number, start = from) {
  if (start > 0) return n <= 1 ? TU.CHAT_LOGIN_FROM : TU.CHAT_LOGIN_FROM + (k * (TU.CHAT_LOGIN_TO - TU.CHAT_LOGIN_FROM)) / (n - 1);
  return TU.CHAT_LAUNCH_AT[k] ?? TU.CHAT_LAUNCH_AT[TU.CHAT_LAUNCH_AT.length - 1];
}
/** The chat's bubbles paced to the launch: how many are in, and who is typing the next one. */
export function launchChatAt(chat: [string, string][], t: number, start = from): { shown: number; typing: string | null } {
  for (let k = 0; k < chat.length; k++) {
    const at = launchChatTime(k, chat.length, start);
    if (t < at - TU.CHAT_LAUNCH_TYPING) return { shown: k, typing: null };
    if (t < at) return { shown: k, typing: chat[k][0] };
  }
  return { shown: chat.length, typing: null };
}
