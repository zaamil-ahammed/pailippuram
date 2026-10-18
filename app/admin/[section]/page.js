'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageHeader from '../../../components/PageHeader';
import { useAdmin } from '../../../components/AdminGate';
import { cleanSearch, formatDate, supabase } from '../../../lib/supabase';
import { logAudit } from '../../../lib/audit';
import { useRows } from '../../../lib/useRows';
import { OUTDATED_DAYS, SECTIONS } from '../../../lib/sections';
import PersonAvatar from '../../../components/PersonAvatar';

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
        q = q.or('kind.eq.business,kind.eq.shop');
      } else {
        for (const [k, v] of Object.entries(cfg.match)) q = q.eq(k, v);
      }

      if (isCategories) {
        if (filter === 'Shops') q = q.or('kind.eq.business,kind.eq.shop');
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

  const displayRows = useMemo(() => {
    if (!rows) return [];
    if (section === 'shops') {
      return rows.filter((r) => {
        const d = (r.description || '').toLowerCase();
        const k = (r.kind || '').toLowerCase();
        if (k === 'worker' || d.includes('[worker]')) return false;
        if (k === 'transport' || d.includes('[transport]')) return false;
        return true;
      });
    }
    return rows;
  }, [rows, section]);

  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  if (!cfg) {
    return (
      <div className="page">
        <PageHeader title="Admin" back="/admin" backLabel="Admin" />
        <main className="body">
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <h2>Section not found</h2>
            <p className="muted">The requested section &ldquo;{section}&rdquo; does not exist.</p>
            <div style={{ marginTop: 16 }}>
              <Link href="/admin" className="btn dark">Back to Admin Dashboard</Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  async function toggleHidden(row) {
    setActionError('');
    const isCurrentlyLive = row.status === 'approved' || (!row.status && row.status !== 'hidden' && row.status !== 'archived');
    const nextStatus = isCurrentlyLive ? 'hidden' : 'approved';
    let { error: err } = await supabase.from(cfg.table).update({ status: nextStatus }).eq('id', row.id);
    if (err && err.message && err.message.includes('status_check')) {
      const altStatus = nextStatus === 'hidden' ? 'archived' : 'hidden';
      const altRes = await supabase.from(cfg.table).update({ status: altStatus }).eq('id', row.id);
      err = altRes.error;
    }
    if (err) return setActionError(err.message || 'Could not update status. Please try again.');
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
        {section === 'bus' ? (
          <Link
            className="btn dark big"
            href="/admin/bus/new"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="16" height="13" x="4" y="3" rx="2" />
              <path d="M4 11h16" />
              <path d="M8 3v3" />
              <path d="M16 3v3" />
              <circle cx="8" cy="14" r="1" />
              <circle cx="16" cy="14" r="1" />
            </svg>
            + Add Bus Timing · ബസ് സമയം ചേർക്കുക
          </Link>
        ) : (
          <Link className="btn dark big" href={`/admin/${section}/new`}>+ Add new {cfg.singular}</Link>
        )}
        <div className="chips">
          {activeFilters.map((f) => (
            <button key={f} type="button" className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        {error ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, marginBottom: 12 }}>
            <span style={{ color: '#dc2626', fontSize: 13.5 }}>{error}</span>
            <button type="button" className="btn dark" onClick={() => reload()} style={{ padding: '4px 12px', fontSize: 13, height: 'auto' }}>
              Retry
            </button>
          </div>
        ) : null}
        {actionError ? <p className="error">{actionError}</p> : null}
        {loading ? <p className="muted">Loading...</p> : null}
        {!loading && !error && displayRows.length === 0 ? <p className="muted">Nothing here.</p> : null}
        {displayRows.map((r) => {
          if (!r) return null;
          const localPhoto = typeof window !== 'undefined' ? window.localStorage.getItem(`np_photo_${r.id}`) : null;
          const photoFromDesc = r.description?.match(/Photo:\s*([^\s\n]+)/i)?.[1]?.trim() || r.detail?.match(/Photo:\s*([^\s\n]+)/i)?.[1]?.trim();
          const effectivePhoto = r.photo_url || localPhoto || photoFromDesc || '';
          const hasAvatar = ['workers', 'transport', 'panchayath', 'donors'].includes(section) || Boolean(effectivePhoto);
          const isHidden = r.status === 'hidden' || r.status === 'archived';

          return (
            <article key={r.id} className="card">
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {hasAvatar && (
                  <PersonAvatar
                    src={effectivePhoto}
                    alt={cfg.title(r)}
                    category={r.categories?.name || cfg.title(r)}
                    kind={section === 'workers' ? 'worker' : section === 'transport' ? 'transport' : section === 'panchayath' ? 'panchayath' : section === 'shops' ? 'shop' : 'donor'}
                    size={46}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cardhead" style={{ marginBottom: 4 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{ wordBreak: 'break-word', fontSize: 17 }}>{cfg.title(r)}</h3>
                      <p className="muted">{cfg.subtitle(r)}</p>
                    </div>
                    {isCategories ? (
                      <span className="pill" style={{ textTransform: 'capitalize' }}>{r.kind}</span>
                    ) : (
                      <span className={`pill ${isHidden ? 'line' : ''}`}>{isHidden ? 'Hidden' : 'Live'}</span>
                    )}
                  </div>
                </div>
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
                <button type="button" className="btn" onClick={() => toggleHidden(r)}>{isHidden ? 'Show' : 'Hide'}</button>
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
        );
      })}
        <div className="note"><strong>Delete asks you to confirm first</strong> and is recorded in the activity log. Hide is safer when you may want the item back.</div>
      </main>
    </div>
  );
}
