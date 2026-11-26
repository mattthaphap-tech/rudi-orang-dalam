export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL_FRAMES = 2655; // 88.5s (SRT ends 87.68s + 0.82s deadpan hold)

export type TimeOfDay = 'day' | 'panic' | 'night' | 'morning';

export type CameraBeat = {
  frame: number;
  pos: [number, number, number];
  lookAt: [number, number, number];
  fov?: number;
  roll?: number; // radians, for Dutch angle
  ease?: 'linear' | 'smooth' | 'snap' | 'punch';
  kick?: number; // subtle camera punch impulse (0..1)
  flash?: number; // white flash intensity (0..1)
};

export type ShotDef = {
  id: string;
  start: number;
  end: number;
  mood: TimeOfDay;
  dofFocus: number;
  dofAperture: number;
  label: string;
};

export const SHOTS: ShotDef[] = [
  { id: 'S01', start: 0,    end: 156,  mood: 'day',     dofFocus: 7.5, dofAperture: 0.015, label: 'Rudi pengangguran di teras' },
  { id: 'S02', start: 156,  end: 306,  mood: 'day',     dofFocus: 5.0, dofAperture: 0.022, label: 'Ngaku punya orang dalam' },
  { id: 'S03', start: 306,  end: 435,  mood: 'day',     dofFocus: 4.8, dofAperture: 0.024, label: 'Tetangga percaya & anak minta tolong' },
  { id: 'S04', start: 435,  end: 624,  mood: 'day',     dofFocus: 3.6, dofAperture: 0.028, label: 'Sok tenang & terima Rp5 juta' },
  { id: 'S05', start: 624,  end: 696,  mood: 'day',     dofFocus: 4.2, dofAperture: 0.020, label: 'Rebahan nggak ngapa-ngapain' },
  { id: 'S06', start: 696,  end: 789,  mood: 'day',     dofFocus: 4.0, dofAperture: 0.024, label: 'Anak lolos karena pintar' },
  { id: 'S07', start: 789,  end: 912,  mood: 'day',     dofFocus: 6.0, dofAperture: 0.018, label: 'Satu kampung heboh' },
  { id: 'S08', start: 912,  end: 1140, mood: 'day',     dofFocus: 9.0, dofAperture: 0.014, label: '40 orang antre & bayar Rp5 juta' },
  { id: 'S09', start: 1140, end: 1314, mood: 'panic',   dofFocus: 3.2, dofAperture: 0.032, label: 'Rudi pucat di balik amplop' },
  { id: 'S10', start: 1314, end: 1518, mood: 'night',   dofFocus: 8.5, dofAperture: 0.020, label: 'Mobil berhenti & Bapak Atasan turun' },
  { id: 'S11', start: 1518, end: 1656, mood: 'night',   dofFocus: 4.4, dofAperture: 0.028, label: 'Atasan minta bantu naik ke pusat' },
  { id: 'S12', start: 1656, end: 1788, mood: 'night',   dofFocus: 2.5, dofAperture: 0.036, label: 'Rudi diam, keringat jatuh' },
  { id: 'S13', start: 1788, end: 1983, mood: 'night',   dofFocus: 3.0, dofAperture: 0.030, label: 'Syarat 40 titipan lolos semua' },
  { id: 'S14', start: 1983, end: 2067, mood: 'night',   dofFocus: 3.4, dofAperture: 0.030, label: 'Atasan mikir: Gampang' },
  { id: 'S15', start: 2067, end: 2286, mood: 'morning', dofFocus: 6.5, dofAperture: 0.018, label: 'Pengumuman 40 lolos & promosi pusat' },
  { id: 'S16', start: 2286, end: 2655, mood: 'morning', dofFocus: 3.6, dofAperture: 0.028, label: 'Salaman, bisik, Rudi bengong' },
];

