// The morning (V10, #75; grid doc 7h): what the renderer's morning shows, from the night's results and the morning's
// rewards (systems/night.ts toMorning). The picture is picked by how the night ended; the numbers and lines are the
// game's (tuning.ts), so the page's sample text never stands in for them.
import { S } from '../core/state';
import { T } from '../config/tuning';
import { dayName } from '../systems/week';

export type MorningScene = 'green' | 'yellow' | 'red' | 'unplugged';
/** Green, yellow or red by her Mood at the end; unplugged when she pulled the plug. */
export function morningScene(): MorningScene {
  const r = S.g.results;
  if (!r) return 'green';
  if (r.ending === 'unplugged') return 'unplugged';
  return r.mood < T.MOOD_GREEN ? 'green' : r.mood < T.MOOD_RED ? 'yellow' : 'red';
}

export function morningView() {
  const g = S.g, m = g.morning!, goals = g.results?.goals, debt = g.sleepDebt;
  const replay = g.results?.ending === 'unplugged';
  const chest = m.chest ? `a chest: ${m.chest.identified ? m.chest.name : `??? (${m.chest.rarity})`}${m.chestWaits ? ', tonight' : ''}` : '';
  return {
    sold: m.listings, paid: m.paid, zl: Math.floor(g.zl), gold: g.gold, debt, best: g.bestStars, q4: g.results?.q4 ?? 0,
    stars: [
      { name: 'Deep', got: !!goals?.deep, reward: chest },
      { name: 'Unseen', got: !!goals?.unseen, reward: `Trust: Goodwill +${T.STAR_UNSEEN_GOODWILL} tonight` },
      { name: 'Sweet', got: !!goals?.sweet, reward: `Breakfast: sleep debt -${T.STAR_SWEET_DEBT}` },
    ],
    // the week (#56): unplugged, the same night again (the page's replay summary and "Tuesday, again"); otherwise the next
    replay, night: dayName(g.day),
    note: replay ? undefined : (debt > 0 ? `Sleep debt ${debt}: tonight starts at Tiredness ${Math.min(100, T.TIRED_BASE + debt * T.TIRED_PER_DEBT)}.` : 'No sleep debt: tonight starts fresh.') + ' Party, gear, gold and city carry over.',
    when: `${dayName(g.day).slice(0, 3)} 07:40`,   // the morning of the coming night's day (a replay: that day again)
  };
}
