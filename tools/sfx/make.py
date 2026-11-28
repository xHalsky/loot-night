"""Bakes every sound file in src/assets/sfx/ (docs/design/screen.md, Audio).

    python3 tools/sfx/make.py            # all
    python3 tools/sfx/make.py tv shower  # just these cues

Two sources:
  * Kenney CC0 recordings (tools/sfx/kenney/, see LICENSE-CC0.txt): steps, door, latch, creaks, plates, tins, coins...
  * Synthesis below (seeded, so a rebuild gives the same files): TV, kettle, shower, hair dryer, flush, tap, her voice,
    phone buzz, the can, gulps, the dog, keys and the audio-first RPG cues.
Output: mono MP3. Through-wall sounds at 24 kHz / 32 kbps (the walls cut the highs anyway), the rest 32 kHz / 48 kbps.
Loops (tv, kettle, shower) are written with LOOP_PAD seconds of wrap-around on both sides; audio.ts loops the middle.
Files in src/assets/sfx/own/ are yours: this script never touches them, and they win over the baked ones.
"""
import os
import subprocess
import sys
import tempfile

import numpy as np
from scipy.io import wavfile

sys.path.insert(0, os.path.dirname(__file__))
import dsp as D  # noqa: E402
from dsp import SR, tt, secs, place  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'src', 'assets', 'sfx')
KEN = os.path.join(HERE, 'kenney')
LOOP_PAD = 0.25
PROFILES = {'wall': (24000, '32k'), 'room': (32000, '40k'), 'desk': (32000, '48k'),
            'game': (22050, '40k')}   # the RPG (#155): its console's 22,050 Hz holds nothing above 11 kHz
CUES = {}


def cue(name):
    def deco(fn):
        CUES[name] = fn
        return fn
    return deco


def write(name, x, profile='desk', loop=None, peak_db=-1.0):
    os.makedirs(OUT, exist_ok=True)
    if loop:
        p = secs(LOOP_PAD)
        x = np.concatenate([x[-p:], x, x[:p]])
    else:
        x = level(x, peak_db)
        if len(x) < secs(0.3):   # tiny MP3s confuse decoders' format probing: pad with silence
            x = np.concatenate([x, np.zeros(secs(0.3) - len(x))])
    x = np.clip(x, -1, 1)
    sr, br = PROFILES[profile]
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        wavfile.write(f.name, SR, (x * 32767).astype(np.int16))
        tmp = f.name
    dst = os.path.join(OUT, name + '.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-ac', '1', '-ar', str(sr), '-b:a', br,
                    '-map_metadata', '-1', '-write_xing', '1', dst], check=True)
    os.unlink(tmp)


def level(x, peak_db=-1.0, loud_db=-18.0):
    """Loudness-match one-shots: the loudest 300 ms window to loud_db RMS, unless that would push the peak over
    peak_db. So a mix gain of 1 in src/data/sounds.ts means the same loudness for every cue."""
    w = secs(0.3)
    p2 = np.convolve(x ** 2, np.ones(w) / w, mode='same') if len(x) > w else np.array([np.mean(x ** 2)])
    st = np.sqrt(np.max(p2)) + 1e-9
    g = min(10 ** (loud_db / 20) / st, 10 ** (peak_db / 20) / (np.max(np.abs(x)) + 1e-9))
    return x * g


def kenney(fname, trim_db=-50):
    """Decode a vendored Kenney file to mono float at SR, leading silence trimmed."""
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        tmp = f.name
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(KEN, fname + '.ogg'), '-ac', '1', '-ar', str(SR), tmp], check=True)
    sr, x = wavfile.read(tmp)
    os.unlink(tmp)
    x = x.astype(np.float64) / 32768
    thr = 10 ** (trim_db / 20) * np.max(np.abs(x))
    i = int(np.argmax(np.abs(x) > thr))
    return D.fade(x[max(0, i - 40):], 0.001, 0.02)


# ======================= Kenney foley =======================

def ken_set(name, files, profile='room', lowcut=None, gain_db=-1.0):
    for i, f in enumerate(files):
        x = kenney(f)
        if lowcut:
            x = D.hp(x, lowcut)
        write(f'{name}_{i}' if len(files) > 1 else name, x, profile, peak_db=gain_db)


@cue('step')
def _step():
    ken_set('step', [f'footstep_wood_00{i}' for i in range(5)], lowcut=60)


@cue('stepsoft')
def _stepsoft():
    ken_set('stepsoft', [f'footstep_carpet_00{i}' for i in range(5)], lowcut=60)


