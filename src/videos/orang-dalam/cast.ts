import * as THREE from 'three';

export type Expression =
  | 'chill'
  | 'smug'
  | 'money'
  | 'lazy'
  | 'pale'
  | 'sweat'
  | 'poker'
  | 'blank'
  | 'amazed'
  | 'happy'
  | 'boss_serious'
  | 'boss_smirk'
  | 'boss_whisper';

export type CharacterStyle = {
  id: string;
  skin: string;
  shirt: string;
  pants: string;
  hair: string;
  tie?: string;
  jacket?: string;
  scale?: number;
};

export const CHARACTERS: Record<string, CharacterStyle> = {
  rudi: {
    id: 'rudi',
    skin: '#F3C69F',
    shirt: '#2F80ED',
    pants: '#2D3748',
    hair: '#1E1B18',
    scale: 1.0,
  },
  tetangga: {
    id: 'tetangga',
    skin: '#E8B890',
    shirt: '#D97706',
    pants: '#4A3728',
    hair: '#3A322D',
    scale: 0.98,
  },
  anak: {
    id: 'anak',
    skin: '#F5CCA8',
    shirt: '#F8FAFC',
    pants: '#1E293B',
    hair: '#1A1A1A',
    tie: '#DC2626',
    scale: 0.92,
  },
  atasan: {
    id: 'atasan',
    skin: '#E6B993',
    shirt: '#F8FAFC',
    jacket: '#111827',
    tie: '#991B1B',
    pants: '#0F172A',
    hair: '#2B2B2B',
    scale: 1.08,
  },
};

export const CROWD_PALETTE = [
  '#E11D48', '#059669', '#D97706', '#7C3AED', '#0284C7', '#EA580C', '#4F46E5', '#16A34A',
];

