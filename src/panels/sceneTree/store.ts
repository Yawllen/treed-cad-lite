import type { SceneNode } from '../../types/scene';
import {
  loadState,
  saveState,
  migrateFromLocalStorageIfAny,
  type SceneStateItem,
} from '../../persistence/sceneStateDB';

export type SceneTreeEvents = 'update' | 'selection';

export class SceneTreeStore extends EventTarget {
  nodes: SceneNode[] = [];
  selected: string[] = [];
  viewer: any;
  private ignoreNextUpdate = false;

  constructor(viewer: any) {
    super();
    this.viewer = viewer;
    (async () => {
      await migrateFromLocalStorageIfAny();
      await this.reload();
    })();
    viewer.on('object-added', () => this.reload());
    viewer.on('object-removed', () => this.reload());
    viewer.on('updated', () => {
      if (this.ignoreNextUpdate) {
        this.ignoreNextUpdate = false;
        return;
      }
      this.reload();
    });
    viewer.on('selection-changed', (ids: string[]) => {
      this.selected = ids;
      this.dispatchEvent(new CustomEvent('selection'));
    });
  }

  async reload() {
    const saved = await loadState();
    this.nodes = this.viewer.getSceneGraph();
    this.nodes.forEach((n) => {
      const st = saved[n.id];
      if (st) {
        if (n.name !== st.name) this.viewer.rename(n.id, st.name);
        if (n.visible !== st.visible) this.viewer.setVisible(n.id, st.visible);
        if (n.locked !== st.locked) this.viewer.setLocked(n.id, st.locked);
        n.name = st.name;
        n.visible = st.visible;
        n.locked = st.locked;
      }
    });

    const sorted = [...this.nodes];
    sorted.sort((a, b) => {
      const sa = saved[a.id]?.order;
      const sb = saved[b.id]?.order;
      if (sa == null && sb == null) return this.nodes.indexOf(a) - this.nodes.indexOf(b);
      if (sa == null) return 1;
      if (sb == null) return -1;
      return sa - sb;
    });
    const currentIds = this.nodes.map((n) => n.id);
    const sortedIds = sorted.map((n) => n.id);
    if (sortedIds.some((id, i) => id !== currentIds[i])) {
      this.ignoreNextUpdate = true;
      this.viewer.reorder(sortedIds);
      this.nodes = sorted;
    } else {
      this.nodes = sorted;
    }

    await this.save();
    this.dispatchEvent(new CustomEvent('update', { detail: this.nodes }));
  }

  async save() {
    const map: Record<string, SceneStateItem> = {};
    this.nodes.forEach((n, i) => {
      map[n.id] = { name: n.name, visible: n.visible, locked: n.locked, order: i };
    });
    await saveState(map);
  }

  select(id: string) {
    this.viewer.select([id]);
  }
  toggleVisible(id: string) {
    const n = this.nodes.find((x) => x.id === id);
    if (!n) return;
    this.viewer.setVisible(id, !n.visible);
  }
  toggleLocked(id: string) {
    const n = this.nodes.find((x) => x.id === id);
    if (!n) return;
    this.viewer.setLocked(id, !n.locked);
  }
  rename(id: string, name: string) {
    this.viewer.rename(id, name);
  }
  delete(id: string) {
    this.viewer.delete(id);
  }
  async reorder(id: string, beforeId: string | null) {
    const order = this.nodes.map((n) => n.id);
    const from = order.indexOf(id);
    if (from === -1) return;
    order.splice(from, 1);
    const to = beforeId ? order.indexOf(beforeId) : order.length;
    order.splice(to, 0, id);
    this.ignoreNextUpdate = true;
    this.viewer.reorder(order);
    await this.reload();
  }
}

