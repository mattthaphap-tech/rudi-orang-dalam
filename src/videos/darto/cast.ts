// 2D cast + cartoon FX cards for "Pak Darto dan Ekor Monyet". Billboards lit by cardShade, contact/cast shadow blobs, NOINK layer.
// Every reaction lands 0-3 frames before its word (timings: voice_darto/words.json; key frames in story.ts KEY).
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxShadow, fxContact, fxBurst, fxStars, fxCreak, fxPuff,
  Outfit, FrontOpts, SideOpts, INK,
  DARTO_OUTFIT, DARTO_MONKEY_OUTFIT, GUGUN_OUTFIT, WARGA_A, WARGA_B, monyet, warga, KID_WARGA,
} from "./toon";
import { FPS, SHOTS, KEY, clamp01, smooth, lerp, WorldState } from "./story";
import { LightName } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
const ROOTS = new Set<THREE.Object3D>();

export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false;
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}

export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false;
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    } else {
      this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0;
    }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };
export type Stage = { places: Place[]; fx: FxPlace[] };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;

const tier = (d: number): [number, number, number] =>
  d < 8.5 ? [1800, 3000, 3.0] : d < 14 ? [1080, 1800, 1.8] : [480, 800, 0.8];

const SUN = new THREE.Vector3(0.5, 0.75, 0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: LightName = "golden";

const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

// ---------------- blinks, expression swaps & micro-motion helpers ----------------
const LEAD = 2 / FPS;
const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 48 * hh(i * 31 + n, 13));
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const liveTilt = (t: number, seed: number, amp = 2.6) => q(amp * Math.sin(t * 3.2 + seed), 30);
const liveHead = (t: number, seed: number, amp = 4.0) => q(amp * Math.sin(t * 2.4 + seed * 1.7) + (amp * 0.4) * Math.cos(t * 4.1 + seed), 30);

/** Parabolic hop/jump arc with a 3-frame crouch anticipation */
const hopY = (t: number, t0: number, dur = 0.42, height = 0.16): number => {
  const dt = t - t0;
  if (dt < -0.08 || dt > dur) return 0;
  if (dt < 0) return -0.025 * Math.sin(((dt + 0.08) / 0.08) * Math.PI);
  const u = dt / dur;
  return height * 4 * u * (1 - u);
};

type Who = { i: number; o: Outfit; okey: string };
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, side: boolean, mirror: boolean, fo: FrontOpts, so: SideOpts, scale = 1): Place => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const m = side && mirror, light = light2D(cam, m), seed = ((who.i * 5 + 3) % 7) + 1;
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror: m,
    draw: (p) => (side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

const CONTACT: Record<LightName, [number, number, number]> = {
  space: [0.18, 0.16, 0.32],
  night: [0.18, 0.16, 0.30],
  golden: [0.24, 0.20, 0.33],
  day: [0.20, 0.21, 0.33],
};
const TAIL: [number, number, number] = [0.38, 0.36, 0.56];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");

const blob = (out: Stage, x: number, _y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  const el = Math.asin(Math.min(0.99, Math.max(0.15, SUN.y)));
  const len = Math.min(2.2, Math.max(0.5, 1.4 / Math.tan(el))) * sc, h = len + 0.5 * sc, c = 0.3 * h;
  const tc = hexOf(TAIL, k);
  out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: 0.018, z: z + oz * c, w: 0.72 * sc, h, flat: true, rot });
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: 0.022, z: z + oz * 0.03 * sc, w: 0.54 * sc, h: 0.42 * sc, flat: true, rot });
};

