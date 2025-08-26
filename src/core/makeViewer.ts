import * as THREE from 'three';
import { createScene, createCamera, createGrid, createLights } from '@scene';
import {
  createOrbitControls,
  createTransformControls,
  attachSelection,
} from '@controls';
import { addCube, addSphere, addCylinder } from '@ops';
import type { SceneNode } from '../types/scene';
import { mm } from '@utils';

export type ViewerAPI = {
  addCube: () => void;
  addSphere: () => void;
  addCylinder: () => void;
  setModeTranslate: () => void;
  setModeRotate: () => void;
  setModeScale: () => void;
  detachSelection: () => void;
  getSceneGraph: () => SceneNode[];
  on: (
    event: 'object-added' | 'object-removed' | 'selection-changed' | 'updated',
    cb: (payload: any) => void,
  ) => void;
  select: (ids: string[]) => void;
  setVisible: (id: string, v: boolean) => void;
  setLocked: (id: string, v: boolean) => void;
  rename: (id: string, name: string) => void;
  delete: (id: string) => void;
  reorder: (order: string[]) => void;
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
  scene.add(new THREE.AxesHelper(mm(2)));

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

  const listeners: Record<string, ((d: any) => void)[]> = {};
  function emit(event: string, data?: any) {
    (listeners[event] || []).forEach((cb) => cb(data));
  }
  function on(event: string, cb: (d: any) => void) {
    (listeners[event] || (listeners[event] = [])).push(cb);
  }

  const nameCounters: Record<string, number> = {
    'куб': 1,
    'сфера': 1,
    'цилиндр': 1,
    'конус': 1,
    'тор': 1,
    'эскиз': 1,
    'свет': 1,
    'камера': 1,
    'прочее': 1,
  };

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
    gizmo.enabled = !(selected as any).userData?.locked;
    emit('selection-changed', [selected.uuid]);
  }

  function detachSelection() {
    selected = null;
    gizmo.detach();
     emit('selection-changed', []);
  }

  function addAndSelect(mesh: THREE.Object3D) {
    objectsGroup.add(mesh);
    selectObject(mesh);
    emit('object-added', mesh.uuid);
    emit('updated');
  }

  function addCubeOp() {
    const mesh = addCube();
    mesh.name = `Куб ${nameCounters['куб']++}`;
    (mesh as any).userData.type = 'куб';
    (mesh as any).userData.locked = false;
    addAndSelect(mesh);
  }

  function addSphereOp() {
    const mesh = addSphere();
    mesh.name = `Сфера ${nameCounters['сфера']++}`;
    (mesh as any).userData.type = 'сфера';
    (mesh as any).userData.locked = false;
    addAndSelect(mesh);
  }

  function addCylinderOp() {
    const mesh = addCylinder();
    mesh.name = `Цилиндр ${nameCounters['цилиндр']++}`;
    (mesh as any).userData.type = 'цилиндр';
    (mesh as any).userData.locked = false;
    addAndSelect(mesh);
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

  function findById(id: string): THREE.Object3D | undefined {
    return objectsGroup.getObjectByProperty('uuid', id);
  }

  function getSceneGraph(): SceneNode[] {
    function toNode(obj: THREE.Object3D): SceneNode {
      return {
        id: obj.uuid,
        name: obj.name || 'Объект',
        type: (obj as any).userData.type || 'прочее',
        visible: obj.visible,
        locked: Boolean((obj as any).userData.locked),
        children: obj.children
          .filter((c) => c !== gizmo && c !== gizmoRoot)
          .map((c) => toNode(c)),
      };
    }
    return objectsGroup.children.map((c) => toNode(c));
  }

  function select(ids: string[]) {
    if (!ids.length) {
      detachSelection();
      return;
    }
    const obj = findById(ids[0]);
    if (obj) selectObject(obj);
  }

  function setVisible(id: string, v: boolean) {
    const obj = findById(id);
    if (!obj) return;
    obj.visible = v;
    emit('updated');
  }

  function setLocked(id: string, v: boolean) {
    const obj = findById(id);
    if (!obj) return;
    (obj as any).userData.locked = v;
    if (selected && selected.uuid === id) gizmo.enabled = !v;
    emit('updated');
  }

  function rename(id: string, name: string) {
    const obj = findById(id);
    if (!obj) return;
    obj.name = name;
    emit('updated');
  }

  function deleteObj(id: string) {
    const obj = findById(id);
    if (!obj || !obj.parent) return;
    obj.parent.remove(obj);
    if (selected && selected.uuid === id) detachSelection();
    emit('object-removed', id);
    emit('updated');
  }

  function reorder(order: string[]) {
    objectsGroup.children.sort(
      (a, b) => order.indexOf(a.uuid) - order.indexOf(b.uuid),
    );
    emit('updated');
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
    getSceneGraph,
    on,
    select,
    setVisible,
    setLocked,
    rename,
    delete: deleteObj,
    reorder,
  };
}
