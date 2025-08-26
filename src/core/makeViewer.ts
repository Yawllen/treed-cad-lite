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
  setSelectionMode: (mode: 'planes' | 'bodies') => void;
  getSelectedPlane: () =>
    | {
        objectId: string;
        faceIds: number[];
        origin: THREE.Vector3;
        normal: THREE.Vector3;
      }
    | null;
  getSceneGraph: () => SceneNode[];
  on: (
    event:
      | 'object-added'
      | 'object-removed'
      | 'selection-changed'
      | 'updated'
      | 'plane-selected',
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
  let isOrbiting = false;
  let transformMode: 'translate' | 'rotate' | 'scale' | null = null;
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

  orbit.addEventListener('start', () => {
    isOrbiting = true;
    picker.setHoverEnabled(false);
    clearHoverPlane();
    clearHoverBody();
  });
  orbit.addEventListener('end', () => {
    isOrbiting = false;
    picker.setHoverEnabled(true);
  });

  let selectionMode: 'planes' | 'bodies' = 'planes';

  let selected: THREE.Object3D | null = null;
  let selectedBodyHelper: THREE.Object3D | null = null;
  let hoverBodyHelper: THREE.Object3D | null = null;

  let selectedPlane:
    | {
        objectId: string;
        faceIds: number[];
        origin: THREE.Vector3;
        normal: THREE.Vector3;
      }
    | null = null;
  let selectedPlaneHelper: THREE.Object3D | null = null;
  let hoverPlaneHelper: THREE.Object3D | null = null;

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

  function disposeHelper(helper: THREE.Object3D | null) {
    if (helper && helper.parent) {
      helper.parent.remove(helper);
      (helper as any).traverse?.((child: any) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
  }

  function clearHoverPlane() {
    disposeHelper(hoverPlaneHelper);
    hoverPlaneHelper = null;
  }

  function clearSelectedPlane() {
    disposeHelper(selectedPlaneHelper);
    selectedPlaneHelper = null;
    if (selectedPlane) {
      selectedPlane = null;
      emit('plane-selected', null);
    }
  }

  function clearHoverBody() {
    disposeHelper(hoverBodyHelper);
    hoverBodyHelper = null;
  }

  function clearSelectedBody() {
    disposeHelper(selectedBodyHelper);
    selectedBodyHelper = null;
    if (selected) {
      selected = null;
      gizmo.detach();
      emit('selection-changed', []);
    }
  }

  function getTopObject(obj: THREE.Object3D): THREE.Object3D {
    let top: THREE.Object3D = obj;
    while (top.parent && top.parent !== objectsGroup && top.parent !== scene) {
      top = top.parent;
    }
    return top;
  }

  function buildPlaneHelper(
    mesh: THREE.Mesh,
    faceIndex: number,
  ): { helper: THREE.Object3D; faceIds: number[]; normal: THREE.Vector3 } | null {
    const geom = mesh.geometry as THREE.BufferGeometry;
    const pos = geom.getAttribute('position') as THREE.BufferAttribute;
    const index = geom.index ? geom.index.array : undefined;
    const triCount = index ? index.length / 3 : pos.count / 3;
    const getFace = (fi: number) =>
      index
        ? [index[fi * 3], index[fi * 3 + 1], index[fi * 3 + 2]]
        : [fi * 3, fi * 3 + 1, fi * 3 + 2];
    const getVert = (i: number) => new THREE.Vector3().fromBufferAttribute(pos, i);
    const [ia, ib, ic] = getFace(faceIndex);
    const a = getVert(ia);
    const b = getVert(ib);
    const c = getVert(ic);
    const baseNormal = new THREE.Triangle(a, b, c).getNormal(new THREE.Vector3());
    const baseConstant = -baseNormal.dot(a);
    const cosTol = Math.cos(THREE.MathUtils.degToRad(2));
    const distTol = 1e-4;
    const faceIds: number[] = [];
    const edges = new Map<string, number>();
    const va = new THREE.Vector3();
    const vb = new THREE.Vector3();
    const vc = new THREE.Vector3();
    const n = new THREE.Vector3();
    function addEdge(i1: number, i2: number) {
      const key = i1 < i2 ? `${i1},${i2}` : `${i2},${i1}`;
      edges.set(key, (edges.get(key) || 0) + 1);
    }
    for (let f = 0; f < triCount; f++) {
      const [i1, i2, i3] = getFace(f);
      va.fromBufferAttribute(pos, i1);
      vb.fromBufferAttribute(pos, i2);
      vc.fromBufferAttribute(pos, i3);
      new THREE.Triangle(va, vb, vc).getNormal(n);
      if (n.dot(baseNormal) >= cosTol) {
        const constant = -n.dot(va);
        if (Math.abs(constant - baseConstant) <= distTol) {
          faceIds.push(f);
          addEdge(i1, i2);
          addEdge(i2, i3);
          addEdge(i3, i1);
        }
      }
    }
    const adj = new Map<number, number[]>();
    edges.forEach((count, key) => {
      if (count === 1) {
        const [s1, s2] = key.split(',').map(Number);
        if (!adj.has(s1)) adj.set(s1, []);
        if (!adj.has(s2)) adj.set(s2, []);
        (adj.get(s1) as number[]).push(s2);
        (adj.get(s2) as number[]).push(s1);
      }
    });
    const start = adj.keys().next().value as number | undefined;
    if (start === undefined) return null;
    const outlineIdx: number[] = [start];
    let prev = -1;
    while (true) {
      const cur = outlineIdx[outlineIdx.length - 1];
      const neighbors = adj.get(cur) || [];
      const next = neighbors.find((v) => v !== prev);
      if (next === undefined || next === start) break;
      outlineIdx.push(next);
      prev = cur;
    }
    const outlineVerts = outlineIdx.map((i) => getVert(i));
    const planeOrigin = a.clone();
    const u = new THREE.Vector3(1, 0, 0);
    if (Math.abs(u.dot(baseNormal)) > 0.9) u.set(0, 1, 0);
    u.cross(baseNormal).normalize();
    const v = baseNormal.clone().cross(u).normalize();
    const pts2d = outlineVerts.map((p) => {
      const vec = p.clone().sub(planeOrigin);
      return new THREE.Vector2(vec.dot(u), vec.dot(v));
    });
    const shape = new THREE.Shape();
    shape.moveTo(pts2d[0].x, pts2d[0].y);
    for (let i = 1; i < pts2d.length; i++) shape.lineTo(pts2d[i].x, pts2d[i].y);
    const shapeGeom = new THREE.ShapeGeometry(shape);
    const m = new THREE.Matrix4();
    m.makeBasis(u, v, baseNormal);
    m.setPosition(planeOrigin);
    shapeGeom.applyMatrix4(m);
    const outlineGeom = new THREE.BufferGeometry().setFromPoints(outlineVerts);
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
      depthTest: false,
    });
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x000000,
      depthTest: false,
    });
    const fill = new THREE.Mesh(shapeGeom, fillMat);
    const outline = new THREE.LineLoop(outlineGeom, lineMat);
    fill.renderOrder = 999;
    outline.renderOrder = 999;
    (fill as any).raycast = () => {};
    (outline as any).raycast = () => {};
    (fill as any).userData.isHelper = true;
    (outline as any).userData.isHelper = true;
    const helper = new THREE.Group();
    helper.add(fill);
    helper.add(outline);
    (helper as any).raycast = () => {};
    (helper as any).userData.isHelper = true;
    return { helper, faceIds, normal: baseNormal.clone() };
  }

  function hoverPlane(hit: THREE.Intersection | null) {
    clearHoverPlane();
    if (!hit || !hit.face) return;
    const mesh = hit.object as THREE.Mesh;
    const res = buildPlaneHelper(mesh, hit.faceIndex ?? 0);
    if (!res) return;
    mesh.add(res.helper);
    hoverPlaneHelper = res.helper;
  }

  function selectPlane(hit: THREE.Intersection) {
    if (!hit.face) {
      clearSelectedPlane();
      return;
    }
    const mesh = hit.object as THREE.Mesh;
    const res = buildPlaneHelper(mesh, hit.faceIndex ?? 0);
    if (!res) return;
    clearSelectedPlane();
    mesh.add(res.helper);
    selectedPlaneHelper = res.helper;
    selectedPlane = {
      objectId: getTopObject(mesh).uuid,
      faceIds: res.faceIds,
      origin: hit.point.clone(),
      normal: res.normal
        .clone()
        .transformDirection(mesh.matrixWorld)
        .normalize(),
    };
    emit('plane-selected', {
      objectId: selectedPlane.objectId,
      faceIds: [...selectedPlane.faceIds],
      origin: selectedPlane.origin.clone(),
      normal: selectedPlane.normal.clone(),
    });
  }

  function getFirstMesh(obj: THREE.Object3D): THREE.Mesh | null {
    let res: THREE.Mesh | null = null;
    obj.traverse((child) => {
      if (res) return;
      if ((child as THREE.Mesh).isMesh) res = child as THREE.Mesh;
    });
    return res;
  }

  function addBodyHelper(obj: THREE.Object3D): THREE.Object3D | null {
    const mesh = getFirstMesh(obj);
    if (!mesh) return null;
    const geom = new THREE.EdgesGeometry(mesh.geometry as THREE.BufferGeometry);
    const mat = new THREE.LineBasicMaterial({ color: 0xffff00, depthTest: false });
    const lines = new THREE.LineSegments(geom, mat);
    lines.renderOrder = 999;
    (lines as any).raycast = () => {};
    (lines as any).userData.isHelper = true;
    mesh.add(lines);
    return lines;
  }

  function hoverBody(hit: THREE.Intersection | null) {
    clearHoverBody();
    if (!hit) return;
    const top = getTopObject(hit.object);
    if (selected && top === selected) return;
    const helper = addBodyHelper(top);
    if (helper) hoverBodyHelper = helper;
  }

  function selectObject(obj: THREE.Object3D) {
    const top = getTopObject(obj);
    clearSelectedBody();
    selected = top;
    selectedBodyHelper = addBodyHelper(top);
    if (transformMode) {
      gizmo.attach(selected);
      gizmo.setMode(transformMode);
      gizmo.enabled = !(selected as any).userData?.locked;
    } else {
      gizmo.detach();
    }
    emit('selection-changed', [selected.uuid]);
  }

  function detachSelection() {
    clearSelectedPlane();
    clearSelectedBody();
  }

  function setSelectionMode(mode: 'planes' | 'bodies') {
    if (selectionMode === mode) return;
    selectionMode = mode;
    clearHoverPlane();
    clearHoverBody();
    detachSelection();
  }

  picker.onHover((hit) => {
    if (isDragging || isOrbiting) return;
    if (selectionMode === 'planes') {
      hoverPlane(hit);
      clearHoverBody();
    } else {
      hoverBody(hit);
      clearHoverPlane();
    }
  });

  picker.onClick((hit) => {
    if (isDragging || isOrbiting) return;
    const overGizmo = ((gizmo as any).axis ?? null) !== null;
    if (overGizmo) return;
    if (selectionMode === 'planes') {
      if (hit) {
        selectPlane(hit);
        clearSelectedBody();
      } else {
        clearSelectedPlane();
      }
    } else {
      if (hit) {
        selectObject(hit.object);
        clearSelectedPlane();
      } else {
        detachSelection();
      }
    }
  });

  function addAndSelect(mesh: THREE.Object3D) {
    objectsGroup.add(mesh);
    clearSelectedPlane();
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
    transformMode = 'translate';
    gizmo.setMode('translate');
    if (selected) {
      gizmo.attach(selected);
      gizmo.enabled = !(selected as any).userData?.locked;
    }
  }
  function setModeRotate() {
    transformMode = 'rotate';
    gizmo.setMode('rotate');
    if (selected) {
      gizmo.attach(selected);
      gizmo.enabled = !(selected as any).userData?.locked;
    }
  }
  function setModeScale() {
    transformMode = 'scale';
    gizmo.setMode('scale');
    if (selected) {
      gizmo.attach(selected);
      gizmo.enabled = !(selected as any).userData?.locked;
    }
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

  function getSelectedPlane() {
    if (!selectedPlane) return null;
    return {
      objectId: selectedPlane.objectId,
      faceIds: [...selectedPlane.faceIds],
      origin: selectedPlane.origin.clone(),
      normal: selectedPlane.normal.clone(),
    };
  }

  function select(ids: string[]) {
    if (!ids.length) {
      detachSelection();
      return;
    }
    const obj = findById(ids[0]);
    if (obj) {
      clearSelectedPlane();
      selectObject(obj);
    }
  }

  function setVisible(id: string, v: boolean) {
    const obj = findById(id);
    if (!obj) return;
    obj.visible = v;
    if (selected && selected.uuid === id) detachSelection();
    if (selectedPlane && selectedPlane.objectId === id) clearSelectedPlane();
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
    if (selectedPlane && selectedPlane.objectId === id) clearSelectedPlane();
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
    setSelectionMode,
    getSceneGraph,
    on,
    getSelectedPlane,
    select,
    setVisible,
    setLocked,
    rename,
    delete: deleteObj,
    reorder,
  };
}
