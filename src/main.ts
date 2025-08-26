import './style.css';
import { makeViewer } from './viewer';
import { makeLayout } from '@ui/layout/makeLayout';
import { createContextMenu } from '@ui/createContextMenu';
import { ru } from '@ui/locale/ru';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Не найден элемент <div id="root">');
}

const { canvas } = makeLayout(root);
const viewer = makeViewer(canvas);

const menu = createContextMenu(document.body);
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  menu.open(e.clientX, e.clientY, [
    { label: ru.context.move, value: 'move' },
    { label: ru.context.rotate, value: 'rotate' },
    { label: ru.context.scale, value: 'scale' },
    { label: ru.context.delete, value: 'delete' },
  ]);
});
menu.onSelect((val) => console.log('context', val));

document.addEventListener('keydown', (e) => {
  const tag =
    (document.activeElement && (document.activeElement as HTMLElement).tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  const key = e.key.toLowerCase();
  if (key === 'm') {
    viewer.setModeTranslate();
  } else if (key === 'q') {
    viewer.setModeRotate();
  } else if (key === 'f') {
    viewer.setModeScale();
  } else if (key === 'e') {
    console.log('Extrude');
  } else if (key === 'l') {
    console.log('Line');
  } else if (key === 'r') {
    console.log('Rectangle');
  } else if (key === 'c') {
    console.log('Circle');
  } else if (key === 's') {
    console.log('Show shortcuts');
  } else if (e.key === 'Delete') {
    console.log('Delete');
  } else if (e.key === 'Escape') {
    viewer.detachSelection();
  }
});
