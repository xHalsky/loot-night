"""The console chain for the launch's sound (#127, docs/design/aoj-world.md §7b): what a PlayStation's sound chip did to
everything it played, so the launch's music and the game's own cues sound like the console, not a modern orchestra.

* Samples at 22,050 Hz, each through a 4-bit ADPCM round trip (the console's format: blocks of 28 samples, five
  prediction filters, a shift per block).
* Instruments are samples: one short mono sample per octave or two, a loop for the sustain; a note is that sample played
  faster or slower, with a soft interpolation that dulls the top end (so the timbre moves with the pitch, as on the chip).
* An envelope per note (attack, decay, sustain, release), a little panning per instrument.
* 24 voices at most: the sequencer never plays more than 24 notes at once (the oldest is released).
* The console's kind of reverb: a long dark hall, a comb and all-pass network run at 22,050 Hz, about a third wet.
* No modern mastering: a peak ceiling at -1 dB, the quiet left quiet.
Everything is seeded (dsp.seed), so a rebuild gives the same files.
"""
import numpy as np
from scipy import signal

import dsp as D

PSR = 22050          # the chip's sample rate for everything made here
VOICES = 24          # the chip's voices
K0 = np.array([0, 60, 115, 98, 122]) / 64.0
K1 = np.array([0, 0, -52, -55, -60]) / 64.0


def to_psr(x, sr=D.SR):
    """Down to the chip's rate (from the dsp kit's 44.1 kHz)."""
    if sr == PSR:
        return x
    return signal.resample_poly(x, PSR, sr)


def from_psr(x, sr=D.SR):
    return signal.resample_poly(x, sr, PSR)


# ---------------------------------------------------------------- ADPCM (the console's sample format)
def adpcm(x):
    """A 4-bit ADPCM round trip: encode in blocks of 28 with the best of five filters and a shift, decode. x: float
    -1..1 at PSR. Returns the decoded float signal (the grain: quantisation noise that follows the signal)."""
    s = np.clip(np.round(np.asarray(x, dtype=np.float64) * 32767), -32768, 32767)
    n = len(s)
    pad = (-n) % 28
    s = np.concatenate([s, np.zeros(pad)])
    out = np.zeros_like(s)
    p1 = p2 = 0.0
    for b in range(0, len(s), 28):
        blk = s[b:b + 28]
        best = None
        for f in range(5):
            k0, k1 = K0[f], K1[f]
            # the shift from the residual against the input's own prediction
            prev1 = np.concatenate([[p1], blk[:-1]])
            prev2 = np.concatenate([[p2, p1], blk[:-2]])[:28]
            r = blk - (prev1 * k0 + prev2 * k1)
            m = np.max(np.abs(r))
            sh = 12
            while sh > 0 and m > 7 * (1 << (12 - sh)):
                sh -= 1
            for shift in (sh, max(0, sh - 1)):
                sc = float(1 << (12 - shift))
                q1, q2 = p1, p2
                dec = np.empty(28)
                err = 0.0
                for i in range(28):
                    pred = q1 * k0 + q2 * k1
                    nib = int(round((blk[i] - pred) / sc))
                    nib = -8 if nib < -8 else 7 if nib > 7 else nib
                    v = nib * sc + pred
                    v = -32768.0 if v < -32768 else 32767.0 if v > 32767 else v
                    dec[i] = v
                    e = v - blk[i]
                    err += e * e
                    q2, q1 = q1, v
                if best is None or err < best[0]:
                    best = (err, dec, q1, q2)
        _, dec, p1, p2 = best
        out[b:b + 28] = dec
    return out[:n] / 32767.0


