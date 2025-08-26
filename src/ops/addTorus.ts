import * as THREE from 'three';

function createMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xb0b8c0,
    metalness: 0.1,
    roughness: 0.8,
  });
}

export function addTorus(r = 10, tube = 3, radialSegments = 16, tubularSegments = 100): THREE.Mesh {
  const geo = new THREE.TorusGeometry(r, tube, radialSegments, tubularSegments);
  const mesh = new THREE.Mesh(geo, createMaterial());
  mesh.frustumCulled = false;
  return mesh;
}
