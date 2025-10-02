import { create } from 'zustand'
import produce from 'immer'

export type Node =
  | { type:'cube', params:{ size:number }, uuid:string }
  | { type:'sphere', params:{ radius:number }, uuid:string }
  | { type:'cylinder', params:{ radiusTop:number, radiusBottom:number, height:number }, uuid:string }
  | { type:'extrude', params:{ shape:'rect'|'circle', w:number, h:number, depth:number }, uuid:string }

type State = {
  nodes: Node[]
  add: (n: Node) => void
  load: (data: { nodes: Node[] }) => void
  serialize: () => { nodes: Node[] }
}

export const useFeatureTree = create<State>((set, get) => ({
  nodes: [],
  add: (n) => set(produce((s:State) => { s.nodes.push(n) })),
  load: (d) => set({ nodes: d.nodes ?? [] }),
  serialize: () => ({ nodes: get().nodes }),
}))
