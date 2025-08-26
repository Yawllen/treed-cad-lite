import * as THREE from 'three';
import { MM_INV } from './units';

export function getBBox(obj: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3().setFromObject(obj);
  box.min.multiplyScalar(MM_INV);
  box.max.multiplyScalar(MM_INV);
  return box;
}
