'use client';
import { useRef, useState } from 'react';

/**
 * Enhanced, accessible search bar with magnifying glass icon,
 * clear button (✕), focus glow, and optional result counter.
 */
export default function SearchBar({
  value = '',
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Search by name, area, service or number...',
  id = 'site-search',
  ariaLabel = 'Search',
  autoFocus = false,
  resultsCount,
  className = '',
  style = {},
  variant = 'band', // 'band' (for header bands) | 'card' (for white surfaces)
}) {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    if (onChange) {
      onChange({ target: { value: '' } });
    }
    if (onClear) {
      onClear();
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const isBand = variant === 'band';

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (onSubmit) onSubmit(e);
      }}
      className={`search-bar-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        ...style,
      }}
    >
      <label htmlFor={id} className="hp">
        {ariaLabel}
      </label>

      {/* Leading Search Icon */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          color: isFocused ? 'var(--gold-dark)' : '#78716c',
          transition: 'color 0.18s ease, transform 0.18s ease',
          zIndex: 2,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>

      {/* Search Input */}
      <input
        ref={inputRef}
        id={id}
        type="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: '100%',
          minHeight: 46,
          height: 46,
          borderRadius: 16,
          paddingLeft: 42,
          paddingRight: value ? (typeof resultsCount === 'number' ? 96 : 42) : 16,
          fontSize: 14.5,
          fontWeight: 500,
          background: isBand ? '#ffffff' : '#ffffff',
          color: 'var(--ink)',
          border: isBand
            ? isFocused
              ? '1.5px solid var(--accent)'
              : '1.5px solid rgba(255, 255, 255, 0.45)'
            : isFocused
            ? '1.5px solid var(--accent)'
            : '1.5px solid var(--card-border)',
          boxShadow: isFocused
            ? '0 0 0 3px rgba(197, 160, 89, 0.35), 0 8px 20px rgba(0, 0, 0, 0.12)'
            : '0 3px 12px rgba(0, 0, 0, 0.08)',
          outline: 'none',
          transition: 'border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
        }}
      />

      {/* Optional Results Count Tag */}
      {typeof resultsCount === 'number' && value && (
        <span
          style={{
            position: 'absolute',
            right: 40,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--gold-dark)',
            background: 'var(--accent-tint)',
            border: '1px solid var(--accent-border)',
            padding: '2px 7px',
            borderRadius: 10,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {resultsCount} {resultsCount === 1 ? 'result' : 'results'}
        </span>
      )}

      {/* Trailing Clear Button (✕) */}
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search input"
          title="Clear search"
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#f1f5f9',
            border: 'none',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            transition: 'background 0.15s ease, color 0.15s ease',
            zIndex: 3,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e2e8f0';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      ) : null}
    </form>
  );
}
