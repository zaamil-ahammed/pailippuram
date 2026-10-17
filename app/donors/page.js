'use client';
import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '../../components/PageHeader';
import { formatDate } from '../../lib/supabase';
import { BLOOD_GROUPS } from '../../lib/sections';
import { useRows } from '../../lib/useRows';
import { shareServiceOrApp } from '../../lib/share';
import PersonAvatar from '../../components/PersonAvatar';

export default function Donors() {
  const [group, setGroup] = useState('');
  const { rows, loading, error } = useRows(
    (s) => {
      let q = s.from('donors').select('*').eq('status', 'approved').eq('available', true).order('name');
      if (group) q = q.eq('blood_group', group);
      return q;
    },
    [group]
  );

  return (
    <div className="page">
      <PageHeader title="Blood donors" ml="രക്തദാതാക്കൾ" />
      <main className="body">
        <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
          <Link
            href="/share?type=donor"
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
              background: '#fef2f2',
              borderColor: '#fee2e2',
              color: '#e11d48',
            }}
          >
            <span style={{ fontSize: 18 }}>🩸</span>
            Register as Blood Donor · രക്തദാതാവായി പേര് നൽകുക
          </Link>
        </div>
        <p className="note">
          Everyone here agreed to be listed. Please be polite and call only when it is really needed. In an emergency,
          contact the hospital blood bank too.
        </p>
        <div className="chips">
          <button type="button" className={`chip ${group === '' ? 'on' : ''}`} onClick={() => setGroup('')}>All</button>
          {BLOOD_GROUPS.map((g) => (
            <button key={g} type="button" className={`chip ${group === g ? 'on' : ''}`} onClick={() => setGroup(g)}>{g}</button>
          ))}
        </div>
        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading...</p> : null}
        {!loading && !error && rows.length === 0 ? <p className="muted">No donors found for this group.</p> : null}
        {rows.map((d) => (
          <article key={d.id} className="card">
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <PersonAvatar
                src={d.photo_url}
                alt={d.name}
                category={d.blood_group}
                kind="donor"
                size={70}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="cardhead">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ wordBreak: 'break-word' }}>{d.name}</h3>
                    <p className="muted" style={{ fontSize: 13.5 }}>{d.area}</p>
                  </div>
                  <span className="group" style={{ flexShrink: 0 }}>{d.blood_group}</span>
                </div>
                {d.verified_at ? <p className="muted small" style={{ marginTop: 4 }}>Checked {formatDate(d.verified_at)}</p> : null}
              </div>
            </div>
            <div className="btnrow">
              {d.phone ? <a className="btn dark" href={`tel:${d.phone}`}>Call {d.phone}</a> : null}
              {d.phone ? (
                <button
                  type="button"
                  className="btn light"
                  onClick={() =>
                    shareServiceOrApp({
                      title: `Blood Donor: ${d.name} (${d.blood_group})`,
                      text: `🩸 Blood Donor (${d.blood_group}): ${d.name}${d.area ? ', ' + d.area : ''} - Ph: ${d.phone}`,
                      url: typeof window !== 'undefined' ? `${window.location.origin}/donors?id=${d.id}#item-${d.id}` : '',
                    })
                  }
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  Share contact
                </button>
              ) : null}
            </div>
          </article>
        ))}
        <p className="muted small">Want to be a donor? Use “Share information” in the menu. We only list people who say yes.</p>
      </main>
    </div>
  );
}
