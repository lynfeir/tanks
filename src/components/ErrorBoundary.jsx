'use client';
import { Component } from 'react';
import useGameStore from '@/stores/gameStore';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Game crash caught:', error, errorInfo);
  }

  handleReset = () => {
    useGameStore.getState().resetGame();
    this.setState({ hasError: false });
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center"
          style={{ background: 'var(--bg-primary)' }}>
          <div className="text-center p-8" style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--danger)',
          }}>
            <div className="text-2xl font-bold mb-4" style={{ color: 'var(--danger)' }}>
              SYSTEM ERROR
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Something went wrong. Your game might still be recoverable.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="btn-primary px-6 py-3" onClick={this.handleRetry}>
                RETRY
              </button>
              <button className="btn-secondary px-6 py-3" onClick={this.handleReset}>
                BACK TO LOBBY
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
