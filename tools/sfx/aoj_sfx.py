"""The RPG's own sounds (#155, docs/design/screen.md, Audio): Age of Judgment on the monitor sounds like the late-90s
console game it looks like, the way its launch already does (launch.py, ps1.py). Registered into make.py:

    python3 tools/sfx/make.py rpg_slash die_gaoler   # any cue
    python3 tools/sfx/make.py 'rpg_*' 'die_*'         # a group (make.py: a trailing * bakes every cue it starts)

Every cue is built at 44.1 kHz from layers: Kenney CC0 impacts pitched down for weight, synthesised iron (inharmonic
partials: bars, bowls, cracked bells), chain, grit and debris, the console's own sampled instruments from ps1.py (choir,
organ, brass, harp, the bell, timpani). Then it goes through the console (psx): a little drive for the crunch, down to
the sample's own rate (16,000 or 22,050 Hz: the console kept its effects small), the 4-bit ADPCM round trip, back up
with a plain interpolation (its grain), the console's reverb at 22,050 Hz.

The world is iron angels, the Church and its crypts (aoj-world.md): everything here is iron, stone, chain, bells,
choir and fire, and it plays it straight. The jokes stay in real life. The loot goblin stays what it is (a critter
you catch, Goblin Fuel's mascot), its giggle through the same chain. Everything is seeded: a rebuild gives the same
files. The wind-ups are as long as tuning's (BOSS_WINDUP_SEC 3, LOAN_WINDUP_SEC 2, EVICT_WINDUP_SEC 3,
LINE_BREAK_WINDUP_SEC 1) and a little more: the game cuts them where the move lands.
"""
import numpy as np
from scipy import signal

import dsp as D
import ps1
from dsp import SR, tt, secs, place
from ps1 import PSR, nf
from launch import trim_tail, dsine, noise_burst, resample_pitch, thunder_roll, woodtap

KEN = None   # make.py's kenney(), set by register()
_KC = {}


# ---------------------------------------------------------------- the console
def psx(x, rate=22050, drive=0.0, wet=0.14, decay=1.2, pre=0.0):
    """A cue through the console: drive, the sample at its own rate through ADPCM, back up plainly, the reverb."""
    x = np.asarray(x, dtype=np.float64)
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.92
    if drive > 0:
        x = np.tanh(drive * x) / np.tanh(drive) * 0.92
    g = int(np.gcd(int(rate), SR))
    y = signal.resample_poly(x, rate // g, SR // g)
    y = ps1.adpcm(np.clip(y, -1, 1))
    if rate != PSR:   # the voice plays it back at the chip's rate: a plain interpolation, no smoothing
        n = int(len(y) * PSR / rate)
        y = np.interp(np.arange(n) * rate / PSR, np.arange(len(y)), y)
    if wet > 0:
        y = ps1.hall(y, decay=decay, wet=wet, pre=pre).mean(axis=1)
    return trim_tail(ps1.from_psr(y), -54)


class Mix:
    """Layers placed in time; the buffer grows to fit them (nothing is cut short)."""

    def __init__(self):
        self.parts = []

    def add(self, src, at=0.0, g=1.0):
        y = np.asarray(src, dtype=np.float64) * g
        f = min(len(y) // 4, secs(0.08))   # every layer dies away at its own end (a cut layer clicks)
        if f > 1:
            y = y.copy()
            y[-f:] *= np.cos(np.linspace(0, np.pi / 2, f)) ** 2
        self.parts.append((secs(at), y))
        return self

    def out(self):
        n = max(i + len(s) for i, s in self.parts)
        y = np.zeros(n)
        for i, s in self.parts:
            y[i:i + len(s)] += s
        return y


# ---------------------------------------------------------------- sources
def K(name, semis=0.0, gain=1.0):
    """A Kenney recording, pitched (semitones, by playing it slower or faster: a sampler's way)."""
    if name not in _KC:
        _KC[name] = KEN(name)
    x = _KC[name]
    if semis:
        x = resample_pitch(x, 2 ** (-semis / 12))
    return x * gain


IRON = [(1.0, 1.0), (2.32, 0.7), (3.86, 0.5), (5.41, 0.34), (7.13, 0.22), (9.6, 0.12)]     # a plate of angel iron
BAR = [(1.0, 1.0), (2.756, 0.6), (5.404, 0.35), (8.933, 0.18)]                            # a rod, a blade, a bone
BOWL = [(1.0, 1.0), (2.4, 0.55), (4.5, 0.3), (6.9, 0.15)]                                 # a helm, a censer, a cage
BELL_SMALL = [(0.5, 0.25), (1.0, 1.0), (1.19, 0.5), (1.5, 0.35), (2.0, 0.4), (2.5, 0.15), (3.0, 0.1)]
CRACKED = [(1.0, 1.0), (1.13, 0.6), (2.08, 0.5), (2.71, 0.45), (3.5, 0.3), (4.6, 0.2)]     # close partials: it beats
GLASS = [(1.0, 1.0), (2.0, 0.45), (2.95, 0.3), (4.1, 0.15)]


def env_ar(d, a, tau):
    t = tt(d)
    return np.clip(t / max(a, 1e-4), 0, 1) * np.exp(-np.clip(t - a, 0, None) / tau)


def thud(f0, f1, d, tau, a=0.002):
    """A body: a sine falling from f0 to f1."""
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / (d / 4))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ar(d, a, tau)


def iron(f, d, tau, bright=1.0, ratios=IRON):
    """Struck iron: inharmonic partials, the high ones shorter, each with a slow beat."""
    t = tt(d)
    y = np.zeros(len(t))
    for r, a in ratios:
        if f * r > 10500:
            break
        amp = a * bright ** np.log2(max(r, 1.0))
        tr = tau / max(r, 0.5) ** 0.55
        y += amp * (np.sin(2 * np.pi * f * r * t + r) + 0.3 * np.sin(2 * np.pi * f * r * 1.0031 * t)) * np.exp(-t / tr)
    return y * np.clip(t / 0.001, 0, 1) * np.clip((d - t) / (0.3 * d), 0, 1)   # it dies away inside d, never cut


def tink(f, d=0.12, tau=0.025, ratios=BAR):
    """One small iron piece landing."""
    y = iron(f, d, tau, 0.9, ratios)
    c = D.click(min(d, 0.006), 2000, 9000, 0.0008)
    y[:len(c)] += c * 0.6
    return y


def rattle(d, n, lo, hi, spread, tau=0.025, start=0.0, ratios=BAR, decay=None):
    """n small iron pieces falling: most of them early (an exponential spread), louder first."""
    x = np.zeros(secs(d))
    r = D.rng
    for _ in range(n):
        at = start + r.exponential(spread)
        if at > d - 0.06:
            continue
        a = r.uniform(0.35, 1.0) * np.exp(-(at - start) / (decay or spread * 2.5))
        place(x, tink(r.uniform(lo, hi), 0.14, tau * r.uniform(0.7, 1.3), ratios), at, a)
    return x


def grit(d, tau, lo=1200, hi=8000, dens=900, attack=0.0005):
    """The crunch: sparse impulses and a little hiss, band-passed."""
    n = secs(d)
    r = D.rng
    imp = np.zeros(n)
    m = r.random(n) < dens / SR
    imp[m] = r.standard_normal(int(m.sum()))
    y = D.bp(imp + 0.15 * r.uniform(-1, 1, n), lo, hi)
    return y * D.env_exp(d, tau, attack)


def crackle(d, dens, tau, lo=800, hi=7000):
    """Fire: pops of every size, thinning out."""
    y = np.zeros(secs(d))
    r = D.rng
    t = 0.0
    while True:
        t += r.exponential(1 / dens)
        if t > d - 0.02:
            break
        pop = D.bp(D.white(0.006), lo, hi) * D.env_exp(0.006, 0.0012, 0.0002)
        place(y, pop, t, min(1.0, 0.25 + r.pareto(2.5) * 0.3) * np.exp(-t / tau))
    return y


def chain(d, rate=28, lo=2600, hi=6500, env=None, jit=0.35):
    """Chain links knocking: short bright clinks about `rate` a second; env(t) shapes them."""
    x = np.zeros(secs(d))
    r = D.rng
    t = 0.0
    while t < d - 0.03:
        a = r.uniform(0.4, 1.0) * (env(t) if env else 1.0)
        place(x, iron(r.uniform(lo, hi), 0.05, 0.008, 0.9, [(1, 1), (1.47, 0.6), (2.09, 0.4)]), t, a)
        t += (1 / rate) * r.uniform(1 - jit, 1 + jit)
    return x


def swept(d, pts, env, q=0.6):
    """Noise through a band moving along pts [(fraction, Hz)], shaped by env."""
    nz = D.white(d)
    n = len(nz)
    y = np.zeros(n)
    blk = secs(0.008)
    fr = np.array([p[0] for p in pts])
    lf = np.log([p[1] for p in pts])
    for j0 in range(0, n, blk):
        fc = float(np.exp(np.interp(j0 / n, fr, lf)))
        seg = D.bp(nz[max(0, j0 - blk * 4):j0 + blk], max(40.0, fc * (1 - q / 2)), min(SR * 0.45, fc * (1 + q)))
        y[j0:j0 + blk] = seg[-len(nz[j0:j0 + blk]):]
    return y * env


def whoosh(d, pts, at=0.55, q=0.7, curve=2.0):
    """A swing: swept noise swelling to its peak at `at` (a fraction of d)."""
    u = tt(d) / d
    env = np.where(u < at, (u / at) ** curve, ((1 - u) / (1 - at)) ** 1.4)
    return swept(d, pts, env, q)


def fmz(fc, ratio, d, i0, tau_i, tau_a, attack=0.002, fpath=None):
    """Two-operator FM; fpath(t) moves the pitch (a zap, a shriek)."""
    t = tt(d)
    f = np.broadcast_to(fpath(t) if fpath else fc, t.shape)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph + i0 * np.exp(-t / tau_i) * np.sin(ph * ratio)) * np.exp(-t / tau_a) * np.clip(t / attack, 0, 1)


def drone(f, d, env, voices=3, det=0.006, lp=900):
    y = sum(D.osc(f * (1 + (k - (voices - 1) / 2) * det), d, 'saw') for k in range(voices)) / voices
    return D.lp(y, lp, 2) * env


def growl(d, f0pts, vowel='uh', breath=0.9, jitter=0.16, drive=3.0, male=0.55, env=None):
    """A throat: a big voice through a vowel's formants, rough and driven (the roars, the groans)."""
    t = tt(d)
    f0 = np.interp(t, [p[0] for p in f0pts], [p[1] for p in f0pts])
    F = np.tile(np.array(D.VOWELS[vowel]) * male, (len(t), 1))
    amp = env if env is not None else D.env_lin(d, [(0, 0), (0.08, 1), (d * 0.7, 0.8), (d, 0)])
    v = D.voice(f0, amp, F, breath=breath, tilt=0.6, jitter=jitter, maxf=4000, B=(200, 250, 350))
    v = np.tanh(drive * v / (np.max(np.abs(v)) + 1e-9))
    return v + D.osc(f0 / 2, d) * amp * 0.3


def sigh(d, vowel='a', male=0.8):
    """A breath out: noise through the vowel's formants."""
    nz = D.white(d)
    F = np.array(D.VOWELS[vowel]) * male
    y = sum(D.peak(D.bp(nz, f * 0.7, f * 1.3), f, 6) * w for f, w in zip(F, (1, 0.6, 0.3)))
    return y * D.env_lin(d, [(0, 0), (0.05, 1), (d, 0)])


def ember_out(d=0.7, f0=880):
    """An angel's crimson light going out (an eye, a heart-lens): a falling tone and its fizz."""
    t = tt(d)
    f = f0 * 0.18 ** (t / d)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (d / 3)) * 0.5
    return y + D.bp(D.white(d), 4000, 9000) * np.exp(-t / (d / 4)) * 0.25


def giggle(n, f0, rate=9.0, vowel='i', drop=0.8):
    """The loot goblin's (as it always was)."""
    d = n / rate + 0.1
    t = tt(d)
    f = f0 * np.interp(t, [0, d], [1.0, drop])
    F = np.tile(np.array(D.VOWELS[vowel]) * 1.25, (len(t), 1))
    v = D.voice(f, np.ones(len(t)), F, breath=0.5, tilt=0.8, jitter=0.03, maxf=6000)
    pulses = np.zeros(len(t))
    for k in range(n):
        place(pulses, D.env_exp(0.09, 0.03, 0.006), k / rate)
    return v * pulses / (np.max(np.abs(v * pulses)) + 1e-9)


def timp(note='D2', d=1.6, vel=1.0, seed=700):
    """A timpani hit d long, let go over its last 40% (the console's own decays longer)."""
    y = ps1.from_psr(ps1.timpani_hit(nf(note), d, vel, seed=seed))
    return y * np.clip((len(y) - np.arange(len(y))) / (0.4 * len(y)), 0, 1)


def snuff(d=0.22):
    """A candle pinched out."""
    t = tt(d)
    return D.bp(D.white(d), 1500, 6000) * np.clip(t / 0.01, 0, 1) * np.exp(-t / 0.07)


