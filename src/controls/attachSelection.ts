import * as THREE from 'three';

export function attachSelection(
  root: THREE.Object3D,
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoverCb: (hit: THREE.Intersection | null) => void = () => {};
  let clickCb: (hit: THREE.Intersection | null) => void = () => {};
  let hoverEnabled = true;
  let downPos: { x: number; y: number } | null = null;

  function getHit(e: PointerEvent): THREE.Intersection | null {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster
      .intersectObjects(root.children, true)
      .filter((h) => {
        let obj: THREE.Object3D | null = h.object;
        while (obj) {
          if ((obj as any).userData?.isHelper) return false;
          obj = obj.parent;
        }
        return true;
      });
    return hits.length > 0 ? hits[0] : null;
  }
  function onPointerMove(e: PointerEvent) {
    if (!hoverEnabled) return;
    hoverCb(getHit(e));
  }

  function onPointerDown(e: PointerEvent) {
    downPos = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp(e: PointerEvent) {
    if (!downPos) return;
    const dx = e.clientX - downPos.x;
    const dy = e.clientY - downPos.y;
    downPos = null;
    if (dx * dx + dy * dy > 4) return;
    clickCb(getHit(e));
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);

  return {
    onHover(cb: (hit: THREE.Intersection | null) => void) {
      hoverCb = cb;
    },
    onClick(cb: (hit: THREE.Intersection | null) => void) {
      clickCb = cb;
    },
    setHoverEnabled(v: boolean) {
      hoverEnabled = v;
      if (!v) hoverCb(null);
    },
  };
}
