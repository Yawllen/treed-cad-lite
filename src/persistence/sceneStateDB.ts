export type SceneStateItem = {
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
};

const DB_NAME = 'treed.sceneTree.v1';
const STORE_NAME = 'state';
const KEY = 'map';
const LS_KEY = 'sceneTreeState';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadState(): Promise<Record<string, SceneStateItem>> {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY);
      req.onsuccess = () => resolve((req.result as any) || {});
      req.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

export async function saveState(map: Record<string, SceneStateItem>): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(map, KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    /* ignore */
  }
}

export async function migrateFromLocalStorageIfAny(): Promise<void> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const map = JSON.parse(raw) as Record<string, SceneStateItem>;
    await saveState(map);
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}

