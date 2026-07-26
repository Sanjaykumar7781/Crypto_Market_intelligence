import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Frontend Exception Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-6 text-center">
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 max-w-lg w-full flex flex-col items-center gap-4">
            <div className="bg-[#FEE2E2] text-[#B91C1C] p-4 rounded-full mb-2">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              We encountered an unexpected error while rendering this page. The issue has been logged.
            </p>
            {this.state.error && (
              <div className="w-full text-left mt-4 mb-6">
                <p className="text-xs font-mono bg-gray-50 text-red-600 p-3 rounded-xl overflow-auto border border-gray-100 max-h-32">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-secondary px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:shadow-md active:scale-95"
            >
              <RefreshCw size={16} /> Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
