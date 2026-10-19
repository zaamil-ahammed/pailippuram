'use client';
import { useState } from 'react';

const QUICK_TAGS = [
  { id: 'Alt', label: 'Alt / രണ്ടാമത്തെ നമ്പർ' },
  { id: 'Landline', label: 'Landline / ലാൻഡ്‌ലൈൻ' },
  { id: 'WhatsApp', label: 'WhatsApp' },
  { id: 'Stand', label: 'Stand / സ്റ്റാൻഡ്' },
  { id: 'Office', label: 'Office / ഓഫീസ്' },
  { id: 'Night', label: '24 Hours / രാത്രി സർവീസ്' },
];

export default function MultiPhoneInput({
  primaryPhone = '',
  onPrimaryChange,
  additionalPhones = [],
  onAdditionalChange,
  required = false,
  label = 'Phone Number / ഫോൺ നമ്പർ',
  placeholder = 'Primary phone number (e.g. 9846012345)',
  maxPhones = 6,
}) {
  const [splitNotice, setSplitNotice] = useState('');

  // Auto-detect and split multiple phone numbers pasted into any field
  function handlePasteOrInput(val, isPrimary = true, index = -1) {
    if (!val) {
      if (isPrimary) onPrimaryChange('');
      else {
        const copy = [...additionalPhones];
        copy[index] = '';
        onAdditionalChange(copy);
      }
      return;
    }

    // Check if multiple numbers exist separated by comma, slash, semicolon, or newline
    const rawTokens = String(val).split(/[,/;\n]/).map((s) => s.trim()).filter(Boolean);
    const validTokens = [];

    for (const token of rawTokens) {
      const cleanDigits = token.replace(/\D/g, '');
      if (cleanDigits.length >= 6) {
        validTokens.push(token);
      }
    }

    if (validTokens.length > 1) {
      // Split detected!
      let newPrimary = isPrimary ? validTokens[0] : primaryPhone;
      let existingExtras = [...additionalPhones];

      if (isPrimary) {
        onPrimaryChange(validTokens[0]);
        const newExtras = [...validTokens.slice(1), ...existingExtras].slice(0, maxPhones - 1);
        onAdditionalChange(newExtras);
      } else {
        const copy = [...existingExtras];
        copy[index] = validTokens[0];
        const addedExtras = validTokens.slice(1);
        const combined = [...copy.slice(0, index + 1), ...addedExtras, ...copy.slice(index + 1)].slice(0, maxPhones - 1);
        onAdditionalChange(combined);
      }

      setSplitNotice(`Separated ${validTokens.length} phone numbers into individual fields.`);
      setTimeout(() => setSplitNotice(''), 4000);
      return;
    }

    if (isPrimary) {
      onPrimaryChange(val);
    } else {
      const copy = [...additionalPhones];
      copy[index] = val;
      onAdditionalChange(copy);
    }
  }

  function addNumber() {
    if (additionalPhones.length < maxPhones - 1) {
      onAdditionalChange([...additionalPhones, '']);
    }
  }

  function removeNumber(idx) {
    onAdditionalChange(additionalPhones.filter((_, i) => i !== idx));
  }

  function applyTag(idx, tagLabel) {
    const current = additionalPhones[idx] || '';
    // Strip previous tag if present
    const cleanNum = current.replace(/\s*\([^)]*\)$/, '').trim();
    const updated = cleanNum ? `${cleanNum} (${tagLabel})` : `(${tagLabel})`;
    const copy = [...additionalPhones];
    copy[idx] = updated;
    onAdditionalChange(copy);
  }

  const allNumbersCount = (primaryPhone ? 1 : 0) + additionalPhones.filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Primary Phone Field */}
      <div className="field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label htmlFor="primary-phone" style={{ fontWeight: 700, fontSize: 14 }}>
            {label} {required ? '*' : ''}
          </label>
          {allNumbersCount > 1 && (
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                background: 'var(--accent-tint)',
                color: 'var(--gold-dark)',
                border: '1px solid var(--accent-border)',
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              {allNumbersCount} Numbers Listed
            </span>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <input
            id="primary-phone"
            type="tel"
            maxLength={35}
            required={required}
            placeholder={placeholder}
            value={primaryPhone}
            onChange={(e) => handlePasteOrInput(e.target.value, true)}
          />
        </div>
        <span className="muted small" style={{ fontSize: 12 }}>
          Primary number for direct calls. You can add more numbers below.
        </span>
      </div>

      {splitNotice && (
        <div
          style={{
            fontSize: 12.5,
            padding: '6px 12px',
            borderRadius: 10,
            background: 'var(--accent-tint)',
            border: '1px solid var(--accent-border)',
            color: 'var(--gold-dark)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>✓</span> {splitNotice}
        </div>
      )}

      {/* Additional Phone Numbers */}
      {additionalPhones.map((p, idx) => (
        <div
          key={idx}
          style={{
            background: '#ffffff',
            border: '1.5px solid var(--card-border)',
            borderRadius: 16,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor={`extra-phone-${idx}`} style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
              Additional Phone {idx + 2} / രണ്ടാമത്തെ നമ്പർ
            </label>
            <button
              type="button"
              onClick={() => removeNumber(idx)}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: 6,
              }}
              title="Remove this phone number"
            >
              ✕ Remove
            </button>
          </div>

          <input
            id={`extra-phone-${idx}`}
            type="tel"
            maxLength={35}
            placeholder={`Additional phone ${idx + 2} (e.g. Landline, Driver, Alt)`}
            value={p}
            onChange={(e) => handlePasteOrInput(e.target.value, false, idx)}
          />

          {/* Quick Tag Suggestion Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Tag as:</span>
            {QUICK_TAGS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTag(idx, t.id)}
                style={{
                  background: p.includes(`(${t.id})`) ? 'var(--primary)' : 'var(--accent-tint)',
                  color: p.includes(`(${t.id})`) ? '#ffffff' : 'var(--gold-dark)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 999,
                  fontSize: 11,
                  padding: '2px 8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Button to Add More Numbers */}
      {additionalPhones.length < maxPhones - 1 && (
        <div>
          <button
            type="button"
            className="btn light"
            onClick={addNumber}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              minHeight: 42,
              fontSize: 14,
              borderRadius: 14,
              cursor: 'pointer',
              border: '1.5px dashed var(--accent)',
              fontWeight: 700,
              color: 'var(--gold-dark)',
              background: 'var(--accent-tint)',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            + Add another phone number · മറ്റൊരു നമ്പർ ചേർക്കുക
          </button>
        </div>
      )}

      {/* Live Preview of Direct Call Buttons if multiple numbers exist */}
      {allNumbersCount > 1 && (
        <div
          style={{
            background: 'var(--accent-tint)',
            border: '1px solid var(--accent-border)',
            borderRadius: 12,
            padding: '10px 12px',
            fontSize: 12,
            color: 'var(--gold-dark)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📞</span> Multiple numbers enabled!
          </div>
          <div>
            Visitors will see separate <strong>Call (1)</strong>, <strong>Call (2)</strong> buttons on the listing card for quick calling.
          </div>
        </div>
      )}
    </div>
  );
}
