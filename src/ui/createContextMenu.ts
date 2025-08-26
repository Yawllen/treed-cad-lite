type MenuItem = { label: string; value: string };

export function createContextMenu(mountEl: HTMLElement) {
  const menu = document.createElement('ul');
  menu.style.position = 'absolute';
  menu.style.display = 'none';
  menu.style.listStyle = 'none';
  menu.style.margin = '0';
  menu.style.padding = '4px';
  menu.style.background = '#333';
  menu.style.color = '#fff';
  mountEl.appendChild(menu);

  let selectCb: (val: string) => void = () => {};

  function open(x: number, y: number, items: MenuItem[]) {
    menu.innerHTML = '';
    items.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item.label;
      li.style.padding = '2px 8px';
      li.addEventListener('click', () => {
        menu.style.display = 'none';
        selectCb(item.value);
      });
      menu.appendChild(li);
    });
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.display = 'block';
  }

  function onSelect(cb: (value: string) => void) {
    selectCb = cb;
  }

  document.addEventListener('click', () => (menu.style.display = 'none'));

  return { open, onSelect };
}
