'use client';
import { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, QrCode, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';

export default function NfcQrModal({ url, memberName, role, onClose }) {
  const [qrSrc, setQrSrc] = useState('');
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#09090b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((dataUrl) => {
        setQrSrc(dataUrl);
      })
      .catch((err) => {
        console.warn('QR code generation error:', err);
      });
  }, [url]);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${memberName} · Victory Club Profile`,
          text: `Connect with ${memberName} (${role || 'Victory Club Member'}) via NFC digital card:`,
          url: url,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="nfc-modal-overlay" onClick={onClose}>
      <div className="nfc-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="nfc-modal-header">
          <div className="nfc-modal-title-wrap">
            <span className="nfc-modal-icon-badge">
              <QrCode size={18} />
            </span>
            <div>
              <h3 className="nfc-modal-title">NFC Contact Card</h3>
              <p className="nfc-modal-subtitle">Scan with phone camera or tap NFC</p>
            </div>
          </div>
          <button
            type="button"
            className="nfc-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* QR Frame */}
        <div className="nfc-qr-display-box">
          {qrSrc ? (
            <div className="nfc-qr-frame">
              <img src={qrSrc} alt={`QR Code for ${memberName}`} className="nfc-qr-image" />
              <div className="nfc-qr-emblem">
                <span>V</span>
              </div>
            </div>
          ) : (
            <div className="nfc-qr-loading">Generating secure QR code...</div>
          )}
          <div className="nfc-member-signature">
            <p className="nfc-sig-name">{memberName}</p>
            <p className="nfc-sig-role">{role || 'Victory Club'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="nfc-modal-actions">
          <button
            type="button"
            className="nfc-action-btn primary"
            onClick={handleCopy}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'NFC Link Copied!' : 'Copy NFC Link'}</span>
          </button>

          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              type="button"
              className="nfc-action-btn secondary"
              onClick={handleNativeShare}
            >
              <Share2 size={16} />
              <span>{shared ? 'Shared!' : 'Share Profile'}</span>
            </button>
          )}
        </div>

        {/* URL Pill */}
        <div className="nfc-url-preview" title={url}>
          <span className="nfc-url-text">{url}</span>
        </div>
      </div>

      <style jsx>{`
        .nfc-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.82);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: nfcFadeIn 0.2s ease-out;
        }

        .nfc-modal-card {
          width: 100%;
          max-width: 380px;
          background: #12131a;
          border: 1px solid rgba(212, 175, 55, 0.35);
          border-radius: 24px;
          padding: 24px 20px;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(212, 175, 55, 0.15);
          display: flex;
          flex-direction: column;
          gap: 18px;
          position: relative;
        }

        .nfc-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nfc-modal-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nfc-modal-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(212, 175, 55, 0.12);
          border: 1px solid rgba(212, 175, 55, 0.4);
          color: #f59e0b;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nfc-modal-title {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .nfc-modal-subtitle {
          font-size: 12px;
          color: #9ca3af;
          margin: 2px 0 0 0;
        }

        .nfc-modal-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .nfc-modal-close:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.15);
        }

        .nfc-qr-display-box {
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 20px 16px 16px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        .nfc-qr-frame {
          position: relative;
          background: #ffffff;
          padding: 12px;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          width: 220px;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nfc-qr-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .nfc-qr-emblem {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 38px;
          height: 38px;
          background: #09090b;
          border: 2px solid #f59e0b;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
        }

        .nfc-qr-emblem span {
          color: #f59e0b;
          font-weight: 900;
          font-size: 18px;
          font-family: serif;
        }

        .nfc-qr-loading {
          width: 220px;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: #9ca3af;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
        }

        .nfc-member-signature {
          text-align: center;
        }

        .nfc-sig-name {
          font-size: 15px;
          font-weight: 700;
          color: #f3f4f6;
          margin: 0;
        }

        .nfc-sig-role {
          font-size: 12px;
          color: #d4af37;
          margin: 2px 0 0 0;
          font-weight: 500;
        }

        .nfc-modal-actions {
          display: flex;
          gap: 10px;
        }

        .nfc-action-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 44px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }

        .nfc-action-btn.primary {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #000000;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
        }

        .nfc-action-btn.primary:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        .nfc-action-btn.secondary {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .nfc-action-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.14);
        }

        .nfc-url-preview {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 8px 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nfc-url-text {
          font-size: 11px;
          color: #9ca3af;
          font-family: monospace;
        }

        @keyframes nfcFadeIn {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
