# Pak Darto dan Ekor Monyet — siap render

Video 9:16 (1080x1920, 30 fps, 2815 frame = 93,8 detik). Voice-over dan SRT dari ElevenLabs sudah terpasang dan semua adegan dikunci ke timing kata.

## Cara render
```bash
npm install
npm run darto:preview       # draft cepat: 20 detik pertama, setengah resolusi
npm run darto:stills        # 30 still per beat -> out/darto/stills  (cek tampilan dulu)
npm run darto:render        # final + caption  -> out/darto/Pak_Darto_captions.mp4
npm run darto:render-clean  # final tanpa caption -> out/darto/Pak_Darto.mp4
npm run darto:render-2k     # 1440x2560
npx remotion studio src/index.ts   # buka studio, komposisi folder "Darto"
```
Opsional: `CHROME_PATH=/path/ke/chrome` (Chrome sistem), `REMOTION_TMP=/disk/besar/tmp` (bundle Remotion cukup besar), `CONCURRENCY=4`.
Butuh Node 18+, Chrome/Chromium dengan WebGL, FFmpeg. Render sekitar 4 fps (~10-12 menit di 1080p).

## Isi proyek baru
- `src/videos/darto/story.ts`  21 shot, kamera, kick, DOF, flash putih (f737 dan f1784), semua dikunci ke kata.
- `src/videos/darto/build.ts`  tiga set 3D: tepi sungai+hutan, kebun jagung (batang roboh satu per satu), kampung+kurungan bambu (pintu menutup di f2265).
- `src/videos/darto/cast.ts`   Pak Darto (manusia dan monyet), tiga monyet, Pak Gugun, dua warga, kerumunan, anak-anak; FX: ekor di tanah, pantulan air, bohlam, jagung, pisang, confetti.
- `src/videos/darto/toon.ts`   topi baru monyet/caping/peci, ekor, prop pisang dan jagung.
- `public/darto_vo.mp3` + `public/darto_mix.wav` (voice + SFX + musik, -15 LUFS). Buat ulang: `npm run darto:audio`.
- `src/videos/darto/caption_chunks.json` caption 1-2 kata (tag `[tertawa]` dibuang). Buat ulang: `npm run darto:captions`.
- `voice_darto/words.json` timing per kata (hasil estimasi dari SRT + deteksi jeda audio).

## Catatan
- Timing kata adalah estimasi dari SRT; akurasinya sekitar +-0,2 detik. Kalau punya JSON word-level dari ElevenLabs, ganti isi `words.json` lalu jalankan `npm run darto:captions`.
- Kode belum pernah dirender di lingkungan pembuatnya (tanpa GPU/Three.js). Jalankan `darto:stills` dulu; kalau ada framing yang meleset, ubah angka kamera di `CAMS` pada `story.ts`.
