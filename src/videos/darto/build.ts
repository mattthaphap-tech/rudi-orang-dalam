// Procedural 3D sets for "Pak Darto dan Ekor Monyet": tepi sungai + hutan, kebun jagung Pak Gugun, kampung + kurungan.
// Same two-tone Lambert + InkPass + painted Canvas2D pipeline as the rest of the engine.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rng, ctex, rep, grassHD, stoneHD, planksHD, beamHD } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";

export type Kit = Record<string, THREE.Object3D>;
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ---------------- materials (shared, cached, all two-tone shaded) ----------------
const mats = new Map<string, THREE.Material>();
export const lam = (key: string, make: () => THREE.MeshLambertMaterialParameters) => {
  let m = mats.get(key) as THREE.MeshLambertMaterial | undefined;
  if (!m) {
    m = twoTone(new THREE.MeshLambertMaterial(make()));
    mats.set(key, m);
  }
  return m;
};

const f32 = (a: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
  const out = new Float32Array(a.count * a.itemSize);
  for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k);
  return new THREE.Float32BufferAttribute(out, a.itemSize);
};

export class Batch {
  private g = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geo: THREE.BufferGeometry, mat: THREE.Material, m?: THREE.Matrix4) {
    const src = geo.index ? geo.toNonIndexed() : geo;
    const x = new THREE.BufferGeometry();
    x.setAttribute("position", f32(src.attributes.position));
    if (src.attributes.normal) x.setAttribute("normal", f32(src.attributes.normal)); else x.computeVertexNormals();
    x.setAttribute("uv", src.attributes.uv ? f32(src.attributes.uv) : new THREE.Float32BufferAttribute(new Float32Array(src.attributes.position.count * 2), 2));
    if (m) x.applyMatrix4(m);
    const l = this.g.get(mat);
    if (l) l.push(x); else this.g.set(mat, [x]);
  }
  build(parent: THREE.Object3D, cast = true) {
    for (const [mat, list] of this.g) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), mat);
      mesh.castShadow = cast; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false;
      parent.add(mesh);
    }
    this.g.clear();
  }
}

// ---------------- cartoon trees ----------------
const LEAF = ["#5aa83c", "#4c9a37", "#69b545", "#55a243", "#3f8f3c"];
const leafTex = (i: number) => ctex("leafS" + i, 256, 128, (g) => {
  const base = new THREE.Color(LEAF[i % LEAF.length]), top = base.clone().offsetHSL(0.01, 0.03, 0.08), bot = base.clone().offsetHSL(-0.01, 0, -0.08);
  const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, "#" + top.getHexString()); gr.addColorStop(0.5, "#" + base.getHexString()); gr.addColorStop(1, "#" + bot.getHexString());
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
});
const leafMat = (i: number) => lam("leafS" + i, () => ({ map: leafTex(i) }));
const barkMat = () => lam("barkS", () => ({ color: "#8f5d3b" }));
const SPH = new THREE.SphereGeometry(1, 14, 10);
const TRUNK = new THREE.CylinderGeometry(0.55, 1, 1, 8, 1).translate(0, 0.5, 0);

export const addTree = (b: Batch, x: number, y: number, z: number, h: number, seed: number) => {
  const r = rng(Math.abs(Math.floor(seed * 97 + 13)));
  const leaf = leafMat(Math.floor(r() * 4));
  const tr = 0.07 * h, th = 0.42 * h;
  b.add(TRUNK, barkMat(), new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(tr, th, tr)));
  const cy = y + 0.62 * h;
  const put = (dx: number, dy: number, dz: number, rad: number) =>
    b.add(SPH, leaf, new THREE.Matrix4().compose(V(x + dx, cy + dy, z + dz), new THREE.Quaternion(), V(rad, rad * 0.88, rad)));
  put(0, 0, 0, 0.28 * h);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + r() * 0.5, d = 0.18 * h;
    put(Math.cos(a) * d, -0.05 * h, Math.sin(a) * d, 0.21 * h);
  }
  put(0, 0.16 * h, 0, 0.19 * h);
};

