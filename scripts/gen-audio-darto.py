#!/usr/bin/env python3
"""Voice + procedural SFX + light comedic score for "Pak Darto dan Ekor Monyet" (2815 frames @ 30 fps = 93.83 s).
Reads public/darto_vo.mp3, writes public/darto_mix.wav (48 kHz stereo, -15 LUFS, true peak <= -1.2 dBTP).
Event frames are locked to src/videos/darto/story.ts (KEY + cuts) and voice_darto/words.json."""
import os, sys, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "skill", "templates", "audio"))
from dsp import SR, ns, tt, lp, hp, bp, colored, pan, st, integrated, true_peak, read_wav, write_wav, reson
import sfx_gen as G

FPS = 30.0
TOTAL = 2815
DUR = TOTAL / FPS
N = ns(DUR)
RNG = np.random.default_rng(7)
fr = lambda f: float(f) / FPS

def load_voice():
    tmp = os.path.join(ROOT, "public", "_darto_voice_48k.wav")
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", os.path.join(ROOT, "public", "darto_vo.mp3"), "-ar", str(SR), "-ac", "2", tmp], check=True)
    x, _ = read_wav(tmp); os.remove(tmp)
    out = np.zeros((2, N)); m = min(N, x.shape[1]); out[:, :m] = x[:, :m]
    return out

# ------------------------------------------------------------------ synth bits
def whoosh(dur=0.34, c=700, p=0.0):
    t = tt(dur); env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return pan(bp(colored(ns(dur), RNG, -2.5), max(60, c * 0.5), min(SR * 0.45, c * 1.8)) * env, p)

def kick(dur=0.32, f0=120, f1=38):
    t = tt(dur); fi = f1 + (f0 - f1) * np.exp(-t * 28.0)
    return st(np.sin(2 * np.pi * np.cumsum(fi) / SR) * np.exp(-t * 14) * 0.85 + np.exp(-t * 180) * colored(ns(dur), RNG, 2.0) * 0.25)

def flash(dur=0.95):
    t = tt(dur); out = np.zeros(len(t)); nr = int(0.45 * SR)
    out[:nr] += bp(colored(nr, RNG, -2.0), 350, 2200) * (t[:nr] / 0.45) ** 3 * 0.7
    nt = len(t) - nr; tl = np.arange(nt) / SR
    out[nr:] += np.sin(2 * np.pi * (55 * np.exp(-tl * 8)) * tl) * np.exp(-tl * 4.5) * 0.9 + lp(colored(nt, RNG, 1.0), 4500) * np.exp(-tl * 4.5) * 0.2
    return st(out)

def pop(dur=0.22, f=380):
    t = tt(dur); return st(np.sin(2 * np.pi * (f * np.exp(-t * 18) + 90) * t) * np.exp(-t * 22) + lp(colored(ns(dur), RNG, 2), 2500) * np.exp(-t * 60) * 0.5)

def chime(f=1180, dur=1.0):
    t = tt(dur)
    return pan((np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2) + 0.45 * np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t * 4.5) + 0.25 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 6)) * 0.6, 0.1)

def chirp(f0, f1, dur, vib=22.0, vd=0.05, amp=1.0):
    """cartoon monkey voice: gliding FM tone + formant bands"""
    t = tt(dur); fi = np.linspace(f0, f1, len(t)) * (1 + vd * np.sin(2 * np.pi * vib * t))
    v = np.sin(2 * np.pi * np.cumsum(fi) / SR) + 0.5 * np.sin(4 * np.pi * np.cumsum(fi) / SR) + 0.25 * np.sin(6 * np.pi * np.cumsum(fi) / SR)
    v = (reson(v, 1500, 3.0) * 0.6 + reson(v, 3300, 4.0) * 0.35 + v * 0.3) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.6
    return st(v * amp * 0.45)

def screech(dur=1.0):
    t = tt(dur); f = 700 + 900 * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.7
    y = chirp(700, 1500, dur, 28, 0.08)[0] * 1.2 + colored(ns(dur), RNG, -0.5) * 0.08 * np.exp(-t * 2)
    return st(y * np.exp(-t * 1.2))

def woodcrack():
    return st(G.wood_crack(np.random.default_rng(5)) * 0.35)

def chew(dur=0.07):
    t = tt(dur); return st(bp(colored(ns(dur), RNG, 0), 300, 1800) * np.exp(-t * 45) * 0.6)

