import * as THREE from 'three';
import { mm } from '@utils';

function createMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x8aa1ff,
    metalness: 0.1,
    roughness: 0.6,
  });
}

export function addTorus(r = 10, tube = 3, radialSegments = 16, tubularSegments = 100): THREE.Mesh {
  const radius = mm(r);
  const tubeR = mm(tube);
  const geo = new THREE.TorusGeometry(radius, tubeR, radialSegments, tubularSegments);
  const mesh = new THREE.Mesh(geo, createMaterial());
  mesh.frustumCulled = false;
  return mesh;
}
