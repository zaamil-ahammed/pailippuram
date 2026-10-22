'use client';
import { useEffect } from 'react';

// Shown instead of a blank page when something unexpected breaks.
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[Root Error Boundary]:', error);
  }, [error]);

  const handleClearCacheAndReload = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('pailippuram_mock_db');
      } catch (e) {
        // ignore
      }
      window.location.href = '/';
    }
  };

  return (
    <div className="page">
      <main className="body" style={{ padding: '32px 16px' }}>
        <div className="card" style={{ maxWidth: 540, margin: '0 auto', padding: '28px 22px', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 20 }}>Something went wrong</h1>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>ഒരു തകരാർ സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക.</p>
            </div>
          </div>
          <p style={{ margin: '0 0 16px', lineHeight: 1.5 }}>
            Sorry for the inconvenience. You can try again or return to the main directory.
          </p>
          {error?.message ? (
            <div style={{ background: 'var(--accent-tint)', border: '1px solid var(--accent-border)', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, fontFamily: 'monospace', color: 'var(--ink)', marginBottom: 16, wordBreak: 'break-word' }}>
              {error.message}
            </div>
          ) : null}
          <div className="btnrow" style={{ flexWrap: 'wrap', gap: 10 }}>
            <button type="button" className="btn dark" onClick={() => reset()} style={{ minHeight: 40 }}>
              Try again
            </button>
            <a href="/" className="btn" style={{ minHeight: 40, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              🏠 Go to Home
            </a>
            <a href="/admin" className="btn light" style={{ minHeight: 40, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              🛡️ Admin
            </a>
          </div>
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              className="btn"
              onClick={handleClearCacheAndReload}
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              🧹 Clear cache and reload
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