# ---------------------------------------------------------------- the console's reverb
def hall(x, decay=3.2, wet=0.33, damp=0.45, spread=23, pre=0.03, stereo=True):
    """A long dark hall: 8 damped combs in parallel, 4 all-passes in series, at PSR (Freeverb's shape). x: mono or
    (n, 2). Returns (n + tail, 2) stereo, the dry signal mixed in. decay: seconds to -60 dB."""
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    tail = int(decay * PSR * 1.1)
    xin = np.concatenate([x, np.zeros((tail, 2))])
    mono = xin.mean(axis=1)
    pd = int(pre * PSR)
    mono = np.concatenate([np.zeros(pd), mono])[:len(mono)]
    combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617]
    aps = [556, 441, 341, 225]
    outs = []
    for ch in range(2 if stereo else 1):
        acc = np.zeros(len(mono))
        for c in combs:
            L = int((c + (spread if ch else 0)) * PSR / 44100)
            g = 10 ** (-3 * L / PSR / decay)          # feedback for the decay time
            # y[n] = x[n-L] + g * lp(y[n-L]) ; the damping lowpass in the loop, solved as one IIR on a delayed line
            # (b, a) for: y = x_d + g*((1-damp) y_d + damp y_{d-1}) approximated with lfilter on a comb
            a = np.zeros(L + 2)
            a[0] = 1
            a[L] = -g * (1 - damp)
            a[L + 1] = -g * damp
            b = np.zeros(L + 1)
            b[L] = 1
            acc += signal.lfilter(b, a, mono)
        acc /= len(combs)
        for ap in aps:
            L = int((ap + (spread if ch else 0)) * PSR / 44100)
            gg = 0.5
            b = np.zeros(L + 1)
            b[0] = -gg
            b[L] = 1
            a = np.zeros(L + 1)
            a[0] = 1
            a[L] = -gg
            acc = signal.lfilter(b, a, acc)
        acc = signal.sosfilt(signal.butter(1, 3800 / (PSR / 2), 'low', output='sos'), acc)   # dark: the hall swallows the highs
        outs.append(acc)
    w = np.stack(outs if stereo else outs * 2, axis=1)
    w *= 3.0
    return xin * (1 - wet) + w * wet


# ---------------------------------------------------------------- sampled instruments
class Sample:
    """A mono sample at PSR with its root pitch and an optional sustain loop (start, end in samples)."""

    def __init__(self, data, root, loop=None):
        self.data = adpcm(np.asarray(data, dtype=np.float64))
        self.root = root
        self.loop = loop


class Instrument:
    def __init__(self, samples, adsr=(0.01, 0.2, 0.8, 0.3), pan=0.0, gain=1.0, dull=0.38):
        self.samples = sorted(samples, key=lambda s: s.root)
        self.adsr = adsr
        self.pan = pan
        self.gain = gain
        self.dull = dull   # the interpolation's top-end loss, as a fraction of the output Nyquist

    def pick(self, f):
        return min(self.samples, key=lambda s: abs(np.log2(f / s.root)))

    def render(self, f, dur, vel=1.0, adsr=None, vib=None):
        """One note: f Hz for dur seconds (to the release), the release after it. vib: (rate Hz, depth in semitones)."""
        a, d, s, r = adsr or self.adsr
        smp = self.pick(f)
        n = int((dur + r) * PSR)
        ratio = f / smp.root
        step = np.full(n, ratio)
        if vib:
            rate, depth = vib
            t = np.arange(n) / PSR
            ramp = np.clip(t / 0.6, 0, 1)
            step = ratio * 2 ** (depth * ramp * np.sin(2 * np.pi * rate * t) / 12)
        pos = np.cumsum(step) - step[0]
        data = smp.data
        if smp.loop:
            ls, le = smp.loop
            span = le - ls
            over = pos >= le
            pos = np.where(over, ls + np.mod(pos - ls, span), pos)
        else:
            pos = np.minimum(pos, len(data) - 1.001)
        i = np.floor(pos).astype(int)
        fr = pos - i
        i2 = np.minimum(i + 1, len(data) - 1)
        y = data[i] * (1 - fr) + data[i2] * fr
        y = signal.sosfilt(signal.butter(2, min(0.95, self.dull * 2), 'low', output='sos'), y)
        # the envelope
        t = np.arange(n) / PSR
        env = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
        rel = t >= dur
        if np.any(rel):
            lvl = env[np.argmax(rel)] if np.any(rel) else s
            env = np.where(rel, lvl * np.exp(-(t - dur) / max(r / 4, 1e-4)), env)
        return y * env * vel * self.gain


