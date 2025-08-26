// src/main.ts — главный вход приложения

import './style.css';
import { makeViewer } from './viewer';
import { mountSceneTree } from './panels/sceneTree';

// Находим <canvas id="app">
const elem = document.getElementById('app');
if (!elem || !(elem instanceof HTMLCanvasElement)) {
  throw new Error('Не найдена канва <canvas id="app"> в index.html');
}
const canvas = elem as HTMLCanvasElement;

// Создаём сцену
const viewer = makeViewer(canvas);

// Доступ из консоли для отладки
// @ts-ignore
(window as any).viewer = viewer;

// Панель дерева сцены
mountSceneTree(viewer);
const tree = document.getElementById('scene-tree')!;

// Кнопки меню «Примитивы»
document.getElementById('btn-cube')?.addEventListener('click', () => viewer.addCube());
document.getElementById('btn-sphere')?.addEventListener('click', () => viewer.addSphere());
document.getElementById('btn-cylinder')?.addEventListener('click', () => viewer.addCylinder());

// Селектор режима выбора: плоскости или тела
const modeSel = document.getElementById('mode-select') as HTMLSelectElement | null;
if (modeSel) {
  viewer.setSelectionMode((modeSel.value as 'planes' | 'bodies') || 'planes');
  modeSel.addEventListener('change', () =>
    viewer.setSelectionMode(modeSel.value as 'planes' | 'bodies'),
  );
}

// Горячие клавиши: W — перемещение, E — поворот, R — масштаб, Esc — снять выделение
document.addEventListener('keydown', (e) => {
  const tag = (document.activeElement && (document.activeElement as HTMLElement).tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  if (e.key === 't' || e.key === 'T') {
    tree.classList.toggle('is-hidden');
  } else if (e.key === 'w' || e.key === 'W') {
    viewer.setModeTranslate();
  } else if (e.key === 'e' || e.key === 'E') {
    viewer.setModeRotate();
  } else if (e.key === 'r' || e.key === 'R') {
    viewer.setModeScale();
  } else if (e.key === 'Escape') {
    viewer.detachSelection();
  }
});
