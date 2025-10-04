import React from 'react'
import { usePrefs } from '../core/prefs'

export default function SnapPanel(){
  const enabled = usePrefs(s => s.snapEnabled)
  const move = usePrefs(s => s.moveSnap)
  const rot = usePrefs(s => s.rotSnapDeg)
  const scl = usePrefs(s => s.scaleSnap)
  const setEnabled = usePrefs(s => s.setEnabled)
  const setMove = usePrefs(s => s.setMove)
  const setRot = usePrefs(s => s.setRotDeg)
  const setScl = usePrefs(s => s.setScale)

  return (
    <div className="card">
      <h3>Привязка (Snap)</h3>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        Включить (X)
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
        <div>
          <div className="small">Move</div>
          <input
            type="number"
            step="0.1"
            value={move}
            onChange={e => {
              const next = parseFloat(e.target.value)
              if (Number.isNaN(next)) return
              setMove(next)
            }}
          />
        </div>
        <div>
          <div className="small">Rotate (°)</div>
          <input
            type="number"
            step="1"
            value={rot}
            onChange={e => {
              const next = parseFloat(e.target.value)
              if (Number.isNaN(next)) return
              setRot(next)
            }}
          />
        </div>
        <div>
          <div className="small">Scale</div>
          <input
            type="number"
            step="0.1"
            value={scl}
            onChange={e => {
              const next = parseFloat(e.target.value)
              if (Number.isNaN(next)) return
              setScl(next)
            }}
          />
        </div>
      </div>
    </div>
  )
}
