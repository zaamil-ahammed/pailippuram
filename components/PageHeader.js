'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useMenu } from './Shell';
import { shareServiceOrApp } from '../lib/share';

export function MenuButton() {
  const { open } = useMenu();
  return (
    <button type="button" className="iconbtn" aria-label="Open menu" onClick={open}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  );
}

// The site logo. Put your logo file at public/logo.png. Until then only the name shows.
export function Brand() {
  const [hasLogo, setHasLogo] = useState(true);
  return (
    <Link href="/" className="brand">
       {hasLogo && <img src="/logo.png" alt="" onError={() => setHasLogo(false)} />} 
      {/* <span>Nammude Pailippuram</span> */}
    </Link>
  );
}

export function SharePageButton({ title, text }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    await shareServiceOrApp({
      title: title ? `${title} · Nammude Pailippuram` : 'Nammude Pailippuram',
      text: text || 'Nammude Pailippuram - Local Directory & Services',
      url: typeof window !== 'undefined' ? window.location.href : '',
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      className="iconbtn"
      onClick={handleShare}
      title="Share link / ലിങ്ക് കോപ്പി ചെയ്യുക"
      aria-label="Share link"
      style={{
        border: '1.5px solid rgba(255, 255, 255, 0.3)',
        background: copied ? 'rgba(34, 197, 94, 0.35)' : 'rgba(255, 255, 255, 0.12)',
        color: '#ffffff',
      }}
    >
      {copied ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
    </button>
  );
}

// Band used by every page except Home.
export default function PageHeader({ title, ml, back = '/', backLabel = 'Home', children }) {
  return (
    <header className="band">
      <div className="bandrow">
        <Link href={back} className="back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          {backLabel}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SharePageButton title={title} />
          <MenuButton />
        </div>
      </div>
      <div>
        <h1>{title}</h1>
        {ml ? <p className="sub">{ml}</p> : null}
      </div>
      {children}
    </header>
  );
}
