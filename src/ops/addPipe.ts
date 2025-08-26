import * as THREE from 'three';

function createMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xb0b8c0,
    metalness: 0.1,
    roughness: 0.8,
  });
}

export function addPipe(
  outerR = 10,
  wall = 2,
  length = 40,
): THREE.Group {
  const group = new THREE.Group();
  const outerGeo = new THREE.CylinderGeometry(outerR, outerR, length, 32, 1, true);
  const outer = new THREE.Mesh(outerGeo, createMaterial());

  const innerR = outerR - wall;
  const innerGeo = new THREE.CylinderGeometry(innerR, innerR, length, 32, 1, true);
  const innerMat = createMaterial();
  innerMat.side = THREE.BackSide;
  const inner = new THREE.Mesh(innerGeo, innerMat);

  outer.frustumCulled = false;
  inner.frustumCulled = false;

  group.add(outer);
  group.add(inner);
  return group;
}