// 44 camera beats across 16 shots (multi-angle, punch-ins, crane, dutch, OTS, ECU)
export const CAMERA_BEATS: CameraBeat[] = [
  // S01: Wide kampung -> dolly in ke Rudi santai
  { frame: 0,    pos: [0.5, 4.2, 13.5],  lookAt: [0, 1.5, 0],     fov: 46, ease: 'smooth' },
  { frame: 65,   pos: [0.2, 2.3, 7.6],   lookAt: [0, 1.35, 0.2],  fov: 42, ease: 'smooth' },
  { frame: 145,  pos: [-0.2, 1.9, 5.2],  lookAt: [0, 1.35, 0.3],  fov: 38, ease: 'smooth' },

  // S02: Two-shot Rudi & Tetangga -> punch-in "Saya punya orang dalam"
  { frame: 156,  pos: [-2.4, 2.0, 5.6],  lookAt: [0.6, 1.4, 0.8], fov: 40, ease: 'snap' },
  { frame: 225,  pos: [-1.4, 1.85, 4.6], lookAt: [0.2, 1.45, 0.6], fov: 38, ease: 'smooth' },
  { frame: 256,  pos: [-0.3, 1.85, 3.6], lookAt: [-0.2, 1.65, 0.4], fov: 34, ease: 'punch', kick: 0.75 },
  { frame: 298,  pos: [-0.2, 1.85, 3.5], lookAt: [-0.2, 1.65, 0.4], fov: 33, ease: 'linear' },

  // S03: Tetangga kagum -> anak maju bawa map
  { frame: 306,  pos: [1.8, 1.85, 4.1],  lookAt: [1.4, 1.4, 1.0], fov: 36, ease: 'snap' },
  { frame: 358,  pos: [2.4, 1.75, 4.8],  lookAt: [1.9, 1.35, 1.6], fov: 38, ease: 'smooth' },
  { frame: 428,  pos: [1.6, 1.7, 4.2],   lookAt: [1.1, 1.35, 1.3], fov: 36, ease: 'smooth' },

  // S04: Rudi sok tenang -> close-up amplop Rp5 juta + white flash
  { frame: 435,  pos: [-1.1, 1.8, 3.8],  lookAt: [-0.1, 1.45, 0.5], fov: 36, ease: 'snap' },
  { frame: 525,  pos: [-0.6, 1.75, 5.2], lookAt: [0.5, 1.4, 0.8],  fov: 40, ease: 'smooth' },
  { frame: 548,  pos: [0.1, 1.45, 3.0],  lookAt: [-0.15, 1.15, 0.45], fov: 32, ease: 'punch', kick: 0.85, flash: 0.7 },
  { frame: 615,  pos: [0.35, 1.5, 2.8],  lookAt: [0.45, 1.25, 0.9], fov: 30, ease: 'linear' },

  // S05: Hard cut komedik Rudi rebahan main HP
  { frame: 624,  pos: [-2.6, 1.9, 3.9],  lookAt: [-0.4, 1.1, 0.1],  fov: 38, ease: 'snap' },
  { frame: 690,  pos: [-2.3, 1.85, 3.6], lookAt: [-0.4, 1.1, 0.1],  fov: 37, ease: 'linear' },

  // S06: Anak tetangga lihat hasil LOLOS
  { frame: 696,  pos: [5.4, 1.85, 4.6],  lookAt: [5.0, 1.5, 1.8],   fov: 36, ease: 'snap' },
  { frame: 735,  pos: [5.1, 1.8, 4.6],   lookAt: [5.0, 1.35, 1.8],  fov: 36, ease: 'punch', kick: 0.65, flash: 0.45 },
  { frame: 785,  pos: [5.0, 1.8, 4.4],   lookAt: [5.0, 1.35, 1.8],  fov: 35, ease: 'linear' },

  // S07: Satu kampung heboh (pan cepat)
  { frame: 789,  pos: [-4.2, 2.4, 7.8],  lookAt: [-2.0, 1.4, 3.4],  fov: 44, ease: 'snap' },
  { frame: 845,  pos: [0.2, 2.3, 7.2],   lookAt: [0.5, 1.4, 3.4],   fov: 42, ease: 'smooth', kick: 0.4 },
  { frame: 905,  pos: [3.8, 2.2, 7.0],   lookAt: [2.2, 1.4, 3.4],   fov: 40, ease: 'smooth' },

  // S08: Crane wide 40 warga antre -> zoom ke tumpukan amplop
  { frame: 912,  pos: [5.8, 6.2, 13.5],  lookAt: [0.0, 1.2, 4.2],   fov: 48, ease: 'snap' },
  { frame: 1015, pos: [2.4, 3.4, 9.6],   lookAt: [0.0, 1.25, 2.4],  fov: 44, ease: 'smooth' },
  { frame: 1035, pos: [1.1, 1.9, 3.5],   lookAt: [0.4, 1.1, 1.0],   fov: 34, ease: 'punch', kick: 0.55 },
  { frame: 1134, pos: [0.8, 1.8, 3.0],   lookAt: [0.4, 1.15, 1.0],  fov: 32, ease: 'linear' },

  // S09: Dutch angle pelan ke Rudi pucat di balik amplop
  { frame: 1140, pos: [-0.5, 1.75, 3.4], lookAt: [-0.2, 1.45, 0.3], fov: 34, roll: 0.08, ease: 'snap', kick: 0.6 },
  { frame: 1220, pos: [-0.3, 1.65, 2.7], lookAt: [-0.2, 1.45, 0.3], fov: 30, roll: -0.11, ease: 'smooth' },
  { frame: 1308, pos: [-0.2, 1.65, 2.6], lookAt: [-0.2, 1.6, 0.3],  fov: 30, roll: -0.14, ease: 'linear' },

  // S10: Malam, mobil sedan berhenti & Bapak Atasan turun (low-angle)
  { frame: 1314, pos: [-5.5, 1.8, 10.2], lookAt: [1.5, 1.1, 5.2],   fov: 44, roll: 0, ease: 'snap' },
  { frame: 1405, pos: [-2.2, 1.3, 8.8],  lookAt: [1.2, 1.2, 5.0],   fov: 40, ease: 'smooth' },
  { frame: 1425, pos: [0.2, 1.5, 2.2],   lookAt: [1.2, 1.4, 4.5],   fov: 38, ease: 'punch', kick: 0.5 },
  { frame: 1512, pos: [2.1, 1.25, 6.4],  lookAt: [1.1, 1.55, 4.4],  fov: 35, ease: 'smooth' },

  // S11: OTS dari Rudi ke Atasan yang minta tolong
  { frame: 1518, pos: [-1.2, 1.85, 1.8], lookAt: [0.9, 1.55, 2.6],  fov: 36, ease: 'snap' },
  { frame: 1610, pos: [-0.9, 1.8, 2.0],  lookAt: [0.9, 1.55, 2.5],  fov: 33, ease: 'smooth' },

  // S12: ECU Rudi diam, keringat jatuh lambat
  { frame: 1656, pos: [0.3, 1.7, 2.6],   lookAt: [-0.2, 1.6, 0.4],  fov: 28, ease: 'snap' },
  { frame: 1775, pos: [0.15, 1.68, 2.5],  lookAt: [-0.2, 1.6, 0.4],  fov: 28, ease: 'linear' },

  // S13: Slow push-in dramatis syarat 40 orang lolos semua
  { frame: 1788, pos: [0.8, 1.72, 3.1],  lookAt: [-0.2, 1.5, 0.4],  fov: 32, ease: 'snap' },
  { frame: 1882, pos: [0.35, 1.7, 2.7],  lookAt: [-0.2, 1.55, 0.4], fov: 30, ease: 'smooth', kick: 0.45 },
  { frame: 1975, pos: [0.15, 1.68, 2.6],  lookAt: [-0.2, 1.55, 0.4], fov: 30, ease: 'linear' },

  // S14: Close-up Atasan mikir -> "Gampang."
  { frame: 1983, pos: [-0.4, 1.75, 4.3], lookAt: [0.95, 1.6, 2.5],  fov: 32, ease: 'snap' },
  { frame: 2044, pos: [-0.4, 1.8, 5.4],   lookAt: [0.95, 1.7, 2.5],  fov: 30, ease: 'punch', kick: 0.3, flash: 0.55 },

  // S15: Papan pengumuman 40 LOLOS -> siluet gedung pusat
  { frame: 2067, pos: [6.4, 2.2, 6.2],   lookAt: [6.4, 1.75, 1.5],  fov: 40, ease: 'snap', flash: 0.4 },
  { frame: 2146, pos: [6.4, 2.0, 4.4],   lookAt: [6.4, 1.75, 1.5],  fov: 34, ease: 'punch', kick: 0.6 },
  { frame: 2224, pos: [11.0, 2.4, 8.8],  lookAt: [12.0, 4.2, -4.0], fov: 42, ease: 'smooth' },

  // S16: Salaman + bisikan -> mobil pergi -> hold Rudi bengong deadpan
  { frame: 2286, pos: [-1.4, 1.85, 5.2], lookAt: [0.4, 1.45, 2.4],  fov: 36, ease: 'snap' },
  { frame: 2394, pos: [0.8, 1.8, 5.2],   lookAt: [0.4, 1.5, 2.2],   fov: 36, ease: 'smooth' },
  { frame: 2484, pos: [-0.2, 1.75, 4.8],  lookAt: [-0.2, 1.5, 1.85], fov: 34, ease: 'snap', kick: 0.35 },
  { frame: 2560, pos: [-0.2, 1.72, 5.0],  lookAt: [-0.2, 1.55, 1.85], fov: 33, ease: 'smooth' },
  { frame: 2655, pos: [-0.2, 1.7, 4.9],   lookAt: [-0.2, 1.55, 1.85], fov: 33, ease: 'linear' },
];

