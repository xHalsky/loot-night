"""The launch's whole audio as one file (#127): every cue of the sheet at its time with its MIX level, the rain with its
fades, the theme from 6.2 s, 0 to 44 s as it plays in the game (for Paweł's ear; nothing in the build reads it).

    python3 tools/sfx/launch_mix.py [out_dir]   ->  launch-audio.mp3, aoj_theme-alone.mp3

The cue sheet comes from src/render/page/aoj.js (evaluated with node), the levels from src/data/sounds.ts, the files
from src/assets/sfx/ (your own in own/ win, as in the game). Each cue's files in turn, as the game picks them.
"""
import json
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
SFX = os.path.join(ROOT, 'src', 'assets', 'sfx')
SR = 44100


def sheet():
    src = open(os.path.join(ROOT, 'src', 'render', 'page', 'aoj.js')).read()
    a = src.index('const LAUNCH_SOUND = [')
    b = src.index('const LAUNCH_MUSIC', a)
    b = src.index('\n', b)
    js = src[a:b] + '\nconsole.log(JSON.stringify({ sound: LAUNCH_SOUND, loops: LAUNCH_LOOPS, music: LAUNCH_MUSIC }));'
    out = subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def mixes():
    s = open(os.path.join(ROOT, 'src', 'data', 'sounds.ts')).read()
    body = s[s.index('export const MIX'):]
    body = body[:body.index('};')]
    return {k: float(v) for k, v in re.findall(r'(\w+):\s*([0-9.]+)', body)}


def loop_sec():
    s = open(os.path.join(ROOT, 'src', 'data', 'sounds.ts')).read()
    body = s[s.index('export const LOOP_SEC'):]
    body = body[:body.index('};')]
    return {k: float(v) for k, v in re.findall(r'(\w+):\s*([0-9.]+)', body)}


def files(cue):
    own = os.path.join(SFX, 'own')
    for d in (own, SFX):
        if not os.path.isdir(d):
            continue
        fs = sorted(f for f in os.listdir(d) if re.fullmatch(rf'{cue}(_\d+)?\.(mp3|ogg|wav|m4a)', f))
        if fs:
            return [os.path.join(d, f) for f in fs]
    return []


def decode(path, ch=2):
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        tmp = f.name
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-ac', str(ch), '-ar', str(SR), tmp], check=True)
    _, x = wavfile.read(tmp)
    os.unlink(tmp)
    x = x.astype(np.float64) / 32768
    return x if x.ndim == 2 else np.stack([x, x], axis=1)


def place(dst, src, at, gain):
    i = int(round(at * SR))
    if i < 0:
        src, i = src[-i:], 0
    m = min(len(src), len(dst) - i)
    if m > 0:
        dst[i:i + m] += src[:m] * gain


def lead_silence(x, thr=0.002):
    i = 0
    while i < len(x) and np.max(np.abs(x[i])) < thr:
        i += 1
    return i


def encode(x, dst):
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        wavfile.write(f.name, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
        tmp = f.name
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-ac', '2', '-b:a', '160k', dst], check=True)
    os.unlink(tmp)


def main(out_dir):
    sh, mix, lsec = sheet(), mixes(), loop_sec()
    dur = 44.0   # the launch is 42 s since #151
    out = np.zeros((int(dur * SR), 2))
    seen = {}
    for at, cue, _ in sorted(sh['sound'], key=lambda c: c[0]):
        fs = files(cue)
        if not fs:
            print('missing', cue)
            continue
        k = seen.get(cue, 0)
        seen[cue] = k + 1
        x = decode(fs[k % len(fs)])
        x = x[lead_silence(x):]   # the browser starts at the file's start; MP3 encoder delay is tiny, trimmed alike
        place(out, x, at, mix.get(cue, 0.5))
    for cue, a, b, fin, fout in sh['loops']:
        fs = files(cue)
        x = decode(fs[0])
        s0 = lead_silence(x) + int(0.25 * SR)
        L = int(lsec.get(cue, 6) * SR)
        lp = x[s0:s0 + L]
        n = int((b + fout - a) * SR)
        y = np.tile(lp, (n // L + 1, 1))[:n]
        t = np.arange(n) / SR
        env = np.minimum(np.clip(t / max(fin, 0.01), 0, 1), np.clip((b + fout - a - t) / max(fout, 0.01), 0, 1))
        place(out, y * env[:, None], a, mix.get(cue, 0.5))
    mu = sh['music']
    th = decode(files(mu['cue'])[0])
    th = th[lead_silence(th, 1e-4):]
    place(out, th, mu['at'], mix.get(mu['cue'], 0.6))
    peak = np.max(np.abs(out)) + 1e-9
    g = 10 ** (-1 / 20) / peak
    print(f'launch mix: peak {20 * np.log10(peak):.1f} dB before the -1 dB ceiling, {len(sh["sound"])} cues')
    os.makedirs(out_dir, exist_ok=True)
    encode(out * g, os.path.join(out_dir, 'launch-audio.mp3'))
    th = th[:int((mu['end'] - mu['at'] + 0.4) * SR)]
    encode(th * (10 ** (-1 / 20) / (np.max(np.abs(th)) + 1e-9)), os.path.join(out_dir, 'aoj_theme-alone.mp3'))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'design', 'v2', 'audio'))
