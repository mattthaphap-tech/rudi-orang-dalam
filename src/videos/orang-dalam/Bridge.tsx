import React, { useEffect, useMemo } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useFrame, useThree } from '@react-three/fiber';
import {
  BloomEffect,
  EffectComposer as PostEffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing';
import * as THREE from 'three';
import { buildOrangDalamScene } from './build';
import { getShotAtFrame, sampleCamera } from './story';
import { LensBlur } from '../template/lensblur';
import { ComicOverlay } from './ComicOverlay';
import captionChunks from './caption_chunks.json';

type CaptionChunk = {
  id: number;
  startFrame: number;
  endFrame: number;
  text: string;
  emphasis?: string;
};

const glSize = new THREE.Vector2();

const SceneRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { gl, camera, scene } = useThree();
  const built = useMemo(() => buildOrangDalamScene(), []);
  // Manual post chain (proven Darto/template pattern): the JSX <EffectComposer>
  // from @react-three/postprocessing rendered a black canvas on this VM, so the
  // composer is built directly from the `postprocessing` package, like Darto.
  const fx = useMemo(
    () => ({
      lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
      bloom: new BloomEffect({ intensity: 0.2, luminanceThreshold: 0.85, mipmapBlur: true }),
      tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
      vignette: new VignetteEffect({ offset: 0.22, darkness: 0.35 }),
    }),
    []
  );
  const composer = useMemo(() => {
    gl.toneMapping = THREE.NoToneMapping;
    const c = new PostEffectComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new EffectPass(camera, fx.lens.pre));
    c.addPass(new EffectPass(camera, fx.lens.main));
    c.addPass(new EffectPass(camera, fx.bloom, fx.tone, fx.vignette));
    return c;
  }, [gl, scene, camera, fx]);

  useEffect(
    () => () => {
      composer.dispose();
      fx.lens.dispose();
    },
    [composer, fx]
  );

  const syncFrame = (f: number) => {
    const cam = sampleCamera(f);
    const shot = getShotAtFrame(f);
    const persp = camera as THREE.PerspectiveCamera;
    persp.position.set(...cam.pos);
    persp.lookAt(...cam.lookAt);
    persp.rotation.z += cam.roll;
    persp.fov = cam.fov;
    persp.updateProjectionMatrix();

    built.updateFrame(f, camera);

    // The nested scene's background/fog are ignored by the renderer — copy them
    // to the outer R3F scene so the sky + fog actually paint.
    scene.background = built.scene.background;
    scene.fog = built.scene.fog;

    // Per-frame post params (DOF focus in world metres; aperture 0.014–0.036
    // maps to 4.2–10.8 px CoC at infinity — Darto's proven range).
    fx.lens.focus = shot.dofFocus;
    fx.lens.cInf = shot.dofAperture * 300;
    fx.bloom.intensity = shot.mood === 'night' ? 0.55 : 0.2;
    fx.vignette.uniforms.get('darkness')!.value = shot.mood === 'night' ? 0.62 : 0.35;
  };

  syncFrame(frame);

  useFrame((_, delta) => {
    syncFrame(frame);
    gl.getSize(glSize);
    composer.setSize(glSize.width, glSize.height);
    gl.autoClear = true;
    composer.render(delta || 1 / 30);
  }, 1);

  return <primitive object={built.scene} dispose={null} />;
};

export const OrangDalamVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cam = sampleCamera(frame);

  const activeCaption = (captionChunks as CaptionChunk[]).find(
    (c) => frame >= c.startFrame && frame <= c.endFrame
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#090F1E' }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows
        gl={{
          antialias: false,
          stencil: false,
          powerPreference: 'high-performance',
          toneMappingExposure: 1.0,
        }}
        camera={{ fov: 40, near: 0.1, far: 120 }}
      >
        <SceneRig frame={frame} />
      </ThreeCanvas>

      {/* Track 1: Voiceover Narasi (sinkron 1:1 dengan Rudi-Orang-Dalam.srt) */}
      <Audio src={staticFile('audio/Rudi-Orang-Dalam.wav')} volume={1.0} />

      {/* Track 2: Bed BGM + SFX prosedural (sudah auto-ducked & mastered -14.5 LUFS) */}
      <Audio src={staticFile('audio/orang-dalam-bed.wav')} volume={0.68} />

      {/* Layer 2: Efek Komik 2D sinkron SFX (di atas 3D, di bawah caption) */}
      <ComicOverlay />

      {/* Impact White Flash Overlay */}
      {cam.flash > 0.01 && (
        <AbsoluteFill
          style={{
            backgroundColor: '#FFFFFF',
            opacity: cam.flash * 0.75,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 9:16 Safe-Margin Subtitle Layer (bottom 18%–24% safe zone) */}
      {activeCaption && (
        <div
          style={{
            position: 'absolute',
            left: 72,
            right: 72,
            bottom: 310,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.82)',
              color: '#F8FAFC',
              padding: '18px 28px',
              borderRadius: 20,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 44,
              fontWeight: 800,
              lineHeight: 1.25,
              textAlign: 'center',
              boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
              border: '3px solid rgba(255,255,255,0.16)',
            }}
          >
            {activeCaption.text}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
