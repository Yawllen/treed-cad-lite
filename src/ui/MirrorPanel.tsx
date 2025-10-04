import React, { useState } from 'react'

type Axis = 'x' | 'y' | 'z'
type Mode = 'copy' | 'flip'

type Props = {
  onMirror: (cfg: { axis: Axis; mode: Mode }) => void
}

export default function MirrorPanel({ onMirror }: Props) {
  const [axis, setAxis] = useState<Axis>('x')
  const [mode, setMode] = useState<Mode>('copy')

  function handleMirror(){
    onMirror({ axis, mode })
  }

  return (
    <div className="card">
      <h3>Зеркало</h3>
      <div className="small">Отражение через начало координат</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
        <label className="small" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Axis</span>
          <select value={axis} onChange={e => setAxis(e.target.value as Axis)}>
            <option value="x">X</option>
            <option value="y">Y</option>
            <option value="z">Z</option>
          </select>
        </label>
        <label className="small" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Mode</span>
          <select value={mode} onChange={e => setMode(e.target.value as Mode)}>
            <option value="copy">Copy</option>
            <option value="flip">Flip</option>
          </select>
        </label>
      </div>
      <button className="btn" style={{ marginTop: 8 }} onClick={handleMirror}>Mirror</button>
      <div className="small" style={{ marginTop: 6 }}>Хоткей: <kbd>M</kbd></div>
    </div>
  )
}
