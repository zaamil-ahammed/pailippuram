'use client';
import { useEffect, useState } from 'react';
import PageHeader from './PageHeader';
import ListingCard from './ListingCard';
import { cleanSearch } from '../lib/supabase';
import { useRows } from '../lib/useRows';

// Shared by the Important contacts, Local shops, Native workers, and Transportation pages.
export default function ListingsView({ kind, title, ml, intro, top, fallbackCategories = [] }) {
  const [typed, setTyped] = useState('');
  const [term, setTerm] = useState('');
  const [cat, setCat] = useState('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') || '';
    setTyped(q);
    setTerm(q);
  }, []);

  const cats = useRows((s) => s.from('categories').select('*').eq('kind', kind).order('name'), [kind]);
  const activeCategories = cats.rows.length > 0 ? cats.rows : fallbackCategories;

  const { rows, loading, error } = useRows(
    (s) => {
      let q = s.from('listings').select('*, categories(name)').eq('status', 'approved').order('title');
      if (kind === 'transport') {
        q = q.or('kind.eq.transport,description.ilike.%[TRANSPORT]%,description.ilike.%auto%,description.ilike.%taxi%,description.ilike.%jcb%,description.ilike.%tipper%,description.ilike.%pickup%');
      } else if (kind === 'worker') {
        q = q.or('kind.eq.worker,description.ilike.%[WORKER]%');
      } else if (kind === 'business') {
        q = q.eq('kind', 'business').not('description', 'ilike', '%[WORKER]%').not('description', 'ilike', '%[TRANSPORT]%');
      } else {
        q = q.eq('kind', kind);
      }
      if (cat) {
        if (typeof cat === 'number' || (typeof cat === 'string' && /^\d+$/.test(cat.trim()))) {
          q = q.eq('category_id', Number(cat));
        } else if (typeof cat === 'string' && /^[0-9a-f-]{36}$/i.test(cat.trim())) {
          q = q.eq('category_id', cat.trim());
        } else {
          const safeCat = cleanSearch(cat);
          if (safeCat) {
            q = q.or(`title.ilike.%${safeCat}%,description.ilike.%${safeCat}%,area.ilike.%${safeCat}%`);
          }
        }
      }
      const t = cleanSearch(term);
      if (t) q = q.or(`title.ilike.%${t}%,area.ilike.%${t}%,description.ilike.%${t}%`);
      return q;
    },
    [kind, cat, term]
  );

  // Auto-scroll and highlight if shared via direct link (?id=... or #item-...)
  useEffect(() => {
    if (loading || rows.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id') || (window.location.hash ? window.location.hash.replace('#item-', '') : null);
    if (targetId) {
      setTimeout(() => {
        const el = document.getElementById(`item-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.borderColor = 'var(--accent)';
          el.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.25), 0 8px 24px rgba(37, 99, 235, 0.15)';
          setTimeout(() => {
            el.style.borderColor = '';
            el.style.boxShadow = '';
          }, 3500);
        }
      }, 250);
    }
  }, [loading, rows]);

  return (
    <div className="page">
      <PageHeader title={title} ml={ml}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTerm(typed);
          }}
        >
          <label htmlFor="q" className="hp">Search</label>
          <input id="q" type="search" placeholder="Search by name or area" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </form>
      </PageHeader>
      <main className="body">
        {top}
        {intro ? <p className="muted">{intro}</p> : null}
        <div className="chips">
          <button type="button" className={`chip ${cat === '' ? 'on' : ''}`} onClick={() => setCat('')}>All</button>
          {activeCategories.map((c) => (
            <button key={c.id || c.name} type="button" className={`chip ${cat === (c.id ?? c.name) ? 'on' : ''}`} onClick={() => setCat(c.id ?? c.name)}>
              {c.name}
            </button>
          ))}
        </div>
        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading...</p> : null}
        {!loading && !error && rows.length === 0 ? <p className="muted">Nothing found yet. You can share one from the menu.</p> : null}
        {rows.map((r) => (
          <ListingCard key={r.id} row={r} />
        ))}
      </main>
    </div>
  );
}
