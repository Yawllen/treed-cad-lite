import * as THREE from 'three';
import type { StlPacket } from '../workers/stlWorker';

export type StlExportOptions = {
  selection?: string[];
  binary?: boolean;           // currently only binary supported
  applyWorldMatrix?: boolean;
  filename?: string;
  precision?: number;
  root?: THREE.Object3D;
};

/**
 * Traverse scene meshes, collect geometry data and serialize to STL via worker.
 */
export async function exportSTL(opts: StlExportOptions = {}): Promise<Blob> {
  const {
    selection,
    binary = true,
    applyWorldMatrix = true,
    precision = 1e-3,
    root,
  } = opts;

  if (!binary) throw new Error('ASCII STL not supported');

  const sceneRoot: THREE.Object3D | undefined =
    root || (globalThis as any).__THREE_SCENE__;

  const packets: StlPacket[] = [];
  const bbox = new THREE.Box3();
  let triangles = 0;

  if (sceneRoot) {
    sceneRoot.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.visible) return;
      if (selection && !selection.includes(mesh.name) && !selection.includes(mesh.uuid)) {
        return;
      }
      const geom = mesh.geometry.clone();
      if (applyWorldMatrix) geom.applyMatrix4(mesh.matrixWorld);

      const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
      let idxAttr = geom.getIndex();
      if (!idxAttr) {
        const count = posAttr.count;
        const arr = new Uint32Array(count);
        for (let i = 0; i < count; i++) arr[i] = i;
        idxAttr = new THREE.BufferAttribute(arr, 1);
        geom.setIndex(idxAttr);
      }
      geom.computeBoundingBox();
      if (geom.boundingBox) bbox.union(geom.boundingBox);

      const positions = new Float32Array(posAttr.array as Float32Array);
      const indices = new Uint32Array(idxAttr.array as ArrayLike<number>);
      packets.push({ positions, indices, name: mesh.name });
      triangles += indices.length / 3;
    });
  }

  if (triangles > 200_000 && typeof confirm === 'function') {
    const ok = confirm(`Экспортируем ${triangles} треугольников. Продолжить?`);
    if (!ok) throw new Error('cancelled');
  }

  const worker = new Worker(new URL('../workers/stlWorker.ts', import.meta.url), {
    type: 'module',
  });
  const transfer = packets.flatMap((p) => [p.positions.buffer, p.indices.buffer]);
  const buffer: ArrayBuffer = await new Promise((resolve, reject) => {
    worker.onmessage = (e) => resolve(e.data as ArrayBuffer);
    worker.onerror = reject;
    worker.postMessage({ geometries: packets, precision }, transfer);
  });
  worker.terminate();

  const blob = new Blob([buffer], { type: 'model/stl-binary' });

  if (import.meta.env.DEV) {
    const { validateStl } = await import('./validateStl');
    await validateStl(blob, bbox);
  }

  return blob;
}
