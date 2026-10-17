'use client';
import Link from 'next/link';
import ListingsView from '../../components/ListingsView';

const TRANSPORT_CATEGORIES = [
  { id: 'auto', name: 'Auto Rickshaw · ഓട്ടോറിക്ഷ' },
  { id: 'taxi', name: 'Taxi / Cab · ടാക്സി കാർ' },
  { id: 'jcb', name: 'JCB / Earthmover · ജെസിബി / ടിപ്പർ' },
  { id: 'pickup', name: 'Pickup / Goods · പിക്കപ്പ്' },
  { id: 'van', name: 'Traveler / Van · വാൻ' },
  { id: 'ambulance', name: 'Ambulance · ആംബുലൻസ്' },
];

export default function Transport() {
  return (
    <ListingsView
      kind="transport"
      sectionKey="transport"
      title="Transportation Services"
      ml="വാഹനങ്ങൾ & ഗതാഗതം"
      intro="People and businesses providing transport: auto-rickshaws, taxi cabs, goods carriers, mini-trucks, lorries, tourist vehicles, and ambulance services in Pailippuram."
      top={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              href="/share?type=transport"
              className="btn light"
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 13.5,
                fontWeight: 700,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Add Driver / Vehicle · വാഹനം ചേർക്കുക
            </Link>
            <Link
              href="/bus"
              className="btn"
              style={{
                minHeight: 44,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 13.5,
                fontWeight: 700,
                padding: '0 14px',
                borderColor: 'var(--accent-border)',
                background: 'var(--accent-tint)',
              }}
            >
              🚌 Bus Timings
            </Link>
          </div>
        </div>
      }
    />
  );
}
