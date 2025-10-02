import * as THREE from 'three';
import { ExtrudeGeometry } from 'three/examples/jsm/geometries/ExtrudeGeometry.js';

export function createCube({ size = 20, color = 0x7c5cff }: { size?: number; color?: number }) {
  const g = new THREE.BoxGeometry(size, size, size);
  const m = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(0, size / 2, 0);
  return mesh;
}

export function createSphere({ radius = 12, color = 0x4fa3ff }: { radius?: number; color?: number }) {
  const g = new THREE.SphereGeometry(radius, 32, 16);
  const m = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(0, radius, 0);
  return mesh;
}

export function createCylinder(
  { radiusTop = 10, radiusBottom = 10, height = 30, color = 0xff8a5b }:
  { radiusTop?: number; radiusBottom?: number; height?: number; color?: number }
) {
  const g = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32);
  const m = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(0, height / 2, 0);
  return mesh;
}

export function createExtruded(
  { shape = 'rect', w = 20, h = 12, depth = 10, color = 0x71d99e }:
  { shape?: 'rect' | 'circle'; w?: number; h?: number; depth?: number; color?: number }
) {
  let sh: THREE.Shape;
  if (shape === 'rect') {
    sh = new THREE.Shape();
    sh.moveTo(-w / 2, -h / 2);
    sh.lineTo( w / 2, -h / 2);
    sh.lineTo( w / 2,  h / 2);
    sh.lineTo(-w / 2,  h / 2);
    sh.closePath();
  } else {
    sh = new THREE.Shape();
    const r = w / 2;
    sh.absarc(0, 0, r, 0, Math.PI * 2, true);
  }
  const g = new ExtrudeGeometry(sh, { depth, bevelEnabled: false });
  const m = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(g, m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = depth / 2;
  return mesh;
}
