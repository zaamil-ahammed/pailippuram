'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MenuButton } from '../../components/PageHeader';
import { useAdmin } from '../../components/AdminGate';
import { supabase, formatDate, extractAllPhones } from '../../lib/supabase';
import { logAudit } from '../../lib/audit';
import { useRows } from '../../lib/useRows';
import { OUTDATED_DAYS, SECTIONS, SECTION_KEYS, SUBMISSION_LABEL, SUBMISSION_SECTION, getSubmissionSection, getSubmissionLabel } from '../../lib/sections';

function outdatedCutoff() {
  return new Date(Date.now() - OUTDATED_DAYS * 86400000).toISOString();
}

export default function AdminHome() {
  const { user, signOut } = useAdmin();
  const [counts, setCounts] = useState({});
  const [outdated, setOutdated] = useState(0);

  const queue = useRows((s) => s.from('submissions').select('*').eq('status', 'pending').order('created_at', { ascending: false }), []);
  const waiting = Array.isArray(queue.rows)
    ? [...queue.rows].sort((a, b) => (b.type === 'removal') - (a.type === 'removal'))
    : [];

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const [actionError, setActionError] = useState('');

  async function resolve(row, status, action) {
    setActionError('');
    let nextStatus = status;
    // Remote database submissions_status_check only allows 'pending', 'approved', 'rejected'
    if (nextStatus === 'handled') {
      nextStatus = 'approved';
    }
    let { error } = await supabase.from('submissions').update({ status: nextStatus }).eq('id', row.id);
    if (error && error.message && error.message.includes('status_check')) {
      const fallbackRes = await supabase.from('submissions').update({ status: 'approved' }).eq('id', row.id);
      error = fallbackRes.error;
    }
    if (error) return setActionError(error.message || 'Could not save. Please try again.');
    await logAudit(user, { action, table: 'submissions', rowId: row.id, note: row.title });
    queue.reload();
  }

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
        <h2>Waiting for review <span className="badge">{waiting.length}</span></h2>
        <p className="muted">Removal requests come first. Aim to answer within 48 hours.</p>
        {queue.error ? <p className="error">{queue.error}</p> : null}
        {actionError ? <p className="error">{actionError}</p> : null}
        {waiting.length === 0 && !queue.loading ? <p className="muted">Nothing is waiting. Nice.</p> : null}
        {waiting.map((r) => {
          const sec = getSubmissionSection(r);
          const urgent = r.type === 'removal';
          const label = getSubmissionLabel(r);
          return (
            <article key={r.id} className={`card ${urgent ? 'dark' : ''}`}>
              <div className="cardhead">
                <span className={`pill ${urgent ? 'beige' : ''}`}>{label}</span>
                <span className="small">{formatDate(r.created_at)}</span>
              </div>
              <h3>{r.title}</h3>
              {r.description ? <p style={{ whiteSpace: 'pre-line' }}>{r.description}</p> : null}
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
              <div className="btnrow">
                {sec ? (
                  <Link className={`btn ${urgent ? 'light' : 'dark'}`} href={`/admin/${sec}/new?from=${r.id}`}>Edit and approve</Link>
                ) : (
                  <>
                    <Link className="btn light" href={`/admin/shops?q=${encodeURIComponent(r.title)}`}>Find in shops</Link>
                    <Link className="btn light" href={`/admin/contacts?q=${encodeURIComponent(r.title)}`}>Find in contacts</Link>
                  </>
                )}
                {sec ? (
                  <button type="button" className="btn" onClick={() => resolve(r, 'rejected', 'reject submission')}>Reject</button>
                ) : (
                  <>
                    <button type="button" className="btn" onClick={() => resolve(r, 'handled', 'mark handled')}>Mark handled</button>
                    <button type="button" className="btn" onClick={() => resolve(r, 'rejected', 'decline request')}>Decline</button>
                  </>
                )}
              </div>
            </article>
          );
        })}

        <h2>Manage content</h2>
        <p className="muted">Open any section to edit, hide, delete or add items.</p>
        <div className="grid2">
          {SECTION_KEYS.map((key, i) => (
            <Link key={key} href={`/admin/${key}`} className={`tile ${['sage', 'beige', ''][i % 3]}`}>
              <span className="tilehead"><span className="count">{counts[key] ?? '-'}</span><u>Edit</u></span>
              <span>{SECTIONS[key].label}</span>
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
          <Link className="linkrow" href="/admin/log"><span>Activity log: who changed what</span><span aria-hidden="true">&#8250;</span></Link>
          <Link className="linkrow" href="/admin/admins"><span>Admins and roles</span><span aria-hidden="true">&#8250;</span></Link>
          <Link className="linkrow" href="/admin/backup"><span>Export a backup</span><span aria-hidden="true">&#8250;</span></Link>
        </div>
      </main>
    </div>
  );
}
