'use client';
import { useEffect } from 'react';

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error('[AdminError Boundary]:', error);
  }, [error]);

  const handleClearCacheAndReload = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('np_mock_db');
      } catch (e) {
        // ignore
      }
      window.location.href = '/admin';
    }
  };

  return (
    <div className="page">
      <main className="body" style={{ padding: '24px 16px' }}>
        <div
          className="card"
          style={{
            borderColor: '#fca5a5',
            background: '#fff5f5',
            padding: '28px 20px',
            borderRadius: '16px',
            maxWidth: 600,
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 28 }} role="img" aria-label="Warning">⚠️</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, color: '#991b1b' }}>Admin Management Issue</h1>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#b91c1c' }}>അഡ്മിൻ മാനേജ്‌മെന്റ് പേജ് ലോഡ് ചെയ്യുന്നതിൽ തടസ്സം നേരിട്ടു</p>
            </div>
          </div>

          <p style={{ color: '#7f1d1d', margin: '0 0 14px', fontSize: 14, lineHeight: 1.5 }}>
            An unexpected error occurred while loading this section of the admin panel. Your saved items and database data are safe.
          </p>

          {error?.message ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #fecaca',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#b91c1c',
                marginBottom: '18px',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
            </div>
          ) : null}

          <div className="btnrow" style={{ marginTop: 8, flexWrap: 'wrap', gap: 10 }}>
            <button
              type="button"
              className="btn dark"
              onClick={() => reset()}
              style={{ minHeight: 42, fontSize: 13.5 }}
            >
              🔄 Try Again
            </button>
            <a
              href="/admin"
              className="btn"
              style={{ minHeight: 42, fontSize: 13.5, textDecoration: 'none' }}
            >
              ← Admin Dashboard
            </a>
            <a
              href="/"
              className="btn light"
              style={{ minHeight: 42, fontSize: 13.5, textDecoration: 'none' }}
            >
              🏠 Home
            </a>
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #fed7d7' }}>
            <p className="small muted" style={{ margin: '0 0 8px' }}>
              If you keep seeing this screen after trying again, click below to refresh the local cache:
            </p>
            <button
              type="button"
              className="btn"
              onClick={handleClearCacheAndReload}
              style={{
                fontSize: 12.5,
                padding: '6px 12px',
                color: '#991b1b',
                borderColor: '#fca5a5',
                background: '#fff',
              }}
            >
              🧹 Reset Cache & Reload Admin
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
