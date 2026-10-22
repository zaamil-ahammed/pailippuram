export default function NotFound() {
  return (
    <div style={{ padding: '48px 20px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>404 - Page Not Found</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        പേജ് കണ്ടെത്താനായില്ല. ദയവായി ഹോം പേജിലേക്ക് മടങ്ങുക.
      </p>
      <a
        href="/"
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          background: '#09090b',
          color: '#ffffff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        ഹോം പേജിലേക്ക് മടങ്ങുക (Go Home)
      </a>
    </div>
  );
}
