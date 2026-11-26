#!/usr/bin/env python3
"""Derive per-word timings + 1-2 word caption chunks for "Pak Darto" from the ElevenLabs SRT.
Cue boundaries come from the SRT; inside each cue the words are spread over the *voiced* part only
(pauses found with ffmpeg silencedetect), weighted by word length. Writes:
  voice_darto/words.json, src/videos/darto/caption_chunks.json
"""
import json, re, subprocess, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MP3 = os.path.join(ROOT, "public", "darto_vo.mp3")
SRT = os.path.join(ROOT, "voice_darto", "darto.srt")

def ts(s):
    h, m, r = s.split(":"); sec, ms = r.split(",")
    return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000

def parse_srt(path):
    cues = []
    for blk in re.split(r"\n\s*\n", open(path, encoding="utf-8").read().strip()):
        ln = blk.strip().splitlines()
        if len(ln) < 3: continue
        a, b = [ts(x.strip()) for x in ln[1].split("-->")]
        cues.append((a, b, " ".join(ln[2:])))
    return cues

def silences():
    out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", MP3, "-af", "silencedetect=noise=-38dB:d=0.12", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    st, res = None, []
    for m in re.finditer(r"silence_(start|end): ([0-9.]+)", out):
        if m.group(1) == "start": st = float(m.group(2))
        elif st is not None: res.append((st, float(m.group(2)))); st = None
    return res

def voiced(a, b, sil):
    segs = [(a, b)]
    for s, e in sil:
        nxt = []
        for x, y in segs:
            if e <= x or s >= y: nxt.append((x, y)); continue
            if s > x: nxt.append((x, s))
            if e < y: nxt.append((e, y))
        segs = nxt
    return [(x, y) for x, y in segs if y - x > 0.03] or [(a, b)]

cues, sil = parse_srt(SRT), silences()
words = []
for a, b, text in cues:
    toks = text.split()
    segs = voiced(a, b, sil)
    total = sum(y - x for x, y in segs)
    wts = [len(re.sub(r"\W", "", t)) + 1.5 + (2.5 if t[-1] in ".,?!" else 0) * 0 for t in toks]
    wts = [6.0 if t.startswith("[") else w for t, w in zip(toks, wts)]
    S = sum(wts); acc = 0.0
    def at(frac):
        d = frac * total
        for x, y in segs:
            if d <= y - x: return x + d
            d -= y - x
        return segs[-1][1]
    for t, w in zip(toks, wts):
        s0, s1 = at(acc / S), at((acc + w) / S); acc += w
        words.append({"text": t, "start": round(s0, 3), "end": round(s1, 3), "cue_end": round(b, 3)})

json.dump(words, open(os.path.join(ROOT, "voice_darto", "words.json"), "w"), indent=1, ensure_ascii=False)

# caption chunks (no [tags], 1-2 words)
clean = [w for w in words if not w["text"].startswith("[")]
chunks, i = [], 0
P = (".", "?", "!", ",", ":", ";")
while i < len(clean):
    w1 = clean[i]
    if i + 1 < len(clean):
        w2 = clean[i + 1]
        gap = w2["start"] - w1["end"]
        if not w1["text"].endswith(P) and gap < 0.35 and len(w1["text"]) + len(w2["text"]) <= 15:
            chunks.append({"text": f'{w1["text"]} {w2["text"]}', "start": w1["start"], "end": w2["end"]}); i += 2; continue
    chunks.append({"text": w1["text"], "start": w1["start"], "end": w1["end"]}); i += 1
# make each chunk hold until next one starts if the gap is tiny
for a, b in zip(chunks, chunks[1:]):
    if b["start"] - a["end"] < 0.12: a["end"] = round(b["start"] - 0.01, 3)
json.dump(chunks, open(os.path.join(ROOT, "src", "videos", "darto", "caption_chunks.json"), "w"), indent=1, ensure_ascii=False)
print(len(words), "words,", len(chunks), "chunks")
for w in words: print(f'{w["start"]:6.2f}s f{round(w["start"]*30):4d}  {w["text"]}')
