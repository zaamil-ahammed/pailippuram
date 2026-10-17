'use client';
import { useState } from 'react';
import { formatDate, whatsappLink } from '../lib/supabase';
import { shareServiceOrApp } from '../lib/share';
import PersonAvatar from './PersonAvatar';

// One shop, worker, or contact on a public page.
export default function ListingCard({ row }) {
  const [copied, setCopied] = useState(false);
  const wa = whatsappLink(row.whatsapp || row.phone);
  const isWorkerOrPerson = row.kind === 'worker' || Boolean(row.photo_url);

  const handleShare = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : (row.kind === 'worker' ? '/workers' : '/shops');
    const directUrl = `${origin}${pathname}?id=${row.id}#item-${row.id}`;

    await shareServiceOrApp({
      title: `${row.title} · Nammude Pailippuram`,
      text: `${row.title}${row.area ? ' (' + row.area + ')' : ''}${row.phone ? ' - Ph: ' + row.phone : ''}`,
      url: directUrl,
    });

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="card" id={`item-${row.id}`}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {isWorkerOrPerson && (
          <PersonAvatar
            src={row.photo_url}
            alt={row.title}
            category={row.categories?.name || row.title}
            kind="worker"
            size={72}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="cardhead">
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{ wordBreak: 'break-word' }}>{row.title}</h3>
              <p className="muted" style={{ fontSize: 13.5 }}>{[row.categories?.name, row.area].filter(Boolean).join(' · ')}</p>
            </div>
            <button
              type="button"
              className="iconbtn"
              style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid var(--accent-border)', color: copied ? '#16a34a' : 'var(--primary)', flexShrink: 0 }}
              title="Share direct link / ലിങ്ക് പങ്കിടുക"
              aria-label="Share direct link"
              onClick={handleShare}
            >
              {copied ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              )}
            </button>
          </div>
          {row.hours ? <p className="small" style={{ marginTop: 4 }}>Open: {row.hours}</p> : null}
          {row.description ? <p style={{ marginTop: 4 }}>{row.description}</p> : null}
          {row.verified_at ? <p className="muted small" style={{ marginTop: 4 }}>Checked {formatDate(row.verified_at)}</p> : null}
        </div>
      </div>
      
      <div className="btnrow" style={{ marginTop: 4 }}>
        {row.phone ? (
          <a className="btn dark" href={`tel:${row.phone}`}>
            Call {row.phone}
          </a>
        ) : null}
        {wa ? (
          <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        ) : null}
        <button
          type="button"
          className="btn light"
          onClick={handleShare}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {copied ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              Share link
            </>
          )}
        </button>
      </div>
    </article>
  );
}