/** Helper to draw auto-fitted text inside Canvas2D textures so it never clips */
const fitText = (
  g: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxW: number,
  startPx: number,
  weight = "900",
  family = "sans-serif"
) => {
  let sz = startPx;
  g.font = `${weight} ${sz}px ${family}`;
  while (g.measureText(text).width > maxW && sz > 16) {
    sz -= 2;
    g.font = `${weight} ${sz}px ${family}`;
  }
  g.fillText(text, cx, cy);
};

// ---------------- Hand-Painted Custom Canvas2D Textures ----------------

// ======================================================================================================
// small helpers
// ======================================================================================================
const Q = new THREE.Quaternion(), E = new THREE.Euler();
const mtx = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(V(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), V(sx, sy, sz));
/** axis-aligned box centred at (x,y,z), optional yaw */
const bx = (b: Batch, m: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number, ry = 0) =>
  b.add(new THREE.BoxGeometry(w, h, d), m, mtx(x, y, z, 0, ry, 0));
/** vertical cylinder from y0 up by h */
const cyv = (b: Batch, m: THREE.Material, r: number, h: number, x: number, y0: number, z: number, seg = 8) =>
  b.add(new THREE.CylinderGeometry(r, r, h, seg), m, mtx(x, y0 + h / 2, z));
/** horizontal cylinder along x (rotated by yaw) */
const cyx = (b: Batch, m: THREE.Material, r: number, len: number, x: number, y: number, z: number, ry = 0, seg = 8) =>
  b.add(new THREE.CylinderGeometry(r, r, len, seg), m, mtx(x, y, z, 0, ry, Math.PI / 2));
const sph = (b: Batch, m: THREE.Material, rx: number, ry: number, rz: number, x: number, y: number, z: number) =>
  b.add(new THREE.SphereGeometry(1, 12, 9), m, mtx(x, y, z, 0, 0, 0, rx, ry, rz));
const NOINKMAT = (r: number, g2: number, b2: number) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g2, b2), fog: false });

// ---------------- painted textures ----------------
export const riverTex = () => ctex("dartoRiver", 512, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, "#4aa3bd"); gr.addColorStop(0.5, "#3a8fae"); gr.addColorStop(1, "#2f7da0");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.lineCap = "round";
  for (let i = 0; i < 46; i++) {
    const x = r() * 512, y = r() * 512, w = 30 + r() * 60;
    for (const dx of [-512, 0, 512]) {
      g.strokeStyle = `rgba(214,240,250,${0.35 + r() * 0.3})`; g.lineWidth = 3 + r() * 2;
      g.beginPath(); g.moveTo(x + dx - w / 2, y); g.quadraticCurveTo(x + dx, y - 9, x + dx + w / 2, y); g.stroke();
    }
  }
  for (let i = 0; i < 22; i++) {
    const x = r() * 512, y = r() * 512, w = 24 + r() * 50;
    g.strokeStyle = "rgba(28,92,126,0.4)"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x - w / 2, y + 8); g.quadraticCurveTo(x, y + 1, x + w / 2, y + 8); g.stroke();
  }
});
const soilTex = () => ctex("dartoSoil", 512, 512, (g, r) => {
  g.fillStyle = "#8d5e38"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) { // furrows run along the texture's vertical axis (= world z)
    const x = i * 64;
    g.fillStyle = "#6f4627"; g.fillRect(x + 4, 0, 18, 512);
    g.fillStyle = "#a2713f"; g.fillRect(x + 30, 0, 22, 512);
  }
  for (let i = 0; i < 260; i++) { g.fillStyle = r() > 0.5 ? "rgba(70,42,22,0.35)" : "rgba(190,140,90,0.3)"; g.beginPath(); g.arc(r() * 512, r() * 512, 1.5 + r() * 3, 0, 7); g.fill(); }
});
const dirtTex = () => ctex("dartoDirt", 512, 512, (g, r) => {
  g.fillStyle = "#c9a673"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 18; i++) { g.fillStyle = r() > 0.5 ? "rgba(222,190,140,0.35)" : "rgba(150,112,70,0.25)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 50 + r() * 90, 30 + r() * 60, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${96 + r() * 60},${72 + r() * 40},${46 + r() * 30},0.5)`; g.beginPath(); g.arc(r() * 512, r() * 512, 1 + r() * 3.2, 0, 7); g.fill(); }
});
const thatchTex = () => ctex("dartoThatch", 512, 512, (g, r) => {
  g.fillStyle = "#b88c47"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 16) { g.fillStyle = r() > 0.5 ? "#a47a3a" : "#c9a05a"; g.fillRect(0, y, 512, 10); g.fillStyle = "rgba(60,40,20,0.5)"; g.fillRect(0, y + 10, 512, 3); }
  for (let i = 0; i < 420; i++) { g.strokeStyle = `rgba(${110 + r() * 80},${80 + r() * 50},${34 + r() * 30},0.55)`; g.lineWidth = 1.5; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 8, y + 14); g.stroke(); }
});
const weaveTex = () => ctex("dartoWeave", 512, 512, (g, r) => {
  g.fillStyle = "#d4b277"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) for (let x = 0; x < 512; x += 32) {
    g.fillStyle = ((x + y) / 32) % 2 ? "#c29d5f" : "#dcbd86"; g.fillRect(x + 2, y + 2, 28, 28);
    g.strokeStyle = "rgba(90,60,30,0.55)"; g.lineWidth = 2; g.strokeRect(x + 2, y + 2, 28, 28);
  }
});
const boardTex = (key: string, line1: string, line2: string, bg: string, fg: string, rim: string) => ctex(key, 1024, 256, (g) => {
  g.fillStyle = rim; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = bg; g.fillRect(14, 14, 996, 228);
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
  fitText(g, line1, 512, line2 ? 98 : 128, 900, 116, "900", "'Poppins','Segoe UI',Arial,sans-serif");
  if (line2) fitText(g, line2, 512, 192, 860, 58, "800", "'Poppins','Segoe UI',Arial,sans-serif");
});

