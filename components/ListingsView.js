'use client';
import { useEffect, useMemo, useState } from 'react';
import PageHeader from './PageHeader';
import ListingCard from './ListingCard';
import { useRows } from '../lib/useRows';
import {
  getAllSubcategories,
  filterCategoriesWithListings,
  matchListingToCategory,
} from '../lib/taxonomy';

// Classifies any listing record into its primary community collection type
export function getListingCollection(item) {
  const k = (item.kind || '').toLowerCase();
  const d = (item.description || '').toLowerCase();
  if (k === 'contact') {
    return { key: 'contacts', label: 'Emergency Contacts', badge: '🚨 Emergency Contact', icon: '🚨' };
  }
  if (k === 'worker' || d.includes('[worker]')) {
    return { key: 'workers', label: 'Workers', badge: '🛠️ Worker', icon: '🛠️' };
  }
  if (
    k === 'transport' ||
    d.includes('[transport]') ||
    d.includes('auto') ||
    d.includes('taxi') ||
    d.includes('jcb') ||
    d.includes('tipper') ||
    d.includes('pickup') ||
    d.includes('service')
  ) {
    return { key: 'services', label: 'Services', badge: '🚗 Service', icon: '🚗' };
  }
  return { key: 'shops', label: 'Shops', badge: '🏪 Shop', icon: '🏪' };
}

