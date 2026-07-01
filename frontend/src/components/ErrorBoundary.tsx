import React from 'react'

interface Props {
  children: React.ReactNode
  moduleName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="rounded-lg p-6 flex flex-col items-center justify-center"
          style={{ backgroundColor: '#161b22', border: '1px solid #30363d', minHeight: 200 }}
        >
          <div className="text-3xl mb-3">⚠️</div>
          <div className="text-sm font-medium mb-2" style={{ color: '#f85149' }}>
            {this.props.moduleName || '模块'}渲染出错
          </div>
          <div className="text-xs" style={{ color: '#8b949e' }}>
            {this.state.error?.message || '未知错误'}
          </div>
          <button
            className="mt-3 px-3 py-1 rounded text-xs"
            style={{ backgroundColor: '#21262d', color: '#e6edf3', border: '1px solid #30363d' }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
