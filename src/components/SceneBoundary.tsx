import { Component, type ReactNode } from 'react'
import { webglAvailable } from '../scene/webgl'

interface SceneBoundaryProps {
  title: string
  message: string
  children: ReactNode
}

export class SceneBoundary extends Component<SceneBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed || !webglAvailable()) {
      return (
        <div className="error-card scene-fallback" role="status">
          <strong>{this.props.title}</strong>
          <p>{this.props.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
