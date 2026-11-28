"""The launch's sound and music (#127, docs/design/aoj-world.md §7b; the cue sheet is LAUNCH_SOUND / LAUNCH_LOOPS /
LAUNCH_MUSIC in src/render/page/aoj.js). Registered into make.py:

    python3 tools/sfx/make.py aoj_theme          # the theme alone
    python3 tools/sfx/make.py hl_hit aoj_strike   # any cue

The real PC's sounds stay clean (mouse, crt, cdspin, kb_clack; the hard drive's chatter, hdd, is no longer on the
cue sheet: Paweł, #127). Every other cue is the game's
own and goes through the console chain (ps1.py): 22,050 Hz, the ADPCM round trip, the console's reverb. The theme is
sampled instruments sequenced on that chain, 24 voices at most, in stereo.
"""
import os
import subprocess
import tempfile

import numpy as np
from scipy import signal
from scipy.io import wavfile

import dsp as D
import ps1
from dsp import SR, tt, secs, place
from ps1 import PSR, nf


# ---------------------------------------------------------------- the chain for one-shots
def game(x, decay=1.8, wet=0.22, pre=0.0):
    """A cue made at 44.1 kHz through the console: down to 22,050 Hz, ADPCM, the hall (mono), back up for the writer."""
    y = ps1.adpcm(ps1.to_psr(x))
    if wet > 0:
        y = ps1.hall(y, decay=decay, wet=wet, pre=pre).mean(axis=1)
    return ps1.from_psr(y)


def amiga(x, rate=16726, lp=7200, room=0.12):
    """The 16-bit home computer of the demo scene (#133): 8-bit samples at a low rate played back with no interpolation
    (the zero-order hold's bright aliases), the machine's gentle output filter, a little baked echo as the trackers did."""
    n = int(len(x) * rate / SR)
    y = np.interp(np.arange(n) * SR / rate, np.arange(len(x)), x)
    y = np.round(np.clip(y, -1, 1) * 127) / 127
    idx = np.minimum((np.arange(int(n * SR / rate)) * rate / SR).astype(int), n - 1)
    z = D.lp(y[idx], lp, 1)
    return D.reverb(z, 0.35, room) if room > 0 else z


def trim_tail(x, db=-60):
    """Cut the reverb's silent end."""
    thr = 10 ** (db / 20) * (np.max(np.abs(x)) + 1e-9)
    idx = np.nonzero(np.abs(x) > thr)[0]
    return x[:idx[-1] + secs(0.02)] if len(idx) else x


def dsine(f, d, tau, phase=0.0):
    t = tt(d)
    return np.sin(2 * np.pi * f * t + phase) * np.exp(-t / tau)


def bellish(f, d, partials, amp=1.0):
    """Inharmonic partials: [(ratio, amp, tau)]."""
    t = tt(d)
    y = np.zeros(len(t))
    for r, a, tau in partials:
        y += a * np.sin(2 * np.pi * f * r * t + r * 1.3) * np.exp(-t / tau)
    return y * amp


def noise_burst(d, lo, hi, tau, attack=0.001):
    return D.bp(D.white(d), lo, hi) * D.env_exp(d, tau, attack)


def woodtap(f, d=0.08, amp=1.0):
    return (dsine(f, d, 0.018) + 0.45 * dsine(f * 2.32, d, 0.009) + 0.4 * noise_burst(d, f, f * 4, 0.003)) * amp


def tick(f=1800, d=0.04, amp=1.0):
    return (dsine(f, d, 0.006) + 0.3 * noise_burst(d, 2000, 9000, 0.002)) * amp


def resample_pitch(x, k):
    """Played k times slower (k > 1 lowers the pitch)."""
    n = int(len(x) * k)
    return np.interp(np.arange(n) / k, np.arange(len(x)), x)


def thunder_roll(d, cut=300, seed=0):
    D.seed(seed)
    b = D.brown(d)
    rum = D.lp(b, cut, 2)
    am = np.clip(D.smooth_rand(d, 3, 0.2, 1.0), 0, 1) ** 1.5
    return rum * am


def write_stereo(write_dir, name, x2, sr=32000, br='64k'):
    """The theme in stereo: x2 (n, 2) at PSR."""
    x2 = ps1.ceiling(x2, -1.0)
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        wavfile.write(f.name, PSR, (np.clip(x2, -1, 1) * 32767).astype(np.int16))
        tmp = f.name
    dst = os.path.join(write_dir, name + '.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-ac', '2', '-ar', str(sr), '-b:a', br,
                    '-map_metadata', '-1', '-write_xing', '1', dst], check=True)
    os.unlink(tmp)


# ---------------------------------------------------------------- the theme (aoj_theme): 6.2 s to 41.6 s of the launch
THEME_AT = 6.2


