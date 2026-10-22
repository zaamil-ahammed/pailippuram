'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Brand, MenuButton, SharePageButton } from '../components/PageHeader';
import HomeOmniSearch from '../components/HomeOmniSearch';
import { formatDate, isConfigured, isPinnedAnnouncement, cleanAnnouncementBody, cleanAnnouncementTitle } from '../lib/supabase';
import { useRows } from '../lib/useRows';

const TILES = [
  {
    href: '/contacts',
    label: 'Important contacts',
    ml: 'പ്രധാന നമ്പറുകൾ',
    bg: '#faf6ee',
    iconColor: '#8c6d32',
    border: '#e8ddc8',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    href: '/shops',
    label: 'Local shops',
    ml: 'കടകൾ',
    bg: '#faf6ee',
    iconColor: '#8c6d32',
    border: '#e8ddc8',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    href: '/workers',
    label: 'Native workers',
    ml: 'തൊഴിലാളികൾ',
    bg: '#faf6ee',
    iconColor: '#8c6d32',
    border: '#e8ddc8',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    href: '/transport',
    label: 'Taxi, Auto, JCB',
    ml: 'വാഹനങ്ങൾ / ടാക്സി',
    bg: '#faf6ee',
    iconColor: '#8c6d32',
    border: '#e8ddc8',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    ),
  },
  {
    href: '/bus',
    label: 'Bus timing',
    ml: 'ബസ് സമയം',
    bg: '#faf6ee',
    iconColor: '#8c6d32',
    border: '#e8ddc8',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="16" height="13" x="4" y="3" rx="2" />
        <path d="M4 11h16" />
        <path d="M8 3v3" />
        <path d="M16 3v3" />
        <circle cx="8" cy="14" r="1" />
        <circle cx="16" cy="14" r="1" />
        <path d="m6 16-1.5 3" />
        <path d="m18 16 1.5 3" />
      </svg>
    ),
  },
  {
    href: '/donors',
    label: 'Blood donors',
    ml: 'രക്തദാതാക്കൾ',
    bg: '#faf6ee',
    iconColor: '#8c6d32',
    border: '#e8ddc8',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
      </svg>
    ),
  },
  {
    href: '/panchayath',
    label: 'Gramapanchayath',
    ml: 'പഞ്ചായത്ത് വിവരങ്ങൾ',
    bg: '#faf6ee',
    iconColor: '#8c6d32',
    border: '#e8ddc8',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="21" x2="21" y2="21" />
        <line x1="4" y1="10" x2="20" y2="10" />
        <polyline points="12 3 20 10 4 10 12 3" />
        <line x1="7" y1="10" x2="7" y2="21" />
        <line x1="12" y1="10" x2="12" y2="21" />
        <line x1="17" y1="10" x2="17" y2="21" />
      </svg>
    ),
  },
  {
    href: '/schools',
    label: 'Numbers & Roles · ഭാരവാഹികൾ',
    ml: 'സ്കൂളുകൾ & മദ്രസകൾ',
    bg: '#faf6ee',
    iconColor: '#8c6d32',
    border: '#e8ddc8',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    href: '/announcements',
    label: 'Announcements',
    ml: 'അറിയിപ്പുകൾ',
    bg: '#faf6ee',
    iconColor: '#8c6d32',
    border: '#e8ddc8',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 11 18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </svg>
    ),
  },
];

export default function Home() {
  const news = useRows((s) => s.from('announcements').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(6), []);

  const sortedNews = [...news.rows].sort((a, b) => {
    const aPin = isPinnedAnnouncement(a) ? 1 : 0;
    const bPin = isPinnedAnnouncement(b) ? 1 : 0;
    if (aPin !== bPin) return bPin - aPin;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  }).slice(0, 3);

  return (
    <div className="page">
      <header className="band">
        <div className="bandrow" style={{ minHeight: 40, width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <MenuButton />
          <SharePageButton title="Nammude Pailippuram" text="പൈലിപ്പുറത്തെ വിവരങ്ങൾ ഒരിടത്ത് - Nammude Pailippuram Local Directory" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 0 2px' }}>
          <Brand />
          <p className="sub" style={{ marginTop: 8 }}>പൈലിപ്പുറത്തെ വിവരങ്ങൾ ഒരിടത്ത്</p>
        </div>
        <HomeOmniSearch />
      </header>
      <main className="body">
        {!isConfigured ? (
          <p className="error">The database is not connected yet. See the README, step 3.</p>
        ) : null}

        <div className="grid2" style={{ gap: 10 }}>
          {TILES.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="tile"
              style={{
                minHeight: 94,
                padding: '12px 14px',
                borderRadius: 18,
                background: '#ffffff',
                border: '1.5px solid var(--card-border)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: t.bg,
                  color: t.iconColor,
                  border: `1px solid ${t.border}`,
                }}
              >
                {t.icon}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8, width: '100%' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.25 }}>{t.ml}</span>
                <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500, lineHeight: 1.2 }}>{t.label}</span>
              </div>
            </Link>
          ))}
        </div>


        <Link href="/share" className="tile dash" style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span style={{ fontWeight: 700 }}>Share information · വിവരം പങ്കിടുക</span>
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <h2>Latest announcements</h2>
          <Link href="/announcements" style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-dark)' }}>
            View all · എല്ലാം കാണുക →
          </Link>
        </div>
        {sortedNews.length === 0 && !news.loading ? <p className="muted">No announcements yet.</p> : null}
        {sortedNews.map((n) => {
          const pinned = isPinnedAnnouncement(n);
          const cleanTitle = cleanAnnouncementTitle(n.title);
          const cleanBody = cleanAnnouncementBody(n.body);
          return (
            <Link
              href="/announcements"
              key={n.id}
              className="card"
              style={
                pinned
                  ? {
                      borderColor: 'var(--accent)',
                      background: 'linear-gradient(180deg, #fdfbf7 0%, #ffffff 100%)',
                      boxShadow: '0 4px 16px rgba(197, 160, 89, 0.12)',
                    }
                  : {}
              }
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <h3 style={pinned ? { color: 'var(--gold-dark)', fontWeight: 800 } : {}}>{cleanTitle}</h3>
                {pinned && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      background: 'var(--accent-tint)',
                      color: 'var(--gold-dark)',
                      padding: '2px 8px',
                      borderRadius: 999,
                      border: '1px solid var(--accent-border)',
                      flexShrink: 0,
                    }}
                  >
                    📌 Pinned
                  </span>
                )}
              </div>
              {n.event_date ? <p className="muted small">{formatDate(n.event_date)}</p> : null}
              {cleanBody ? <p>{cleanBody.length > 140 ? `${cleanBody.slice(0, 140)}...` : cleanBody}</p> : null}
            </Link>
          );
        })}

        <div className="note">
          <strong>Checked by people from the village.</strong> Each listing shows when it was last checked. If something
          is wrong, <Link href="/correction" style={{ textDecoration: 'underline' }}>request a correction</Link>.
        </div>
      </main>
    </div>
  );
}
