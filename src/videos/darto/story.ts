// "Pak Darto dan Ekor Monyet" - 21 shots, 2815 frames @ 30 fps (93.8 s), locked to the voice-over word timings
// (voice_darto/words.json, derived from the ElevenLabs SRT + silence detection).
// Camera grammar follows skill/references/reports/motion.md: smootherstep glides, hard cuts on big reframes,
// continuous push-ins (0.2-0.35 %/f, up to 0.8 %/f on punch words), 7-frame sign-flipping kicks on impacts.
import { LightName } from "./lights";

export const FPS = 30;
export const TOTAL = 2815;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export type SetKind = "sungai" | "kebun" | "kampung";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: SetKind; sunAz?: number; sunEl?: number };

// a/b = first frame / first frame of the next shot. Comment = what the voice says.
export const SHOTS: ShotDef[] = [
  { id: 1,  a: 0,    b: 77,   light: "day",    set: "sungai",  sunAz: 62, sunEl: 44 }, // 0.1-1.8 s   "Pak Darto sakit perut parah."
  { id: 2,  a: 77,   b: 175,  light: "day",    set: "sungai",  sunAz: 60, sunEl: 44 }, // 2.6-5.8     "Ia lari ke sungai di pinggir hutan lalu jongkok."
  { id: 3,  a: 175,  b: 270,  light: "day",    set: "sungai",  sunAz: 66, sunEl: 42 }, // 5.8-9.0     "Tiba-tiba ada yang keluar dari belakangnya."
  { id: 4,  a: 270,  b: 425,  light: "day",    set: "sungai",  sunAz: 64, sunEl: 42 }, // 9.0-14.1    "Panjang dan tidak putus-putus. Loh, kok enggak putus-putus ya?"
  { id: 5,  a: 425,  b: 512,  light: "day",    set: "sungai",  sunAz: 58, sunEl: 44 }, // 14.2-17.0   "Ia menarik pelan-pelan."
  { id: 6,  a: 512,  b: 581,  light: "day",    set: "sungai",  sunAz: 62, sunEl: 43 }, // 17.1-19.4   "Ternyata itu bukan kotoran."
  { id: 7,  a: 581,  b: 767,  light: "day",    set: "sungai",  sunAz: 60, sunEl: 46 }, // 19.4-25.6   "Itu ekor. Ia menengok ke air sungai. Wajahnya sudah wajah monyet."
  { id: 8,  a: 767,  b: 815,  light: "day",    set: "sungai",  sunAz: 60, sunEl: 44 }, // 25.6-27.2   "Aaaah!"
  { id: 9,  a: 815,  b: 1038, light: "day",    set: "sungai",  sunAz: 64, sunEl: 44 }, // 27.2-34.6   "Ia frustrasi ... tiga monyet duduk santai ... menatapnya."
  { id: 10, a: 1038, b: 1219, light: "golden", set: "kebun",   sunAz: 40, sunEl: 20 }, // 34.6-40.6   flashback: "kemarin ia mencuri jagung milik Pak Gugun, petani kampung."
  { id: 11, a: 1219, b: 1387, light: "day",    set: "sungai",  sunAz: 58, sunEl: 44 }, // 40.6-46.2   "Ia berpikir, kalau sudah jadi monyet, sekalian saja. Ia mengajak tiga monyet itu"
  { id: 12, a: 1387, b: 1586, light: "day",    set: "kebun",   sunAz: 62, sunEl: 46 }, // 46.2-52.9   "ke kebun Pak Gugun. Jagung dicabut, batang diinjak, kebun hancur."
  { id: 13, a: 1586, b: 1692, light: "day",    set: "kebun",   sunAz: 66, sunEl: 44 }, // 52.9-56.4   "Pak Darto duduk di pohon sebelah. Hehehe, rasain!"
  { id: 14, a: 1692, b: 1830, light: "day",    set: "kebun",   sunAz: 60, sunEl: 46 }, // 56.4-61.0   "Tiba-tiba tiga monyet itu berubah jadi manusia."
  { id: 15, a: 1830, b: 1930, light: "day",    set: "kebun",   sunAz: 62, sunEl: 45 }, // 61.0-64.3   "Loh, kebun kita rusak! Pasti ulah monyet liar!"
  { id: 16, a: 1930, b: 2111, light: "day",    set: "kebun",   sunAz: 64, sunEl: 44 }, // 64.3-70.4   "Mereka menoleh dan melihat satu monyet di atas pohon sedang ketawa puas."
  { id: 17, a: 2111, b: 2235, light: "day",    set: "kebun",   sunAz: 60, sunEl: 44 }, // 70.4-74.5   "Itu dia! Pak Darto dikejar, ditangkap, lalu dibawa ke kampung"
  { id: 18, a: 2235, b: 2305, light: "golden", set: "kampung", sunAz: 50, sunEl: 26 }, // 74.5-76.8   "... untuk dikurung."
  { id: 19, a: 2305, b: 2504, light: "golden", set: "kampung", sunAz: 54, sunEl: 28 }, // 76.8-83.5   "Sekampung bersorak. Tiga orang itu dianggap pahlawan ..."
  { id: 20, a: 2504, b: 2615, light: "golden", set: "kampung", sunAz: 48, sunEl: 24 }, // 83.5-87.2   "Warga membuat perayaan besar untuk berterima kasih."
  { id: 21, a: 2615, b: TOTAL, light: "golden", set: "kampung", sunAz: 56, sunEl: 22 }, // 87.2-93.8   "Di dalam kurungan, Pak Darto cuma bisa menatap ... pisang ..."
];