class Sequencer:
    """Notes placed on a stereo timeline at PSR. At most VOICES sound at once, as on the chip: notes are allocated in time
    order and a new note over the limit steals the oldest one (cut with a short fade)."""

    def __init__(self, length):
        self.buf = np.zeros((int(length * PSR) + PSR * 6, 2))
        self.reqs = []    # (at, inst, f, dur, vel, pan, kw)
        self.notes = []   # (start, end) as played, for the voice count

    def note(self, inst, f, at, dur, vel=1.0, pan=None, **kw):
        self.reqs.append((at, len(self.reqs), inst, f, dur, vel, pan, kw))

    def _render(self):
        if not self.reqs:
            return
        reqs = sorted(self.reqs)
        self.reqs = []
        ends = []
        for at, _, inst, f, dur, vel, pan, kw in reqs:
            r = (kw.get('adsr') or inst.adsr)[3]
            ends.append(at + dur + r)
        cut = list(ends)
        active = []
        for i, (at, *_rest) in enumerate(reqs):
            active = [j for j in active if cut[j] > at]
            if len(active) >= VOICES:
                j = min(active, key=lambda q: reqs[q][0])   # the oldest note gives its voice up
                cut[j] = at
                active.remove(j)
            active.append(i)
        for i, (at, _, inst, f, dur, vel, pan, kw) in enumerate(reqs):
            y = inst.render(f, dur, vel, **kw)
            m = int((cut[i] - at) * PSR)
            if m < len(y):
                y = y[:max(0, m)].copy()
                fd = min(len(y), int(0.02 * PSR))
                if fd > 1:
                    y[-fd:] *= np.linspace(1, 0, fd)
            p = inst.pan if pan is None else pan
            lg, rg = np.cos((p + 1) * np.pi / 4), np.sin((p + 1) * np.pi / 4)
            k = int(at * PSR)
            n = min(len(y), len(self.buf) - k)
            if n > 0:
                self.buf[k:k + n, 0] += y[:n] * lg
                self.buf[k:k + n, 1] += y[:n] * rg
            self.notes.append((at, at + len(y) / PSR))

    def add(self, x, at, gain=1.0, pan=0.0):
        """A one-shot (mono at PSR) on the timeline (a drum hit: it takes a voice for its length too)."""
        lg, rg = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        i = int(at * PSR)
        m = min(len(x), len(self.buf) - i)
        if m > 0:
            self.buf[i:i + m, 0] += x[:m] * gain * lg
            self.buf[i:i + m, 1] += x[:m] * gain * rg

    def mix(self):
        self._render()
        return self.buf

    def voices_max(self, step=0.02):
        if not self.notes:
            return 0
        end = max(e for _, e in self.notes)
        return max(sum(1 for s, e in self.notes if s <= t < e) for t in np.arange(0, end, step))


def ceiling(x, db=-1.0):
    """No mastering: only a peak ceiling."""
    m = np.max(np.abs(x)) + 1e-9
    return x * min(1.0, 10 ** (db / 20) / m) if m > 10 ** (db / 20) else x


# ---------------------------------------------------------------- making the instruments' samples (synthesised once)
def nf(name):
    """'D4' -> Hz."""
    names = {'C': -9, 'C#': -8, 'Db': -8, 'D': -7, 'D#': -6, 'Eb': -6, 'E': -5, 'F': -4, 'F#': -3, 'Gb': -3, 'G': -2,
             'G#': -1, 'Ab': -1, 'A': 0, 'A#': 1, 'Bb': 1, 'B': 2}
    p, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((names[p] + 12 * (o - 4)) / 12)


def _periodic(f, cycles, fn):
    """A loop of whole cycles of f at PSR: returns (data, loop) with the sustain loop on the last `cycles` periods."""
    per = PSR / f
    n_loop = int(round(per * cycles))
    f_true = PSR * cycles / n_loop                    # tuned so the loop holds whole periods
    pre = int(PSR * 0.25)
    t = np.arange(pre + n_loop) / PSR
    return fn(t, f_true), (pre, pre + n_loop), f_true


