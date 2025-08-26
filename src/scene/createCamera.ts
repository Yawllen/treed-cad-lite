import * as THREE from 'three';

export function createCamera(width: number, height: number): THREE.PerspectiveCamera {
  const aspect = width && height ? width / height : 1;
  const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
  camera.position.set(6, 6, 10);
  return camera;
}
