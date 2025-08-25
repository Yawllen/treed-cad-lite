// src/main.ts — главный вход приложения

// Импортируем стили, чтобы канва была на весь экран и фон был тёмный
import './style.css';

// Импортируем нашу функцию, которая создаёт сцену
import { makeViewer } from './viewer';

// Находим элемент с id="app" в index.html — это наша <canvas>
const elem = document.getElementById('app'); // получаем ссылку на элемент по id

// Проверяем, что элемент существует и что это именно CANVAS, а не DIV
if (!elem || !(elem instanceof HTMLCanvasElement)) {
  // Если что‑то не так, бросаем ошибку — это поможет быстрее заметить проблему
  throw new Error('Не найдена канва <canvas id="app"> в index.html');
}

// Запускаем нашу 3D‑сцену и получаем доступ к её объектам
const viewer = makeViewer(elem);

// (Необязательно) Делаем viewer доступным из консоли браузера для отладки
// Теперь в DevTools можно набрать window.viewer, чтобы смотреть scene/camera
// @ts-ignore - подсказываем TS, что это ок для отладки
(window as any).viewer = viewer;
