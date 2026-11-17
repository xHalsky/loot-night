"""Small DSP kit for baking Loot Night's sounds (numpy + scipy). Everything mono, float, SR Hz."""
import numpy as np
from scipy import signal

SR = 44100
rng = np.random.default_rng(13)


def seed(n):
    global rng
    rng = np.random.default_rng(n)


def secs(d):
    return int(round(d * SR))


def tt(d):
    return np.arange(secs(d)) / SR


def silence(d):
    return np.zeros(secs(d))


def white(d):
    return rng.uniform(-1, 1, secs(d))


def pink(d):
    n = secs(d)
    f = np.fft.rfftfreq(n, 1 / SR)
    spec = np.fft.rfft(rng.standard_normal(n))
    spec[1:] /= np.sqrt(f[1:])
    spec[0] = 0
    x = np.fft.irfft(spec, n)
    return x / (np.max(np.abs(x)) + 1e-9)


def brown(d):
    x = np.cumsum(rng.standard_normal(secs(d)))
    x = hp(x, 20)
    return x / (np.max(np.abs(x)) + 1e-9)


def _sos(kind, f, order=2):
    nyq = SR / 2
    if kind == 'band':
        lo, hi = f
        return signal.butter(order, [max(lo, 10) / nyq, min(hi, nyq * 0.98) / nyq], 'bandpass', output='sos')
    return signal.butter(order, min(f, nyq * 0.98) / nyq, kind, output='sos')


def lp(x, f, order=2):
    return signal.sosfilt(_sos('low', f, order), x)


def hp(x, f, order=2):
    return signal.sosfilt(_sos('high', f, order), x)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(_sos('band', (lo, hi), order), x)


def peak(x, f, q):
    """Resonant band (a ringing peak)."""
    b, a = signal.iirpeak(f / (SR / 2), q)
    return signal.lfilter(b, a, x)


def env_exp(d, tau, attack=0.002):
    t = tt(d)
    e = np.exp(-t / tau)
    a = secs(attack)
    if a > 1:
        e[:a] *= np.linspace(0, 1, a)
    return e


def env_lin(d, points):
    """points: [(time, value), ...] piecewise linear over d seconds."""
    t = tt(d)
    ts, vs = zip(*points)
    return np.interp(t, ts, vs)


def smooth_rand(d, rate, lo=-1, hi=1):
    """Smoothed random control signal changing about `rate` times per second."""
    n = max(4, int(d * rate) + 4)
    pts = rng.uniform(lo, hi, n)
    t = tt(d)
    return np.interp(t, np.linspace(0, d, n), pts)


def place(dst, src, at, gain=1.0):
    """Mix src into dst at `at` seconds, with a 4 ms fade-out so cut layers never click."""
    i = secs(at)
    if i < 0:
        src, i = src[-i:], 0
    if i >= len(dst):
        return dst
    m = min(len(src), len(dst) - i)
    s = src[:m] * gain
    f = min(secs(0.004), m)
    if f > 1:
        s = s.copy()
        s[-f:] *= np.linspace(1, 0, f)
    dst[i:i + m] += s
    return dst


def fade(x, fin=0.005, fout=0.02):
    x = x.copy()
    a, b = secs(fin), secs(fout)
    if a > 1:
        x[:a] *= np.linspace(0, 1, a)
    if b > 1:
        x[-b:] *= np.linspace(1, 0, b)
    return x


def norm(x, peak_db=-1.0):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * 10 ** (peak_db / 20)


def rms_norm(x, rms_db=-20.0, ceil_db=-1.0):
    r = np.sqrt(np.mean(x ** 2)) + 1e-9
    y = x / r * 10 ** (rms_db / 20)
    c = 10 ** (ceil_db / 20)
    return np.tanh(y / c) * c   # soft limit the peaks


def reverb(x, decay=0.4, wet=0.25, bright=6000):
    """Cheap room: convolve with decaying filtered noise."""
    ir = white(decay) * env_exp(decay, decay / 5)
    ir = lp(ir, bright)
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    w = signal.fftconvolve(x, ir)[:len(x)]
    return x * (1 - wet) + w * wet


def make_loop(x, loop_d, xfade=0.4):
    """x must be at least loop_d + xfade long. Returns a seamless cycle of loop_d seconds."""
    L, X = secs(loop_d), secs(xfade)
    y = x[:L].copy()
    w = np.sin(np.linspace(0, np.pi / 2, X)) ** 2
    y[:X] = x[:X] * w + x[L:L + X] * (1 - w)
    return y


