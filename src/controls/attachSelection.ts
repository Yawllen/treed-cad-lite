import * as THREE from 'three';

export function attachSelection(
  root: THREE.Object3D,
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pickCb: (obj: THREE.Object3D | null) => void = () => {};

  function onPointerDown(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(root.children, true);
    pickCb(hits.length > 0 ? hits[0].object : null);
  }

  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    onPick(cb: (obj: THREE.Object3D | null) => void) {
      pickCb = cb;
    },
  };
}
