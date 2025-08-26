import * as THREE from 'three';

export function createCamera(width: number, height: number): THREE.PerspectiveCamera {
  const aspect = width && height ? width / height : 1;
  const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 5000);
  camera.position.set(120, 120, 120);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  return camera;
}
