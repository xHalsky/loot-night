"""Age of Judgment's music in play (#159): Ravenhold (the town), the Crypt (the dungeon), Judgment (a boss fight).
Registered into make.py:

    python3 tools/sfx/make.py mus_town mus_dungeon mus_boss

The flavour Paweł asked for: the King's Field revival (Lunacid, Queen's Domain), King's Field's lonely sampled
instruments in the dark mixed with lofi. So the console's own instruments from ps1.py (the launch theme's: strings,
choir, organ, brass, flute, harp, the bell, timpani, plus a round bass), sequenced on its 24 voices with its reverb;
under them a lofi beat (a dusty kick, a soft snare, swung hats) and on the whole a lofi master: tape wow and flutter,
a warm low-pass, a little saturation, vinyl crackle and hiss. Original music, in D like the launch's theme.

Each track is an exact loop: it is rendered twice and the second pass is kept, so the notes and the reverb ringing over
the loop's end are the ones that ring into its start; the tape's wow runs a whole number of cycles per loop. The file
carries LOOP_PAD of wrap-around on both sides like her loops; LOOP_SEC in src/data/sounds.ts holds the lengths below.
"""
import os
import subprocess
import tempfile

import numpy as np
from scipy import signal
from scipy.io import wavfile

import dsp as D
import ps1
from dsp import SR, tt
from ps1 import PSR, nf
import aoj_sfx as A

LENGTHS = {'mus_town': 76.8, 'mus_dungeon': 64.0, 'mus_boss': 60.0}   # = LOOP_SEC (bars x beats x 60 / BPM)


# ---------------------------------------------------------------- instruments
def bass_samples():
    """A round, warm bass (a sine with two soft harmonics), looped."""
    out = []
    for root in ('D1', 'D2'):
        f = nf(root)

        def fn(t, ff):
            return (np.sin(2 * np.pi * ff * t) + 0.35 * np.sin(4 * np.pi * ff * t) + 0.12 * np.sin(6 * np.pi * ff * t)) / 1.4
        data, loop, ft = ps1._periodic(f, max(1, int(round(f / 18))), fn)
        out.append(ps1.Sample(data, ft, loop))
    return out


_I = {}


def I(name):
    """The console's instruments, built once with their own seed."""
    if name not in _I:
        keep = D.rng
        D.seed(9300 + sum(map(ord, name)))
        mk = ps1.Instrument
        i = {
            'strings': lambda: mk(ps1.strings_samples(), adsr=(0.6, 0.8, 0.9, 1.4), pan=-0.3, gain=0.26),
            'ostinato': lambda: mk(ps1.strings_samples(), adsr=(0.01, 0.12, 0.7, 0.08), pan=-0.25, gain=0.3),
            'organ': lambda: mk(ps1.organ_samples(), adsr=(1.2, 1.0, 0.9, 2.0), pan=0.0, gain=0.36),
            'organ_pad': lambda: mk(ps1.organ_samples(), adsr=(0.25, 0.6, 0.85, 1.6), pan=-0.15, gain=0.26),
            'choir_o': lambda: mk(ps1.choir_samples('o'), adsr=(1.4, 1.0, 0.9, 1.8), pan=0.2, gain=0.26),
            'choir_a': lambda: mk(ps1.choir_samples('a'), adsr=(0.04, 0.4, 0.6, 0.6), pan=0.15, gain=0.3),
            'brass': lambda: mk(ps1.brass_samples(), adsr=(0.08, 1.2, 0.6, 0.6), pan=0.1, gain=0.42),
            'flute': lambda: mk(ps1.flute_samples(), adsr=(0.09, 0.4, 0.85, 0.7), pan=0.3, gain=0.36),
            'harp': lambda: mk(ps1.harp_samples(), adsr=(0.002, 2.0, 1.0, 0.6), pan=-0.35, gain=0.22),
            'box': lambda: mk(ps1.harp_samples(), adsr=(0.002, 2.0, 1.0, 0.9), pan=0.35, gain=0.2),   # the crypt's music box
            'bell': lambda: mk([ps1.bell_sample('D3')], adsr=(0.002, 2.5, 1.0, 2.5), pan=0.05, gain=0.3),
            'bass': lambda: mk(bass_samples(), adsr=(0.01, 0.5, 0.75, 0.15), pan=0.0, gain=0.24),
        }[name]()
        D.rng = keep
        _I[name] = i
    return _I[name]


