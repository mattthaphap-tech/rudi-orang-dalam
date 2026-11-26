// Full render of "Pak Darto dan Ekor Monyet" (1080x1920, 30 fps, 2815 frames, audio = public/darto_mix.wav)
//   node scripts/darto-render.mjs                    -> out/darto/Pak_Darto_captions.mp4  (burned-in captions)
//   node scripts/darto-render.mjs --no-captions      -> out/darto/Pak_Darto.mp4
//   add --2k for 1440x2560, --preview for a fast 0.5-scale draft of the first 20 seconds
import fs from "node:fs";
import path from "node:path";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { setup, makeBundle } from "./darto-common.mjs";

const args = new Set(process.argv.slice(2));
const captions = !args.has("--no-captions");
const { browserExecutable, chromiumOptions } = setup();
const id = captions ? "DartoShortWithCaptions" : "DartoShort";
const scale = args.has("--preview") ? 0.5 : args.has("--2k") ? 1.3333 : 1;
const out = path.resolve(`out/darto/${captions ? "Pak_Darto_captions" : "Pak_Darto"}${args.has("--preview") ? "_preview" : args.has("--2k") ? "_2k" : ""}.mp4`);
fs.mkdirSync(path.dirname(out), { recursive: true });

console.log("Bundling...");
const serveUrl = await makeBundle();
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
const t0 = Date.now();
await renderMedia({
  composition, serveUrl, codec: "h264", outputLocation: out, crf: 16, scale,
  ...(args.has("--preview") ? { frameRange: [0, 599] } : {}),
  concurrency: Number(process.env.CONCURRENCY || 2), browserExecutable, chromiumOptions, timeoutInMilliseconds: 600000,
  onProgress: ({ renderedFrames, progress }) => { if (renderedFrames % 100 === 0 || progress === 1) console.log(`${(progress * 100).toFixed(1)}%  (${renderedFrames}/${composition.durationInFrames})`); },
});
console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(0)} s -> ${out}`);
