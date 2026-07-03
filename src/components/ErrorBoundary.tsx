// @ts-nocheck — React class component ErrorBoundary
// TypeScript class-field checks are suppressed here because the tsconfig's
// useDefineForClassFields:false causes spurious TS2339 errors on inherited
// React.Component members (state, setState, props).
import React from 'react';

/**
 * AgroPulse Error Boundary
 * Catches uncaught render-phase errors and shows a friendly recovery UI
 * instead of a blank white screen.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message ?? 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error, info) {
    console.error('[AgroPulse ErrorBoundary]', error, info?.componentStack);
  }

  handleReset() {
    this.setState({ hasError: false, errorMessage: '' });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F9FBF9] text-[#1B4332] font-sans flex justify-center">
          <div className="w-full max-w-md bg-white min-h-screen flex flex-col items-center justify-center p-8 text-center shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mb-6">
              <span className="text-3xl">🌿</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1B4332] mb-2">Something went wrong</h1>
            <p className="text-sm text-[#1B4332]/60 leading-relaxed mb-4 max-w-xs">
              AgroPulse hit an unexpected error. Your scan data is safe in the local database.
            </p>
            {this.state.errorMessage && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6 max-w-xs w-full">
                <p className="text-xs text-red-700 font-mono break-all">{this.state.errorMessage}</p>
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="bg-[#1B4332] text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg active:scale-95 transition-transform mb-3"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="text-[#1B4332]/50 text-sm font-medium underline underline-offset-2"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