// Shared by Important contacts, Local shops, Native workers, and Transportation pages.
export default function ListingsView({
  kind,
  sectionKey,
  title,
  ml,
  intro,
  top,
  fallbackCategories = [],
}) {
  const [typed, setTyped] = useState('');
  const [term, setTerm] = useState('');
  const [cat, setCat] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('all');

  // Read URL query parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get('q') || '';
    const catParam = params.get('cat') || '';
    const colParam = params.get('collection') || params.get('section') || '';
    if (qParam) {
      setTyped(qParam);
      setTerm(qParam);
    }
    if (catParam) {
      setCat(catParam);
    }
    if (colParam && ['shops', 'workers', 'services', 'contacts', 'all'].includes(colParam)) {
      setCollectionFilter(colParam);
    }
  }, []);

  // Determine this page's default collection type based on kind
  const defaultCollectionKey = useMemo(() => {
    if (kind === 'worker') return 'workers';
    if (kind === 'transport') return 'services';
    if (kind === 'contact') return 'contacts';
    return 'shops';
  }, [kind]);

  // Fetch all approved listings across all collection types so searching covers the entire directory
  const { rows: rawRows, loading, error } = useRows(
    (s) => s.from('listings').select('*, categories(name, name_ml)').eq('status', 'approved').order('title'),
    []
  );

  // Decorate each row with unified collection classification
  const allDecoratedRows = useMemo(() => {
    if (!rawRows) return [];
    return rawRows.map((r) => {
      const col = getListingCollection(r);
      return {
        ...r,
        collectionKey: col.key,
        collectionLabel: col.label,
        collectionBadge: col.badge,
      };
    });
  }, [rawRows]);

  // Section-scoped rows when not actively searching across collections
  const sectionRows = useMemo(() => {
    return allDecoratedRows.filter((r) => r.collectionKey === defaultCollectionKey);
  }, [allDecoratedRows, defaultCollectionKey]);

  // Fetch registered DB categories for this section
  const cats = useRows(
    (s) => {
      if (kind === 'business' || kind === 'shop') {
        return s.from('categories').select('*').or('kind.eq.business,kind.eq.shop').order('name');
      }
      return s.from('categories').select('*').eq('kind', kind || 'business').order('name');
    },
    [kind]
  );

  // Categories available for the current section
  const availableCategories = useMemo(() => {
    if (!sectionRows || sectionRows.length === 0) return [];

    const candidates = [];
    const seen = new Set();

    // 1. Taxonomy subcategories
    const activeSection = sectionKey || (kind === 'business' ? 'shops' : kind);
    const taxList = getAllSubcategories(activeSection);
    taxList.forEach((t) => {
      const key = t.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        candidates.push({
          id: t.name,
          name: t.name,
          ml: t.ml,
          icon: t.icon || '🏷️',
          group: t.group || '',
        });
      }
    });

    // 2. Database categories
    cats.rows.forEach((c) => {
      const key = (c.name || '').toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        candidates.push({
          id: c.id,
          name: c.name,
          ml: c.name_ml,
          icon: '🏷️',
        });
      }
    });

    // 3. Fallback categories if passed
    fallbackCategories.forEach((f) => {
      const key = (f.name || '').toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        candidates.push({
          id: f.id || f.name,
          name: f.name,
          ml: f.ml,
          icon: f.icon || '🏷️',
        });
      }
    });

    return filterCategoriesWithListings(candidates, sectionRows);
  }, [sectionRows, cats.rows, kind, sectionKey, fallbackCategories]);

  // Filter available categories if user searches within category chips
  const filteredCategoryChips = useMemo(() => {
    if (!catFilter.trim()) return availableCategories;
    const q = catFilter.toLowerCase();
    return availableCategories.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.ml && c.ml.includes(q))
    );
  }, [availableCategories, catFilter]);

  // Dynamic counts for each collection type matching current search term
  const collectionCounts = useMemo(() => {
    const t = term.trim().toLowerCase();
    const counts = { all: 0, shops: 0, workers: 0, services: 0, contacts: 0 };
    const tDigits = t.replace(/\D/g, '');

    for (const item of allDecoratedRows) {
      let matchesSearch = true;
      if (t) {
        const title = (item.title || '').toLowerCase();
        const area = (item.area || '').toLowerCase();
        const desc = (item.description || item.detail || '').toLowerCase();
        const catName = (item.categories?.name || '').toLowerCase();
        const phone = (item.phone || '').replace(/\D/g, '');
        matchesSearch =
          title.includes(t) ||
          area.includes(t) ||
          desc.includes(t) ||
          catName.includes(t) ||
          (tDigits && phone.includes(tDigits));
      }
      if (matchesSearch) {
        counts.all++;
        if (counts[item.collectionKey] !== undefined) {
          counts[item.collectionKey]++;
        }
      }
    }
    return counts;
  }, [allDecoratedRows, term]);

  // Filter listings based on active search across all collections or local section
  const displayedRows = useMemo(() => {
    const t = term.trim().toLowerCase();

    // 1. When a search term is present: Filter across ALL collection types (Shops, Workers, Services, Emergency Contacts)
    if (t) {
      let list = allDecoratedRows;

      // Filter by selected collection tab if user narrowed down
      if (collectionFilter !== 'all') {
        list = list.filter((item) => item.collectionKey === collectionFilter);
      }

      // Filter by text search
      const tDigits = t.replace(/\D/g, '');
      list = list.filter((item) => {
        const title = (item.title || '').toLowerCase();
        const area = (item.area || '').toLowerCase();
        const desc = (item.description || item.detail || '').toLowerCase();
        const catName = (item.categories?.name || '').toLowerCase();
        const phone = (item.phone || '').replace(/\D/g, '');
        return (
          title.includes(t) ||
          area.includes(t) ||
          desc.includes(t) ||
          catName.includes(t) ||
          (tDigits && phone.includes(tDigits))
        );
      });

      return list;
    }

    // 2. When not searching: Show either the default section or user-selected collection tab
    let list = collectionFilter === 'all'
      ? sectionRows
      : allDecoratedRows.filter((r) => r.collectionKey === collectionFilter);

    // Filter by selected category if any
    if (cat) {
      const selectedCatObj = availableCategories.find(
        (c) => String(c.id) === String(cat) || c.name.toLowerCase() === String(cat).toLowerCase()
      );
      if (selectedCatObj) {
        list = list.filter((item) => matchListingToCategory(item, selectedCatObj));
      } else {
        list = list.filter((item) => matchListingToCategory(item, { id: cat, name: cat }));
      }
    }

    return list;
  }, [allDecoratedRows, sectionRows, cat, term, collectionFilter, availableCategories]);

  // Auto-scroll and highlight if shared via direct link (?id=... or #item-...)
  useEffect(() => {
    if (loading || displayedRows.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id') || (window.location.hash ? window.location.hash.replace('#item-', '') : null);
    if (targetId) {
      setTimeout(() => {
        const el = document.getElementById(`item-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.borderColor = 'var(--accent)';
          el.style.boxShadow = '0 0 0 3px rgba(197, 160, 89, 0.35), 0 8px 24px rgba(0, 0, 0, 0.15)';
          setTimeout(() => {
            el.style.borderColor = '';
            el.style.boxShadow = '';
          }, 3500);
        }
      }, 250);
    }
  }, [loading, displayedRows]);

  const isSearching = Boolean(term.trim());

  return (
    <div className="page">
      <PageHeader title={title} ml={ml}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTerm(typed);
          }}
          style={{ position: 'relative' }}
        >
          <label htmlFor="q" className="hp">Search</label>
          <input
            id="q"
            type="search"
            placeholder="Search across Shops, Workers, Services, Emergency Contacts..."
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              setTerm(e.target.value);
            }}
            style={{ paddingRight: typed ? 36 : 14 }}
          />
          {typed && (
            <button
              type="button"
              onClick={() => {
                setTyped('');
                setTerm('');
                setCollectionFilter('all');
              }}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.06)',
                border: 'none',
                borderRadius: '50%',
                width: 24,
                height: 24,
                fontSize: 13,
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
        {top}
        {intro && !isSearching ? <p className="muted">{intro}</p> : null}

        {/* Collection Type Tabs: Shows all collections (Shops, Workers, Services, Emergency Contacts) */}
        {isSearching && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Filter Collections ({collectionCounts.all} found)
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                Searching all directory records
              </span>
            </div>
            <div className="chips" style={{ gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Collections', count: collectionCounts.all, icon: '🔍' },
                { id: 'shops', label: 'Shops', count: collectionCounts.shops, icon: '🏪' },
                { id: 'workers', label: 'Workers', count: collectionCounts.workers, icon: '🛠️' },
                { id: 'services', label: 'Services', count: collectionCounts.services, icon: '🚗' },
                { id: 'contacts', label: 'Emergency Contacts', count: collectionCounts.contacts, icon: '🚨' },
              ].map((c) => {
                const isSelected = collectionFilter === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`chip ${isSelected ? 'on' : ''}`}
                    onClick={() => setCollectionFilter(c.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    <span>{c.icon} {c.label}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 10,
                        background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                      }}
                    >
                      {c.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories Section: Shown when browsing section items */}
        {!isSearching && availableCategories.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Categories ({availableCategories.length})
              </span>
              {availableCategories.length > 6 && (
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                  style={{
                    maxWidth: 180,
                    minHeight: 34,
                    fontSize: 13,
                    padding: '0 10px',
                    borderRadius: 10,
                  }}
                />
              )}
            </div>

            <div className="chips">
              <button
                type="button"
                className={`chip ${cat === '' ? 'on' : ''}`}
                onClick={() => setCat('')}
              >
                All ({sectionRows.length})
              </button>
              {filteredCategoryChips.map((c) => {
                const isSelected = cat === c.id || cat === c.name;
                return (
                  <button
                    key={c.id || c.name}
                    type="button"
                    className={`chip ${isSelected ? 'on' : ''}`}
                    onClick={() => setCat(isSelected ? '' : (c.id ?? c.name))}
                    title={c.ml ? `${c.name} · ${c.ml}` : c.name}
                  >
                    <span>{c.icon ? `${c.icon} ` : ''}{c.name}</span>
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 11,
                        opacity: isSelected ? 0.95 : 0.75,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 10,
                        background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                      }}
                    >
                      {c.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Results summary / status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
            Showing {displayedRows.length} {displayedRows.length === 1 ? 'record' : 'records'}
            {cat ? ' in selected category' : ''}
            {isSearching ? ` matching "${term}" across directory` : ''}
          </span>
          {(cat || term || collectionFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setCat('');
                setTerm('');
                setTyped('');
                setCollectionFilter('all');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Reset filters &times;
            </button>
          )}
        </div>

        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading directory...</p> : null}
        {!loading && !error && displayedRows.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px 20px', gap: 12 }}>
            <p style={{ fontSize: 16, fontWeight: 700 }}>Nothing found</p>
            <p className="muted">
              {term
                ? `No records across Shops, Workers, Services, or Emergency Contacts matched "${term}".`
                : 'No approved records found in this category.'}
            </p>
            <div>
              <button
                type="button"
                className="btn light"
                onClick={() => {
                  setCat('');
                  setTerm('');
                  setTyped('');
                  setCollectionFilter('all');
                }}
              >
                Clear search and filters
              </button>
            </div>
          </div>
        ) : null}

        {displayedRows.map((r) => (
          <ListingCard key={r.id} row={r} />
        ))}
      </main>
    </div>
  );
}