# ---------------------------------------------------------------- the console's instruments (ps1.py)
_INST = {}


def inst(name):
    if name not in _INST:
        keep = D.rng   # built once with their own seed: a cue sounds the same baked alone or with the rest
        D.seed(9100 + sum(map(ord, name)))
        if name.startswith('choir_'):
            i = ps1.Instrument(ps1.choir_samples(name[6:]), adsr=(0.06, 0.4, 0.85, 0.5), gain=0.9, dull=0.42)
        elif name == 'organ':
            i = ps1.Instrument(ps1.organ_samples(), adsr=(0.02, 0.3, 0.9, 0.35), gain=0.8)
        elif name == 'brass':
            i = ps1.Instrument(ps1.brass_samples(), adsr=(0.04, 0.25, 0.8, 0.25), gain=1.0, dull=0.45)
        elif name == 'harp':
            i = ps1.Instrument(ps1.harp_samples(), adsr=(0.001, 2.0, 1.0, 0.4), gain=1.0, dull=0.45)
        elif name == 'bell':
            i = ps1.Instrument([ps1.bell_sample('D3', 6.0)], adsr=(0.001, 8.0, 1.0, 1.2), gain=1.0, dull=0.45)
        else:
            raise ValueError(name)
        D.rng = keep
        _INST[name] = i
    return _INST[name]


def play(m, name, n, at, dur, vel=1.0, adsr=None):
    """A note on one of the console's instruments, into the mix. A one-shot sample (the harp, the bell) ends sooner the
    higher it plays: its note lets go before the sample runs out, so nothing is cut."""
    f = nf(n) if isinstance(n, str) else n
    i = inst(name)
    s = i.pick(f)
    if not s.loop:
        dur = min(dur, len(s.data) / PSR / (f / s.root) * 0.85 - (adsr or i.adsr)[3])
    y = i.render(f, max(0.05, dur), vel, adsr=adsr)
    y = y * np.clip((len(y) - np.arange(len(y))) / (0.25 * len(y)), 0, 1)
    m.add(ps1.from_psr(y), at)