# ---------------------------------------------------------------- the drums (made at 44.1 kHz, then the console's)
def _ps(x):
    return ps1.adpcm(np.clip(ps1.to_psr(x), -1, 1))


def kick(f0=115, f1=48, d=0.5, tau=0.17):
    y = A.kick(f0, f1, d, tau, 1.8, 0.035)
    c = A.slap(0.006, 1500, 5000)
    y[:len(c)] += c * 0.15
    return _ps(D.lp(y, 3500) * 0.9)


def snare(tone=185, tau=0.13, bright=5500, d=0.45):
    t = tt(d)
    body = np.sin(2 * np.pi * tone * t) * np.exp(-t / 0.06)
    nz = D.bp(D.white(d), 900, bright) * np.exp(-t / tau)
    return _ps(D.lp(body * 0.55 + nz * 1.2, 6500) * 0.7)


def rim():
    t = tt(0.08)
    return _ps((D.bp(D.white(0.08), 1500, 4500) * np.exp(-t / 0.008) + 0.5 * np.sin(2 * np.pi * 820 * t) * np.exp(-t / 0.012)) * 0.6)


def hat(open_=False):
    d = 0.3 if open_ else 0.06
    t = tt(d)
    return _ps(D.hp(D.white(d), 6000) * np.exp(-t / (0.12 if open_ else 0.018)) * 0.45)


def shaker():
    t = tt(0.1)
    return _ps(D.bp(D.white(0.1), 3000, 9000) * np.clip(t / 0.012, 0, 1) * np.exp(-t / 0.035) * 0.35)


def brush():
    t = tt(0.25)
    return _ps(D.bp(D.white(0.25), 1500, 6000) * np.clip(t / 0.03, 0, 1) * np.exp(-t / 0.07) * 0.5)


def crash(d=2.2):
    t = tt(d)
    return _ps(D.hp(D.white(d), 3500) * np.exp(-t / 0.55) * 0.45)


def drip(f):
    return _ps(D.bubble(f, 0.6))


# ---------------------------------------------------------------- a song: two passes, the second kept
class Song:
    def __init__(self, bpm, bars, seed, swing=0.06):
        self.spb = 60.0 / bpm
        self.bars = bars
        self.L = bars * 4 * self.spb
        self.swing = swing
        self.mus = ps1.Sequencer(2 * self.L + 6)
        self.drm = ps1.Sequencer(2 * self.L + 6)
        D.seed(seed)

    def at(self, bar, beat, human=0.0):
        b = beat + (self.swing if abs(beat % 1 - 0.5) < 1e-6 else 0.0)   # the offbeat eighths lag: the swing
        return max(0.0, (bar * 4 + b) * self.spb + (D.rng.uniform(-human, human) if human else 0.0))

    def n(self, name, note, bar, beat, beats, vel=0.8, pan=None, human=0.008, **kw):
        ins = I(name)
        f = nf(note) if isinstance(note, str) else note
        dur = beats * self.spb
        s = ins.pick(f)
        if not s.loop:   # a one-shot sample lets go before it runs out
            dur = min(dur, len(s.data) / PSR / (f / s.root) * 0.85 - (kw.get('adsr') or ins.adsr)[3])
        t0 = self.at(bar, beat, human)
        v = vel * (1 + D.rng.uniform(-0.08, 0.08))
        for p in (0, 1):   # the same note in both passes
            self.mus.note(ins, f, t0 + p * self.L, max(0.05, dur), v, pan, **kw)

    def chord(self, name, notes, bar, beat, beats, vel=0.6, **kw):
        for k, nt in enumerate(notes):
            self.n(name, nt, bar, beat + 0.01 * k, beats, vel, **kw)

    def d(self, x, bar, beat, gain=1.0, pan=0.0, human=0.006):
        t0 = self.at(bar, beat, human)
        g = gain * (1 + D.rng.uniform(-0.1, 0.1))
        for p in (0, 1):
            self.drm.add(x, t0 + p * self.L, g, pan)

    def render(self, wet=0.32, decay=3.0, dwet=0.12, ddecay=1.0, drums=1.0):
        m = ps1.hall(self.mus.mix(), decay=decay, wet=wet)
        dr = ps1.hall(self.drm.mix(), decay=ddecay, wet=dwet)
        n = max(len(m), len(dr))
        y = np.zeros((n, 2))
        y[:len(m)] += m
        y[:len(dr)] += dr * drums
        return y