export const XFADE: Record<number, number> = { 10: 8, 11: 8, 12: 6, 18: 8 };
/** 4-frame white flashes: monkey-face reveal in the water, and the monkeys turning human */
export const FLASH_ATS = [737, 1784];

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) {
      return [
        { id: s.id - 1, alpha: 1 },
        { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) },
      ];
    }
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

export type WorldState = { id: number; f: number; t: number; u: number; set: SetKind };
export const worldState = (id: number, f: number): WorldState => {
  const s = SHOTS[id - 1];
  return { id, f, t: f / FPS, u: clamp01((f - s.a) / Math.max(1, s.b - s.a)), set: s.set };
};

// ---- key frames shared by story / cast / world / audio ----
export const KEY = {
  TAIL_OUT: 215,      // "keluar"
  EKOR: 581,          // "ekor."
  MONKEY_FACE: 737,   // reflection turns monkey
  AAAH: 767,
  HERD_WALK: 1340,    // "mengajak": the four walk to the field
  PULL: 1442,         // "dicabut"
  STOMP: 1485,        // "diinjak"
  RUINED: 1539,       // "hancur"
  TREE: 1586,         // "duduk di pohon"
  HEHEHE: 1645,
  TURN_HUMAN: 1784,   // "berubah jadi manusia"
  TURN_HEADS: 1957,   // "menoleh"
  ITU_DIA: 2111,
  CAUGHT: 2166,
  SLAM: 2265,         // "dikurung"
  CHEER: 2305,        // "Sekampung bersorak"
  BANANA: 2750,       // "makan pisang"
};

// ---------------- camera engine ----------------
export type CamPose = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<CamPose> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };

const mix = (a: CamPose, b: CamPose, k: number): CamPose => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3,
  look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k,
  roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): CamPose => ({ fov: 38, roll: 0, ...c });
const run = (keys: Key[], f: number): CamPose => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 22)));
  }
  return cur;
};
const T = (f: number) => f / FPS;

