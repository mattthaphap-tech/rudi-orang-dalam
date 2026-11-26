// Diagnostic: render OrangDalam frame 256 capturing browser console output
import { renderStill, selectComposition } from "@remotion/renderer";
import { setup, makeBundle } from "./darto-common.mjs";

const { browserExecutable, chromiumOptions } = setup();
console.log("Bundling...");
const serveUrl = await makeBundle();
const composition = await selectComposition({ serveUrl, id: "OrangDalam", browserExecutable, chromiumOptions });
console.log("composition:", composition.id, composition.width, "x", composition.height, composition.durationInFrames, "frames");
await renderStill({
  composition,
  serveUrl,
  output: "out/orang-dalam/stills/diag-f0256.jpg",
  frame: 256,
  imageFormat: "jpeg",
  jpegQuality: 92,
  scale: 0.5,
  browserExecutable,
  chromiumOptions,
  timeoutInMilliseconds: 300000,
  logLevel: "verbose",
  onBrowserLog: (log) => {
    console.log("[browser]", log.type, log.text);
  },
});
console.log("done");
