// src/viewer.ts
// Надёжный viewer под Vite + Three r179. Совместим с твоим main.ts (экспортирует makeViewer).
// Ключевой фикс: TransformControls в этом билде — НЕ Object3D, поэтому в сцену добавляем его _root (Object3D).

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

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
  // --- Renderer / Scene / Camera ---
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f1115);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(6, 6, 10);

  // --- Lights & Helpers ---
  const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.7);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 10, 7);
  scene.add(dir);

  const grid = new THREE.GridHelper(100, 100, 0x3a3a3a, 0x2a2a2a);
  scene.add(grid);
  const axes = new THREE.AxesHelper(2);
  scene.add(axes);

  // --- Controls ---
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.08;
  orbit.target.set(0, 0, 0);

  const gizmo = new TransformControls(camera, renderer.domElement) as any;

  // ⛳️ КЛЮЧ: Сам gizmo не Object3D → добавляем в сцену его корневой узел (_root), который Object3D.
  const gizmoRoot =
    (gizmo && gizmo._root && gizmo._root.isObject3D && gizmo._root) ||
    (gizmo && gizmo.root && gizmo.root.isObject3D && gizmo.root) ||
    (gizmo && gizmo.isObject3D && gizmo); // на случай классической сборки

  if (gizmoRoot && gizmoRoot.isObject3D) {
    scene.add(gizmoRoot);
  } else {
    // крайний fallback: чтобы контрол был в сцене, добавим его внутренности
    if (gizmo?._gizmo?.isObject3D) scene.add(gizmo._gizmo);
    if (gizmo?._plane?.isObject3D) scene.add(gizmo._plane);
    console.warn('TransformControls не Object3D; добавлены его внутренние узлы (_gizmo/_plane).');
  }

  // Флаги состояния гизмо/указателя
  let isDragging = false;
  gizmo.addEventListener('dragging-changed', (e: unknown) => {
    const dragging = Boolean((e as { value?: unknown })?.value);
    isDragging = dragging;
    orbit.enabled = !dragging;
  });

  // --- Resize (под full-screen canvas) ---
  function resizeToWindow() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = (w && h) ? w / h : 1;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resizeToWindow);
  resizeToWindow();

  // --- Objects bucket ---
  const objectsGroup = new THREE.Group();
  scene.add(objectsGroup);

  function makeMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x8aa1ff,
      metalness: 0.1,
      roughness: 0.6,
    });
  }

  function addCube() {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.Mesh(geo, makeMat());
    mesh.position.set(0, 0.5, 0);
    mesh.frustumCulled = false;
    objectsGroup.add(mesh);
    selectObject(mesh);
  }

  function addSphere() {
    const geo = new THREE.SphereGeometry(0.6, 32, 16);
    const mesh = new THREE.Mesh(geo, makeMat());
    mesh.position.set(0, 0.6, 0);
    mesh.frustumCulled = false;
    objectsGroup.add(mesh);
    selectObject(mesh);
  }

  function addCylinder() {
    const geo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 32);
    const mesh = new THREE.Mesh(geo, makeMat());
    mesh.position.set(0, 0.6, 0);
    mesh.frustumCulled = false;
    objectsGroup.add(mesh);
    selectObject(mesh);
  }

  // --- Picking ---
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let selected: THREE.Object3D | null = null;

  function updatePointer(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pickUnderPointer(e: PointerEvent) {
    updatePointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(objectsGroup.children, true);
    if (hits.length > 0) {
      const hit = hits[0].object;
      selectObject(hit);
      return true;
    }
    return false;
  }

  function selectObject(obj: THREE.Object3D) {
    // поднимаемся до верхнего узла в группе
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

  // Не мешаем гизмо: если перетаскиваем — не пикаем
  canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    if (isDragging) return;
    // Если курсор над ручкой гизмо — тоже не пикаем
    const overGizmo = ((gizmo as any).axis ?? null) !== null;
    if (overGizmo) return;

    const hit = pickUnderPointer(e);
    if (!hit) detachSelection();
  });

  // --- Modes API ---
  function setModeTranslate() {
    gizmo.setMode('translate');
  }
  function setModeRotate() {
    gizmo.setMode('rotate');
  }
  function setModeScale() {
    gizmo.setMode('scale');
  }

  // --- Loop ---
  function loop() {
    requestAnimationFrame(loop);
    orbit.update();
    resizeToWindow();
    renderer.render(scene, camera);
  }
  loop();

  return {
    addCube,
    addSphere,
    addCylinder,
    setModeTranslate,
    setModeRotate,
    setModeScale,
    detachSelection,
  };
}
