import * as THREE from 'three';
import { mm } from '@utils';

function createMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x8aa1ff,
    metalness: 0.1,
    roughness: 0.6,
  });
}

export function addSphere(r = 10, segments = 32): THREE.Mesh {
  const radius = mm(r);
  const geo = new THREE.SphereGeometry(radius, segments, segments / 2);
  const mesh = new THREE.Mesh(geo, createMaterial());
  mesh.position.set(0, radius, 0);
  mesh.frustumCulled = false;
  return mesh;
}
