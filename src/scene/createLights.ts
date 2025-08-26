import * as THREE from 'three';

export function createLights(): THREE.Group {
  const group = new THREE.Group();

  const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.7);
  group.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 10, 7);
  group.add(dir);

  return group;
}
