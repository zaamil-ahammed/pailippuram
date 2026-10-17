'use client';
import { useRef, useState } from 'react';

// Compresses and centers an image onto a square canvas of max 320x320
function processAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select an image file (PNG, JPG, WebP).'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const targetDim = 320;
        const canvas = document.createElement('canvas');
        canvas.width = targetDim;
        canvas.height = targetDim;
        const ctx = canvas.getContext('2d');

        // Center-crop to square
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetDim, targetDim);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Could not read image file.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export default function ImageUploadField({ value = '', onChange, label = 'Profile Photo / ഫോട്ടോ (optional)' }) {
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const [compressing, setCompressing] = useState(false);
  const [err, setErr] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setErr('File size is too large (max 12MB).');
      return;
    }

    setErr('');
    setCompressing(true);
    try {
      const compressedDataUri = await processAndCompressImage(file);
      onChange(compressedDataUri);
    } catch (error) {
      setErr(error.message || 'Failed to process image.');
    } finally {
      setCompressing(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setErr('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="field" style={{ gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontWeight: 600, fontSize: 14.5 }}>{label}</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`chip ${mode === 'upload' ? 'on' : ''}`}
            onClick={() => setMode('upload')}
            style={{ minHeight: 30, padding: '0 10px', fontSize: 12 }}
          >
            Upload
          </button>
          <button
            type="button"
            className={`chip ${mode === 'url' ? 'on' : ''}`}
            onClick={() => setMode('url')}
            style={{ minHeight: 30, padding: '0 10px', fontSize: 12 }}
          >
            Image Link
          </button>
        </div>
      </div>

      {value ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 12,
            background: 'var(--accent-tint)',
            border: '1.5px solid var(--accent-border)',
            borderRadius: 16,
          }}
        >
          <img
            src={value}
            alt="Preview"
            referrerPolicy="no-referrer"
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              objectFit: 'cover',
              border: '1.5px solid var(--card-border)',
              background: '#ffffff',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Photo Selected</span>
            <span className="muted small" style={{ fontSize: 11.5 }}>
              Optimized for village directory display
            </span>
          </div>
          <button
            type="button"
            className="btn light"
            onClick={handleClear}
            style={{ fontSize: 12.5, minHeight: 36, padding: '0 12px', color: '#dc2626', borderColor: '#fca5a5' }}
          >
            Remove
          </button>
        </div>
      ) : (
        <div>
          {mode === 'upload' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--accent-border)',
                background: '#f8fafc',
                borderRadius: 16,
                padding: '18px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'border-color 0.15s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'var(--accent-tint)',
                  color: 'var(--primary)',
                }}
              >
                {compressing ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                )}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                {compressing ? 'Optimizing photo...' : 'Tap to upload or take a photo'}
              </span>
              <span className="muted small" style={{ fontSize: 12 }}>
                Supports camera capture or gallery selection (PNG, JPG, WebP)
              </span>
            </div>
          ) : (
            <input
              type="text"
              placeholder="https://example.com/photo.jpg"
              value={value || ''}
              onChange={(e) => onChange(e.target.value.trim())}
              style={{ minHeight: 48 }}
            />
          )}
        </div>
      )}

      {err && <p className="error" style={{ margin: 0, padding: '8px 12px', fontSize: 13 }}>{err}</p>}
    </div>
  );
}
