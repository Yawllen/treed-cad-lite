import * as THREE from 'three';
import { mm } from '@utils';

export function createCamera(width: number, height: number): THREE.PerspectiveCamera {
  const aspect = width && height ? width / height : 1;
  const camera = new THREE.PerspectiveCamera(60, aspect, mm(0.1), mm(1000));
  camera.position.set(mm(6), mm(6), mm(10));
  return camera;
}
