// src/viewer.ts — логика 3D‑сцены (Z‑вверх, выбор объектов, TransformControls)

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

export function makeViewer(canvas: HTMLCanvasElement) {
  // Вверх = Z (как в CAD)
  THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

  // Рендерер
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Сцена
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f1115);

  // Камера
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 5000);
  camera.up.set(0, 0, 1);
  camera.position.set(100, 100, 100);

  // Орбит‑контролы
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;

  // Сетка пола (XY), шаг 10 мм
  const grid = new THREE.GridHelper(400, 40, 0x444444, 0x222222);
  grid.rotateX(Math.PI / 2); // XZ -> XY (Z вверх)
  scene.add(grid);

  // Оси (X=красн, Y=зел, Z=син)
  scene.add(new THREE.AxesHelper(100));

  // Свет
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(200, 200, 300);
  scene.add(dirLight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  // ---- TransformControls ----
  const gizmo = new TransformControls(camera, renderer.domElement);
  scene.add(gizmo as unknown as THREE.Object3D);

  // При перетаскивании гизмо — отключаем орбит‑контролы
  gizmo.addEventListener('dragging-changed', (e) => {
    // @ts-ignore — TS не знает про поле .value, но оно есть
    orbit.enabled = !e.value;
  });

  // Привязки (snapping)
  gizmo.setTranslationSnap(1); // 1 мм
  gizmo.setRotationSnap(THREE.MathUtils.degToRad(15)); // 15°
  gizmo.setScaleSnap(0.1); // шаг масштаба

  // ---- Выбор объектов кликом ----
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pickables: THREE.Object3D[] = [];
  let selected: THREE.Object3D | null = null;

  function setSelected(obj: THREE.Object3D | null) {
    if (selected && (selected as any).material?.emissive) {
      ((selected as any).material.emissive as THREE.Color).setHex(0x000000);
    }
    selected = obj;
    if (selected && (selected as any).material?.emissive) {
      ((selected as any).material.emissive as THREE.Color).setHex(0x111111);
      gizmo.attach(selected);
    } else {
      gizmo.detach();
    }
  }

  function updatePointer(event: PointerEvent) {
    const rect = (renderer.domElement as HTMLCanvasElement).getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  renderer.domElement.addEventListener('pointerdown', (event: PointerEvent) => {
    // @ts-ignore — TS не знает про dragging, но он есть
    if (gizmo.dragging) return;
    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickables, false);
    if (hits.length > 0) setSelected(hits[0].object);
    else setSelected(null);
  });

  // ---- Ресайз ----
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- Рендер‑цикл ----
  function tick() {
    orbit.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  // ---- Примитивы (низ на Z=0) ----

  // Куб 20×20×20: центр на Z=10
  function addCube() {
    const geometry = new THREE.BoxGeometry(20, 20, 20);
    const material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 10);
    scene.add(mesh);
    pickables.push(mesh);
    setSelected(mesh);
  }

  // Сфера r=10: центр на Z=10
  function addSphere() {
    const geometry = new THREE.SphereGeometry(10, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 10);
    scene.add(mesh);
    pickables.push(mesh);
    setSelected(mesh);
  }

  // Цилиндр D=20, H=20: высота по Z
  function addCylinder() {
    const geometry = new THREE.CylinderGeometry(10, 10, 20, 32);
    geometry.rotateX(Math.PI / 2); // ось высоты Y -> Z
    const material = new THREE.MeshStandardMaterial({ color: 0x44ff44 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 10);
    scene.add(mesh);
    pickables.push(mesh);
    setSelected(mesh);
  }

  function detachSelection() { setSelected(null); }
  function setModeTranslate() { gizmo.setMode('translate'); }
  function setModeRotate()    { gizmo.setMode('rotate'); }
  function setModeScale()     { gizmo.setMode('scale');  }

  return {
    scene,
    camera,
    renderer,
    controls: orbit,
    addCube,
    addSphere,
    addCylinder,
    detachSelection,
    setModeTranslate,
    setModeRotate,
    setModeScale
  };
}
