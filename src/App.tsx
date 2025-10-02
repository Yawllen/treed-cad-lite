import React, { useEffect, useRef, useState } from 'react'
import { makeViewer, Viewer } from './core/makeViewer'
import { createCube, createCylinder, createSphere, createExtruded } from './core/primitives'
import { useFeatureTree } from './core/featureTree'
import { saveProject, loadLastProject } from './core/persistence/db'

const App: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null)
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const nodes = useFeatureTree(s => s.nodes)
  const addNode = useFeatureTree(s => s.add)
  const loadTree = useFeatureTree(s => s.load)
  const serialize = useFeatureTree(s => s.serialize)

  useEffect(() => {
    if (!mountRef.current) return
    const v = makeViewer(mountRef.current)
    setViewer(v)
    ;(async () => {
      const proj = await loadLastProject()
      if (proj) loadTree(proj)
    })()
    return () => v.dispose()
  }, [loadTree])

  // autosave
  useEffect(() => {
    if (!viewer) return
    const unsub = viewer.onChange(() => saveProject(serialize()))
    return () => unsub()
  }, [viewer, serialize])

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

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span>🟣 TreeD CAD — Browser</span>
          <span className="small">Minimal CAD snapshot</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
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
        <div className="card">
          <h3>История</h3>
          <ul>{nodes.map(n => <li key={n.uuid}>{n.type}</li>)}</ul>
        </div>
      </div>

      <div className="main">
        <div className="canvas-wrap" ref={mountRef} />
      </div>

      <div className="right">
        <div className="card">
          <h3>Инспектор</h3>
          <div className="small">Выдели объект кликом и редактируй трансформами.</div>
        </div>
      </div>
    </div>
  )
}

export default App
