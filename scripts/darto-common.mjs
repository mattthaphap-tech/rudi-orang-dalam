import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";

/** shared setup: project-local temp dir (REMOTION_TMP), optional system Chrome (CHROME_PATH), WebGL via ANGLE */
export const setup = () => {
  // /tmp is a 512M tmpfs — stale webpack bundles fill it and bundling dies ENOSPC.
  // Default to a project-local tmp on the home disk (126G free); honor an explicit REMOTION_TMP.
  const remotionTmp = process.env.REMOTION_TMP || path.resolve("tmp/remotion");
  fs.mkdirSync(remotionTmp, { recursive: true });
  process.env.REMOTION_TMP = remotionTmp;
  process.env.TEMP = process.env.TMP = process.env.TMPDIR = remotionTmp;
  return {
    browserExecutable: process.env.CHROME_PATH || undefined,
    chromiumOptions: { gl: "swangle" }, // VM: "angle" fails ("GL_VENDOR = Disabled") — use software ANGLE
  };
};
export const makeBundle = () => bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
