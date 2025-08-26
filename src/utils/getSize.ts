import * as THREE from 'three';
import { getBBox } from './getBBox';

export function getSize(obj: THREE.Object3D): THREE.Vector3 {
  const box = getBBox(obj);
  const size = new THREE.Vector3();
  box.getSize(size);
  return size;
}
