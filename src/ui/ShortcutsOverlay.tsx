import React from 'react'

type Props = { open: boolean; onClose: () => void }

export default function ShortcutsOverlay({ open, onClose }: Props) {
  if (!open) return null
  return (
    <div className="sc-overlay" onClick={onClose}>
      <div className="sc-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Горячие клавиши</h3>
        <ul>
          <li><kbd>G</kbd> — перемещение</li>
          <li><kbd>R</kbd> — поворот</li>
          <li><kbd>S</kbd> — масштаб</li>
          <li><kbd>Del</kbd>/<kbd>Backspace</kbd> — удалить</li>
          <li><kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> — Undo/Redo</li>
          <li><kbd>Ctrl</kbd>+<kbd>D</kbd> — дубликат</li>
          <li><kbd>L</kbd> — Linear Array (по последним параметрам)</li>
          <li><kbd>F</kbd> — Fit (выделение или вся сцена)</li>
          <li><kbd>X</kbd> — включить/выключить привязку (Snap)</li>
          <li><kbd>⇧G</kbd> — Align to Ground</li>
          <li><kbd>⇧C</kbd> — Center XZ</li>
          <li><kbd>⇧R</kbd> — Reset transforms</li>
          <li><kbd>?</kbd> — показать/скрыть это окно</li>
        </ul>
      </div>
    </div>
  )
}
