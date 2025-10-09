import React from 'react'

type Props = { children: React.ReactNode }
type State = { err: unknown }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { err: null }
  }

  static getDerivedStateFromError(err: unknown): State {
    return { err }
  }

  componentDidCatch(err: unknown, info: unknown) {
    console.error('Runtime error in UI', err, info)
  }

  render() {
    if (this.state.err) {
      const message = this.state.err instanceof Error ? this.state.err.stack ?? this.state.err.message : String(this.state.err)
      return (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#120c24',
            color: '#fff',
            padding: 16,
            zIndex: 1000,
            overflow: 'auto',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
          }}
        >
          <h3>Runtime error</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{message}</pre>
        </div>
      )
    }

    return this.props.children as React.ReactElement
  }
}
