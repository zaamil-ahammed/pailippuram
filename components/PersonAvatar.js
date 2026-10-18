'use client';
import { useState } from 'react';

// Maps category, kind or trade names to a tailored SVG icon and color scheme
function getCategoryIcon(category = '', kind = 'worker') {
  const catStr = typeof category === 'string' ? category : (category?.name || String(category || ''));
  const c = catStr.toLowerCase();

  // 0. LOCAL SHOPS / BUSINESS
  if (kind === 'shop' || kind === 'business' || c.includes('shop') || c.includes('store') || c.includes('supermarket') || c.includes('bakery') || c.includes('pharmacy') || c.includes('കടകൾ') || c.includes('കട')) {
    return {
      bg: '#f0fdf4',
      color: '#16a34a',
      border: '#bbf7d0',
      svg: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    };
  }

  // 1. BLOOD DONOR
  if (kind === 'donor' || c.includes('donor') || c.includes('blood') || /^[aböo][+-]$/i.test(catStr.trim())) {
    return {
      bg: '#fff1f2',
      color: '#e11d48',
      border: '#fecdd3',
      label: catStr ? catStr.toUpperCase() : 'DONOR',
      svg: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.5c-3.6 0-6.5-2.9-6.5-6.5 0-3.2 3.8-7.8 5.7-9.9.4-.5 1.2-.5 1.6 0 1.9 2.1 5.7 6.7 5.7 9.9 0 3.6-2.9 6.5-6.5 6.5z" />
        </svg>
      ),
    };
  }

  // 2. TRANSPORTATION & VEHICLES
  if (kind === 'transport' || c.includes('auto') || c.includes('taxi') || c.includes('jcb') || c.includes('driver') || c.includes('transport') || c.includes('വാഹന')) {
    if (c.includes('ambulance') || c.includes('ആംബുലൻസ്')) {
      return {
        bg: '#fef2f2',
        color: '#dc2626',
        border: '#fca5a5',
        svg: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 10H6" /><path d="M8 8v4" /><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" />
          </svg>
        ),
      };
    }
    if (c.includes('jcb') || c.includes('earthmover') || c.includes('ജെസിബി') || c.includes('tipper') || c.includes('ടിപ്പർ')) {
      return {
        bg: '#fefce8',
        color: '#ca8a04',
        border: '#fde047',
        svg: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 6v6h4l3 3v2h-3" />
            <path d="M2 17h1" />
            <circle cx="6" cy="17" r="3" />
            <path d="M9 17h6" />
            <circle cx="18" cy="17" r="2" />
            <path d="M7 14h6" />
            <path d="M4 11V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v8" />
          </svg>
        ),
      };
    }
    if (c.includes('auto') || c.includes('ഓട്ടോ')) {
      return {
        bg: '#fef3c7',
        color: '#d97706',
        border: '#fde68a',
        svg: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 16h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3L13 4H7L4 9v5a2 2 0 0 0 1 2z" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
            <path d="M9 9h6" />
            <path d="M12 9v4" />
          </svg>
        ),
      };
    }
    if (c.includes('pickup') || c.includes('goods') || c.includes('പിക്കപ്പ്') || c.includes('van') || c.includes('traveler') || c.includes('വാൻ')) {
      return {
        bg: '#f3e8ff',
        color: '#7e22ce',
        border: '#e9d5ff',
        svg: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="5" rx="2" />
            <path d="M17 16h2c.6 0 1-.4 1-1v-2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
        ),
      };
    }
    // Standard taxi / car / transport default
    return {
      bg: '#f5f3ff',
      color: '#6d28d9',
      border: '#ddd6fe',
      svg: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      ),
    };
  }

  // 3. PANCHAYATH LEADERSHIP
  if (kind === 'panchayath' || c.includes('president') || c.includes('secretary') || c.includes('bearer')) {
    return {
      bg: '#faf6ee',
      color: '#8c6d32',
      border: '#e8ddc8',
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
      bg: '#faf6ee',
      color: '#8c6d32',
      border: '#e8ddc8',
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

  // 4. NATIVE WORKERS
  if (c.includes('electric') || c.includes('ഇലക്ട്രി')) {
    return {
      bg: '#faf6ee',
      color: '#8c6d32',
      border: '#e8ddc8',
      svg: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    };
  }

  if (c.includes('plumb') || c.includes('പ്ലംബ')) {
    return {
      bg: '#faf6ee',
      color: '#8c6d32',
      border: '#e8ddc8',
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

  // Default persona
  return {
    bg: '#faf6ee',
    color: '#8c6d32',
    border: '#e8ddc8',
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
            gap: 2,
          }}
        >
          {iconTheme.svg}
          {iconTheme.label && (
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1 }}>
              {iconTheme.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
