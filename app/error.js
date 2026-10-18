'use client';
import { useEffect } from 'react';
import Link from 'next/link';

// Shown instead of a blank page when something unexpected breaks.
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[Root Error Boundary]:', error);
  }, [error]);

  const handleClearCacheAndReload = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('np_mock_db');
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
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', color: '#475569', marginBottom: 16, wordBreak: 'break-word' }}>
              {error.message}
            </div>
          ) : null}
          <div className="btnrow" style={{ flexWrap: 'wrap', gap: 10 }}>
            <button type="button" className="btn dark" onClick={() => reset()} style={{ minHeight: 40 }}>
              Try again
            </button>
            <Link href="/" className="btn" style={{ minHeight: 40, textDecoration: 'none' }}>
              🏠 Go to Home
            </Link>
            <Link href="/admin" className="btn light" style={{ minHeight: 40, textDecoration: 'none' }}>
              🛡️ Admin
            </Link>
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
