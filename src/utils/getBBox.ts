import * as THREE from 'three';

export function getBBox(obj: THREE.Object3D): THREE.Box3 {
  return new THREE.Box3().setFromObject(obj);
}
