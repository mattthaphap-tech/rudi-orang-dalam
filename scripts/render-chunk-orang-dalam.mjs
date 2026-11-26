// Chunked render for Rudi — Orang Dalam on GitHub Actions.
//   node scripts/render-chunk-orang-dalam.mjs <startFrame> <endFrame> -> muted h264 chunk of OrangDalam
// Uses software ANGLE (swangle): --gl=angle fails to create a WebGL context on GH runners.
// No webpack alias needed (this repo has no @story-style alias; all imports are relative).
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const start = Number(process.argv[2]);
const end = Number(process.argv[3]);
if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) {
  console.error("usage: node scripts/render-chunk-orang-dalam.mjs <startFrame> <endFrame>");
  process.exit(1);
}

// On GH Actions the workflow sets CHROME_PATH=/usr/bin/google-chrome (installed via .deb).
// Locally (VM/laptop) leave it unset: Remotion uses its bundled Chromium.
const browserExecutable = process.env.CHROME_PATH || null;
const chromiumOptions = { gl: "swangle" };
const common = { browserExecutable, chromiumOptions };

console.log("Bundling Remotion...");
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });

const comp = await selectComposition({ serveUrl, id: "OrangDalam", ...common });
const out = path.resolve(`out/orang-dalam/chunks/chunk-${start}-${end}.mp4`);
fs.mkdirSync(path.dirname(out), { recursive: true });
console.log(`Chunk ${start}-${end} of ${comp.durationInFrames} frames -> ${out}`);
await renderMedia({
  composition: comp, serveUrl, codec: "h264", outputLocation: out,
  frameRange: [start, end], muted: true, crf: 18, concurrency: 2,
  timeoutInMilliseconds: 900000,
  onProgress: ({ renderedFrames, progress }) => { if (renderedFrames % 150 === 0 || progress === 1) console.log(`Progress ${(progress * 100).toFixed(1)}%`); },
  ...common,
});
console.log("Chunk done");
