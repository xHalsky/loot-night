"""A listening reel of the RPG's sounds (#155) for review, at the game's mix (MIX in src/data/sounds.ts):

    python3 tools/sfx/aoj_reel.py /tmp/out    # aoj_sounds_reel.mp3 + its cue list, aoj_sounds_fight.mp3 (a fight)

The reel plays every cue in groups, a beat apart (the wind-ups cut where the move lands, as in the game). The fight
is a short made-up fight at the game's levels and stereo (the party left, the enemies right), to hear them together.
"""
import os
import re
import subprocess
import sys

import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
SFX = os.path.join(HERE, '..', '..', 'src', 'assets', 'sfx')
MIXF = os.path.join(HERE, '..', '..', 'src', 'data', 'sounds.ts')
MIX = {k: float(v) for k, v in re.findall(r'\b([a-z_0-9]+): ([0-9.]+)', open(MIXF).read().split('export const LOOP_SEC')[0])}
WIND = {'smash': 3.0, 'toll': 2.0, 'execute': 3.0, 'hook': 1.0, 'shove': 1.0}   # tuning's wind-ups
FOE, PARTY = 0.22, -0.22


def load(name):
    p = os.path.join(SFX, name + '.mp3')
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).astype(np.float64)


def cue_of(name):
    return re.sub(r'_\d+$', '', name)


class Track:
    def __init__(self):
        self.parts = []

    def add(self, name, at, pan=0.0, vol=1.0, cut=None):
        x = load(name) * MIX.get(cue_of(name), 0.5) * vol
        if cut:
            n = int(cut * SR)
            x = x[:n].copy()
            f = min(len(x), int(0.02 * SR))
            x[-f:] *= np.linspace(1, 0, f)
        lg, rg = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        self.parts.append((int(at * SR), np.stack([x * lg, x * rg], axis=1)))
        return len(x) / SR

    def write(self, path):
        n = max(i + len(x) for i, x in self.parts) + SR
        y = np.zeros((n, 2))
        for i, x in self.parts:
            y[i:i + len(x)] += x
        y *= 0.89 / (np.max(np.abs(y)) + 1e-9)
        raw = path + '.raw'
        y.astype(np.float32).tofile(raw)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', raw, '-b:a', '160k', path], check=True)
        os.unlink(raw)
        return n / SR


GROUPS = [
    ('The party\'s blows', ['rpg_slash_0', 'rpg_slash_1', 'rpg_slash_2', 'rpg_stab_0', 'rpg_stab_1', 'rpg_stab_2', 'rpg_bolt_0', 'rpg_bolt_1',
                            'rpg_bolt_2', 'rpg_smite_0', 'rpg_smite_1', 'rpg_bash', 'rpg_backstab', 'rpg_fire', 'rpg_frost', 'rpg_crit_0',
                            'rpg_crit_1', 'rpg_combo', 'rpg_shieldbreak', 'rpg_whiff_0']),
    ('The enemies\' blows', ['rpg_hurt_0', 'rpg_hurt_1', 'rpg_hurt_2', 'rpg_bite_0', 'rpg_bite_1', 'rpg_hex', 'rpg_darkmend']),
    ('Skills and ultimates', ['rpg_taunt', 'rpg_smoke', 'rpg_mend', 'rpg_ward', 'rpg_heal_0', 'rpg_heal_1', 'rpg_laststand', 'rpg_heist',
                              'rpg_cataclysm', 'rpg_miracle']),
    ('The party', ['rpg_levelup', 'down', 'rpg_revive', 'rpg_swap', 'rpg_refuse']),
    ('The big moves (wind-up, then the blow)', ['smash', 'toll', 'execute', 'hook', 'shove', 'rpg_interrupt']),
    ('Enraged', ['enrage_0', 'enrage_1', 'enrage_2', 'enrage_3']),
    ('The fallen', ['die_hollow', 'die_guardian', 'die_revenant', 'die_penitent', 'die_confessor', 'die_cherub_0', 'die_cherub_1',
                    'die_cherub_2', 'die_ironwing', 'die_vigil', 'die_gravedigger', 'die_abbot', 'die_gaoler', 'die_bellringer', 'die_inquisitor']),
    ('The crypt', ['rpg_spotted', 'rpg_portal', 'rpg_victory', 'rpg_floor', 'rpg_page', 'wipe']),
    ('Loot', ['rpg_floordrop_0', 'rpg_floordrop_1', 'rpg_glint', 'rpg_pickup_0', 'rpg_loot_0', 'rpg_loot_1', 'rpg_loot_2', 'rpg_loot_3', 'legendary',
              'bagfull', 'trash', 'rpg_gold', 'rpg_sell', 'rpg_souls', 'rpg_identify', 'rpg_list', 'rpg_build', 'rpg_tree', 'rpg_respec',
              'rpg_equip_0', 'rpg_unequip', 'rpg_drop', 'rpg_lock', 'rpg_ui_0', 'rpg_ui_1']),
    ('Curios', ['rpg_curio', 'rpg_pick', 'rpg_chest', 'rpg_crash', 'rpg_kick', 'rpg_glass', 'rpg_groan', 'rpg_curse', 'rpg_bless_0', 'rpg_bless_1',
                'rpg_bless_2', 'rpg_bless_3', 'rpg_bless_4', 'rpg_bless_5', 'rpg_bless_6', 'rpg_sneak', 'rpg_withdraw']),
    ('The loot goblin', ['goblin', 'goblincatch', 'goblinlost']),
]


