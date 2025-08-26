import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

export function createTransformControls(
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
): TransformControls {
  return new TransformControls(camera, canvas);
}
