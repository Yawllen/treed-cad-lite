import { create } from 'zustand'

type Prefs = {
  snapEnabled: boolean
  moveSnap: number
  rotSnapDeg: number
  scaleSnap: number
  setEnabled: (v: boolean) => void
  setMove: (v: number) => void
  setRotDeg: (v: number) => void
  setScale: (v: number) => void
}

export const usePrefs = create<Prefs>((set) => ({
  snapEnabled: true,
  moveSnap: 1,
  rotSnapDeg: 15,
  scaleSnap: 0.1,
  setEnabled: (v) => set({ snapEnabled: v }),
  setMove: (v) => set({ moveSnap: Math.max(0.0001, v) }),
  setRotDeg: (v) => set({ rotSnapDeg: Math.max(0.0001, v) }),
  setScale: (v) => set({ scaleSnap: Math.max(0.0001, v) }),
}))
