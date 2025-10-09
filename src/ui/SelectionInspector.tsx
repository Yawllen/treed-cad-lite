import React from 'react'
import * as THREE from 'three'
import type { Viewer } from '../core/makeViewer'
import { useFeatureTree } from '../core/featureTree'

type Props = { viewer: Viewer | null }
function toDeg(r: number){ return (r * 180) / Math.PI }
function toRad(d: number){ return (d * Math.PI) / 180 }
function display(n: number, decimals = 3){
  const factor = 10 ** decimals
  return Math.round(n * factor) / factor
}

export default function SelectionInspector({ viewer }: Props){
  const updateTransform = useFeatureTree(s => s.updateTransform)
  const nodes = useFeatureTree(s => s.nodes)

  const [, force] = React.useReducer(x => x + 1, 0)
  React.useEffect(() => {
    if (!viewer) return
    return viewer.onChange(() => force())
  }, [viewer])

  const sel: THREE.Object3D | null = viewer?.getSelection() ?? null
  const selectionNode = React.useMemo(
    () => nodes.find(n => n.uuid === sel?.uuid),
    [nodes, sel?.uuid],
  )
  const disabled = !viewer || !sel || !selectionNode

  const p = sel?.position ?? new THREE.Vector3()
  const r = sel?.rotation ?? new THREE.Euler()
  const s = sel?.scale ?? new THREE.Vector3(1, 1, 1)

  function apply(){
    if (!viewer || !sel) return
    const trs = {
      position: [sel.position.x, sel.position.y, sel.position.z] as [number, number, number],
      rotation: [sel.rotation.x, sel.rotation.y, sel.rotation.z] as [number, number, number],
      scale: [sel.scale.x, sel.scale.y, sel.scale.z] as [number, number, number],
    }
    updateTransform(sel.uuid, trs)
    viewer.invalidate()
  }

  function onNum(e: React.ChangeEvent<HTMLInputElement>, kind: 'pos' | 'rot' | 'scl', axis: 'x' | 'y' | 'z'){
    if (!sel) return
    const v = parseFloat(e.target.value)
    if (Number.isNaN(v)) return
    if (kind === 'pos') sel.position[axis] = v
    if (kind === 'rot') sel.rotation[axis] = toRad(v)
    if (kind === 'scl') sel.scale[axis] = Math.max(0.001, v)
    sel.updateMatrixWorld()
    apply()
  }

  return (
    <div className="card">
      <h3>Инспектор</h3>
      <fieldset disabled={disabled} style={{ opacity: disabled ? 0.5 : 1 }}>
        <label>Position</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          <input type="number" step="1" value={display(p.x)} onChange={e => onNum(e, 'pos', 'x')} />
          <input type="number" step="1" value={display(p.y)} onChange={e => onNum(e, 'pos', 'y')} />
          <input type="number" step="1" value={display(p.z)} onChange={e => onNum(e, 'pos', 'z')} />
        </div>
        <label style={{ marginTop: 8 }}>Rotation (°)</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          <input type="number" step="1" value={display(toDeg(r.x), 2)} onChange={e => onNum(e, 'rot', 'x')} />
          <input type="number" step="1" value={display(toDeg(r.y), 2)} onChange={e => onNum(e, 'rot', 'y')} />
          <input type="number" step="1" value={display(toDeg(r.z), 2)} onChange={e => onNum(e, 'rot', 'z')} />
        </div>
        <label style={{ marginTop: 8 }}>Scale</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          <input type="number" step="0.1" value={display(s.x)} onChange={e => onNum(e, 'scl', 'x')} />
          <input type="number" step="0.1" value={display(s.y)} onChange={e => onNum(e, 'scl', 'y')} />
          <input type="number" step="0.1" value={display(s.z)} onChange={e => onNum(e, 'scl', 'z')} />
        </div>
      </fieldset>
      {disabled && <div className="small">Нет выделения</div>}
    </div>
  )
}
