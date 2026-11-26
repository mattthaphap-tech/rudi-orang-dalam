// One-off look-dev still for "Orang Dalam" (Rudi) — frame 256 punch-in "Saya punya orang dalam"
import fs from "node:fs";
import path from "node:path";
import { renderStill, selectComposition } from "@remotion/renderer";
import { setup, makeBundle } from "./darto-common.mjs";

const { browserExecutable, chromiumOptions } = setup();
const outDir = path.resolve("out/orang-dalam/stills");
fs.mkdirSync(outDir, { recursive: true });
const frames = process.argv[2]
  ? process.argv[2].split(",").map(Number)
  : [256];

console.log("Bundling...");
const serveUrl = await makeBundle();
const composition = await selectComposition({ serveUrl, id: "OrangDalam", browserExecutable, chromiumOptions });
for (const f of frames) {
  const output = path.join(outDir, `f${String(f).padStart(4, "0")}.jpg`);
  console.log("still", f, "->", output);
  await renderStill({ composition, serveUrl, output, frame: f, imageFormat: "jpeg", jpegQuality: 92, scale: 0.5, browserExecutable, chromiumOptions, timeoutInMilliseconds: 300000 });
}
console.log("done");
