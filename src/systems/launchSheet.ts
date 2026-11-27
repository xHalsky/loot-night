// The launch's cue sheet, stepped (#127): which cues fire as the launch's clock moves from `from` to `to`. Its own
// module so test/launch.ts can drive it at speed with no audio.
export type LaunchSheet = { sound: [number, string, string][]; loops: [string, number, number, number, number][]; music: { cue: string; at: number; end: number; parts: [number, number, string][] }; end: number };
/** A normal frame moves the clock by much less than this; a bigger jump (the skip) fires nothing it passes. */
export const LAUNCH_JUMP_SEC = 0.5;
/** Fires each cue with from < time <= to, in order, once; nothing when the clock jumped. */
export function stepLaunchSheet(sound: [number, string, string][], from: number, to: number, fire: (at: number, cue: string) => void) {
  if (to - from > LAUNCH_JUMP_SEC || to <= from) return;
  for (const [at, cue] of sound) if (at > from && at <= to) fire(at, cue);
}