def _lp(x, f, order=2):
    return signal.sosfiltfilt(signal.butter(order, f / (PSR / 2), 'low', output='sos'), x, axis=0)


def lofi(y, L, wow=0.0013, flutter=0.00018, lp=6200, sat=1.25, crackle=0.5, hiss=0.0025, seed=0):
    """The lofi master on both passes, then the second pass cut out as the loop: tape wow and flutter (a whole number
    of cycles per loop, so it loops), a warm low-pass, a little saturation; vinyl crackle and hiss on top."""
    n = len(y)
    t = np.arange(n) / PSR
    r1 = max(1, round(L * 0.4)) / L
    r2 = max(1, round(L * 5.3)) / L
    dly = (0.004 + wow * np.sin(2 * np.pi * r1 * t) + flutter * np.sin(2 * np.pi * r2 * t)) * PSR
    idx = np.arange(n) - dly
    y = np.stack([np.interp(idx, np.arange(n), y[:, c]) for c in (0, 1)], axis=1)
    y = _lp(y, lp)
    pk = np.max(np.abs(y)) + 1e-9
    y = np.tanh(sat * y / pk) / np.tanh(sat) * pk
    a, b = int(round(L * PSR)), int(round(2 * L * PSR))
    seg = y[a:b].copy()
    # the record: crackle and hiss, made once for the loop's length
    keep = D.rng
    D.seed(seed)
    m = len(seg)
    nz = D.rng.standard_normal(m) * hiss
    pops = np.zeros(m)
    k = D.rng.random(m) < 7.0 / PSR
    pops[k] = D.rng.standard_normal(int(k.sum())) * D.rng.uniform(0.2, 1.0, int(k.sum()))
    pops = signal.lfilter([1, -0.6], [1], pops) * 0.02 * crackle
    rec = _lp(nz + pops, 4500, 1)
    D.rng = keep
    seg[:, 0] += rec
    seg[:, 1] += np.roll(rec, 37)
    return seg


def level(x2):
    """Like the theme: the loudest 300 ms at -18 dB RMS unless the peak would pass -1 dB."""
    m = x2.mean(axis=1)
    w = int(0.3 * PSR)
    st = np.sqrt(np.max(np.convolve(m ** 2, np.ones(w) / w, mode='same'))) + 1e-9
    return x2 * min(10 ** (-18 / 20) / st, 10 ** (-1 / 20) / (np.max(np.abs(x2)) + 1e-9))


def write_loop(out_dir, name, x2, pad):
    """A stereo loop at the console's rate, LOOP_PAD of wrap-around on both sides (as make.py's loops)."""
    p = int(round(pad * PSR))
    x2 = np.concatenate([x2[-p:], x2, x2[:p]])
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        wavfile.write(f.name, PSR, (np.clip(x2, -1, 1) * 32767).astype(np.int16))
        tmp = f.name
    dst = os.path.join(out_dir, name + '.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-ac', '2', '-ar', str(PSR), '-b:a', '48k',
                    '-map_metadata', '-1', '-write_xing', '1', dst], check=True)
    os.unlink(tmp)