// ---------------- FX cards ----------------
/** long monkey tail lying on the ground (flat card, 1360 x 240 px = 3.4 x 0.6 m); len 0..1 reveals it from the left, taut 0..1 straightens it */
const fxTailGround = (p: Pen, len: number, wig: number, taut: number) => {
  p.ol = 6;
  const pts: [number, number][] = [];
  const n = 60, L = Math.max(0.02, len);
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * L;
    pts.push([30 + s * 1290, 120 + (1 - taut) * 52 * Math.sin(s * 13 + wig) * (0.35 + 0.65 * s)]);
  }
  p.line(pts, "#8c5a2e", 22);
  for (let i = 3; i < n; i += 3) { const [x, y] = pts[i]; p.stroke([[x, y - 9], [x + 5, y + 9]], 2.5, "#5e3a1c"); }
  const e = pts[pts.length - 1];
  p.dot(e[0], e[1], 12, "#5e3a1c");
};
/** reflection in the river: head + shoulders of the character, wobbling, with ripples (soft card, 512 x 512) */
const fxReflect = (p: Pen, o: Outfit, expr: FrontOpts["expr"], wig: number, rip: number) => {
  const g = p.g;
  const gr = g.createRadialGradient(256, 256, 30, 256, 256, 256);
  gr.addColorStop(0, "rgba(58,150,184,0.95)"); gr.addColorStop(0.8, "rgba(58,150,184,0.9)"); gr.addColorStop(1, "rgba(58,150,184,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.save();
  g.translate(-119, -150); g.scale(1.25, 1.25);
  g.transform(1, 0, 0.05 * Math.sin(wig), 1, 0, 0);
  g.globalAlpha = 0.93;
  bodyFront(p, o, { mode: "stand", expr, light: -2.1, seed: 3, tailLen: 0 });
  g.restore();
  g.lineWidth = 6; g.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const r = ((rip + i / 3) % 1);
    g.strokeStyle = `rgba(236,250,255,${(0.75 * (1 - r)).toFixed(2)})`;
    g.beginPath(); g.ellipse(256, 270, 60 + r * 190, 40 + r * 120, 0, 0, Math.PI * 2); g.stroke();
  }
};
const fxBulb = (p: Pen) => {
  p.ell(150, 120, 62, 66, "#fff2a0", 9);
  p.poly([[118, 168], [182, 168], [172, 214], [128, 214]], "#c9ced6", 8);
  p.stroke([[130, 192], [170, 192]], 5, INK);
  p.stroke([[132, 120], [150, 150], [168, 120]], 5, "#e0a020");
  for (const a of [-60, -20, 20, 60, 160, 200]) {
    const r = (a * Math.PI) / 180 - Math.PI / 2;
    p.stroke([[150 + 84 * Math.cos(r), 120 + 84 * Math.sin(r)], [150 + 118 * Math.cos(r), 120 + 118 * Math.sin(r)]], 8, INK);
  }
};
const fxCob = (p: Pen, rot: number) => {
  p.poly([[40, 130], [80, 30], [120, 130]], "#5fa23a", 7);
  p.ell(82, 66, 24, 56, "#f3c231", 7, 0, 360, rot);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) p.dot(70 + j * 12, 36 + i * 17, 3, "#c89b12");
};
const fxBanana = (p: Pen) => {
  p.line([[26, 120], [40, 70], [84, 40], [134, 38]], "#f6d743", 18);
  p.dot(134, 38, 7, "#5a3b1a"); p.dot(26, 120, 6, "#5a3b1a");
};
const fxConfetti = (p: Pen, seed: number) => {
  const cols = ["#e63946", "#ffd43b", "#2ecc71", "#3b8fd9", "#ffffff", "#f783ac"];
  for (let i = 0; i < 34; i++) {
    const x = hh(i, seed) * 560 + 20, y = hh(i, seed + 7) * 560 + 20, a = hh(i, seed + 3) * 3, c = cols[i % cols.length];
    p.poly([[x, y], [x + 18 * Math.cos(a), y + 18 * Math.sin(a)], [x + 18 * Math.cos(a) - 7 * Math.sin(a), y + 18 * Math.sin(a) + 7 * Math.cos(a)], [x - 7 * Math.sin(a), y + 7 * Math.cos(a)]], c, 2);
  }
};

// ---------------- roster ----------------
type WhoX = Who;
const W = (i: number, o: Outfit, okey: string): WhoX => ({ i, o, okey });
const DARTO = W(1, DARTO_OUTFIT, "darto"), DARTOM = W(1, DARTO_MONKEY_OUTFIT, "dartom");
const M = [W(5, monyet(0), "m1"), W(6, monyet(1), "m2"), W(7, monyet(2), "m3")];
const GUGUN = W(8, GUGUN_OUTFIT, "gugun"), WA = W(9, WARGA_A, "wa"), WB = W(10, WARGA_B, "wb");
const CROWD = Array.from({ length: 12 }, (_, n) => W(20 + n, warga(n), "w" + n));
const KIDS = [W(40, KID_WARGA(0), "k0"), W(41, KID_WARGA(1), "k1")];
const DX = 0.15, DZ = -0.95;

