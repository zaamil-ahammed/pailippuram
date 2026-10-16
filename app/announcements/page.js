'use client';
import Link from 'next/link';
import PageHeader from '../../components/PageHeader';
import { formatDate } from '../../lib/supabase';
import { useRows } from '../../lib/useRows';
import { shareServiceOrApp } from '../../lib/share';

export default function Announcements() {
  const { rows, loading, error } = useRows(
    (s) => s.from('announcements').select('*').eq('status', 'approved').order('created_at', { ascending: false }),
    []
  );

  const handleShareAnnouncement = async (n) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    await shareServiceOrApp({
      title: `${n.title} · Pailippuram Announcement`,
      text: `📢 ${n.title}\n${n.body ? n.body.slice(0, 160) : ''}`,
      url: `${origin}/announcements?id=${n.id}#item-${n.id}`,
    });
  };

  return (
    <div className="page">
      <PageHeader title="Announcements" ml="അറിയിപ്പുകൾ" />
      <main className="body">
        <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
          <Link
            href="/share?type=announcement"
            className="btn light"
            style={{
              flex: 1,
              minHeight: 46,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Post Announcement / Event · അറിയിപ്പ് നൽകുക
          </Link>
        </div>
        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading...</p> : null}
        {!loading && !error && rows.length === 0 ? <p className="muted">No announcements yet.</p> : null}
        {rows.map((n) => (
          <article key={n.id} id={`item-${n.id}`} className="card">
            <div className="cardhead">
              <div>
                <h3>{n.title}</h3>
                {n.event_date ? <p className="muted small">{formatDate(n.event_date)}</p> : null}
              </div>
              <button
                type="button"
                className="iconbtn"
                style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid var(--accent-border)', color: 'var(--primary)', flexShrink: 0 }}
                title="Share announcement / അറിയിപ്പ് പങ്കിടുക"
                aria-label="Share announcement"
                onClick={() => handleShareAnnouncement(n)}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>
            {n.body ? <p style={{ whiteSpace: 'pre-line' }}>{n.body}</p> : null}
          </article>
        ))}
      </main>
    </div>
  );
}
