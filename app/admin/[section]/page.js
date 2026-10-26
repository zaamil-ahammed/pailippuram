'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageHeader from '../../../components/PageHeader';
import SearchBar from '../../../components/SearchBar';
import { useAdmin } from '../../../components/AdminGate';
import { cleanSearch, formatDate, supabase, isPinnedAnnouncement } from '../../../lib/supabase';
import { adminMutate } from '../../../lib/adminApi';
import { logAudit } from '../../../lib/audit';
import { useRows } from '../../../lib/useRows';
import { OUTDATED_DAYS, SECTIONS } from '../../../lib/sections';
import { showToast } from '../../../lib/toast';

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

  const { rows, loading, error, reload } = useRows(
    (s) => {
      if (!cfg) return Promise.resolve({ data: [], error: null });
      let q = s.from(cfg.table).select(cfg.select).order('created_at', { ascending: false });
      if (section === 'workers') {
        q = q.or('kind.eq.worker,description.ilike.%[WORKER]%');
      } else if (section === 'transport') {
        q = q.or('kind.eq.transport,description.ilike.%[TRANSPORT]%');
      } else if (section === 'shops') {
        q = q.or('kind.eq.business,kind.eq.shop');
      } else if (section === 'schools') {
        q = q.or('description.ilike.%[EDUCATION]%,description.ilike.%[SCHOOL]%,description.ilike.%[MADRASSA]%,category_id.eq.aefbe578-e693-4d17-b1b9-3fcbaa58ae19,category_id.eq.690aa10e-e82e-4393-b0a8-f1b814aa322f,title.ilike.%school%,title.ilike.%madrassa%,title.ilike.%madrasa%,title.ilike.%anganwadi%');
      } else {
        for (const [k, v] of Object.entries(cfg.match)) q = q.eq(k, v);
      }
      if (filter === 'Live') q = q.eq('status', 'approved');
      if (filter === 'Hidden') q = q.or('status.eq.hidden,status.eq.archived');
      if (filter === 'Outdated') {
        const cutoff = new Date(Date.now() - OUTDATED_DAYS * 86400000).toISOString();
        q = q.eq('status', 'approved').or(`verified_at.is.null,verified_at.lt.${cutoff}`);
      }
      const t = cleanSearch(term);
      if (t) q = q.or(cfg.searchCols.map((c) => `${c}.ilike.%${t}%`).join(','));
      return q;
    },
    [section, filter, term]
  );

  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  if (!cfg) return <div className="page"><main className="body"><p>Unknown section.</p></main></div>;

  async function toggleHidden(row) {
    setActionError('');
    const isCurrentlyLive = row.status === 'approved';
    const hideStatus = (cfg.table === 'listings' || cfg.table === 'announcements') ? 'archived' : 'hidden';
    const nextStatus = isCurrentlyLive ? hideStatus : 'approved';
    const { error: err } = await adminMutate({
      action: 'update',
      table: cfg.table,
      id: row.id,
      data: { status: nextStatus },
    });
    if (err) return setActionError(err.message || 'Could not save. Please try again.');
    await logAudit(user, { action: isCurrentlyLive ? 'hide' : 'show', table: cfg.table, rowId: row.id, note: cfg.title(row) });
    showToast({
      type: 'success',
      message: isCurrentlyLive ? 'Item hidden from public directory' : 'Item is now live!',
      sub: cfg.title(row),
    });
    reload();
  }

  async function togglePin(row) {
    setActionError('');
    const currentlyPinned = isPinnedAnnouncement(row);
    let newBody = row.body || '';
    if (currentlyPinned) {
      newBody = newBody.replace(/^(?:\[PINNED\]\s*)+/i, '').trim();
    } else {
      newBody = `[PINNED]\n${newBody.replace(/^(?:\[PINNED\]\s*)+/i, '').trim()}`;
    }
    const { error: err } = await adminMutate({
      action: 'update',
      table: 'announcements',
      id: row.id,
      data: { body: newBody, is_pinned: !currentlyPinned },
    });
    if (err) return setActionError(err.message || 'Could not update pin status.');
    await logAudit(user, { action: currentlyPinned ? 'unpin announcement' : 'pin announcement', table: 'announcements', rowId: row.id, note: row.title });
    showToast({
      type: 'success',
      message: currentlyPinned ? 'Announcement unpinned' : 'Announcement pinned to top 📌',
      sub: row.title,
    });
    reload();
  }

  async function remove(row) {
    setActionError('');
    if (deletingId !== row.id) {
      setDeletingId(row.id);
      return;
    }
    setDeletingId(null);
    const { error: err } = await adminMutate({
      action: 'delete',
      table: cfg.table,
      id: row.id,
    });
    if (err) return setActionError(err.message || 'Could not delete. Please try again.');
    await logAudit(user, { action: 'delete', table: cfg.table, rowId: row.id, note: cfg.title(row) });
    showToast({
      type: 'success',
      message: 'Item deleted permanently',
      sub: cfg.title(row),
    });
    reload();
  }

  const sortedRows = section === 'announcements'
    ? [...rows].sort((a, b) => {
        const aPin = isPinnedAnnouncement(a) ? 1 : 0;
        const bPin = isPinnedAnnouncement(b) ? 1 : 0;
        if (aPin !== bPin) return bPin - aPin;
        return 0;
      })
    : rows;

  const displayRows = section === 'shops'
    ? sortedRows.filter((r) => {
        const d = (r.description || '').toLowerCase();
        return !d.includes('[worker]') && !d.includes('[transport]');
      })
    : sortedRows;

  return (
    <div className="page">
      <PageHeader title={`Manage: ${cfg.label}`} back="/admin" backLabel="Admin">
        <SearchBar
          id="admin-search"
          placeholder={`Search ${cfg.label.toLowerCase()}...`}
          ariaLabel={`Search ${cfg.label}`}
          value={typed}
          resultsCount={typed.trim().length > 0 ? displayRows.length : undefined}
          onChange={(e) => {
            setTyped(e.target.value);
            setTerm(e.target.value);
          }}
          onClear={() => {
            setTyped('');
            setTerm('');
          }}
          onSubmit={() => setTerm(typed)}
        />
      </PageHeader>
      <main className="body">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn dark big" href={`/admin/${section}/new`} style={{ flex: 1, minWidth: 180 }}>
            + Add new {cfg.singular}
          </Link>
          {['shops', 'workers', 'transport', 'contacts'].includes(section) && (
            <Link
              className="btn light"
              href="/admin/categories"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13.5,
                fontWeight: 700,
                padding: '0 16px',
              }}
            >
              🏷️ Categories
            </Link>
          )}
        </div>
        <div className="chips">
          {FILTERS.map((f) => (
            <button key={f} type="button" className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        {error ? <p className="error">{error}</p> : null}
        {actionError ? <p className="error">{actionError}</p> : null}
        {loading ? <p className="muted">Loading...</p> : null}
        {!loading && !error && displayRows.length === 0 ? <p className="muted">Nothing here.</p> : null}
        {displayRows.map((r) => {
          const isPinned = section === 'announcements' && isPinnedAnnouncement(r);
          return (
            <article
              key={r.id}
              className="card"
              style={
                isPinned
                  ? {
                      borderColor: 'var(--accent)',
                      background: 'linear-gradient(180deg, #fdfbf7 0%, #ffffff 100%)',
                      boxShadow: '0 4px 16px rgba(197, 160, 89, 0.12)',
                    }
                  : {}
              }
            >
              <div className="cardhead">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <h3>{cfg.title(r)}</h3>
                    {isPinned && (
                      <span
                        className="pill"
                        style={{
                          background: 'var(--accent-tint)',
                          color: 'var(--gold-dark)',
                          border: '1px solid var(--accent-border)',
                          fontWeight: 700,
                          fontSize: 11,
                          padding: '2px 8px',
                        }}
                      >
                        📌 Pinned
                      </span>
                    )}
                  </div>
                  <p className="muted">{cfg.subtitle(r)}</p>
                </div>
                <span className={`pill ${r.status !== 'approved' ? 'line' : ''}`}>{r.status !== 'approved' ? 'Hidden' : 'Live'}</span>
              </div>
              <p className="muted small">
                {cfg.verify ? (r.verified_at ? `Verified ${formatDate(r.verified_at)}` : 'Never verified') : ''}
                {cfg.verify ? ' · ' : ''}Last edited {formatDate(r.updated_at)}
              </p>
              <div className="btnrow">
                <Link className="btn dark" href={`/admin/${section}/${r.id}`}>Edit</Link>
                {section === 'announcements' && (
                  <button
                    type="button"
                    className="btn"
                    style={isPinned ? { color: 'var(--gold-dark)', borderColor: 'var(--accent-border)', backgroundColor: 'var(--accent-tint)' } : {}}
                    onClick={() => togglePin(r)}
                  >
                    {isPinned ? '📌 Unpin' : '📌 Pin to top'}
                  </button>
                )}
                <button type="button" className="btn" onClick={() => toggleHidden(r)}>{r.status !== 'approved' ? 'Show' : 'Hide'}</button>
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