def reel(out):
    t, tr, lines = 0.5, Track(), []
    for title, names in GROUPS:
        lines.append(f'\n{title}')
        for nm in names:
            m, s = divmod(t, 60)
            if nm in WIND:
                tr.add(f'rpg_wind_{nm}', t, FOE, cut=WIND[nm])
                d = tr.add(f'rpg_{nm}', t + WIND[nm], FOE)
                lines.append(f'  {int(m)}:{s:04.1f}  rpg_wind_{nm} + rpg_{nm}')
                t += WIND[nm] + min(d, 2.2) + 0.7
            else:
                d = tr.add(nm, t)
                lines.append(f'  {int(m)}:{s:04.1f}  {nm}')
                t += min(d, 2.4) + 0.55
        t += 1.2
    total = tr.write(os.path.join(out, 'aoj_sounds_reel.mp3'))
    with open(os.path.join(out, 'aoj_sounds_reel.txt'), 'w') as f:
        f.write(f'Age of Judgment: the RPG\'s sounds (#155), {int(total // 60)}:{total % 60:04.1f}\n' + '\n'.join(lines) + '\n')


def fight(out):
    """A made-up fight on floor 5: the pack sees them, blows both ways, skills, a Hollow and three Cherubs fall, the
    Gaoler winds up and SMASHes, the Knight goes down, Mend, the Gaoler enrages, falls; drops, the bag, a legendary."""
    tr = Track()
    rng = np.random.default_rng(7)
    ev = [(0.0, 'rpg_spotted', FOE)]
    rates = {'rpg_slash': 1.05, 'rpg_stab': 0.85, 'rpg_bolt': 1.3, 'rpg_smite': 1.5}   # seconds between blows
    for cue, per in rates.items():
        t = 1.2 + rng.uniform(0, per)
        while t < 19.5:
            if not (9.0 < t < 12.4):
                ev.append((t, f'{cue}_{rng.integers(0, 3 if cue != "rpg_smite" else 2)}', FOE))
            t += per * rng.uniform(0.9, 1.1)
    t = 1.6
    while t < 19:
        if not (9.0 < t < 12.4):
            ev.append((t, f'rpg_hurt_{rng.integers(0, 3)}', PARTY))
        t += rng.uniform(0.8, 1.4)
    ev += [(2.4, 'rpg_taunt', 0.0), (3.1, 'rpg_bite_0', PARTY), (3.25, 'rpg_bite_1', PARTY), (3.9, 'rpg_crit_0', FOE),
           (4.4, 'rpg_fire', FOE), (4.6, 'die_cherub_0', FOE), (4.7, 'die_cherub_1', FOE), (4.8, 'die_cherub_2', FOE),
           (5.4, 'rpg_backstab', FOE), (5.5, 'rpg_combo', FOE), (5.7, 'die_hollow', FOE), (6.1, 'rpg_floordrop_0', FOE),
           (7.0, 'rpg_levelup', 0.0), (8.3, 'rpg_frost', FOE), (12.0, 'rpg_smash', 0.1), (12.15, 'down', PARTY),
           (13.0, 'rpg_mend', 0.0), (14.2, 'rpg_shieldbreak', FOE), (15.2, 'enrage_0', FOE), (16.6, 'rpg_laststand', 0.0),
           (17.4, 'rpg_crit_1', FOE), (19.6, 'die_gaoler', FOE), (20.8, 'rpg_victory', 0.0), (20.1, 'rpg_floordrop_1', FOE),
           (20.15, 'rpg_glint', FOE), (23.0, 'rpg_pickup_0', 0.0), (23.3, 'rpg_loot_2', 0.0), (24.3, 'rpg_pickup_1', 0.0),
           (24.6, 'legendary', 0.0)]
    tr.add('rpg_wind_smash', 9.0, FOE, cut=3.0)
    for at, nm, pan in sorted(ev):
        tr.add(nm, at, pan)
    tr.write(os.path.join(out, 'aoj_sounds_fight.mp3'))


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/out'
    os.makedirs(out, exist_ok=True)
    reel(out)
    fight(out)
    print('wrote', out)
