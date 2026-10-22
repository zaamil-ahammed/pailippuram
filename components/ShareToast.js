'use client';
import { useEffect, useState } from 'react';

export default function ShareToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let timer;
    const handleToast = (e) => {
      clearTimeout(timer);
      setToast(e.detail);
      timer = setTimeout(() => {
        setToast(null);
      }, 2800);
    };

    window.addEventListener('app-toast', handleToast);
    return () => {
      window.removeEventListener('app-toast', handleToast);
      clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: '#121212',
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: 16,
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        maxWidth: '90vw',
        animation: 'slideDownToast 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        border: '1.5px solid rgba(197, 160, 89, 0.4)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #c5a059 0%, #8c6d32 100%)',
          color: '#ffffff',
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{toast.message}</span>
        {toast.sub && <span style={{ fontSize: 12, color: '#e5c98f', fontWeight: 500 }}>{toast.sub}</span>}
      </div>
    </div>
  );
}
