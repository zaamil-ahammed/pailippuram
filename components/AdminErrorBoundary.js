'use client';
import React from 'react';
import Link from 'next/link';

export class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AdminErrorBoundary caught error]:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="page">
          <main className="body" style={{ padding: '24px 16px' }}>
            <div
              className="card"
              style={{
                borderColor: '#fca5a5',
                background: '#fff5f5',
                padding: '24px 20px',
                borderRadius: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <h2 style={{ margin: 0, fontSize: 19, color: '#991b1b' }}>Admin Section Error</h2>
              </div>
              <p style={{ color: '#7f1d1d', margin: '0 0 12px', fontSize: 14, lineHeight: 1.5 }}>
                A display error occurred while rendering this management section. Don&apos;t worry, your data is safe.
              </p>
              {this.state.error?.message && (
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fecaca',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#b91c1c',
                    marginBottom: '16px',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.message}
                </div>
              )}
              <div className="btnrow" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="btn dark"
                  onClick={this.resetError}
                  style={{ minHeight: 40, fontSize: 13 }}
                >
                  🔄 Try Reloading
                </button>
                <Link
                  href="/admin"
                  className="btn"
                  style={{ minHeight: 40, fontSize: 13, textDecoration: 'none' }}
                >
                  ← Back to Admin Dashboard
                </Link>
              </div>
            </div>
          </main>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AdminErrorBoundary;
