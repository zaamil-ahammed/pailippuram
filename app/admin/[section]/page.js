'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageHeader from '../../../components/PageHeader';
import { useAdmin } from '../../../components/AdminGate';
import { cleanSearch, formatDate, supabase } from '../../../lib/supabase';
import { logAudit } from '../../../lib/audit';
import { useRows } from '../../../lib/useRows';
import { OUTDATED_DAYS, SECTIONS } from '../../../lib/sections';

const FILTERS = ['All', 'Live', 'Hidden', 'Outdated'];

export default function AdminList() {
  const { section } = useParams();
  const cfg = SECTIONS[section];
  const { user } = useAdmin();
  const [filter, setFilter] = useState('All');
  const [typed, setTyped] = useState('');
  const [term, setTerm] = useState('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') || '';
    setTyped(q);
    setTerm(q);
  }, []);

  const isCategories = cfg?.table === 'categories';
  const activeFilters = isCategories ? ['All', 'Shops', 'Contacts', 'Workers', 'Transport'] : FILTERS;

  const { rows, loading, error, reload } = useRows(
    (s) => {
      if (!cfg) return Promise.resolve({ data: [], error: null });
      let q = isCategories
        ? s.from(cfg.table).select(cfg.select).order('name', { ascending: true })
        : s.from(cfg.table).select(cfg.select).order('created_at', { ascending: false });

      if (section === 'transport') {
        q = q.or('kind.eq.transport,description.ilike.%[TRANSPORT]%,description.ilike.%auto%,description.ilike.%taxi%,description.ilike.%jcb%,description.ilike.%tipper%,description.ilike.%pickup%');
      } else if (section === 'workers') {
        q = q.or('kind.eq.worker,description.ilike.%[WORKER]%');
      } else if (section === 'shops') {
        q = q.eq('kind', 'business').not('description', 'ilike', '%[WORKER]%').not('description', 'ilike', '%[TRANSPORT]%');
      } else {
        for (const [k, v] of Object.entries(cfg.match)) q = q.eq(k, v);
      }

      if (isCategories) {
        if (filter === 'Shops') q = q.eq('kind', 'business');
        if (filter === 'Contacts') q = q.eq('kind', 'contact');
        if (filter === 'Workers') q = q.eq('kind', 'worker');
        if (filter === 'Transport') q = q.eq('kind', 'transport');
      } else {
        if (filter === 'Live') q = q.eq('status', 'approved');
        if (filter === 'Hidden') q = q.or('status.eq.hidden,status.eq.archived');
        if (filter === 'Outdated') {
          const cutoff = new Date(Date.now() - OUTDATED_DAYS * 86400000).toISOString();
          q = q.eq('status', 'approved').or(`verified_at.is.null,verified_at.lt.${cutoff}`);
        }
      }

      const t = cleanSearch(term);
      if (t) q = q.or(cfg.searchCols.map((c) => `${c}.ilike.%${t}%`).join(','));
      return q;
    },
    [section, filter, term, isCategories]
  );

  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  if (!cfg) return <div className="page"><main className="body"><p>Unknown section.</p></main></div>;

  async function toggleHidden(row) {
    setActionError('');
    const isCurrentlyLive = row.status === 'approved';
    const nextStatus = isCurrentlyLive ? (cfg.table === 'listings' ? 'archived' : 'hidden') : 'approved';
    let { error: err } = await supabase.from(cfg.table).update({ status: nextStatus }).eq('id', row.id);
    if (err && err.message && err.message.includes('status_check')) {
      const altStatus = nextStatus === 'hidden' ? 'archived' : 'hidden';
      const altRes = await supabase.from(cfg.table).update({ status: altStatus }).eq('id', row.id);
      err = altRes.error;
    }
    if (err) return setActionError(err.message || 'Could not save. Please try again.');
    await logAudit(user, { action: isCurrentlyLive ? 'hide' : 'show', table: cfg.table, rowId: row.id, note: cfg.title(row) });
    reload();
  }

  async function remove(row) {
    setActionError('');
    if (deletingId !== row.id) {
      setDeletingId(row.id);
      return;
    }
    setDeletingId(null);
    const { error: err } = await supabase.from(cfg.table).delete().eq('id', row.id);
    if (err) return setActionError('Could not delete. Please try again.');
    await logAudit(user, { action: 'delete', table: cfg.table, rowId: row.id, note: cfg.title(row) });
    reload();
  }

  return (
    <div className="page">
      <PageHeader title={`Manage: ${cfg.label}`} back="/admin" backLabel="Admin">
        <form onSubmit={(e) => { e.preventDefault(); setTerm(typed); }}>
          <label htmlFor="aq" className="hp">Search items</label>
          <input id="aq" type="search" placeholder="Search" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </form>
      </PageHeader>
      <main className="body">
        {section !== 'bus' && (
          <Link className="btn dark big" href={`/admin/${section}/new`}>+ Add new {cfg.singular}</Link>
        )}
        <div className="chips">
          {activeFilters.map((f) => (
            <button key={f} type="button" className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        {error ? <p className="error">{error}</p> : null}
        {actionError ? <p className="error">{actionError}</p> : null}
        {loading ? <p className="muted">Loading...</p> : null}
        {!loading && !error && rows.length === 0 ? <p className="muted">Nothing here.</p> : null}
        {rows.map((r) => (
          <article key={r.id} className="card">
            <div className="cardhead">
              <div>
                <h3>{cfg.title(r)}</h3>
                <p className="muted">{cfg.subtitle(r)}</p>
              </div>
              {isCategories ? (
                <span className="pill" style={{ textTransform: 'capitalize' }}>{r.kind}</span>
              ) : (
                <span className={`pill ${r.status !== 'approved' ? 'line' : ''}`}>{r.status !== 'approved' ? 'Hidden' : 'Live'}</span>
              )}
            </div>
            {isCategories ? (
              <p className="muted small">Category ID: #{r.id}</p>
            ) : (
              <p className="muted small">
                {cfg.verify ? (r.verified_at ? `Verified ${formatDate(r.verified_at)}` : 'Never verified') : ''}
                {cfg.verify ? ' · ' : ''}Last edited {formatDate(r.updated_at)}
              </p>
            )}
            <div className="btnrow">
              <Link className="btn dark" href={`/admin/${section}/${r.id}`}>Edit</Link>
              {!isCategories && (
                <button type="button" className="btn" onClick={() => toggleHidden(r)}>{r.status !== 'approved' ? 'Show' : 'Hide'}</button>
              )}
              <button
                type="button"
                className="btn"
                style={deletingId === r.id ? { color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fef2f2' } : {}}
                onClick={() => remove(r)}
              >
                {deletingId === r.id ? 'Confirm delete?' : 'Delete'}
              </button>
            </div>
          </article>
        ))}
        <div className="note"><strong>Delete asks you to confirm first</strong> and is recorded in the activity log. Hide is safer when you may want the item back.</div>
      </main>
    </div>
  );
}