// ---------------- tree with a trunk (custom, so the kebun tree can have branches) ----------------
const leafM = (i = 0) => lam("dLeaf" + i, () => ({ color: ["#5aa83c", "#4c9a37", "#69b545"][i % 3] }));
const barkM = () => lam("dBark", () => ({ color: "#8a5a38" }));
const bigTree = (b: Batch, x: number, z: number, h: number, seed: number, y0 = 0) => {
  const r = rng(seed * 31 + 7);
  b.add(new THREE.CylinderGeometry(0.1 * h / 3, 0.17 * h / 3, h * 0.62, 8), barkM(), mtx(x, y0 + h * 0.31, z));
  for (let i = 0; i < 6; i++) {
    const a = r() * 6.28, d = r() * 0.2 * h, rad = (0.2 + r() * 0.1) * h;
    sph(b, leafM(i), rad, rad * 0.85, rad, x + Math.cos(a) * d, y0 + h * 0.72 + (r() - 0.3) * 0.16 * h, z + Math.sin(a) * d);
  }
};
const palm = (b: Batch, x: number, z: number, h: number, lean: number) => {
  for (let i = 0; i < 6; i++) { const t = i / 6; cyv(b, barkM(), 0.09 - 0.03 * t, h / 6, x + lean * t * t * h, t * h, z, 6); }
  const tx = x + lean * h * 0.84, ty = h * 0.98;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    b.add(new THREE.BoxGeometry(1.5, 0.04, 0.22), leafM(1), mtx(tx + Math.cos(a) * 0.65, ty - 0.12, z + Math.sin(a) * 0.65, 0, -a, -0.35));
  }
};

