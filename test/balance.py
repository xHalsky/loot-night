# Balance report (#2): runs many bot nights in parallel and summarises what the slice criteria and the economy
# need. Run: python3 test/balance.py [nights=16] [mode=good]
#   - visits per night and how many different visit types (peek/snack/chat/cuddle) two nights show
#   - catches, wipes, wakes, Noise, stars, depth, end clock
#   - income: gold, scraps in hand + what the bag would salvage, vs the cheapest city building
import json, random, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
N = int(sys.argv[1]) if len(sys.argv) > 1 else 16
MODE = sys.argv[2] if len(sys.argv) > 2 else 'good'
EXTRA = sys.argv[3:]
CHEAPEST = (250, 6)   # Training Grounds / Inn level 1 (src/data/city.ts); edit with the costs
def run(_):
    out = subprocess.run(['npx', 'tsx', 'test/sim.ts', MODE, *EXTRA], capture_output=True, text=True, cwd='/home/claude/loot-night').stdout
    return next((json.loads(l) for l in out.splitlines() if l.startswith('{')), None)
with ThreadPoolExecutor(8) as ex:
    rs = [r for r in ex.map(run, range(N)) if r]
avg = lambda k: sum(r[k] for r in rs) / len(rs)
types = lambda r: {k for k in r['kinds'] if k in ('peek', 'snack', 'chat', 'cuddle')}
print(f'{len(rs)} {MODE} nights')
print(f"depth {avg('depth'):.1f} | end {int(avg('endClock') // 60) % 24}:{int(avg('endClock') % 60):02d} | stars {avg('stars'):.2f} | mood {avg('mood'):.0f}")
if 'equips' in rs[0]:
    wf = {}
    for r in rs:
        for f in r.get('wipeAt', []): wf[f] = wf.get(f, 0) + 1
    print(f"gear: equips {avg('equips'):.1f} | full-bag drops swapped in {avg('swapped'):.1f}, left {avg('skipped'):.1f} | slots filled {avg('slots'):.1f}/18 | gear share of ATK {avg('gearAtk'):.0%}, of HP {avg('gearHp'):.0%} | gear ilvl {avg('gearIlvl'):.1f} | wipes by floor {dict(sorted(wf.items()))}")
print(f"visits {avg('visits'):.1f} | caught {avg('caught'):.2f} | wipes {avg('wipes'):.2f} | wakes {avg('wakes'):.1f} | noise {avg('avgNoise'):.0f} | texts {avg('texts'):.1f}")
kinds = {}
for r in rs:
    for k, v in r['kinds'].items(): kinds[k] = kinds.get(k, 0) + v
print('visit kinds per night:', {k: round(v / len(rs), 2) for k, v in sorted(kinds.items())})
print(f"answer types per night: {sum(len(types(r)) for r in rs) / len(rs):.2f}")
pairs = [(rs[i], rs[j]) for i in range(len(rs)) for j in range(len(rs)) if i < j]
p3 = sum(len(types(a) | types(b)) >= 3 for a, b in pairs) / max(1, len(pairs))
print(f'two nights show 3+ answer types: {p3:.0%}')
YIELD = [1, 2, 4, 8, 16]
def plan(r):
    """A player at the end of the night: salvage the cheapest items until 6 scraps, sell the rest."""
    items = sorted([(v, k) for v, k in zip(r['sell'], r['bagRar']) if k >= 0])
    scraps, gold = r['mats'], r['gold']
    for v, k in items:
        if scraps < CHEAPEST[1]: scraps += YIELD[k]
        else: gold += v
    return gold, scraps
for r in rs: r['pgold'], r['pscraps'] = plan(r)
g = avg('gold'); m = avg('mats') + avg('salvage')
ok = sum(r['pgold'] >= CHEAPEST[0] and r['pscraps'] >= CHEAPEST[1] for r in rs) / len(rs)
print(f"income: gold {g:.0f}, scraps {avg('mats'):.0f} + bag salvage {avg('salvage'):.0f} | cheapest building {CHEAPEST[0]} g + {CHEAPEST[1]} | affordable in {ok:.0%} of nights")
print(f"bag sells for {sum(sum(r['sell']) for r in rs) / len(rs):.0f} g; a player who salvages for 6 scraps and sells the rest ends with {avg('pgold'):.0f} g")
print('player gold per night:', sorted(r['pgold'] for r in rs))
