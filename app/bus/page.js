'use client';
import { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { cleanSearch, formatDate } from '../../lib/supabase';
import { useRows } from '../../lib/useRows';
import { shareServiceOrApp } from '../../lib/share';

export default function Bus() {
  const [typed, setTyped] = useState('');
  const [term, setTerm] = useState('');
  const { rows, loading, error } = useRows(
    (s) => {
      let q = s.from('bus_routes').select('*').eq('status', 'approved').order('route');
      const t = cleanSearch(term);
      if (t) q = q.or(`route.ilike.%${t}%,bus_name.ilike.%${t}%`);
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
      text: `🚌 ${r.route}${r.bus_name ? ' (' + r.bus_name + ')' : ''}: ${timesSummary}`,
      url: directUrl,
    });
  };

  return (
    <div className="page">
      <PageHeader title="Bus timing" ml="ബസ് സമയം">
        <form onSubmit={(e) => { e.preventDefault(); setTerm(typed); }}>
          <label htmlFor="bq" className="hp">Search routes</label>
          <input id="bq" type="search" placeholder="Search by place" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </form>
      </PageHeader>
      <main className="body">
        <p className="note">Bus times can change. Please check with the bus staff if it is important.</p>
        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading...</p> : null}
        {!loading && !error && rows.length === 0 ? <p className="muted">No routes found.</p> : null}
        {rows.map((r) => (
          <article key={r.id} id={`item-${r.id}`} className="card">
            <div className="cardhead">
              <div>
                <h3>{r.route}</h3>
                {r.bus_name ? <p className="muted">{r.bus_name}</p> : null}
              </div>
              <button
                type="button"
                className="iconbtn"
                style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid var(--accent-border)', color: 'var(--primary)', flexShrink: 0 }}
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
            <div className="times">
              {(r.times || '').split('\n').map((t) => t.trim()).filter(Boolean).map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </div>
            {r.verified_at ? <p className="muted small">Checked {formatDate(r.verified_at)}</p> : null}
          </article>
        ))}
      </main>
    </div>
  );
}
