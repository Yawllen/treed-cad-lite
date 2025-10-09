import React from 'react'
import { usePrefs } from '@/core/prefs'

type Props = {
  onExportSTL: () => void
  onExport3MF: () => void
}

export default function ExportPanel({ onExportSTL, onExport3MF }: Props){
  const selectionOnly = usePrefs(s => s.exportSelectionOnly)
  const stlAscii = usePrefs(s => s.exportStlAscii)
  const setSelectionOnly = usePrefs(s => s.setExportSelectionOnly)
  const setStlAscii = usePrefs(s => s.setExportStlAscii)

  return (
    <div className="card">
      <h3>Экспорт</h3>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={selectionOnly}
          onChange={e => setSelectionOnly(e.target.checked)}
        />
        Selection only
      </label>
      <div className="small" style={{ marginTop: 8 }}>STL mode</div>
      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="radio"
            name="stl-mode"
            checked={!stlAscii}
            onChange={() => setStlAscii(false)}
          />
          Binary
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="radio"
            name="stl-mode"
            checked={stlAscii}
            onChange={() => setStlAscii(true)}
          />
          ASCII
        </label>
      </div>
      <button className="btn" style={{ marginTop: 12 }} onClick={onExportSTL}>
        Export STL
      </button>
      <button className="btn" style={{ marginTop: 8 }} onClick={onExport3MF}>
        Export 3MF
      </button>
      <div className="small" style={{ marginTop: 6 }}>
        <kbd>E</kbd> — Export STL, <kbd>⇧E</kbd> — Toggle Selection only
      </div>
    </div>
  )
}