def organ_samples():
    out = []
    for root in ('D2', 'D3', 'D4', 'D5'):
        f = nf(root)
        stops = [(0.5, 0.55), (1, 1.0), (2, 0.5), (3, 0.22), (4, 0.18), (6, 0.06)]   # 16', 8', 4', 2 2/3', 2', 1 1/3'

        def fn(t, ff):
            y = sum(a * np.sin(2 * np.pi * ff * h * t + h) for h, a in stops if ff * h < PSR / 2.2)
            y += 0.03 * np.sin(2 * np.pi * ff * 8 * t) * (ff * 8 < PSR / 2.2)
            ch = 1 - np.exp(-t / 0.018)                # the pipe's speech: a little chiff at the start
            nz = D.rng.standard_normal(len(t)) * np.exp(-t / 0.03) * 0.05
            return y / 2.6 * ch + nz
        data, loop, ft = _periodic(f, max(1, int(round(f / 18))), fn)
        out.append(Sample(data, ft, loop))
    return out


def _formant_voice(f0, d, vowel, n_voices=4, male=0.82, seed=0):
    D.seed(seed)
    n = int(d * D.SR)
    out = np.zeros(n)
    for k in range(n_voices):
        det = 1 + (k - (n_voices - 1) / 2) * 0.004
        f = np.full(n, f0 * det) * (1 + 0.004 * D.smooth_rand(d, 5, -1, 1))
        F = np.tile(np.array(D.VOWELS[vowel]) * male, (n, 1))
        out += D.voice(f, np.ones(n), F, breath=0.15, tilt=1.1, maxf=3800)
    return out / (np.max(np.abs(out)) + 1e-9)


def choir_samples(vowel):
    out = []
    for i, root in enumerate(('D3', 'A3', 'D4')):
        f = nf(root)
        y = to_psr(_formant_voice(f, 2.6, vowel, seed=200 + i))
        # loop the middle with a crossfade so it holds
        ls, ld = int(0.6 * PSR), int(1.4 * PSR)
        seg = y[ls:ls + ld + int(0.3 * PSR)]
        X = int(0.3 * PSR)
        w = np.sin(np.linspace(0, np.pi / 2, X)) ** 2
        loopd = seg[:ld].copy()
        loopd[:X] = seg[:X] * w + seg[ld:ld + X] * (1 - w)
        data = np.concatenate([y[:ls], loopd])
        out.append(Sample(data * 0.9, f, (ls, ls + ld)))
    return out


def strings_samples():
    out = []
    for i, root in enumerate(('D2', 'D3', 'D4')):
        f = nf(root)
        D.seed(300 + i)
        d = 2.4
        n = int(d * D.SR)
        y = np.zeros(n)
        for k in range(7):
            det = 2 ** ((k - 3) * 0.06 / 12)
            vib = 1 + 0.003 * np.sin(2 * np.pi * (5 + k * 0.3) * np.arange(n) / D.SR + k)
            y += D.osc(f * det * vib, d, 'saw')
        y = D.lp(y, min(2600, f * 9), 2)
        y = D.hp(y, f * 0.7, 1)
        y = to_psr(y / (np.max(np.abs(y)) + 1e-9))
        ls, ld, X = int(0.5 * PSR), int(1.2 * PSR), int(0.3 * PSR)
        seg = y[ls:ls + ld + X]
        w = np.sin(np.linspace(0, np.pi / 2, X)) ** 2
        loopd = seg[:ld].copy()
        loopd[:X] = seg[:X] * w + seg[ld:ld + X] * (1 - w)
        out.append(Sample(np.concatenate([y[:ls], loopd]) * 0.8, f, (ls, ls + ld)))
    return out


def brass_samples():
    out = []
    for i, root in enumerate(('D2', 'D3')):
        f = nf(root)

        def fn(t, ff):
            y = sum((1 / h) * np.sin(2 * np.pi * ff * h * t) for h in range(1, 14) if ff * h < PSR / 2.2)
            return y / 2.2
        data, loop, ft = _periodic(f, max(1, int(round(f / 18))), fn)
        data = signal.sosfilt(signal.butter(2, 900 / (PSR / 2), 'low', output='sos'), data)
        out.append(Sample(data, ft, loop))
    return out


