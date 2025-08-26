import * as THREE from 'three';
import { mm } from '@utils';

function createMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x8aa1ff,
    metalness: 0.1,
    roughness: 0.6,
  });
}

export function addCube(size = 20): THREE.Mesh {
  const s = mm(size);
  const geo = new THREE.BoxGeometry(s, s, s);
  const mesh = new THREE.Mesh(geo, createMaterial());
  mesh.position.set(0, s / 2, 0);
  mesh.frustumCulled = false;
  return mesh;
}
