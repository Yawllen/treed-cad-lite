import * as THREE from 'three';
import { createScene, createCamera, createGrid, createLights } from '@scene';
import {
  createOrbitControls,
  createTransformControls,
  attachSelection,
} from '@controls';
import { addCube, addSphere, addCylinder } from '@ops';

export type ViewerAPI = {
  addCube: () => void;
  addSphere: () => void;
  addCylinder: () => void;
  setModeTranslate: () => void;
  setModeRotate: () => void;
  setModeScale: () => void;
  detachSelection: () => void;
};

export function makeViewer(canvas: HTMLCanvasElement): ViewerAPI {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = createScene();

  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  const camera = createCamera(width, height);

  scene.add(createLights());
  scene.add(createGrid());
  scene.add(new THREE.AxesHelper(2));

  const orbit = createOrbitControls(camera, canvas);
  const gizmo = createTransformControls(camera, canvas) as any;

  const gizmoRoot =
    (gizmo && gizmo._root && gizmo._root.isObject3D && gizmo._root) ||
    (gizmo && gizmo.root && gizmo.root.isObject3D && gizmo.root) ||
    (gizmo && gizmo.isObject3D && gizmo);
  if (gizmoRoot && gizmoRoot.isObject3D) {
    scene.add(gizmoRoot);
  } else {
    if (gizmo?._gizmo?.isObject3D) scene.add(gizmo._gizmo);
    if (gizmo?._plane?.isObject3D) scene.add(gizmo._plane);
    console.warn(
      'TransformControls не Object3D; добавлены его внутренние узлы (_gizmo/_plane).',
    );
  }

  let isDragging = false;
  gizmo.addEventListener('dragging-changed', (e: unknown) => {
    const dragging = Boolean((e as { value?: unknown })?.value);
    isDragging = dragging;
    orbit.enabled = !dragging;
  });

  function resizeToWindow() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w && h ? w / h : 1;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resizeToWindow);
  resizeToWindow();

  const objectsGroup = new THREE.Group();
  scene.add(objectsGroup);

  const picker = attachSelection(objectsGroup, camera, canvas);

  let selected: THREE.Object3D | null = null;

  picker.onPick((obj) => {
    if (isDragging) return;
    const overGizmo = ((gizmo as any).axis ?? null) !== null;
    if (overGizmo) return;
    if (obj) {
      selectObject(obj);
    } else {
      detachSelection();
    }
  });

  function selectObject(obj: THREE.Object3D) {
    let top: THREE.Object3D = obj;
    while (top.parent && top.parent !== objectsGroup && top.parent !== scene) {
      top = top.parent;
    }
    selected = top;
    gizmo.attach(selected);
  }

  function detachSelection() {
    selected = null;
    gizmo.detach();
  }

  function addAndSelect(mesh: THREE.Object3D) {
    objectsGroup.add(mesh);
    selectObject(mesh);
  }

  function addCubeOp() {
    addAndSelect(addCube());
  }

  function addSphereOp() {
    addAndSelect(addSphere());
  }

  function addCylinderOp() {
    addAndSelect(addCylinder());
  }

  function setModeTranslate() {
    gizmo.setMode('translate');
  }
  function setModeRotate() {
    gizmo.setMode('rotate');
  }
  function setModeScale() {
    gizmo.setMode('scale');
  }

  function loop() {
    requestAnimationFrame(loop);
    orbit.update();
    resizeToWindow();
    renderer.render(scene, camera);
  }
  loop();

  return {
    addCube: addCubeOp,
    addSphere: addSphereOp,
    addCylinder: addCylinderOp,
    setModeTranslate,
    setModeRotate,
    setModeScale,
    detachSelection,
  };
}
