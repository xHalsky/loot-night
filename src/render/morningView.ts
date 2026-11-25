// The morning (V10, #75; grid doc 7h): what the renderer's morning shows, from the night's results and the morning's
// rewards (systems/night.ts toMorning). The picture is picked by how the night ended; the numbers and lines are the
// game's (tuning.ts), so the page's sample text never stands in for them.
import { S } from '../core/state';
import { T } from '../config/tuning';

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
  const chest = m.chest ? `a chest: ${m.chest.identified ? m.chest.name : `??? (${m.chest.rarity})`}${m.chestWaits ? ', tonight' : ''}` : '';
  return {
    sold: m.listings, paid: m.paid, zl: Math.floor(g.zl), gold: g.gold, debt, best: g.bestStars, q4: g.results?.q4 ?? 0,
    stars: [
      { name: 'Deep', got: !!goals?.deep, reward: chest },
      { name: 'Unseen', got: !!goals?.unseen, reward: `Trust: Goodwill +${T.STAR_UNSEEN_GOODWILL} tonight` },
      { name: 'Sweet', got: !!goals?.sweet, reward: `Breakfast: sleep debt -${T.STAR_SWEET_DEBT}` },
    ],
    note: (debt > 0 ? `Sleep debt ${debt}: tonight starts at Tiredness ${Math.min(100, T.TIRED_BASE + debt * T.TIRED_PER_DEBT)}.` : 'No sleep debt: tonight starts fresh.') + ' Party, gear, gold and city carry over.',
    when: '07:40',                          // the day comes with the week (#56); every night is Monday until then
    next: `Start night ${g.nightsPlayed + 1}`,
  };
}
