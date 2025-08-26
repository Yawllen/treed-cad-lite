import { icons } from './icons';
import type { SceneNode } from '../../types/scene';
import { createContextMenu } from '../../ui/createContextMenu';
import { SceneTreeStore } from './store';

const eyeOpen = `<svg viewBox="0 0 24 24"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 10a3 3 0 110-6 3 3 0 010 6z"/></svg>`;
const eyeClosed = `<svg viewBox="0 0 24 24"><path d="M1 1l22 22-1 1-4.9-4.9C15 20 13.5 21 12 21c-7 0-10-7-10-7 1.3-2.5 3-4.4 4.9-5.8L0 2zM12 7a5 5 0 013.9 8.1L7.9 7.1A5 5 0 0112 7z"/></svg>`;
const lockClosed = `<svg viewBox="0 0 24 24"><path d="M6 10V8a6 6 0 1112 0v2h1a1 1 0 011 1v11a1 1 0 01-1 1H5a1 1 0 01-1-1V11a1 1 0 011-1h1zm2 0h8V8a4 4 0 00-8 0v2z"/></svg>`;
const lockOpen = `<svg viewBox="0 0 24 24"><path d="M17 8V6a5 5 0 00-10 0v4H6a1 1 0 00-1 1v11a1 1 0 001 1h12a1 1 0 001-1V11a1 1 0 00-1-1h-1zm-8 0V6a3 3 0 016 0v2H9z"/></svg>`;

export function createTreeView(store: SceneTreeStore, mount: HTMLElement) {
  const root = document.createElement('ul');
  mount.appendChild(root);

  const menu = createContextMenu(document.body);
  let menuTargetId: string | null = null;

  menu.onSelect((val) => {
    const id = menuTargetId;
    if (!id) return;
    if (val === 'rename') startRename(id);
    if (val === 'toggle-visible') store.toggleVisible(id);
    if (val === 'toggle-locked') store.toggleLocked(id);
    if (val === 'delete') store.delete(id);
  });

  function render(nodes: SceneNode[]) {
    root.innerHTML = '';
    nodes.forEach((n) => {
      const li = document.createElement('li');
      li.dataset.id = n.id;
      li.draggable = true;
      if (store.selected.includes(n.id)) li.classList.add('selected');
      if (n.locked) li.classList.add('locked');

      const icon = document.createElement('span');
      icon.innerHTML = icons[n.type] || icons['прочее'];
      li.appendChild(icon);

      const nameSpan = document.createElement('span');
      nameSpan.className = 'name';
      nameSpan.textContent = n.name;
      li.appendChild(nameSpan);

      const actions = document.createElement('span');
      actions.className = 'actions';
      const eye = document.createElement('span');
      eye.className = 'eye';
      eye.innerHTML = n.visible ? eyeOpen : eyeClosed;
      actions.appendChild(eye);
      const lock = document.createElement('span');
      lock.className = 'lock';
      lock.innerHTML = n.locked ? lockClosed : lockOpen;
      actions.appendChild(lock);
      li.appendChild(actions);

      root.appendChild(li);
    });
  }

  function updateSelection() {
    root.querySelectorAll('li').forEach((li) => {
      const id = li.getAttribute('data-id');
      li.classList.toggle('selected', store.selected.includes(id || ''));
    });
  }

  store.addEventListener('update', (e: Event) => {
    render((e as CustomEvent<SceneNode[]>).detail);
  });
  store.addEventListener('selection', updateSelection);

  root.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest('li');
    if (!li) return;
    const id = li.getAttribute('data-id');
    if (!id) return;
    const act = (e.target as HTMLElement).closest('.eye, .lock');
    if (act) {
      if (act.classList.contains('eye')) store.toggleVisible(id);
      else if (act.classList.contains('lock')) store.toggleLocked(id);
      return;
    }
    store.select(id);
  });

  root.addEventListener('dblclick', (e) => {
    const name = (e.target as HTMLElement).closest('.name');
    if (!name) return;
    const li = name.parentElement as HTMLLIElement;
    const id = li.dataset.id!;
    startRename(id);
  });

  root.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const li = (e.target as HTMLElement).closest('li');
    if (!li) return;
    const id = li.getAttribute('data-id');
    if (!id) return;
    menuTargetId = id;
    const node = store.nodes.find((n) => n.id === id)!;
    menu.open(e.clientX, e.clientY, [
      { label: 'Переименовать', value: 'rename' },
      { label: node.visible ? 'Скрыть' : 'Показать', value: 'toggle-visible' },
      { label: node.locked ? 'Разблокировать' : 'Заблокировать', value: 'toggle-locked' },
      { label: 'Удалить', value: 'delete' },
    ]);
  });

  let dragId: string | null = null;
  root.addEventListener('dragstart', (e) => {
    const li = (e.target as HTMLElement).closest('li');
    if (!li) return;
    dragId = li.getAttribute('data-id');
    e.dataTransfer?.setData('text/plain', dragId || '');
  });
  root.addEventListener('dragover', (e) => {
    if (dragId) e.preventDefault();
  });
  root.addEventListener('drop', (e) => {
    e.preventDefault();
    const li = (e.target as HTMLElement).closest('li');
    const targetId = li?.getAttribute('data-id') || null;
    if (dragId) {
      store.reorder(dragId, targetId);
      dragId = null;
    }
  });

  function startRename(id: string) {
    const li = root.querySelector(`li[data-id="${id}"]`);
    if (!li) return;
    const nameSpan = li.querySelector('.name') as HTMLElement;
    const old = nameSpan.textContent || '';
    const input = document.createElement('input');
    input.value = old;
    input.style.width = '100%';
    nameSpan.replaceWith(input);
    input.focus();
    input.select();
    function finish(ok: boolean) {
      const val = ok ? input.value.trim() || old : old;
      store.rename(id, val);
    }
    input.addEventListener('blur', () => finish(true));
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') finish(true);
      else if (ev.key === 'Escape') finish(false);
    });
  }

  render(store.nodes);
}