# ---------------------------------------------------------------- Ravenhold: the town
def town():
    """Ravenhold in the rain, inside the angel's ribs: the refuge. D Dorian, 75 BPM, 24 bars. A harp turning over warm
    strings, a round bass, a soft brushed beat; the flute sings in the middle and the end; a church bell far off; rain."""
    s = Song(75, 24, 31000, swing=0.07)
    A_ = [('Dm7', ['D3', 'F3', 'A3', 'C4'], 'D2'), ('Gadd9', ['G3', 'B3', 'D4', 'A4'], 'G1'), ('Bbmaj7', ['Bb2', 'D3', 'F3', 'A3'], 'Bb1'),
          ('Asus4', ['A2', 'D3', 'E3', 'A3'], 'A1')]
    B_ = [('Gm7', ['G2', 'Bb2', 'D3', 'F3'], 'G1'), ('Dm/F', ['F3', 'A3', 'D4'], 'F1'), ('Ebmaj7', ['Eb3', 'G3', 'Bb3', 'D4'], 'Eb2'),
          ('A', ['A2', 'C#3', 'E3', 'A3'], 'A1')]
    A2 = [('Dm7', ['D3', 'F3', 'A3', 'C4'], 'D2'), ('Gadd9', ['G3', 'B3', 'D4', 'A4'], 'G1'), ('Fmaj7', ['F3', 'A3', 'C4', 'E4'], 'F1'),
          ('Cadd9', ['C3', 'E3', 'G3', 'D4'], 'C2')]
    prog = A_ + B_ + A2
    for k, (_, ch, root) in enumerate(prog):
        bar = 2 * k
        s.chord('strings', ch, bar, 0, 8.2, 0.6)
        # the harp turns over the chord, two octaves, eighths
        tones = [nf(x) for x in ch] + [nf(x) * 2 for x in ch]
        order = [0, 2, 4, 1, 3, 5, 2, 4, 6, 3, 5, 7, 4, 2, 3, 1]
        for i in range(16):
            s.n('harp', tones[order[i] % len(tones)], bar + i // 8, (i % 8) * 0.5, 1.5, 0.75 if i % 4 == 0 else 0.55)
        # the bass: the root, its fifth on the and of 3, the root again
        r = nf(root)
        for b2 in (0, 1):
            s.n('bass', r, bar + b2, 0, 1.6, 0.8)
            s.n('bass', r * 1.5, bar + b2, 2.5, 0.8, 0.55)
            s.n('bass', r, bar + b2, 3.5, 0.4, 0.45)
    # the flute: the middle and the end
    mel = [(8, 0, 'D5', 1.5), (8, 1.5, 'C5', 0.5), (8, 2, 'Bb4', 1), (8, 3, 'A4', 1), (9, 0, 'G4', 3),
           (10, 0, 'F4', 1), (10, 1, 'A4', 1), (10, 2, 'D5', 2), (11, 0, 'C5', 1.5), (11, 1.5, 'A4', 0.5), (11, 2, 'F4', 2),
           (12, 0, 'G4', 1), (12, 1, 'Bb4', 1), (12, 2, 'Eb5', 1.5), (12, 3.5, 'D5', 0.5), (13, 0, 'D5', 2), (13, 2, 'Bb4', 2),
           (14, 0, 'A4', 2), (14, 2, 'E4', 1), (14, 3, 'G4', 1), (15, 0, 'A4', 3.5),
           (16, 2, 'A4', 1), (16, 3, 'C5', 1), (17, 0, 'D5', 2.5), (17, 2.5, 'E5', 0.5), (17, 3, 'F5', 1),
           (18, 0, 'E5', 2), (18, 2, 'D5', 1), (18, 3, 'B4', 1), (19, 0, 'D5', 3),
           (20, 0, 'C5', 1), (20, 1, 'A4', 1), (20, 2, 'F4', 1), (20, 3, 'A4', 1), (21, 0, 'C5', 2), (21, 2, 'E5', 2),
           (22, 0, 'D5', 1.5), (22, 1.5, 'C5', 0.5), (22, 2, 'G4', 2), (23, 0, 'E4', 2), (23, 2, 'D4', 2)]
    for bar, beat, nt, beats in mel:
        s.n('flute', nt, bar, beat, beats * 0.95, 1.0, human=0.012)
    # a church bell far off, twice a loop
    for bar in (0, 12):
        s.n('bell', 'D3', bar, 0, 6, 0.35, pan=-0.4)
    # the beat: brushed, soft; it rests for the first two bars
    K, S_, Rm, H, Sh, Br = kick(115, 58, 0.35, 0.11), snare(190, 0.1, 4500), rim(), hat(), shaker(), brush()
    for bar in range(2, 24):
        s.d(K, bar, 0, 0.85)
        s.d(K, bar, 1.75, 0.5)
        s.d(K, bar, 2.5, 0.7)
        s.d(S_, bar, 1, 0.45, 0.05)
        s.d(Br, bar, 1, 0.5, 0.05)
        s.d(S_, bar, 3, 0.5, 0.05)
        s.d(Br, bar, 3, 0.5, 0.05)
        for e in range(8):
            s.d(Sh, bar, e * 0.5, 0.55 if e % 2 else 0.35, 0.3)
        if bar % 4 == 3:
            s.d(Rm, bar, 3.5, 0.35, -0.2)
    y = s.render(wet=0.3, decay=2.8, dwet=0.12, ddecay=0.9, drums=0.6)
    # the rain on the roofs round the ribs
    n = len(y)
    keep = D.rng
    D.seed(31001)
    rain = signal.sosfilt(signal.butter(2, [600 / (PSR / 2), 4000 / (PSR / 2)], 'band', output='sos'), D.rng.standard_normal(n)) * 0.012
    D.rng = keep
    y[:, 0] += rain
    y[:, 1] += np.roll(rain, 911)
    return lofi(y, s.L, wow=0.0014, lp=5800, crackle=0.6, seed=31002), s.L


# ---------------------------------------------------------------- the Crypt: the dungeon
def dungeon():
    """Under the crypts, in the angel's body: lonely and slow. D Phrygian, 60 BPM, 16 bars. An organ drone and a choir
    in the dark, a music box falling through the scale in a huge hall, a flute alone; from bar 5 a slow heavy beat;
    a toll far off; water dripping."""
    s = Song(60, 16, 32000, swing=0.05)
    chords = [['D3', 'F3', 'A3'], ['D3', 'Eb3', 'G3', 'Bb3'], ['D3', 'G3', 'Bb3'], ['D3', 'E3', 'A3']]
    for k, ch in enumerate(chords):
        bar = 4 * k
        s.chord('choir_o', ch, bar, 0, 16.4, 0.7)
        s.n('organ', 'D2', bar, 0, 16.6, 0.5, adsr=(1.5, 1.0, 0.9, 1.6))
        s.n('organ', 'A2', bar, 0, 16.6, 0.32, adsr=(1.5, 1.0, 0.9, 1.6))
        s.n('strings', 'D2', bar, 0, 16.4, 0.35)
    # the music box: down the Phrygian scale, slow, each time a little different
    phr = ['A4', 'G4', 'F4', 'Eb4', 'D4']
    motifs = [[0, 1, 2, 3, 4], [0, 2, 1, 3, 4], [1, 2, 3, 4, 3], [0, 1, 2, 4, 3]]
    for bar in range(0, 16, 2):
        mo = motifs[(bar // 2) % 4]
        for i, idx in enumerate(mo):
            nt = nf(phr[idx]) * (2 if bar >= 8 and i == 0 else 1)
            s.n('box', nt, bar, i * 0.75, 2.5, 0.75 - 0.06 * i, human=0.015)
    # the flute, alone, in the second half
    for bar, beat, nt, beats in [(8, 0, 'A4', 3), (8, 3, 'Bb4', 1), (9, 0, 'A4', 4), (10, 0, 'G4', 2), (10, 2, 'F4', 2),
                                 (11, 0, 'Eb4', 3), (11, 3, 'F4', 1), (12, 0, 'D4', 4), (13, 2, 'F4', 1), (13, 3, 'G4', 1),
                                 (14, 0, 'A4', 2), (14, 2, 'Bb4', 1), (14, 3, 'A4', 1), (15, 0, 'D4', 3.5)]:
        s.n('flute', nt, bar, beat, beats * 0.95, 0.85, human=0.015)
    for bar in (0, 8):
        s.n('bell', 'A1', bar, 0, 6, 0.4, pan=0.3)
    # the beat: slow and heavy, from bar 5
    K, S_, Rm, H = kick(105, 50, 0.5, 0.17), snare(160, 0.18, 3800, 0.6), rim(), hat()
    for bar in range(4, 16):
        s.d(K, bar, 0, 0.95)
        s.d(K, bar, 2.5, 0.6)
        s.d(S_, bar, 2, 0.55, 0.05)
        for e in range(8):
            if e in (1, 3, 5, 7):
                s.d(H, bar, e * 0.5, 0.35, 0.25)
        if bar % 2:
            s.d(Rm, bar, 3.75, 0.3, -0.2)
    for bar, beat, f in ((1, 1.3, 1500), (3, 2.7, 1150), (6, 0.6, 1700), (9, 3.1, 1300), (12, 1.9, 1600), (14, 0.4, 1250)):
        s.d(drip(f), bar, beat, 0.25, 0.5)
    y = s.render(wet=0.42, decay=4.0, dwet=0.18, ddecay=1.6, drums=0.65)
    return lofi(y, s.L, wow=0.0018, flutter=0.00022, lp=5200, crackle=0.8, seed=32002), s.L


# ---------------------------------------------------------------- Judgment: a boss fight
def boss():
    """The fight of the night. D minor and its Phrygian dominant, 96 BPM, 24 bars. A driving ostinato in the low
    strings and the bass, the choir stabbing on every change, the organ under it, dark horns carrying the theme,
    timpani, a bell tolling every eight bars, a harder lofi beat."""
    s = Song(96, 24, 33000, swing=0.03)
    prog = [('D2', ['D3', 'F3', 'A3']), ('Bb1', ['Bb2', 'D3', 'F3']), ('G1', ['G2', 'Bb2', 'D3']), ('A1', ['A2', 'C#3', 'E3']),
            ('D2', ['D3', 'F3', 'A3']), ('Eb2', ['Eb3', 'G3', 'Bb3']), ('C2', ['C3', 'E3', 'G3']), ('A1', ['A2', 'C#3', 'E3', 'G3']),
            ('Bb1', ['Bb2', 'D3', 'F3']), ('G1', ['G2', 'Bb2', 'D3']), ('Eb2', ['Eb3', 'G3', 'Bb3']), ('A1', ['A2', 'C#3', 'E3'])]
    pat = [0, 0, 12, 0, 3, 0, 10, 0]   # semitones over the root, eighths
    for k, (root, ch) in enumerate(prog):
        bar = 2 * k
        r = nf(root)
        for b2 in (0, 1):
            for e, st in enumerate(pat):
                acc = 1.0 if e in (0, 4) else 0.7
                s.n('ostinato', r * 2 ** (st / 12) * 2, bar + b2, e * 0.5, 0.45, 0.8 * acc, human=0.004)
                s.n('bass', r * 2 ** (st / 12), bar + b2, e * 0.5, 0.45, 0.5 * acc, human=0.004)
        s.chord('choir_a', ch, bar, 0, 1.4, 0.75)
        s.chord('organ_pad', ch, bar, 0, 8.0, 0.4)
        s.d(timp_hit(root), bar, 0, 0.8)
    mel = [(8, 0, 'D4', 1.5), (8, 1.5, 'F4', 0.5), (8, 2, 'A4', 2), (9, 0, 'G4', 1), (9, 1, 'F4', 1), (9, 2, 'E4', 2),
           (10, 0, 'Eb4', 1.5), (10, 1.5, 'G4', 0.5), (10, 2, 'Bb4', 2), (11, 0, 'A4', 3), (11, 3, 'G4', 1),
           (12, 0, 'G4', 1.5), (12, 1.5, 'E4', 0.5), (12, 2, 'C4', 2), (13, 0, 'E4', 2), (13, 2, 'G4', 2),
           (14, 0, 'A4', 2), (14, 2, 'C#5', 2), (15, 0, 'A4', 4),
           (16, 0, 'D5', 2), (16, 2, 'Bb4', 1), (16, 3, 'A4', 1), (17, 0, 'G4', 3), (17, 3, 'A4', 1),
           (18, 0, 'Bb4', 1.5), (18, 1.5, 'A4', 0.5), (18, 2, 'G4', 2), (19, 0, 'D4', 4),
           (20, 0, 'Eb4', 1), (20, 1, 'G4', 1), (20, 2, 'Bb4', 2), (21, 0, 'C5', 2), (21, 2, 'Bb4', 1), (21, 3, 'G4', 1),
           (22, 0, 'A4', 2), (22, 2, 'C#5', 2), (23, 0, 'E5', 1), (23, 1, 'D5', 1), (23, 2, 'C#5', 2)]
    for bar, beat, nt, beats in mel:
        s.n('brass', nt, bar, beat, beats * 0.92, 1.0, human=0.006)
        s.n('brass', nf(nt) / 2, bar, beat, beats * 0.92, 0.45, human=0.006)   # the octave under it
    for bar in (0, 8, 16):
        s.n('bell', 'A1', bar, 0, 5, 0.5, pan=-0.2)
    # timpani rolls into each section
    for bar in (7, 15, 23):
        for i in range(8):
            s.d(timp_hit('A1', 0.5, 0.3 + 0.08 * i, 3300 + i), bar, 2 + i * 0.25, 0.5)
    K, S_, H, Hc = kick(125, 55, 0.35, 0.1), snare(200, 0.12, 6000), hat(), crash()
    for bar in range(24):
        for b in (0, 0.75, 2, 2.5):
            s.d(K, bar, b, 0.9 if b in (0, 2) else 0.6)
        s.d(S_, bar, 1, 0.7, 0.05)
        s.d(S_, bar, 3, 0.75, 0.05)
        for e in range(16):
            s.d(H, bar, e * 0.25, 0.4 if e % 4 == 2 else 0.22, 0.3)
        if bar % 8 == 0:
            s.d(Hc, bar, 0, 0.6, -0.3)
    y = s.render(wet=0.26, decay=2.4, dwet=0.12, ddecay=0.8, drums=0.7)
    return lofi(y, s.L, wow=0.0009, flutter=0.00014, lp=6800, sat=1.5, crackle=0.35, seed=33002), s.L


def timp_hit(note, d=1.4, vel=0.9, seed=3200):
    return ps1.timpani_hit(nf(note), d, vel, seed=seed)



def register(cue, out_dir, pad):
    for name, fn in (('mus_town', town), ('mus_dungeon', dungeon), ('mus_boss', boss)):
        def bake(fn=fn, name=name):
            y, L = fn()
            assert abs(L - LENGTHS[name]) < 1e-6, (name, L)
            write_loop(out_dir, name, level(y), pad)
        cue(name)(bake)
