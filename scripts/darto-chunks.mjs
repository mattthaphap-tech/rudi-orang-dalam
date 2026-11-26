// Render "Pak Darto dan Ekor Monyet" in small frame-range chunks so a VM restart
// can only kill the current chunk, never the whole video.
// (Lesson from Tips Hewan Buas: VM restarts ~every 1-2h; a full render dies with
// 0 output. 50-frame chunks ~17 min each; completed chunks are skipped on re-runs.)
// Usage: node scripts/darto-chunks.mjs [chunkIndex]
//   - renders every missing chunk from chunkIndex onward, sequentially
//   - progress is appended to out/darto/chunks/progress.log (flushed per line)
//     — never pipe this through tail/grep, the output is buffered away on kill
// After all chunks: ffmpeg -f concat -safe 0 -i <list> -c copy out/darto/Pak_Darto_captions.mp4
import fs from "node:fs";
import path from "node:path";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { setup, makeBundle } from "./darto-common.mjs";

const { browserExecutable, chromiumOptions } = setup();
const common = { browserExecutable, chromiumOptions };

const TOTAL = 2815;
const CHUNK = 50;
const outDir = path.resolve("out/darto/chunks");
fs.mkdirSync(outDir, { recursive: true });
const logFile = path.join(outDir, "progress.log");
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  fs.appendFileSync(logFile, line + "\n");
  console.log(line);
};

const fromChunk = parseInt(process.argv[2] || "0", 10);
const nChunks = Math.ceil(TOTAL / CHUNK);

log(`Bundling Remotion...`);
const serveUrl = await makeBundle();
const comp = await selectComposition({ serveUrl, id: "DartoShortWithCaptions", ...common });
log(`Composition DartoShortWithCaptions: ${comp.durationInFrames} frames @30fps, ${comp.width}x${comp.height}`);

for (let i = fromChunk; i < nChunks; i++) {
  const start = i * CHUNK;
  const end = Math.min(start + CHUNK - 1, TOTAL - 1);
  const out = path.join(outDir, `darto_part_${String(start).padStart(4, "0")}_${String(end).padStart(4, "0")}.mp4`);
  if (fs.existsSync(out) && fs.statSync(out).size > 100000) {
    log(`Chunk ${i} [${start}-${end}] exists, skipping`);
    continue;
  }
  const t0 = Date.now();
  log(`Chunk ${i} [${start}-${end}] START -> ${out}`);
  await renderMedia({
    composition: comp,
    serveUrl,
    codec: "h264",
    outputLocation: out,
    frameRange: [start, end],
    crf: 16,
    concurrency: 1,
    timeoutInMilliseconds: 900000,
    ...common,
  });
  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  log(`Chunk ${i} [${start}-${end}] DONE in ${mins} min (${((Date.now() - t0) / 1000 / (end - start + 1)).toFixed(1)} s/frame)`);
}
log(`ALL CHUNKS DONE. Concat with: ffmpeg -f concat -safe 0 -i <list> -c copy out/darto/Pak_Darto_captions.mp4`);