export function getShotAtFrame(frame: number): ShotDef {
  return SHOTS.find((s) => frame >= s.start && frame < s.end) ?? SHOTS[SHOTS.length - 1];
}

function easeVal(t: number, mode: CameraBeat['ease'] = 'smooth'): number {
  const c = Math.max(0, Math.min(1, t));
  if (mode === 'linear') return c;
  if (mode === 'snap') return c < 0.001 ? 0 : 1;
  if (mode === 'punch') return 1 - Math.pow(1 - c, 4);
  return c * c * (3 - 2 * c);
}

export function sampleCamera(frame: number) {
  let i = 0;
  while (i < CAMERA_BEATS.length - 1 && CAMERA_BEATS[i + 1].frame <= frame) i++;
  const a = CAMERA_BEATS[i];
  const b = CAMERA_BEATS[Math.min(i + 1, CAMERA_BEATS.length - 1)];

  const span = Math.max(1, b.frame - a.frame);
  const rawT = a === b ? 0 : (frame - a.frame) / span;
  const t = b.ease === 'snap' ? 0 : easeVal(rawT, b.ease ?? 'smooth');

  const lerp = (u: number, v: number) => u + (v - u) * t;
  const pos: [number, number, number] = [
    lerp(a.pos[0], b.pos[0]),
    lerp(a.pos[1], b.pos[1]),
    lerp(a.pos[2], b.pos[2]),
  ];
  const lookAt: [number, number, number] = [
    lerp(a.lookAt[0], b.lookAt[0]),
    lerp(a.lookAt[1], b.lookAt[1]),
    lerp(a.lookAt[2], b.lookAt[2]),
  ];
  const fov = lerp(a.fov ?? 38, b.fov ?? 38);
  const roll = lerp(a.roll ?? 0, b.roll ?? 0);

  // Decaying camera kick & white flash on beat entry
  const dt = frame - a.frame;
  const kickDecay = dt >= 0 && dt < 10 ? Math.exp(-dt * 0.45) * (a.kick ?? 0) : 0;
  const kickX = Math.sin(dt * 2.4) * 0.08 * kickDecay;
  const kickY = Math.cos(dt * 3.1) * 0.06 * kickDecay;
  const flash = dt >= 0 && dt < 6 ? (1 - dt / 6) * (a.flash ?? 0) : 0;

  return {
    pos: [pos[0] + kickX, pos[1] + kickY, pos[2]] as [number, number, number],
    lookAt,
    fov: fov - kickDecay * 1.8,
    roll,
    flash,
  };
}
