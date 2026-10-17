'use client';
import { useState } from 'react';

// Maps category or trade names to a tailored SVG icon and color scheme
function getCategoryIcon(category = '', kind = 'worker') {
  const c = category.toLowerCase();

  if (kind === 'panchayath' || c.includes('president') || c.includes('secretary') || c.includes('bearer')) {
    return {
      bg: '#eff6ff',
      color: '#1e3a8a',
      border: '#bfdbfe',
      svg: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="21" x2="21" y2="21" />
          <line x1="4" y1="10" x2="20" y2="10" />
          <polyline points="12 3 20 10 4 10 12 3" />
          <line x1="7" y1="10" x2="7" y2="21" />
          <line x1="12" y1="10" x2="12" y2="21" />
          <line x1="17" y1="10" x2="17" y2="21" />
        </svg>
      ),
    };
  }

  if (c.includes('ward') || c.includes('member')) {
    return {
      bg: '#f0fdf4',
      color: '#15803d',
      border: '#bbf7d0',
      svg: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    };
  }

  if (c.includes('electric') || c.includes('ഇലക്ട്രി')) {
    return {
      bg: '#fffbeb',
      color: '#b45309',
      border: '#fde68a',
      svg: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    };
  }

  if (c.includes('plumb') || c.includes('പ്ലംബ')) {
    return {
      bg: '#eff6ff',
      color: '#1d4ed8',
      border: '#bfdbfe',
      svg: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
    };
  }

  if (c.includes('paint') || c.includes('പെയിന്റ്')) {
    return {
      bg: '#fdf4ff',
      color: '#9333ea',
      border: '#f5d0fe',
      svg: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
      ),
    };
  }

  if (c.includes('carpent') || c.includes('ആശാരി')) {
    return {
      bg: '#fff7ed',
      color: '#c2410c',
      border: '#fed7aa',
      svg: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" />
          <path d="M17.64 15 22 10.64" />
          <path d="m20.91 3.26-6.36 6.36" />
          <path d="m17.5 2.5 4 4" />
        </svg>
      ),
    };
  }

  if (c.includes('mason') || c.includes('കെട്ടിട') || c.includes('brick')) {
    return {
      bg: '#f8fafc',
      color: '#475569',
      border: '#cbd5e1',
      svg: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M3 15h18" />
          <path d="M9 3v6" />
          <path d="M15 9v6" />
          <path d="M9 15v6" />
        </svg>
      ),
    };
  }

  if (c.includes('coconut') || c.includes('തെങ്ങ്') || c.includes('tree')) {
    return {
      bg: '#f0fdf4',
      color: '#15803d',
      border: '#bbf7d0',
      svg: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8c0 2.16 1.52 4 3.64 4.73L5 22h4l-.64-9.27C10.48 12 13 10.16 13 8z" />
          <path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5 0 2.21-1.6 4.07-3.8 4.77L19 22h-4l.7-6.23" />
        </svg>
      ),
    };
  }

  if (c.includes('weld') || c.includes('വെൽഡി')) {
    return {
      bg: '#fef2f2',
      color: '#b91c1c',
      border: '#fecaca',
      svg: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    };
  }

  // Default trade / worker persona
  return {
    bg: '#eff6ff',
    color: '#1e40af',
    border: '#bfdbfe',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };
}

export default function PersonAvatar({ src, alt = 'Profile', category = '', kind = 'worker', size = 76 }) {
  const [imgError, setImgError] = useState(false);
  const iconTheme = getCategoryIcon(category, kind);

  const hasPhoto = Boolean(src && typeof src === 'string' && src.trim() && !imgError);

  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: 18,
        overflow: 'hidden',
        background: hasPhoto ? '#f1f5f9' : iconTheme.bg,
        border: `1.5px solid ${hasPhoto ? 'var(--card-border)' : iconTheme.border}`,
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: iconTheme.color,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {hasPhoto ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <div
          title={category || alt}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          {iconTheme.svg}
        </div>
      )}
    </div>
  );
}
