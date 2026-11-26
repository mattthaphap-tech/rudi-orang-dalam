import fs from 'node:fs';
import path from 'node:path';
import sfxCues from './sfx_cues.json';
import captionChunks from './caption_chunks.json';

const SAMPLE_RATE = 48000;
const FPS = sfxCues.fps;
const TOTAL_FRAMES = sfxCues.totalFrames;
const TOTAL_SAMPLES = Math.ceil((TOTAL_FRAMES / FPS) * SAMPLE_RATE);

// Deterministic PRNG for noise bursts (whoosh, crowd, car engine)
let seed = 1337;
function rand(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff) * 2 - 1;
}

function addSample(buf: Float32Array, idx: number, val: number) {
  if (idx >= 0 && idx < buf.length) buf[idx] += val;
}

function synthTone(
  buf: Float32Array,
  startSec: number,
  durSec: number,
  freqStart: number,
  freqEnd: number,
  gain: number,
  wave: 'sine' | 'tri' | 'square' = 'sine'
) {
  const start = Math.floor(startSec * SAMPLE_RATE);
  const len = Math.floor(durSec * SAMPLE_RATE);
  let phase = 0;

  for (let i = 0; i < len; i++) {
    const t = i / len;
    const freq = freqStart + (freqEnd - freqStart) * t;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;

    // Fast attack, exponential decay envelope
    const env = Math.min(1, i / (0.008 * SAMPLE_RATE)) * Math.pow(1 - t, 1.8);
    let s = 0;
    if (wave === 'sine') s = Math.sin(phase);
    else if (wave === 'tri') s = (2 / Math.PI) * Math.asin(Math.sin(phase));
    else s = Math.sin(phase) >= 0 ? 0.6 : -0.6;

    addSample(buf, start + i, s * env * gain);
  }
}

function synthFilteredNoise(
  buf: Float32Array,
  startSec: number,
  durSec: number,
  cutoffAlpha: number,
  gain: number
) {
  const start = Math.floor(startSec * SAMPLE_RATE);
  const len = Math.floor(durSec * SAMPLE_RATE);
  let lp = 0;

  for (let i = 0; i < len; i++) {
    const t = i / len;
    const env = Math.sin(Math.PI * t);
    lp = lp + cutoffAlpha * (rand() - lp);
    addSample(buf, start + i, lp * env * gain);
  }
}

function renderBgm(buf: Float32Array) {
  // Pizzicato bass + playful marimba/noir chords per phase
  const scales: Record<string, number[]> = {
    comedy_satire:  [196.0, 246.94, 293.66, 329.63, 293.66, 246.94], // G major playful
    panic_build:    [146.83, 155.56, 174.61, 185.0],                 // D diminished tension
    night_noir:     [110.0, 130.81, 164.81, 155.56],                 // A minor noir pulse
    ironic_resolve: [220.0, 277.18, 329.63, 392.0],                  // A major upbeat
  };

  for (const phase of sfxCues.bgmPhases) {
    if (phase.bpm <= 0 || phase.gain <= 0) continue;
    const notes = scales[phase.id];
    if (!notes) continue;

    const startSec = phase.startFrame / FPS;
    const endSec = phase.endFrame / FPS;
    const beatDur = 60 / phase.bpm;
    let step = 0;

    for (let t = startSec; t < endSec; t += beatDur * 0.5) {
      const freq = notes[step % notes.length];
      const isDownbeat = step % 4 === 0;
      const wave = phase.id === 'night_noir' ? 'sine' : 'tri';

      // Bass pluck
      synthTone(
        buf,
        t,
        Math.min(beatDur * 0.75, endSec - t),
        freq * 0.5,
        freq * 0.495,
        phase.gain * (isDownbeat ? 0.55 : 0.32),
        wave
      );

      // Upper rhythmic motif
      if (step % 2 === 0) {
        synthTone(
          buf,
          t,
          Math.min(beatDur * 0.4, endSec - t),
          freq * 2,
          freq * 2,
          phase.gain * 0.22,
          'sine'
        );
      }
      step++;
    }
  }
}

