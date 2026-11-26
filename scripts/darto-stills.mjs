// Look-dev stills for "Pak Darto": one frame per beat at half size  ->  out/darto/stills/*.jpg
//   node scripts/darto-stills.mjs            (all)       node scripts/darto-stills.mjs 120,742,2265   (chosen frames)
import fs from "node:fs";
import path from "node:path";
import { renderStill, selectComposition } from "@remotion/renderer";
import { setup, makeBundle } from "./darto-common.mjs";

const { browserExecutable, chromiumOptions } = setup();
const outDir = path.resolve("out/darto/stills");
fs.mkdirSync(outDir, { recursive: true });
const frames = process.argv[2]
  ? process.argv[2].split(",").map(Number)
  : [30, 130, 230, 360, 480, 560, 600, 700, 750, 790, 900, 1100, 1250, 1350, 1470, 1520, 1620, 1700, 1790, 1850, 1960, 2050, 2150, 2200, 2268, 2330, 2420, 2540, 2680, 2790];

console.log("Bundling...");
const serveUrl = await makeBundle();
const composition = await selectComposition({ serveUrl, id: "DartoShort", browserExecutable, chromiumOptions });
for (const f of frames) {
  const output = path.join(outDir, `f${String(f).padStart(4, "0")}.jpg`);
  console.log("still", f, "->", output);
  await renderStill({ composition, serveUrl, output, frame: f, imageFormat: "jpeg", jpegQuality: 92, scale: 0.5, browserExecutable, chromiumOptions, timeoutInMilliseconds: 300000 });
}
console.log("done");
