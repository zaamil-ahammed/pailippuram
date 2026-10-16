'use client';
import { useEffect, useState } from 'react';
import { usePWAInstall } from '../lib/usePWAInstall';

export default function InstallPrompt() {
  const { isInstalled, isIos, canPromptDirectly, triggerDirectInstall } = usePWAInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);

  useEffect(() => {
    const handleIosGuide = () => setShowIosGuide(true);
    const handleFallbackModal = () => setShowFallbackModal(true);

    window.addEventListener('show-ios-install-guide', handleIosGuide);
    window.addEventListener('show-install-modal-fallback', handleFallbackModal);

    return () => {
      window.removeEventListener('show-ios-install-guide', handleIosGuide);
      window.removeEventListener('show-install-modal-fallback', handleFallbackModal);
    };
  }, []);

  if (isInstalled) return null;

  return (
    <>
      {/* iOS Safari Guide Modal */}
      {showIosGuide && (
        <div className="scrim" style={{ zIndex: 10000, alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowIosGuide(false)}>
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 480,
              margin: '0 auto 16px',
              borderRadius: 24,
              padding: 22,
              background: '#ffffff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '2px solid var(--primary)',
              animation: 'slideUpModal 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/icon-192.png" alt="App Icon" style={{ width: 48, height: 48, borderRadius: 12 }} />
              <div>
                <h3 style={{ fontSize: 18, margin: 0 }}>Install on iPhone / iPad</h3>
                <p className="muted small">ഹോം സ്ക്രീനിലേക്ക് ചേർക്കുക</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#eff6ff',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  1
                </span>
                <span style={{ fontSize: 14 }}>
                  Tap the <strong>Share button</strong> (ഷെയർ ചിഹ്നം) in Safari’s bottom bar.
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#eff6ff',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  2
                </span>
                <span style={{ fontSize: 14 }}>
                  Scroll down and tap <strong>Add to Home Screen</strong> (ഹോം സ്ക്രീനിലേക്ക് ചേർക്കുക).
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn dark big"
              style={{ marginTop: 20, width: '100%' }}
              onClick={() => setShowIosGuide(false)}
            >
              Got it · മനസ്സിലായി
            </button>
          </div>
        </div>
      )}

      {/* Fallback browser prompt (when beforeinstallprompt hasn't fired yet) */}
      {showFallbackModal && (
        <div className="scrim" style={{ zIndex: 10000, alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowFallbackModal(false)}>
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 480,
              margin: '0 auto 16px',
              borderRadius: 24,
              padding: 22,
              background: '#ffffff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '2px solid var(--primary)',
              animation: 'slideUpModal 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/icon-192.png" alt="App Icon" style={{ width: 48, height: 48, borderRadius: 12 }} />
              <div>
                <h3 style={{ fontSize: 18, margin: 0 }}>Direct Home Screen Download</h3>
                <p className="muted small">നമ്മുടെ പൈലിപ്പുറം ആപ്പ്</p>
              </div>
            </div>

            <p style={{ fontSize: 14, marginTop: 12, lineHeight: 1.45 }}>
              Tap your browser menu (<strong>⋮</strong> in Chrome on Android) and select <strong>Install app</strong> or <strong>Add to Home screen</strong> for instant direct launch.
            </p>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                className="btn dark"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowFallbackModal(false);
                  triggerDirectInstall();
                }}
              >
                Try Direct Install
              </button>
              <button
                type="button"
                className="btn"
                style={{ flex: 1 }}
                onClick={() => setShowFallbackModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
