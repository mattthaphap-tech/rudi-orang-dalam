import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const SpeedLines: React.FC<{ opacity: number; color?: string }> = ({
  opacity,
  color = 'rgba(255, 255, 255, 0.78)',
}) => {
  if (opacity <= 0.01) return null;
  const rays = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity }}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <g transform="translate(540, 860)">
          {rays.map((deg, idx) => (
            <polygon
              key={deg}
              points="-10,-1200 10,-1200 2,-380 -2,-380"
              fill={color}
              transform={`rotate(${deg + (idx % 2 === 0 ? 3 : -2)})`}
            />
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const StampLolos: React.FC<{ triggerFrame: number; label?: string }> = ({
  triggerFrame,
  label = 'LOLOS!',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - triggerFrame;
  if (local < 0 || local > 52) return null;

  const slam = spring({
    frame: local,
    fps,
    config: { damping: 12, stiffness: 280, mass: 0.7 },
  });
  const scale = interpolate(slam, [0, 1], [2.4, 1]);
  const opacity = interpolate(local, [0, 4, 40, 52], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 340,
        left: '50%',
        transform: `translateX(-50%) rotate(-10deg) scale(${scale})`,
        opacity,
        border: '12px solid #D92D20',
        borderRadius: 18,
        padding: '14px 44px',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        boxShadow: '0 14px 36px rgba(0,0,0,0.35)',
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: 96,
        letterSpacing: 6,
        color: '#D92D20',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
  );
};

const CashPop: React.FC<{ triggerFrame: number; text: string }> = ({ triggerFrame, text }) => {
  const frame = useCurrentFrame();
  const local = frame - triggerFrame;
  if (local < 0 || local > 42) return null;

  const y = interpolate(local, [0, 42], [0, -140], { extrapolateRight: 'clamp' });
  const opacity = interpolate(local, [0, 5, 30, 42], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 520,
        right: 96,
        transform: `translateY(${y}px) rotate(6deg)`,
        opacity,
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: 64,
        color: '#22C55E',
        WebkitTextStroke: '3px #052E16',
        textShadow: '0 8px 20px rgba(0,0,0,0.45)',
      }}
    >
      {text}
    </div>
  );
};

export const ComicOverlay: React.FC = () => {
  const frame = useCurrentFrame();

  // 1. Impact speed lines: frame 256 ("orang dalam") & frame 2044 ("Gampang.")
  const punch1 = interpolate(frame, [256, 260, 278, 286], [0, 0.85, 0.85, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const punch2 = interpolate(frame, [2044, 2047, 2062, 2068], [0, 0.9, 0.9, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 2. Panic crimson vignette: frame 1140–1310 (Dutch angle panic)
  const panicOpacity = interpolate(frame, [1140, 1152, 1295, 1314], [0, 0.52, 0.52, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 3. Deadpan freeze desaturation + subtle vignette: frame 2484–2655
  const isDeadpan = frame >= 2484;
  const deadpanFade = interpolate(frame, [2484, 2490], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 4. Ironic punctuation mark on final punchline: frame 2560–2655
  const showDotDotDot = frame >= 2560;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Speed lines untuk punch-in komedi & snap impact */}
      <SpeedLines opacity={punch1} color="rgba(255, 248, 220, 0.82)" />
      <SpeedLines opacity={punch2} color="rgba(250, 204, 21, 0.85)" />

      {/* Pop-up uang tunai */}
      <CashPop triggerFrame={548} text="+Rp5 JT" />
      <CashPop triggerFrame={1035} text="x40 AMPLOP!" />

      {/* Stempel LOLOS! */}
      <StampLolos triggerFrame={735} label="LOLOS!" />
      <StampLolos triggerFrame={2074} label="40 LOLOS!" />

      {/* Vignette panik merah gelap */}
      {panicOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            opacity: panicOpacity,
            background:
              'radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 42%, rgba(153,27,27,0.82) 100%)',
          }}
        />
      )}

      {/* Deadpan freeze overlay di babak akhir */}
      {isDeadpan && (
        <AbsoluteFill
          style={{
            opacity: deadpanFade,
            backdropFilter: 'grayscale(0.75) contrast(1.08)',
            background:
              'radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 50%, rgba(10,10,14,0.55) 100%)',
          }}
        />
      )}

      {showDotDotDot && (
        <div
          style={{
            position: 'absolute',
            top: 380,
            right: 120,
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: 108,
            color: '#FFFFFF',
            WebkitTextStroke: '4px #111827',
            letterSpacing: 8,
          }}
        >
          ...
        </div>
      )}
    </AbsoluteFill>
  );
};