def chirp_osc(f0, f1, d, kind='exp'):
    t = tt(d)
    if kind == 'exp':
        f = f0 * (f1 / f0) ** (t / d)
    else:
        f = f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def osc(freq, d, wave='sine', duty=0.5):
    """freq: number or per-sample array."""
    n = secs(d)
    f = np.full(n, freq) if np.isscalar(freq) else freq[:n]
    ph = np.cumsum(f) / SR
    fr = ph % 1.0
    if wave == 'sine':
        return np.sin(2 * np.pi * ph)
    if wave == 'square':
        return np.where(fr < duty, 1.0, -1.0)
    if wave == 'tri':
        return 4 * np.abs(fr - 0.5) - 1
    if wave == 'saw':
        return 2 * fr - 1
    raise ValueError(wave)


def bubble(f, amp=1.0, cycles=14, rise=0.12):
    """A collapsing bubble / drip: damped sine with a small upward chirp (Minnaert)."""
    d = cycles / f * 2.5
    t = tt(d)
    tau = cycles / f / 2.5
    ff = f * (1 + rise * t / tau)
    return np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t / tau) * amp


def click(d=0.01, lo=2000, hi=8000, tau=0.002):
    return bp(white(d), lo, hi) * env_exp(d, tau, 0.0002)


# ---------- voices (additive, formant envelope) ----------

VOWELS = {   # F1, F2, F3 (adult female-ish; scaled for others)
    'a': (800, 1250, 2700), 'e': (500, 1900, 2600), 'i': (330, 2500, 3200), 'o': (520, 900, 2600),
    'u': (330, 850, 2500), 'uh': (640, 1190, 2600), 'ei': (480, 2100, 2700), 'ai': (750, 1300, 2700),
    'm': (260, 1000, 2300), 'n': (280, 1600, 2600), 'l': (380, 1100, 2700), 'y': (300, 2300, 3000),
}


def formant_gain(f, F, B=(90, 120, 170), W=(1.0, 0.55, 0.28)):
    g = np.zeros_like(f)
    for Fi, Bi, Wi in zip(F, B, W):
        g += Wi / (1 + ((f - Fi) / (Bi / 2)) ** 2)
    return g


def voice(f0, amp, F, breath=0.08, tilt=0.9, jitter=0.0, B=(90, 120, 170), W=(1.0, 0.55, 0.28), maxf=5000):
    """f0, amp: per-sample arrays. F: (n, 3) per-sample formant frequencies."""
    n = len(f0)
    f0 = f0 * (1 + jitter * smooth_rand(n / SR, 180, -1, 1)) if jitter else f0
    ph = 2 * np.pi * np.cumsum(f0) / SR
    out = np.zeros(n)
    K = int(maxf / max(60, np.min(f0)))
    for k in range(1, K + 1):
        fk = k * f0
        g = formant_gain(fk, F.T, B, W) * k ** -tilt
        g[fk > maxf] = 0
        out += g * np.sin(k * ph)
    # breath: noise through the same formants (approximate with two bands at F1/F2 means)
    if breath:
        nz = rng.standard_normal(n)
        f1, f2 = np.mean(F[:, 0]), np.mean(F[:, 1])
        out += breath * (peak(nz, f1, 3) + 0.6 * peak(nz, f2, 4)) * np.max(np.abs(out)) / 6
    return out * amp


def syllables(plan, f0_of, sr=SR):
    """plan: list of (dur, vowel_from, vowel_to, amp) -> f0 array via f0_of(t_array, total), amp, F arrays."""
    total = sum(p[0] for p in plan)
    n = secs(total)
    t = np.arange(n) / sr
    F = np.zeros((n, 3))
    A = np.zeros(n)
    i = 0
    for d, v0, v1, a in plan:
        m = secs(d)
        m = min(m, n - i)
        if v0 is None:
            i += m
            continue
        F0, F1 = np.array(VOWELS[v0]), np.array(VOWELS[v1])
        w = np.linspace(0, 1, m)[:, None]
        F[i:i + m] = F0 * (1 - w) + F1 * w
        e = np.ones(m)
        r = min(secs(0.025), m // 3)
        e[:r] = np.linspace(0, 1, r)
        e[-r:] = np.linspace(1, 0, r)
        A[i:i + m] = e * a
        i += m
    # fill silent formants with neighbours to avoid jumps
    for j in range(1, n):
        if not F[j].any():
            F[j] = F[j - 1]
    for j in range(n - 2, -1, -1):
        if not F[j].any():
            F[j] = F[j + 1]
    return f0_of(t, total), A, F


def mix(*xs):
    """Sum arrays of different lengths (padded with silence)."""
    n = max(len(x) for x in xs)
    out = np.zeros(n)
    for x in xs:
        out[:len(x)] += x
    return out
