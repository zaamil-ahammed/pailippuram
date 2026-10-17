'use client';
import Link from 'next/link';
import ListingsView from '../../components/ListingsView';

export default function Shops() {
  return (
    <ListingsView
      kind="business"
      title="Local shops"
      ml="കടകൾ"
      intro="Supermarkets, pharmacies, bakeries, textiles, and local businesses around Pailippuram."
      top={
        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <Link
            href="/share?type=business"
            className="btn light"
            style={{
              flex: 1,
              minHeight: 46,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Add a Shop or Business · കട ചേർക്കുക
          </Link>
        </div>
      }
    />
  );
}
