'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '../../components/PageHeader';
import { cleanSearch, formatDate, supabase } from '../../lib/supabase';
import { useRows } from '../../lib/useRows';
import { shareServiceOrApp } from '../../lib/share';

export default function Bus() {
  const [typed, setTyped] = useState('');
  const [term, setTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;
      const { data: ok } = await supabase.rpc('is_admin');
      if (!cancelled && ok) setIsAdmin(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { rows, loading, error } = useRows(
    (s) => {
      let q = s.from('bus_routes').select('*').eq('status', 'approved').order('route');
      const t = cleanSearch(term);
      if (t) q = q.or(`route.ilike.%${t}%,direction.ilike.%${t}%,bus_name.ilike.%${t}%`);
      return q;
    },
    [term]
  );

  const handleShareBus = async (r) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const directUrl = `${origin}/bus?id=${r.id}#item-${r.id}`;
    const timesSummary = (r.times || '').split('\n').filter(Boolean).slice(0, 4).join(', ');
    await shareServiceOrApp({
      title: `${r.route} Bus Timings · Pailippuram`,
      text: `🚌 ${r.route}${r.direction ? ' (' + r.direction + ')' : ''}${r.bus_name ? ' · ' + r.bus_name : ''}: ${timesSummary}`,
      url: directUrl,
    });
  };

  return (
    <div className="page">
      <PageHeader title="Bus timing" ml="ബസ് സമയം">
        <form onSubmit={(e) => { e.preventDefault(); setTerm(typed); }}>
          <label htmlFor="bq" className="hp">Search routes</label>
          <input
            id="bq"
            type="search"
            placeholder="Search by route, place or direction..."
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              setTerm(e.target.value);
            }}
          />
        </form>
      </PageHeader>

      <main className="body">
        {isAdmin ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
            <Link
              href="/admin/bus/new"
              className="btn dark"
              style={{
                flex: 1,
                minHeight: 46,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 700,
                boxShadow: '0 2px 4px rgba(15, 23, 42, 0.08)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="16" height="13" x="4" y="3" rx="2" />
                <path d="M4 11h16" />
                <path d="M8 3v3" />
                <path d="M16 3v3" />
                <circle cx="8" cy="14" r="1" />
                <circle cx="16" cy="14" r="1" />
              </svg>
              + Add Bus Timing · ബസ് സമയം ചേർക്കുക
            </Link>
            <Link
              href="/admin/bus"
              className="btn light"
              style={{
                minHeight: 46,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 16px',
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              Manage all
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <Link
              href="/share?type=bus"
              className="btn light"
              style={{
                flex: 1,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              Suggest bus timing / ബസ് സമയം നിർദ്ദേശിക്കുക
            </Link>
          </div>
        )}

        <p className="note" style={{ margin: '4px 0 0' }}>
          Bus times can change. Please check with the bus staff if it is important.
        </p>

        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading bus timings...</p> : null}
        {!loading && !error && rows.length === 0 ? <p className="muted">No bus routes found.</p> : null}

        {rows.map((r) => (
          <article key={r.id} id={`item-${r.id}`} className="card">
            <div className="cardhead">
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 17, wordBreak: 'break-word' }}>{r.route}</h3>
                {r.direction ? (
                  <p style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 600, marginTop: 3 }}>
                    📍 Direction: {r.direction}
                  </p>
                ) : null}
                {r.bus_name ? (
                  <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>{r.bus_name}</p>
                ) : null}
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                {isAdmin && (
                  <Link
                    href={`/admin/bus/${r.id}`}
                    className="btn light"
                    style={{ padding: '0 10px', minHeight: 36, fontSize: 12.5 }}
                  >
                    Edit
                  </Link>
                )}
                <button
                  type="button"
                  className="iconbtn"
                  style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid var(--accent-border)', color: 'var(--primary)' }}
                  title="Share bus timing / സമയം പങ്കിടുക"
                  aria-label="Share route timing"
                  onClick={() => handleShareBus(r)}
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
            </div>

            <div className="times">
              {(r.times || '').split('\n').map((t) => t.trim()).filter(Boolean).map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </div>

            {r.verified_at ? <p className="muted small" style={{ marginTop: 6 }}>Checked {formatDate(r.verified_at)}</p> : null}
          </article>
        ))}
      </main>
    </div>
  );
}
