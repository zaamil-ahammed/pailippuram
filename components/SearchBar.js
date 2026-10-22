'use client';

export default function SearchBar({
  id = 'search-input',
  placeholder = 'Search...',
  ariaLabel = 'Search',
  value = '',
  onChange,
  onClear,
  onSubmit,
  resultsCount,
}) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (onSubmit) onSubmit();
      }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        marginTop: 6,
      }}
    >
      <label htmlFor={id} className="hp">{ariaLabel}</label>
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          minHeight: 44,
          padding: '0 40px 0 16px',
          borderRadius: 14,
          fontSize: 14,
          background: '#ffffff',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      />
      {value && onClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: 12,
            background: 'none',
            border: 'none',
            fontSize: 18,
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          &times;
        </button>
      ) : null}
      {resultsCount !== undefined ? (
        <span
          style={{
            position: 'absolute',
            right: value && onClear ? 36 : 12,
            fontSize: 11,
            fontWeight: 700,
            background: 'var(--accent-tint)',
            border: '1px solid var(--accent-border)',
            color: 'var(--gold-dark)',
            padding: '2px 7px',
            borderRadius: 10,
          }}
        >
          {resultsCount}
        </span>
      ) : null}
    </form>
  );
}
