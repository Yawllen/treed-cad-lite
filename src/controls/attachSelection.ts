import * as THREE from 'three';

export function attachSelection(
  root: THREE.Object3D,
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dblDelay = 200;

  let singleCb: (hit: THREE.Intersection | null) => void = () => {};
  let doubleCb: (obj: THREE.Object3D | null) => void = () => {};

  let clickTimer: ReturnType<typeof setTimeout> | null = null;
  let lastHit: THREE.Intersection | null = null;

  function getHit(e: PointerEvent): THREE.Intersection | null {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(root.children, true);
    return hits.length > 0 ? hits[0] : null;
  }

  function onPointerDown(e: PointerEvent) {
    const hit = getHit(e);
    if (
      clickTimer &&
      lastHit &&
      hit &&
      lastHit.object === hit.object
    ) {
      clearTimeout(clickTimer);
      clickTimer = null;
      lastHit = null;
      doubleCb(hit.object);
      return;
    }

    lastHit = hit;
    if (clickTimer) clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      singleCb(lastHit);
      lastHit = null;
      clickTimer = null;
    }, dblDelay);
  }

  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    onSingle(cb: (hit: THREE.Intersection | null) => void) {
      singleCb = cb;
    },
    onDouble(cb: (obj: THREE.Object3D | null) => void) {
      doubleCb = cb;
    },
  };
}
