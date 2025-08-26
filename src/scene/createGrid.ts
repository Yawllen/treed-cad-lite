import * as THREE from 'three';
import { mm } from '@utils';

export function createGrid(): THREE.GridHelper {
  return new THREE.GridHelper(mm(100), 100, 0x3a3a3a, 0x2a2a2a);
}