// ======================================================================================================
// SET 1: tepi sungai di pinggir hutan  (bank z > -1.7, river z -1.7..-6.5, forest beyond)
// ======================================================================================================
export const buildSungaiSet = () => {
  const g = new THREE.Group(), b = new Batch(), r = rng(21);
  const grassM = lam("dGrass", () => ({ map: rep(grassHD(), 7, 7) }));
  const mudM = lam("dMud", () => ({ color: "#7a5c3c" }));
  const riverM = lam("dRiverM", () => ({ map: rep(riverTex(), 9, 1.2) }));
  const rockM = lam("dRock", () => ({ color: "#9a968c" }));
  const rock2M = lam("dRock2", () => ({ color: "#78756e" }));
  const reedM = lam("dReed", () => ({ color: "#7aa642" }));
  const logM = lam("dLog", () => ({ map: beamHD() }));
  const ringM = lam("dLogEnd", () => ({ color: "#d9b27a" }));

  bx(b, grassM, 44, 0.4, 7.7, 0, -0.2, 2.15);                       // near bank (top y = 0)
  bx(b, mudM, 44, 0.22, 0.5, 0, -0.11, -1.75);                      // muddy edge
  bx(b, grassM, 44, 0.4, 16, 0, -0.1, -14.5);                       // far bank (top y = 0.1)
  b.add(new THREE.PlaneGeometry(44, 4.9).rotateX(-Math.PI / 2), riverM, mtx(0, -0.1, -4.2));

  // forest on the far side, thicker at the edges
  for (let i = 0; i < 34; i++) bigTree(b, -14 + i * 0.85 + (r() - 0.5) * 0.5, -7.6 - r() * 8, 3.8 + r() * 3.2, i + 3, 0.1);
  for (let i = 0; i < 8; i++) bigTree(b, (i % 2 ? 1 : -1) * (3.4 + i * 0.9), -6.9 - r() * 1.2, 3.2 + r() * 1.4, 70 + i, 0.1);
  palm(b, -2.8, -6.7, 4.0, -0.08); palm(b, 3.2, -7.1, 4.4, 0.07);
  bigTree(b, -3.0, -1.1, 3.5, 91); bigTree(b, 3.4, -1.15, 3.7, 92); // framing trees outside the narrow 9:16 view

  // boulders and reeds on the bank
  for (const [x, z, s] of [[-1.45, -1.4, 0.34], [-1.85, -1.25, 0.22], [2.4, -1.35, 0.3], [-0.55, -1.55, 0.16], [3.0, -1.2, 0.2]] as const)
    b.add(new THREE.IcosahedronGeometry(1, 0), s > 0.25 ? rockM : rock2M, mtx(x, s * 0.55, z, r(), r() * 3, 0, s * 1.2, s * 0.8, s));
  for (const [x, z, s] of [[-2.2, -3.2, 0.5], [2.8, -3.0, 0.45], [-1.0, -5.4, 0.55], [1.6, -5.8, 0.4]] as const)
    b.add(new THREE.IcosahedronGeometry(1, 0), rock2M, mtx(x, -0.1 + s * 0.3, z, 0, r() * 3, 0, s, s * 0.7, s));   // rocks in the water
  for (let i = 0; i < 26; i++) {
    const x = -3.4 + i * 0.27 + (r() - 0.5) * 0.12;
    if (x > -0.55 && x < 0.55) continue;
    cyv(b, reedM, 0.012, 0.5 + r() * 0.35, x, 0, -1.62 + (r() - 0.5) * 0.1, 5);
  }
  // the fallen log the three monkeys sit on (x 0.4..2.1, z = -1.05)
  b.add(new THREE.CylinderGeometry(0.17, 0.19, 1.9, 10), logM, mtx(1.25, 0.18, -1.05, 0, 0, Math.PI / 2));
  b.add(new THREE.CircleGeometry(0.17, 10), ringM, mtx(2.2, 0.18, -1.05, 0, Math.PI / 2, 0));
  b.add(new THREE.CylinderGeometry(0.03, 0.045, 0.5, 5), barkM(), mtx(1.7, 0.45, -1.2, 0.5, 0, -0.4));

  b.build(g, true);
  return g;
};

// ======================================================================================================
// SET 2: kebun jagung Pak Gugun  (soil z 6..-16, corn rows from z -1.7, the tree for Darto at x 1.3)
// ======================================================================================================
export type Stalk = { fall: THREE.Group; fallF: number };
const stalkGeoms = (() => {
  let cache: { green: THREE.BufferGeometry; cob: THREE.BufferGeometry } | null = null;
  return () => {
    if (cache) return cache;
    const parts: THREE.BufferGeometry[] = [];
    const put = (geo: THREE.BufferGeometry, m: THREE.Matrix4) => { const x = geo.index ? geo.toNonIndexed() : geo.clone(); x.applyMatrix4(m); parts.push(x); };
    put(new THREE.CylinderGeometry(0.022, 0.034, 1.3, 6), mtx(0, 0.65, 0));
    [[0.5, 0.0], [0.72, 2.2], [0.94, 4.4], [1.14, 1.1]].forEach(([y, a]) => put(new THREE.BoxGeometry(0.46, 0.012, 0.1), mtx(0.22 * Math.cos(a), y, 0.22 * Math.sin(a), 0, -a, -0.5)));
    put(new THREE.BoxGeometry(0.05, 0.16, 0.05), mtx(0, 1.36, 0)); // tassel
    const green = mergeGeometries(parts.map((p) => { const q = new THREE.BufferGeometry(); q.setAttribute("position", p.attributes.position); q.setAttribute("normal", p.attributes.normal); q.setAttribute("uv", p.attributes.uv); return q; }), false)!;
    const cobG = new THREE.SphereGeometry(1, 8, 6).toNonIndexed(); cobG.applyMatrix4(mtx(0.07, 0.8, 0, 0, 0, -0.25, 0.045, 0.12, 0.045));
    cache = { green, cob: cobG };
    return cache;
  };
})();

