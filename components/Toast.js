'use client';
import { useEffect, useRef, useState } from 'react';
import { popFlashToast } from '../lib/toast';

export default function Toast() {
  const [toast, setToast] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const timerRef = useRef(null);

  const dismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setToast(null);
      setIsLeaving(false);
    }, 220);
  };

  useEffect(() => {
    // Check for any flash toast queued before navigation
    const flash = popFlashToast();
    if (flash) {
      setToast(flash);
      timerRef.current = setTimeout(dismiss, flash.duration || 3500);
    }

    const handleToast = (e) => {
      if (!e.detail) return;
      clearTimeout(timerRef.current);
      setIsLeaving(false);
      setToast(e.detail);
      const duration = e.detail.duration || 3500;
      timerRef.current = setTimeout(dismiss, duration);
    };

    window.addEventListener('app-toast', handleToast);
    return () => {
      window.removeEventListener('app-toast', handleToast);
      clearTimeout(timerRef.current);
    };
  }, []);

  if (!toast) return null;

  const type = toast.type || 'success';
  const isError = type === 'error';
  const isInfo = type === 'info';

  const iconBg = isError
    ? '#dc2626'
    : isInfo
    ? '#2563eb'
    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

  const borderColor = isError
    ? 'rgba(239, 68, 68, 0.45)'
    : isInfo
    ? 'rgba(59, 130, 246, 0.4)'
    : 'rgba(197, 160, 89, 0.55)';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        maxWidth: 'calc(100vw - 32px)',
        width: 'auto',
        minWidth: 280,
        pointerEvents: 'auto',
        animation: isLeaving
          ? 'slideUpToastOut 0.22s cubic-bezier(0.4, 0, 1, 1) forwards'
          : 'slideDownToast 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div
        style={{
          background: 'rgba(18, 18, 18, 0.96)',
          color: '#ffffff',
          borderRadius: 20,
          border: `1.5px solid ${borderColor}`,
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.48), 0 4px 12px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '12px 14px 12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Status Icon */}
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: iconBg,
            color: '#ffffff',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          }}
        >
          {isError ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : isInfo ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0, paddingRight: 4 }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.25, color: '#ffffff', letterSpacing: '-0.01em' }}>
            {toast.message}
          </span>
          {toast.sub ? (
            <span
              style={{
                fontSize: 12.5,
                color: isError ? '#fca5a5' : isInfo ? '#93c5fd' : '#e5c98f',
                fontWeight: 500,
                lineHeight: 1.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {toast.sub}
            </span>
          ) : null}
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss notification"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a1a1aa',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'color 0.15s ease, background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#a1a1aa';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
