'use client';
import Link from 'next/link';
import ListingsView from '../../components/ListingsView';

const EMERGENCY = [
  { n: '112', label: 'All Emergency' },
  { n: '108', label: 'Ambulance' },
  { n: '100', label: 'Police' },
  { n: '101', label: 'Fire & Rescue' },
  { n: '1091', label: 'Women Helpline' },
  { n: '1098', label: 'Child Helpline' },
];

export default function Contacts() {
  return (
    <ListingsView
      kind="contact"
      sectionKey="contacts"
      title="Important Contacts"
      ml="പ്രധാന നമ്പറുകൾ"
      intro="Emergency services, hospitals, clinics, police, fire force, KSEB, and local public offices in Pailippuram."
      top={
        <>
          <div className="grid2" style={{ gap: 8, marginBottom: 6 }}>
            {EMERGENCY.map((e) => (
              <a key={e.n} href={`tel:${e.n}`} className="tile sage" style={{ minHeight: 60, padding: '8px 12px' }}>
                <span className="count" style={{ fontSize: 18 }}>{e.n}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{e.label}</span>
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