export const buildKebunSet = () => {
  const g = new THREE.Group(), b = new Batch(), r = rng(53);
  const soilM = lam("dSoil", () => ({ map: rep(soilTex(), 14, 6) }));
  const grassM = lam("dGrass", () => ({ map: rep(grassHD(), 7, 7) }));
  const laneM = lam("dLane", () => ({ color: "#b58a58" }));
  const woodM = lam("dPost", () => ({ map: beamHD() }));
  const thatchM = lam("dThatch", () => ({ map: rep(thatchTex(), 2, 2) }));
  const weaveM = lam("dWeave", () => ({ map: rep(weaveTex(), 2, 1) }));
  const darkM = lam("dDark", () => ({ color: "#3b2a1c" }));
  const strawM = lam("dStraw", () => ({ color: "#d9b85c" }));
  const sackM = lam("dSack", () => ({ color: "#b7915b" }));
  const signM = lam("dSignKebun", () => ({ map: boardTex("dSignKebunTex", "KEBUN PAK GUGUN", "", "#e8d8a8", "#4a2f1a", "#6b4a2e") }));

  bx(b, soilM, 44, 0.4, 22, 0, -0.2, -5);
  bx(b, grassM, 44, 0.4, 20, 0, -0.22, -26);
  bx(b, laneM, 1.0, 0.02, 14, 0, 0.01, -7.0);
  bx(b, laneM, 44, 0.02, 1.4, 0, 0.01, 0.9);

  // trees at the back + the climbing tree for "duduk di pohon sebelah"
  for (let i = 0; i < 22; i++) bigTree(b, -11 + i * 1.0 + (r() - 0.5) * 0.7, -14.5 - r() * 6, 4.4 + r() * 3, 11 + i);
  palm(b, -3.6, -10.5, 4.6, 0.06); palm(b, 4.2, -11.2, 4.2, -0.07);
  const tx = 1.35, tz = -1.45;
  b.add(new THREE.CylinderGeometry(0.2, 0.3, 3.6, 9), barkM(), mtx(tx, 1.8, tz));
  bx(b, woodM, 1.0, 0.16, 0.3, tx - 0.5, 1.54, tz + 0.2, 0.0);    // seat branch   (top y = 1.62)
  bx(b, woodM, 0.8, 0.12, 0.26, tx - 0.42, 1.46, tz + 0.2, 0.0);  // foot branch   (top y = 1.52)
  for (const [dx, dy, dz, s, i] of [[0, 4.1, 0, 1.15, 0], [-0.7, 3.8, 0.1, 0.8, 1], [0.7, 3.9, -0.1, 0.85, 2], [0.1, 4.7, 0.2, 0.75, 1], [-0.1, 3.5, -0.5, 0.8, 2]] as const)
    sph(b, leafM(i), s, s * 0.82, s, tx + dx, dy, tz + dz);

  // pondok (field hut) as a depth landmark behind the rows
  bx(b, weaveM, 2.0, 1.5, 1.7, 1.2, 0.75, -11.0);
  b.add(new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4), thatchM, mtx(1.2, 2.0, -11.0, 0, 0, 0, 1.75, 1.1, 1.55));
  bx(b, darkM, 0.5, 0.95, 0.05, 1.2, 0.48, -10.14);

  // scarecrow (orang-orangan sawah) between the rows
  const sx = -1.55, sz = -2.9;
  cyv(b, woodM, 0.03, 1.55, sx, 0, sz, 6);
  cyx(b, woodM, 0.025, 1.0, sx, 1.15, sz, 0, 6);
  b.add(new THREE.CylinderGeometry(0.17, 0.2, 0.62, 8), sackM, mtx(sx, 0.95, sz));
  sph(b, sackM, 0.18, 0.2, 0.18, sx, 1.52, sz);
  b.add(new THREE.ConeGeometry(0.42, 0.28, 10), strawM, mtx(sx, 1.78, sz));

  // sign "KEBUN PAK GUGUN"
  cyv(b, woodM, 0.035, 1.3, -1.7, 0, -0.9, 6); cyv(b, woodM, 0.035, 1.3, -0.75, 0, -0.9, 6);
  bx(b, signM, 1.0, 0.3, 0.05, -1.22, 1.0, -0.88);
  b.build(g, true);

  // corn (animated: individually posed stalks; the far ones are static)
  const { green, cob } = stalkGeoms();
  const greenM = lam("dStalk", () => ({ color: "#62a53b" })), cobM = lam("dCob", () => ({ color: "#f3c231" }));
  const stalks: Stalk[] = [];
  const stat = new Batch();
  const keyOf = (x: number, z: number, h: number) => Math.abs(x) * 0.55 + (-z - 1.7) * 0.6 + h * 0.5;
  const all: { x: number; z: number; h: number }[] = [];
  for (const s of [-1, 1]) for (let k = 0; k < 9; k++) for (let j = 0; j < 13; j++) {
    const x = s * (0.62 + k * 0.38) + (r() - 0.5) * 0.08, z = -1.7 - j * 0.62 + (r() - 0.5) * 0.1;
    if (Math.hypot(x - sx, z - sz) < 0.5) continue;
    all.push({ x, z, h: r() });
  }
  const maxKey = Math.max(...all.filter((a) => Math.abs(a.x) < 2.5 && a.z > -6.4).map((a) => keyOf(a.x, a.z, a.h)));
  for (const a of all) {
    const near = Math.abs(a.x) < 2.5 && a.z > -6.4, sc = 0.9 + 0.25 * r();
    if (!near) { stat.add(green, greenM, mtx(a.x, 0, a.z, 0, r() * 6, 0, sc, sc, sc)); stat.add(cob, cobM, mtx(a.x, 0, a.z, 0, 0, 0, sc, sc, sc)); continue; }
    const root = new THREE.Group(); root.position.set(a.x, 0, a.z); root.rotation.y = r() * 6.28;
    const fall = new THREE.Group(); root.add(fall);
    const m1 = new THREE.Mesh(green, greenM), m2 = new THREE.Mesh(cob, cobM);
    for (const m of [m1, m2]) { m.scale.setScalar(sc); m.castShadow = true; m.receiveShadow = true; fall.add(m); }
    g.add(root);
    stalks.push({ fall, fallF: a.h > 0.86 ? 1e9 : 1442 + Math.floor((keyOf(a.x, a.z, a.h) / maxKey) * 97) });
  }
  stat.build(g, true);
  return { root: g, stalks };
};

