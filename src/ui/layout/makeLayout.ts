export type LayoutRefs = {
  canvas: HTMLCanvasElement;
};

export function makeLayout(root: HTMLElement): LayoutRefs {
  const layout = document.createElement('div');
  layout.id = 'layout';

  const toolbar = document.createElement('div');
  toolbar.id = 'toolbar';
  toolbar.textContent = 'Toolbar';

  const main = document.createElement('div');
  main.id = 'main';

  const browser = document.createElement('div');
  browser.id = 'browser';
  browser.textContent = 'Browser';

  const inspector = document.createElement('div');
  inspector.id = 'inspector';
  inspector.textContent = 'Inspector';

  const canvas = document.createElement('canvas');
  canvas.id = 'app';

  main.append(browser, canvas, inspector);

  const timeline = document.createElement('div');
  timeline.id = 'timeline';
  timeline.textContent = 'Timeline';

  layout.append(toolbar, main, timeline);
  root.append(layout);

  return { canvas };
}
