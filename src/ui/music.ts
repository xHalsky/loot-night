// The RPG's music in play (#159; docs/design/screen.md, Audio): Ravenhold in town, the Crypt in the dungeon, Judgment
// while a boss (or the Abbot) stands, from the moment its pack waits in the corridor. Nothing during the launch (it has
// its own theme) or off the night. Paused, it holds its place silently. The tracks: tools/sfx/aoj_music.py.
import { S } from '../core/state';
import { music } from './audio';
import { launchHolds } from '../systems/launch';

/** The track that fits the night right now (null: none). */
export function musicFor(): string | null {
  const g = S.g, n = g.night;
  if (g.screen !== 'night' || !n || launchHolds()) return null;
  if (n.location === 'town') return 'mus_town';
  if (n.location !== 'dungeon') return null;
  return n.enemies.some(e => e.hp > 0 && (e.boss || e.defId === 'troll')) ? 'mus_boss' : 'mus_dungeon';
}

/** Every frame. */
export function updateMusic() {
  const g = S.g;
  music(musicFor(), g.paused || g.howto ? 0 : 1);
}
