'use client';
import { useState, useRef } from 'react';

/**
 * Robust image compressor and cropper.
 * Prevents images from ever saving as solid black by:
 * 1. Strictly awaiting img.onload and img.decode().
 * 2. Pre-filling canvas background with solid white (#ffffff).
 * 3. Accurately computing center-crop square dimensions.
 * 4. Running a pixel sanity check before accepting the canvas data URL,
 *    falling back to direct base64 if canvas drawing produced an unintended black frame.
 */
function processImageFile(file, targetSize = 400) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (JPEG, PNG, WebP).'));
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Could not read the selected image file.'));

    reader.onload = () => {
      const rawDataUrl = reader.result;
      if (!rawDataUrl || typeof rawDataUrl !== 'string') {
        return reject(new Error('Image reader returned empty data.'));
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onerror = () => {
        // Fallback to raw data URL if Image element cannot decode
        resolve(rawDataUrl);
      };

      img.onload = async () => {
        try {
          if (typeof img.decode === 'function') {
            try {
              await img.decode();
            } catch {
              // decode failure is non-fatal; continue to draw
            }
          }

          const nw = img.naturalWidth || img.width;
          const nh = img.naturalHeight || img.height;

          if (!nw || !nh || nw < 1 || nh < 1) {
            // Cannot read natural dimensions, use raw data
            return resolve(rawDataUrl);
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (!ctx) {
            return resolve(rawDataUrl);
          }

          // 1. Fill white background so transparent PNGs/WebPs never turn into solid black in JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetSize, targetSize);

          // 2. Center-crop square calculations
          const minDim = Math.min(nw, nh);
          const sx = Math.floor((nw - minDim) / 2);
          const sy = Math.floor((nh - minDim) / 2);

          // 3. Render image onto canvas
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);

          // 4. Sanity check: Ensure canvas didn't generate all-black pixels
          try {
            const sample = ctx.getImageData(0, 0, targetSize, targetSize).data;
            let hasNonBlack = false;
            // Check every 25th pixel
            for (let i = 0; i < sample.length; i += 100) {
              const r = sample[i];
              const g = sample[i + 1];
              const b = sample[i + 2];
              if (r > 15 || g > 15 || b > 15) {
                hasNonBlack = true;
                break;
              }
            }

            if (!hasNonBlack) {
              // Canvas produced pitch black; fall back to original raw file data URL
              console.warn('[ImageUploadField] Canvas produced pure black frame. Reverting to raw file data.');
              return resolve(rawDataUrl);
            }
          } catch {
            // Ignore getImageData security errors if any and proceed
          }

          // 5. Convert to compact, high-quality JPEG
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          if (compressed && compressed.length > 100) {
            resolve(compressed);
          } else {
            resolve(rawDataUrl);
          }
        } catch (err) {
          console.warn('[ImageUploadField] Canvas processing error:', err);
          resolve(rawDataUrl);
        }
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}

export default function ImageUploadField({
  id = 'photo-upload',
  label = 'Profile Photo / ഫോട്ടോ (optional)',
  value = '',
  onChange,
  disabled = false,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [rawUrl, setRawUrl] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setLoading(true);

    try {
      const processed = await processImageFile(file, 400);
      if (onChange) {
        onChange(processed);
      }
    } catch (err) {
      setError(err?.message || 'Could not process this image. Please try another photo.');
    } finally {
      setLoading(false);
      // Reset input so re-selecting same file works
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyUrl = () => {
    if (!rawUrl.trim()) return;
    setError('');
    if (onChange) {
      onChange(rawUrl.trim());
    }
    setShowUrlInput(false);
    setRawUrl('');
  };

  const handleRemove = () => {
    setError('');
    if (onChange) {
      onChange('');
    }
  };

  return (
    <div className="image-upload-field" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label htmlFor={id} style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
        {label}
      </label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={disabled || loading}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: 12,
          background: '#ffffff',
          border: '1.5px solid var(--card-border)',
          borderRadius: 16,
        }}
      >
        {/* Avatar Preview */}
        <div
          style={{
            width: 72,
            height: 72,
            minWidth: 72,
            minHeight: 72,
            borderRadius: 16,
            background: 'var(--accent-tint, #faf6ee)',
            border: '1.5px solid var(--accent-border, #e8ddc8)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {loading ? (
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-dark)', textAlign: 'center', padding: 4 }}>
              Loading...
            </div>
          ) : value ? (
            <img
              src={value}
              alt="Photo preview"
              referrerPolicy="no-referrer"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gold-dark)' }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              className="btn light"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || loading}
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: '6px 14px',
                minHeight: 36,
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {value ? 'Change photo' : 'Upload photo'}
            </button>

            {value && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px 8px',
                }}
              >
                ✕ Remove
              </button>
            )}

            {!showUrlInput && (
              <button
                type="button"
                onClick={() => setShowUrlInput(true)}
                disabled={disabled || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: 12.5,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '6px 4px',
                }}
              >
                Or enter link
              </button>
            )}
          </div>

          <p className="muted small" style={{ margin: 0, fontSize: 11.5, lineHeight: 1.3 }}>
            JPG, PNG, or WebP. Automatically center-cropped &amp; optimized.
          </p>
        </div>
      </div>

      {/* URL Input Toggle */}
      {showUrlInput && (
        <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          <input
            type="url"
            placeholder="Paste public image URL (https://...)"
            value={rawUrl}
            onChange={(e) => setRawUrl(e.target.value)}
            style={{ fontSize: 13, padding: '8px 12px', flex: 1 }}
          />
          <button
            type="button"
            className="btn dark"
            onClick={handleApplyUrl}
            style={{ fontSize: 13, padding: '8px 14px', borderRadius: 10 }}
          >
            Apply
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setShowUrlInput(false);
              setRawUrl('');
            }}
            style={{ fontSize: 13, padding: '8px 10px', borderRadius: 10 }}
          >
            Cancel
          </button>
        </div>
      )}

      {error && <p className="error" style={{ margin: 0, fontSize: 13, padding: '8px 12px' }}>{error}</p>}
    </div>
  );
}
