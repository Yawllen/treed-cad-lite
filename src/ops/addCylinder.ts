import * as THREE from 'three';

function createMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xb0b8c0,
    metalness: 0.1,
    roughness: 0.8,
  });
}

export function addCylinder(r = 10, height = 20, segments = 32): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(r, r, height, segments);
  const mesh = new THREE.Mesh(geo, createMaterial());
  mesh.frustumCulled = false;
  return mesh;
}
