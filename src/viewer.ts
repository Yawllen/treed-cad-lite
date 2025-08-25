// src/viewer.ts  — файл с логикой 3D‑сцены

// Импортируем весь three.js как одно пространство имён "THREE"
import * as THREE from 'three';
// Импортируем готовые контролы камеры (вращение/зум мышью)
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Экспортируем функцию, чтобы вызывать её из main.ts
export function makeViewer(canvas: HTMLCanvasElement) {
  // Создаём "рендерер" — объект, который рисует 3D‑картинку в нашей канве
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,   // говорим: рисуй в <canvas id="app">
    antialias: true,  // сглаживание — картинка выглядит приятнее
    alpha: false      // фон непрозрачный — для CAD это ок
  });

  // Настраиваем плотность пикселей: не выше 2, чтобы не грузить видеокарту на 4K/retina
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Создаём сцену — это как "контейнер", куда мы добавляем все объекты
  const scene = new THREE.Scene();
  // Задаём цвет фона сцены (тёмный, комфортный для глаз)
  scene.background = new THREE.Color(0x0f1115);

  // Создаём камеру перспективы: (угол обзора 60°, "картинка" 1:1, ближняя и дальняя плоскости)
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  // Ставим камеру чуть в стороне и сверху, чтобы было видно сетку и оси
  camera.position.set(3, 3, 3);

  // Добавляем "контролы" — это управление камерой мышью (крутить/приближать)
  const controls = new OrbitControls(camera, renderer.domElement);
  // Делаем движение камеры плавным
  controls.enableDamping = true;

  // Добавляем сетку пола — помогает понять масштаб и ориентацию
  // Параметры: размер 200, делений 200, цвета линий (тёмно‑серые)
  const grid = new THREE.GridHelper(200, 200, 0x444444, 0x222222);
  scene.add(grid);

  // Добавляем оси XYZ — красная X, зелёная Y, синяя Z
  const axes = new THREE.AxesHelper(1.5); // длина осей 1.5 условных единиц
  scene.add(axes);

  // Добавляем свет: направленный (как "солнце") и фоновый
  const dirLight = new THREE.DirectionalLight(0xffffff, 1); // белый свет, мощность 1
  dirLight.position.set(5, 10, 5); // положение источника света в пространстве
  scene.add(dirLight);
  const ambLight = new THREE.AmbientLight(0xffffff, 0.25); // слабый общий свет
  scene.add(ambLight);

  // Функция, которая подгоняет размер "картинки" под размер окна браузера
  function resize() {
    // Берём ширину/высоту окна — наша канва растянута на весь экран
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Говорим рендереру рисовать ровно в эти размеры (без размытия)
    renderer.setSize(w, h, false);
    // Обновляем "соотношение сторон" для камеры и применяем изменения
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // Подписываемся на событие изменения размеров окна (чтобы всё подстраивалось)
  window.addEventListener('resize', resize);
  // Вызываем один раз при старте, чтобы сразу выставить правильные размеры
  resize();

  // Главный цикл отрисовки — будет вызываться примерно 60 раз в секунду
  function tick() {
    controls.update();            // обновляем плавность управления камерой
    renderer.render(scene, camera); // рисуем кадр: "сцена + камера"
    requestAnimationFrame(tick);  // просим браузер вызвать tick() снова на следующий кадр
  }

  // Запускаем бесконечный цикл отрисовки
  tick();

  // Возвращаем ссылки на полезные объекты — это пригодится позже (например, чтобы добавлять примитивы)
  return { scene, camera, renderer, controls };
}
