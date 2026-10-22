'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchBar from './SearchBar';
import { useRows } from '../lib/useRows';
import { cleanSearch, extractAllPhones, whatsappLink } from '../lib/supabase';

const POPULAR_SEARCHES = [
  { label: '🚨 PHC Hospital', query: 'PHC', href: '/contacts?q=PHC' },
  { label: '⚡ KSEB Electrician', query: 'KSEB', href: '/contacts?q=KSEB' },
  { label: '🛺 Auto & Taxi', query: 'Auto', href: '/transport?q=Auto' },
  { label: '💻 Akshaya Centre', query: 'Akshaya', href: '/contacts?q=Akshaya' },
  { label: '🛠️ Workers', query: 'worker', href: '/workers' },
  { label: '🚌 Bus to Tirur', query: 'Tirur', href: '/bus?q=Tirur' },
  { label: '🩸 Blood Donors', query: 'donor', href: '/donors' },
];

export default function HomeOmniSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Fetch approved listings for instant omni-search
  const { rows: listings } = useRows(
    (s) => s.from('listings').select('*, categories(name, name_ml)').eq('status', 'approved').limit(150),
    []
  );

  // Fetch bus routes for search
  const { rows: busRoutes } = useRows(
    (s) => s.from('bus_routes').select('*').eq('status', 'approved').limit(30),
    []
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Compute matched items
  const results = useMemo(() => {
    const raw = cleanSearch(query).toLowerCase();
    if (!raw || raw.length < 1) return { all: [], count: 0 };

    const matchedListings = (listings || []).filter((l) => {
      const title = (l.title || '').toLowerCase();
      const desc = (l.description || '').toLowerCase();
      const area = (l.area || '').toLowerCase();
      const cat = (l.categories?.name || '').toLowerCase();
      const catMl = (l.categories?.name_ml || '').toLowerCase();
      const kind = (l.kind || '').toLowerCase();
      return (
        title.includes(raw) ||
        desc.includes(raw) ||
        area.includes(raw) ||
        cat.includes(raw) ||
        catMl.includes(raw) ||
        kind.includes(raw)
      );
    });

    const matchedBuses = (busRoutes || []).filter((b) => {
      const route = (b.route || '').toLowerCase();
      const name = (b.bus_name || '').toLowerCase();
      return route.includes(raw) || name.includes(raw);
    });

    const items = [
      ...matchedListings.map((l) => {
        let section = 'shops';
        let badge = '🏪 Shop';
        if (l.kind === 'contact') {
          section = 'contacts';
          badge = '🚨 Contact';
        } else if (l.kind === 'worker') {
          section = 'workers';
          badge = '🛠️ Worker';
        } else if (l.kind === 'transport') {
          section = 'transport';
          badge = '🚗 Transport';
        }
        return {
          id: l.id,
          title: l.title,
          subtitle: [l.categories?.name, l.area].filter(Boolean).join(' · '),
          badge,
          href: `/${section}?id=${l.id}#item-${l.id}`,
          phones: extractAllPhones(l),
          whatsapp: l.whatsapp,
        };
      }),
      ...matchedBuses.map((b) => ({
        id: b.id,
        title: b.route,
        subtitle: b.bus_name || 'Bus Route',
        badge: '🚌 Bus',
        href: `/bus?id=${b.id}#item-${b.id}`,
        phones: [],
      })),
    ];

    return { all: items.slice(0, 8), count: items.length };
  }, [query, listings, busRoutes]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;

    if (results.all.length > 0) {
      router.push(results.all[0].href);
    } else {
      router.push(`/shops?q=${encodeURIComponent(q)}`);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <SearchBar
        id="home-omni-search"
        placeholder="Search shops, workers, taxi, doctor, bus, KSEB..."
        ariaLabel="Search Pailippuram directory"
        value={query}
        resultsCount={query.trim().length > 0 ? results.count : undefined}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onClear={() => {
          setQuery('');
          setIsOpen(false);
        }}
        onSubmit={handleSubmit}
      />

      {/* Popular Quick-Search Suggestions */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          marginTop: 10,
          paddingBottom: 2,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {POPULAR_SEARCHES.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => {
              setQuery(chip.query);
              setIsOpen(true);
            }}
            style={{
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: 20,
              background: 'rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(6px)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.borderColor = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Floating Instant Search Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div
          role="region"
          aria-label="Search suggestions"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            borderRadius: 20,
            boxShadow: '0 18px 48px rgba(0, 0, 0, 0.22), 0 4px 14px rgba(0, 0, 0, 0.08)',
            border: '1.5px solid var(--accent-border)',
            overflow: 'hidden',
            zIndex: 9999,
            maxHeight: '65vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'enterUp 0.18s ease-out forwards',
          }}
        >
          {/* Header indicator */}
          <div
            style={{
              padding: '10px 16px',
              background: 'var(--accent-tint)',
              borderBottom: '1px solid var(--accent-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {results.count > 0 ? `Matching Pailippuram Directory (${results.count})` : 'No direct matches found'}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              Close ✕
            </button>
          </div>

          {/* Results list */}
          <div style={{ overflowY: 'auto', padding: '6px 0' }}>
            {results.all.length > 0 ? (
              results.all.map((item) => {
                const phone = item.phones[0];
                const wa = item.whatsapp || phone;
                return (
                  <div
                    key={`${item.badge}-${item.id}`}
                    style={{
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fafaf9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 6,
                            background: 'var(--accent-tint)',
                            color: 'var(--gold-dark)',
                            border: '1px solid var(--accent-border)',
                          }}
                        >
                          {item.badge}
                        </span>
                        <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>
                          {item.title}
                        </span>
                      </div>
                      {item.subtitle && (
                        <span style={{ fontSize: 12.5, color: 'var(--muted)', paddingLeft: 2 }}>
                          {item.subtitle}
                        </span>
                      )}
                    </Link>

                    {/* Quick Call Action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {phone && (
                        <a
                          href={`tel:${phone}`}
                          title={`Call ${item.title}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: '#16a34a',
                            color: '#ffffff',
                            textDecoration: 'none',
                            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        </a>
                      )}
                      {wa && (
                        <a
                          href={whatsappLink(wa)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: '#25d366',
                            color: '#ffffff',
                            textDecoration: 'none',
                            boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)',
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 12px' }}>
                  No exact matches for &quot;<strong>{query}</strong>&quot;
                </p>
                <Link
                  href={`/share?title=${encodeURIComponent(query)}`}
                  onClick={() => setIsOpen(false)}
                  className="btn small"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.5,
                    padding: '6px 14px',
                  }}
                >
                  <span>➕ Add this to Directory</span>
                </Link>
              </div>
            )}
          </div>

          {/* Footer View All link */}
          {results.count > 0 && (
            <div
              style={{
                padding: '10px 16px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                textAlign: 'center',
              }}
            >
              <Link
                href={`/shops?q=${encodeURIComponent(query)}`}
                onClick={() => setIsOpen(false)}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--gold-dark)',
                  textDecoration: 'none',
                }}
              >
                View all directory results for &quot;{query}&quot; &rarr;
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
