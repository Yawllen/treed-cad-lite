import React, { useState } from 'react'

type Axis = 'x' | 'y' | 'z'

type Props = {
  onCreate: (cfg: { count: number; spacing: number; axis: Axis }) => void
}

export default function ArrayPanel({ onCreate }: Props){
  const [count, setCount] = useState(5)
  const [spacing, setSpacing] = useState(30)
  const [axis, setAxis] = useState<Axis>('x')

  return (
    <div className="card">
      <h3>Линейный массив</h3>
      <div className="small">Создаёт копии выделенного</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
        <div>
          <div className="small">Count</div>
          <input
            type="number"
            min={1}
            value={count}
            onChange={(e) => {
              const next = parseInt(e.target.value || '1', 10)
              setCount(Math.max(1, Number.isNaN(next) ? 1 : next))
            }}
          />
        </div>
        <div>
          <div className="small">Spacing</div>
          <input
            type="number"
            step={1}
            value={spacing}
            onChange={(e) => {
              const next = parseFloat(e.target.value || '0')
              setSpacing(Number.isNaN(next) ? 0 : next)
            }}
          />
        </div>
        <div>
          <div className="small">Axis</div>
          <select value={axis} onChange={(e) => setAxis(e.target.value as Axis)}>
            <option value="x">X</option>
            <option value="y">Y</option>
            <option value="z">Z</option>
          </select>
        </div>
      </div>
      <button className="btn" style={{ marginTop: 8 }} onClick={() => onCreate({ count, spacing, axis })}>
        Create Array
      </button>
      <div className="small" style={{ marginTop: 6 }}>
        Хоткей: <kbd>L</kbd>
      </div>
    </div>
  )
}
