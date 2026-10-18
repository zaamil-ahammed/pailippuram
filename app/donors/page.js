'use client';
import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '../../components/PageHeader';
import { formatDate, extractAllPhones } from '../../lib/supabase';
import { BLOOD_GROUPS } from '../../lib/sections';
import { useRows } from '../../lib/useRows';
import { shareServiceOrApp } from '../../lib/share';

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
        {rows.map((d) => {
          const donorPhones = extractAllPhones(d);
          const cleanArea = d.area?.replace(/(?:·|\s)*Alt:\s*[+0-9\s,-]+/gi, '').trim();

          return (
            <article key={d.id} className="card">
              <div className="cardhead">
                <div>
                  <h3>{d.name}</h3>
                  <p className="muted">{cleanArea || d.area}</p>
                </div>
                <span className="group">{d.blood_group}</span>
              </div>
              {d.verified_at ? <p className="muted small">Checked {formatDate(d.verified_at)}</p> : null}
              <div className="btnrow">
                {donorPhones.map((p, idx) => (
                  <a key={idx} className="btn dark" href={`tel:${p.replace(/\D/g, '')}`}>
                    {donorPhones.length > 1 ? `Call (${idx + 1}): ${p}` : `Call ${p}`}
                  </a>
                ))}
                {donorPhones.length > 0 ? (
                  <button
                    type="button"
                    className="btn light"
                    onClick={() =>
                      shareServiceOrApp({
                        title: `Blood Donor: ${d.name} (${d.blood_group})`,
                        text: `🩸 Blood Donor (${d.blood_group}): ${d.name}${d.area ? ', ' + d.area : ''} - Ph: ${donorPhones.join(', ')}`,
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
          );
        })}
        <p className="muted small">Want to be a donor? Use “Share information” in the menu. We only list people who say yes.</p>
      </main>
    </div>
  );
}
