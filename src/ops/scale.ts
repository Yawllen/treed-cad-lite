import * as THREE from 'three';

export function scale(obj: THREE.Object3D, factor: number): void {
  obj.scale.set(factor, factor, factor);
}
