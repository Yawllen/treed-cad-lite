import * as THREE from 'three';

export function rotate(obj: THREE.Object3D, x: number, y: number, z: number): void {
  obj.rotation.set(x, y, z);
}