// ---------------- the stage ----------------
export const stage = (ws: WorldState, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const { id, f, t } = ws;
  LNAME = SHOTS[id - 1].light;
  findSun(cam, SUN);

  const add = (who: Who, x: number, y: number, z: number, fo: FrontOpts, scale = 0.84, side = false, so: SideOpts = {}) => {
    out.places.push(person(cam, who, x, y, z, side, false, fo, so, scale));
    blob(out, x, y, z, scale * 0.95);
  };
  const idle = (i: number, o: FrontOpts = {}): FrontOpts => ({
    mode: "stand", phase: q(t * 1.1 + i * 0.13, 20), blink: lidAt(t, i), tilt: liveTilt(t, i, 2.2), headTilt: liveHead(t, i, 3.2), ...o,
  });
  const tail = (i: number, len = 1): Partial<FrontOpts> => ({ tailLen: len, tailSway: q(Math.sin(t * 3 + i), 10) });
  /** side-view walker whose feet stay planted: one gait cycle = 1.6 m */
  const walk = (who: Who, x: number, z: number, expr: FrontOpts["expr"], scale = 0.84, extra: SideOpts = {}) =>
    add(who, x, 0, z, {}, scale, true, { mode: "march", phase: q(x / 1.6, 40), expr, blink: lidAt(t, who.i), stride: 1, ...extra });
  const fxAt = (key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, extra: Partial<FxPlace> = {}) =>
    out.fx.push({ key, cw, ch, draw, x, y, z, w, h, ...extra });
  const puff = (x: number, y: number, z: number, f0: number, size = 0.7) => {
    if (f < f0 || f > f0 + 26) return;
    const k = q(clamp01((f - f0) / 26), 20);
    fxAt(`fx|puff|${k}`, 300, 300, (p) => fxPuff(p, k), x, y, z, size, size);
    const b = q(clamp01((f - f0) / 18), 20);
    if (b < 1) fxAt(`fx|burst|${b}`, 500, 500, (p) => fxBurst(p, b, "#ffd43b", 10, 36, 220), x, y + 0.1, z + 0.05, size * 1.2, size * 1.2);
  };
  const tailGround = (len: number, taut: number) => {
    const wig = q((t * 3.2) % (Math.PI * 2), 6), l = q(len, 40), tt = q(taut, 10);
    fxAt(`fx|tailG|${l}|${wig}|${tt}`, 1360, 240, (p) => fxTailGround(p, l, wig, tt), DX + 0.06 + 1.7, 0.02, DZ - 0.28, 3.4, 0.6, { flat: true });
  };
  const creak = (x: number, y: number, z: number, size = 0.5) => {
    const ct = q((t * 2.2) % 1, 10);
    fxAt(`fx|creak|${ct}`, 300, 300, (p) => fxCreak(p, ct), x, y, z, size, size);
  };
  const confetti = () => {
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.55 + i * 0.34) % 1;
      fxAt(`fx|conf|${i}`, 600, 600, (p) => fxConfetti(p, i * 11), -0.9 + i * 0.9 + Math.sin(t * 2 + i) * 0.15, 3.0 - ph * 3.2, -0.4 - i * 0.2, 1.6, 1.6, { soft: true });
    }
  };

  // =========================================================== SUNGAI ===========================================================
  if (id === 1) {
    add(DARTO, DX, 0, DZ, idle(1, { expr: f < 55 ? "pained" : "nervous", tilt: 8 + liveTilt(t, 1, 2), headTilt: 5 }));
    creak(DX - 0.02, 0.78, DZ + 0.18);
  } else if (id === 2) {
    if (f < 132) walk(DARTO, lerp(-4.0, DX, clamp01((f - 77) / 55)), DZ, "pained", 0.84, { stomp: 1.2 });
    else if (f < 138) add(DARTO, DX, 0, DZ, idle(1, { expr: "nervous", tilt: 6 }));
    else add(DARTO, DX, 0, DZ, idle(1, { mode: "sit", expr: "pained", tilt: 4 }));
  } else if (id === 3) {
    add(DARTO, DX, 0, DZ, idle(1, { mode: "sit", expr: f < 200 ? "pained" : f < 224 ? "nervous" : "shock", tilt: 3 }));
    puff(DX + 0.1, 0.3, DZ + 0.05, KEY.TAIL_OUT);
    if (f >= KEY.TAIL_OUT) tailGround(lerp(0.04, 0.3, clamp01((f - KEY.TAIL_OUT) / 55)), 0);
  } else if (id === 4) {
    add(DARTO, DX, 0, DZ, idle(1, { mode: "sit", expr: f < 333 ? "shock" : f < 374 ? "nervous" : "shock", look: f >= 333 ? 1 : 0, tilt: 3 }));
    tailGround(lerp(0.3, 1, smooth((f - 270) / 60)), 0);
  } else if (id === 5) {
    add(DARTO, DX, 0, DZ, idle(1, { expr: "pained", tilt: -9 + 3 * Math.sin(t * 7), headTilt: -5, look: 1 }));
    tailGround(1, clamp01((f - 425) / 30));
    creak(DX + 0.28, 0.85, DZ + 0.1);
  } else if (id === 6) {
    add(DARTO, DX, 0, DZ, idle(1, { expr: "nervous", look: 1, tilt: 2, tailLen: lerp(0, 0.75, smooth((f - 512) / 60)), tailSway: 0 }));
    tailGround(1, 0);
    if (f >= 548 && f < 580) { const b = q(clamp01((f - 548) / 32), 20); fxAt(`fx|burst6|${b}`, 500, 500, (p) => fxBurst(p, b, "#ffd43b", 10, 34, 210), DX + 0.3, 1.9, DZ, 0.7, 0.7); }
  } else if (id === 7) {
    if (f < 616) {
      add(DARTO, DX, 0, DZ, idle(1, { expr: "shock", tilt: 3, ...tail(1, 0.75) }));
      tailGround(1, 0);
    } else {
      const monkey = f >= KEY.MONKEY_FACE, wig = q((t * 4) % 6.2832, 8), rip = q((t * 0.9) % 1, 12);
      const o = monkey ? DARTO_MONKEY_OUTFIT : DARTO_OUTFIT, ex: FrontOpts["expr"] = monkey ? "shock" : "nervous";
      fxAt(`fx|refl|${monkey}|${wig}|${rip}`, 512, 512, (p) => fxReflect(p, o, ex, wig, rip), DX, 0.012, -2.3, 1.7, 1.7, { flat: true, soft: true });
    }
  } else if (id === 8) {
    add(DARTOM, DX, hopY(t, KEY.AAAH / FPS, 0.4, 0.1), DZ, idle(1, { expr: "shock", tilt: liveTilt(t, 3, 5), ...tail(1) }));
    const b = q(clamp01((f - KEY.AAAH) / 30), 20);
    fxAt(`fx|burst8|${b}`, 500, 500, (p) => fxBurst(p, b, "#ffd43b", 12, 36, 235), DX, 1.5, DZ - 0.1, 1.0, 1.0);
  } else if (id === 9) {
    add(DARTOM, -0.65, Math.max(hopY(t, 838 / FPS, 0.36, 0.12), hopY(t, 872 / FPS, 0.36, 0.12)), DZ,
      idle(1, { expr: f < 860 ? "stern" : "pained", tilt: 5 * Math.sin(t * 6), wave: q(Math.sin(t * 9), 10), ...tail(1) }));
    [0.75, 1.2, 1.65].forEach((x, k) => add(M[k], x, 0.27, -1.05, idle(5 + k, { mode: "sit", expr: k === 1 ? "smile" : "neutral", look: f >= 878 ? -1 : 0, ...tail(5 + k) }), 0.74));
  } else if (id === 11) {
    const walking = f >= KEY.HERD_WALK;
    const dx = -0.5 + 1.6 * Math.max(0, f - KEY.HERD_WALK) / FPS;
    if (walking) walk(DARTOM, dx, DZ, "grin", 0.84, { tailLen: 1, tailSway: q(Math.sin(t * 5), 10) });
    else {
      const idea = f >= 1234 && f < 1295;
      add(DARTOM, -0.5, 0, DZ, idle(1, { expr: f < 1234 ? "neutral" : f < 1295 ? "smile" : "grin", prop: idea ? "point_up" : null,
        wave: f >= 1319 ? q(Math.sin(t * 8), 10) : undefined, tilt: f >= 1295 ? 3 : -2, ...tail(1) }));
      if (idea) fxAt("fx|bulb", 300, 300, fxBulb, -0.5, 2.05 + Math.sin(t * 6) * 0.02, DZ, 0.5, 0.5);
    }
    [0.75, 1.2, 1.65].forEach((x, k) => {
      if (walking) walk(M[k], x + 1.6 * Math.max(0, f - KEY.HERD_WALK - 6 * k) / FPS, -1.05, "smile", 0.74, { tailLen: 1, tailSway: q(Math.sin(t * 5 + k), 10) });
      else add(M[k], x, 0.27, -1.05, idle(5 + k, { mode: "sit", expr: "neutral", look: f >= 1319 ? -1 : 0, ...tail(5 + k) }), 0.74);
    });
  }

  // =========================================================== KEBUN ===========================================================
  else if (id === 10) {
    const u = smooth((f - 1038) / 150);
    add(DARTO, 0.05, 0, lerp(-3.0, -0.8, u), idle(1, { mode: "stroll", phase: q(t * 1.5, 20), expr: f < 1126 ? "smile" : "grin", prop: "corn", look: Math.sin(t * 1.3) > 0 ? 1 : -1 }));
  } else if (id === 12) {
    const tg = [0.0, -0.8, 0.8, 1.3], who = [DARTOM, M[0], M[1], M[2]], zz = [-0.95, -1.0, -1.0, -0.9], sc = [0.84, 0.74, 0.74, 0.74];
    who.forEach((w, k) => {
      if (f < KEY.PULL) walk(w, tg[k] - (1.6 * (KEY.PULL - f)) / FPS - k * 0.15, zz[k], "grin", sc[k], { tailLen: 1, tailSway: q(Math.sin(t * 5 + k), 10) });
      else {
        const cheer = f >= KEY.RUINED - 10;
        add(w, tg[k], 0.09 * Math.abs(Math.sin(t * 5 + k * 1.3)), zz[k], idle(w.i, { expr: cheer ? "relief_open" : "grin", tilt: cheer ? 0 : 11 * Math.sin(t * 9 + k), wave: q(Math.sin(t * 10 + k), 10), ...tail(w.i) }), sc[k]);
      }
    });
    for (let j = 0; j < 7; j++) {
      const s0 = KEY.PULL + j * 13, p = (f - s0) / 32;
      if (p < 0 || p > 1) continue;
      const x0 = tg[j % 4], dir = j % 2 ? 1 : -1, spin = q(p * 6 * dir, 10);
      fxAt(`fx|cob|${spin}`, 160, 160, (pp) => fxCob(pp, spin * 20), x0 + dir * (0.2 + 0.9 * p), 0.9 + 1.5 * p - 2.3 * p * p + 0.4, -1.1, 0.26, 0.26);
    }
  } else if (id >= 13 && id <= 14) {
    const human = f >= KEY.TURN_HUMAN;
    const lines = [-0.6, 0.0, 0.6];
    const laugh = f >= KEY.HEHEHE;
    add(DARTOM, 0.85, 1.52, -1.2, idle(1, { mode: "sit", expr: laugh ? "laugh" : "smile", tilt: laugh ? 3.5 * Math.sin(t * 17) : 0, ...tail(1) }), 0.8);
    if (!human) {
      const shake = f >= 1770 ? 7 * Math.sin(f * 2.4) : 0;
      lines.forEach((x, k) => add(M[k], x, 0.09 * Math.abs(Math.sin(t * 5 + k * 1.3)), -0.9, idle(5 + k, { expr: "relief_open", tilt: 8 * Math.sin(t * 8 + k) + shake, wave: q(Math.sin(t * 10 + k), 10), ...tail(5 + k) }), 0.74));
    } else {
      add(WA, -0.55, 0, -0.9, idle(9, { expr: "shock" })); add(GUGUN, -0.05, 0, -0.9, idle(8, { expr: "shock" })); add(WB, 0.45, 0, -0.9, idle(10, { expr: "shock" }));
    }
    if (id === 14) for (const x of [-0.55, -0.05, 0.45]) puff(x, 0.9, -0.8, KEY.TURN_HUMAN, 0.9);
  } else if (id === 15) {
    const late = f >= 1879;
    add(WA, -0.55, hopY(t, 1909 / FPS, 0.4, 0.1), -0.9, idle(9, { expr: late ? "stern" : "shock", tilt: late ? 0 : 4 * Math.sin(t * 7) }));
    add(GUGUN, -0.05, hopY(t, 1909 / FPS, 0.4, 0.12), -0.9, idle(8, { expr: late ? "stern" : "shock", prop: f >= 1895 ? "point_up" : null, wave: late ? undefined : q(Math.sin(t * 9), 10) }));
    add(WB, 0.45, hopY(t, 1912 / FPS, 0.4, 0.1), -0.9, idle(10, { expr: late ? "stern" : "shock", wave: late ? undefined : q(Math.cos(t * 9), 10) }));
    if (late) creak(-0.05, 1.7, -0.9, 0.5);
  } else if (id === 16) {
    const turned = f >= KEY.TURN_HEADS, seen = f >= 2095;
    const fo: FrontOpts = turned ? { facing: 1, look: 1 } : {};
    add(WA, -0.55, 0, -0.9, idle(9, { expr: "stern", ...fo })); add(GUGUN, -0.05, 0, -0.9, idle(8, { expr: turned ? "shock" : "stern", ...fo })); add(WB, 0.45, 0, -0.9, idle(10, { expr: turned ? "shock" : "stern", ...fo }));
    add(DARTOM, 0.85, 1.52, -1.2, idle(1, { mode: "sit", expr: seen ? "shock" : "laugh", tilt: seen ? 0 : 3.5 * Math.sin(t * 17), ...tail(1) }), 0.8);
  } else if (id === 17) {
    const x0 = [-0.55, -0.05, 0.45], men = [WA, GUGUN, WB];
    if (f < KEY.ITU_DIA + 16) {
      add(WA, x0[0], 0, -0.9, idle(9, { expr: "stern", facing: 1 })); add(WB, x0[2], 0, -0.9, idle(10, { expr: "shock", facing: 1 }));
      add(GUGUN, x0[1], hopY(t, KEY.ITU_DIA / FPS, 0.4, 0.1), -0.9, idle(8, { expr: "grin", prop: "point_up", facing: 1 }));
      const u = clamp01((f - KEY.ITU_DIA) / 16);
      add(DARTOM, 0.85, 1.52 * (1 - u) ** 2, -1.2, idle(1, { mode: u > 0 ? "fall" : "sit", expr: "shock", ...tail(1) }), 0.8);
    } else if (f < KEY.CAUGHT) {
      men.forEach((m, k) => walk(m, x0[k] + (2.1 * Math.max(0, f - 2121)) / FPS, -0.9, "grin"));
      walk(DARTOM, 0.85 + (2.0 * (f - 2127)) / FPS, -1.0, "shock", 0.8, { tailLen: 1, tailSway: q(Math.sin(t * 8), 10), stomp: 1.3 });
    } else {
      add(GUGUN, 3.1, 0, -0.7, idle(8, { expr: "grin", tilt: 4 })); add(WA, 3.95, 0, -0.75, idle(9, { expr: "grin", tilt: -4 })); add(WB, 3.55, 0, -0.45, idle(10, { expr: "laugh" }));
      add(DARTOM, 3.55, 0, -1.0, idle(1, { mode: "fall", expr: "dazed", ...tail(1, 0.9) }), 0.8);
      puff(3.55, 0.5, -0.7, KEY.CAUGHT, 1.5);
      fxAt("fx|stars17", 420, 210, (p) => fxStars(p, q((t * 0.8) % 1, 20)), 3.55, 1.75, -0.9, 0.7, 0.35);
    }
  }

  // =========================================================== KAMPUNG ===========================================================
  else if (id >= 18) {
    const crowdOn = f >= 2265;
    const inCage = f >= KEY.SLAM;
    // --- Pak Darto
    if (id === 18 && !inCage) {
      const xc = -1.8 + (1.5 * (f - 2235)) / FPS;
      add(DARTOM, xc, 0.5, -0.9, idle(1, { mode: "fall", expr: "pained", ...tail(1, 0.9) }), 0.8);
      walk(WA, xc - 0.55, -0.85, "grin"); walk(WB, xc + 0.55, -0.85, "grin"); walk(GUGUN, xc + 1.3, -0.9, "laugh");
    } else {
      const last = id === 21;
      const chew = f >= KEY.BANANA ? (Math.floor(f / 5) % 2 ? "lick" : "neutral") : "neutral";
      add(DARTOM, 0, 0, -1.15, idle(1, {
        expr: id === 18 ? "dazed" : id === 19 ? (f < 2424 ? "stern" : "nervous") : id === 20 ? "stern" : chew,
        look: last ? (Math.sin(t * 0.7) > 0 ? 1 : -1) : 0, prop: f >= KEY.BANANA ? "banana" : null, ...tail(1, 1),
      }), 0.78);
    }
    // --- heroes
    if (inCage && id <= 20) {
      const joy = id === 19 && f >= KEY.CHEER;
      [[GUGUN, -0.65, 8], [WA, 0.65, 9], [WB, -1.3, 10]].forEach(([w, x, i], k) =>
        add(w as Who, x as number, joy ? 0.1 * Math.abs(Math.sin(t * 5 + k)) : hopY(t, 2268 / FPS + k * 0.05, 0.4, 0.1), id === 18 ? 0.1 : 0.15,
          idle(i as number, { expr: joy ? (k % 2 ? "laugh" : "grin") : "grin", wave: joy ? q(Math.sin(t * 8 + k), 10) : undefined })));
    } else if (inCage && id === 21) {
      add(GUGUN, -1.1, 0, -0.5, idle(8, { expr: "smile_closed" })); add(WA, 1.1, 0, -0.5, idle(9, { expr: "smile_closed" }));
    }
    // --- crowd
    if (crowdOn) {
      const pos: [number, number][] = [[-1.25, -1.0], [1.25, -1.0], [-1.0, -2.0], [0.95, -2.0], [-0.45, -2.5], [0.5, -2.6], [-1.6, -2.3], [1.65, -2.2], [-0.1, -3.0]];
      const cheer = id === 19 && f >= KEY.CHEER || id === 20;
      pos.forEach(([x, z], k) => {
        const hop = cheer ? 0.09 * Math.abs(Math.sin(t * 5.5 + k * 1.7)) : 0;
        const ex: FrontOpts["expr"] = id === 21 ? "smile" : cheer ? (k % 2 ? "laugh" : "grin") : "neutral";
        add(CROWD[k], x, hop, z, idle(20 + k, { expr: ex, wave: cheer ? q(Math.sin(t * 8 + k), 10) : undefined, facing: x > 0 ? -1 : 1 }), 0.8);
      });
    }
    // --- kids throw bananas in the last shot
    if (id === 21) {
      const th = [2735, 2762, 2786];
      add(KIDS[0], -1.15, 0, 0.35, idle(40, { expr: "grin", wave: f > 2730 && f < 2800 ? q(Math.sin(t * 11), 10) : undefined, facing: 1 }), 0.8);
      add(KIDS[1], 1.1, 0, 0.4, idle(41, { expr: "laugh", wave: f > 2755 && f < 2810 ? q(Math.cos(t * 11), 10) : undefined, facing: -1 }), 0.8);
      th.forEach((f0, k) => {
        const p = (f - f0) / 24, sx = k % 2 ? 1.1 : -1.15;
        if (p < 0) return;
        if (p <= 1) fxAt("fx|banana", 160, 160, fxBanana, lerp(sx, 0.05 * (k - 1), p), lerp(1.0, 1.1, p) + 0.9 * Math.sin(Math.PI * p), lerp(0.4, -0.95, p), 0.24, 0.24);
        else fxAt("fx|banana", 160, 160, fxBanana, -0.28 + k * 0.28, 0.13, -0.85 - 0.12 * k, 0.22, 0.22);
      });
    }
    if (id === 19 || id === 20) confetti();
  }
  return out;
};
