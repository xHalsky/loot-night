# Several nights in a row (#2): does the city give an upgrade every night? Runs bots with NIGHTS=n in parallel.
# Run: python3 test/campaign.py [runs=8] [nights=4] [1500 gear]   (extra args go to sim.ts: 'gear' equips upgrades during the night)
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
RUNS = int(sys.argv[1]) if len(sys.argv) > 1 else 8
NIGHTS = int(sys.argv[2]) if len(sys.argv) > 2 else 4
EXTRA = sys.argv[3:]
def run(_):
    env = dict(os.environ, NIGHTS=str(NIGHTS))
    out = subprocess.run(['npx', 'tsx', 'test/sim.ts', 'good', *EXTRA], capture_output=True, text=True, env=env, cwd='/home/claude/loot-night').stdout
    return [json.loads(l) for l in out.splitlines() if l.startswith('{')]
with ThreadPoolExecutor(8) as ex:
    runs = [r for r in ex.map(run, range(RUNS)) if r]
for k in range(NIGHTS):
    ns = [r[k] for r in runs if len(r) > k]
    if not ns: break
    avg = lambda f: sum(f(n) for n in ns) / len(ns)
    builds = [len(n['built']) for n in ns]
    print(f"night {k + 1}: depth {avg(lambda n: n['depth']):.1f} | caught {avg(lambda n: n['caught']):.2f} | wipes {avg(lambda n: n['wipes']):.2f}"
          f" | built before it {avg(lambda n: len(n['built'])):.1f} (none in {sum(b == 0 for b in builds)}/{len(ns)}, 2+ in {sum(b >= 2 for b in builds)}/{len(ns)})"
          f" | bag worth {avg(lambda n: n['bagValue']):.0f} g, gold after the city {avg(lambda n: n['goldAfterCity']):.0f}")
    print('   built:', [' '.join(n['built']) or '-' for n in ns])
