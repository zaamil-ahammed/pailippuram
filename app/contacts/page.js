'use client';
import Link from 'next/link';
import ListingsView from '../../components/ListingsView';

const EMERGENCY = [
  { n: '112', label: 'Emergency' },
  { n: '108', label: 'Ambulance' },
  { n: '100', label: 'Police' },
  { n: '101', label: 'Fire' },
];

export default function Contacts() {
  return (
    <ListingsView
      kind="contact"
      title="Important contacts"
      ml="പ്രധാന നമ്പറുകൾ"
      top={
        <>
          <div className="grid2">
            {EMERGENCY.map((e) => (
              <a key={e.n} href={`tel:${e.n}`} className="tile sage">
                <span className="count">{e.n}</span>
                <span>{e.label}</span>
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10, marginBottom: 8 }}>
            <Link
              href="/share?type=contact"
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
              Add Important Contact · നമ്പർ ചേർക്കുക
            </Link>
          </div>
        </>
      }
    />
  );
}
