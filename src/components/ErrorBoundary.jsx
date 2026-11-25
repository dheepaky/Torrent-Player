import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Torrent Player] Uncaught UI error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (window.location.hash) {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090b10] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#121620] border border-[#1e2536] rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center text-xl font-bold">
              ⚡
            </div>
            <h2 className="text-lg font-bold text-white">Something went wrong</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected error occurred while loading this stream. You can return home or retry loading.
            </p>
            {this.state.error && (
              <pre className="text-[11px] font-mono text-rose-400 bg-[#0c0f17] p-2.5 rounded-lg overflow-x-auto text-left border border-rose-500/20">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div className="flex gap-2 pt-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  window.location.hash = ''
                  window.location.reload()
                }}
                className="px-4 py-2 bg-[#181d2a] hover:bg-[#202738] text-slate-300 border border-[#283247] rounded-xl text-xs font-medium cursor-pointer transition-colors"
              >
                Go to Home
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
