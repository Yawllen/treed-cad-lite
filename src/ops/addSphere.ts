import * as THREE from 'three';

function createMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x8aa1ff,
    metalness: 0.1,
    roughness: 0.6,
  });
}

export function addSphere(r = 10, segments = 32): THREE.Mesh {
  const geo = new THREE.SphereGeometry(r, segments, segments / 2);
  const mesh = new THREE.Mesh(geo, createMaterial());
  mesh.position.set(0, r, 0);
  mesh.frustumCulled = false;
  return mesh;
}
