# Rudi "Orang Dalam" — Render Ready (v1)

Video cerita kampung 88,5 detik, 1080x1920 (9:16), 30 fps, 2655 frame.
VO ElevenLabs (Bagas) + BGM/SFX prosedural, caption Indonesia, efek komik 2D.

## Isi paket
- `src/videos/orang-dalam/` — semua file Fase 1–3: story.ts, cast.ts, world.ts,
  lights.ts, build.ts, Bridge.tsx, ComicOverlay.tsx, caption_chunks.json,
  sfx_cues.json, audio.ts
- `src/Root.tsx` — komposisi `OrangDalam` sudah terdaftar (Demo + Darto tetap ada)
- `public/audio/` — `Rudi-Orang-Dalam.wav` (VO, 88,1 dtk) + `orang-dalam-bed.wav`
  (BGM+SFX, sudah di-ducking & mastering −14,5 LUFS)
- `scripts/render-orang-dalam.mjs` — QA stills + render final (pola repo: API
  @remotion/renderer, gl=swangle, concurrency 1)
- `qa-stills/` — 6 still QA yang sudah dicek visualnya (hook, stamp LOLOS,
  panic, sedan malam, "Gampang.", ending deadpan)

## Cara render
```bash
npm install
npm run qa:orang-dalam      # 6 still QA (cek framing/lighting/overlay)
npm run render:orang-dalam  # MP4 final -> out/orang-dalam/OrangDalam-final.mp4
```
Final: H.264 yuv420p, CRF 18, AAC 192k. Estimasi render penuh di VM ~1–2 jam
(2655 frame); di laptop jauh lebih cepat. Atau pindah ke GitHub Actions
seperti Rania v1 (8 chunk paralel, ~5 menit).

## Yang sudah diperbaiki dari file Gemini (26 Nov 2026)
- **Layar hitam:** `<EffectComposer>` JSX dari @react-three/postprocessing
  tidak jalan di setup ini — diganti composer manual (postprocessing +
  RenderPass/EffectPass, pola Pak Darto) + background/fog scene disalin ke
  scene luar. Scene sekarang tampil penuh.
- **13 framing kamera diperbaiki** (story.ts): punch-in/close-up Gemini
  terlalu dekat — kepala kepotong di LOLOS (S06), "Gampang." (S14), ending
  deadpan (S16); S04 malah kosong (kamera meleset dari Rudi); S10 malam
  gelap total (kamera pindah ke sisi rumah + lampu malam diterangin).
- **Lampu malam** (lights.ts): hemi 0,45→0,8, moonlight 0,42→1,0,
  porch 3,8→5,0, headlight 6,5→8,0, rim 0,85→1,3.
- **Audio:** `audio.ts` butuh @types/node + `"types": ["node"]` di
  tsconfig.json (TS 7 tidak auto-load) — sudah dipasang.
- **Temp dir:** bundle Remotion diarahkan ke `tmp/remotion` lokal
  (bukan /tmp yang cuma 512 MB — sempat ENOSPC).

## Catatan kecil (bukan cacat)
- Ekspresi 'money' Rudi (S04): matanya jadi tulisan "Rp" hijau — itu gag
  komik bawaan Gemini, bukan bug.
- Frame 1428 (punch sedan) agak soft 3–6 frame karena kick kamera — efek
  punch, hilang sendiri setelahnya.
- Tanda "..." di ending tampil sebagai 3 kotak kecil putih — itu titik-titik
  elipsis gaya Impact, disengaja.
