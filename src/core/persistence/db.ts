import { openDB } from 'idb'
import type { Node } from '../featureTree'

const DB_NAME = 'treed-cad-browser'
const STORE = 'projects'

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(db){
      if (!db.objectStoreNames.contains(STORE)){
        db.createObjectStore(STORE)
      }
    }
  })
}

export async function saveProject(data: { nodes: Node[] }){
  const d = await db()
  await d.put(STORE, data, 'last')
}

export async function loadLastProject(): Promise<{ nodes: Node[] }|null>{
  const d = await db()
  return await d.get(STORE, 'last')
}
