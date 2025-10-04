import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { makeViewer, Viewer } from './core/makeViewer'
import { createCube, createCylinder, createSphere, createExtruded } from './core/primitives'
import type { Node, TRS } from './core/featureTree'
import { useFeatureTree } from './core/featureTree'
import { usePrefs } from './core/prefs'
import { saveProject, loadLastProject } from './core/persistence/db'
import ShortcutsOverlay from './ui/ShortcutsOverlay'
import SelectionInspector from './ui/SelectionInspector'
import SnapPanel from './ui/SnapPanel'
import ArrayPanel from './ui/ArrayPanel'
import MirrorPanel from './ui/MirrorPanel'

type Axis = 'x' | 'y' | 'z'
type Mode = 'copy' | 'flip'

const App: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null)
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [showTips, setShowTips] = useState(false)
  const syncingSceneRef = useRef(false)
  const skipSceneSyncRef = useRef(false)
  const nodes = useFeatureTree(s => s.nodes)
  const addNode = useFeatureTree(s => s.add)
  const addMany = useFeatureTree(s => s.addMany)
  const removeByUUID = useFeatureTree(s => s.removeByUUID)
  const updateTransform = useFeatureTree(s => s.updateTransform)
  const undo = useFeatureTree(s => s.undo)
  const redo = useFeatureTree(s => s.redo)
  const loadTree = useFeatureTree(s => s.load)
  const clearTree = useFeatureTree(s => s.clear)
  const snapEnabled = usePrefs(s => s.snapEnabled)
  const moveSnap = usePrefs(s => s.moveSnap)
  const rotSnapDeg = usePrefs(s => s.rotSnapDeg)
  const scaleSnap = usePrefs(s => s.scaleSnap)
  const setSnapEnabled = usePrefs(s => s.setEnabled)
  const [lastArrayCfg, setLastArrayCfg] = useState<{ count: number; spacing: number; axis: Axis }>({ count: 5, spacing: 30, axis: 'x' })
  const [lastMirror, setLastMirror] = useState<{ axis: Axis; mode: Mode }>({ axis: 'x', mode: 'copy' })

  const deleteSelected = React.useCallback(() => {
    if (!viewer) return
    const sel = viewer.getSelection()
    if (!sel) return
    viewer.remove(sel)
    removeByUUID(sel.uuid)
  }, [viewer, removeByUUID])

  function isHelper(o: any){ return !!(o?.userData?.__helper) || o?.isTransformControls || o?.name === '__outline' }

  function meshToTRS(m: THREE.Object3D){
    return {
      position: [m.position.x, m.position.y, m.position.z] as [number, number, number],
      rotation: [m.rotation.x, m.rotation.y, m.rotation.z] as [number, number, number],
      scale: [m.scale.x, m.scale.y, m.scale.z] as [number, number, number],
    }
  }

  function trsEquals(a?: TRS, b?: TRS){
    if (!a || !b) return false
    return (
      a.position.every((v, i) => v === b.position[i]) &&
      a.rotation.every((v, i) => v === b.rotation[i]) &&
      a.scale.every((v, i) => v === b.scale[i])
    )
  }

  const applyTRS = React.useCallback((m: THREE.Object3D, t?: TRS) => {
    if (!t) return
    m.position.set(...t.position)
    m.rotation.set(t.rotation[0], t.rotation[1], t.rotation[2], 'XYZ')
    m.scale.set(...t.scale)
  }, [])

  const buildMeshFromNode = React.useCallback((n: Node): THREE.Mesh => {
    let mesh: THREE.Mesh
    if (n.type === 'cube') mesh = createCube(n.params as any)
    else if (n.type === 'sphere') mesh = createSphere(n.params as any)
    else if (n.type === 'cylinder') mesh = createCylinder(n.params as any)
    else mesh = createExtruded(n.params as any)
    mesh.uuid = n.uuid
    applyTRS(mesh, n.transform)
    return mesh
  }, [applyTRS])

  const snapshotSelectedToStore = React.useCallback((triggerInvalidate = false) => {
    if (!viewer) return
    const sel = viewer.getSelection()
    if (!sel) return
    const trs = meshToTRS(sel)
    const state = useFeatureTree.getState()
    const node = state.nodes.find(n => n.uuid === sel.uuid)
    if (!node) return
    if (node.transform && trsEquals(node.transform, trs)) return
    skipSceneSyncRef.current = true
    updateTransform(sel.uuid, trs)
    if (triggerInvalidate) viewer.invalidate()
  }, [viewer, updateTransform])

  const findNodeByUUID = React.useCallback((id: string) => nodes.find(n => n.uuid === id), [nodes])

  const buildNodeCopyWithOffset = React.useCallback((n: Node, i: number, axis: Axis, spacing: number): Node => {
    const base = n.transform ?? { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }
    const position = [...base.position] as TRS['position']
    const rotation = [...base.rotation] as TRS['rotation']
    const scale = [...base.scale] as TRS['scale']
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    position[axisIndex] = position[axisIndex] + i * spacing
    const uuid = globalThis.crypto?.randomUUID?.() ?? THREE.MathUtils.generateUUID()
    return { ...n, uuid, transform: { position, rotation, scale } }
  }, [])

  const createArrayFromSelection = React.useCallback((cfg: { count: number; spacing: number; axis: Axis }) => {
    if (!viewer) return
    const sel = viewer.getSelection()
    if (!sel) return
    const src = findNodeByUUID(sel.uuid)
    if (!src) return

    const toAdd: Node[] = []
    for (let i = 1; i < cfg.count; i += 1) {
      toAdd.push(buildNodeCopyWithOffset(src, i, cfg.axis, cfg.spacing))
    }
    if (!toAdd.length) return

    skipSceneSyncRef.current = true
    addMany(toAdd)

    const updatedNodes = useFeatureTree.getState().nodes
    syncSceneToNodes(undefined, updatedNodes)

    const lastUUID = toAdd[toAdd.length - 1].uuid
    const obj = viewer.scene.getObjectByProperty('uuid', lastUUID) as THREE.Object3D | null
    if (obj) viewer.setSelection(obj)
    viewer.invalidate()
  }, [viewer, findNodeByUUID, buildNodeCopyWithOffset, addMany, syncSceneToNodes])

  const handleCreateArray = React.useCallback((cfg: { count: number; spacing: number; axis: Axis }) => {
    setLastArrayCfg(cfg)
    createArrayFromSelection(cfg)
  }, [createArrayFromSelection])

  const mirrorTRS = React.useCallback((trs: TRS, axis: Axis): TRS => {
    const position = [...trs.position] as TRS['position']
    const index = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    position[index] = -position[index]
    return {
      position,
      rotation: [...trs.rotation] as TRS['rotation'],
      scale: [...trs.scale] as TRS['scale'],
    }
  }, [])

  const mirrorSelection = React.useCallback((cfg: { axis: Axis; mode: Mode }) => {
    if (!viewer) return
    const sel = viewer.getSelection()
    if (!sel) return

    const node = nodes.find(n => n.uuid === sel.uuid)
    if (!node) return

    const base: TRS = node.transform ?? { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }
    const next = mirrorTRS(base, cfg.axis)

    if (cfg.mode === 'flip') {
      skipSceneSyncRef.current = true
      updateTransform(sel.uuid, next)
      applyTRS(sel, next)
      viewer.invalidate()
      return
    }

    const copy: Node = {
      ...node,
      uuid: globalThis.crypto?.randomUUID?.() ?? THREE.MathUtils.generateUUID(),
      transform: next,
    }

    skipSceneSyncRef.current = true
    addMany([copy])
    const updatedNodes = useFeatureTree.getState().nodes
    syncSceneToNodes(undefined, updatedNodes)
    const obj = viewer.scene.getObjectByProperty('uuid', copy.uuid) as THREE.Object3D | null
    if (obj) viewer.setSelection(obj)
    viewer.invalidate()
  }, [viewer, nodes, mirrorTRS, updateTransform, applyTRS, addMany, syncSceneToNodes])

  const handleMirror = React.useCallback((cfg: { axis: Axis; mode: Mode }) => {
    setLastMirror(cfg)
    mirrorSelection(cfg)
  }, [mirrorSelection])

  const duplicateSelected = React.useCallback(() => {
    if (!viewer) return
    const sel = viewer.getSelection()
    if (!sel) return

    const node = nodes.find(n => n.uuid === sel.uuid)
    if (!node) return

    const newId = globalThis.crypto?.randomUUID?.() ?? THREE.MathUtils.generateUUID()
    const offset: TRS = {
      position: [sel.position.x + 10, sel.position.y, sel.position.z],
      rotation: [sel.rotation.x, sel.rotation.y, sel.rotation.z],
      scale: [sel.scale.x, sel.scale.y, sel.scale.z],
    }

    const newNode: Node = { ...node, uuid: newId, transform: offset }

    addNode(newNode)

    const mesh = buildMeshFromNode(newNode)
    viewer.addMesh(mesh, { select: false })
    viewer.setSelection(mesh)
    viewer.invalidate()
  }, [viewer, nodes, addNode, buildMeshFromNode])

  const getSceneSnapshot = React.useCallback((): { nodes: Node[] } => {
    if (!viewer) return { nodes }
    const map = new Map<string, THREE.Object3D>()
    viewer.scene.traverse((o: any) => {
      if (o.uuid && o.isObject3D && o.isMesh && !isHelper(o)) map.set(o.uuid, o)
    })
    const enriched = nodes.map(n => {
      const obj = map.get(n.uuid)
      return obj ? { ...n, transform: meshToTRS(obj) } : n
    })
    return { nodes: enriched as Node[] }
  }, [viewer, nodes])

  const syncSceneToNodes = React.useCallback((targetViewer: Viewer | null = viewer, targetNodes: Node[] = useFeatureTree.getState().nodes) => {
    const actualViewer = targetViewer ?? viewer
    if (!actualViewer) return

    syncingSceneRef.current = true
    try {
      const prevSelectionId = actualViewer.selection.current?.uuid ?? null
      const toRemove: THREE.Object3D[] = []
      actualViewer.scene.traverse((o: any) => {
        if (o.isMesh && !isHelper(o)) toRemove.push(o)
      })
      toRemove.forEach(o => actualViewer.remove(o))

      for (const n of targetNodes) {
        const mesh = buildMeshFromNode(n)
        actualViewer.addMesh(mesh, { select: false })
      }

      if (prevSelectionId) {
        const next = actualViewer.scene.getObjectByProperty('uuid', prevSelectionId) as THREE.Object3D | null
        if (next && (next as any).isMesh) actualViewer.select(next)
        else actualViewer.select(null)
      } else {
        actualViewer.select(null)
      }
    } finally {
      syncingSceneRef.current = false
    }
  }, [viewer, buildMeshFromNode])

  useEffect(() => {
    if (!mountRef.current) return
    const v = makeViewer(mountRef.current)
    setViewer(v)
    ;(async () => {
      const proj = await loadLastProject()
      if (proj) {
        loadTree(proj)
        syncSceneToNodes(v, proj.nodes ?? [])
      }
    })()
    return () => v.dispose()
  }, [loadTree])

  // autosave
  useEffect(() => {
    if (!viewer) return
    const unsub = viewer.onChange(() => saveProject(getSceneSnapshot()))
    return () => unsub()
  }, [viewer, getSceneSnapshot])

  useEffect(() => {
    if (!viewer) return
    viewer.applySnap({ enabled: snapEnabled, move: moveSnap, rotDeg: rotSnapDeg, scale: scaleSnap })
  }, [viewer, snapEnabled, moveSnap, rotSnapDeg, scaleSnap])

  useEffect(() => {
    if (!viewer) return
    const toggle = () => {
      const current = usePrefs.getState().snapEnabled
      setSnapEnabled(!current)
    }
    viewer.setSnapToggleHandler(toggle)
    return () => viewer.setSnapToggleHandler(null)
  }, [viewer, setSnapEnabled])

  useEffect(() => {
    if (!viewer) return
    const unsub = viewer.onChange(() => {
      if (syncingSceneRef.current) return
      snapshotSelectedToStore()
    })
    return () => unsub()
  }, [viewer, snapshotSelectedToStore])

  useEffect(() => {
    function onKey(e: KeyboardEvent){
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); return }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
          syncSceneToNodes(undefined, useFeatureTree.getState().nodes)
        }
        else {
          undo()
          syncSceneToNodes(undefined, useFeatureTree.getState().nodes)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, deleteSelected, syncSceneToNodes])

  useEffect(() => {
    function onKey(e: KeyboardEvent){
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicateSelected()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [duplicateSelected])

  useEffect(() => {
    function onKey(e: KeyboardEvent){
      if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        handleCreateArray(lastArrayCfg)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleCreateArray, lastArrayCfg])

  useEffect(() => {
    function onKey(e: KeyboardEvent){
      if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        handleMirror(lastMirror)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleMirror, lastMirror])

  useEffect(() => {
    function onKey(e: KeyboardEvent){
      if (e.key === 'Escape' && showTips) {
        setShowTips(false)
      }
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault()
        setShowTips(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showTips])

  useEffect(() => {
    if (skipSceneSyncRef.current) {
      skipSceneSyncRef.current = false
      return
    }
    syncSceneToNodes()
  }, [nodes, syncSceneToNodes])

  function addCube() {
    if (!viewer) return
    const mesh = createCube({ size: 40 })
    viewer.addMesh(mesh)
    addNode({ type: 'cube', params: { size: 40 }, uuid: mesh.uuid })
  }

  function addSphere() {
    if (!viewer) return
    const mesh = createSphere({ radius: 20 })
    viewer.addMesh(mesh)
    addNode({ type: 'sphere', params: { radius: 20 }, uuid: mesh.uuid })
  }

  function addCylinder() {
    if (!viewer) return
    const mesh = createCylinder({ radiusTop: 18, radiusBottom: 18, height: 50 })
    viewer.addMesh(mesh)
    addNode({
      type: 'cylinder',
      params: { radiusTop: 18, radiusBottom: 18, height: 50 },
      uuid: mesh.uuid,
    })
  }

  function addExtrudedRect() {
    if (!viewer) return
    const mesh = createExtruded({ shape: 'rect', w: 40, h: 24, depth: 18 })
    viewer.addMesh(mesh)
    addNode({
      type: 'extrude',
      params: { shape: 'rect', w: 40, h: 24, depth: 18 },
      uuid: mesh.uuid,
    })
  }

  async function onSaveJSON(){
    const data = getSceneSnapshot()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'project.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function onLoadJSON(){
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      const f = input.files?.[0]
      if (!f) return
      const text = await f.text()
      try {
        const parsed = JSON.parse(text)
        if (!Array.isArray(parsed?.nodes)) throw new Error('Invalid file')
        loadTree({ nodes: parsed.nodes })
        syncSceneToNodes()
      } catch (e) {
        alert('Invalid JSON')
      }
    }
    input.click()
  }

  function onNew(){
    clearTree()
    syncSceneToNodes()
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span>🟣 TreeD CAD — Browser</span>
          <span className="small">Minimal CAD snapshot</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={onNew}>New</button>
          <button className="btn" onClick={onSaveJSON}>Save (.json)</button>
          <button className="btn" onClick={onLoadJSON}>Load (.json)</button>
          <button className="btn" onClick={duplicateSelected}>Duplicate (Ctrl+D)</button>
          <button className="btn" onClick={() => { viewer?.alignSelectionToGround(); snapshotSelectedToStore(true) }}>Ground (⇧G)</button>
          <button className="btn" onClick={() => { viewer?.centerSelectionXZ(); snapshotSelectedToStore(true) }}>Center XZ (⇧C)</button>
          <button className="btn" onClick={() => { viewer?.resetSelectionTRS(); snapshotSelectedToStore(true) }}>Reset (⇧R)</button>
          <button className="btn" onClick={() => viewer?.fitSelectionOrAll()}>Fit (F)</button>
          <button className="btn" onClick={() => setShowTips(true)}>?</button>
          {/* без экспортов под 3D печать */}
        </div>
      </div>

      <div className="left">
        <div className="card toolbar">
          <h3>Примитивы</h3>
          <button onClick={addCube}>Куб</button>
          <button onClick={addSphere}>Сфера</button>
          <button onClick={addCylinder}>Цилиндр</button>
          <button onClick={addExtrudedRect}>Экструзия (прямоуг.)</button>
          <hr />
          <div className="small">G — переместить, R — повернуть, S — масштаб.</div>
        </div>
      </div>

      <div className="main">
        <div className="canvas-wrap" ref={mountRef} />
      </div>

      <div className="right">
        <SelectionInspector viewer={viewer} />
        <SnapPanel />
        <MirrorPanel onMirror={handleMirror} />
        <ArrayPanel onCreate={handleCreateArray} />
        <div className="card">
          <h3>История</h3>
          <ul>{nodes.map(n => <li key={n.uuid}>{n.type}</li>)}</ul>
        </div>
      </div>
      <ShortcutsOverlay open={showTips} onClose={() => setShowTips(false)} />
    </div>
  )
}

export default App
