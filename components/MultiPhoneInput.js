'use client';

export default function MultiPhoneInput({
  primaryPhone = '',
  onPrimaryChange,
  additionalPhones = [],
  onAdditionalChange,
  required = false,
  label = 'Phone number',
  maxPhones = 6,
}) {
  const addPhone = () => {
    if (additionalPhones.length < maxPhones) {
      onAdditionalChange([...additionalPhones, '']);
    }
  };

  const updatePhone = (index, val) => {
    const copy = [...additionalPhones];
    copy[index] = val;
    onAdditionalChange(copy);
  };

  const removePhone = (index) => {
    const copy = additionalPhones.filter((_, i) => i !== index);
    onAdditionalChange(copy);
  };

  return (
    <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label>
        {label}
        {required ? ' *' : ''}
      </label>

      {/* Primary Phone */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="tel"
          placeholder="Primary phone number (e.g. 9847...)"
          value={primaryPhone}
          onChange={(e) => onPrimaryChange(e.target.value)}
          required={required}
          style={{ flex: 1 }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--gold-dark)',
            background: 'var(--accent-tint)',
            border: '1px solid var(--accent-border)',
            padding: '4px 8px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
          }}
        >
          Primary
        </span>
      </div>

      {/* Additional Phone Numbers */}
      {additionalPhones.map((p, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="tel"
            placeholder={`Additional phone ${idx + 2}`}
            value={p}
            onChange={(e) => updatePhone(idx, e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={() => removePhone(idx)}
            className="btn small"
            style={{
              padding: '6px 10px',
              fontSize: 12,
              borderRadius: 8,
              color: '#dc2626',
              borderColor: '#fca5a5',
              background: '#fef2f2',
            }}
            title="Remove phone number"
          >
            &times; Remove
          </button>
        </div>
      ))}

      {additionalPhones.length < maxPhones && (
        <button
          type="button"
          onClick={addPhone}
          style={{
            alignSelf: 'flex-start',
            background: 'none',
            border: 'none',
            color: 'var(--gold-dark)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>+ Add alternate phone number</span>
        </button>
      )}
    </div>
  );
}
