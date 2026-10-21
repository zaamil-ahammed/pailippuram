'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const router = useRouter();
  const [typed, setTyped] = useState('');
  const [term, setTerm] = useState('');
  const [cat, setCat] = useState('');
  const [catFilter, setCatFilter] = useState('');

  // User-facing Custom Category Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatMl, setNewCatMl] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);
  const [modalMsg, setModalMsg] = useState('');
  const [modalError, setModalError] = useState('');

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
      let q = s.from('listings').select('*, categories(id, name, name_ml)').eq('status', 'approved').order('title');
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

  // "only show categories with atleast one entry":
  // Map candidates prioritizing DB categories (retaining true UUID id) then enrich with taxonomy
  const availableCategories = useMemo(() => {
    if (!allRows || allRows.length === 0) return [];

    const byName = new Map();

    // 1. Database categories (registered in Supabase, including custom categories)
    cats.rows.forEach((c) => {
      const key = (c.name || '').toLowerCase().trim();
      if (key) {
        byName.set(key, {
          id: c.id,
          dbId: c.id,
          name: c.name,
          ml: c.name_ml,
          icon: '🏷️',
        });
      }
    });

    // 2. Taxonomy subcategories (enrich icons/ml/groups, or add if not already present)
    const activeSection = sectionKey || (kind === 'business' ? 'shops' : kind);
    const taxList = getAllSubcategories(activeSection);
    taxList.forEach((t) => {
      const key = t.name.toLowerCase().trim();
      if (byName.has(key)) {
        const existing = byName.get(key);
        if (t.icon) existing.icon = t.icon;
        if (t.ml && !existing.ml) existing.ml = t.ml;
        if (t.group) existing.group = t.group;
      } else {
        byName.set(key, {
          id: t.name,
          name: t.name,
          ml: t.ml,
          icon: t.icon || '🏷️',
          group: t.group || '',
        });
      }
    });

    // 3. Fallback categories
    fallbackCategories.forEach((f) => {
      const key = (f.name || '').toLowerCase().trim();
      if (!byName.has(key)) {
        byName.set(key, {
          id: f.id || f.name,
          name: f.name,
          ml: f.ml,
          icon: f.icon || '🏷️',
        });
      }
    });

    const candidates = Array.from(byName.values());

    // Filter to strictly keep categories with AT LEAST ONE matching listing
    return filterCategoriesWithListings(candidates, allRows);
  }, [allRows, cats.rows, kind, sectionKey, fallbackCategories]);

  // Handle adding custom category from user panel modal
  async function handleAddCustomCategory(e, actionType = 'createAndList') {
    if (e && e.preventDefault) e.preventDefault();
    setModalError('');
    setModalMsg('');
    const trimmed = newCatName.trim();
    if (!trimmed || trimmed.length < 2) {
      setModalError('Category name must be at least 2 characters.');
      return;
    }

    setCreatingCat(true);
    try {
      const targetKind = kind === 'shop' ? 'business' : kind;
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: targetKind,
          name: trimmed,
          name_ml: newCatMl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create category');

      if (actionType === 'createAndList') {
        setShowAddModal(false);
        setNewCatName('');
        setNewCatMl('');
        router.push(`/share?type=${encodeURIComponent(targetKind)}&cat=${encodeURIComponent(trimmed)}`);
        return;
      }

      setModalMsg(
        data.created
          ? `✅ "${trimmed}" category saved! It is now stored in the directory and visible in the Admin Panel. It will appear in this public filter list as soon as an entry is approved.`
          : `ℹ️ "${trimmed}" already exists in the directory. Add a listing to make it show up in public filters.`
      );
    } catch (err) {
      setModalError(err.message || 'Error creating category');
    } finally {
      setCreatingCat(false);
    }
  }

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
          el.style.boxShadow = '0 0 0 3px rgba(197, 160, 89, 0.35), 0 8px 24px rgba(0, 0, 0, 0.15)';
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Categories ({availableCategories.length})
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {availableCategories.length > 6 && (
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                  style={{
                    maxWidth: 160,
                    minHeight: 32,
                    fontSize: 12.5,
                    padding: '0 10px',
                    borderRadius: 16,
                  }}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setModalError('');
                  setModalMsg('');
                  setShowAddModal(true);
                }}
                className="btn small"
                style={{
                  fontSize: 12.5,
                  padding: '4px 12px',
                  borderRadius: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'var(--accent-tint)',
                  borderColor: 'var(--accent-border)',
                  color: 'var(--ink)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Add custom category"
              >
                <span>✨</span>
                <span>+ Add Category</span>
              </button>
            </div>
          </div>

          {availableCategories.length > 0 ? (
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
          ) : (
            <div
              style={{
                padding: '14px 16px',
                background: '#f8fafc',
                border: '1.5px dashed #cbd5e1',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                fontSize: 13,
                color: 'var(--muted)',
              }}
            >
              <span>
                💡 <em>Only categories with at least one active entry are shown in the public filters.</em>
              </span>
              <button
                type="button"
                onClick={() => {
                  setModalError('');
                  setModalMsg('');
                  setShowAddModal(true);
                }}
                className="btn small"
                style={{ fontSize: 12.5 }}
              >
                + Add Custom Category / Listing
              </button>
            </div>
          )}
        </div>

        {/* User-facing Custom Category Creation Modal */}
        {showAddModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 16,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !creatingCat) setShowAddModal(false);
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: '24px',
                width: '100%',
                maxWidth: 480,
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink)' }}>
                    ✨ Add Custom Category
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
                    പുതിയ വിഭാഗം ചേർക്കുക · {title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 22,
                    lineHeight: 1,
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    padding: 4,
                  }}
                  disabled={creatingCat}
                >
                  &times;
                </button>
              </div>

              {modalMsg && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  {modalMsg}
                  <div style={{ marginTop: 10 }}>
                    <Link
                      href={`/share?type=${encodeURIComponent(kind === 'shop' ? 'business' : kind)}&cat=${encodeURIComponent(newCatName.trim())}`}
                      className="btn dark small"
                      style={{ display: 'inline-block' }}
                      onClick={() => setShowAddModal(false)}
                    >
                      Add First Listing in this Category →
                    </Link>
                  </div>
                </div>
              )}

              {modalError && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: 13,
                  }}
                >
                  {modalError}
                </div>
              )}

              <form onSubmit={(e) => handleAddCustomCategory(e, 'createAndList')} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label htmlFor="user_cat_name" style={{ fontSize: 13, fontWeight: 700 }}>
                    Category Name in English *
                  </label>
                  <input
                    id="user_cat_name"
                    type="text"
                    placeholder="e.g. Organic Farm, Bicycle Repair, Ayurvedic Clinic"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    required
                    style={{ minHeight: 42, fontSize: 14 }}
                  />
                </div>

                <div className="field">
                  <label htmlFor="user_cat_ml" style={{ fontSize: 13, fontWeight: 700 }}>
                    Malayalam Name (മലയാളത്തിൽ - optional)
                  </label>
                  <input
                    id="user_cat_ml"
                    type="text"
                    placeholder="ഉദാ: ജൈവ പച്ചക്കറി, സൈക്കിൾ റിപ്പയർ..."
                    value={newCatMl}
                    onChange={(e) => setNewCatMl(e.target.value)}
                    style={{ minHeight: 42, fontSize: 14 }}
                  />
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'var(--accent-tint)',
                    border: '1px solid var(--accent-border)',
                    fontSize: 12,
                    color: 'var(--ink)',
                    lineHeight: 1.4,
                  }}
                >
                  📌 <strong>Visibility rule:</strong> Custom categories are saved immediately and seen in both the <strong>Admin Panel</strong> and the <strong>User Submission panel</strong>. In this public listing filter bar, categories only appear once they have <strong>at least one active listing</strong>.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  <button
                    type="submit"
                    className="btn dark big"
                    disabled={creatingCat}
                    style={{ width: '100%' }}
                  >
                    {creatingCat ? 'Saving Category...' : 'Save & Add First Listing →'}
                  </button>

                  <button
                    type="button"
                    className="btn"
                    disabled={creatingCat}
                    onClick={(e) => handleAddCustomCategory(e, 'createOnly')}
                    style={{ width: '100%' }}
                  >
                    Save Category Only (to Directory & Admin)
                  </button>
                </div>
              </form>
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