def theme():
    """Through-composed to the launch (§7b): the deep (6.2-17), rain (17-18.4, silent), the rise (18.4-21.15), the theme
    (21.15-39.15, 60 bpm, a chord a bar: Dm, Bb, Eb, A, D) and the last chord (39.15, D open, dying by 41.6). Times
    in launch seconds; the file starts at 6.2."""
    D.seed(4100)
    L = 41.6 - THEME_AT + 0.6
    seq = ps1.Sequencer(L)
    T = lambda s: s - THEME_AT   # launch seconds to file seconds

    organ = ps1.Instrument(ps1.organ_samples(), adsr=(0.25, 0.6, 0.85, 1.6), pan=-0.15, gain=0.32)
    pedal = ps1.Instrument(ps1.organ_samples(), adsr=(1.2, 1.0, 0.9, 2.0), pan=0.0, gain=0.42)
    oo = ps1.Instrument(ps1.choir_samples('u'), adsr=(1.4, 1.0, 0.9, 1.8), pan=0.2, gain=0.26)
    ah = ps1.Instrument(ps1.choir_samples('a'), adsr=(0.5, 0.8, 0.9, 1.6), pan=0.2, gain=0.3)
    strings = ps1.Instrument(ps1.strings_samples(), adsr=(0.6, 0.8, 0.9, 1.4), pan=-0.3, gain=0.24)
    trem = ps1.Instrument(ps1.strings_samples(), adsr=(0.02, 0.1, 0.9, 0.08), pan=-0.35, gain=0.16)
    brass = ps1.Instrument(ps1.brass_samples(), adsr=(0.08, 1.2, 0.55, 1.2), pan=0.1, gain=0.34)
    flute = ps1.Instrument(ps1.flute_samples(), adsr=(0.09, 0.4, 0.85, 0.7), pan=0.3, gain=0.3)
    harp = ps1.Instrument(ps1.harp_samples(), adsr=(0.002, 0.4, 0.3, 0.6), pan=-0.4, gain=0.17)
    bell = ps1.Instrument([ps1.bell_sample('D3')], adsr=(0.002, 2.5, 0.0, 2.5), pan=0.05, gain=0.36)

    # 1. the deep (6.2-17; 2 s longer since #151 and #153, the developer's logo holding), about 14 dB under the theme: a low organ
    #    pedal on D and the choir's "oo" on an open fifth,
    #    swelling slowly; from 10.6 a slow low-strings figure, D to E flat and back, every 4 s. Thins out with the fade.
    deep = 10 ** (-14 / 20) * 1.8
    seq.note(pedal, nf('D2'), T(6.2), 10.3, vel=deep)
    seq.note(pedal, nf('D1') * 2, T(6.2), 10.3, vel=deep * 0.6)
    seq.note(oo, nf('D3'), T(6.8), 9.6, vel=deep)
    seq.note(oo, nf('A3'), T(7.6), 8.8, vel=deep * 0.85)
    for k, at in enumerate((10.6, 12.6, 14.6)):
        seq.note(strings, nf('D3'), T(at), 1.9, vel=deep * 0.9)
        seq.note(strings, nf('Eb3'), T(at + 2.0), 1.9 if at < 14 else 0.8, vel=deep * 0.9)
    # 2. rain (17-18.4): no music.
    # 3. the rise (18.4-21.15): the choir's "ah" low on D; a timpani roll from 19.2 growing with the halo; string tremolo
    #    climbing D, E flat, F, G to A by 21; a reversed cymbal from 20.4 into the strike.
    seq.note(ah, nf('D3'), T(18.4), 2.6, vel=0.55, adsr=(1.6, 0.5, 0.95, 0.5))
    seq.note(ah, nf('A2'), T(19.4), 1.6, vel=0.35, adsr=(1.2, 0.5, 0.95, 0.5))
    climb = [('D3', 18.6), ('Eb3', 19.2), ('F3', 19.7), ('G3', 20.2), ('A3', 20.7)]
    for i, (nn, at) in enumerate(climb):
        end = climb[i + 1][1] if i + 1 < len(climb) else 21.15
        t = at
        while t < end - 0.02:   # tremolo: the bow re-striking about 12 times a second
            seq.note(trem, nf(nn), T(t), 0.06, vel=0.35 + 0.5 * (t - 18.6) / 2.5)
            seq.note(trem, nf(nn) * 2, T(t + 0.04), 0.05, vel=0.22 + 0.3 * (t - 18.6) / 2.5)
            t += 0.083
    t = 19.2
    while t < 21.1:   # the timpani roll, growing
        k = (t - 19.2) / 1.9
        seq.add(ps1.timpani_hit(nf('D2'), 0.6, vel=0.12 + 0.5 * k ** 1.6, seed=int(t * 100)), T(t), gain=0.8)
        t += 0.07 - 0.025 * k
    cym = ps1.rev_cymbal(21.15 - 20.4)
    seq.add(cym, T(20.4), gain=0.32)
    # 4. the theme (21.15-39.15): bars at 21.15, 25.15, 29.15, 33.15, 37.15. On the strike the full chord.
    bars = [21.15, 25.15, 29.15, 33.15, 37.15]
    chords = [
        (['D2'], ['D3', 'A3', 'D4', 'F4'], ['D3', 'A3', 'F4'], ['D2', 'A2', 'D3']),        # D minor
        (['Bb1'], ['Bb2', 'F3', 'Bb3', 'D4'], ['Bb2', 'F3', 'D4'], ['Bb1', 'F2', 'Bb2']),  # B flat
        (['Eb2'], ['Eb3', 'Bb3', 'Eb4', 'G4'], ['Eb3', 'Bb3', 'G4'], ['Eb2', 'Bb2', 'Eb3']),  # E flat (the Phrygian flat second)
        (['A1'], ['A2', 'E3', 'A3', 'C#4'], ['A2', 'E3', 'C#4'], ['A1', 'E2', 'A2']),      # A (with C sharp)
        (['D2'], ['D3', 'A3', 'D4', 'F4'], ['D3', 'A3', 'F4'], ['D2', 'A2', 'D3']),        # D
    ]
    for b, (at, (ped, org, cho, low)) in enumerate(zip(bars, chords)):
        d = (bars[b + 1] if b + 1 < len(bars) else 39.15) - at
        for p in ped:
            seq.note(pedal, nf(p), T(at), d + 0.1, vel=0.95)
        for nn in org:
            seq.note(organ, nf(nn), T(at), d + 0.05, vel=0.8)
        for nn in cho:
            seq.note(ah if b in (0, 3) else oo, nf(nn), T(at), d, vel=0.85 if b in (0, 3) else 0.75, adsr=(0.25 if b == 0 else 0.8, 0.8, 0.9, 1.5))
        for nn in low:
            seq.note(strings, nf(nn), T(at), d + 0.05, vel=0.8)
        if b == 0:   # the strike: low brass and a timpani hit on the downbeat
            for nn in ('D2', 'A2', 'D3'):
                seq.note(brass, nf(nn), T(at), 2.6, vel=1.0)
            seq.add(ps1.timpani_hit(nf('D2'), 2.6, vel=1.0, seed=7000), T(at), gain=1.0)
        if b >= 1:   # a deep bell tolling each bar from bar 2
            seq.note(bell, nf('D3') if b != 3 else nf('A2'), T(at), 0.1, vel=0.8)
    # the melody on the flute, once the strike has settled
    mel = [('A4', 23.15, 1), ('C5', 24.15, 1), ('D5', 25.15, 2), ('C5', 27.15, 1), ('Bb4', 28.15, 1), ('G4', 29.15, 2),
           ('Bb4', 31.15, 1), ('A4', 32.15, 1), ('G4', 33.15, 1), ('F4', 34.15, 1), ('E4', 35.15, 2), ('D4', 37.15, 2.4)]
    for nn, at, beats in mel:
        seq.note(flute, nf(nn), T(at), beats * 0.96, vel=0.9, vib=(5.2, 0.18))
    # from the login (bar 2) a quiet harp in eighths on the chord's notes under the typing, out at bar 4
    harp_notes = {1: ['Bb3', 'D4', 'F4', 'Bb4', 'F4', 'D4', 'Bb3', 'F3'], 2: ['Eb4', 'G4', 'Bb4', 'Eb5', 'Bb4', 'G4', 'Eb4', 'Bb3']}
    for b in (1, 2):
        for k, nn in enumerate(harp_notes[b]):
            seq.note(harp, nf(nn), T(bars[b] + k * 0.5), 0.45, vel=0.75 - 0.08 * (k % 2))
    # 5. the last chord (39.15, the screen going black): D open (D, A, D, no third) on organ, choir and the bell, swelling
    #    for a moment and dying into the reverb; silent by about 41.6
    for nn in ('D2', 'A2', 'D3', 'A3', 'D4'):
        seq.note(organ, nf(nn), T(39.15), 0.9, vel=0.85, adsr=(0.35, 0.4, 0.9, 1.0))
    for nn in ('D3', 'A3', 'D4'):
        seq.note(oo, nf(nn), T(39.15), 0.8, vel=0.8, adsr=(0.4, 0.4, 0.9, 1.0))
    seq.note(pedal, nf('D2'), T(39.15), 0.9, vel=0.8, adsr=(0.3, 0.4, 0.9, 1.0))
    seq.note(bell, nf('D3'), T(39.15), 0.1, vel=0.9)
    dry = seq.mix()
    wet = ps1.hall(dry, decay=3.4, wet=0.36, pre=0.035)
    out = wet[:int((41.6 - THEME_AT + 0.4) * PSR)]
    # fade the last of the tail to silence by 41.6
    n0, n1 = int((41.0 - THEME_AT) * PSR), int((41.6 - THEME_AT) * PSR)
    if n1 <= len(out):
        out[n0:n1] *= np.linspace(1, 0, n1 - n0)[:, None] ** 2
        out[n1:] = 0
    # the deep part thins out with the dithered fade (16.45) and is gone at 17
    a0, a1 = int((16.45 - THEME_AT) * PSR), int((17.0 - THEME_AT) * PSR)
    out[a0:a1] *= np.linspace(1, 0, a1 - a0)[:, None]
    return out, seq.voices_max()