def amb(dur, kind):
    r = np.random.default_rng(11 + kind)
    if kind == 0:  # river bank: water + birds + breeze
        y = G.water_bed(dur, r, 0.8) * 0.5
        y = y + pan(G.bird_chirps(dur, r, 0.5), -0.3) * 0.7 + G.breeze(dur, r, 0.5) * 0.6
    elif kind == 1:  # field: birds, breeze
        y = pan(G.bird_chirps(dur, r, 0.6), 0.3) * 0.8 + G.breeze(dur, r, 0.8) * 0.7
    else:           # village: breeze
        y = G.breeze(dur, r, 0.5) * 0.6
    return st(y)

# ------------------------------------------------------------------ score: plucked bed in A-minor pentatonic -> C-major for the village
def pluck(f, dur=0.45, amp=0.5):
    t = tt(dur); y = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * d) for k, a, d in [(1, 1, 7), (2, 0.4, 11), (3, 0.2, 15)])
    return y * amp

def score():
    out = np.zeros(N)
    bpm = 104.0; beat = 60.0 / bpm
    minor = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0]
    major = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]
    t = 0.0; i = 0
    r = np.random.default_rng(3)
    while t < DUR - 0.6:
        sc = major if t > fr(2305) else minor
        bass = sc[0] / 2 if t > fr(2305) else (sc[0] / 2 if (i // 8) % 2 == 0 else sc[2] / 2)
        if i % 4 == 0:
            y = pluck(bass, 0.6, 0.55)
            k = ns(t); out[k:k + len(y)] += y[: max(0, N - k)] if k + len(y) > N else y
        if i % 2 == 1 or r.random() < 0.35:
            f = sc[int(r.integers(0, len(sc)))] * (2 if r.random() < 0.3 else 1)
            y = pluck(f, 0.4, 0.28)
            k = ns(t + beat / 2)
            if k + len(y) <= N: out[k:k + len(y)] += y
        t += beat / 2; i += 1
    return st(out)

# ------------------------------------------------------------------ SFX track
def sfx_track():
    s = np.zeros((2, N))
    def put(sec, w, db=0.0):
        w = st(w) * 10 ** (db / 20); i0 = ns(sec); L = min(N - i0, w.shape[1])
        if L > 0 and i0 >= 0: s[:, i0:i0 + L] += w[:, :L]
    # camera: hard cuts and fast glides
    for f, p in [(30, 0.0), (77, -0.3), (84, 0.3), (132, 0.1), (215, 0.2), (333, 0.0), (385, -0.2), (470, 0.2), (512, 0.0), (548, -0.2), (581, 0.0), (616, 0.3), (684, -0.2),
                 (815, 0.0), (862, 0.3), (900, -0.2), (972, 0.2), (1038, 0.0), (1100, 0.2), (1150, -0.2), (1186, 0.1), (1219, 0.0), (1273, -0.2), (1319, 0.2), (1387, 0.0),
                 (1442, -0.2), (1485, 0.2), (1526, 0.0), (1586, -0.3), (1628, 0.2), (1692, 0.0), (1770, 0.2), (1800, -0.2), (1830, 0.0), (1879, -0.2), (1905, 0.2), (1930, 0.0),
                 (1975, 0.3), (2005, -0.2), (2111, 0.0), (2127, 0.3), (2169, -0.2), (2192, 0.2), (2235, 0.0), (2283, 0.0), (2305, 0.0), (2347, 0.2), (2391, -0.2), (2424, 0.3),
                 (2456, 0.0), (2504, 0.0), (2552, 0.2), (2615, 0.0), (2660, 0.0)]:
        put(fr(f) - 0.05, whoosh(0.3, 650 + 400 * ((f // 7) % 3), p), -8.0)
    # kicks (same list as story.ts KICKS)
    for sec, g in [(1.01, .9), (4.87, 1.0), (7.16, 1.25), (11.10, 1.0), (14.34, .8), (17.1, .8), (19.66, 1.45), (24.65, 1.6), (25.58, 1.7), (30.0, 1.0), (38.53, 1.0), (42.42, 1.0),
                   (48.56, 1.25), (49.97, 1.3), (51.29, 1.5), (55.47, 1.2), (59.48, 1.6), (62.30, 1.1), (63.64, 1.2), (70.36, 1.5), (72.31, 1.4), (75.5, 1.6), (76.82, 1.0), (79.71, .9), (87.16, .9), (91.66, .8)]:
        put(sec, kick(0.34, 110 + 20 * g, 40), -9.0 + 3 * g)
    # story beats
    put(fr(130), pop(0.25, 260), -6)                       # squat plop
    put(fr(215), pop(0.3, 420), -3); put(fr(218), chirp(300, 200, 0.25) * 0.5, -10)   # something pops out
    for k in range(6): put(fr(270) + k * 0.11, pop(0.12, 500 + 40 * k), -14)          # long tail sliding out
    put(fr(437), chirp(250, 180, 0.3, 8) * 0.5, -10)       # strain while pulling
    put(fr(581), chime(1568, 0.6), -9)
    put(fr(737) - 0.45, flash(0.95), -4)                   # flash -> monkey face
    put(fr(742), chirp(600, 1300, 0.5), -6)
    put(fr(767), screech(1.0), -3)                         # "Aaaah!" monkey scream
    for k, f in enumerate([880, 903, 925]): put(fr(f), chirp(520 + 90 * k, 700, 0.28), -10)   # three monkeys notice
    put(fr(1234), chime(1976, 0.5), -8)                    # idea!
    put(fr(1138), pop(0.2, 700), -12)                      # stolen corn (flashback)
    for k in range(7): put(fr(1442) + k * 0.43, pop(0.2, 600 - 30 * k), -6)    # corn pulled
    for k in range(5): put(fr(1445) + k * 0.5, chirp(500 + 60 * (k % 3), 800 - 40 * (k % 2), 0.22), -11)
    for f in (1485, 1492, 1499, 1512): put(fr(f), kick(0.22, 150, 70), -7)      # stomps
    put(fr(1526), woodcrack() * 0.25, -8)
    for k in range(5): put(fr(1645) + k * 0.12, chirp(1000, 1200 - 40 * k, 0.1, 30, 0.06), -8)   # hehehe
    put(fr(1784) - 0.45, flash(0.95), -5); put(fr(1784), chime(1318, 1.1), -6); put(fr(1786), chime(1760, 1.0), -9)   # monkeys become men
    put(fr(2111), chime(988, 0.5), -9)
    for k in range(10): put(fr(2127) + k * 0.14, kick(0.1, 200, 90), -14)           # running steps
    put(fr(2169), pop(0.35, 200), -3); put(fr(2171), chirp(1100, 700, 0.4), -8)
    put(fr(2265), woodcrack(), -4)                         # cage door slam
    for k in range(4): put(fr(2268) + k * 0.05, pop(0.1, 900 + 80 * k), -12)
    for f in (2759, 2786, 2810): put(fr(f), pop(0.2, 330), -8)                      # bananas land
    for k in range(10): put(fr(KEY_BANANA := 2750) + 0.3 + k * 0.28, chew(), -12 if k < 8 else -16)
    return s

def main():
    print("voice..."); voice = load_voice()
    print("sfx..."); sfx = sfx_track()
    print("ambience + score...")
    amb_t = np.zeros((2, N))
    for a, b, k, g in [(0, 1038, 0, 0.8), (1038, 1219, 1, 0.6), (1219, 1387, 0, 0.8), (1387, 2235, 1, 0.6), (2235, TOTAL, 2, 0.5)]:
        w = amb(fr(b) - fr(a), k); i0 = ns(fr(a)); L = min(N - i0, w.shape[1])
        fade = np.minimum(1, np.minimum(np.arange(L), L - np.arange(L)) / (0.3 * SR))
        amb_t[:, i0:i0 + L] += w[:, :L] * g * fade
    r = np.random.default_rng(9)
    env = np.zeros(N); a0, a1 = ns(fr(2305)), ns(fr(2615))
    env[a0:a1] = np.minimum(1, np.minimum(np.arange(a1 - a0), a1 - a0 - np.arange(a1 - a0)) / (0.6 * SR))
    crowd = G.applause(DUR, r, 26, env) * 0.5
    music = score()
    # duck music + ambience under the voice
    v = np.abs(voice).max(axis=0); w = int(0.12 * SR)
    venv = np.convolve(v, np.ones(w) / w, mode="same"); venv = np.clip(venv / 0.12, 0, 1)
    duck = 1.0 - 0.7 * np.convolve(venv, np.ones(int(0.2 * SR)) / int(0.2 * SR), mode="same")
    mix = voice * 1.0 + sfx * 0.5 + amb_t * 0.10 * duck + music * 0.075 * duck + crowd * 0.18
    for _ in range(4):   # gain to target, soft-limit the peaks, repeat
        lufs = integrated(mix); print(f"loudness {lufs:.1f} LUFS")
        mix = mix * 10 ** ((-15.0 - lufs) / 20)
        mix = np.tanh(mix / 0.55) * 0.55
    tp = true_peak(mix)   # already in dBTP
    if tp > -1.2: mix *= 10 ** ((-1.2 - tp) / 20)
    out = os.path.join(ROOT, "public", "darto_mix.wav")
    write_wav(out, mix, 24)
    print(f"wrote {out}  true peak {true_peak(mix):.2f} dBTP, {mix.shape[1]/SR:.2f} s")

if __name__ == "__main__":
    main()