@cue('latch')
def _latch():
    ken_set('latch', ['metal_latch'])


@cue('door')
def _door():
    ken_set('door', ['door_open_1', 'door_open_2'])


@cue('doorclose')
def _doorclose():
    ken_set('doorclose', ['door_close_2', 'door_close_4'])


@cue('creak')
def _creak():
    ken_set('creak', ['creak_1', 'creak_2', 'creak_3'])


@cue('plate')
def _plate():
    ken_set('plate', [f'impact_plate_light_00{i}' for i in range(5)])


@cue('tin')
def _tin():
    ken_set('tin', [f'impact_tin_medium_00{i}' for i in range(5)], 'desk')


@cue('bin')
def _bin():
    ken_set('bin', [f'impact_metal_light_00{i}' for i in range(3)], 'desk')


@cue('coins')
def _coins():
    ken_set('coins', ['handle_coins', 'handle_coins_2'], 'desk')


# ======================= her: activities =======================

def babble(d, speakers=((205, 1.0), (118, 0.82)), rate=(0.11, 0.21)):
    """Two people talking on TV: random syllables, sentence melody, pauses."""
    out = np.zeros(secs(d))
    t = 0.15
    who = 0
    vowels = ['a', 'e', 'i', 'o', 'uh', 'ei', 'ai', 'u']
    while t < d:
        f0b, scale = speakers[who]
        nsyl = int(D.rng.integers(5, 14))
        plan = []
        for s in range(nsyl):
            dur = float(D.rng.uniform(*rate))
            v0 = vowels[int(D.rng.integers(len(vowels)))]
            v1 = vowels[int(D.rng.integers(len(vowels)))]
            if D.rng.random() < 0.35:
                plan.append((float(D.rng.uniform(0.03, 0.07)), None, None, 0))   # a stop or a breath
            plan.append((dur, v0, v1, float(D.rng.uniform(0.55, 1.0))))
        accents = D.rng.uniform(-0.12, 0.25, nsyl + 4)
        rise = D.rng.random() < 0.3

        def f0_of(tt_, total, f0b=f0b, accents=accents, rise=rise):
            decl = 1.12 - 0.25 * tt_ / total
            if rise:
                decl += np.clip((tt_ / total - 0.8) * 1.6, 0, None)
            acc = np.interp(tt_, np.linspace(0, total, len(accents)), accents)
            return f0b * (decl + acc)
        f0, A, F = D.syllables(plan, f0_of)
        F = F * scale
        v = D.voice(f0, A, F, breath=0.15, tilt=1.0, jitter=0.01, maxf=4000)
        # consonant hiss at some syllable starts
        place(out, v / (np.max(np.abs(v)) + 1e-9) * float(D.rng.uniform(0.6, 1.0)), t)
        t += len(v) / SR + float(D.rng.uniform(0.15, 0.55))
        who = 1 - who if D.rng.random() < 0.7 else who
    return out


@cue('tv')
def _tv():
    D.seed(101)
    L, X = 9.0, 0.6
    talk = babble(L + X + 0.2)
    bed = D.lp(D.pink(L + X + 0.2), 600) * 0.06            # room tone of the show
    x = talk + bed
    x = D.bp(x, 140, 5200)                                    # a TV speaker
    x = D.reverb(x, 0.35, 0.22, 5000)
    loop = D.make_loop(x, L, X)
    write('tv', D.rms_norm(loop, -20), 'wall', loop=L)


def laugh_person(d, f0, start, n_ha, rate, amp):
    """One audience member: breathy 'ha's, each starting high and falling, getting weaker."""
    seg = np.zeros(secs(d))
    ha_d = n_ha / rate + 0.15
    t = tt(ha_d)
    ph = (t * rate) % 1.0                                  # position inside the current 'ha'
    f0c = f0 * (1.12 - 0.28 * ph) * (1 - 0.15 * t / ha_d)
    F = np.tile(np.array(D.VOWELS['a']) * (1.0 if f0 > 190 else 0.85), (len(t), 1))
    v = D.voice(f0c, np.ones(len(t)), F, breath=1.6, tilt=1.1, jitter=0.05, maxf=3500)
    pulses = np.zeros(len(t))
    for k in range(n_ha):
        place(pulses, D.env_exp(0.12, 0.035, 0.008) * (0.82 ** k), k / rate + float(D.rng.uniform(-0.01, 0.01)))
    v = v * pulses
    v /= np.max(np.abs(v)) + 1e-9
    place(seg, v * amp, start)
    return seg


