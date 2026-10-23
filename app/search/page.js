'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '../../components/PageHeader';
import { supabase, extractAllPhones, whatsappLink, formatDate } from '../../lib/supabase';
import { shareServiceOrApp } from '../../lib/share';

const POPULAR_SEARCHES = [
  { label: 'Auto Rickshaw', ml: 'ഓട്ടോ' },
  { label: 'Taxi', ml: 'ടാക്സി' },
  { label: 'Electrician', ml: 'ഇലക്ട്രീഷ്യൻ' },
  { label: 'Plumber', ml: 'പ്ലംബർ' },
  { label: 'Hospital', ml: 'ആശുപത്രി' },
  { label: 'Pharmacy', ml: 'ഫാർമസി' },
  { label: 'KSEB', ml: 'വൈദ്യുതി' },
  { label: 'Akshaya', ml: 'അക്ഷയ' },
  { label: 'Bus Timings', ml: 'ബസ്' },
  { label: 'Blood Donors', ml: 'രക്തം' },
  { label: 'Supermarket', ml: 'സൂപ്പർമാർക്കറ്റ്' },
  { label: 'Meat & Chicken', ml: 'ഇറച്ചി' },
];

const TABS = [
  { id: 'all', label: 'All', ml: 'എല്ലാം' },
  { id: 'shops', label: 'Shops', ml: 'കടകൾ' },
  { id: 'workers', label: 'Workers', ml: 'തൊഴിലാളികൾ' },
  { id: 'transport', label: 'Services', ml: 'വാഹനങ്ങൾ & സർവീസുകൾ' },
  { id: 'contacts', label: 'Emergency Contacts', ml: 'അടിയന്തര നമ്പറുകൾ' },
  { id: 'bus', label: 'Bus', ml: 'ബസ് സമയം' },
  { id: 'donors', label: 'Donors', ml: 'രക്തദാതാക്കൾ' },
  { id: 'announcements', label: 'News', ml: 'അറിയിപ്പുകൾ' },
  { id: 'panchayath', label: 'Panchayath', ml: 'പഞ്ചായത്ത്' },
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get('q') || '';
  const initialTab = searchParams.get('tab') || 'all';

  const [query, setQuery] = useState(initialQ);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // All unified items from all database tables
  const [allItems, setAllItems] = useState([]);

  // Fetch all live approved records across tables on mount
  useEffect(() => {
    let isCancelled = false;

    async function fetchAll() {
      setLoading(true);
      try {
        const [
          listingsRes,
          busRes,
          donorsRes,
          announcementsRes,
          panchayathRes,
        ] = await Promise.all([
          supabase.from('listings').select('*, categories(name, name_ml)').eq('status', 'approved'),
          supabase.from('bus_routes').select('*').eq('status', 'approved'),
          supabase.from('donors').select('*').eq('status', 'approved'),
          supabase.from('announcements').select('*').eq('status', 'approved'),
          supabase.from('panchayath_items').select('*').eq('status', 'approved'),
        ]);

        if (isCancelled) return;

        const unified = [];

        // 1. Process Listings (shops, workers, transport, contacts)
        (listingsRes.data || []).forEach((row) => {
          const k = (row.kind || '').toLowerCase();
          const desc = (row.description || '').toLowerCase();
          let itemSection = 'shops';
          let sectionLabel = 'Shop';
          let sectionBadgeColor = '#2563eb';
          let sectionBg = '#eff6ff';
          let pagePath = '/shops';

          if (k === 'worker' || desc.includes('[worker]')) {
            itemSection = 'workers';
            sectionLabel = 'Native Worker';
            sectionBadgeColor = '#059669';
            sectionBg = '#ecfdf5';
            pagePath = '/workers';
          } else if (
            k === 'transport' ||
            desc.includes('[transport]') ||
            desc.includes('auto') ||
            desc.includes('taxi') ||
            desc.includes('jcb') ||
            desc.includes('tipper') ||
            desc.includes('pickup')
          ) {
            itemSection = 'transport';
            sectionLabel = 'Transport / Vehicle';
            sectionBadgeColor = '#d97706';
            sectionBg = '#fffbeb';
            pagePath = '/transport';
          } else if (k === 'contact') {
            itemSection = 'contacts';
            sectionLabel = 'Important Contact';
            sectionBadgeColor = '#7c3aed';
            sectionBg = '#f5f3ff';
            pagePath = '/contacts';
          }

          const phones = extractAllPhones(row);

          unified.push({
            id: `listing-${row.id}`,
            rawId: row.id,
            section: itemSection,
            sectionLabel,
            sectionBadgeColor,
            sectionBg,
            pagePath,
            title: row.title,
            subtitle: [row.categories?.name, row.area].filter(Boolean).join(' · '),
            description: row.description || '',
            area: row.area || '',
            hours: row.hours || '',
            phones,
            whatsapp: row.whatsapp || phones[0] || '',
            date: row.verified_at ? formatDate(row.verified_at) : null,
            extra: null,
            searchText: [
              row.title,
              row.categories?.name,
              row.categories?.name_ml,
              row.area,
              row.hours,
              row.description,
              phones.join(' '),
              sectionLabel,
            ].filter(Boolean).join(' ').toLowerCase(),
          });
        });

        // 2. Process Bus Routes
        (busRes.data || []).forEach((b) => {
          unified.push({
            id: `bus-${b.id}`,
            rawId: b.id,
            section: 'bus',
            sectionLabel: 'Bus Route',
            sectionBadgeColor: '#0891b2',
            sectionBg: '#ecfeff',
            pagePath: '/bus',
            title: b.route,
            subtitle: [b.bus_name, b.direction].filter(Boolean).join(' · '),
            description: b.times ? `Departure times:\n${b.times}` : '',
            area: b.direction || '',
            hours: '',
            phones: [],
            whatsapp: '',
            date: b.verified_at ? formatDate(b.verified_at) : null,
            extra: b.times ? b.times.split('\n').filter(Boolean).slice(0, 3).join(', ') : null,
            searchText: [
              b.route,
              b.bus_name,
              b.direction,
              b.times,
              'bus timing ബസ് സമയം',
            ].filter(Boolean).join(' ').toLowerCase(),
          });
        });

        // 3. Process Blood Donors
        (donorsRes.data || []).forEach((d) => {
          const phones = extractAllPhones(d);
          unified.push({
            id: `donor-${d.id}`,
            rawId: d.id,
            section: 'donors',
            sectionLabel: `Blood Donor · ${d.blood_group}`,
            sectionBadgeColor: '#dc2626',
            sectionBg: '#fef2f2',
            pagePath: '/donors',
            title: d.name,
            subtitle: [`Blood Group: ${d.blood_group}`, d.area, d.available ? 'Available' : 'Unavailable'].filter(Boolean).join(' · '),
            description: d.area ? `Location: ${d.area}` : '',
            area: d.area || '',
            hours: d.available ? 'Available to donate' : 'Currently unavailable',
            phones,
            whatsapp: phones[0] || '',
            date: d.verified_at ? formatDate(d.verified_at) : null,
            extra: d.blood_group,
            searchText: [
              d.name,
              d.blood_group,
              d.area,
              phones.join(' '),
              'blood donor രക്തദാതാവ് രക്തം blood',
            ].filter(Boolean).join(' ').toLowerCase(),
          });
        });

        // 4. Process Announcements
        (announcementsRes.data || []).forEach((a) => {
          unified.push({
            id: `announcement-${a.id}`,
            rawId: a.id,
            section: 'announcements',
            sectionLabel: 'Announcement',
            sectionBadgeColor: '#ea580c',
            sectionBg: '#fff7ed',
            pagePath: '/announcements',
            title: a.title,
            subtitle: a.event_date ? formatDate(a.event_date) : 'Local News',
            description: a.body || '',
            area: '',
            hours: '',
            phones: [],
            whatsapp: '',
            date: a.created_at ? formatDate(a.created_at) : null,
            extra: null,
            searchText: [
              a.title,
              a.body,
              'announcement വാർത്ത അറിയിപ്പ്',
            ].filter(Boolean).join(' ').toLowerCase(),
          });
        });

        // 5. Process Panchayath items
        (panchayathRes.data || []).forEach((p) => {
          const phones = extractAllPhones({ phone: p.extra, description: p.detail });
          unified.push({
            id: `panchayath-${p.id}`,
            rawId: p.id,
            section: 'panchayath',
            sectionLabel: `Panchayath · ${p.section || 'Office'}`,
            sectionBadgeColor: '#4f46e5',
            sectionBg: '#eef2ff',
            pagePath: '/panchayath',
            title: p.title,
            subtitle: [p.section, p.extra].filter(Boolean).join(' · '),
            description: p.detail || '',
            area: '',
            hours: '',
            phones,
            whatsapp: phones[0] || '',
            date: p.verified_at ? formatDate(p.verified_at) : null,
            extra: p.extra || null,
            searchText: [
              p.title,
              p.section,
              p.detail,
              p.extra,
              phones.join(' '),
              'panchayath പഞ്ചായത്ത് മെമ്പർ വാർഡ്',
            ].filter(Boolean).join(' ').toLowerCase(),
          });
        });

        setAllItems(unified);
      } catch (err) {
        console.error('Error fetching search items:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Update URL parameters when search or tab changes
  const updateUrl = (newQ, newTab) => {
    const params = new URLSearchParams();
    if (newQ.trim()) params.set('q', newQ.trim());
    if (newTab && newTab !== 'all') params.set('tab', newTab);
    const qs = params.toString();
    router.replace(`/search${qs ? '?' + qs : ''}`, { scroll: false });
  };

  const handleQueryChange = (val) => {
    setQuery(val);
    updateUrl(val, activeTab);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    updateUrl(query, tabId);
  };

  const handleQuickSearch = (keyword) => {
    setQuery(keyword);
    setActiveTab('all');
    updateUrl(keyword, 'all');
  };

  const handleClear = () => {
    setQuery('');
    updateUrl('', activeTab);
  };

  // Filter items matching query and category tab
  const filteredItems = useMemo(() => {
    const qClean = query.trim().toLowerCase();
    const terms = qClean ? qClean.split(/\s+/).filter(Boolean) : [];

    return allItems.filter((item) => {
      // Tab filter
      if (activeTab !== 'all' && item.section !== activeTab) {
        return false;
      }

      // Query filter: all words in terms must match search text
      if (terms.length > 0) {
        const matchesAllTerms = terms.every((term) => item.searchText.includes(term));
        if (!matchesAllTerms) return false;
      }

      return true;
    });
  }, [allItems, query, activeTab]);

  // Compute tab counts based on current search query
  const tabCounts = useMemo(() => {
    const qClean = query.trim().toLowerCase();
    const terms = qClean ? qClean.split(/\s+/).filter(Boolean) : [];

    const counts = { all: 0 };
    TABS.forEach((t) => {
      counts[t.id] = 0;
    });

    allItems.forEach((item) => {
      let matches = true;
      if (terms.length > 0) {
        matches = terms.every((term) => item.searchText.includes(term));
      }
      if (matches) {
        counts.all++;
        if (counts[item.section] !== undefined) {
          counts[item.section]++;
        }
      }
    });

    return counts;
  }, [allItems, query]);

  const handleShareItem = async (item) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const directUrl = `${origin}${item.pagePath}?id=${item.rawId}#item-${item.rawId}`;

    await shareServiceOrApp({
      title: `${item.title} · Nammude Pailippuram`,
      text: `${item.title} (${item.sectionLabel})${item.phones.length > 0 ? ' - Ph: ' + item.phones.join(', ') : ''}`,
      url: directUrl,
    });

    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="page">
      <PageHeader title="Search" ml="പൈലിപ്പുറം സമഗ്ര തിരച്ചിൽ">
        <div style={{ position: 'relative', width: '100%' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            style={{ margin: 0 }}
          >
            <label htmlFor="universal-search-input" className="hp">Search everything in Pailippuram</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="universal-search-input"
                type="search"
                autoFocus={!initialQ}
                placeholder="Search across Shops, Workers, Services, Emergency Contacts..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                style={{
                  paddingRight: query ? 40 : 16,
                  height: 48,
                  fontSize: 15,
                  borderRadius: 14,
                }}
              />
              {query ? (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--ink, #1e293b)',
                    fontSize: 12,
                    fontWeight: 'bold',
                    padding: 0,
                  }}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </PageHeader>

      <main className="body">
        {/* Quick popular search chips */}
        <div style={{ marginBottom: 12 }}>
          <p className="muted small" style={{ marginBottom: 6, fontWeight: 700 }}>
            Popular Searches / പെട്ടെന്ന് കണ്ടെത്താൻ:
          </p>
          <div
            className="chips"
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              paddingBottom: 4,
              gap: 6,
              scrollbarWidth: 'none',
            }}
          >
            {POPULAR_SEARCHES.map((ps) => {
              const active = query.toLowerCase() === ps.label.toLowerCase();
              return (
                <button
                  key={ps.label}
                  type="button"
                  className={`chip ${active ? 'on' : ''}`}
                  onClick={() => handleQuickSearch(ps.label)}
                  style={{
                    flexShrink: 0,
                    fontSize: 12.5,
                    padding: '5px 11px',
                    borderRadius: 10,
                  }}
                >
                  {ps.label} <span style={{ opacity: 0.7, fontSize: 11 }}>· {ps.ml}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category filter tabs */}
        <div
          className="chips"
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            paddingBottom: 6,
            marginBottom: 16,
            gap: 6,
            scrollbarWidth: 'none',
          }}
        >
          {TABS.map((t) => {
            const count = tabCounts[t.id] ?? 0;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`chip ${active ? 'on' : ''}`}
                onClick={() => handleTabChange(t.id)}
                style={{
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  padding: '6px 12px',
                  borderRadius: 12,
                }}
              >
                {t.label} <span style={{ opacity: 0.8, fontSize: 11.5 }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Status / Count bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            padding: '2px 4px',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--ink-muted, #64748b)', fontWeight: 600 }}>
            {query.trim() ? (
              <>
                Found <strong>{filteredItems.length}</strong> {filteredItems.length === 1 ? 'result' : 'results'} for &ldquo;{query}&rdquo;
              </>
            ) : (
              <>Showing all <strong>{filteredItems.length}</strong> local entries</>
            )}
          </span>
          {query.trim() && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent, #b45309)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '2px 6px',
              }}
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--ink-muted)' }}>
            <p>Searching directory across Pailippuram...</p>
          </div>
        ) : null}

        {/* Zero results */}
        {!loading && filteredItems.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '28px 16px',
              borderRadius: 18,
              border: '1.5px dashed var(--card-border)',
              background: '#ffffff',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <h3 style={{ marginBottom: 4 }}>No results found</h3>
            <p className="muted" style={{ fontSize: 14, maxWidth: 360, margin: '0 auto 16px' }}>
              We could not find anything matching &ldquo;{query}&rdquo; in {activeTab === 'all' ? 'any section' : activeTab}.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {activeTab !== 'all' && (
                <button
                  type="button"
                  className="btn dark"
                  onClick={() => setActiveTab('all')}
                  style={{ minHeight: 40, borderRadius: 10, fontSize: 13 }}
                >
                  Search in All categories ({tabCounts.all})
                </button>
              )}
              <button
                type="button"
                className="btn light"
                onClick={handleClear}
                style={{ minHeight: 40, borderRadius: 10, fontSize: 13 }}
              >
                Clear search query
              </button>
              <Link
                href="/share"
                className="btn"
                style={{ minHeight: 40, borderRadius: 10, fontSize: 13 }}
              >
                + Add missing service / വിവരം നൽകുക
              </Link>
            </div>
          </div>
        ) : null}

        {/* Search Results List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredItems.map((item) => {
            const isCopied = copiedId === item.id;
            const wa = item.whatsapp ? whatsappLink(item.whatsapp) : '';

            // Clean description of redundant phone lines if present
            const cleanDesc = (item.description || '')
              .replace(/(?:\n|^)(?:Alt(?:\s*Phones?|\s*Numbers?)?|Additional\s*Phones?|Phone\s*2|Ph\s*2):\s*[^\n]+/gi, '')
              .trim();

            return (
              <article
                key={item.id}
                className="card"
                style={{
                  borderRadius: 18,
                  padding: '16px',
                  background: '#ffffff',
                  border: '1.5px solid var(--card-border)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {/* Header row with Section badge and share button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          color: item.sectionBadgeColor,
                          background: item.sectionBg,
                          border: `1px solid ${item.sectionBadgeColor}33`,
                          display: 'inline-block',
                          textTransform: 'uppercase',
                          letterSpacing: 0.3,
                        }}
                      >
                        {item.sectionLabel}
                      </span>
                      {item.hours ? (
                        <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 500 }}>
                          ⏱ {item.hours}
                        </span>
                      ) : null}
                    </div>
                    <h3 style={{ margin: '2px 0 0', fontSize: 17, lineHeight: 1.3 }}>{item.title}</h3>
                    {item.subtitle ? (
                      <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>
                        {item.subtitle}
                      </p>
                    ) : null}
                  </div>

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
                    onClick={() => handleShareItem(item)}
                  >
                    {isCopied ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Description snippet */}
                {cleanDesc ? (
                  <p
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      color: 'var(--ink, #334155)',
                      margin: '2px 0 0',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {cleanDesc.length > 200 ? cleanDesc.slice(0, 200) + '...' : cleanDesc}
                  </p>
                ) : null}

                {/* Bus departure preview or date */}
                {item.date ? (
                  <p className="muted small" style={{ margin: 0 }}>
                    Checked {item.date}
                  </p>
                ) : null}

                {/* Actions row */}
                <div
                  className="btnrow"
                  style={{
                    marginTop: 4,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  {/* Call buttons */}
                  {item.phones.map((phone, idx) => (
                    <a
                      key={idx}
                      className="btn dark"
                      href={`tel:${phone.replace(/\D/g, '')}`}
                      style={{
                        padding: '7px 14px',
                        fontSize: 13,
                        borderRadius: 10,
                        minHeight: 38,
                        fontWeight: 600,
                      }}
                    >
                      📞 {item.phones.length > 1 ? `Call (${idx + 1}): ${phone}` : `Call ${phone}`}
                    </a>
                  ))}

                  {/* WhatsApp button */}
                  {wa ? (
                    <a
                      className="btn"
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '7px 14px',
                        fontSize: 13,
                        borderRadius: 10,
                        minHeight: 38,
                        fontWeight: 600,
                      }}
                    >
                      💬 WhatsApp
                    </a>
                  ) : null}

                  {/* View in section page */}
                  <Link
                    href={`${item.pagePath}?id=${item.rawId}#item-${item.rawId}`}
                    className="btn light"
                    style={{
                      padding: '7px 14px',
                      fontSize: 13,
                      borderRadius: 10,
                      minHeight: 38,
                      fontWeight: 600,
                      marginLeft: 'auto',
                    }}
                  >
                    Open section →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function UniversalSearch() {
  return (
    <Suspense
      fallback={
        <div className="page">
          <PageHeader title="Search" ml="പൈലിപ്പുറം സമഗ്ര തിരച്ചിൽ" />
          <main className="body">
            <p className="muted">Loading search directory...</p>
          </main>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
