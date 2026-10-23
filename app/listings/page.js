'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PageHeader from '../../components/PageHeader';
import {
  supabase,
  isConfigured,
  cleanDescription,
  extractAllPhones,
  whatsappLink,
  formatDate,
} from '../../lib/supabase';
import { shareServiceOrApp } from '../../lib/share';

function DirectorySearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const rawInitialSection = searchParams.get('section') || searchParams.get('kind') || 'all';
  const initialSection =
    rawInitialSection === 'transport'
      ? 'services'
      : rawInitialSection === 'contact'
      ? 'contacts'
      : rawInitialSection === 'worker'
      ? 'workers'
      : rawInitialSection === 'shop' || rawInitialSection === 'business'
      ? 'shops'
      : rawInitialSection;

  const [q, setQ] = useState(initialQ);
  const [selectedSection, setSelectedSection] = useState(initialSection);
  const [copiedId, setCopiedId] = useState(null);

  const [listings, setListings] = useState([]);
  const [donors, setDonors] = useState([]);
  const [buses, setBuses] = useState([]);
  const [panchayath, setPanchayath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch directory data once on mount
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    Promise.all([
      supabase
        .from('listings')
        .select('id,kind,title,description,phone,whatsapp,area,hours,verified_at,updated_at,categories(name)')
        .eq('status', 'approved')
        .order('title'),
      supabase
        .from('donors')
        .select('id,name,blood_group,phone,area,available,verified_at,updated_at')
        .eq('status', 'approved')
        .order('name'),
      supabase
        .from('bus_routes')
        .select('id,route,bus_name,direction,times,verified_at,updated_at')
        .eq('status', 'approved')
        .order('route'),
      supabase
        .from('panchayath_items')
        .select('id,section,title,detail,extra,verified_at,updated_at')
        .eq('status', 'approved')
        .order('title'),
    ])
      .then(([resListings, resDonors, resBuses, resPanchayath]) => {
        if (resListings.error || resDonors.error || resBuses.error || resPanchayath.error) {
          setError('Could not load directory data. Please check your connection.');
        }
        setListings(resListings.data || []);
        setDonors(resDonors.data || []);
        setBuses(resBuses.data || []);
        setPanchayath(resPanchayath.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError('Error loading directory: ' + (err?.message || 'Unknown error'));
        setLoading(false);
      });
  }, []);

  // Update query when searchParams change externally
  useEffect(() => {
    const externalQ = searchParams.get('q');
    if (externalQ !== null && externalQ !== q) {
      setQ(externalQ);
    }
  }, [searchParams]);

  // Keep browser address bar in sync with live search query
  const handleQueryChange = (val) => {
    setQ(val);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (val.trim()) {
        url.searchParams.set('q', val);
      } else {
        url.searchParams.delete('q');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Normalize all directory rows into standard search records
  const allItems = useMemo(() => {
    const list = [];

    // 1. Listings (Shops, Contacts, Workers, Services)
    for (const r of listings) {
      let sec = 'shops';
      let badge = '🏪 Shop';
      let kind = (r.kind || '').toLowerCase();
      const d = (r.description || '').toLowerCase();

      if (kind === 'contact') {
        sec = 'contacts';
        badge = '🚨 Emergency Contact';
      } else if (kind === 'worker' || d.includes('[worker]')) {
        sec = 'workers';
        badge = '🛠️ Worker';
      } else if (
        kind === 'transport' ||
        d.includes('[transport]') ||
        d.includes('auto') ||
        d.includes('taxi') ||
        d.includes('jcb') ||
        d.includes('tipper') ||
        d.includes('pickup') ||
        d.includes('service')
      ) {
        sec = 'services';
        badge = '🚗 Service';
      } else {
        sec = 'shops';
        badge = '🏪 Shop';
      }

      list.push({
        id: r.id,
        section: sec,
        badge,
        title: r.title,
        category: r.categories?.name || '',
        area: r.area || '',
        description: cleanDescription(r.description, r.categories?.name),
        phone: r.phone,
        whatsapp: r.whatsapp,
        hours: r.hours,
        verified_at: r.verified_at || r.updated_at,
        phones: extractAllPhones(r),
        shareUrl: `/${sec === 'services' ? 'transport' : sec}?id=${r.id}#item-${r.id}`,
      });
    }

    // 2. Blood Donors
    for (const d of donors) {
      list.push({
        id: d.id,
        section: 'donors',
        badge: '🩸 Blood Donor',
        title: d.name,
        category: `Blood Group: ${d.blood_group}`,
        bloodGroup: d.blood_group,
        available: d.available,
        area: d.area || '',
        description: d.available ? 'Available to donate / രക്തദാനത്തിന് ലഭ്യമാണ്' : 'Currently not available',
        phone: d.phone,
        phones: extractAllPhones(d),
        whatsapp: null,
        verified_at: d.verified_at || d.updated_at,
        shareUrl: `/donors?id=${d.id}#donor-${d.id}`,
      });
    }

    // 3. Bus Routes
    for (const b of buses) {
      list.push({
        id: b.id,
        section: 'bus',
        badge: '🚌 Bus Timing',
        title: b.route,
        category: b.bus_name ? `Bus: ${b.bus_name}` : 'Bus Route',
        busName: b.bus_name || '',
        direction: b.direction || '',
        area: b.direction || '',
        description: b.times ? `Departure times:\n${b.times}` : '',
        times: b.times || '',
        phone: null,
        phones: [],
        whatsapp: null,
        verified_at: b.verified_at || b.updated_at,
        shareUrl: `/bus?id=${b.id}`,
      });
    }

    // 4. Panchayath
    for (const p of panchayath) {
      const secLabel =
        p.section === 'bearer'
          ? 'Office Bearer'
          : p.section === 'ward'
          ? 'Ward Member'
          : p.section === 'service'
          ? 'Civic Service'
          : 'Public Notice';

      list.push({
        id: p.id,
        section: 'panchayath',
        badge: '🏛️ Panchayath',
        title: p.title,
        category: secLabel,
        area: '',
        description: cleanDescription(p.detail),
        phone: p.extra,
        phones: extractAllPhones({ phone: p.extra }),
        whatsapp: null,
        verified_at: p.verified_at || p.updated_at,
        shareUrl: `/panchayath`,
      });
    }

    return list;
  }, [listings, donors, buses, panchayath]);

  // Filter items matching search query
  const filteredItems = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return allItems;

    return allItems.filter((item) => {
      const matchTitle = (item.title || '').toLowerCase().includes(term);
      const matchCat = (item.category || '').toLowerCase().includes(term);
      const matchArea = (item.area || '').toLowerCase().includes(term);
      const matchDesc = (item.description || '').toLowerCase().includes(term);
      const matchPhone = (item.phone || '').replace(/\D/g, '').includes(term.replace(/\D/g, ''));
      const matchBlood = item.bloodGroup && item.bloodGroup.toLowerCase().includes(term);
      const matchBus = item.busName && item.busName.toLowerCase().includes(term);

      return matchTitle || matchCat || matchArea || matchDesc || matchPhone || matchBlood || matchBus;
    });
  }, [allItems, q]);

  // Count items per section for tabs
  const sectionCounts = useMemo(() => {
    const counts = { all: filteredItems.length };
    for (const item of filteredItems) {
      counts[item.section] = (counts[item.section] || 0) + 1;
      if (item.section === 'services') {
        counts['transport'] = (counts['transport'] || 0) + 1;
      }
    }
    return counts;
  }, [filteredItems]);

  // Filter by selected section tab
  const displayedItems = useMemo(() => {
    if (selectedSection === 'all') return filteredItems;
    if (selectedSection === 'transport' || selectedSection === 'services') {
      return filteredItems.filter((i) => i.section === 'services' || i.section === 'transport');
    }
    return filteredItems.filter((i) => i.section === selectedSection);
  }, [filteredItems, selectedSection]);

  const handleShare = async (item) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}${item.shareUrl}`;

    await shareServiceOrApp({
      title: `${item.title} · Nammude Pailippuram`,
      text: `${item.title}${item.category ? ' (' + item.category + ')' : ''}${item.phones.length > 0 ? ' - Ph: ' + item.phones.join(', ') : ''}`,
      url: shareUrl,
    });

    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const SECTIONS_CONFIG = [
    { id: 'all', label: 'All Collections', icon: '🔍' },
    { id: 'shops', label: 'Shops', icon: '🏪' },
    { id: 'workers', label: 'Workers', icon: '🛠️' },
    { id: 'services', label: 'Services', icon: '🚗' },
    { id: 'contacts', label: 'Emergency Contacts', icon: '🚨' },
    { id: 'donors', label: 'Blood Donors', icon: '🩸' },
    { id: 'bus', label: 'Bus Timing', icon: '🚌' },
    { id: 'panchayath', label: 'Panchayath', icon: '🏛️' },
  ];

  return (
    <div className="page">
      <PageHeader title="Search Directory" ml="ഡയറക്ടറി തിരയുക">
        <form onSubmit={(e) => e.preventDefault()} style={{ position: 'relative' }}>
          <label htmlFor="directory-q" className="hp">
            Search
          </label>
          <input
            id="directory-q"
            type="search"
            value={q}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search across Shops, Workers, Services, Emergency Contacts..."
            aria-label="Search directory"
            autoFocus={Boolean(initialQ)}
          />
          {q && (
            <button
              type="button"
              onClick={() => handleQueryChange('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.06)',
                border: 'none',
                borderRadius: '50%',
                width: 26,
                height: 26,
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--ink)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Clear search"
            >
              &times;
            </button>
          )}
        </form>
      </PageHeader>

      <main className="body">
        {/* Section Filter Tabs */}
        <div className="chips" style={{ gap: 6, marginBottom: 4 }}>
          {SECTIONS_CONFIG.map((sec) => {
            const count = sectionCounts[sec.id] || 0;
            // Only show tabs that have results or if it is currently selected
            if (sec.id !== 'all' && count === 0 && selectedSection !== sec.id) return null;
            const isSelected = selectedSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                className={`chip ${isSelected ? 'on' : ''}`}
                onClick={() => setSelectedSection(sec.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                }}
              >
                <span>{sec.icon}</span>
                <span>{sec.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results status header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
            Showing {displayedItems.length} {displayedItems.length === 1 ? 'result' : 'results'}
            {q.trim() ? ` for "${q.trim()}"` : ' across directory'}
          </span>
          {(q || selectedSection !== 'all') && (
            <button
              type="button"
              onClick={() => {
                handleQueryChange('');
                setSelectedSection('all');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 6px',
              }}
            >
              Reset filters &times;
            </button>
          )}
        </div>

        {error && <p className="error">{error}</p>}
        {loading && <p className="muted">Searching directory...</p>}

        {/* Empty State */}
        {!loading && !error && displayedItems.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '32px 20px', gap: 14 }}>
            <div style={{ fontSize: 32 }}>🔍</div>
            <h3 style={{ fontSize: 18, color: 'var(--ink)' }}>No results found</h3>
            <p className="muted" style={{ lineHeight: 1.5, margin: '0 auto', maxWidth: 400 }}>
              {q.trim()
                ? `No directory records matched "${q.trim()}". Try checking your spelling, using English or Malayalam, or searching by area.`
                : 'No approved records are available in this section yet.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 6 }}>
              {q && (
                <button
                  type="button"
                  className="btn light"
                  onClick={() => {
                    handleQueryChange('');
                    setSelectedSection('all');
                  }}
                >
                  Show all records
                </button>
              )}
              <Link href="/share" className="btn dark">
                + Share information · വിവരം ചേർക്കുക
              </Link>
            </div>
          </div>
        )}

        {/* Results Cards List */}
        {displayedItems.map((item) => {
          const isCopied = copiedId === item.id;
          const wa = whatsappLink(item.whatsapp || item.phones[0]);

          const subtitle = [item.category, item.area].filter(Boolean).join(' · ');

          return (
            <article className="card" key={`${item.section}-${item.id}`} id={`item-${item.id}`}>
              <div className="cardhead">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>{item.title}</h3>
                    {item.bloodGroup && (
                      <span
                        style={{
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          fontWeight: 800,
                          fontSize: 12,
                          padding: '1px 8px',
                          borderRadius: 6,
                        }}
                      >
                        {item.bloodGroup}
                      </span>
                    )}
                  </div>
                  {subtitle ? <p className="muted">{subtitle}</p> : null}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item.badge ? <span className="pill">{item.badge}</span> : null}
                  <button
                    type="button"
                    className="iconbtn"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      border: '1px solid var(--accent-border)',
                      color: isCopied ? 'var(--accent)' : 'var(--gold-dark)',
                      flexShrink: 0,
                    }}
                    title="Share direct link / ലിങ്ക് പങ്കിടുക"
                    aria-label="Share direct link"
                    onClick={() => handleShare(item)}
                  >
                    {isCopied ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {item.hours && <p className="small">Open: {item.hours}</p>}
              {item.times && (
                <div
                  style={{
                    background: 'var(--accent-tint)',
                    border: '1px solid var(--accent-border)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    margin: '4px 0',
                    fontSize: 13,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {item.times}
                </div>
              )}
              {item.description && !item.times && (
                <p style={{ margin: '4px 0', whiteSpace: 'pre-line' }}>{item.description}</p>
              )}
              {item.verified_at && (
                <p className="muted small">Checked {formatDate(item.verified_at)}</p>
              )}

              {/* Action Buttons */}
              <div className="btnrow" style={{ marginTop: 6 }}>
                {item.phones.map((p, idx) => (
                  <a key={idx} className="btn dark" href={`tel:${p.replace(/\D/g, '')}`}>
                    Call {p}
                  </a>
                ))}
                {wa && (
                  <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  className="btn light"
                  onClick={() => handleShare(item)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {isCopied ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                      Share link
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
}

export default function Listings() {
  return (
    <Suspense
      fallback={
        <div className="page">
          <PageHeader title="Search Directory" ml="ഡയറക്ടറി തിരയുക" />
          <main className="body">
            <p className="muted">Loading directory search...</p>
          </main>
        </div>
      }
    >
      <DirectorySearchContent />
    </Suspense>
  );
}
