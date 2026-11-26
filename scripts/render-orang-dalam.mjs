// Orkestrasi OrangDalam (Rudi): generate audio bed -> 6 QA stills -> (opsional --final) MP4.
// Pola repo (darto-common): bundle sekali, @remotion/renderer API, gl=swangle, concurrency 1.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { setup, makeBundle } from './darto-common.mjs';

const { browserExecutable, chromiumOptions } = setup();

const qaFrames = [
  { name: '01-hook-orang-dalam', frame: 262 },
  { name: '02-stamp-lolos-1', frame: 742 },
  { name: '03-panic-dutch', frame: 1155 },
  { name: '04-night-noir-sedan', frame: 1428 },
  { name: '05-snap-gampang', frame: 2050 },
  { name: '06-deadpan-ending', frame: 2570 },
];

const isFinal = process.argv.includes('--final');

const run = (cmd) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
};

// 1. Generate audio bed BGM + SFX (-14.5 LUFS)
run('npx tsx src/videos/orang-dalam/audio.ts');

// 2. Bundle sekali untuk stills + final render
console.log('\nBundling...');
const serveUrl = await makeBundle();
const composition = await selectComposition({ serveUrl, id: 'OrangDalam', browserExecutable, chromiumOptions });
console.log(`Composition: ${composition.id} ${composition.width}x${composition.height} @${composition.fps}fps, ${composition.durationInFrames} frames`);

// 3. QA stills (cek framing, lighting, comic overlay, caption safe zone)
const qaDir = path.resolve('out/orang-dalam/qa');
fs.mkdirSync(qaDir, { recursive: true });
for (const item of qaFrames) {
  const output = path.join(qaDir, `${item.name}_f${item.frame}.jpg`);
  console.log('still', item.frame, '->', output);
  await renderStill({
    composition,
    serveUrl,
    output,
    frame: item.frame,
    imageFormat: 'jpeg',
    jpegQuality: 92,
    scale: 0.5,
    browserExecutable,
    chromiumOptions,
    timeoutInMilliseconds: 300000,
  });
}

if (!isFinal) {
  console.log('\nQA stills selesai di out/orang-dalam/qa/. Jalankan dengan --final untuk export MP4.');
  process.exit(0);
}

// 4. Final MP4 (H.264 yuv420p, AAC 192k, CRF 18) — VM: concurrency 1
const outMp4 = path.resolve('out/orang-dalam/OrangDalam-final.mp4');
fs.mkdirSync(path.dirname(outMp4), { recursive: true });
const progressLog = path.resolve('out/orang-dalam/render-progress.log');
let lastPct = -1;
console.log(`\nRendering final MP4 -> ${outMp4} (progress: ${progressLog})`);
await renderMedia({
  composition,
  serveUrl,
  codec: 'h264',
  outputLocation: outMp4,
  pixelFormat: 'yuv420p',
  crf: 18,
  audioCodec: 'aac',
  audioBitrate: '192k',
  browserExecutable,
  chromiumOptions,
  concurrency: 1,
  timeoutInMilliseconds: 300000,
  onProgress: ({ progress, renderedFrames, totalFrames }) => {
    const pct = Math.floor(progress * 100);
    if (pct !== lastPct && pct % 5 === 0) {
      lastPct = pct;
      const line = `${new Date().toISOString()} ${pct}% ${renderedFrames}/${totalFrames} frames\n`;
      fs.appendFileSync(progressLog, line);
      process.stdout.write(line);
    }
  },
});
console.log(`\nFinal render selesai: ${outMp4}`);