// ======================================================================================================
// SET 3: kampung  (packed earth z 7..-15, houses behind, banner at z -3.4, kurungan at (0, -1.2))
// ======================================================================================================
const triBunting = (b: Batch, a: V3x, c: V3x, n: number, cols: THREE.Material[]) => {
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, x = a[0] + (c[0] - a[0]) * t, y = a[1] + (c[1] - a[1]) * t - Math.sin(Math.PI * t) * 0.18, z = a[2];
    const tri = new THREE.BufferGeometry();
    tri.setAttribute("position", new THREE.Float32BufferAttribute([-0.13, 0, 0, 0.13, 0, 0, 0, -0.26, 0], 3));
    tri.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
    tri.computeVertexNormals();
    b.add(tri, cols[i % cols.length], mtx(x, y, z, 0, 0, (c[1] - a[1]) / (c[0] - a[0]) * 0.5));
  }
};
type V3x = [number, number, number];

export type Kampung = { root: THREE.Group; door: THREE.Group };
export const buildKampungSet = (): Kampung => {
  const g = new THREE.Group(), b = new Batch(), r = rng(77);
  const dirtM = lam("dDirt", () => ({ map: rep(dirtTex(), 10, 6) }));
  const grassM = lam("dGrass", () => ({ map: rep(grassHD(), 7, 7) }));
  const weaveM = lam("dWeave", () => ({ map: rep(weaveTex(), 2, 1) }));
  const thatchM = lam("dThatch", () => ({ map: rep(thatchTex(), 3, 2) }));
  const woodM = lam("dPost", () => ({ map: beamHD() }));
  const plankM = lam("dCageFloor", () => ({ map: rep(planksHD(), 1, 1) }));
  const bambooM = lam("dBamboo", () => ({ color: "#d5b24e" }));
  const bambooDM = lam("dBambooDark", () => ({ color: "#a98a34" }));
  const darkM = lam("dDark", () => ({ color: "#3b2a1c" }));
  const matM = lam("dMat", () => ({ color: "#b02a30" }));
  const trimM = lam("dMatTrim", () => ({ color: "#e3b54a" }));
  const redM = lam("dFlagRed", () => ({ color: "#d62828", side: THREE.DoubleSide }));
  const whiteM = lam("dFlagWhite", () => ({ color: "#f7f3ea", side: THREE.DoubleSide }));
  const goldFlagM = lam("dFlagGold", () => ({ color: "#f2b632", side: THREE.DoubleSide }));
  const bannerM = lam("dBanner", () => ({ map: boardTex("dBannerTex", "TERIMA KASIH PAHLAWAN!", "PENYELAMAT KEBUN KITA", "#c92c34", "#fff4d6", "#e3b54a") }));
  const tableM = lam("dTable", () => ({ color: "#8d5a33" }));
  const leafPlateM = lam("dPlate", () => ({ color: "#4e9a3c" }));
  const riceM = lam("dTumpeng", () => ({ color: "#f3c43a" }));
  const dishM = lam("dDish", () => ({ color: "#c0532a" }));

  bx(b, dirtM, 44, 0.4, 22, 0, -0.2, -4);
  bx(b, grassM, 44, 0.4, 16, 0, -0.22, -23);
  bx(b, matM, 2.7, 0.025, 1.1, 0, 0.012, 0.25); bx(b, trimM, 2.8, 0.02, 1.2, 0, 0.006, 0.25);

  const house = (x: number, z: number, w: number, d: number, h: number, seed: number) => {
    bx(b, weaveM, w, h, d, x, h / 2, z);
    b.add(new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4), thatchM, mtx(x, h + h * 0.36, z, 0, 0, 0, (w / 2 + 0.35) * 1.414, h * 0.72, (d / 2 + 0.35) * 1.414));
    bx(b, darkM, 0.55, h * 0.58, 0.06, x + (seed % 2 ? 0.45 : -0.45), h * 0.29, z + d / 2 + 0.02);
    bx(b, woodM, 0.5, 0.4, 0.06, x + (seed % 2 ? -0.55 : 0.55), h * 0.6, z + d / 2 + 0.02);
    bx(b, woodM, w + 0.2, 0.12, 0.5, x, 0.06, z + d / 2 + 0.3);
  };
  house(-2.9, -5.4, 2.4, 2.0, 1.7, 1); house(3.0, -5.8, 2.6, 2.2, 1.8, 2); house(0.3, -9.2, 3.4, 2.6, 2.1, 3);
  house(-5.7, -7.6, 2.4, 2.0, 1.7, 4); house(5.7, -8.2, 2.6, 2.0, 1.8, 5);
  palm(b, -4.2, -4.6, 5.0, 0.07); palm(b, 4.5, -4.2, 4.6, -0.06); palm(b, 7.0, -5.5, 5.4, 0.05);
  bigTree(b, -7.6, -11, 6.5, 5); bigTree(b, 7.8, -12, 6.8, 6); bigTree(b, -2.5, -13.5, 6.0, 7); bigTree(b, 3.0, -14, 6.4, 8);
  for (let i = 0; i < 14; i++) bigTree(b, -14 + i * 2.1 + (r() - 0.5), -16 - r() * 4, 5 + r() * 3, 30 + i);

  // banner + bunting + lanterns across the square (banner <= 1.8 m wide, centred at x = 0)
  cyv(b, bambooM, 0.05, 3.6, -1.05, 0, -3.4, 7); cyv(b, bambooM, 0.05, 3.6, 1.05, 0, -3.4, 7);
  cyv(b, bambooM, 0.04, 3.0, -3.3, 0, -3.4, 7); cyv(b, bambooM, 0.04, 3.0, 3.3, 0, -3.4, 7);
  bx(b, bannerM, 1.7, 0.43, 0.05, 0, 3.12, -3.38);
  triBunting(b, [-1.05, 3.45, -3.38], [-3.3, 2.95, -3.38], 10, [redM, whiteM]);
  triBunting(b, [1.05, 3.45, -3.38], [3.3, 2.95, -3.38], 10, [whiteM, redM]);
  triBunting(b, [-1.05, 3.45, -3.38], [1.05, 3.45, -3.38], 8, [goldFlagM, redM, whiteM]);

  // tumpeng table (left)
  bx(b, tableM, 0.95, 0.06, 0.62, -1.55, 0.72, -1.55);
  for (const [dx, dz] of [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]]) cyv(b, tableM, 0.025, 0.7, -1.55 + dx, 0, -1.55 + dz, 5);
  b.add(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 14), leafPlateM, mtx(-1.55, 0.77, -1.55));
  b.add(new THREE.ConeGeometry(0.2, 0.46, 12), riceM, mtx(-1.55, 1.02, -1.55));
  for (let i = 0; i < 5; i++) sph(b, dishM, 0.06, 0.05, 0.06, -1.55 + Math.cos(i * 1.26) * 0.28, 0.82, -1.55 + Math.sin(i * 1.26) * 0.26);

  // ---- kurungan (bamboo cage) at (0, -1.2): footprint 1.7 x 1.4, bars 1.65 m tall; front door swings on a hinge
  const cx = 0, cz = -1.2, hw = 0.8, hd = 0.7;
  bx(b, plankM, 1.8, 0.1, 1.55, cx, 0.05, cz);
  for (const [px, pz] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]]) cyv(b, bambooDM, 0.05, 1.78, cx + px, 0, cz + pz, 8);
  for (let i = 0; i <= 10; i++) { const x = cx - hw + 0.1 + i * 0.15; if (x < cx + hw - 0.05) cyv(b, bambooM, 0.024, 1.66, x, 0.1, cz - hd, 6); }
  for (let i = 0; i < 8; i++) { const z = cz - hd + 0.17 + i * 0.145; if (z < cz + hd - 0.1) { cyv(b, bambooM, 0.024, 1.66, cx - hw, 0.1, z, 6); cyv(b, bambooM, 0.024, 1.66, cx + hw, 0.1, z, 6); } }
  for (const y of [0.55, 1.1]) { cyx(b, bambooDM, 0.022, 2 * hw, cx, y, cz - hd, 0, 6); cyx(b, bambooDM, 0.022, 2 * hd, cx - hw, y, cz, Math.PI / 2, 6); cyx(b, bambooDM, 0.022, 2 * hd, cx + hw, y, cz, Math.PI / 2, 6); }
  for (let i = 0; i < 6; i++) cyx(b, bambooM, 0.03, 2 * hw + 0.1, cx, 1.74, cz - hd + 0.12 + i * 0.25, 0, 6);
  bx(b, thatchM, 2.0, 0.1, 1.7, cx, 1.86, cz);
  b.build(g, true);

  const door = new THREE.Group();
  door.position.set(cx - hw, 0.1, cz + hd);
  const db = new Batch();
  for (let i = 0; i < 10; i++) cyv(db, bambooM, 0.024, 1.58, 0.1 + i * 0.15, 0, 0, 6);
  cyx(db, bambooDM, 0.025, 1.6, 0.8, 0.04, 0, 0, 6); cyx(db, bambooDM, 0.025, 1.6, 0.8, 0.8, 0, 0, 6); cyx(db, bambooDM, 0.025, 1.6, 0.8, 1.56, 0, 0, 6);
  bx(db, darkM, 0.08, 0.14, 0.08, 1.5, 0.8, 0);
  db.build(door, true);
  g.add(door);
  return { root: g, door };
};
