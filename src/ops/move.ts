import * as THREE from 'three';
import { mm } from '@utils';

export function move(obj: THREE.Object3D, x: number, y: number, z: number): void {
  obj.position.set(mm(x), mm(y), mm(z));
}
