import * as THREE from 'three';

export function move(obj: THREE.Object3D, x: number, y: number, z: number): void {
  obj.position.set(x, y, z);
}