# ---------------------------------------------------------------- the cues
def register(cue, write, kenney):
    global KEN
    KEN = kenney

    def out(name, x, **kw):
        write(name, psx(x.out() if isinstance(x, Mix) else x, **kw), 'game')

    # ================================================ the heroes' blows (one per weapon)
    @cue('rpg_slash')
    def _slash():
        """The Knight's sword on iron: a short swing, the clang, the crunch, its ring."""
        for k in range(3):
            D.seed(12000 + k)
            m = Mix()
            m.add(whoosh(0.09, [(0, 700), (1, 3200)], at=0.8, q=0.9), 0.0, 0.35)
            hit = 0.035
            m.add(K(f'impact_metal_light_00{k}', -6 - k), hit, 1.0)
            m.add(iron(430 + 70 * k, 0.6, 0.16, 0.8), hit, 0.28)
            m.add(grit(0.07, 0.018, 1500, 7500), hit, 0.55)
            m.add(thud(170, 70, 0.14, 0.04), hit, 0.6)
            out(f'rpg_slash_{k}', m, drive=2.4, wet=0.12, decay=1.0)

    @cue('rpg_stab')
    def _stab():
        """The Rogue's dagger: a quick thin swish, the point going in between plates."""
        for k in range(3):
            D.seed(12100 + k)
            m = Mix()
            m.add(whoosh(0.06, [(0, 2200), (1, 6500)], at=0.85, q=0.8), 0.0, 0.3)
            hit = 0.028
            m.add(K(f'impact_plate_light_00{k}', -4), hit, 0.8)
            m.add(tink(2300 + 250 * k, 0.12, 0.014), hit, 0.45)
            m.add(noise_burst(0.05, 2500, 8000, 0.012), hit + 0.004, 0.5)
            m.add(thud(210, 110, 0.08, 0.022), hit, 0.45)
            out(f'rpg_stab_{k}', m, drive=2.0, wet=0.1, decay=0.9)

    @cue('rpg_bolt')
    def _bolt():
        """The Mage's bolt: a crackling zap falling in pitch, a thump, a glassy ping."""
        for k in range(3):
            D.seed(12200 + k)
            m = Mix()
            d = 0.16
            top = 1900 + 200 * k
            m.add(fmz(0, 1.41, d, 6, 0.06, 0.07, fpath=lambda t: top * (260 / top) ** np.clip(t / d, 0, 1)), 0.0, 0.5)
            m.add(grit(0.14, 0.05, 2000, 9000, dens=4000), 0.0, 0.5)
            m.add(thud(140, 55, 0.18, 0.05), 0.05, 0.7)
            m.add(tink(1500 + 200 * k, 0.2, 0.05, ratios=[(1, 1), (2.0, 0.4), (3.1, 0.2)]), 0.05, 0.25)
            out(f'rpg_bolt_{k}', m, rate=16000, drive=3.0, wet=0.14, decay=1.0)

    @cue('rpg_smite')
    def _smite():
        """The Priest's mace: a dull blow, a small bell of light on it."""
        for k in range(2):
            D.seed(12300 + k)
            m = Mix()
            m.add(whoosh(0.08, [(0, 500), (1, 1800)], at=0.8), 0.0, 0.25)
            hit = 0.04
            m.add(K(f'impact_punch_heavy_00{k}', -2), hit, 0.9)
            m.add(K('impact_metal_light_002', -10), hit, 0.5)
            m.add(iron(1320 + 120 * k, 0.9, 0.35, 0.6, BELL_SMALL), hit + 0.01, 0.25)
            m.add(noise_burst(0.3, 5000, 9500, 0.09, 0.01), hit, 0.18)
            out(f'rpg_smite_{k}', m, drive=1.8, wet=0.22, decay=1.6)

    @cue('rpg_bash')
    def _bash():
        """Bash: the Knight's shield driven in, wood and iron, the frame inside rattling."""
        D.seed(12400)
        m = Mix()
        m.add(whoosh(0.12, [(0, 300), (1, 1400)], at=0.8, q=0.9), 0.0, 0.3)
        hit = 0.08
        m.add(K('impact_wood_heavy_000', -3), hit, 0.9)
        m.add(K('impact_punch_heavy_001', -4), hit, 0.9)
        m.add(K('impact_metal_light_001', -9), hit, 0.6)
        m.add(thud(120, 38, 0.35, 0.11), hit, 0.9)
        m.add(iron(230, 0.9, 0.3, 0.7), hit, 0.22)
        m.add(rattle(0.7, 7, 1400, 4200, 0.06), hit + 0.03, 0.25)
        out('rpg_bash', m, drive=3.0, wet=0.16, decay=1.2)

    @cue('rpg_backstab')
    def _backstab():
        """Backstab: the dagger drawn with a ring, driven in deep, and twisted."""
        D.seed(13600)
        m = Mix()
        t = tt(0.12)
        m.add(swept(0.12, [(0, 3000), (1, 9000)], np.clip(t / 0.01, 0, 1) * np.exp(-t / 0.06), q=0.5), 0.0, 0.35)
        m.add(iron(2400, 0.3, 0.08, 0.7, BAR), 0.0, 0.2)
        hit = 0.1
        m.add(K('impact_punch_heavy_002', -4), hit, 0.9)
        m.add(K('impact_plate_light_003', -6), hit, 0.6)
        m.add(grit(0.16, 0.06, 1300, 5000, dens=1800), hit + 0.02, 0.45)
        m.add(iron(1800, 0.5, 0.12, 0.6, BAR), hit, 0.2)
        out('rpg_backstab', m, drive=3.0, wet=0.12, decay=1.0)

    @cue('rpg_fire')
    def _fire():
        """Fire: the burst on them, its roar and the crackling after (heard once however many it hits)."""
        D.seed(12500)
        d = 1.1
        m = Mix()
        t = tt(d)
        m.add(swept(d, [(0, 500), (0.15, 1800), (1, 400)], np.clip(t / 0.03, 0, 1) * np.exp(-t / 0.32), q=1.2), 0.0, 0.8)
        m.add(D.lp(D.white(0.6), 700) * env_ar(0.6, 0.02, 0.16), 0.0, 0.9)
        m.add(thud(95, 40, 0.3, 0.09, a=0.01), 0.0, 0.6)
        m.add(crackle(1.0, 70, 0.35, 900, 7000), 0.03, 0.6)
        out('rpg_fire', m, rate=16000, drive=2.6, wet=0.18, decay=1.3)

    @cue('rpg_frost')
    def _frost():
        """Frost: ice forming in a rush of crystals, a crack, the cold hissing off it."""
        D.seed(12600)
        m = Mix()
        m.add(rattle(0.4, 16, 2600, 6500, 0.09, tau=0.03, ratios=GLASS), 0.0, 0.5)
        m.add(K('impact_glass_light_001', -3), 0.05, 0.6)
        m.add(grit(0.08, 0.02, 1800, 8000), 0.05, 0.45)
        m.add(noise_burst(0.7, 4000, 10000, 0.22, 0.02), 0.02, 0.22)
        m.add(tink(310, 0.2, 0.05, ratios=[(1, 1), (2.3, 0.4)]), 0.05, 0.45)
        out('rpg_frost', m, drive=1.6, wet=0.24, decay=1.6)

    @cue('rpg_crit')
    def _crit():
        """A critical hit, over the weapon's own sound: a heavy crunch, a boom, the edge's shriek."""
        for k in range(2):
            D.seed(12700 + k)
            m = Mix()
            m.add(K(f'impact_punch_heavy_00{k + 1}', -6), 0.0, 1.0)
            m.add(thud(95, 32, 0.45, 0.14), 0.0, 1.0)
            m.add(grit(0.12, 0.03, 1200, 9000, dens=2500), 0.0, 0.7)
            m.add(iron(620 + 90 * k, 0.8, 0.22, 0.9), 0.0, 0.3)
            m.add(noise_burst(0.1, 6000, 10000, 0.025), 0.0, 0.4)
            out(f'rpg_crit_{k}', m, drive=4.0, wet=0.16, decay=1.2)

    @cue('rpg_combo')
    def _combo():
        """A mark cashed in (Shatter, a Backstab on Stagger): a crack and iron ringing up, a fifth and the octave."""
        D.seed(12800)
        m = Mix()
        m.add(K('impact_metal_light_000', -2), 0.0, 0.8)
        m.add(grit(0.06, 0.015, 2000, 9000), 0.0, 0.5)
        for i, f in enumerate((880, 1320, 1760)):
            m.add(iron(f, 1.0, 0.4, 0.6, BELL_SMALL), 0.03 + i * 0.06, 0.28)
        m.add(rattle(0.5, 10, 3000, 7000, 0.12), 0.05, 0.18)
        out('rpg_combo', m, drive=2.0, wet=0.22, decay=1.5)

    @cue('rpg_shieldbreak')
    def _shieldbreak():
        """A shield broken: a great iron plate splitting, its halo shattering, the pieces coming down."""
        D.seed(12900)
        m = Mix()
        m.add(K('impact_metal_light_001', -12), 0.0, 1.0)
        m.add(K('impact_tin_medium_003', -6), 0.01, 0.7)
        m.add(grit(0.16, 0.05, 1000, 8000, dens=3000), 0.0, 0.8)
        for i in range(3):
            m.add(K(f'impact_glass_light_00{i}', -4 - 2 * i), 0.02 + 0.03 * i, 0.45)
        m.add(iron(300, 1.4, 0.5, 0.8), 0.0, 0.3)
        m.add(rattle(1.2, 14, 900, 4000, 0.18), 0.08, 0.35)
        m.add(thud(110, 40, 0.3, 0.1), 0.0, 0.7)
        out('rpg_shieldbreak', m, drive=3.0, wet=0.2, decay=1.4)

    @cue('rpg_whiff')
    def _whiff():
        """A miss (Smoke Bomb, a dodge, a drowsy swing): the swing alone."""
        for k in range(2):
            D.seed(13000 + k)
            m = Mix()
            m.add(whoosh(0.2, [(0, 700 + 200 * k), (0.6, 3400), (1, 1500)], at=0.45, q=0.8), 0.0, 0.8)
            m.add(D.hp(K('cloth_1', 4), 900)[:secs(0.12)], 0.02, 0.25)
            out(f'rpg_whiff_{k}', m, drive=1.2, wet=0.08, decay=0.8)

    # ================================================ the enemies' blows on the party
    @cue('rpg_hurt')
    def _hurt():
        """A hero takes a blow: a heavy hit on mail, the rings shivering."""
        for k in range(3):
            D.seed(13100 + k)
            m = Mix()
            m.add(K(f'impact_punch_heavy_00{k}', -2 - k), 0.0, 1.0)
            m.add(K(f'impact_soft_heavy_00{k}', -3), 0.0, 0.6)
            m.add(chain(0.16, 60, 2800, 6500, env=lambda u: np.exp(-u / 0.05)), 0.005, 0.35)
            m.add(thud(130, 60, 0.15, 0.05), 0.0, 0.6)
            out(f'rpg_hurt_{k}', m, drive=2.6, wet=0.1, decay=0.9)

    @cue('rpg_bite')
    def _bite():
        """An Ironwing or a Cherub bites: an iron shriek, the snap of its jaw."""
        for k in range(2):
            D.seed(13200 + k)
            m = Mix()
            d = 0.14
            top = 2300 - 300 * k
            m.add(fmz(0, 2.01, d, 2.5, 0.08, 0.06, attack=0.008, fpath=lambda t: top * (1 - 0.3 * t / d) * (1 + 0.04 * np.sin(2 * np.pi * 38 * t))), 0.0, 0.3)
            m.add(D.hp(K('metal_click', 3), 1500), 0.04, 0.7)
            m.add(K('impact_soft_heavy_002', 2), 0.045, 0.5)
            m.add(tink(2900, 0.08, 0.01), 0.045, 0.3)
            out(f'rpg_bite_{k}', m, rate=16000, drive=2.2, wet=0.1, decay=0.9)

    @cue('rpg_hex')
    def _hex():
        """The Confessor's curse lands on the back line: a whisper rushing in, a sour tritone, a blow."""
        D.seed(13300)
        m = Mix()
        t = tt(0.22)
        m.add(swept(0.22, [(0, 1500), (1, 6000)], (t / 0.22) ** 2, q=0.9), 0.0, 0.5)
        m.add(fmz(110, 1.41, 0.55, 3.5, 0.2, 0.22), 0.2, 0.45)
        m.add(fmz(155.6, 1.41, 0.55, 3.0, 0.2, 0.2), 0.2, 0.3)
        m.add(K('impact_soft_heavy_000', -2), 0.2, 0.7)
        m.add(grit(0.2, 0.06, 900, 5000), 0.2, 0.3)
        out('rpg_hex', m, rate=16000, drive=2.0, wet=0.28, decay=1.6)

    @cue('rpg_darkmend')
    def _darkmend():
        """The Confessor mends one of them: a low choir on a tritone, its censer swinging."""
        D.seed(13400)
        m = Mix()
        for n_, v in (('D3', 0.5), ('Ab3', 0.4), ('D4', 0.25)):
            play(m, 'choir_o', n_, 0.0, 0.8, v, adsr=(0.15, 0.4, 0.8, 0.5))
        m.add(chain(0.5, 18, 2200, 5200, env=lambda u: np.sin(np.pi * min(u, 0.5) / 0.5)), 0.1, 0.25)
        m.add(sigh(0.9, 'o', 0.7), 0.05, 0.25)
        out('rpg_darkmend', m, drive=1.2, wet=0.32, decay=2.0)

    # ================================================ the skills (each its own)
    @cue('rpg_taunt')
    def _taunt():
        """Taunt: the sword beaten twice on the shield, a war horn."""
        D.seed(13500)
        m = Mix()
        for at in (0.0, 0.17):
            m.add(K('impact_metal_light_000', -7), at, 0.9)
            m.add(thud(150, 70, 0.12, 0.04), at, 0.5)
        for n_, v in (('D3', 0.9), ('A3', 0.7), ('D2', 0.6)):
            play(m, 'brass', n_, 0.3, 0.75, v, adsr=(0.06, 0.3, 0.85, 0.35))
        m.add(timp('D2', 1.5, 0.9, 711), 0.3, 0.7)
        out('rpg_taunt', m, drive=1.8, wet=0.24, decay=1.8)

    @cue('rpg_smoke')
    def _smoke():
        """Smoke Bomb: a glass vial bursts, the smoke billows out hissing."""
        D.seed(13700)
        m = Mix()
        m.add(K('impact_glass_light_000', -2), 0.0, 0.8)
        m.add(K('impact_glass_light_002', 0), 0.012, 0.5)
        m.add(thud(160, 60, 0.15, 0.05), 0.0, 0.5)
        t = tt(1.4)
        m.add(swept(1.4, [(0, 4200), (1, 900)], np.clip(t / 0.06, 0, 1) * np.exp(-t / 0.5), q=1.6), 0.02, 0.7)
        m.add(D.lp(D.white(1.0), 500) * env_ar(1.0, 0.08, 0.3), 0.02, 0.6)
        out('rpg_smoke', m, drive=1.4, wet=0.22, decay=1.4)

    @cue('rpg_mend')
    def _mend():
        """Mend: the choir on a warm chord, a harp rising, a little light falling."""
        D.seed(13800)
        m = Mix()
        for n_, v in (('D4', 0.55), ('F#4', 0.45), ('A4', 0.45), ('D3', 0.35)):
            play(m, 'choir_a', n_, 0.05, 0.9, v, adsr=(0.12, 0.5, 0.8, 0.6))
        for i, n_ in enumerate(('D4', 'F#4', 'A4', 'D5', 'F#5')):
            play(m, 'harp', n_, i * 0.055, 1.2, 0.5)
        m.add(rattle(1.0, 12, 3500, 7500, 0.35, tau=0.06, ratios=GLASS, decay=1.0), 0.1, 0.12)
        out('rpg_mend', m, drive=1.0, wet=0.34, decay=2.2)

    @cue('rpg_heal')
    def _heal():
        """The Priest heals one: two harp notes, a breath of choir."""
        for k in range(2):
            D.seed(13900 + k)
            m = Mix()
            notes = ('A4', 'D5') if k == 0 else ('F#4', 'D5')
            for n_, v in zip(notes, (0.4, 0.3)):
                play(m, 'choir_a', n_, 0.0, 0.35, v, adsr=(0.06, 0.3, 0.7, 0.4))
            for i, n_ in enumerate(notes):
                play(m, 'harp', n_, i * 0.07, 1.0, 0.45)
            m.add(rattle(0.6, 6, 4000, 7500, 0.15, tau=0.05, ratios=GLASS), 0.05, 0.1)
            out(f'rpg_heal_{k}', m, drive=1.0, wet=0.3, decay=1.8)

    @cue('rpg_ward')
    def _ward():
        """Ward: a deep bell, the barrier humming up round the party."""
        D.seed(14000)
        m = Mix()
        play(m, 'bell', 'D3', 0.0, 2.0, 0.6)
        t = tt(1.6)
        hum = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate((220, 330.4, 440.7))) / 3
        hum *= np.clip(t / 0.25, 0, 1) * np.exp(-np.clip(t - 0.25, 0, None) / 0.5) * (1 + 0.25 * np.sin(2 * np.pi * 7 * t))
        m.add(hum, 0.0, 0.35)
        m.add(D.lp(D.white(0.5), 600) * env_ar(0.5, 0.05, 0.12), 0.0, 0.4)
        m.add(rattle(0.9, 10, 3000, 6000, 0.25, tau=0.05, ratios=GLASS), 0.05, 0.1)
        out('rpg_ward', m, drive=1.2, wet=0.32, decay=2.2)

    @cue('rpg_laststand')
    def _laststand():
        """Last Stand: the shield slammed down, war drums, the horns and the men's choir."""
        D.seed(14100)
        m = Mix()
        m.add(K('impact_metal_light_001', -9), 0.0, 1.0)
        m.add(thud(110, 36, 0.4, 0.14), 0.0, 0.9)
        for at, v in ((0.0, 1.0), (0.36, 0.8), (0.54, 0.9)):
            m.add(timp('D2', 1.6, v, 710 + int(at * 100)), at, 0.8)
        for n_, v in (('D2', 0.7), ('D3', 0.9), ('A3', 0.75), ('D4', 0.4)):
            play(m, 'brass', n_, 0.1, 1.3, v, adsr=(0.1, 0.4, 0.85, 0.5))
        for n_, v in (('D3', 0.4), ('A3', 0.35)):
            play(m, 'choir_a', n_, 0.15, 1.2, v, adsr=(0.2, 0.5, 0.8, 0.6))
        out('rpg_laststand', m, drive=2.0, wet=0.28, decay=2.2)

    @cue('rpg_heist')
    def _heist():
        """Heist: a lock picked in three clicks, coins pouring, a sly harp running up."""
        D.seed(14200)
        m = Mix()
        for i in range(3):
            m.add(D.hp(K('metal_click', 5 + 2 * i), 1000), i * 0.07, 0.6)
        m.add(K('handle_coins', -1), 0.2, 0.9)
        m.add(K('handle_coins_2', 1), 0.32, 0.7)
        for i, n_ in enumerate(('D4', 'E4', 'F4', 'A4', 'Bb4', 'D5', 'E5', 'F5', 'A5', 'D6')):
            play(m, 'harp', n_, 0.18 + i * 0.028, 0.8, 0.35)
        m.add(whoosh(0.3, [(0, 600), (1, 3000)], at=0.7), 0.15, 0.25)
        out('rpg_heist', m, drive=1.4, wet=0.22, decay=1.5)

    @cue('rpg_cataclysm')
    def _cataclysm():
        """Cataclysm: fire comes down, a blast, the crypt's stone falling, the rumble, a choir in terror."""
        D.seed(14300)
        m = Mix()
        t = tt(0.16)
        m.add(swept(0.16, [(0, 300), (1, 2400)], (t / 0.16) ** 1.5, q=1.0), 0.0, 0.6)
        hit = 0.13
        m.add(thud(75, 22, 1.0, 0.45, a=0.004), hit, 1.0)
        m.add(D.lp(D.white(1.2), 2400) * env_ar(1.2, 0.005, 0.35), hit, 0.9)
        m.add(K('impact_punch_heavy_000', -10), hit, 0.9)
        m.add(crackle(1.6, 50, 0.7, 700, 6000), hit + 0.05, 0.6)
        m.add(rattle(1.6, 24, 500, 2800, 0.35), hit + 0.1, 0.4)
        m.add(thunder_roll(2.6, 260, seed=14301), hit + 0.1, 0.9)
        D.seed(14302)
        for n_, v in (('D3', 0.4), ('Eb3', 0.3), ('A3', 0.3)):
            play(m, 'choir_a', n_, hit, 1.2, v, adsr=(0.05, 0.5, 0.6, 0.8))
        out('rpg_cataclysm', m, drive=3.2, wet=0.3, decay=2.4)

    @cue('rpg_miracle')
    def _miracle():
        """Miracle: the whole choir and the organ on a bright chord, bells, the harp, light falling."""
        D.seed(14400)
        m = Mix()
        for n_, v in (('D4', 0.55), ('F#4', 0.45), ('A4', 0.45), ('D5', 0.35), ('D3', 0.4)):
            play(m, 'choir_a', n_, 0.1, 2.0, v, adsr=(0.25, 0.6, 0.85, 0.9))
        for n_, v in (('D3', 0.35), ('A3', 0.3)):
            play(m, 'organ', n_, 0.1, 2.0, v, adsr=(0.2, 0.5, 0.9, 0.8))
        play(m, 'bell', 'D4', 0.1, 2.5, 0.45)
        play(m, 'bell', 'A3', 0.55, 2.5, 0.3)
        for i, n_ in enumerate(('D4', 'F#4', 'A4', 'D5', 'F#5', 'A5', 'D6')):
            play(m, 'harp', n_, 0.05 + i * 0.05, 1.4, 0.4)
        m.add(rattle(2.0, 22, 3500, 8000, 0.6, tau=0.06, ratios=GLASS, decay=1.6), 0.1, 0.12)
        out('rpg_miracle', m, drive=1.0, wet=0.38, decay=2.8)

    @cue('rpg_refuse')
    def _refuse():
        """Not now (a skill not ready, the wrong slot, locked): a latch that will not give."""
        D.seed(14500)
        m = Mix()
        m.add(D.lp(K('metal_latch', -5), 3500), 0.0, 0.9)
        m.add(thud(120, 80, 0.1, 0.03), 0.0, 0.5)
        m.add(D.lp(K('metal_click', -3), 3000), 0.08, 0.5)
        out('rpg_refuse', m, drive=1.6, wet=0.06, decay=0.7)

    # ================================================ the party
    @cue('rpg_levelup')
    def _levelup():
        """A hero levels up: a harp up the chord, the choir, a high bell."""
        D.seed(14600)
        m = Mix()
        for i, n_ in enumerate(('D4', 'F#4', 'A4', 'D5', 'F#5', 'A5')):
            play(m, 'harp', n_, i * 0.06, 1.4, 0.55)
        for n_, v in (('D5', 0.4), ('A4', 0.4), ('F#4', 0.35)):
            play(m, 'choir_a', n_, 0.3, 0.8, v, adsr=(0.08, 0.4, 0.8, 0.6))
        play(m, 'bell', 'D5', 0.3, 1.8, 0.35)
        m.add(rattle(1.2, 14, 4000, 8000, 0.3, tau=0.05, ratios=GLASS), 0.3, 0.12)
        out('rpg_levelup', m, drive=1.0, wet=0.3, decay=2.0)

    @cue('down')
    def _down():
        """A hero falls (audio-first): his armour crashing down, a low toll for him."""
        D.seed(14700)
        m = Mix()
        m.add(K('impact_punch_heavy_001', -5), 0.0, 1.0)
        m.add(K('impact_soft_heavy_001', -2), 0.02, 0.7)
        m.add(K('impact_tin_medium_001', -7), 0.05, 0.5)
        m.add(rattle(0.6, 9, 1200, 4000, 0.08), 0.06, 0.4)
        m.add(thud(100, 40, 0.3, 0.1), 0.0, 0.8)
        play(m, 'bell', 'A2', 0.18, 1.6, 0.55)
        for n_, v in (('D3', 0.3), ('F3', 0.25)):
            play(m, 'choir_o', n_, 0.2, 0.7, v, adsr=(0.15, 0.4, 0.7, 0.6))
        out('down', m, drive=2.0, wet=0.28, decay=2.0)

    @cue('rpg_revive')
    def _revive():
        """Back on his feet (the shrine, a feather): a breath drawn in, the choir rising, a bell."""
        D.seed(14800)
        m = Mix()
        t = tt(0.6)
        m.add(swept(0.6, [(0, 400), (1, 3500)], (t / 0.6) ** 2, q=0.8), 0.0, 0.3)
        for n_, v in (('D4', 0.5), ('A4', 0.45), ('F#4', 0.4)):
            play(m, 'choir_a', n_, 0.25, 1.0, v, adsr=(0.3, 0.5, 0.8, 0.6))
        for i, n_ in enumerate(('A3', 'D4', 'F#4', 'A4', 'D5')):
            play(m, 'harp', n_, 0.3 + i * 0.07, 1.2, 0.45)
        play(m, 'bell', 'D4', 0.55, 1.6, 0.3)
        out('rpg_revive', m, drive=1.0, wet=0.32, decay=2.0)

    @cue('rpg_swap')
    def _swap():
        """The marching order changes: two steps on stone, armour shifting."""
        D.seed(14850)
        m = Mix()
        for at, k in ((0.0, 1), (0.24, 3)):
            m.add(K(f'footstep_wood_00{k}', -5), at, 0.7)
        m.add(chain(0.35, 30, 2600, 6000, env=lambda u: np.sin(np.pi * min(u, 0.35) / 0.35)), 0.04, 0.25)
        m.add(D.hp(K('cloth_2', -1), 600)[:secs(0.25)], 0.06, 0.3)
        out('rpg_swap', m, drive=1.6, wet=0.12, decay=1.0)

    # ================================================ the big moves: wind-ups (cut where they land) and blows
    @cue('rpg_wind_smash')
    def _wind_smash():
        """The Gaoler whirls the ball over his head, faster and faster (3 s; audio-first: you hear it from Excel)."""
        D.seed(14900)
        d = 3.3
        m = Mix()
        t = 0.25
        while t < d - 0.05:
            f = 1.1 + 3.1 * (t / 3.0) ** 1.4
            pd = min(0.5, 0.9 / f)
            m.add(whoosh(pd, [(0, 180), (0.5, 900 + 400 * t / 3), (1, 250)], at=0.5, q=1.1), t, 0.45 + 0.35 * t / 3)
            m.add(chain(0.12, 50, 2400, 6000, env=lambda u: np.exp(-u / 0.05)), t + pd * 0.45, 0.18 + 0.12 * t / 3)
            t += 1 / f
        m.add(chain(0.25, 40, 2200, 5200, env=lambda u: np.sin(np.pi * min(u, 0.25) / 0.25)), 0.0, 0.4)
        m.add(K('impact_tin_medium_000', -8), 0.0, 0.4)
        u = tt(d)
        m.add(drone(55, d, (u / d) ** 1.6, lp=700), 0.0, 0.35)
        m.add(drone(82.4, d, (u / d) ** 2.2, lp=900), 0.0, 0.25)
        out('rpg_wind_smash', m, drive=2.0, wet=0.22, decay=1.6)

    @cue('rpg_smash')
    def _smash():
        """SMASH lands: the iron ball through the floor, the stone breaking, its chain, the rumble."""
        D.seed(15000)
        m = Mix()
        m.add(whoosh(0.1, [(0, 200), (1, 700)], at=0.9, q=1.0), 0.0, 0.6)
        hit = 0.06
        m.add(thud(62, 21, 1.2, 0.45, a=0.003), hit, 1.0)
        m.add(K('impact_punch_heavy_000', -9), hit, 1.0)
        m.add(K('impact_wood_heavy_001', -8), hit, 0.8)
        m.add(D.lp(D.white(0.5), 2800) * env_ar(0.5, 0.003, 0.12), hit, 0.8)
        m.add(rattle(1.2, 28, 500, 2600, 0.25, tau=0.02), hit + 0.05, 0.45)
        m.add(chain(0.5, 36, 2000, 5200, env=lambda u: np.exp(-u / 0.2)), hit + 0.03, 0.4)
        m.add(thunder_roll(1.8, 220, seed=15001), hit + 0.05, 0.8)
        out('rpg_smash', m, drive=3.0, wet=0.28, decay=2.0)

    @cue('rpg_wind_toll')
    def _wind_toll():
        """The Bellringer hauls the rope: the yoke creaks, the bell swings up, the choir draws breath (2 s)."""
        D.seed(15100)
        d = 2.3
        m = Mix()
        m.add(K('creak_1', -6), 0.0, 0.7)
        m.add(K('creak_3', -4), 0.85, 0.6)
        u = tt(d)
        m.add(D.lp(D.brown(d), 220) * (u / d) ** 1.2, 0.0, 0.5)
        for n_, v in (('D3', 0.35), ('Eb3', 0.3), ('A3', 0.3)):
            play(m, 'choir_o', n_, 0.2, d - 0.3, v, adsr=(d - 0.5, 0.3, 1.0, 0.3))
        m.add(D.hp(K('metal_latch', -9), 200), 1.6, 0.3)
        out('rpg_wind_toll', m, drive=1.5, wet=0.3, decay=2.0)

    @cue('rpg_toll')
    def _toll():
        """The bell tolls and the choir comes (Summon), or swells round one of them (Empower)."""
        D.seed(15200)
        m = Mix()
        play(m, 'bell', 'A1', 0.0, 3.5, 1.0)
        play(m, 'bell', 'D2', 0.0, 3.0, 0.5)
        m.add(thud(70, 40, 0.6, 0.25), 0.0, 0.6)
        m.add(K('impact_metal_light_002', -14), 0.0, 0.5)
        for n_, v in (('D3', 0.45), ('A3', 0.4), ('D4', 0.3), ('F3', 0.3)):
            play(m, 'choir_o', n_, 0.12, 1.6, v, adsr=(0.1, 0.5, 0.8, 0.8))
        out('rpg_toll', m, drive=1.8, wet=0.36, decay=2.8)

    @cue('rpg_wind_execute')
    def _wind_execute():
        """The Inquisitor draws the headsman's sword, his wings unfold blade by blade, drums, the organ (3 s)."""
        D.seed(15300)
        d = 3.3
        m = Mix()
        t = tt(0.7)
        m.add(swept(0.7, [(0, 2500), (1, 6500)], np.clip(t / 0.05, 0, 1) * np.clip((0.7 - t) / 0.1, 0, 1), q=0.4), 0.0, 0.5)
        m.add(iron(1100, 1.2, 0.5, 0.8, BAR), 0.65, 0.3)
        m.add(rattle(1.0, 26, 3000, 7500, 0.35, tau=0.03), 0.7, 0.3)
        m.add(whoosh(0.6, [(0, 200), (1, 900)], at=0.6, q=1.0), 0.75, 0.4)
        for at, v in ((1.2, 0.5), (1.9, 0.6), (2.4, 0.7), (2.75, 0.8), (3.0, 0.9)):
            m.add(timp('D2', 0.9, v, 720 + int(at * 10)), at, 0.6)
        for n_, v in (('D2', 0.4), ('Eb2', 0.35), ('A2', 0.3)):
            play(m, 'organ', n_, 0.3, d - 0.4, v, adsr=(d - 0.6, 0.3, 1.0, 0.2))
        out('rpg_wind_execute', m, drive=2.0, wet=0.26, decay=1.8)

    @cue('rpg_execute')
    def _execute():
        """EXECUTE lands: the great swing, the cleave, the blade ringing, a choir stab."""
        D.seed(15400)
        m = Mix()
        m.add(whoosh(0.16, [(0, 250), (1, 2200)], at=0.85, q=0.9), 0.0, 0.7)
        hit = 0.13
        m.add(K('impact_metal_light_001', -10), hit, 1.0)
        m.add(K('impact_punch_heavy_002', -6), hit, 1.0)
        m.add(thud(85, 26, 0.9, 0.35), hit, 1.0)
        m.add(iron(180, 2.0, 0.9, 0.9), hit, 0.3)
        m.add(grit(0.2, 0.06, 1000, 8000, dens=2500), hit, 0.6)
        for n_, v in (('D3', 0.45), ('F3', 0.4), ('Ab3', 0.35)):
            play(m, 'choir_a', n_, hit, 0.5, v, adsr=(0.02, 0.3, 0.6, 0.7))
        out('rpg_execute', m, drive=3.4, wet=0.28, decay=2.0)

    @cue('rpg_wind_hook')
    def _wind_hook():
        """The Penitent swings his hook on its chain (1 s)."""
        D.seed(15500)
        m = Mix()
        for i, at in enumerate((0.05, 0.45, 0.78)):
            m.add(whoosh(0.3, [(0, 300), (0.5, 1500), (1, 400)], at=0.5, q=1.0), at, 0.4 + 0.15 * i)
            m.add(chain(0.1, 50, 2500, 6000, env=lambda u: np.exp(-u / 0.04)), at + 0.14, 0.25)
        out('rpg_wind_hook', m, drive=1.8, wet=0.16, decay=1.2)

    @cue('rpg_hook')
    def _hook():
        """Hook lands: the chain cracks out, the hook bites, the hero dragged to the front."""
        D.seed(15600)
        m = Mix()
        m.add(noise_burst(0.05, 1500, 9000, 0.008), 0.0, 0.8)
        m.add(chain(0.3, 55, 2400, 6200, env=lambda u: np.exp(-u / 0.12)), 0.0, 0.55)
        m.add(K('metal_latch', -2), 0.02, 0.7)
        m.add(K('impact_punch_heavy_001', -1), 0.03, 0.6)
        t = tt(0.6)
        m.add(D.bp(D.white(0.6), 300, 1800) * np.clip(t / 0.03, 0, 1) * np.clip((0.6 - t) / 0.2, 0, 1) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)), 0.12, 0.35)
        m.add(chain(0.6, 30, 2000, 4800, env=lambda u: max(0.0, 1 - u / 0.6)), 0.12, 0.3)
        out('rpg_hook', m, drive=2.4, wet=0.16, decay=1.2)

    @cue('rpg_wind_shove')
    def _wind_shove():
        """The Gravedigger heaves himself up: a growl behind the iron face, two heavy steps, his coffin lids knock (1 s)."""
        D.seed(15700)
        m = Mix()
        m.add(growl(0.75, [(0, 70), (0.4, 92), (0.75, 80)], 'o', 0.9, 0.14, 2.4, 0.55), 0.1, 0.55)
        for at in (0.0, 0.55):
            m.add(K('impact_soft_heavy_000', -6), at, 0.7)
            m.add(thud(80, 40, 0.2, 0.06), at, 0.5)
        m.add(K('impact_wood_heavy_000', -2), 0.56, 0.3)
        m.add(K('impact_wood_heavy_001', 0), 0.62, 0.25)
        out('rpg_wind_shove', m, drive=2.0, wet=0.16, decay=1.2)

    @cue('rpg_shove')
    def _shove():
        """Shove lands: his whole weight, the coffin lids clattering, the hero sliding back."""
        D.seed(15800)
        m = Mix()
        m.add(K('impact_punch_heavy_000', -6), 0.0, 1.0)
        m.add(thud(90, 32, 0.45, 0.14), 0.0, 0.9)
        m.add(K('impact_wood_heavy_000', -4), 0.01, 0.6)
        m.add(K('impact_wood_heavy_001', -3), 0.07, 0.45)
        m.add(rattle(0.7, 12, 1100, 4000, 0.12), 0.02, 0.35)
        t = tt(0.4)
        m.add(D.bp(D.white(0.4), 400, 2500) * np.exp(-t / 0.15), 0.05, 0.3)
        out('rpg_shove', m, drive=2.8, wet=0.18, decay=1.3)

    @cue('rpg_interrupt')
    def _interrupt():
        """Bash stops the SMASH: a sharp clang, the chain going slack, the ball dropping."""
        D.seed(15900)
        m = Mix()
        m.add(K('impact_metal_light_000', -3), 0.0, 1.0)
        m.add(iron(1760, 0.8, 0.25, 0.6, BELL_SMALL), 0.0, 0.35)
        m.add(grit(0.06, 0.015, 2000, 9000), 0.0, 0.5)
        m.add(chain(0.5, 28, 2000, 5000, env=lambda u: np.exp(-u / 0.18)), 0.04, 0.4)
        m.add(K('impact_tin_medium_004', -10), 0.3, 0.45)
        out('rpg_interrupt', m, drive=2.0, wet=0.2, decay=1.4)

    @cue('enrage')
    def _enrage():
        """A boss ENRAGED (audio-first: the fight of the night). One each: 0 the Gaoler, 1 the Bellringer, 2 the
        Inquisitor, 3 the Abbot (also his roar when he wakes on the tithe)."""
        for k in range(4):
            D.seed(16000 + k)
            m = Mix()
            if k == 0:   # muzzled; his chains thrash, the ball drags
                m.add(growl(1.4, [(0, 66), (0.3, 92), (1.0, 86), (1.4, 58)], 'u', 1.0, 0.2, 3.2, 0.62), 0.0, 1.0)
                m.add(chain(1.3, 40, 2200, 5600, env=lambda u: min(1.0, u / 0.2) * np.exp(-u / 0.8)), 0.05, 0.4)
                m.add(D.lp(D.brown(1.0), 600) * env_ar(1.0, 0.1, 0.4), 0.2, 0.5)
            elif k == 1:   # the cracked bell struck over and over, a shriek over it
                m.add(growl(1.2, [(0, 120), (0.4, 160), (1.2, 100)], 'a', 0.9, 0.16, 2.6, 0.8), 0.15, 0.6)
                at = 0.0
                for i in range(7):
                    m.add(iron(330, 0.8, 0.35, 0.8, CRACKED), at, 0.4)
                    at += 0.22 * 0.82 ** i
                for n_, v in (('D5', 0.3), ('Eb5', 0.28)):
                    play(m, 'choir_i', n_, 0.2, 1.0, v, adsr=(0.15, 0.4, 0.8, 0.4))
            elif k == 2:   # an iron roar behind the angel mask, the wings bristling, the organ
                g = growl(1.4, [(0, 72), (0.3, 98), (1.0, 90), (1.4, 62)], 'a', 1.0, 0.18, 3.0, 0.6)
                m.add(g * (0.6 + 0.4 * np.sin(2 * np.pi * 61 * tt(1.4))), 0.0, 1.0)
                m.add(rattle(1.0, 30, 3000, 7500, 0.3, tau=0.025), 0.1, 0.35)
                for n_, v in (('D2', 0.4), ('Eb2', 0.35), ('Ab2', 0.3)):
                    play(m, 'organ', n_, 0.1, 1.1, v, adsr=(0.15, 0.3, 0.9, 0.4))
            else:   # through the iron jaw, the pipe hissing, the jaw-plate rattling
                g = growl(1.5, [(0, 60), (0.35, 84), (1.1, 78), (1.5, 52)], 'o', 1.0, 0.2, 3.0, 0.58)
                m.add(D.bp(g, 150, 2400), 0.0, 1.0)
                t = tt(1.2)
                m.add(D.bp(D.white(1.2), 3000, 9000) * np.clip(t / 0.3, 0, 1) * np.exp(-np.clip(t - 0.3, 0, None) / 0.4), 0.3, 0.35)
                m.add(D.hp(K('metal_latch', -6), 200), 0.02, 0.4)
            m.add(thud(48, 30, 1.2, 0.5, a=0.15), 0.0, 0.5)
            out(f'enrage_{k}', m, drive=2.4, wet=0.26, decay=1.8)

    # ================================================ the fallen (#154): one per kind, the bosses and the Abbot their own
    # The fall lasts DEATH_SEC (0.9 s): the chunks land from about 0.2 s to 0.65 s (taller ones later), so the pieces
    # do; then the light goes out and the last bits settle.
    @cue('die_hollow')
    def _die_hollow():
        """The Hollow: his iron bones, the plate, the kite shield, the greatsword on stone, the great helm rolling."""
        D.seed(17000)
        m = Mix()
        m.add(ember_out(0.7, 760), 0.0, 0.25)
        m.add(rattle(1.0, 16, 900, 3800, 0.18, start=0.15), 0.0, 0.5)
        m.add(K('impact_metal_light_000', -6), 0.26, 0.6)
        m.add(K('impact_tin_medium_001', -5), 0.3, 0.7)
        m.add(K('impact_wood_heavy_000', -3), 0.4, 0.55)
        m.add(thud(110, 45, 0.25, 0.08), 0.4, 0.5)
        m.add(K('impact_metal_light_002', -2), 0.52, 0.8)
        m.add(iron(420, 1.0, 0.4, 0.8, BAR), 0.52, 0.28)
        at = 0.62
        for i in range(5):
            m.add(tink(700 - 20 * i, 0.1, 0.02, BOWL), at, 0.3 * 0.75 ** i)
            at += 0.13 * (1 + 0.1 * i)
        out('die_hollow', m, drive=2.4, wet=0.2, decay=1.5)

    @cue('die_guardian')
    def _die_guardian():
        """The Guardian: his frame in a heap, then the great shield falls face up, its rim ringing, the halo cracking."""
        D.seed(17100)
        m = Mix()
        m.add(ember_out(0.8, 700), 0.0, 0.25)
        m.add(rattle(1.0, 14, 700, 3200, 0.2, start=0.18), 0.0, 0.5)
        m.add(K('impact_tin_medium_002', -6), 0.32, 0.5)
        m.add(K('impact_wood_heavy_001', -5), 0.48, 0.9)
        m.add(K('impact_punch_heavy_002', -6), 0.48, 0.8)
        m.add(thud(90, 36, 0.4, 0.13), 0.48, 0.8)
        m.add(iron(260, 1.6, 0.6, 0.75), 0.48, 0.28)
        m.add(K('impact_glass_light_001', -6), 0.5, 0.45)
        m.add(grit(0.12, 0.04, 1200, 7000), 0.5, 0.45)
        out('die_guardian', m, drive=2.6, wet=0.22, decay=1.6)

    @cue('die_revenant')
    def _die_revenant():
        """The Revenant: the bare frame comes apart, rods and joints in a high heap, the heart-lens humming down and cracking."""
        D.seed(17200)
        m = Mix()
        m.add(fmz(0, 2.0, 0.9, 1.5, 0.3, 0.35, fpath=lambda u: 660 * (110 / 660) ** (u / 0.9)), 0.0, 0.3)
        m.add(rattle(1.2, 26, 500, 2600, 0.2, start=0.12, tau=0.035), 0.0, 0.7)
        m.add(rattle(1.0, 10, 2200, 5200, 0.25, start=0.2), 0.0, 0.3)
        m.add(K('impact_tin_medium_004', -6), 0.36, 0.6)
        m.add(K('impact_metal_light_001', -7), 0.45, 0.5)
        m.add(K('impact_glass_light_002', -3), 0.6, 0.55)
        out('die_revenant', m, drive=2.4, wet=0.22, decay=1.5)

    @cue('die_penitent')
    def _die_penitent():
        """The Penitent: a last breath, his robe in a heap, the scourge's weights, the head-cage rolling off, the candle out."""
        D.seed(17300)
        m = Mix()
        m.add(sigh(0.6, 'a', 0.75), 0.0, 0.35)
        m.add(K('cloth_1', -5), 0.3, 0.7)
        m.add(K('drop_leather', -4), 0.36, 0.7)
        m.add(K('impact_soft_heavy_002', -3), 0.36, 0.6)
        m.add(rattle(0.9, 8, 800, 2600, 0.18, start=0.3), 0.0, 0.35)
        for i, at in enumerate((0.42, 0.48, 0.56)):
            m.add(tink(1900 + 300 * i, 0.12, 0.03), at, 0.35)
        at = 0.5
        for i in range(6):
            m.add(chain(0.06, 80, 1400, 3200), at, 0.35 * 0.8 ** i)
            at += 0.11 * (1 + 0.12 * i)
        m.add(snuff(0.25), 0.62, 0.35)
        out('die_penitent', m, drive=2.2, wet=0.2, decay=1.4)

    @cue('die_confessor')
    def _die_confessor():
        """The Confessor: the glow behind its grille going out in a whisper of choir, the robe, the grille, the crozier,
        the censer on its chain, its last smoke."""
        D.seed(17400)
        m = Mix()
        play(m, 'choir_o', 'A3', 0.0, 0.5, 0.35, adsr=(0.02, 0.3, 0.5, 0.4))
        play(m, 'choir_o', 'Eb3', 0.05, 0.5, 0.3, adsr=(0.02, 0.3, 0.5, 0.4))
        m.add(ember_out(0.9, 600), 0.0, 0.3)
        m.add(K('cloth_2', -4), 0.3, 0.6)
        m.add(K('drop_leather', -6), 0.35, 0.5)
        m.add(K('impact_plate_light_002', -5), 0.42, 0.6)
        m.add(chain(0.2, 60, 2600, 6000, env=lambda u: np.exp(-u / 0.08)), 0.42, 0.3)
        m.add(K('impact_metal_light_001', -1), 0.55, 0.5)
        m.add(iron(700, 0.8, 0.28, 0.7, BAR), 0.55, 0.22)
        m.add(chain(0.3, 40, 2400, 5500, env=lambda u: np.exp(-u / 0.12)), 0.62, 0.35)
        m.add(iron(520, 0.7, 0.25, 0.6, BOWL), 0.66, 0.3)
        t = tt(1.8)
        m.add(D.bp(D.white(1.8), 1200, 4500) * np.clip(t / 0.15, 0, 1) * np.exp(-t / 0.4), 0.7, 0.25)
        out('die_confessor', m, drive=2.0, wet=0.26, decay=1.8)

    @cue('die_cherub')
    def _die_cherub():
        """A Cherub (one per body): the porcelain face cracking, its little iron wings, its halo's spark."""
        for k in range(3):
            D.seed(17500 + k)
            m = Mix()
            t = tt(0.3)
            m.add(np.sin(2 * np.pi * np.cumsum(2400 * 0.25 ** (t / 0.3)) / SR) * np.exp(-t / 0.1) * 0.4, 0.0, 0.35)
            m.add(tink(2600 + 300 * k, 0.1, 0.02), 0.15, 0.35)
            m.add(K(f'impact_glass_light_00{k}', -2 + k), 0.2, 0.8)
            m.add(K(f'impact_plate_light_00{k + 1}', -3), 0.21, 0.6)
            m.add(tink(3100 + 200 * k, 0.1, 0.02), 0.27, 0.25)
            out(f'die_cherub_{k}', m, drive=2.0, wet=0.16, decay=1.1)

    @cue('die_ironwing')
    def _die_ironwing():
        """The Ironwing: a last iron shriek, the leather wings, its struts splaying, the skull."""
        D.seed(17600)
        m = Mix()
        d = 0.34
        m.add(fmz(0, 2.01, d, 3.0, 0.15, 0.14, attack=0.01, fpath=lambda u: 1900 * (650 / 1900) ** (u / d) * (1 + 0.05 * np.sin(2 * np.pi * 31 * u))), 0.0, 0.4)
        m.add(K('cloth_2', -3), 0.3, 0.6)
        m.add(K('drop_leather', -1), 0.34, 0.6)
        m.add(rattle(0.6, 12, 2000, 5000, 0.12, start=0.3), 0.0, 0.4)
        m.add(K('impact_metal_light_000', 3), 0.46, 0.5)
        m.add(ember_out(0.6, 900), 0.3, 0.2)
        out('die_ironwing', m, rate=16000, drive=2.2, wet=0.18, decay=1.3)

    @cue('die_vigil')
    def _die_vigil():
        """The Vigil: its rotor winding down, the iron feathers ticking slower, the drum falling on its side."""
        D.seed(17700)
        m = Mix()
        d = 0.9
        t = tt(d)
        fr = 85 * (12 / 85) ** (t / d)
        m.add(D.bp(D.osc(fr, d, 'saw'), 200, 3000) * np.exp(-t / 0.5) * np.clip(t / 0.01, 0, 1), 0.0, 0.45)
        ph = np.cumsum(fr / 6) / SR
        for i in np.nonzero(np.diff(np.floor(ph)) > 0)[0]:
            m.add(tink(D.rng.uniform(2200, 4200), 0.06, 0.012), i / SR, 0.25)
        m.add(K('impact_tin_medium_003', -6), 0.68, 0.8)
        m.add(K('impact_punch_heavy_001', -4), 0.68, 0.6)
        m.add(rattle(0.7, 12, 1500, 4500, 0.12), 0.7, 0.35)
        m.add(ember_out(0.7, 1000), 0.6, 0.2)
        out('die_vigil', m, drive=2.4, wet=0.2, decay=1.4)

    @cue('die_gravedigger')
    def _die_gravedigger():
        """The Gravedigger: a groan behind the coffin-lid face, his weight coming down, the lids, the spade, his chain."""
        D.seed(17800)
        m = Mix()
        m.add(growl(0.8, [(0, 88), (0.5, 70), (0.8, 50)], 'o', 0.95, 0.12, 2.0, 0.55, env=D.env_lin(0.8, [(0, 0), (0.05, 1), (0.5, 0.6), (0.8, 0)])), 0.0, 0.4)
        for i, (at, s) in enumerate(((0.48, -2), (0.62, -3), (0.8, -4))):
            m.add(K(f'impact_wood_heavy_00{i % 2}', s), at, 0.6)
        m.add(thud(70, 28, 0.6, 0.22), 0.55, 1.0)
        m.add(K('impact_punch_heavy_000', -8), 0.55, 1.0)
        m.add(K('impact_soft_heavy_000', -5), 0.56, 0.7)
        m.add(chain(0.6, 35, 2000, 5000, env=lambda u: np.exp(-u / 0.2)), 0.6, 0.35)
        m.add(K('impact_metal_light_002', -3), 0.72, 0.6)
        m.add(iron(600, 0.9, 0.3, 0.7, BAR), 0.72, 0.22)
        m.add(ember_out(0.7, 640), 0.4, 0.2)
        out('die_gravedigger', m, drive=2.6, wet=0.22, decay=1.6)

    @cue('die_gaoler')
    def _die_gaoler():
        """The Gaoler: a roar dying in the muzzle, the ball dropping, its chain running out, the keys, the giant falling,
        the manacle, the rumble, the last link settling."""
        D.seed(17900)
        m = Mix()
        m.add(growl(1.3, [(0, 84), (0.4, 72), (1.3, 40)], 'u', 1.0, 0.2, 2.8, 0.6, env=D.env_lin(1.3, [(0, 0), (0.06, 1), (0.8, 0.6), (1.3, 0)])), 0.0, 0.7)
        m.add(thud(55, 20, 1.2, 0.5), 0.22, 1.0)
        m.add(K('impact_punch_heavy_000', -10), 0.22, 1.0)
        m.add(D.lp(D.white(0.4), 2400) * env_ar(0.4, 0.003, 0.1), 0.22, 0.6)
        m.add(chain(1.3, 30, 2000, 5200, env=lambda u: np.exp(-u / 0.5)), 0.24, 0.5)
        m.add(rattle(0.8, 14, 3200, 6200, 0.15, tau=0.03), 0.6, 0.3)
        m.add(thud(70, 30, 0.6, 0.25), 0.85, 0.8)
        m.add(K('impact_wood_heavy_001', -6), 0.85, 0.7)
        m.add(K('drop_leather', -6), 0.9, 0.6)
        m.add(K('metal_latch', -6), 1.05, 0.5)
        m.add(thunder_roll(1.6, 200, seed=17901), 0.3, 0.5)
        D.seed(17902)
        m.add(ember_out(1.2, 520), 0.9, 0.25)
        m.add(tink(2100, 0.2, 0.03), 2.1, 0.2)
        out('die_gaoler', m, drive=2.6, wet=0.28, decay=2.2)

    @cue('die_bellringer')
    def _die_bellringer():
        """The Bellringer: the yoke gives, the bell comes down on the stone and tolls once more, cracked, and rolls;
        his candles go out; the choir drops away."""
        D.seed(18000)
        m = Mix()
        for n_, v in (('D3', 0.3), ('A3', 0.28), ('D4', 0.22)):
            play(m, 'choir_o', n_, 0.0, 0.9, v, adsr=(0.05, 0.4, 0.6, 0.9))
        m.add(K('creak_2', -6), 0.0, 0.6)
        m.add(K('impact_wood_heavy_000', -2), 0.32, 0.7)
        m.add(grit(0.15, 0.05, 800, 5000), 0.32, 0.5)
        hit = 0.6
        m.add(thud(65, 30, 0.8, 0.3), hit, 0.9)
        m.add(iron(98, 4.0, 1.8, 0.95, CRACKED), hit, 0.6)
        t = tt(3.0)
        m.add(D.bp(D.white(3.0), 1500, 4000) * np.exp(-t / 0.8) * (0.5 + 0.5 * np.sin(2 * np.pi * 7.3 * t)) ** 2, hit, 0.12)
        for i in range(5):
            m.add(iron(196, 0.4, 0.12, 0.6, CRACKED), hit + 0.55 + i * 0.26 * 1.2 ** i, 0.25 * 0.72 ** i)
        for at in (0.9, 1.1):
            m.add(snuff(0.2), at, 0.3)
        out('die_bellringer', m, drive=2.2, wet=0.34, decay=2.8)

    @cue('die_inquisitor')
    def _die_inquisitor():
        """The Inquisitor: the choir screams and falls, his blade-feathers cascade and shatter, the armour comes down,
        the headsman's sword rings out on the stone, the organ holds the end of judgment."""
        D.seed(18100)
        m = Mix()
        for n_, v in (('D4', 0.4), ('Eb4', 0.35), ('A4', 0.3)):
            play(m, 'choir_a', n_, 0.0, 0.5, v, adsr=(0.03, 0.3, 0.7, 0.3))
        for n_, v in (('D3', 0.4), ('Eb3', 0.35), ('A2', 0.35)):
            play(m, 'choir_a', n_, 0.45, 1.2, v, adsr=(0.1, 0.5, 0.6, 1.0))
        m.add(rattle(1.4, 44, 2800, 7800, 0.35, start=0.1, tau=0.03), 0.0, 0.5)
        for i in range(3):
            m.add(K(f'impact_glass_light_00{i}', -5 - i), 0.25 + 0.12 * i, 0.4)
        hit = 0.85
        m.add(K('impact_punch_heavy_001', -8), hit, 1.0)
        m.add(K('impact_tin_medium_000', -7), hit + 0.02, 0.7)
        m.add(thud(60, 22, 1.0, 0.4), hit, 1.0)
        m.add(K('impact_metal_light_001', -4), hit + 0.2, 0.8)
        m.add(iron(330, 2.2, 1.0, 0.85), hit + 0.2, 0.3)
        for n_, v in (('D2', 0.35), ('A2', 0.3)):
            play(m, 'organ', n_, 0.4, 2.0, v, adsr=(0.3, 0.6, 0.8, 1.0))
        m.add(ember_out(1.4, 480), hit, 0.25)
        out('die_inquisitor', m, drive=2.4, wet=0.34, decay=2.8)

    @cue('die_abbot')
    def _die_abbot():
        """The Abbot: a groan through the jaw-plate, the halo mace, his banner coming down, the war-priest falling, the
        iron jaw, the pipe's last breath, the tithe spilling."""
        D.seed(18200)
        m = Mix()
        g = growl(0.9, [(0, 76), (0.5, 62), (0.9, 44)], 'o', 1.0, 0.16, 2.4, 0.56, env=D.env_lin(0.9, [(0, 0), (0.05, 1), (0.6, 0.5), (0.9, 0)]))
        m.add(D.bp(g, 150, 2400), 0.0, 0.5)
        t = tt(0.7)
        m.add(swept(0.7, [(0, 900), (1, 300)], np.sin(np.pi * t / 0.7) ** 2, q=1.4), 0.3, 0.3)
        m.add(K('impact_metal_light_000', -6), 0.4, 0.8)
        m.add(iron(470, 1.2, 0.45, 0.75, BELL_SMALL), 0.4, 0.25)
        m.add(thud(62, 24, 0.9, 0.35), 0.7, 1.0)
        m.add(K('impact_punch_heavy_002', -9), 0.7, 1.0)
        m.add(K('metal_latch', -3), 0.78, 0.5)
        m.add(K('cloth_1', -6), 0.85, 0.5)
        t2 = tt(1.6)
        m.add(swept(1.6, [(0, 6000), (1, 1500)], np.clip(t2 / 0.08, 0, 1) * np.exp(-t2 / 0.6), q=1.2), 0.9, 0.3)
        m.add(K('handle_coins', -2), 0.95, 0.6)
        m.add(K('handle_coins_2', -3), 1.1, 0.45)
        m.add(ember_out(1.0, 560), 0.8, 0.2)
        out('die_abbot', m, drive=2.4, wet=0.28, decay=2.2)

    # ================================================ the crypt
    @cue('rpg_spotted')
    def _spotted():
        """The next pack sees the party ("!"): a ring of steel, a drum, their eyes lighting, a sour choir stab."""
        D.seed(18300)
        m = Mix()
        m.add(K('impact_metal_light_002', 2), 0.0, 0.6)
        m.add(timp('D2', 1.0, 0.8, 730), 0.0, 0.7)
        d = 0.18
        m.add(fmz(0, 1.5, d, 2.0, 0.1, 0.12, fpath=lambda u: 300 * 3 ** (u / d)), 0.02, 0.35)
        play(m, 'choir_a', 'D4', 0.02, 0.2, 0.3, adsr=(0.01, 0.2, 0.5, 0.3))
        play(m, 'choir_a', 'Ab4', 0.02, 0.2, 0.25, adsr=(0.01, 0.2, 0.5, 0.3))
        out('rpg_spotted', m, drive=2.0, wet=0.24, decay=1.5)

    @cue('rpg_portal')
    def _portal():
        """Through the portal (to the crypt, back to town): a vortex rising and falling, a drone, and through."""
        D.seed(18400)
        d = 1.9
        m = Mix()
        t = tt(d)
        m.add(swept(d, [(0, 150), (0.55, 1800), (1, 350)], np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5, q=1.2), 0.0, 0.7)
        m.add(drone(55, d, np.sin(np.pi * t / d) ** 2, lp=800), 0.0, 0.35)
        m.add(drone(82.4, d, np.sin(np.pi * t / d) ** 2, lp=900), 0.0, 0.25)
        m.add(rattle(1.4, 20, 2500, 7000, 0.5, tau=0.05, ratios=GLASS, decay=2.0), 0.2, 0.12)
        m.add(D.lp(D.white(0.5), 600) * env_ar(0.5, 0.01, 0.12), d - 0.15, 0.6)
        m.add(thud(90, 40, 0.4, 0.12), d - 0.15, 0.5)
        out('rpg_portal', m, drive=1.6, wet=0.3, decay=2.0)

    @cue('rpg_victory')
    def _victory():
        """A boss or the Abbot slain: a drum roll, the brass, the choir and a bell."""
        D.seed(18500)
        m = Mix()
        for i, at in enumerate(np.arange(0, 0.5, 0.06)):
            m.add(timp('D2', 0.6, 0.35 + at, 740 + i), at, 0.5)
        m.add(timp('D2', 2.0, 1.0, 760), 0.55, 0.8)
        for at, notes, dur in ((0.0, ('D3', 'A3'), 0.14), (0.18, ('D3', 'A3'), 0.14), (0.36, ('F3', 'C4'), 0.14), (0.55, ('D3', 'A3', 'D4', 'F#4'), 1.4)):
            for n_ in notes:
                play(m, 'brass', n_, at, dur, 0.7, adsr=(0.02, 0.2, 0.85, 0.4))
        for n_, v in (('D4', 0.4), ('F#4', 0.35), ('A4', 0.35)):
            play(m, 'choir_a', n_, 0.55, 1.4, v, adsr=(0.1, 0.5, 0.85, 0.8))
        play(m, 'bell', 'D4', 0.55, 2.0, 0.4)
        out('rpg_victory', m, drive=1.6, wet=0.3, decay=2.2)

    @cue('rpg_floor')
    def _floor():
        """A floor cleared: the bounty, a bell, a horn."""
        D.seed(18600)
        m = Mix()
        play(m, 'bell', 'D3', 0.0, 2.0, 0.45)
        for n_ in ('D3', 'A3'):
            play(m, 'brass', n_, 0.05, 0.7, 0.55, adsr=(0.06, 0.3, 0.8, 0.4))
        m.add(K('handle_coins', -2), 0.25, 0.7)
        m.add(K('drop_leather', -3), 0.25, 0.5)
        out('rpg_floor', m, drive=1.4, wet=0.28, decay=2.0)

    @cue('wipe')
    def _wipe():
        """PARTY WIPE (audio-first): a dirge on the organ, down to D minor, the funeral bell (he slams the desk on its
        last chord: the real-life slam, sfx.wipe)."""
        D.seed(18800)
        m = Mix()
        for at, ch in ((0.0, ('D3', 'F3', 'A3')), (0.55, ('C3', 'E3', 'A3')), (1.1, ('Bb2', 'D3', 'F3'))):
            for n_ in ch:
                play(m, 'organ', n_, at, 0.5, 0.5, adsr=(0.04, 0.3, 0.9, 0.3))
        for n_ in ('D2', 'A2', 'D3', 'F3'):
            play(m, 'organ', n_, 1.65, 1.8, 0.5, adsr=(0.04, 0.3, 0.9, 0.9))
        for n_, v in (('D3', 0.3), ('A3', 0.25)):
            play(m, 'choir_o', n_, 1.65, 1.6, v, adsr=(0.2, 0.5, 0.8, 0.9))
        play(m, 'bell', 'D2', 0.0, 1.6, 0.4)
        play(m, 'bell', 'D2', 1.65, 3.0, 0.7)
        out('wipe', m, drive=1.6, wet=0.34, decay=2.6)

    @cue('rpg_page')
    def _page():
        """A path card taken (the route choice): parchment, a step down."""
        D.seed(18700)
        m = Mix()
        m.add(D.hp(K('cloth_2', 6), 1500)[:secs(0.18)], 0.0, 0.7)
        m.add(woodtap(900, 0.08), 0.06, 0.4)
        out('rpg_page', m, drive=1.2, wet=0.1, decay=0.9)

    # ================================================ loot
    @cue('rpg_floordrop')
    def _floordrop():
        """A kill drops something: it clinks on the stone and bounces."""
        for k in range(2):
            D.seed(19000 + k)
            m = Mix()
            m.add(K(f'impact_plate_light_00{k + 2}', -4), 0.0, 0.8)
            m.add(tink(1600 + 300 * k, 0.12, 0.02), 0.0, 0.3)
            m.add(K(f'impact_plate_light_00{k + 2}', -1), 0.09, 0.3)
            out(f'rpg_floordrop_{k}', m, drive=1.6, wet=0.14, decay=1.0)

    @cue('rpg_glint')
    def _glint():
        """...and when it is rare or better, it glints as it lands."""
        D.seed(19100)
        m = Mix()
        m.add(iron(2637, 1.0, 0.35, 0.5, GLASS), 0.0, 0.5)
        m.add(rattle(0.6, 8, 4500, 8500, 0.12, tau=0.04, ratios=GLASS), 0.03, 0.2)
        out('rpg_glint', m, drive=1.0, wet=0.26, decay=1.6)

    @cue('rpg_pickup')
    def _pickup():
        """The looter walks over it and picks it up: leather, a small clink."""
        for k in range(2):
            D.seed(18900 + k)
            m = Mix()
            m.add(K('drop_leather', 3 + k), 0.0, 0.6)
            m.add(D.hp(K('cloth_1', 2), 700)[:secs(0.12)], 0.0, 0.3)
            m.add(tink(2400 + 400 * k, 0.08, 0.015), 0.03, 0.25)
            out(f'rpg_pickup_{k}', m, drive=1.4, wet=0.08, decay=0.8)

    @cue('rpg_loot')
    def _loot():
        """It goes in the bag and shows what it is: 0 common, 1 uncommon, 2 rare, 3 epic, each a step richer (the
        legendary has its own)."""
        for r in range(4):
            D.seed(19200 + r)
            m = Mix()
            m.add(K('drop_leather', 1), 0.0, 0.6)
            m.add(tink(1900, 0.08, 0.015), 0.01, 0.2)
            if r >= 1:
                play(m, 'harp', 'A4' if r == 1 else 'D5', 0.06, 0.8, 0.5)
            if r >= 2:
                play(m, 'harp', 'A5', 0.13, 0.9, 0.45)
                play(m, 'bell', 'A4', 0.13, 1.2, 0.25)
                m.add(rattle(0.6, 8, 4000, 8000, 0.15, tau=0.05, ratios=GLASS), 0.13, 0.12)
            if r >= 3:
                for i, n_ in enumerate(('F5', 'A5', 'D6')):
                    play(m, 'harp', n_, 0.2 + i * 0.05, 0.9, 0.4)
                for n_, v in (('D4', 0.3), ('F4', 0.25), ('A4', 0.25)):
                    play(m, 'choir_a', n_, 0.13, 0.7, v, adsr=(0.06, 0.4, 0.8, 0.6))
            out(f'rpg_loot_{r}', m, drive=1.2, wet=0.2 + 0.05 * r, decay=1.4 + 0.3 * r)

    @cue('legendary')
    def _legendary():
        """A legendary (audio-first, unmistakable under Excel): the sky opens: a rising shimmer, a drum, the whole choir
        on D major with the brass, two bells, the harp up to the top, light falling."""
        D.seed(19300)
        m = Mix()
        m.add(ps1.from_psr(ps1.rev_cymbal(0.3, seed=19301)), 0.0, 0.5)
        hit = 0.28
        m.add(timp('D2', 2.0, 1.0, 19302), hit, 0.9)
        m.add(K('impact_metal_light_001', -8), hit, 0.5)
        D.seed(19303)
        for n_, v in (('D4', 0.55), ('F#4', 0.5), ('A4', 0.5), ('D5', 0.45), ('D3', 0.45)):
            play(m, 'choir_a', n_, hit, 1.3, v, adsr=(0.04, 0.5, 0.85, 0.7))
        for n_ in ('D3', 'A3', 'D4'):
            play(m, 'brass', n_, hit, 1.1, 0.6, adsr=(0.03, 0.3, 0.85, 0.5))
        play(m, 'bell', 'D4', hit, 2.0, 0.55)
        play(m, 'bell', 'A4', hit + 0.25, 2.0, 0.35)
        for i, n_ in enumerate(('D5', 'F#5', 'A5', 'D6', 'F#6', 'A6')):
            play(m, 'harp', n_, hit + 0.05 + i * 0.045, 1.0, 0.4)
        m.add(rattle(1.6, 24, 4000, 9000, 0.5, tau=0.05, ratios=GLASS, decay=1.4), hit, 0.15)
        out('legendary', m, drive=1.8, wet=0.32, decay=2.4)

    @cue('bagfull')
    def _bagfull():
        """The bag is full (audio-first): a stuffed bag thumps, the leather strains, then 'nuh-uh' on a dull iron bell."""
        D.seed(19400)
        m = Mix()
        m.add(K('drop_leather', -4), 0.0, 1.0)
        m.add(K('impact_soft_heavy_001', -3), 0.0, 0.6)
        m.add(D.hp(K('cloth_2', -2), 500)[:secs(0.25)], 0.03, 0.4)
        for at, f in ((0.16, nf('A3')), (0.3, nf('E3'))):
            m.add(iron(f, 0.35, 0.12, 0.35, BOWL) * env_ar(0.35, 0.005, 0.1), at, 0.6)
            m.add(thud(f * 0.5, f * 0.5, 0.2, 0.06), at, 0.3)
        out('bagfull', m, drive=2.0, wet=0.14, decay=1.0)

    @cue('trash')
    def _trash():
        """An item thrown in the bag's trash (#148): it lands in an iron bin, a crunch, two dull notes down."""
        D.seed(19500)
        m = Mix()
        m.add(K('impact_tin_medium_002', -3), 0.0, 0.85)
        m.add(D.fade(D.hp(K('cloth_2', -1), 900)[:secs(0.2)], 0.002, 0.06), 0.04, 0.55)
        m.add(rattle(0.4, 6, 1500, 4200, 0.06), 0.02, 0.3)
        for at, f in ((0.12, nf('D4')), (0.21, nf('A3'))):
            m.add(iron(f, 0.3, 0.1, 0.4, BOWL), at, 0.4)
        out('trash', m, drive=1.8, wet=0.12, decay=1.0)

    @cue('rpg_gold')
    def _gold():
        """Gold in the realm (a reliquary's old coins, the guild bank): coins in the hand, one more on top."""
        D.seed(19600)
        m = Mix()
        m.add(K('handle_coins', -1), 0.0, 0.8)
        m.add(K('handle_coins_2', 1), 0.08, 0.5)
        m.add(tink(3300, 0.1, 0.02, ratios=[(1, 1), (2.4, 0.4)]), 0.25, 0.25)
        out('rpg_gold', m, drive=1.4, wet=0.14, decay=1.0)

    @cue('rpg_sell')
    def _sell():
        """Sold to the merchant: set on the counter, coins pushed back."""
        D.seed(19900)
        m = Mix()
        m.add(woodtap(420, 0.1, 1.0), 0.0, 0.6)
        m.add(K('handle_coins_2', -2), 0.06, 0.8)
        m.add(tink(2900, 0.1, 0.02, ratios=[(1, 1), (2.4, 0.4)]), 0.2, 0.25)
        out('rpg_sell', m, drive=1.4, wet=0.12, decay=1.0)

    @cue('rpg_souls')
    def _souls():
        """Souls (salvage, auto-salvage): something drawn out of the iron, a whisper of choir, a glass note."""
        D.seed(19700)
        m = Mix()
        t = tt(0.45)
        m.add(swept(0.45, [(0, 600), (1, 3000)], (t / 0.45) ** 2.2, q=0.9), 0.0, 0.45)
        play(m, 'choir_o', 'D4', 0.3, 0.3, 0.35, adsr=(0.03, 0.3, 0.5, 0.4))
        play(m, 'choir_o', 'A4', 0.3, 0.3, 0.3, adsr=(0.03, 0.3, 0.5, 0.4))
        m.add(iron(1760, 0.8, 0.25, 0.5, GLASS), 0.43, 0.3)
        m.add(thud(110, 60, 0.2, 0.06), 0.43, 0.4)
        out('rpg_souls', m, drive=1.2, wet=0.28, decay=1.6)

    @cue('rpg_identify')
    def _identify():
        """The Appraiser reads it: parchment, the runes lighting up one after another (then its rarity's sound)."""
        D.seed(19800)
        m = Mix()
        m.add(D.hp(K('cloth_2', 5), 1200)[:secs(0.25)], 0.0, 0.5)
        m.add(grit(0.3, 0.12, 2500, 8000, dens=300), 0.02, 0.4)
        for i in range(6):
            m.add(iron(1200 * 2 ** (i / 6), 0.3, 0.08, 0.5, GLASS), 0.08 + i * 0.045, 0.12 + 0.02 * i)
        out('rpg_identify', m, drive=1.2, wet=0.22, decay=1.4)

    @cue('rpg_list')
    def _list():
        """Listed at the market: the quill, the wax seal pressed."""
        D.seed(20000)
        m = Mix()
        for at, d in ((0.0, 0.09), (0.12, 0.07), (0.22, 0.12)):
            t = tt(d)
            m.add(D.bp(D.white(d), 2500, 7000) * np.sin(np.pi * t / d) * (0.6 + 0.4 * D.smooth_rand(d, 60, 0, 1)), at, 0.4)
        m.add(thud(140, 70, 0.15, 0.04), 0.45, 0.7)
        m.add(K('impact_soft_heavy_002', 1), 0.45, 0.5)
        out('rpg_list', m, drive=1.2, wet=0.12, decay=1.0)

    @cue('rpg_build')
    def _build():
        """A building raised or upgraded: three hammer blows, a horn chord, a bell."""
        D.seed(20100)
        m = Mix()
        for i, at in enumerate((0.0, 0.2, 0.4)):
            m.add(K(f'impact_wood_heavy_00{i % 2}', -1 + i), at, 0.7)
            m.add(K('impact_metal_light_000', -4 + i), at, 0.35)
            m.add(rattle(0.2, 4, 700, 2500, 0.04), at + 0.01, 0.2)
        for n_ in ('D3', 'A3', 'D4'):
            play(m, 'brass', n_, 0.62, 0.7, 0.6, adsr=(0.04, 0.3, 0.85, 0.5))
        play(m, 'bell', 'A3', 0.62, 1.4, 0.3)
        out('rpg_build', m, drive=1.6, wet=0.24, decay=1.8)

    @cue('rpg_tree')
    def _tree():
        """A point in the tree: a rune catches fire, two iron notes, a breath of choir, its ember."""
        D.seed(20200)
        m = Mix()
        m.add(D.lp(D.white(0.4), 500) * env_ar(0.4, 0.02, 0.1), 0.0, 0.6)
        m.add(thud(100, 50, 0.3, 0.08), 0.0, 0.5)
        for i, f in enumerate((nf('A4'), nf('E5'))):
            m.add(iron(f, 1.2, 0.45, 0.6, BELL_SMALL), 0.02 + 0.04 * i, 0.3)
        for n_, v in (('A3', 0.3), ('E4', 0.28)):
            play(m, 'choir_a', n_, 0.05, 0.6, v, adsr=(0.05, 0.4, 0.7, 0.5))
        m.add(crackle(0.5, 40, 0.2, 2000, 8000), 0.03, 0.3)
        out('rpg_tree', m, drive=1.4, wet=0.26, decay=1.8)

    @cue('rpg_respec')
    def _respec():
        """Respec: the runes going dark (a ring backwards), the Souls drawn back."""
        D.seed(20300)
        m = Mix()
        m.add(iron(nf('A4'), 0.7, 0.25, 0.6, BELL_SMALL)[::-1], 0.0, 0.35)
        t = tt(0.6)
        m.add(swept(0.6, [(0, 3000), (1, 400)], np.sin(np.pi * t / 0.6), q=0.9), 0.1, 0.4)
        out('rpg_respec', m, drive=1.2, wet=0.24, decay=1.4)

    @cue('rpg_equip')
    def _equip():
        """Equipped: the buckle, a strap pulled tight, the mail settling."""
        for k in range(2):
            D.seed(20400 + k)
            m = Mix()
            m.add(K('metal_latch', -2 - 2 * k), 0.0, 0.7)
            m.add(K('metal_click', -3), 0.12, 0.5)
            m.add(chain(0.2, 70, 2500, 6000, env=lambda u: np.exp(-u / 0.07)), 0.0, 0.3)
            m.add(D.hp(K('cloth_1', 0), 600)[:secs(0.15)], 0.02, 0.3)
            out(f'rpg_equip_{k}', m, drive=1.6, wet=0.08, decay=0.8)

    @cue('rpg_unequip')
    def _unequip():
        """Taken off: a buckle undone, leather sliding."""
        D.seed(20500)
        m = Mix()
        m.add(K('metal_click', -4), 0.0, 0.7)
        m.add(D.hp(K('cloth_2', 1), 500)[:secs(0.2)], 0.03, 0.5)
        m.add(chain(0.12, 60, 2500, 5500, env=lambda u: np.exp(-u / 0.05)), 0.05, 0.2)
        out('rpg_unequip', m, drive=1.4, wet=0.08, decay=0.8)

    @cue('rpg_drop')
    def _drop():
        """Dropped from the bag: set down on the stone."""
        D.seed(20600)
        m = Mix()
        m.add(K('impact_plate_light_000', -6), 0.0, 0.7)
        m.add(K('drop_leather', 2), 0.0, 0.5)
        out('rpg_drop', m, drive=1.4, wet=0.1, decay=0.9)

    @cue('rpg_lock')
    def _lock():
        """Locked or unlocked: a small key turning in an iron lock."""
        D.seed(20700)
        m = Mix()
        m.add(K('metal_click', 4), 0.0, 0.7)
        m.add(K('metal_latch', 2), 0.07, 0.6)
        out('rpg_lock', m, drive=1.4, wet=0.08, decay=0.8)

    @cue('rpg_ui')
    def _ui():
        """The realm's own buttons (the town's tabs, the tree, the heroes): a soft tick on stone and parchment."""
        for k in range(2):
            D.seed(20800 + k)
            m = Mix()
            m.add(woodtap(1100 + 400 * k, 0.06, 1.0), 0.0, 0.7)
            m.add(D.bp(D.white(0.03), 3000, 8000) * D.env_exp(0.03, 0.006), 0.0, 0.25)
            out(f'rpg_ui_{k}', m, drive=1.2, wet=0.0)

    # ================================================ curios
    @cue('rpg_curio')
    def _curio():
        """Something stands in the corridor: a low hum of choir, two harp notes, the crypt's air."""
        D.seed(21000)
        m = Mix()
        play(m, 'choir_m', 'D3', 0.0, 0.9, 0.35, adsr=(0.3, 0.4, 0.8, 0.6))
        play(m, 'choir_m', 'A3', 0.0, 0.9, 0.25, adsr=(0.3, 0.4, 0.8, 0.6))
        play(m, 'harp', 'D4', 0.1, 1.0, 0.4)
        play(m, 'harp', 'A4', 0.28, 1.0, 0.35)
        t = tt(1.4)
        m.add(D.bp(D.white(1.4), 300, 1200) * np.sin(np.pi * t / 1.4) ** 2, 0.0, 0.25)
        out('rpg_curio', m, drive=1.0, wet=0.32, decay=2.0)

    @cue('rpg_pick')
    def _pick():
        """Picking the lock: small iron clicks, feeling for the pins."""
        D.seed(21100)
        m = Mix()
        at = 0.0
        for i in range(9):
            m.add(D.hp(K('metal_click', 6 + D.rng.uniform(0, 4)), 1500), at, D.rng.uniform(0.3, 0.7))
            at += D.rng.uniform(0.08, 0.17)
        out('rpg_pick', m, drive=1.4, wet=0.08, decay=0.8)

    @cue('rpg_chest')
    def _chest():
        """The chest opens (picked, or the armful while he snores): the hinge, the lid, coins, a glint."""
        D.seed(21200)
        m = Mix()
        m.add(K('creak_2', -3), 0.0, 0.6)
        m.add(K('impact_wood_heavy_001', 2), 0.42, 0.5)
        m.add(K('handle_coins', 0), 0.5, 0.7)
        play(m, 'harp', 'D5', 0.55, 0.8, 0.35)
        m.add(iron(2637, 0.8, 0.25, 0.5, GLASS), 0.6, 0.2)
        out('rpg_chest', m, drive=1.4, wet=0.2, decay=1.4)

    @cue('rpg_crash')
    def _crash():
        """The chest smashed: wood splintering, its iron bands, what was inside spilling."""
        D.seed(21300)
        m = Mix()
        m.add(K('impact_wood_heavy_000', -2), 0.0, 1.0)
        m.add(K('impact_wood_heavy_001', -4), 0.03, 0.8)
        m.add(thud(90, 40, 0.3, 0.1), 0.0, 0.7)
        m.add(crackle(0.5, 220, 0.12, 900, 6000), 0.0, 0.7)
        m.add(rattle(0.8, 10, 800, 3000, 0.12), 0.04, 0.4)
        m.add(K('handle_coins_2', -1), 0.15, 0.5)
        out('rpg_crash', m, drive=2.6, wet=0.2, decay=1.4)

    @cue('rpg_kick')
    def _kick():
        """The potion rack kicked: a boot on wood, the bottles rattling."""
        D.seed(21400)
        m = Mix()
        m.add(K('impact_wood_heavy_001', -3), 0.0, 0.9)
        m.add(thud(110, 50, 0.2, 0.06), 0.0, 0.6)
        m.add(rattle(0.5, 12, 1800, 4500, 0.08, tau=0.04, ratios=GLASS), 0.02, 0.4)
        out('rpg_kick', m, drive=2.0, wet=0.14, decay=1.1)

    @cue('rpg_glass')
    def _glass():
        """...and the bottles go: glass breaking on stone, the potion splashing."""
        D.seed(21500)
        m = Mix()
        for i in range(3):
            m.add(K(f'impact_glass_light_00{i}', -3 + i), 0.05 + 0.04 * i, 0.8)
        m.add(rattle(0.8, 18, 2500, 7000, 0.12, tau=0.025, ratios=GLASS), 0.06, 0.4)
        t = tt(0.4)
        m.add(D.bp(D.white(0.4), 500, 2500) * np.exp(-t / 0.12), 0.08, 0.4)
        for at, f in ((0.12, 600), (0.18, 820), (0.26, 520)):
            m.add(D.bubble(f, 0.6), at, 0.4)
        out('rpg_glass', m, drive=2.0, wet=0.18, decay=1.3)

    @cue('rpg_groan')
    def _groan():
        """The reliquary's stone lid ground open."""
        D.seed(21600)
        m = Mix()
        d = 1.0
        t = tt(d)
        grind = D.bp(D.brown(d), 150, 1200) * (0.5 + 0.5 * np.abs(D.smooth_rand(d, 14, -1, 1))) * np.sin(np.pi * t / d) ** 0.6
        m.add(grind, 0.0, 0.9)
        m.add(grit(d, 0.6, 800, 4000, dens=500), 0.0, 0.4)
        m.add(K('creak_3', -6), 0.1, 0.4)
        m.add(thud(90, 50, 0.3, 0.1), 0.95, 0.5)
        out('rpg_groan', m, drive=1.8, wet=0.26, decay=1.6)

    @cue('rpg_curse')
    def _curse():
        """A curse on the party: a whisper, a low sour chord, a hiss."""
        D.seed(21700)
        m = Mix()
        m.add(sigh(1.0, 'o', 0.7), 0.0, 0.4)
        for n_, v in (('D2', 0.45), ('Eb2', 0.4), ('A2', 0.3)):
            play(m, 'organ', n_, 0.1, 0.9, v, adsr=(0.15, 0.4, 0.8, 0.5))
        t = tt(0.8)
        m.add(D.bp(D.white(0.8), 2500, 7000) * np.clip(t / 0.2, 0, 1) * np.exp(-t / 0.3), 0.2, 0.3)
        out('rpg_curse', m, drive=1.6, wet=0.3, decay=2.0)

    @cue('rpg_bless')
    def _bless():
        """A run blessing taken, one each: 0 the war shrine, 1 the pilgrim's oath, 2 the supply cache, 3 the blood
        altar, 4 the moonwell, 5 the ritual, 6 the potion caught."""
        for k in range(7):
            D.seed(21800 + k)
            m = Mix()
            if k == 0:
                m.add(timp('D2', 1.2, 0.9, 790), 0.0, 0.8)
                play(m, 'bell', 'D3', 0.0, 1.4, 0.4)
                for n_ in ('D3', 'A3'):
                    play(m, 'choir_a', n_, 0.05, 0.6, 0.4, adsr=(0.04, 0.4, 0.8, 0.5))
            elif k == 1:
                for n_, v in (('D4', 0.35), ('G4', 0.3), ('B4', 0.3)):
                    play(m, 'choir_o', n_, 0.0, 0.9, v, adsr=(0.2, 0.4, 0.8, 0.7))
                play(m, 'harp', 'G4', 0.1, 1.0, 0.35)
                play(m, 'harp', 'D5', 0.22, 1.0, 0.3)
            elif k == 2:
                m.add(K('drop_leather', -3), 0.0, 0.8)
                m.add(rattle(0.4, 6, 1500, 4000, 0.06), 0.02, 0.3)
                play(m, 'harp', 'A4', 0.15, 1.0, 0.4)
                play(m, 'harp', 'D5', 0.25, 1.0, 0.35)
            elif k == 3:
                for n_, v in (('D2', 0.45), ('A2', 0.35)):
                    play(m, 'organ', n_, 0.0, 1.0, v, adsr=(0.15, 0.4, 0.8, 0.5))
                for at in (0.1, 0.32, 0.9, 1.12):
                    m.add(thud(65, 40, 0.2, 0.06), at, 0.6)
                t = tt(0.6)
                m.add(D.bp(D.white(0.6), 2000, 6000) * np.clip(t / 0.1, 0, 1) * np.exp(-t / 0.2), 0.0, 0.25)
            elif k == 4:
                for at, f in ((0.0, 700), (0.09, 950), (0.2, 620), (0.31, 1100)):
                    m.add(D.bubble(f, 0.6), at, 0.4)
                m.add(rattle(1.0, 14, 3500, 7500, 0.3, tau=0.05, ratios=GLASS), 0.1, 0.15)
                for n_, v in (('A4', 0.3), ('D5', 0.25)):
                    play(m, 'choir_o', n_, 0.2, 0.8, v, adsr=(0.2, 0.4, 0.8, 0.6))
            elif k == 5:
                for n_, v in (('D2', 0.45), ('A2', 0.4), ('D3', 0.3)):
                    play(m, 'choir_m', n_, 0.0, 1.0, v, adsr=(0.6, 0.4, 0.9, 0.5))
                for at in (0.35, 0.7, 1.0):
                    m.add(timp('D2', 0.8, 0.6 + at * 0.3, 795 + int(at * 10)), at, 0.5)
            else:
                m.add(K('impact_glass_light_001', 2), 0.0, 0.6)
                m.add(fmz(0, 1.0, 0.05, 0.0, 1, 0.012, fpath=lambda u: 700 + 0 * u), 0.12, 0.4)   # the cork
                m.add(D.bubble(500, 0.6), 0.2, 0.4)
                play(m, 'harp', 'D5', 0.15, 0.8, 0.35)
            out(f'rpg_bless_{k}', m, drive=1.4, wet=0.28, decay=1.8)

    @cue('rpg_sneak')
    def _sneak():
        """Sneaking past the sleeping Abbot: soft steps, cloth."""
        D.seed(21900)
        m = Mix()
        for at, k in ((0.0, 0), (0.35, 2), (0.7, 4)):
            m.add(D.lp(K(f'footstep_carpet_00{k}', -3), 2500), at, 0.6)
            m.add(D.hp(K('cloth_1', -2), 500)[:secs(0.15)], at + 0.05, 0.25)
        out('rpg_sneak', m, drive=1.0, wet=0.16, decay=1.2)

    @cue('rpg_withdraw')
    def _withdraw():
        """One item from the guild bank, quietly: a sleeve, a clink."""
        D.seed(22000)
        m = Mix()
        m.add(D.hp(K('cloth_2', 2), 600)[:secs(0.2)], 0.0, 0.5)
        m.add(tink(2800, 0.1, 0.02), 0.12, 0.3)
        m.add(K('handle_coins_2', 2), 0.16, 0.35)
        out('rpg_withdraw', m, drive=1.2, wet=0.12, decay=1.0)

    # ================================================ the loot goblin (Goblin Fuel's mascot: as it always was)
    @cue('goblin')
    def _goblin():
        """A loot goblin (audio-first): a purse jingling, its giggle."""
        D.seed(2000)
        m = Mix()
        m.add(K('handle_coins'), 0.0, 0.55)
        m.add(K('handle_coins_2', 2), 0.14, 0.35)
        m.add(giggle(5, 720), 0.1, 0.8)
        out('goblin', m, drive=1.4, wet=0.14, decay=1.2)

    @cue('goblincatch')
    def _goblincatch():
        """Caught (audio-first): its squeal, the purse bursting."""
        D.seed(2001)
        d = 0.42
        t = tt(d)
        f = np.interp(t, [0, 0.22, d], [850, 1550, 1300])
        F = np.tile(np.array(D.VOWELS['i']) * 1.25, (len(t), 1))
        F[:, 0] = np.interp(t, [0, d], [400, 900])
        sq = D.voice(f, D.env_lin(d, [(0, 0), (0.02, 1), (0.3, 1), (d, 0)]), F, breath=0.4, tilt=0.7, jitter=0.05, maxf=7000)
        sq = np.tanh(2 * sq / (np.max(np.abs(sq)) + 1e-9))
        m = Mix()
        m.add(sq, 0.0, 0.75)
        m.add(K('handle_coins'), 0.18, 0.8)
        m.add(K('handle_coins_2', -1), 0.26, 0.6)
        m.add(iron(2637, 0.6, 0.2, 0.5, GLASS), 0.2, 0.2)
        out('goblincatch', m, drive=1.4, wet=0.14, decay=1.2)

    @cue('goblinlost')
    def _goblinlost():
        """It got away (audio-first): a last giggle, its purse jingling off into the dark."""
        D.seed(2002)
        m = Mix()
        m.add(giggle(2, 560, 5.0, 'e', 0.85), 0.0, 0.8)
        coins = np.concatenate([K('handle_coins'), K('handle_coins')])
        away = D.lp(coins[:secs(1.0)] * np.interp(tt(1.0), [0, 1.0], [0.8, 0]), 2500)
        m.add(away, 0.3)
        out('goblinlost', m, drive=1.2, wet=0.22, decay=1.6)