/** push-in factor since f0 (subject grows ~rate per frame); `punch` raises it for the first n frames */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 28) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 7, (n - i - 0.5) / 7));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<CamPose> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** compact keyframe: camera at pos looking at look, creeping in from frame f0 */
const C = (f0: number, pos: V3, look: V3, fov = 36, roll = 0, rate = 0.0028, punch = 0, n = 22) =>
  (f: number): Shot => dolly(pos, look, pushK(f, f0, rate, punch, n), { fov, roll });

// Anchors (see build.ts):  Darto on the river bank (0.15, -0.95); trio on the log x 0.8..1.7; kebun trio z -0.9; tree seat (0.85, 1.52, -1.2)
const CAMS: Record<number, Key[]> = {
  // ---- 1 hook: low Dutch MCU on the clutching man, then pull out to the whole bank
  1: [
    { f: 0, s: C(0, [0.55, 1.05, 3.1], [0.15, 1.25, -0.95], 35, -0.06, 0.0032, 0.0065, 16) },
    { f: 30, dur: 26, s: C(30, [0.0, 1.7, 6.0], [0.1, 1.25, -1.2], 39, 0.015, 0.0022) },
  ],
  // ---- 2 run in from the left, squat at the river
  2: [
    { f: 77, s: C(77, [-3.0, 1.15, 3.7], [-3.0, 1.15, -0.9], 36, 0.03, 0.001) },
    { f: 84, dur: 46, s: C(84, [0.1, 1.3, 3.8], [0.1, 1.15, -0.95], 36, -0.03, 0.001) },
    { f: 132, dur: 22, s: C(132, [0.55, 0.95, 2.7], [0.15, 1.0, -0.95], 33, -0.05, 0.003, 0.007, 24) },
  ],
  // ---- 3 something comes out behind him
  3: [
    { f: 175, s: C(175, [0.75, 0.9, 3.0], [0.15, 0.95, -0.95], 34, 0.04, 0.003, 0.007, 24) },
    { f: 215, cut: true, s: C(215, [0.95, 0.62, 2.0], [0.3, 0.62, -0.95], 31, -0.06, 0.0032, 0.0075, 24) },
    { f: 243, dur: 22, s: C(243, [0.2, 1.3, 2.5], [0.15, 1.22, -0.95], 31, 0.03, 0.003) },
  ],
  // ---- 4 long, never-ending: high crane on the tail, then reaction CUs
  4: [
    { f: 270, s: C(270, [1.4, 3.3, 3.4], [0.7, 0.1, -0.9], 40, -0.03, 0.0022) },
    { f: 333, cut: true, s: C(333, [0.15, 1.38, 2.8], [0.15, 1.26, -0.95], 33, 0.04, 0.0032, 0.007, 22) },
    { f: 385, dur: 18, s: C(385, [-0.3, 1.1, 2.4], [0.15, 1.1, -0.95], 32, -0.06, 0.0034, 0.0075, 22) },
  ],
  // ---- 5 pulling
  5: [
    { f: 425, s: C(425, [-0.5, 1.2, 3.3], [0.15, 1.2, -0.95], 34, -0.05, 0.0034, 0.007, 26) },
    { f: 470, dur: 20, s: C(470, [1.3, 0.7, 2.6], [0.2, 0.5, -0.9], 36, 0.05, 0.003) },
  ],
  // ---- 6 not what he thought
  6: [
    { f: 512, s: C(512, [0.8, 0.75, 2.0], [0.3, 0.75, -0.95], 30, 0.05, 0.003) },
    { f: 548, dur: 20, s: C(548, [0.3, 1.0, 2.4], [0.15, 0.95, -0.95], 30, -0.04, 0.003, 0.006, 20) },
  ],
  // ---- 7 "Itu ekor." -> POV top-down on the water -> monkey face
  7: [
    { f: 581, s: C(581, [0.15, 1.15, 2.3], [0.15, 1.05, -0.95], 30, 0.04, 0.0035, 0.009, 26) },
    { f: 616, dur: 24, s: C(616, [0.15, 2.3, -0.55], [0.15, 0.0, -2.3], 46, 0, 0.0008) },
    { f: 684, dur: 30, s: C(684, [0.15, 1.5, -1.2], [0.15, 0.0, -2.35], 38, 0.03, 0.0022) },
  ],
  // ---- 8 scream
  8: [{ f: 767, s: C(767, [0.15, 1.38, 2.35], [0.15, 1.34, -0.95], 30, 0.07, 0.0042, 0.009, 30) }],
  // ---- 9 frustration, then discover the three monkeys on the log
  9: [
    { f: 815, s: C(815, [-0.35, 1.3, 3.0], [-0.65, 1.2, -0.9], 34, -0.05, 0.0035, 0.0075, 24) },
    { f: 862, dur: 22, s: C(862, [0.6, 1.7, 5.9], [0.55, 1.25, -1.0], 39, 0.02, 0.0022) },
    { f: 900, cut: true, s: C(900, [1.15, 1.1, 2.8], [1.2, 1.0, -1.0], 33, -0.04, 0.003, 0.007, 22) },
    { f: 972, dur: 20, s: C(972, [0.1, 1.5, 4.4], [0.2, 1.25, -1.0], 37, 0.03, 0.0028) },
  ],
  // ---- 10 flashback in the corn field (golden hour)
  10: [
    { f: 1038, s: C(1038, [-0.6, 1.0, 2.9], [-1.3, 1.05, -0.9], 34, -0.05, 0.0032) },
    { f: 1100, dur: 24, s: C(1100, [0.5, 1.4, 4.4], [0.0, 1.2, -0.8], 37, 0.035, 0.0028) },
    { f: 1150, cut: true, s: C(1150, [-0.9, 1.2, 2.4], [-1.3, 1.1, -0.9], 32, -0.05, 0.003, 0.007, 22) },
    { f: 1186, dur: 18, s: C(1186, [0.2, 1.6, 5.2], [0.0, 1.25, -1.0], 38, 0.0, 0.0026) },
  ],
  // ---- 11 the idea, then the invitation
  11: [
    { f: 1219, s: C(1219, [-0.2, 1.35, 3.2], [-0.5, 1.3, -0.95], 34, 0.04, 0.003) },
    { f: 1273, cut: true, s: C(1273, [-0.4, 1.1, 2.5], [-0.5, 1.2, -0.95], 31, -0.06, 0.0032, 0.007, 22) },
    { f: 1319, dur: 22, s: C(1319, [0.3, 1.7, 5.6], [0.3, 1.3, -1.0], 39, 0.02, 0.0024) },
  ],
  // ---- 12 the rampage
  12: [
    { f: 1387, s: C(1387, [-0.4, 1.7, 5.7], [0.0, 1.25, -1.2], 39, -0.03, 0.0024) },
    { f: 1442, cut: true, s: C(1442, [-0.25, 1.05, 2.4], [-0.2, 1.1, -1.6], 32, -0.05, 0.003, 0.0075, 22) },
    { f: 1485, cut: true, s: C(1485, [0.5, 0.55, 2.3], [0.2, 0.5, -1.2], 34, 0.06, 0.0034, 0.0075, 22) },
    { f: 1526, dur: 18, s: C(1526, [0.4, 3.0, 3.9], [0.0, 0.4, -1.9], 40, -0.03, 0.0026, 0.006, 22) },
  ],
  // ---- 13 up the tree: "Hehehe, rasain!"
  13: [
    { f: 1586, s: C(1586, [0.15, 0.55, 3.0], [0.85, 1.45, -1.2], 36, -0.06, 0.003) },
    { f: 1628, dur: 22, s: C(1628, [0.55, 1.55, 2.9], [0.85, 1.55, -1.2], 31, 0.04, 0.003, 0.007, 22) },
  ],
  // ---- 14 "tiga monyet itu berubah jadi manusia"
  14: [
    { f: 1692, s: C(1692, [-0.3, 1.7, 5.8], [0.2, 1.3, -1.1], 39, -0.03, 0.0024) },
    { f: 1770, dur: 14, s: C(1770, [-0.15, 1.2, 3.5], [-0.1, 1.2, -0.9], 36, 0.05, 0.0035, 0.0085, 24) },
    { f: 1800, dur: 20, s: C(1800, [0.0, 1.5, 4.2], [0.0, 1.3, -0.9], 37, -0.04, 0.0026) },
  ],
  // ---- 15 the owners react
  15: [
    { f: 1830, s: C(1830, [0.1, 1.4, 3.2], [0.0, 1.3, -0.9], 34, 0.04, 0.0033) },
    { f: 1879, cut: true, s: C(1879, [-0.3, 1.3, 2.5], [-0.05, 1.3, -0.9], 31, -0.06, 0.0034, 0.007, 22) },
    { f: 1905, cut: true, s: C(1905, [0.4, 1.2, 2.6], [0.45, 1.25, -0.85], 31, 0.05, 0.0036, 0.0085, 22) },
  ],
  // ---- 16 they turn and see him
  16: [
    { f: 1930, s: C(1930, [-0.8, 1.4, 3.4], [0.0, 1.35, -0.9], 36, 0.03, 0.0028) },
    { f: 1975, dur: 24, s: C(1975, [0.2, 1.2, 4.8], [0.7, 1.5, -1.2], 37, -0.04, 0.0026) },
    { f: 2005, cut: true, s: C(2005, [0.4, 0.6, 3.0], [0.85, 1.6, -1.2], 34, 0.06, 0.003, 0.006, 20) },
  ],
  // ---- 17 chase and catch (camera tracks to the right)
  17: [
    { f: 2111, s: C(2111, [0.1, 1.5, 3.8], [0.3, 1.3, -0.9], 36, -0.04, 0.003, 0.0085, 26) },
    { f: 2127, cut: true, s: C(2127, [1.2, 1.15, 4.3], [1.4, 1.05, -0.9], 36, 0.04, 0.0005) },
    { f: 2130, dur: 38, s: C(2130, [3.3, 1.15, 4.3], [3.5, 1.05, -0.9], 36, 0.04, 0.0005) },
    { f: 2169, cut: true, s: C(2169, [3.5, 1.1, 2.5], [3.5, 0.9, -0.9], 32, -0.06, 0.003, 0.009, 22) },
    { f: 2192, dur: 20, s: C(2192, [3.2, 2.2, 5.0], [3.4, 0.8, -0.9], 38, 0.0, 0.0024) },
  ],
  // ---- 18 carried into the village, door slams
  18: [
    { f: 2235, s: C(2235, [-1.4, 1.25, 4.0], [-1.3, 1.1, -0.9], 36, -0.04, 0.0005) },
    { f: 2238, dur: 24, s: C(2238, [-0.2, 1.25, 4.0], [-0.1, 1.1, -1.0], 36, -0.04, 0.0005) },
    { f: 2265, cut: true, s: C(2265, [0.1, 1.3, 2.7], [0.0, 1.2, -1.1], 33, 0.06, 0.003, 0.009, 24) },
    { f: 2283, dur: 20, s: C(2283, [0.0, 1.6, 5.0], [0.0, 1.3, -1.2], 38, -0.03, 0.0024) },
  ],
  // ---- 19 the village cheers the "heroes"
  19: [
    { f: 2305, s: C(2305, [0.0, 3.4, 6.0], [0.0, 0.9, -0.8], 40, 0.0, 0.002, 0.006, 24) },
    { f: 2347, dur: 24, s: C(2347, [0.0, 1.5, 3.9], [-0.1, 1.2, 0.2], 36, 0.03, 0.003) },
    { f: 2391, cut: true, s: C(2391, [-0.3, 1.3, 2.9], [-0.2, 1.3, 0.2], 32, -0.05, 0.0034, 0.0075, 22) },
    { f: 2424, dur: 20, s: C(2424, [0.9, 1.2, 3.6], [0.0, 1.15, 0.0], 35, 0.04, 0.003) },
    { f: 2456, cut: true, s: C(2456, [0.15, 1.2, 2.4], [0.0, 1.15, -1.1], 31, -0.04, 0.0032, 0.007, 22) },
  ],
  // ---- 20 big celebration
  20: [
    { f: 2504, s: C(2504, [-1.0, 2.4, 6.3], [0.0, 1.0, -1.0], 40, -0.03, 0.0022, 0.005, 24) },
    { f: 2552, dur: 40, s: C(2552, [1.0, 2.0, 5.4], [0.0, 1.1, -1.0], 38, 0.03, 0.0022) },
  ],
  // ---- 21 inside the cage: slow deadpan push-in
  21: [
    { f: 2615, s: C(2615, [0.0, 1.6, 5.0], [0.0, 1.2, -1.2], 38, 0.0, 0.0026, 0.005, 24) },
    { f: 2660, dur: 30, s: C(2660, [0.05, 1.35, 3.3], [0.0, 1.2, -1.15], 33, 0.03, 0.0024) },
    { f: 2720, dur: 40, s: C(2720, [0.0, 1.3, 2.55], [0.0, 1.25, -1.15], 30, 0.0, 0.0022) },
  ],
};

