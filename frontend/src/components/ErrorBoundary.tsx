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
          className="surface rounded-lg p-6 flex flex-col items-center justify-center"
          style={{ minHeight: 200 }}
        >
          <div className="text-3xl mb-3" style={{ color: 'var(--danger)' }}>!</div>
          <div className="text-sm font-medium mb-2" style={{ color: 'var(--danger)' }}>
            {this.props.moduleName || '模块'}渲染出错
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {this.state.error?.message || '未知错误'}
          </div>
          <button
            className="theme-button mt-3 px-3 py-1 rounded text-xs cursor-pointer"
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
