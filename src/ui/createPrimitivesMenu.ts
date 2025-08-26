export type PrimitiveKind =
  | 'Куб'
  | 'Цилиндр'
  | 'Сфера'
  | 'Тор'
  | 'Пружина'
  | 'Труба';

const icons: Record<PrimitiveKind, string> = {
  Куб: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 8l9-5 9 5v8l-9 5-9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></svg>`,
  Цилиндр: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><ellipse cx="12" cy="6" rx="8" ry="4"/><path d="M4 6v12c0 2.2 3.6 4 8 4s8-1.8 8-4V6"/><ellipse cx="12" cy="18" rx="8" ry="4"/></svg>`,
  Сфера: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="4" ry="9"/></svg>`,
  Тор: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><circle cx="12" cy="12" r="6"/></svg>`,
  Пружина: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6c4 0 4 4 8 4s4-4 8-4M4 14c4 0 4 4 8 4s4-4 8-4"/></svg>`,
  Труба: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M4 4v16M20 4v16"/></svg>`,
};

export function createPrimitivesMenu(opts: {
  mount: HTMLElement;
  onSelect: (kind: PrimitiveKind) => void;
}): { destroy(): void } {
  const { mount, onSelect } = opts;
  const root = document.createElement('div');
  root.className = 'td-primitives';

  const style = document.createElement('style');
  style.textContent = `
    .td-primitives{position:fixed;top:12px;right:12px;z-index:10;font-family:sans-serif;}
    .td-primitives button{cursor:pointer;font:inherit;}
    .td-primitives .menu-btn{padding:4px 8px;}
    .td-primitives .list{display:none;position:absolute;top:100%;right:0;background:#fff;border:1px solid #ccc;box-shadow:0 2px 6px rgba(0,0,0,0.15);}
    .td-primitives.open .list{display:block;}
    .td-primitives .item{display:flex;align-items:center;gap:4px;padding:4px 8px;background:none;border:none;width:100%;text-align:left;}
    .td-primitives .item:hover{background:#eee;}
    .td-primitives svg{width:24px;height:24px;}
  `;
  root.appendChild(style);

  const button = document.createElement('button');
  button.className = 'menu-btn';
  button.textContent = 'Примитивы ▾';
  root.appendChild(button);

  const list = document.createElement('div');
  list.className = 'list';
  root.appendChild(list);

  const kinds: PrimitiveKind[] = ['Куб', 'Цилиндр', 'Сфера', 'Тор', 'Пружина', 'Труба'];
  kinds.forEach((k) => {
    const item = document.createElement('button');
    item.className = 'item';
    item.innerHTML = `${icons[k]}<span>${k}</span>`;
    item.addEventListener('click', () => {
      onSelect(k);
      root.classList.remove('open');
    });
    list.appendChild(item);
  });

  function toggle(e: Event) {
    e.stopPropagation();
    root.classList.toggle('open');
  }
  function handleDoc(e: MouseEvent) {
    if (!root.contains(e.target as Node)) root.classList.remove('open');
  }
  button.addEventListener('click', toggle);
  document.addEventListener('click', handleDoc);

  mount.appendChild(root);

  return {
    destroy() {
      document.removeEventListener('click', handleDoc);
      root.remove();
    },
  };
}