// Supersampled 3x Canvas2D Bean-Head renderer (768x1024 -> crisp 2D-in-3D billboard)
export function renderCharacterTexture(
  style: CharacterStyle,
  expression: Expression,
  opts: {
    frame: number;
    prop?: 'none' | 'ijazah' | 'envelope' | 'phone' | 'folder' | 'lolos';
    facing?: 1 | -1;
    sweatProgress?: number; // 0..1 for S12 slow sweat drop
    panicLines?: boolean;
  }
): THREE.CanvasTexture {
  const W = 768;
  const H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, W, H);

  ctx.save();
  if (opts.facing === -1) {
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
  }

  const ink = '#141414';
  const breath = Math.sin(opts.frame * 0.12) * 5;
  const cx = W * 0.5;
  const isPale = expression === 'pale' || expression === 'sweat';
  const skinColor = isPale ? '#D7E2E8' : style.skin;

  // Ground contact shadow inside billboard base (reinforces grounding)
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, H - 36, 150, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.lineWidth = 14;
  ctx.strokeStyle = ink;
  ctx.fillStyle = style.pants;
  roundRect(ctx, cx - 86, H - 290, 68, 250, 26);
  ctx.fill(); ctx.stroke();
  roundRect(ctx, cx + 18, H - 290, 68, 250, 26);
  ctx.fill(); ctx.stroke();

  // Torso
  ctx.fillStyle = style.jacket ?? style.shirt;
  roundRect(ctx, cx - 125, H - 560 + breath, 250, 295, 72);
  ctx.fill(); ctx.stroke();

  // Shirt V-neck & tie for Boss or Anak
  if (style.jacket) {
    ctx.fillStyle = style.shirt;
    ctx.beginPath();
    ctx.moveTo(cx - 48, H - 555 + breath);
    ctx.lineTo(cx + 48, H - 555 + breath);
    ctx.lineTo(cx, H - 415 + breath);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  if (style.tie) {
    ctx.fillStyle = style.tie;
    ctx.beginPath();
    ctx.moveTo(cx - 16, H - 548 + breath);
    ctx.lineTo(cx + 16, H - 548 + breath);
    ctx.lineTo(cx + 22, H - 405 + breath);
    ctx.lineTo(cx, H - 380 + breath);
    ctx.lineTo(cx - 22, H - 405 + breath);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  // Bean Head
  const headY = H - 725 + breath * 1.1;
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.ellipse(cx, headY, 132, 152, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Hair cap
  ctx.fillStyle = style.hair;
  ctx.beginPath();
  ctx.ellipse(cx, headY - 82, 134, 82, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(cx + 132, headY - 45);
  ctx.quadraticCurveTo(cx, headY - 115, cx - 132, headY - 45);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Face expressions
  drawFace(ctx, cx, headY, expression, opts.frame);

  // Panic vertical blue shadow + comic lines (S09)
  if (opts.panicLines) {
    const grad = ctx.createLinearGradient(0, headY - 150, 0, headY + 40);
    grad.addColorStop(0, 'rgba(30, 58, 138, 0.55)');
    grad.addColorStop(1, 'rgba(30, 58, 138, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, headY - 40, 126, 110, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1E3A8A';
    ctx.lineWidth = 8;
    for (let k = -3; k <= 3; k++) {
      ctx.beginPath();
      ctx.moveTo(cx + k * 34, headY - 140);
      ctx.lineTo(cx + k * 34, headY - 75);
      ctx.stroke();
    }
  }

  // Slow sweat drop (S12)
  if (opts.sweatProgress !== undefined && opts.sweatProgress > 0) {
    const sy = headY - 55 + opts.sweatProgress * 155;
    const sx = cx + 96;
    ctx.fillStyle = '#38BDF8';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 28);
    ctx.quadraticCurveTo(sx + 24, sy + 10, sx, sy + 24);
    ctx.quadraticCurveTo(sx - 24, sy + 10, sx, sy - 28);
    ctx.fill(); ctx.stroke();
  }

  // Held Props (2D crisp overlays aligned to hands)
  drawProp(ctx, cx, H - 420 + breath, opts.prop ?? 'none');

  ctx.restore();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  exp: Expression,
  frame: number
) {
  const blink = frame % 110 > 105 && exp !== 'blank' && exp !== 'pale';
  ctx.strokeStyle = '#141414';
  ctx.fillStyle = '#141414';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';

  const drawEye = (x: number) => {
    if (blink) {
      ctx.beginPath();
      ctx.moveTo(x - 18, cy - 10);
      ctx.lineTo(x + 18, cy - 10);
      ctx.stroke();
      return;
    }
    if (exp === 'money') {
      ctx.fillStyle = '#16A34A';
      ctx.font = '900 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Rp', x, cy + 5);
      ctx.fillStyle = '#141414';
      return;
    }
    if (exp === 'amazed') {
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(x, cy - 12, 22, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      return;
    }
    const r = exp === 'pale' || exp === 'blank' ? 9 : 14;
    if (exp === 'pale' || exp === 'blank') {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, cy - 12, 24, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#141414';
    }
    ctx.beginPath();
    ctx.arc(x, cy - 12, r, 0, Math.PI * 2);
    ctx.fill();
  };

  drawEye(cx - 46);
  drawEye(cx + 46);

  // Eyebrows
  ctx.beginPath();
  if (exp === 'smug' || exp === 'boss_smirk') {
    ctx.moveTo(cx - 72, cy - 48); ctx.lineTo(cx - 22, cy - 58);
    ctx.moveTo(cx + 22, cy - 64); ctx.lineTo(cx + 72, cy - 44);
  } else if (exp === 'pale' || exp === 'sweat') {
    ctx.moveTo(cx - 74, cy - 44); ctx.lineTo(cx - 24, cy - 62);
    ctx.moveTo(cx + 24, cy - 62); ctx.lineTo(cx + 74, cy - 44);
  } else if (exp === 'boss_serious' || exp === 'poker') {
    ctx.moveTo(cx - 72, cy - 52); ctx.lineTo(cx - 20, cy - 46);
    ctx.moveTo(cx + 20, cy - 46); ctx.lineTo(cx + 72, cy - 52);
  } else {
    ctx.moveTo(cx - 68, cy - 54); ctx.lineTo(cx - 24, cy - 54);
    ctx.moveTo(cx + 24, cy - 54); ctx.lineTo(cx + 68, cy - 54);
  }
  ctx.stroke();

  // Mouth
  ctx.beginPath();
  if (exp === 'smug' || exp === 'happy' || exp === 'boss_smirk') {
    ctx.arc(cx, cy + 36, 36, 0.1 * Math.PI, 0.9 * Math.PI);
  } else if (exp === 'pale') {
    ctx.moveTo(cx - 32, cy + 56);
    ctx.quadraticCurveTo(cx - 16, cy + 44, cx, cy + 56);
    ctx.quadraticCurveTo(cx + 16, cy + 68, cx + 32, cy + 56);
  } else if (exp === 'blank') {
    ctx.ellipse(cx, cy + 54, 16, 22, 0, 0, Math.PI * 2);
  } else if (exp === 'poker' || exp === 'sweat' || exp === 'boss_serious' || exp === 'boss_whisper') {
    ctx.moveTo(cx - 28, cy + 54);
    ctx.lineTo(cx + 28, cy + 54);
  } else {
    ctx.arc(cx, cy + 40, 26, 0.15 * Math.PI, 0.85 * Math.PI);
  }
  ctx.stroke();
}

function drawProp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  prop: 'none' | 'ijazah' | 'envelope' | 'phone' | 'folder' | 'lolos'
) {
  if (prop === 'none') return;
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#141414';

  if (prop === 'ijazah') {
    ctx.fillStyle = '#FEF3C7';
    roundRect(ctx, cx + 70, cy - 40, 120, 42, 12);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(cx + 122, cy - 40, 18, 42);
  } else if (prop === 'envelope') {
    ctx.fillStyle = '#D9B382';
    roundRect(ctx, cx + 65, cy - 35, 135, 86, 8);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#15803D';
    ctx.font = '900 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Rp5 JT', cx + 132, cy + 18);
  } else if (prop === 'phone') {
    ctx.fillStyle = '#0F172A';
    roundRect(ctx, cx + 75, cy - 50, 62, 108, 12);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(cx + 84, cy - 38, 44, 80);
  } else if (prop === 'folder') {
    ctx.fillStyle = '#FACC15';
    roundRect(ctx, cx + 60, cy - 55, 115, 140, 8);
    ctx.fill(); ctx.stroke();
  } else if (prop === 'lolos') {
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, cx + 55, cy - 60, 145, 155, 8);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#16A34A';
    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOLOS!', cx + 127, cy + 25);
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