function renderSfx(buf: Float32Array) {
  for (const cue of sfxCues.sfx) {
    const t = cue.frame / FPS;
    const g = cue.gain;

    switch (cue.type) {
      case 'whoosh_punch':
        synthFilteredNoise(buf, t, 0.22, 0.12, g * 0.6);
        synthTone(buf, t, 0.14, 180, 55, g * 0.55, 'sine');
        break;
      case 'sparkle':
        synthTone(buf, t, 0.18, 1046, 1568, g * 0.35, 'sine');
        synthTone(buf, t + 0.07, 0.22, 1318, 2093, g * 0.32, 'sine');
        break;
      case 'cash_chime':
        synthTone(buf, t, 0.25, 1318, 1318, g * 0.4, 'tri');
        synthTone(buf, t + 0.08, 0.45, 1975, 1975, g * 0.45, 'sine');
        break;
      case 'comic_pop':
        synthTone(buf, t, 0.11, 240, 620, g * 0.45, 'sine');
        break;
      case 'stamp_lolos':
        synthTone(buf, t, 0.14, 150, 48, g * 0.75, 'sine');
        synthFilteredNoise(buf, t, 0.08, 0.28, g * 0.45);
        break;
      case 'crowd_buzz':
      case 'crowd_queue':
      case 'crowd_cheer':
        synthFilteredNoise(buf, t, 1.4, 0.08, g * 0.42);
        synthTone(buf, t + 0.1, 0.5, 420, 560, g * 0.18, 'tri');
        break;
      case 'envelope_stack':
        for (let k = 0; k < 5; k++) {
          synthFilteredNoise(buf, t + k * 0.08, 0.06, 0.22, g * 0.38);
        }
        break;
      case 'panic_sting':
        synthTone(buf, t, 0.85, 587, 554, g * 0.42, 'square');
        synthTone(buf, t, 0.85, 110, 82, g * 0.55, 'sine');
        break;
      case 'car_arrive':
        synthTone(buf, t, 2.2, 95, 52, g * 0.42, 'tri');
        synthFilteredNoise(buf, t + 1.4, 0.7, 0.05, g * 0.35);
        break;
      case 'car_door':
        synthTone(buf, t, 0.18, 140, 42, g * 0.75, 'sine');
        synthFilteredNoise(buf, t, 0.09, 0.18, g * 0.4);
        break;
      case 'sweat_drop':
        synthTone(buf, t, 0.18, 720, 1280, g * 0.5, 'sine');
        break;
      case 'low_boom':
        synthTone(buf, t, 0.65, 110, 38, g * 0.75, 'sine');
        break;
      case 'snap_impact':
        synthFilteredNoise(buf, t, 0.06, 0.45, g * 0.65);
        synthTone(buf, t, 0.16, 220, 65, g * 0.65, 'sine');
        break;
      case 'handshake':
        synthFilteredNoise(buf, t, 0.12, 0.25, g * 0.45);
        break;
      case 'car_depart':
        synthTone(buf, t, 1.8, 58, 145, g * 0.4, 'tri');
        synthFilteredNoise(buf, t, 1.5, 0.06, g * 0.28);
        break;
      case 'record_stop':
        synthTone(buf, t, 0.26, 480, 75, g * 0.6, 'square');
        break;
      case 'ironic_plink':
        synthTone(buf, t, 0.35, 880, 880, g * 0.42, 'tri');
        synthTone(buf, t + 0.16, 0.55, 659, 659, g * 0.38, 'sine');
        break;
    }
  }
}

// Auto-duck BGM bed by ~6 dB whenever VO caption chunk is active
function applyVoDucking(bgm: Float32Array) {
  const duckMask = new Float32Array(TOTAL_SAMPLES).fill(1.0);
  for (const c of captionChunks) {
    const s = Math.max(0, Math.floor((c.startFrame / FPS) * SAMPLE_RATE));
    const e = Math.min(TOTAL_SAMPLES - 1, Math.floor((c.endFrame / FPS) * SAMPLE_RATE));
    for (let i = s; i <= e; i++) duckMask[i] = 0.48;
  }
  // Smooth envelope follower (~35ms)
  let smooth = 1.0;
  const alpha = 0.0006;
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    smooth += alpha * (duckMask[i] - smooth);
    bgm[i] *= smooth;
  }
}

// Master to -14.5 LUFS (RMS-calibrated) with -1.0 dBTP soft limiter
function masterAudio(mix: Float32Array, targetLufs = -14.5) {
  let sumSq = 0;
  for (let i = 0; i < mix.length; i++) sumSq += mix[i] * mix[i];
  const rms = Math.sqrt(sumSq / Math.max(1, mix.length));
  const currentDb = 20 * Math.log10(Math.max(rms, 1e-6));
  const gainLinear = Math.pow(10, (targetLufs - currentDb) / 20);
  const ceiling = Math.pow(10, -1.0 / 20); // -1.0 dBTP

  for (let i = 0; i < mix.length; i++) {
    const v = mix[i] * gainLinear;
    // Soft tanh saturation near ceiling
    mix[i] = Math.abs(v) > ceiling ? Math.tanh(v / ceiling) * ceiling : v;
  }
}

function writeMonoWav(filePath: string, samples: Float32Array) {
  const byteLength = samples.length * 2;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + byteLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // Mono (stereo-compatible in Remotion)
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(byteLength, 40);

  const pcm = Buffer.alloc(byteLength);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    pcm.writeInt16LE(Math.round(clamped * 32767), i * 2);
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.concat([header, pcm]));
}

export function generateOrangDalamBed(
  outPath = path.resolve('public/audio/orang-dalam-bed.wav')
) {
  const bgm = new Float32Array(TOTAL_SAMPLES);
  const sfx = new Float32Array(TOTAL_SAMPLES);
  const mix = new Float32Array(TOTAL_SAMPLES);

  renderBgm(bgm);
  applyVoDucking(bgm);
  renderSfx(sfx);

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    mix[i] = bgm[i] + sfx[i];
  }

  masterAudio(mix, -14.5);
  writeMonoWav(outPath, mix);
  console.log(`Generated mastered audio bed (-14.5 LUFS): ${outPath}`);
}

// Direct CLI execution: `npx tsx src/videos/orang-dalam/audio.ts`
if (require.main === module) {
  generateOrangDalamBed();
}
