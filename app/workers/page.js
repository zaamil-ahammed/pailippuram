'use client';
import Link from 'next/link';
import ListingsView from '../../components/ListingsView';

export default function Workers() {
  return (
    <ListingsView
      kind="worker"
      sectionKey="workers"
      title="Native Workers"
      ml="തൊഴിലാളികൾ & വിദഗ്ദ്ധർ"
      intro="People whom residents hire to perform a service: electricians, plumbers, carpenters, painters, masons, mechanics, technicians, tutors, and daily labourers in Pailippuram."
      top={
        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <Link
            href="/share?type=worker"
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
            Register as Worker / Team · തൊഴിലാളിയെ ചേർക്കുക
          </Link>
        </div>
      }
    />
  );
}