// Impact kicks (seconds, gain): on punch words and hard cuts
const KICKS: [number, number][] = [
  [1.01, 0.9],   // "perut"
  [4.87, 1.0],   // "jongkok"
  [7.16, 1.25],  // "keluar" (cut to macro)
  [11.10, 1.0],  // "Loh, kok ..."
  [14.34, 0.8],  // "menarik"
  [17.1, 0.8],   // "Ternyata"
  [19.66, 1.45], // "ekor."
  [24.65, 1.6],  // flash + "monyet"
  [25.58, 1.7],  // "Aaaah!"
  [30.0, 1.0],   // cut to the monkeys
  [38.53, 1.0],  // "Gugun"
  [42.42, 1.0],  // "monyet,"
  [48.56, 1.25], // "dicabut"
  [49.97, 1.3],  // "diinjak"
  [51.29, 1.5],  // "hancur"
  [55.47, 1.2],  // "rasain!"
  [59.48, 1.6],  // "berubah"
  [62.30, 1.1],  // "rusak!"
  [63.64, 1.2],  // "monyet liar"
  [70.36, 1.5],  // "Itu dia!"
  [72.31, 1.4],  // "ditangkap"
  [75.50, 1.6],  // "dikurung" (door slam)
  [76.82, 1.0],  // "Sekampung"
  [79.71, 0.9],  // "pahlawan"
  [87.16, 0.9],  // "Di dalam kurungan"
  [91.66, 0.8],  // "makan"
];

export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};

export const camAt = (id: number, f: number): CamPose => {
  const c = run(CAMS[id] ?? CAMS[1], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return {
    ...c,
    look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m],
    roll: c.roll + a * 0.004,
  };
};

// shallow depth of field (cInf px @1080) on close-ups / inserts; crisp on wides
const DOF_ON: [number, number][] = [
  [0, 30], [77, 84], [132, 175], [175, 270], [333, 425], [425, 470], [512, 767], [767, 862], [900, 972],
  [1038, 1100], [1150, 1186], [1219, 1319], [1442, 1526], [1586, 1692], [1770, 1800], [1830, 1930], [2005, 2111],
  [2169, 2192], [2265, 2283], [2347, 2424], [2456, 2504], [2660, 2815],
];
export const dofAt = (f: number): { cInf: number; focus?: (frame: number) => V3 } => {
  if (DOF_ON.some(([a, b]) => f >= a && f < b)) return { cInf: 10.8 };
  return { cInf: 4.5, focus: () => [0.0, 1.3, -1.0] };
};
