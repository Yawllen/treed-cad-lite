import { create } from 'zustand'
import { produce } from 'immer'

export type TRS = {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

export type Node =
  | { type:'cube', params:{ size:number }, uuid:string, transform?: TRS }
  | { type:'sphere', params:{ radius:number }, uuid:string, transform?: TRS }
  | { type:'cylinder', params:{ radiusTop:number, radiusBottom:number, height:number }, uuid:string, transform?: TRS }
  | { type:'extrude', params:{ shape:'rect'|'circle', w:number, h:number, depth:number }, uuid:string, transform?: TRS }

type State = {
  nodes: Node[]
  past: Node[][]
  future: Node[][]
  add: (n: Node) => void
  addMany: (arr: Node[]) => void
  removeByUUID: (id: string) => void
  updateTransform: (id: string, trs: TRS) => void
  load: (data: { nodes: Node[] }) => void
  undo: () => void
  redo: () => void
  clear: () => void
  serialize: () => { nodes: Node[] }
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

function equalTRS(a?: TRS, b?: TRS){
  if (!a || !b) return false
  return (
    a.position.every((v, i) => v === b.position[i]) &&
    a.rotation.every((v, i) => v === b.rotation[i]) &&
    a.scale.every((v, i) => v === b.scale[i])
  )
}

export const useFeatureTree = create<State>((set, get) => ({
  nodes: [],
  past: [],
  future: [],

  add: (n) => set(produce((s: State) => {
    s.past.push(clone(s.nodes))
    s.nodes.push(n)
    s.future = []
  })),

  addMany: (arr) => set(produce((s: State) => {
    if (!arr.length) return
    s.past.push(clone(s.nodes))
    s.nodes.push(...arr.map(item => clone(item)))
    s.future = []
  })),

  removeByUUID: (id) => set(produce((s: State) => {
    s.past.push(clone(s.nodes))
    s.nodes = s.nodes.filter(n => n.uuid !== id)
    s.future = []
  })),

  updateTransform: (id, trs) => set(produce((s: State) => {
    const target = s.nodes.find(n => n.uuid === id)
    if (!target) return
    if (equalTRS(target.transform, trs)) return
    s.past.push(clone(s.nodes))
    target.transform = clone(trs)
    s.future = []
  })),

  load: (d) => set({ nodes: d.nodes ?? [], past: [], future: [] }),

  undo: () => set(produce((s: State) => {
    if (!s.past.length) return
    s.future.push(clone(s.nodes))
    s.nodes = s.past.pop()!
  })),

  redo: () => set(produce((s: State) => {
    if (!s.future.length) return
    s.past.push(clone(s.nodes))
    s.nodes = s.future.pop()!
  })),

  clear: () => set({ nodes: [], past: [], future: [] }),

  serialize: () => ({ nodes: get().nodes }),
}))