@cue('laugh')
def _laugh():
    for k in range(3):
        D.seed(200 + k)
        d = 2.4
        x = np.zeros(secs(d))
        for p in range(14):
            f0 = float(D.rng.choice([D.rng.uniform(120, 180), D.rng.uniform(210, 330)]))
            x += laugh_person(d, f0, float(D.rng.uniform(0, 0.3)), int(D.rng.integers(4, 10)),
                              float(D.rng.uniform(4.0, 6.0)), float(D.rng.uniform(0.35, 1.0)))
        x = D.bp(x, 150, 5000)
        x = D.reverb(x, 0.6, 0.35, 4000)
        x *= D.env_lin(d, [(0, 0), (0.12, 1), (1.4, 0.8), (d, 0)])
        write(f'laugh_{k}', x, 'wall')


def pad_chord(freqs, d, amp=0.2):
    x = np.zeros(secs(d))
    for f in freqs:
        for det in (-0.004, 0.004):
            x += D.osc(f * (1 + det), d, 'saw')
    return D.lp(x, 1800) * amp / len(freqs)


def bell(f, d, amp=0.3):
    t = tt(d)
    return amp * (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.08)) * np.exp(-t / 0.35)


def note(n):
    names = {'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2}
    acc = 1 if '#' in n else -1 if 'b' in n[1:] else 0
    o = int(n[-1])
    return 440 * 2 ** ((names[n[0]] + acc + 12 * (o - 4)) / 12)


@cue('credits')
def _credits():
    """End-of-show theme, sitcom style: four chords, bass, a bell tune, a final hit."""
    D.seed(300)
    beat = 0.36
    d = 4.2
    x = np.zeros(secs(d))
    prog = [['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4']]
    bass = ['C3', 'A2', 'F2', 'G2']
    tune = ['E5', 'G5', 'C6', 'B5', 'A5', 'G5', 'E5', 'F5', 'A5', 'G5', 'F5', 'D5']
    for i, ch in enumerate(prog):
        at = i * 2 * beat
        place(x, D.fade(pad_chord([note(n) for n in ch], 2 * beat, 0.5), 0.02, 0.06), at)
        for b in range(2):
            bt = D.osc(note(bass[i]), beat * 0.9, 'tri') * D.env_exp(beat * 0.9, 0.18, 0.005) * 0.5
            place(x, bt, at + b * beat)
    for k, n in enumerate(tune):
        place(x, bell(note(n), 0.5, 0.22), k * beat * 2 / 3)
    end = 8 * beat
    place(x, D.fade(pad_chord([note('C4'), note('E4'), note('G4'), note('C5')], 1.3, 0.6), 0.01, 0.6), end)
    place(x, D.osc(note('C2'), 1.2, 'tri') * D.env_exp(1.2, 0.4) * 0.6, end)
    place(x, D.hp(D.white(0.8), 5000) * D.env_exp(0.8, 0.2) * 0.25, end)   # cymbal
    for k, n in enumerate(['C6', 'E6', 'G6']):
        place(x, bell(note(n), 0.8, 0.18), end + k * 0.06)
    x = D.bp(x, 140, 6000)
    x = D.reverb(x, 0.5, 0.2)
    write('credits', D.fade(x, 0.005, 0.3), 'wall')


def kettle_bed(d, boil=0.6):
    """Electric kettle near the boil: roar of tiny collapsing bubbles + rumble + bubbles."""
    roar = D.bp(D.pink(d), 700, 4200) * (0.55 + 0.25 * D.smooth_rand(d, 3, -1, 1))
    rumble = D.lp(D.brown(d), 280) * 0.5 * boil
    x = roar + rumble
    rate = 70 + 220 * boil
    n = int(rate * d)
    for _ in range(n):
        f = float(np.exp(D.rng.uniform(np.log(250), np.log(2600))))
        place(x, D.bubble(f, float(D.rng.uniform(0.05, 0.35)) * boil), float(D.rng.uniform(0, d)))
    return x


@cue('kettle')
def _kettle():
    D.seed(400)
    L, X = 4.0, 0.4
    x = kettle_bed(L + X + 0.2, 0.7)
    x = D.reverb(x, 0.3, 0.2, 7000)
    write('kettle', D.rms_norm(D.make_loop(x, L, X), -20), 'wall', loop=L)


@cue('kettleoff')
def _kettleoff():
    """The boil peaks, the switch clicks off, the bubbling dies down."""
    D.seed(410)
    d = 2.6
    x = kettle_bed(d, 1.0)
    x *= D.env_lin(d, [(0, 0.6), (0.8, 1.0), (0.95, 1.0), (1.5, 0.35), (d, 0)])
    sw = D.mix(D.click(0.02, 1500, 7000, 0.003) * 1.6, D.peak(D.click(0.05, 800, 4000, 0.004), 1900, 10) * 0.9,
               D.osc(170, 0.05) * D.env_exp(0.05, 0.012) * 0.6)
    place(x, sw * 1.4, 0.9)
    x = D.reverb(x, 0.3, 0.2, 7000)
    write('kettleoff', x, 'wall')


def shower_bed(d):
    spray = D.hp(D.lp(D.pink(d), 9000), 250) * (1 + 0.18 * D.smooth_rand(d, 6, -1, 1))
    x = spray * 0.8
    for _ in range(int(380 * d)):             # droplets on tiles
        c = D.click(0.006, 2000, 7000, float(D.rng.uniform(0.0008, 0.003)))
        place(x, c, float(D.rng.uniform(0, d)), float(D.rng.uniform(0.05, 0.3)))
    for _ in range(int(4 * d)):               # water hitting her and the tray: low splats
        s = D.lp(D.white(0.08), 1400) * D.env_exp(0.08, 0.03, 0.004)
        place(x, s, float(D.rng.uniform(0, d)), float(D.rng.uniform(0.3, 0.8)))
    return x


@cue('shower')
def _shower():
    D.seed(500)
    L, X = 4.0, 0.4
    x = shower_bed(L + X + 0.2)
    x = D.reverb(x, 0.5, 0.3, 8000)            # a tiled bathroom
    write('shower', D.rms_norm(D.make_loop(x, L, X), -20), 'wall', loop=L)


@cue('dryer')
def _dryer():
    """Hair dryer: click on, spin up, swirl while she moves it, spin down, click off."""
    D.seed(600)
    d = 3.3
    on, off = 0.05, 2.9
    t = tt(d)
    f = np.interp(t, [0, on, on + 0.18, off, off + 0.3, d], [0, 0, 300, 300, 120, 0])
    f = f * (1 + 0.012 * np.sin(2 * np.pi * 0.9 * t))
    motor = D.lp(D.osc(np.maximum(f, 1), d, 'saw'), 2500) * 0.35
    air = D.bp(D.pink(d), 350, 6500) * 1.0
    swirl = 1 + 0.22 * np.sin(2 * np.pi * 1.6 * t + 1) + 0.1 * D.smooth_rand(d, 4, -1, 1)
    level = np.interp(t, [0, on, on + 0.2, off, off + 0.32, d], [0, 0, 1, 1, 0, 0])
    x = (motor + air) * swirl * level
    for at in (on, off + 0.05):
        place(x, D.click(0.02, 1200, 6000, 0.002), at, 0.8)
    x = D.reverb(x, 0.4, 0.25, 8000)
    write('dryer', x, 'wall')


@cue('flush')
def _flush():
    D.seed(700)
    d = 3.8
    t = tt(d)
    x = np.zeros(secs(d))
    place(x, D.mix(D.osc(140, 0.06) * D.env_exp(0.06, 0.015), D.click(0.03, 600, 3000, 0.004)), 0.0, 1.0)   # the lever
    rush = D.pink(d)
    cut = np.interp(t, [0, 0.12, 0.35, 2.2, d], [300, 300, 3200, 1400, 900])
    # time-varying low-pass by blocks
    out = np.zeros_like(rush)
    blk = secs(0.05)
    for i in range(0, len(rush), blk):
        out[i:i + blk] = D.lp(rush[max(0, i - blk):i + blk], float(cut[i]))[-len(rush[i:i + blk]):]
    gurgle = 1 + 0.45 * D.smooth_rand(d, 11, -1, 1)
    out *= gurgle * np.interp(t, [0, 0.12, 0.3, 1.0, 2.4, d], [0, 0, 1, 0.9, 0.25, 0])
    for _ in range(90):
        place(out, D.bubble(float(D.rng.uniform(150, 650)), 0.25), float(D.rng.uniform(0.3, 2.3)))
    refill = D.peak(D.white(d), 1900, 6) * 0.12 * np.interp(t, [0, 1.8, 2.4, 3.5, d], [0, 0, 1, 1, 0])
    x += out + refill
    x = D.reverb(x, 0.45, 0.25, 7000)
    write('flush', x, 'wall')


@cue('tap')
def _tap():
    D.seed(800)
    d = 2.6
    t = tt(d)
    stream = D.bp(D.pink(d), 500, 7000) + 0.5 * D.peak(D.white(d), 1150, 5)
    stream *= (1 + 0.25 * D.smooth_rand(d, 14, -1, 1)) * np.interp(t, [0, 0.05, 1.95, 2.02, d], [0, 1, 1, 0, 0])
    x = stream * 0.7
    sq_t = tt(0.16)
    squeak = np.sin(2 * np.pi * np.cumsum(np.interp(sq_t, [0, 0.16], [1150, 1650])) / SR) * (1 + 0.6 * np.sin(2 * np.pi * 38 * sq_t))
    place(x, squeak * D.env_lin(0.16, [(0, 0), (0.02, 1), (0.13, 0.8), (0.16, 0)]) * 0.18, 1.9)
    place(x, D.bubble(1450, 0.35), 2.18)
    place(x, D.bubble(2100, 0.25), 2.41)
    x = D.reverb(x, 0.4, 0.25, 8000)
    write('tap', x, 'wall')


@cue('bath')
def _bath():
    """Her bath (the weekend, #88): her music through the bathroom door, slow lo-fi chords and a soft beat, and now and
    then the water moving. 8 s, a seamless loop."""
    D.seed(820)
    L, X = 8.0, 0.4
    d = L + X + 0.2
    x = np.zeros(secs(d))
    prog = [['D4', 'F4', 'A4', 'C5'], ['G3', 'B3', 'D4', 'F4'], ['C4', 'E4', 'G4', 'B4'], ['A3', 'C4', 'E4', 'G4']]
    bar = 2.0
    for i in range(5):
        ch = prog[i % 4]
        place(x, D.fade(pad_chord([note(n) for n in ch], bar + 0.2, 0.55), 0.15, 0.3), i * bar)
        place(x, D.osc(note(ch[0]) / 2, bar * 0.9, 'tri') * D.env_lin(bar * 0.9, [(0, 0), (0.05, 0.5), (bar * 0.8, 0.3), (bar * 0.9, 0)]), i * bar)
        for b in range(4):   # a soft kick and a brushed snare
            at = i * bar + b * bar / 4
            place(x, D.osc(np.interp(tt(0.18), [0, 0.18], [90, 45]), 0.18) * D.env_exp(0.18, 0.06, 0.003) * 0.5, at)
            if b % 2:
                place(x, D.bp(D.white(0.15), 1500, 6000) * D.env_exp(0.15, 0.05) * 0.12, at)
    for _ in range(5):   # the water moving: a slosh and a drip or two
        at = float(D.rng.uniform(0, d - 0.6))
        place(x, D.lp(D.pink(0.5), 900) * D.env_lin(0.5, [(0, 0), (0.12, 1), (0.5, 0)]) * 0.35, at)
        place(x, D.bubble(float(D.rng.uniform(900, 1800)), 0.18), at + float(D.rng.uniform(0.3, 0.9)))
    x = D.lp(x, 1400)                     # the door cuts the highs
    x = D.reverb(x, 0.5, 0.3, 5000)        # a tiled bathroom
    write('bath', D.rms_norm(D.make_loop(x, L, X), -21), 'wall', loop=L)


@cue('drain')
def _drain():
    """The bath's end: the plug comes out and the water gurgles away (the bath's tell)."""
    D.seed(830)
    d = 2.8
    t = tt(d)
    swirl = D.lp(D.brown(d), 420) * (0.6 + 0.4 * D.smooth_rand(d, 5, -1, 1)) * np.interp(t, [0, 0.2, 2.2, d], [0, 1, 0.8, 0])
    x = swirl * 0.8
    place(x, D.click(0.03, 300, 2500, 0.006) * 0.8, 0.05)   # the plug
    for _ in range(46):                                        # the gurgle
        at = float(D.rng.uniform(0.2, 2.5))
        place(x, D.bubble(float(D.rng.uniform(160, 520)), float(D.rng.uniform(0.2, 0.6)), cycles=8, rise=0.3), at)
    x = D.reverb(x, 0.4, 0.25, 6000)
    write('drain', D.fade(x, 0.005, 0.2), 'wall')


@cue('babe')
def _babe():
    """Her voice, calling you: 0 a soft 'babe?' (the tease), 1 a drawn-out 'baaabe.' (again), 2 'babe, towel!' and
    3 'babe, wine?' from the bathroom."""
    B = (0.035, None, None, 0)
    lines = [
        ([B, (0.24, 'e', 'ei', 0.95), (0.04, None, None, 0), (0.05, 'm', 'm', 0.35)], [0.95, 1.0, 1.08, 1.3, 1.35], 236),
        ([B, (0.62, 'a', 'ei', 1.0), (0.04, None, None, 0), (0.06, 'm', 'm', 0.35)], [1.12, 1.25, 1.08, 0.95, 0.9, 1.0], 230),
        ([B, (0.2, 'e', 'ei', 1.0), (0.04, None, None, 0), (0.05, 'm', 'm', 0.3), (0.1, None, None, 0),
          (0.03, None, None, 0), (0.15, 'uh', 'o', 1.0), (0.13, 'u', 'e', 0.9), (0.12, 'l', 'l', 0.6)],
         [1.1, 1.2, 1.05, 1.0, 1.25, 1.3, 1.1, 0.95], 262),
        ([B, (0.2, 'e', 'ei', 1.0), (0.04, None, None, 0), (0.05, 'm', 'm', 0.3), (0.1, None, None, 0),
          (0.08, 'u', 'u', 0.5), (0.22, 'a', 'ai', 1.0), (0.1, 'n', 'n', 0.5)],
         [1.1, 1.2, 1.05, 1.0, 1.05, 1.15, 1.35, 1.4], 250),
    ]
    for k, (plan, contour, f0) in enumerate(lines):
        D.seed(1300 + k)
        x = her_line(plan, contour, f0=f0, breath=0.3)
        place(x, D.lp(D.white(0.02), 700) * D.env_exp(0.02, 0.005) * 0.3, 0.02)   # b
        if k == 2:
            at = sum(p[0] for p in plan[:6])
            place(x, D.bp(D.white(0.03), 2500, 7000) * D.env_exp(0.03, 0.008) * 0.3, at)   # t
        x = D.reverb(x, 0.35, 0.25, 6000)
        write(f'babe_{k}', D.fade(x, 0.005, 0.06), 'wall')


# ======================= her: voice =======================

def her_line(plan, contour, f0=228, breath=0.25, jitter=0.012):
    def f0_of(t, total):
        return f0 * np.interp(t / total, np.linspace(0, 1, len(contour)), contour)
    f, A, F = D.syllables(plan, f0_of)
    return D.voice(f, A, F, breath=breath, tilt=1.0, jitter=jitter, maxf=4500)


@cue('bye')
def _bye():
    """'ok, bye, love you' from the bedroom, phone in hand."""
    D.seed(900)
    plan = [(0.10, 'o', 'o', 0.8), (0.04, None, None, 0), (0.17, 'e', 'ei', 0.9), (0.10, None, None, 0),
            (0.20, 'ai', 'i', 1.0), (0.08, None, None, 0), (0.06, 'l', 'l', 0.5), (0.13, 'uh', 'uh', 0.95),
            (0.04, None, None, 0), (0.05, 'y', 'y', 0.6), (0.26, 'u', 'u', 0.85)]
    contour = [1.0, 1.08, 1.12, 1.28, 1.05, 1.0, 1.02, 1.18, 1.25, 0.95, 0.85]
    x = her_line(plan, contour)
    # consonant noise: k, b, v
    place(x, D.bp(D.white(0.03), 1500, 4500) * D.env_exp(0.03, 0.008) * 0.25, 0.135)
    place(x, D.lp(D.white(0.02), 900) * D.env_exp(0.02, 0.005) * 0.25, 0.42)
    place(x, D.bp(D.white(0.04), 2500, 7000) * 0.08, 0.83)
    x = D.reverb(x, 0.3, 0.2, 6000)
    write('bye', D.fade(x, 0.005, 0.05), 'wall')


@cue('hum')
def _hum():
    """She hums on her way over (Chat visit): nasal 'mmm' tunes."""
    tunes = [['G4', 'A4', 'B4', 'A4', 'G4'], ['E4', 'G4', 'A4', 'G4', 'E4', 'D4'], ['C5', 'B4', 'A4', 'B4', 'G4']]
    for k, tune in enumerate(tunes):
        D.seed(1000 + k)
        notes = [note(n) for n in tune]
        dur = 0.95
        t = tt(dur)
        steps = np.linspace(0, dur, len(notes) + 1)
        f = np.zeros(len(t))
        for i, fr in enumerate(notes):
            f[(t >= steps[i]) & (t < steps[i + 1])] = fr
        f[f == 0] = notes[-1]
        f = np.convolve(f, np.ones(secs(0.04)) / secs(0.04), mode='same')   # portamento
        f[:secs(0.04)] = notes[0]
        f[-secs(0.04):] = notes[-1]
        f *= 1 + 0.01 * np.sin(2 * np.pi * 5.5 * t)
        F = np.tile(np.array(D.VOWELS['m']), (len(t), 1))
        x = D.voice(f, D.env_lin(dur, [(0, 0), (0.06, 1), (dur - 0.12, 0.9), (dur, 0)]), F,
                    breath=0.1, tilt=1.4, maxf=3000, W=(1.0, 0.25, 0.12))
        write(f'hum_{k}', D.reverb(x, 0.3, 0.2), 'wall')


@cue('breath')
def _breath():
    D.seed(1100)
    d = 2.6
    t = tt(d)
    inh = D.bp(D.white(d), 500, 2400) * np.interp(t, [0, 0.1, 0.9, 1.0, d], [0, 0.5, 1, 0, 0])
    exh = D.lp(D.white(d), 1000) * np.interp(t, [0, 1.1, 1.3, 2.4, d], [0, 0, 1, 0.1, 0]) * 1.4
    write('breath', inh + exh, 'wall')


# ======================= desk =======================

def vibration(d_on, f=172):
    d = d_on + 0.04
    t = tt(d)
    fr = np.interp(t, [0, 0.06, d], [120, f, f])
    x = D.osc(fr, d)
    rattle = np.maximum(x, 0) ** 10                       # the phone hops on the desk once per turn
    rattle = (D.peak(rattle, 380, 4) + 0.8 * D.peak(rattle, 1150, 6) + 0.4 * D.peak(rattle, 2600, 5))
    nz = D.bp(D.white(d), 900, 4000) * (x > 0.85) * 0.5
    y = (0.35 * x + rattle * 2.5 + nz) * np.interp(t, [0, 0.02, d - 0.04, d], [0, 1, 1, 0])
    return y


@cue('buzz')
def _buzz():
    D.seed(1200)
    write('buzz', vibration(0.6), 'desk')


@cue('buzzmsg')
def _buzzmsg():
    D.seed(1201)
    x = np.zeros(secs(0.45))
    place(x, vibration(0.13), 0)
    place(x, vibration(0.13), 0.22)
    write('buzzmsg', x, 'desk')


def can_open(press):
    d = 0.6 + press * 0.7
    t = tt(d)
    x = np.zeros(len(t))
    place(x, D.peak(D.click(0.02, 2000, 9000, 0.0015), 3600, 6) * 1.2, 0)          # the tab cracks
    place(x, (np.sin(2 * np.pi * 5200 * tt(0.06)) + 0.6 * np.sin(2 * np.pi * 7900 * tt(0.06))) * D.env_exp(0.06, 0.012) * 0.15, 0.002)
    psst = D.hp(D.white(d), 2400) * D.env_exp(d, 0.07 + 0.25 * press, 0.003) * (0.9 + press)
    place(x, psst, 0.012)
    rate = np.interp(t, [0, d], [900, 100])
    for _ in range(int(500 * d)):
        at = float(D.rng.uniform(0.03, d))
        if D.rng.random() < rate[secs(at) - 1] / 900:
            place(x, D.click(0.004, 4000, 12000, 0.0006), at, float(D.rng.uniform(0.03, 0.15)))
    return x


@cue('can')
def _can():
    D.seed(1300)
    write('can', can_open(0.0), 'desk')


@cue('gulp')
def _gulp():
    for k in range(2):
        D.seed(1400 + k)
        x = np.zeros(secs(0.32))
        place(x, D.osc(95 + 15 * k, 0.07) * D.env_exp(0.07, 0.02, 0.004), 0)
        place(x, D.peak(D.click(0.02, 600, 2500, 0.004), 1200, 4) * 0.6, 0.03)
        place(x, D.bubble(520 + 60 * k, 0.7, 8, 0.4), 0.05)
        place(x, D.bubble(680 - 40 * k, 0.4, 8, 0.4), 0.12)
        write(f'gulp_{k}', D.lp(x, 3000), 'desk')


@cue('fridge')
def _fridge():
    D.seed(1450)
    x = np.zeros(secs(0.6))
    place(x, D.mix(D.osc(85, 0.09) * D.env_exp(0.09, 0.03, 0.006), D.lp(D.white(0.08), 350) * D.env_exp(0.08, 0.02) * 0.6), 0)
    place(x, kenney('impact_glass_light_000'), 0.11, 0.25)
    place(x, kenney('impact_glass_light_002'), 0.19, 0.18)
    write('fridge', x, 'desk')


def bark_once(f_start, f_end, d=0.15):
    t = tt(d)
    f0 = f_start * (f_end / f_start) ** (t / d)
    F = np.tile([680, 1350, 2600], (len(t), 1)).astype(float)
    F[:, 0] *= np.interp(t, [0, d], [1.15, 0.85])
    amp = D.env_lin(d, [(0, 0), (0.008, 1), (0.05, 0.85), (d, 0)])
    v = D.voice(f0, amp, F, breath=0.8, tilt=0.7, jitter=0.07, maxf=5000, B=(160, 220, 300))
    sub = D.osc(f0 / 2, d) * amp * 0.25 * np.max(np.abs(v))
    v = v + sub
    place(v, D.bp(D.white(0.02), 1000, 3500) * 0.4 * np.max(np.abs(v)), 0)
    return np.tanh(2.2 * v / (np.max(np.abs(v)) + 1e-9))


@cue('bark')
def _bark():
    for k in range(2):
        D.seed(1500 + k)
        x = np.zeros(secs(0.5))
        place(x, bark_once(520 - 30 * k, 300), 0)
        place(x, bark_once(480 - 30 * k, 280), 0.21, 0.85)
        write(f'bark_{k}', D.reverb(x, 0.25, 0.15), 'room')


@cue('whine')
def _whine():
    D.seed(1600)
    d = 0.6
    t = tt(d)
    f0 = np.interp(t, [0, 0.25, d], [780, 1150, 940]) * (1 + 0.03 * np.sin(2 * np.pi * 7 * t))
    F = np.tile([1100, 2400, 3500], (len(t), 1)).astype(float)
    x = D.voice(f0, D.env_lin(d, [(0, 0), (0.05, 1), (0.45, 0.8), (d, 0)]), F, breath=0.5, tilt=1.6, maxf=5000)
    write('whine', D.reverb(x, 0.25, 0.15), 'room')


@cue('key')
def _key():
    for k in range(4):
        D.seed(1700 + k)
        x = np.zeros(secs(0.13))
        place(x, D.peak(D.click(0.01, 1800, 9000, 0.0012), 2700 + 300 * k, 3), 0)
        place(x, D.mix(D.osc(250 + 25 * k, 0.04) * D.env_exp(0.04, 0.01, 0.001) * 0.6, D.peak(D.click(0.02, 500, 2000, 0.004), 900, 3) * 0.5), 0.007)
        place(x, D.peak(D.click(0.01, 2000, 8000, 0.001), 3200, 3) * 0.35, 0.075)
        write(f'key_{k}', x, 'desk')


# ======================= the RPG =======================
# Every RPG cue is the game's own and lives in tools/sfx/aoj_sfx.py, through the console chain (#155). The desk slam
# stays here: it is him, in the room.

@cue('slam')
def _slam():
    for k in range(2):
        D.seed(2400 + k)
        x = np.zeros(secs(0.75))
        place(x, kenney(f'impact_punch_heavy_00{k}'), 0, 0.9)
        place(x, D.osc(np.interp(tt(0.4), [0, 0.4], [60, 32]), 0.4) * D.env_exp(0.4, 0.15, 0.003), 0, 0.9)
        place(x, D.lp(D.white(0.4), 900) * D.env_exp(0.4, 0.1), 0, 0.5)
        write(f'slam_{k}', x, 'desk')


# the launch's cues and its theme (#127): tools/sfx/launch.py, through the console chain in ps1.py
import launch as _launch  # noqa: E402
_launch.register(cue, write, level, kenney, OUT)
# the RPG's own sounds (#155): tools/sfx/aoj_sfx.py, the same chain
import aoj_sfx as _aoj  # noqa: E402
_aoj.register(cue, write, kenney)


if __name__ == '__main__':
    # a name ending in * bakes every cue that starts with it ('rpg_*', 'die_*')
    want = [c for a in sys.argv[1:] for c in (sorted(k for k in CUES if k.startswith(a[:-1])) if a.endswith('*') else [a])] or list(CUES)
    for name in want:
        CUES[name]()
        print('baked', name)