def register(cue, write, level, kenney, out_dir):
    """Adds the launch's cues to make.py's table."""

    # ------------------------------------------------ the real PC (clean)
    @cue('mouse')
    def _mouse():
        for k in range(2):
            D.seed(5000 + k)
            x = np.zeros(secs(0.16))
            place(x, D.click(0.012, 2500, 9000, 0.0016) + 0.6 * dsine(2400 + 300 * k, 0.012, 0.0025), 0.0, 1.0)
            place(x, D.click(0.01, 3000, 10000, 0.0012) * 0.55 + 0.35 * dsine(2900, 0.01, 0.002), 0.075, 1.0)
            place(x, D.lp(D.white(0.02), 600) * D.env_exp(0.02, 0.004) * 0.25, 0.0, 1.0)
            write(f'mouse_{k}', x, 'desk')

    @cue('kb_clack')
    def _kb_clack():
        # a mechanical keyboard, clacky (#127, Paweł: the login's typing is keyboard clacking): the keycap's sharp tick on
        # the plate, a hollow plastic body ringing for a few ms, the thock of bottoming out, then the softer click of the
        # key coming back up; six keys, each a little different
        for k in range(6):
            D.seed(5050 + k)
            r = D.rng.uniform
            x = np.zeros(secs(0.16))
            place(x, D.click(0.006, 3500, 11000, 0.0007), 0.0, 0.9)                                        # the tick
            body = D.peak(D.click(0.03, 700, 4500, 0.004), r(1500, 2300), 4) * 1.4 + D.peak(D.click(0.03, 600, 3000, 0.006), r(900, 1200), 6) * 0.9
            place(x, body, 0.0015, 1.0)                                                                       # the hollow clack
            place(x, dsine(r(170, 230), 0.05, 0.012) * 0.5, 0.002, 1.0); place(x, D.lp(D.click(0.02, 80, 900, 0.006), 700) * 0.6, 0.002, 1.0)   # the thock
            up = r(0.055, 0.085)
            place(x, D.peak(D.click(0.02, 1500, 7000, 0.0015), r(2400, 3200), 5) * 0.55, up, 1.0)              # back up
            write(f'kb_clack_{k}', x / (np.max(np.abs(x)) + 1e-9) * 0.9, 'desk')

    @cue('crt')
    def _crt():
        D.seed(5200)
        d = 0.8
        x = np.zeros(secs(d))
        t = tt(d)
        whine = 0.05 * np.sin(2 * np.pi * 10500 * t) * (t < 0.12)
        x += whine
        place(x, D.osc(np.interp(tt(0.09), [0, 0.09], [95, 50]), 0.09) * D.env_exp(0.09, 0.035, 0.001), 0.12, 0.9)
        place(x, D.click(0.012, 1500, 7000, 0.002), 0.12, 0.9)
        place(x, dsine(1150, 0.12, 0.02) * 0.25, 0.122, 1.0)
        place(x, D.chirp_osc(1800, 180, 0.16) * D.env_exp(0.16, 0.06) * 0.08, 0.16, 1.0)
        place(x, D.hp(D.white(0.25), 3000) * D.env_exp(0.25, 0.05) * 0.06, 0.13, 1.0)
        write('crt', x, 'desk')

    @cue('cdspin')
    def _cdspin():
        D.seed(5300)
        d = 2.7
        t = tt(d)
        f = 40 + 140 * (1 - np.exp(-t / 0.7))
        motor = D.lp(D.osc(f, d, 'saw'), 900, 2) * 0.25
        whir = D.bp(D.white(d), 300, 1200) * 0.05 * (0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(f) / SR))
        hi = D.osc(1500 + 2500 * (1 - np.exp(-t / 0.8)), d) * 0.012
        x = (motor + whir + hi) * np.clip(t / 0.25, 0, 1) * np.clip((d - t) / 0.4, 0, 1)
        for at in (0.4, 0.42, 1.1, 1.13, 1.16, 1.9):
            place(x, D.click(0.006, 2000, 6000, 0.0012) * 0.3, at)
        write('cdspin', x, 'desk')

    # ------------------------------------------------ the engine
    @cue('bootline')
    def _bootline():
        D.seed(5400)
        write('bootline', trim_tail(game(tick(1760, 0.05, 0.8), 1.2, 0.15)), 'desk')

    # ------------------------------------------------ Halsky Labs (#133: an 80s studio-gear sting, through the Amiga chain)
    def sweep_saw(f, d, fc0, fc1, bw=0.9, n=40):
        """A saw through a resonant filter sweeping from fc0 to fc1 (additive: each harmonic weighted by the filter)."""
        t = tt(d)
        fc = fc0 * (fc1 / fc0) ** np.clip(t / d, 0, 1)
        y = np.zeros(len(t))
        for h in range(1, n + 1):
            if h * f > 9000:
                break
            g = 1 / (1 + ((h * f / fc) ** 4)) + 1.6 * np.exp(-((np.log(h * f / fc)) / (0.18 * bw)) ** 2)
            y += np.sin(2 * np.pi * h * f * t + h * 0.7) / h * g
        return y

    def fm(fc, ratio, d, i0, tau_i, tau_a, attack=0.002):
        """A two-operator FM voice, the 80s bell and electric piano."""
        t = tt(d)
        idx = i0 * np.exp(-t / tau_i)
        return np.sin(2 * np.pi * fc * t + idx * np.sin(2 * np.pi * fc * ratio * t)) * np.exp(-t / tau_a) * np.clip(t / attack, 0, 1)

    def pluck(f, d, tau=0.35, bright=1.0):
        t = tt(d)
        y = np.zeros(len(t))
        for h in range(1, 14):
            y += np.sin(2 * np.pi * h * f * t) / h ** (1.2 / bright) * np.exp(-t / (tau / h ** 0.6))
        return y * np.clip(t / 0.002, 0, 1)

    def swept_noise(d, f0, f1, env, q=0.6):
        nz, t = D.white(d), tt(d)
        y = np.zeros(len(t))
        blk = secs(0.01)
        for j0 in range(0, len(t), blk):
            fc = f0 * (f1 / f0) ** (j0 / len(t))
            seg = D.bp(nz[max(0, j0 - blk * 4):j0 + blk], fc * (1 - q / 2), fc * (1 + q))
            y[j0:j0 + blk] = seg[-len(nz[j0:j0 + blk]):]
        return y * env

    @cue('hl_line')
    def _hl_line():
        D.seed(5510)
        d = 0.9
        t = tt(d)
        y = sweep_saw(110, d, 220, 5200) * np.clip(t / 0.01, 0, 1) * np.exp(-np.clip(t - 0.42, 0, None) / 0.18) * 0.5
        y += 0.6 * sweep_saw(220.5, d, 200, 4000) * np.clip(t / 0.01, 0, 1) * np.exp(-np.clip(t - 0.42, 0, None) / 0.18) * 0.3
        place(y, dsine(2637, 0.4, 0.09) * 0.25, 0.42)   # it settles on a bright ping
        write('hl_line', trim_tail(amiga(y * 0.6)), 'desk')

    @cue('hl_scan')
    def _hl_scan():
        D.seed(5610)
        d = 0.78
        x = np.zeros(secs(d))
        at = 0.0
        while at < d - 0.03:   # data: square blips hopping between tones, like a tape loader, soft
            f = float(D.rng.choice([1200, 1600, 2400, 3200]))
            seg = D.osc(f, 0.018, 'square', 0.5) * 0.25 * np.clip(tt(0.018) / 0.001, 0, 1)
            place(x, seg, at, D.rng.uniform(0.5, 1.0))
            at += D.rng.uniform(0.016, 0.03)
        x = D.bp(x, 700, 5000) * np.clip(tt(d) / 0.05, 0, 1) * np.clip((d - tt(d)) / 0.12, 0, 1)
        write('hl_scan', trim_tail(amiga(x * 0.7)), 'desk')

    @cue('hl_fly')
    def _hl_fly():
        D.seed(5710)
        d = 0.44
        t = tt(d)
        env = (t / d) ** 1.6 * np.clip((d - t) / 0.02, 0, 1)
        y = swept_noise(d, 400, 4200, env)
        write('hl_fly', trim_tail(amiga(y * 0.8)), 'desk')

    @cue('hl_hit')
    def _hl_hit():
        D.seed(5810)
        d = 2.6
        x = np.zeros(secs(d))
        # the stab: a sampler's orchestra hit, a D minor chord of brass saws and strings, a sharp attack, short
        st = tt(0.5)
        env = np.clip(st / 0.004, 0, 1) * np.exp(-st / 0.14)
        stab = np.zeros(len(st))
        for f, a in ((73.4, 1.0), (146.8, 0.9), (220, 0.8), (293.7, 0.7), (349.2, 0.6), (440, 0.5), (587.3, 0.35)):
            stab += sweep_saw(f, 0.5, 3000, 900, 1.2, 30) * a
        place(x, stab * env * 0.3, 0.0)
        # a gated reverb snare under it (the 80s)
        sn = D.bp(D.white(0.3), 900, 7000) * np.exp(-tt(0.3) / 0.07) + 0.6 * dsine(190, 0.3, 0.05)
        sn = D.reverb(sn, 0.6, 0.6)[:secs(0.3)] * np.clip((0.3 - tt(0.3)) / 0.02, 0, 1)
        place(x, sn * 0.5, 0.0)
        place(x, dsine(55, 0.6, 0.18) * 0.6, 0.0)
        # then an FM bell chord ringing on
        for f in (587.3, 698.5, 880.0):
            place(x, fm(f, 3.5, 2.2, 2.2, 0.25, 0.9) * 0.16, 0.03)
            place(x, fm(f / 2, 1.0, 2.2, 1.4, 0.4, 1.1) * 0.1, 0.03)
        write('hl_hit', trim_tail(amiga(x)), 'desk')

    @cue('hl_badge')
    def _hl_badge():
        D.seed(5910)
        x = np.zeros(secs(0.45))
        for at, l in ((0.0, 0.035), (0.1, 0.035), (0.2, 0.09)):
            b = D.osc(1975, l, 'square', 0.5) * np.clip(tt(l) / 0.001, 0, 1) * np.clip((l - tt(l)) / 0.004, 0, 1)
            place(x, D.lp(b, 6000) * 0.35, at)
        write('hl_badge', trim_tail(amiga(x)), 'desk')

    @cue('hl_presents')
    def _hl_presents():
        D.seed(6010)
        x = np.zeros(secs(1.8))
        place(x, fm(880, 2.0, 1.4, 1.2, 0.2, 0.6) * 0.3, 0.0)
        place(x, fm(1174.7, 2.0, 1.4, 1.0, 0.2, 0.7) * 0.25, 0.16)
        write('hl_presents', trim_tail(amiga(x)), 'desk')

    @cue('hl_glint')
    def _hl_glint():
        D.seed(6110)
        d = 0.9
        x = np.zeros(secs(d))
        for k in range(9):
            f = 3000 + 3200 * k / 8 + D.rng.uniform(-150, 150)
            place(x, dsine(f, 0.18, 0.05) * 0.18 * np.sin(np.pi * (k + 0.5) / 9), 0.05 + k * 0.065)
        place(x, swept_noise(0.7, 3000, 9000, np.sin(np.pi * tt(0.7) / 0.7) ** 2) * 0.12, 0.0)
        write('hl_glint', trim_tail(amiga(x)), 'desk')

    # ------------------------------------------------ Procrastination Studios (#133: a cracktro, its tracker jingle)
    @cue('ps_drop')
    def _ps_drop():
        D.seed(6420)
        d = 0.42
        t = tt(d)
        f = 1400 * (180 / 1400) ** (t / d)   # a falling whistle as the logo drops in
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.clip(t / 0.03, 0, 1) * np.clip((d - t) / 0.03, 0, 1) * 0.35
        y += swept_noise(d, 3000, 600, (t / d) ** 1.5) * 0.25
        write('ps_drop', trim_tail(amiga(y, room=0.05)), 'desk')

    @cue('ps_mod')
    def _ps_mod():
        """A 4-channel tracker jingle in D minor at 125 BPM (a row 0.12 s, speed 6 at 50 Hz): the logo lands on its first
        kick; arpeggio chords (the effect that plays a chord on one channel, a note per tick), a bass, the drums, a lead;
        a bar of Dm and Bb (the logo landing, then the lead climbing), then the tune over Dm, Bb, C, A; a final chord on
        row 44 rings out by 17 s, as the title comes in (#151, #153: the logo holds 2 s longer, so a bar more). Original."""
        D.seed(6520)
        ROW, TICK, N = 0.12, 0.02, 44
        out = np.zeros(secs(N * ROW + 0.62))
        nf = lambda m: 440.0 * 2 ** ((m - 69) / 12)   # MIDI note to Hz
        chords = [(0, 8, 62, 'min'), (8, 16, 58, 'maj'),
                  (16, 24, 62, 'min'), (24, 32, 58, 'maj'), (32, 38, 60, 'maj'), (38, 44, 57, 'maj')]   # a bar of D4 m, Bb3; then D4 m, Bb3, C4, A3
        # channel 1: the arpeggio, a 25% pulse, a note per tick
        for r0, r1, root, kind in chords:
            iv = [0, 3, 7] if kind == 'min' else [0, 4, 7]
            ticks = int((r1 - r0) * ROW / TICK)
            freq = np.concatenate([np.full(secs(TICK), nf(root + 12 + iv[k % 3])) for k in range(ticks)])
            seg = D.osc(freq, ticks * TICK, 'square', 0.25)
            env = 0.6 + 0.4 * np.exp(-np.mod(tt(ticks * TICK), ROW * 2) / 0.12)
            place(out, seg * env * 0.13, r0 * ROW)
        # channel 2: the bass, a filtered saw in eighths (root, root, octave, root)
        for r0, r1, root, kind in chords:
            for k, r in enumerate(range(r0, r1, 2)):
                f = nf(root - 24 + (12 if k % 4 == 2 else 0))
                b = D.lp(D.osc(f, 0.22, 'saw'), 900, 2) * np.exp(-tt(0.22) / 0.12) * np.clip(tt(0.22) / 0.004, 0, 1)
                place(out, b * 0.3, r * ROW)
        # channel 3: the drums
        def kick():
            kt = tt(0.16); k = np.sin(2 * np.pi * np.cumsum(45 + 90 * np.exp(-kt / 0.025)) / SR) * np.exp(-kt / 0.09)
            place(k, D.click(0.005, 1500, 6000, 0.001) * 0.3, 0.0); return k
        def snare():
            return D.bp(D.white(0.14), 1200, 7000) * np.exp(-tt(0.14) / 0.05) * 0.8 + dsine(185, 0.14, 0.04) * 0.5
        def hat():
            return D.hp(D.white(0.04), 7000) * np.exp(-tt(0.04) / 0.012) * 0.5
        for r in [b + o for b in range(0, 40, 8) for o in (0, 6)] + [40]:
            place(out, kick() * 0.5, r * ROW)
        for r in list(range(4, 40, 8)) + [42, 43]:
            place(out, snare() * (0.32 if r != 43 else 0.22), r * ROW)
        for r in range(1, N, 2):
            place(out, hat() * 0.12, r * ROW)
        # channel 4: the lead, a 50% pulse with a little vibrato
        melody = [(8, 74, 2), (10, 77, 2), (12, 74, 4)]   # it climbs
        melody += [(r + 16, m, ln) for r, m, ln in [(8, 69, 2), (10, 72, 2), (12, 74, 4), (16, 76, 2), (18, 77, 2), (20, 76, 2), (22, 73, 2), (24, 76, 4)]]   # the tune
        for r, m, ln in melody:
            d = ln * ROW
            t = tt(d)
            f = nf(m) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t) * np.clip((t - 0.08) / 0.05, 0, 1))
            place(out, D.osc(f, d, 'square', 0.5) * np.clip(t / 0.005, 0, 1) * (0.75 + 0.25 * np.exp(-t / 0.1)) * np.clip((d - t) / 0.01, 0, 1) * 0.11, r * ROW)
        # row 44: the final D minor chord, everything at once, ringing out
        r = N * ROW
        place(out, kick() * 0.55, r)
        place(out, D.hp(D.white(0.6), 3000) * np.exp(-tt(0.6) / 0.22) * 0.2, r)
        for m, a in ((38, 0.3), (62, 0.09), (65, 0.08), (69, 0.08), (74, 0.12)):
            wave = 'saw' if m < 50 else 'square'
            tone = D.osc(nf(m), 0.6, wave, 0.5)
            if m < 50:
                tone = D.lp(tone, 900, 2)
            place(out, tone * np.exp(-tt(0.6) / 0.22) * np.clip(tt(0.6) / 0.004, 0, 1) * a, r)
        write('ps_mod', trim_tail(amiga(out, room=0.08)), 'desk')

    # ------------------------------------------------ the title: the heavy part
    @cue('thunder_near')
    def _thunder_near():
        D.seed(7100)
        d = 4.2
        x = np.zeros(secs(d))
        for k, (at, a) in enumerate([(0, 1.0), (0.03, 0.7), (0.07, 0.8), (0.15, 0.5)]):
            place(x, noise_burst(0.4, 300, 9000, 0.06 + 0.03 * k) * a, at)
        roll = thunder_roll(3.8, 320, 7101) * np.clip(tt(3.8) / 0.15, 0, 1) * np.exp(-tt(3.8) / 1.4)
        place(x, roll * 1.6, 0.08)
        place(x, D.lp(D.osc(42, 2.5) * np.exp(-tt(2.5) / 0.7), 120), 0.05, 0.4)
        write('thunder_near', trim_tail(game(x, 2.6, 0.3)), 'desk')

    @cue('thunder_far')
    def _thunder_far():
        D.seed(7200)
        d = 3.6
        roll = thunder_roll(d, 170, 7201) * np.sin(np.pi * np.clip(tt(d) / d, 0, 1)) ** 1.5
        write('thunder_far', trim_tail(game(roll, 2.4, 0.3)), 'desk')

    @cue('rain')
    def _rain():
        D.seed(7300)
        loop_d = 6.0
        d = loop_d + 0.6
        hiss = D.hp(D.pink(d), 1800, 2) * 0.35
        patter = D.bp(D.white(d), 400, 2500) * 0.12 * (0.7 + 0.3 * D.smooth_rand(d, 2, 0, 1))
        drops = np.zeros(secs(d))
        for i in range(int(d * 260)):
            at = D.rng.uniform(0, d - 0.05)
            place(drops, D.bubble(D.rng.uniform(1800, 5200), D.rng.uniform(0.05, 0.25), 8, 0.08), at)
        x = hiss + patter + drops * 0.5
        x = ps1.from_psr(ps1.adpcm(ps1.to_psr(x)))
        lp = D.make_loop(x, loop_d, 0.5)
        lp = lp / (np.sqrt(np.mean(lp ** 2)) + 1e-9) * 10 ** (-20 / 20)
        write('rain', lp, 'desk', loop=True)

    @cue('aoj_ring')
    def _aoj_ring():
        D.seed(7400)
        d = 3.8
        x = np.zeros(secs(d))
        g = tt(1.0)
        nz = D.white(1.0)
        grind = np.zeros(len(g))
        blk = secs(0.01)
        for j in range(0, len(g), blk):
            k = j / len(g)
            seg = nz[max(0, j - blk * 6):j + blk]
            y = sum(D.peak(seg, f0 * (1 + 1.3 * k), 9) for f0 in (180, 260, 390, 610))
            grind[j:j + blk] = y[-len(nz[j:j + blk]):]
        grind *= (0.3 + 0.7 * g) * 0.6
        drone = (np.sin(2 * np.pi * 55 * g) + 0.5 * np.sin(2 * np.pi * 91.7 * g) + 0.35 * np.sin(2 * np.pi * 151 * g)) * 0.35 * (0.4 + 0.6 * g)
        hiss = D.hp(D.white(1.0), 3500) * (g ** 1.5) * 0.25
        place(x, grind + drone + hiss, 0)
        bl = tt(2.8)
        cracked = bellish(98, 2.8, [(0.5, 0.6, 1.6), (1.0, 1.0, 1.3), (1.012, 0.7, 1.3), (1.19, 0.5, 0.9), (2.0, 0.45, 0.8), (2.03, 0.3, 0.7), (2.66, 0.35, 0.5), (3.9, 0.2, 0.3)])
        cracked += D.bp(D.white(2.8), 300, 2400) * np.exp(-bl / 0.25) * 0.4
        place(x, cracked * np.clip(bl / 0.002, 0, 1), 1.0, 1.1)
        write('aoj_ring', trim_tail(game(x, 3.0, 0.35)), 'desk')

    @cue('aoj_spark')
    def _aoj_spark():
        D.seed(7500)
        d = 1.4
        x = np.zeros(secs(d))
        for i in range(70):
            at = 0.3 * (D.rng.random() ** 1.6)
            place(x, D.click(0.006, 2000, 10000, 0.0008) * D.rng.uniform(0.3, 1.0), at)
        place(x, noise_burst(0.08, 1500, 12000, 0.02), 0.0, 0.8)
        tt_ = tt(1.2)
        tone = np.sin(2 * np.pi * 3520 * tt_ * (1 + 0.003 * np.sin(2 * np.pi * 7 * tt_))) * np.exp(-tt_ / 0.45) * 0.3
        place(x, tone, 0.02)
        write('aoj_spark', trim_tail(game(x * 0.8, 1.8, 0.25)), 'desk')

    @cue('aoj_word')
    def _aoj_word():
        D.seed(7600)
        d = 0.75
        t = tt(d)
        nz = D.white(d)
        roar = np.zeros(len(t))
        blk = secs(0.01)
        for j in range(0, len(t), blk):
            fc = 300 + 2700 * (j / len(t)) ** 1.5
            roar[j:j + blk] = D.lp(nz[max(0, j - blk * 4):j + blk], fc, 2)[-len(nz[j:j + blk]):]
        roar *= (0.25 + 0.75 * (t / d)) * 1.2
        rumble = D.lp(D.brown(d), 150) * (t / d) * 0.6
        cym = ps1.from_psr(ps1.rev_cymbal(d))
        cym = cym[:len(t)] if len(cym) >= len(t) else np.concatenate([cym, np.zeros(len(t) - len(cym))])
        x = roar + rumble + cym * 0.8
        # no reverb tail here: it rises into the strike
        write('aoj_word', ps1.from_psr(ps1.adpcm(ps1.to_psr(x))), 'desk')

    @cue('aoj_strike')
    def _aoj_strike():
        D.seed(7700)
        d = 5.0
        x = np.zeros(secs(d))
        for k, (at, a) in enumerate([(0, 1.0), (0.02, 0.8), (0.05, 0.6)]):
            place(x, noise_burst(0.5, 200, 10000, 0.05 + 0.04 * k) * a, at)
        try:
            punch = kenney('impact_punch_heavy_000')
            metal = kenney('impact_metal_light_001')
            place(x, resample_pitch(punch, 1.8) * 1.4, 0.0)
            place(x, resample_pitch(metal, 2.6) * 0.9, 0.005)
        except Exception:
            pass
        anvil = bellish(110, 3.0, [(1, 1, 1.4), (2.56, 0.7, 0.9), (4.28, 0.5, 0.5), (6.6, 0.3, 0.3), (8.9, 0.15, 0.2)])
        place(x, anvil * 0.55, 0.0)
        st = tt(1.6)
        sub = np.sin(2 * np.pi * np.cumsum(60 * (30 / 60) ** (st / 1.2)) / SR) * np.exp(-st / 0.9) * np.clip(st / 0.01, 0, 1)
        place(x, sub * 1.2, 0.0)
        bell = bellish(73.4, 4.5, [(0.5, 0.5, 2.6), (1.0, 1.0, 2.0), (1.19, 0.6, 1.5), (1.5, 0.4, 1.3), (2.0, 0.4, 1.1), (2.66, 0.25, 0.7)])
        place(x, bell * 0.6, 0.02)
        place(x, thunder_roll(4.5, 260, 7701) * np.exp(-tt(4.5) / 1.6) * 0.9, 0.05)
        write('aoj_strike', trim_tail(game(x, 3.6, 0.35)), 'desk')

    @cue('aoj_quench')
    def _aoj_quench():
        D.seed(7800)
        d = 1.1
        t = tt(d)
        hiss = D.bp(D.white(d), 2500, 9000) * (0.6 + 0.4 * D.smooth_rand(d, 30, 0, 1)) * np.exp(-t / 0.4) * np.clip(t / 0.03, 0, 1)
        sizzle = np.zeros(len(t))
        for i in range(120):
            place(sizzle, D.click(0.004, 3000, 10000, 0.0008) * D.rng.uniform(0.1, 0.5), D.rng.uniform(0, 0.7))
        write('aoj_quench', trim_tail(game(hiss * 0.6 + sizzle * 0.4, 1.4, 0.2)), 'desk')

    @cue('aoj_ageof')
    def _aoj_ageof():
        D.seed(7900)
        d = 2.8
        x = np.zeros(secs(d))
        gt = tt(2.6)
        gong = bellish(110, 2.6, [(1, 1, 1.5), (1.42, 0.6, 1.2), (2.03, 0.5, 0.9), (2.76, 0.35, 0.7), (3.4, 0.2, 0.5)]) * np.clip(gt / 0.04, 0, 1)
        place(x, gong * 0.7, 0)
        sl = tt(0.7)
        nz = D.white(0.7)
        slide = np.zeros(len(sl))
        blk = secs(0.01)
        for j in range(0, len(sl), blk):
            fc = 1400 + 1800 * j / len(sl)
            slide[j:j + blk] = D.peak(nz[max(0, j - blk * 4):j + blk], fc, 12)[-len(nz[j:j + blk]):]
        slide *= np.clip(sl / 0.05, 0, 1) * 0.4
        place(x, slide, 0.0)
        place(x, slide * 0.8, 0.03)
        for at in (0.7, 0.72):
            place(x, bellish(3520, 0.6, [(1, 1, 0.15), (2.4, 0.4, 0.06)]) * 0.35, at)
        write('aoj_ageof', trim_tail(game(x, 2.4, 0.3)), 'desk')

    @cue('aoj_glint')
    def _aoj_glint():
        D.seed(8000)
        d = 0.9
        t = tt(d)
        y = np.zeros(len(t))
        for k, f in enumerate((4186, 5274, 6272, 7040)):
            y += np.sin(2 * np.pi * f * t + k) * np.exp(-((t - (0.15 + 0.18 * k)) / 0.12) ** 2)
        y *= 0.15
        write('aoj_glint', trim_tail(game(y, 1.6, 0.3)), 'desk')

    # ------------------------------------------------ the login's UI
    @cue('ui_panel')
    def _ui_panel():
        D.seed(8100)
        d = 1.0
        x = np.zeros(secs(d))
        sl = tt(0.46)
        rumble = D.bp(D.white(0.46), 70, 380) * 0.6 + D.peak(D.white(0.46), 1100, 14) * 0.12 + D.peak(D.white(0.46), 1650, 14) * 0.08
        place(x, rumble * np.clip(sl / 0.06, 0, 1), 0)
        place(x, D.osc(np.interp(tt(0.12), [0, 0.12], [90, 55]), 0.12) * D.env_exp(0.12, 0.04, 0.002) * 0.8, 0.45)
        place(x, D.lp(D.click(0.01, 300, 2500, 0.003), 1800) * 0.6, 0.45)
        write('ui_panel', trim_tail(game(x, 1.4, 0.2)), 'desk')

    @cue('ui_login')
    def _ui_login():
        D.seed(8200)
        d = 1.8
        x = np.zeros(secs(d))
        try:
            place(x, resample_pitch(kenney('impact_metal_light_000'), 1.7) * 0.8, 0)
        except Exception:
            pass
        place(x, D.osc(np.interp(tt(0.1), [0, 0.1], [140, 70]), 0.1) * D.env_exp(0.1, 0.03, 0.001) * 0.8, 0)
        place(x, bellish(nf('D3'), 1.6, [(1, 1, 0.9), (2.0, 0.4, 0.6), (2.66, 0.3, 0.4), (4.1, 0.1, 0.2)]) * 0.35, 0.01)
        write('ui_login', trim_tail(game(x, 1.8, 0.25)), 'desk')

    @cue('ui_verified')
    def _ui_verified():
        D.seed(8300)
        d = 3.0
        x = np.zeros(secs(d))
        for at, n in ((0.0, 'A3'), (0.45, 'D4')):
            place(x, bellish(nf(n), 2.4, [(0.5, 0.3, 1.6), (1, 1, 1.2), (2.0, 0.35, 0.8), (2.4, 0.25, 0.6), (3.0, 0.15, 0.4)]) * 0.5, at)
        write('ui_verified', trim_tail(game(x, 2.6, 0.3)), 'desk')

    # ------------------------------------------------ the theme
    @cue('aoj_theme')
    def _aoj_theme():
        x2, vmax = theme()
        # loudness like the other cues, on the sum: the loudest 300 ms at -18 dB RMS unless the peak would pass -1 dB
        m = x2.mean(axis=1)
        w = int(0.3 * PSR)
        p2 = np.convolve(m ** 2, np.ones(w) / w, mode='same')
        st = np.sqrt(np.max(p2)) + 1e-9
        gk = min(10 ** (-18 / 20) / st, 10 ** (-1 / 20) / (np.max(np.abs(x2)) + 1e-9))
        write_stereo(out_dir, 'aoj_theme', x2 * gk)
        print('aoj_theme: voices at most', vmax)
