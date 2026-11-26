import * as THREE from 'three';
import { CHARACTERS, CROWD_PALETTE, Expression, renderCharacterTexture } from './cast';
import { createLightRig, LightRig } from './lights';
import { getShotAtFrame } from './story';
import { createWorld, WorldRefs } from './world';

export type SceneActors = {
  rudi: THREE.Mesh;
  tetangga: THREE.Mesh;
  anak: THREE.Mesh;
  atasan: THREE.Mesh;
  crowd: THREE.Mesh[];
};

export type BuiltScene = {
  scene: THREE.Scene;
  world: WorldRefs;
  lights: LightRig;
  actors: SceneActors;
  updateFrame: (frame: number, camera: THREE.Camera) => void;
};

function makeBillboard(height = 1.85): THREE.Mesh {
  const aspect = 768 / 1024;
  const geo = new THREE.PlaneGeometry(height * aspect, height);
  // Shift pivot to feet (y = 0) so grounding is exact
  geo.translate(0, height / 2, 0);
  const mat = new THREE.MeshStandardMaterial({
    transparent: true,
    alphaTest: 0.2,
    roughness: 0.72,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

function setActorTex(
  mesh: THREE.Mesh,
  styleKey: keyof typeof CHARACTERS,
  exp: Expression,
  frame: number,
  opts: Parameters<typeof renderCharacterTexture>[2] = { frame }
) {
  const mat = mesh.material as THREE.MeshStandardMaterial;
  if (mat.map) mat.map.dispose();
  mat.map = renderCharacterTexture(CHARACTERS[styleKey], exp, { ...opts, frame });
  mat.needsUpdate = true;
}

export function buildOrangDalamScene(): BuiltScene {
  const scene = new THREE.Scene();
  const world = createWorld();
  const lights = createLightRig();
  scene.add(world.root, lights.group);

  const rudi = makeBillboard(1.85);
  const tetangga = makeBillboard(1.82);
  const anak = makeBillboard(1.7);
  const atasan = makeBillboard(2.0);
  scene.add(rudi, tetangga, anak, atasan);

  // 40-person queue billboards (S07–S08)
  const crowd: THREE.Mesh[] = [];
  for (let i = 0; i < 40; i++) {
    const m = makeBillboard(1.74);
    const mat = m.material as THREE.MeshStandardMaterial;
    mat.map = renderCharacterTexture(
      {
        id: `crowd_${i}`,
        skin: i % 2 === 0 ? '#E8B890' : '#F3C69F',
        shirt: CROWD_PALETTE[i % CROWD_PALETTE.length],
        pants: '#1F2937',
        hair: '#1E1B18',
      },
      'amazed',
      { frame: i * 3, prop: i % 2 === 0 ? 'envelope' : 'folder' }
    );
    // Snake queue from front gate along village road
    const row = Math.floor(i / 10);
    const col = i % 10;
    m.position.set(-4.5 + col * 1.05 + (row % 2) * 0.4, 0, 3.6 + row * 1.25);
    m.visible = false;
    scene.add(m);
    crowd.push(m);
  }

  const updateFrame = (frame: number, camera: THREE.Camera) => {
    const shot = getShotAtFrame(frame);

    // Defaults
    tetangga.visible = false;
    anak.visible = false;
    atasan.visible = false;
    world.envelopeMountain.visible = false;
    crowd.forEach((c) => (c.visible = false));

    // Sedan motion: arrives S10, parked S11–S14, departs S16
    let sedanX = 16;
    if (frame >= 1314 && frame < 1412) {
      const t = (frame - 1314) / 98;
      const ease = 1 - Math.pow(1 - t, 3);
      sedanX = 12 - ease * 10.6; // stops at x = 1.4
    } else if (frame >= 1412 && frame < 2450) {
      sedanX = 1.4;
    } else if (frame >= 2450) {
      const t = Math.min(1, (frame - 2450) / 85);
      sedanX = 1.4 - t * t * 18; // drives away left
    }
    world.sedan.position.x = sedanX;
    world.sedanDoor.rotation.y = frame >= 1415 && frame < 1515 ? -0.9 : 0;

    // Porch bulb glow at night
    const bulbMat = world.porchBulb.material as THREE.MeshStandardMaterial;
    bulbMat.emissiveIntensity = shot.mood === 'night' ? 3.2 : 0.15;

    lights.updateMood(shot.mood, scene, sedanX);

    // Shot-by-shot staging & expressions
    if (shot.id === 'S01') {
      rudi.position.set(-0.2, 0.25, 0.45);
      setActorTex(rudi, 'rudi', 'chill', frame, { frame, prop: 'ijazah' });
    } else if (shot.id === 'S02') {
      rudi.position.set(-0.25, 0.25, 0.45);
      tetangga.visible = true;
      tetangga.position.set(1.45, 0, 1.35);
      setActorTex(rudi, 'rudi', frame >= 245 ? 'smug' : 'chill', frame, { frame });
      setActorTex(tetangga, 'tetangga', 'chill', frame, { frame, facing: -1 });
    } else if (shot.id === 'S03') {
      rudi.position.set(-0.25, 0.25, 0.45);
      tetangga.visible = true;
      anak.visible = true;
      tetangga.position.set(1.3, 0, 1.25);
      anak.position.set(2.15, 0, 1.8);
      setActorTex(rudi, 'rudi', 'smug', frame, { frame });
      setActorTex(tetangga, 'tetangga', 'amazed', frame, { frame, facing: -1 });
      setActorTex(anak, 'anak', 'happy', frame, { frame, facing: -1, prop: 'folder' });
    } else if (shot.id === 'S04') {
      rudi.position.set(-0.15, 0.25, 0.45);
      tetangga.visible = true;
      tetangga.position.set(1.2, 0, 1.2);
      const gotMoney = frame >= 548;
      setActorTex(rudi, 'rudi', gotMoney ? 'money' : 'smug', frame, {
        frame,
        prop: gotMoney ? 'envelope' : 'none',
      });
      setActorTex(tetangga, 'tetangga', 'happy', frame, {
        frame,
        facing: -1,
        prop: gotMoney ? 'none' : 'envelope',
      });
    } else if (shot.id === 'S05') {
      rudi.position.set(-0.4, 0.25, 0.35);
      setActorTex(rudi, 'rudi', 'lazy', frame, { frame, prop: 'phone' });
    } else if (shot.id === 'S06') {
      rudi.position.set(-0.4, 0.25, 0.35);
      anak.visible = true;
      anak.position.set(5.0, 0, 1.8);
      setActorTex(anak, 'anak', 'happy', frame, { frame, prop: 'lolos' });
    } else if (shot.id === 'S07' || shot.id === 'S08') {
      rudi.position.set(-0.2, 0.25, 0.45);
      setActorTex(rudi, 'rudi', shot.id === 'S08' ? 'pale' : 'smug', frame, { frame });
      const count = shot.id === 'S07' ? 12 : 40;
      for (let i = 0; i < count; i++) crowd[i].visible = true;
      world.envelopeMountain.visible = frame >= 1020;
    } else if (shot.id === 'S09') {
      rudi.position.set(-0.2, 0.25, 0.35);
      world.envelopeMountain.visible = true;
      setActorTex(rudi, 'rudi', 'pale', frame, { frame, panicLines: true });
    } else if (shot.id === 'S10') {
      rudi.position.set(-0.2, 0.25, 0.45);
      setActorTex(rudi, 'rudi', 'pale', frame, { frame });
      if (frame >= 1420) {
        atasan.visible = true;
        const walkT = Math.min(1, (frame - 1420) / 90);
        atasan.position.set(1.2, 0, 4.7 - walkT * 1.6);
        setActorTex(atasan, 'atasan', 'boss_serious', frame, { frame, facing: -1 });
      }
    } else if (shot.id === 'S11') {
      rudi.position.set(-0.2, 0.25, 0.45);
      atasan.visible = true;
      atasan.position.set(0.95, 0, 2.5);
      setActorTex(rudi, 'rudi', 'pale', frame, { frame });
      setActorTex(atasan, 'atasan', 'boss_serious', frame, { frame, facing: -1 });
    } else if (shot.id === 'S12') {
      rudi.position.set(-0.2, 0.25, 0.45);
      atasan.visible = true;
      atasan.position.set(0.95, 0, 2.5);
      const sweatT = Math.max(0, Math.min(1, (frame - 1685) / 80));
      setActorTex(rudi, 'rudi', 'sweat', frame, { frame, sweatProgress: sweatT });
    } else if (shot.id === 'S13') {
      rudi.position.set(-0.2, 0.25, 0.45);
      atasan.visible = true;
      atasan.position.set(0.95, 0, 2.5);
      setActorTex(rudi, 'rudi', 'poker', frame, { frame });
    } else if (shot.id === 'S14') {
      rudi.position.set(-0.2, 0.25, 0.45);
      atasan.visible = true;
      atasan.position.set(0.95, 0, 2.5);
      setActorTex(atasan, 'atasan', frame >= 2044 ? 'boss_smirk' : 'boss_serious', frame, {
        frame,
        facing: -1,
      });
    } else if (shot.id === 'S15') {
      anak.visible = true;
      anak.position.set(5.3, 0, 2.6);
      setActorTex(anak, 'anak', 'happy', frame, { frame, prop: 'lolos' });
      atasan.visible = true;
      atasan.position.set(11.2, 0, 0.5);
      setActorTex(atasan, 'atasan', 'boss_smirk', frame, { frame });
    } else {
      // S16: Salaman, bisik, mobil pergi, Rudi bengong deadpan
      rudi.position.set(-0.2, 0, 1.85);
      const whisper = frame >= 2360 && frame < 2450;
      const departed = frame >= 2450;
      atasan.visible = !departed;
      atasan.position.set(whisper ? 0.55 : 0.9, 0, 2.15);
      setActorTex(rudi, 'rudi', frame >= 2480 ? 'blank' : 'poker', frame, { frame });
      if (!departed) {
        setActorTex(atasan, 'atasan', whisper ? 'boss_whisper' : 'boss_smirk', frame, {
          frame,
          facing: -1,
        });
      }
    }

    // Billboard Y-axis facing camera (keeps characters grounded upright)
    const camPos = new THREE.Vector3();
    camera.getWorldPosition(camPos);
    for (const actor of [rudi, tetangga, anak, atasan, ...crowd]) {
      if (!actor.visible) continue;
      actor.lookAt(camPos.x, actor.position.y, camPos.z);
    }
  };

  return {
    scene,
    world,
    lights,
    actors: { rudi, tetangga, anak, atasan, crowd },
    updateFrame,
  };
}
