'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MenuButton } from '../../components/PageHeader';
import { useAdmin } from '../../components/AdminGate';
import { supabase, formatDate, extractAllPhones, cleanDescription } from '../../lib/supabase';
import { adminMutate } from '../../lib/adminApi';
import { logAudit } from '../../lib/audit';
import { useRows } from '../../lib/useRows';
import { OUTDATED_DAYS, SECTIONS, SECTION_KEYS, SUBMISSION_LABEL, SUBMISSION_SECTION, getSubmissionSection, getSubmissionLabel } from '../../lib/sections';
import { publishSubmission } from '../../lib/publishSubmission';
import { showToast } from '../../lib/toast';

function outdatedCutoff() {
  return new Date(Date.now() - OUTDATED_DAYS * 86400000).toISOString();
}

export default function AdminHome() {
  const { user, signOut } = useAdmin();
  const [counts, setCounts] = useState({});
  const [outdated, setOutdated] = useState(0);
  const [processingId, setProcessingId] = useState('');

  const [waiting, setWaiting] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [queueError, setQueueError] = useState('');

  const loadQueue = useCallback(async () => {
    setLoadingQueue(true);
    setQueueError('');
    try {
      const res = await fetch(`/api/admin/submissions?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const sorted = Array.isArray(data.submissions)
          ? [...data.submissions].sort((a, b) => (b.type === 'removal') - (a.type === 'removal'))
          : [];
        setWaiting(sorted);
      } else {
        setQueueError(data.error || 'Could not load pending submissions.');
      }
    } catch {
      setQueueError('Could not connect to server.');
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Automatically refresh queue and counts when returning to the tab
  useEffect(() => {
    function onFocus() {
      loadQueue();
      refreshCounts();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadQueue, refreshCounts]);

  const refreshCounts = useCallback(async () => {
    try {
      const next = {};
      let stale = 0;
      for (const key of SECTION_KEYS) {
        const cfg = SECTIONS[key];
        if (!cfg) continue;
        let all = supabase.from(cfg.table).select('id', { count: 'exact', head: true });
        let old = supabase.from(cfg.table).select('id', { count: 'exact', head: true }).eq('status', 'approved')
          .or(`verified_at.is.null,verified_at.lt.${outdatedCutoff()}`);
        if (key === 'transport') {
          all = all.or('kind.eq.transport,description.ilike.%[TRANSPORT]%,description.ilike.%auto%,description.ilike.%taxi%');
          old = old.or('kind.eq.transport,description.ilike.%[TRANSPORT]%,description.ilike.%auto%,description.ilike.%taxi%');
        } else if (key === 'workers') {
          all = all.or('kind.eq.worker,description.ilike.%[WORKER]%');
          old = old.or('kind.eq.worker,description.ilike.%[WORKER]%');
        } else if (key === 'shops') {
          all = all.or('kind.eq.business,kind.eq.shop');
          old = old.or('kind.eq.business,kind.eq.shop');
        } else {
          for (const [k, v] of Object.entries(cfg.match || {})) {
            all = all.eq(k, v);
            old = old.eq(k, v);
          }
        }
        const [a, o] = await Promise.all([all, cfg.verify ? old : Promise.resolve({ count: 0 })]);
        next[key] = a.count || 0;
        stale += o.count || 0;
      }
      setCounts(next);
      setOutdated(stale);
    } catch (err) {
      console.error('Error fetching admin counts:', err);
    }
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  const [actionError, setActionError] = useState('');

  // 1-Click Approve and Publish to Live Directory
  async function handleApproveAndPublish(row) {
    setActionError('');
    setProcessingId(row.id);
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', id: row.id, submission: row }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionError(data.error || 'Failed to publish. Please try again.');
        setProcessingId('');
        return;
      }

      showToast({
        type: 'success',
        message: 'Approved & Published!',
        sub: `"${row.title}" is now live in ${data.label || 'directory'}`,
      });

      setWaiting((prev) => prev.filter((item) => String(item.id) !== String(row.id)));
      await refreshCounts();
    } catch (err) {
      setActionError(err?.message || 'Error publishing submission');
    } finally {
      setProcessingId('');
    }
  }

  // Handle standard reject or mark handled
  async function resolve(row, status, action) {
    setActionError('');
    setProcessingId(row.id);
    try {
      if (status === 'handled') {
        const res = await fetch('/api/admin/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve', id: row.id, submission: row }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setActionError(data.error || 'Could not publish');
          setProcessingId('');
          return;
        }
        showToast({
          type: 'success',
          message: 'Published to Directory',
          sub: `"${row.title}" is now live in directory`,
        });
        setWaiting((prev) => prev.filter((item) => String(item.id) !== String(row.id)));
        await refreshCounts();
        setProcessingId('');
        return;
      }

      const res = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', id: row.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionError(data.error || 'Could not save. Please try again.');
        setProcessingId('');
        return;
      }
      await logAudit(user, { action, table: 'submissions', rowId: row.id, note: row.title });
      setWaiting((prev) => prev.filter((item) => String(item.id) !== String(row.id)));
      await refreshCounts();
    } catch (err) {
      setActionError(err?.message || 'Error processing submission');
    } finally {
      setProcessingId('');
    }
  }

  // Sync any submissions that were marked approved/handled in the past but missing from live directory tables
  const syncApprovedSubmissions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.publishedCount > 0) {
        showToast({
          type: 'success',
          message: `${data.publishedCount} approved inputs published!`,
          sub: 'Now visible in public directory listings',
        });
        await refreshCounts();
      }
    } catch (err) {
      console.warn('[syncApprovedSubmissions error]', err);
    }
  }, [refreshCounts]);

  // Run auto-sync once on mount to recover any un-migrated approved inputs
  useEffect(() => {
    syncApprovedSubmissions(false);
  }, [syncApprovedSubmissions]);

  return (
    <div className="page">
      <header className="band">
        <div className="bandrow">
          <span className="small"><strong>{user.email}</strong></span>
          <div className="btnrow" style={{ flex: 'none' }}>
            <button type="button" className="btn" onClick={signOut}>Sign out</button>
            <MenuButton />
          </div>
        </div>
        <div>
          <h1>Admin</h1>
          <p className="sub">അഡ്മിൻ പാനൽ · Review, edit and manage everything on the site</p>
        </div>
      </header>
      <main className="body">
        {/* Quick Action: Custom Notification & Urgent Broadcast */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #1f1d18 0%, #2e281d 100%)',
            color: '#ffffff',
            border: '1.5px solid var(--accent-border, #d8b368)',
            borderRadius: 18,
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            marginBottom: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>📢</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#fef3c7' }}>
                Community Broadcast &amp; Custom Alerts
              </div>
              <span style={{ fontSize: 12.5, color: '#d1d5db' }}>
                Send urgent announcements directly to residents via WhatsApp &amp; Push
              </span>
            </div>
          </div>
          <Link
            href="/admin/notifications"
            className="btn dark"
            style={{
              background: 'linear-gradient(135deg, #c5a059 0%, #b38b3f 100%)',
              color: '#121212',
              fontWeight: 800,
              fontSize: 13,
              minHeight: 36,
              border: 'none',
              padding: '0 14px',
            }}
          >
            📢 Send Notification &rarr;
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ margin: 0 }}>Waiting for review <span className="badge">{waiting.length}</span></h2>
          <button
            type="button"
            className="btn light"
            onClick={async () => {
              await Promise.all([loadQueue(), refreshCounts()]);
              showToast({ type: 'info', message: 'Queue updated', sub: `${waiting.length} pending review` });
            }}
            disabled={loadingQueue}
            style={{ fontSize: 13, padding: '4px 10px', minHeight: 32 }}
            title="Refresh waiting submissions"
          >
            {loadingQueue ? 'Checking...' : '🔄 Refresh Queue'}
          </button>
        </div>
        <p className="muted" style={{ marginTop: 4 }}>
          Approval instantly publishes the item to the live public directory.
        </p>

        {queueError ? <p className="error">{queueError}</p> : null}
        {actionError ? <p className="error">{actionError}</p> : null}
        {waiting.length === 0 && !loadingQueue ? <p className="muted">Nothing is waiting. Nice.</p> : null}
        {waiting.map((r) => {
          const sec = getSubmissionSection(r);
          const urgent = r.type === 'removal';
          const label = getSubmissionLabel(r);
          const isBusy = processingId === r.id;
          return (
            <article key={r.id} className={`card ${urgent ? 'dark' : ''}`}>
              <div className="cardhead">
                <span className={`pill ${urgent ? 'beige' : ''}`}>{label}</span>
                <span className="small">{formatDate(r.created_at)}</span>
              </div>
              <h3>{r.title}</h3>
              {cleanDescription(r.description) ? <p style={{ whiteSpace: 'pre-line' }}>{cleanDescription(r.description)}</p> : null}
              <p className="small">
                {(() => {
                  const itemPhones = extractAllPhones(r);
                  return [
                    itemPhones.length > 0 ? `Phone${itemPhones.length > 1 ? 's' : ''}: ${itemPhones.join(', ')}` : (r.phone && `Phone: ${r.phone}`),
                    r.area && `Area: ${r.area}`,
                    r.submitter_contact && `Their contact (private): ${r.submitter_contact}`,
                  ].filter(Boolean).join(' · ');
                })()}
              </p>
              <div className="btnrow" style={{ marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
                {!urgent ? (
                  <>
                    <button
                      type="button"
                      className="btn dark"
                      onClick={() => handleApproveAndPublish(r)}
                      disabled={isBusy}
                      style={{ fontWeight: 700 }}
                    >
                      {isBusy ? 'Publishing...' : '✓ Approve & Publish'}
                    </button>
                    {sec ? (
                      <Link className="btn light" href={`/admin/${sec}/new?from=${r.id}`}>
                        Edit details
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="btn"
                      onClick={() => resolve(r, 'rejected', 'reject submission')}
                      disabled={isBusy}
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <>
                    <Link className="btn light" href={`/admin/shops?q=${encodeURIComponent(r.title)}`}>
                      Find in shops
                    </Link>
                    <Link className="btn light" href={`/admin/contacts?q=${encodeURIComponent(r.title)}`}>
                      Find in contacts
                    </Link>
                    <button
                      type="button"
                      className="btn light"
                      onClick={() => resolve(r, 'handled', 'mark handled')}
                      disabled={isBusy}
                    >
                      Mark handled
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => resolve(r, 'rejected', 'decline request')}
                      disabled={isBusy}
                    >
                      Decline
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}

        <h2>Manage content</h2>
        <p className="muted">Open any section to edit, hide, delete or add items.</p>
        <div className="grid2">
          {SECTION_KEYS.map((key) => (
            <Link
              key={key}
              href={`/admin/${key}`}
              className="tile"
              style={{
                background: '#ffffff',
                border: '1.5px solid var(--card-border)',
                borderRadius: 18,
              }}
            >
              <span className="tilehead">
                <span className="count" style={{ color: 'var(--gold-dark)' }}>{counts[key] ?? '-'}</span>
                <u style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>Manage</u>
              </span>
              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{SECTIONS[key].label}</span>
            </Link>
          ))}
        </div>

        <h2>Needs a fresh check</h2>
        <div className="note">
          <strong>{outdated} items not verified in {OUTDATED_DAYS} days</strong>
          <p>Bus times and phone numbers change often. Open a section, filter by Outdated, check them and tick “Mark as verified”.</p>
        </div>

        <h2>Site tools</h2>
        <div className="stack">
          <Link className="linkrow" href="/admin/notifications">
            <span>📢 <strong>Custom Notifications &amp; Broadcast</strong>: send urgent alerts to subscribers</span>
            <span aria-hidden="true">&#8250;</span>
          </Link>
          <Link className="linkrow" href="/admin/categories"><span>🏷️ Custom categories: add, edit and delete</span><span aria-hidden="true">&#8250;</span></Link>
          <Link className="linkrow" href="/admin/log"><span>Activity log: who changed what</span><span aria-hidden="true">&#8250;</span></Link>
          <Link className="linkrow" href="/admin/admins"><span>Admins and roles</span><span aria-hidden="true">&#8250;</span></Link>
          <Link className="linkrow" href="/admin/backup"><span>Export a backup</span><span aria-hidden="true">&#8250;</span></Link>
        </div>
      </main>
    </div>
  );
}
