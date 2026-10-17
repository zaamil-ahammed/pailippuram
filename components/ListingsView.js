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

  // Read URL query parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get('q') || '';
    const catParam = params.get('cat') || '';
    if (qParam) {
      setTyped(qParam);
      setTerm(qParam);
    }
    if (catParam) {
      setCat(catParam);
    }
  }, []);

  // Fetch all approved listings for this kind
  const { rows: rawRows, loading, error } = useRows(
    (s) => {
      let q = s.from('listings').select('*, categories(name, name_ml)').eq('status', 'approved').order('title');
      if (kind === 'transport') {
        q = q.or(
          'kind.eq.transport,description.ilike.%[TRANSPORT]%,description.ilike.%auto%,description.ilike.%taxi%,description.ilike.%jcb%,description.ilike.%tipper%,description.ilike.%pickup%'
        );
      } else if (kind === 'worker') {
        q = q.or('kind.eq.worker,description.ilike.%[WORKER]%');
      } else if (kind === 'business' || kind === 'shop') {
        q = q.or('kind.eq.business,kind.eq.shop');
      } else {
        q = q.eq('kind', kind);
      }
      return q;
    },
    [kind]
  );

  // In-memory filter so null descriptions are never dropped by PostgREST
  const allRows = useMemo(() => {
    if (!rawRows) return [];
    if (kind === 'business' || kind === 'shop') {
      return rawRows.filter((r) => {
        const d = (r.description || '').toLowerCase();
        const k = (r.kind || '').toLowerCase();
        if (k === 'worker' || d.includes('[worker]')) return false;
        if (k === 'transport' || d.includes('[transport]')) return false;
        return true;
      });
    }
    return rawRows;
  }, [rawRows, kind]);

  // Fetch registered DB categories
  const cats = useRows(
    (s) => {
      if (kind === 'business' || kind === 'shop') {
        return s.from('categories').select('*').or('kind.eq.business,kind.eq.shop').order('name');
      }
      return s.from('categories').select('*').eq('kind', kind).order('name');
    },
    [kind]
  );

  // "only show categories with atleast one to show":
  // Gather all category candidates from taxonomy & DB, and filter to ONLY those with count >= 1
  const availableCategories = useMemo(() => {
    if (!allRows || allRows.length === 0) return [];

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

    // Filter to strictly keep categories with AT LEAST ONE matching listing
    return filterCategoriesWithListings(candidates, allRows);
  }, [allRows, cats.rows, kind, sectionKey, fallbackCategories]);

  // Filter available categories if user searches within category chips
  const filteredCategoryChips = useMemo(() => {
    if (!catFilter.trim()) return availableCategories;
    const q = catFilter.toLowerCase();
    return availableCategories.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.ml && c.ml.includes(q))
    );
  }, [availableCategories, catFilter]);

  // Filter listings based on active category and search term
  const displayedRows = useMemo(() => {
    let list = allRows;

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

    // Filter by text search
    const t = term.trim().toLowerCase();
    if (t) {
      list = list.filter((item) => {
        const title = (item.title || '').toLowerCase();
        const area = (item.area || '').toLowerCase();
        const desc = (item.description || item.detail || '').toLowerCase();
        const catName = (item.categories?.name || '').toLowerCase();
        return title.includes(t) || area.includes(t) || desc.includes(t) || catName.includes(t);
      });
    }

    return list;
  }, [allRows, cat, term, availableCategories]);

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
          el.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.25), 0 8px 24px rgba(37, 99, 235, 0.15)';
          setTimeout(() => {
            el.style.borderColor = '';
            el.style.boxShadow = '';
          }, 3500);
        }
      }, 250);
    }
  }, [loading, displayedRows]);

  return (
    <div className="page">
      <PageHeader title={title} ml={ml}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTerm(typed);
          }}
        >
          <label htmlFor="q" className="hp">Search</label>
          <input
            id="q"
            type="search"
            placeholder="Search by name, category, or area..."
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              // live search filter
              setTerm(e.target.value);
            }}
          />
        </form>
      </PageHeader>

      <main className="body">
        {top}
        {intro ? <p className="muted">{intro}</p> : null}

        {/* Categories Section: ONLY SHOW CATEGORIES WITH AT LEAST ONE LISTING */}
        {availableCategories.length > 0 && (
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
                All ({allRows.length})
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
            Showing {displayedRows.length} {displayedRows.length === 1 ? 'item' : 'items'}
            {cat ? ' in selected category' : ''}
            {term ? ` matching "${term}"` : ''}
          </span>
          {(cat || term) && (
            <button
              type="button"
              onClick={() => {
                setCat('');
                setTerm('');
                setTyped('');
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
        {loading ? <p className="muted">Loading...</p> : null}
        {!loading && !error && displayedRows.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px 20px', gap: 12 }}>
            <p style={{ fontSize: 16, fontWeight: 700 }}>Nothing found</p>
            <p className="muted">
              {term
                ? `No listings matched "${term}". Try checking your spelling or clearing filters.`
                : 'No approved listings are currently in this category. You can be the first to share one!'}
            </p>
            <div>
              <button
                type="button"
                className="btn light"
                onClick={() => {
                  setCat('');
                  setTerm('');
                  setTyped('');
                }}
              >
                Show all {title}
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
