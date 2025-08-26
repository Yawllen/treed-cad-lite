import * as THREE from 'three';

function createMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x8aa1ff,
    metalness: 0.1,
    roughness: 0.6,
  });
}

export function addCube(size = 20): THREE.Mesh {
  const geo = new THREE.BoxGeometry(size, size, size);
  const mesh = new THREE.Mesh(geo, createMaterial());
  mesh.position.set(0, size / 2, 0);
  mesh.frustumCulled = false;
  return mesh;
}
