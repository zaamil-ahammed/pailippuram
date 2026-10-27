'use client';
import PageHeader from '../../../components/PageHeader';
import { useRows } from '../../../lib/useRows';

export default function ActivityLog() {
  const { rows, loading, error } = useRows(
    (s) => s.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
    []
  );
  return (
    <div className="page">
      <PageHeader title="Activity log" ml="Latest 100 actions" back="/admin" backLabel="Admin" />
      <main className="body">
        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading...</p> : null}
        {rows.map((r) => (
          <article key={r.id} className="card">
            <h3>{r.action}{r.note ? `: ${r.note}` : ''}</h3>
            <p className="muted small">
              {new Date(r.created_at).toLocaleString('en-IN')}
              {r.admin_email ? ` · ${r.admin_email}` : ''}
              {r.table_name ? ` · ${r.table_name}` : ''}
            </p>
            {r.detail && <p style={{ fontSize: 13.5, color: '#374151', margin: '4px 0 0' }}>{r.detail}</p>}
            {r.changes && Object.keys(r.changes).length ? (
              <p className="small" style={{ wordBreak: 'break-word', marginTop: 4 }}>
                {Object.entries(r.changes).map(([k, v]) => `${k}: ${v[0] ?? '(empty)'} → ${v[1] ?? '(empty)'}`).join(' | ')}
              </p>
            ) : null}
          </article>
        ))}
      </main>
    </div>
  );
}
