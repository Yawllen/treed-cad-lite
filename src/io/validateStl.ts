import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

/**
 * Dev helper: re-import exported STL and compare bounding boxes.
 */
export async function validateStl(blob: Blob, original: THREE.Box3) {
  try {
    const buf = await blob.arrayBuffer();
    const loader = new STLLoader();
    const geom = loader.parse(buf);
    geom.computeBoundingBox();
    const bbox = geom.boundingBox!;
    const eps = 0.01; // mm
    const ok = bbox.min.distanceTo(original.min) <= eps &&
      bbox.max.distanceTo(original.max) <= eps;
    console.info('[validateStl] original bbox', original.min.toArray(), original.max.toArray());
    console.info('[validateStl] imported bbox', bbox.min.toArray(), bbox.max.toArray());
    if (ok) {
      console.info('[validateStl] bbox match within', eps, 'mm');
    } else {
      console.warn('[validateStl] bbox mismatch');
    }
  } catch (err) {
    console.warn('[validateStl] failed', err);
  }
}
