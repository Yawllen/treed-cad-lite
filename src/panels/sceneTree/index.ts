import './sceneTree.css';
import { SceneTreeStore } from './store';
import { createTreeView } from './treeView';

export function mountSceneTree(viewer: any) {
  const el = document.getElementById('scene-tree');
  if (!el) return;
  const store = new SceneTreeStore(viewer);
  createTreeView(store, el);
}
