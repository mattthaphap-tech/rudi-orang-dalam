import * as THREE from 'three';
import type { TimeOfDay } from './story';

export type LightRig = {
  group: THREE.Group;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  porchPoint: THREE.PointLight;
  headlightSpot: THREE.SpotLight;
  rimLight: THREE.DirectionalLight;
  updateMood: (mood: TimeOfDay, scene: THREE.Scene, sedanX: number) => void;
};

export function createLightRig(): LightRig {
  const group = new THREE.Group();

  const hemi = new THREE.HemisphereLight('#D8ECFF', '#6B5B45', 0.9);
  group.add(hemi);

  const sun = new THREE.DirectionalLight('#FFF3D6', 1.85);
  sun.position.set(8, 14, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 45;
  const d = 14;
  sun.shadow.camera.left = -d;
  sun.shadow.camera.right = d;
  sun.shadow.camera.top = d;
  sun.shadow.camera.bottom = -d;
  sun.shadow.bias = -0.0005;
  group.add(sun);

  // Motivated warm porch lamp (active at night S10–S14)
  const porchPoint = new THREE.PointLight('#FBBF24', 0, 11, 1.6);
  porchPoint.position.set(0, 2.9, 1.4);
  group.add(porchPoint);

  // Motivated car headlight beam cutting through night road
  const headlightSpot = new THREE.SpotLight('#FEF08A', 0, 18, Math.PI / 5, 0.45, 1.2);
  headlightSpot.position.set(0, 0.75, 5.8);
  headlightSpot.target.position.set(-6, 0.6, 5.2);
  group.add(headlightSpot, headlightSpot.target);

  // Subtle rim light to keep 2D billboards separated from night background
  const rimLight = new THREE.DirectionalLight('#60A5FA', 0.35);
  rimLight.position.set(-7, 6, -6);
  group.add(rimLight);

  const updateMood = (mood: TimeOfDay, scene: THREE.Scene, sedanX: number) => {
    headlightSpot.position.set(sedanX - 2.2, 0.75, 5.8);
    headlightSpot.target.position.set(sedanX - 8.5, 0.45, 4.6);

    if (mood === 'day') {
      scene.background = new THREE.Color('#93C5FD');
      scene.fog = new THREE.Fog('#BFDBFE', 18, 48);
      hemi.color.set('#E0F2FE');
      hemi.groundColor.set('#6E6248');
      hemi.intensity = 0.95;
      sun.color.set('#FFF4D6');
      sun.intensity = 1.9;
      porchPoint.intensity = 0;
      headlightSpot.intensity = 0;
      rimLight.intensity = 0.25;
    } else if (mood === 'panic') {
      scene.background = new THREE.Color('#64748B');
      scene.fog = new THREE.Fog('#475569', 12, 34);
      hemi.color.set('#94A3B8');
      hemi.intensity = 0.65;
      sun.color.set('#CBD5E1');
      sun.intensity = 1.1;
      porchPoint.intensity = 0.4;
      headlightSpot.intensity = 0;
      rimLight.color.set('#38BDF8');
      rimLight.intensity = 0.7;
    } else if (mood === 'night') {
      scene.background = new THREE.Color('#090F1E');
      scene.fog = new THREE.Fog('#0B132B', 10, 32);
      hemi.color.set('#1E3A8A');
      hemi.groundColor.set('#0F172A');
      hemi.intensity = 0.8;
      sun.color.set('#60A5FA');
      sun.intensity = 1.0; // moonlight (raised: night shots were unreadably black)
      porchPoint.intensity = 5.0;
      headlightSpot.intensity = 8.0;
      rimLight.color.set('#93C5FD');
      rimLight.intensity = 1.3;
    } else {
      // morning resolution
      scene.background = new THREE.Color('#BAE6FD');
      scene.fog = new THREE.Fog('#E0F2FE', 18, 52);
      hemi.color.set('#FEF3C7');
      hemi.groundColor.set('#78716C');
      hemi.intensity = 1.05;
      sun.color.set('#FDE68A');
      sun.intensity = 2.05;
      porchPoint.intensity = 0;
      headlightSpot.intensity = 0;
      rimLight.intensity = 0.35;
    }
  };

  return { group, hemi, sun, porchPoint, headlightSpot, rimLight, updateMood };
}
