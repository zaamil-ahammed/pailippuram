'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';

import { usePWAInstall } from '../lib/usePWAInstall';
import { shareServiceOrApp } from '../lib/share';

const MenuContext = createContext({ open: () => {} });
export const useMenu = () => useContext(MenuContext);

const LINKS = [
  {
    href: '/',
    label: 'Home',
    ml: 'ഹോം',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/contacts',
    label: 'Important contacts',
    ml: 'പ്രധാന നമ്പറുകൾ',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    href: '/shops',
    label: 'Local shops',
    ml: 'കടകൾ',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    href: '/transport',
    label: 'Transportation & vehicles',
    ml: 'ടാക്സി, ഓട്ടോ, ജെസിബി',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
      </svg>
    ),
  },
  {
    href: '/panchayath',
    label: 'Panchayath',
    ml: 'പഞ്ചായത്ത്',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
    href: '/announcements',
    label: 'Announcements',
    ml: 'അറിയിപ്പുകൾ',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 11 18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </svg>
    ),
  },
  {
    href: '/share',
    label: 'Share information',
    ml: 'വിവരം പങ്കിടുക',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    href: '/correction',
    label: 'Request a correction',
    ml: 'തിരുത്തൽ',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      </svg>
    ),
  },
  {
    href: '/about',
    label: 'About and privacy',
    ml: 'സ്വകാര്യത',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
];

export default function Shell({ children }) {
  const [isOpen, setOpen] = useState(false);
  const { isInstalled, triggerDirectInstall } = usePWAInstall();

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const handleShareApp = async () => {
    setOpen(false);
    await shareServiceOrApp({
      title: 'Nammude Pailippuram (നമ്മുടെ പൈലിപ്പുറം)',
      text: 'പൈലിപ്പുറത്തെ വിവരങ്ങൾ ഒരിടത്ത് - Nammude Pailippuram Community App',
      url: typeof window !== 'undefined' ? window.location.origin : '',
    });
  };

  return (
    <MenuContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      {isOpen && (
        <div className="scrim" onClick={() => setOpen(false)}>
          <nav className="drawer" aria-label="Main menu" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 4 }}>
              {!isInstalled ? (
                <button
                  type="button"
                  className="btn dark"
                  style={{ fontSize: 13, minHeight: 36, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => {
                    setOpen(false);
                    triggerDirectInstall();
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                    <path d="M12 18h.01" />
                  </svg>
                  Install App
                </button>
              ) : (
                <span className="small muted" style={{ fontWeight: 600 }}>Pailippuram</span>
              )}
              <button type="button" className="btn" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            <button
              type="button"
              className="linkrow"
              onClick={handleShareApp}
              style={{
                padding: '10px 14px',
                background: '#eff6ff',
                borderColor: '#bfdbfe',
                color: 'var(--primary)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: '#ffffff',
                    color: 'var(--primary)',
                    border: '1px solid #bfdbfe',
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </span>
                <span>
                  Share App · ലിങ്ക് പങ്കിടുക
                </span>
              </span>
              <span aria-hidden="true" style={{ fontSize: 18 }}>&#8250;</span>
            </button>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="linkrow" onClick={() => setOpen(false)} style={{ padding: '8px 14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: '#eff6ff',
                      color: 'var(--primary)',
                      border: '1px solid #dbeafe',
                      flexShrink: 0,
                    }}
                  >
                    {l.icon}
                  </span>
                  <span>
                    {l.label}
                    {l.ml ? <span className="muted"> · {l.ml}</span> : null}
                  </span>
                </span>
                <span aria-hidden="true" style={{ color: 'var(--muted)', fontSize: 18 }}>&#8250;</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </MenuContext.Provider>
  );
}