def flute_samples():
    out = []
    for root in ('D4', 'D5'):
        f = nf(root)

        def fn(t, ff):
            return (np.sin(2 * np.pi * ff * t) + 0.18 * np.sin(4 * np.pi * ff * t) + 0.05 * np.sin(6 * np.pi * ff * t)) / 1.2
        data, loop, ft = _periodic(f, max(1, int(round(f / 18))), fn)
        D.seed(400)
        breath = signal.sosfilt(signal.butter(2, [ft * 1.5 / (PSR / 2), min(0.95, ft * 4 / (PSR / 2))], 'band', output='sos'), D.rng.standard_normal(len(data))) * 0.08
        out.append(Sample(data + breath, ft, loop))
    return out


def harp_samples():
    """Plucked strings (Karplus-Strong), one-shots."""
    out = []
    for i, root in enumerate(('D3', 'D4', 'D5')):
        f = nf(root)
        D.seed(500 + i)
        n = int(2.2 * PSR)
        L = int(round(PSR / f))
        buf = D.rng.uniform(-1, 1, L)
        buf = np.convolve(buf, [0.5, 0.5], 'same')
        y = np.zeros(n)
        for k in range(n):
            y[k] = buf[k % L]
            buf[k % L] = 0.996 * 0.5 * (buf[k % L] + buf[(k + 1) % L])
        y *= np.exp(-np.arange(n) / PSR / 0.9)
        out.append(Sample(y / (np.max(np.abs(y)) + 1e-9), PSR / L))
    return out


def bell_sample(root='D3', d=6.0):
    """A deep bell: inharmonic partials, the hum note under it, long decay."""
    f = nf(root)
    n = int(d * PSR)
    t = np.arange(n) / PSR
    parts = [(0.5, 0.5, 4.0), (1.0, 1.0, 3.0), (1.19, 0.6, 2.2), (1.5, 0.45, 2.0), (2.0, 0.5, 1.6), (2.51, 0.3, 1.2), (2.66, 0.22, 1.0), (3.01, 0.18, 0.8), (4.1, 0.1, 0.5)]
    y = sum(a * np.sin(2 * np.pi * f * r * t + r) * np.exp(-t / tau) * (1 + 0.004 * np.sin(2 * np.pi * 0.7 * t * r)) for r, a, tau in parts)
    D.seed(600)
    y += D.rng.standard_normal(n) * np.exp(-t / 0.01) * 0.3
    return Sample(y / (np.max(np.abs(y)) + 1e-9), f)


def timpani_hit(f=nf('D2'), d=2.5, vel=1.0, seed=700):
    D.seed(seed)
    n = int(d * PSR)
    t = np.arange(n) / PSR
    ff = f * (1 + 0.06 * np.exp(-t / 0.05))
    y = np.sin(2 * np.pi * np.cumsum(ff) / PSR) * np.exp(-t / 0.9)
    y += 0.4 * np.sin(2 * np.pi * np.cumsum(ff * 1.5) / PSR) * np.exp(-t / 0.4)
    y += 0.25 * np.sin(2 * np.pi * np.cumsum(ff * 1.98) / PSR) * np.exp(-t / 0.25)
    nz = signal.sosfilt(signal.butter(2, [80 / (PSR / 2), 900 / (PSR / 2)], 'band', output='sos'), D.rng.standard_normal(n)) * np.exp(-t / 0.035) * 0.9
    return adpcm((y + nz) / 1.6 * vel)


def rev_cymbal(d, seed=800):
    """A reversed cymbal: metallic noise with its decay reversed, rising into the end."""
    D.seed(seed)
    n = int(d * PSR)
    t = np.arange(n) / PSR
    nz = D.rng.standard_normal(n)
    y = np.zeros(n)
    for fc in (3200, 4700, 6100, 7900, 9300):
        if fc < PSR / 2.1:
            y += signal.sosfilt(signal.butter(2, [fc * 0.92 / (PSR / 2), min(0.98, fc * 1.08 / (PSR / 2))], 'band', output='sos'), nz)
    y += 0.4 * signal.sosfilt(signal.butter(2, 2000 / (PSR / 2), 'high', output='sos'), nz)
    env = (t / d) ** 2.6
    return adpcm(y / (np.max(np.abs(y)) + 1e-9) * env)
