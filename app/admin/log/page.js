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
              {r.admin_email || 'unknown'} · {new Date(r.created_at).toLocaleString('en-IN')} · {r.table_name}
            </p>
            {r.changes && Object.keys(r.changes).length ? (
              <p className="small" style={{ wordBreak: 'break-word' }}>
                {Object.entries(r.changes).map(([k, v]) => `${k}: ${v[0] ?? '(empty)'} → ${v[1] ?? '(empty)'}`).join(' | ')}
              </p>
            ) : null}
          </article>
        ))}
      </main>
    </div>
  );
}
