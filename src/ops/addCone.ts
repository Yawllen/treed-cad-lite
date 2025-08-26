import * as THREE from 'three';

function createMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x8aa1ff,
    metalness: 0.1,
    roughness: 0.6,
  });
}

export function addCone(r = 10, height = 20, segments = 32): THREE.Mesh {
  const geo = new THREE.ConeGeometry(r, height, segments);
  const mesh = new THREE.Mesh(geo, createMaterial());
  mesh.position.set(0, height / 2, 0);
  mesh.frustumCulled = false;
  return mesh;
}
