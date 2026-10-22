'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageHeader from '../../../components/PageHeader';
import { useAdmin } from '../../../components/AdminGate';
import { supabase } from '../../../lib/supabase';

export const MENU_SECTIONS = [
  { key: 'all', label: 'All Categories', kind: null, icon: '🏷️' },
  { key: 'shops', label: 'Local Shops', kind: 'business', icon: '🏪' },
  { key: 'workers', label: 'Native Workers', kind: 'worker', icon: '🛠️' },
  { key: 'transport', label: 'Transportation', kind: 'transport', icon: '🚗' },
  { key: 'contacts', label: 'Important Contacts', kind: 'contact', icon: '🚨' },
  { key: 'education', label: 'Schools & Education', kind: 'education', icon: '🎓' },
  { key: 'panchayath', label: 'Panchayath & Civic', kind: 'panchayath', icon: '🏛️' },
  { key: 'announcements', label: 'Announcements', kind: 'announcement', icon: '📢' },
  { key: 'donors', label: 'Blood Donors', kind: 'donor', icon: '🩸' },
  { key: 'bus', label: 'Bus Transit', kind: 'bus', icon: '🚌' },
  { key: 'victory', label: 'Victory Club', kind: 'victory', icon: '🏆' },
];

export const MENU_KINDS = [
  { value: 'business', label: '🏪 Local Shops & Retail (കടകൾ & വ്യാപാരങ്ങൾ)' },
  { value: 'worker', label: '🛠️ Native Workers & Services (തൊഴിലാളികൾ)' },
  { value: 'transport', label: '🚗 Transportation Services (വാഹനങ്ങൾ & ഗതാഗതം)' },
  { value: 'contact', label: '🚨 Important Contacts & Helplines (പ്രധാന നമ്പറുകൾ)' },
  { value: 'education', label: '🎓 Schools & Education (സ്കൂളുകൾ, മദ്രസകൾ, അങ്കണവാടികൾ)' },
  { value: 'panchayath', label: '🏛️ Panchayath & Local Governance (ഗ്രാമപഞ്ചായത്ത് വിഭാഗങ്ങൾ)' },
  { value: 'announcement', label: '📢 Announcements & Alerts (അറിയിപ്പുകൾ & വാർത്തകൾ)' },
  { value: 'donor', label: '🩸 Blood Donors & Wings (രക്തദാനം)' },
  { value: 'bus', label: '🚌 Bus Transit & Routes (ബസ് റൂട്ടുകൾ)' },
  { value: 'victory', label: '🏆 Victory Club Committee (വിക്ടറി ക്ലബ് വിഭാഗങ്ങൾ)' },
];

export default function AdminCategoriesPage() {
  const { user } = useAdmin();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add / Edit category modal state
  const [modalMode, setModalMode] = useState(null); // null, 'add', or 'edit'
  const [editingCat, setEditingCat] = useState(null);
  const [formKind, setFormKind] = useState('business');
  const [formName, setFormName] = useState('');
  const [formNameMl, setFormNameMl] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState(null);

  // Load all categories with listing counts
  async function loadCategories() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/categories?withCounts=true');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load categories');
      const loaded = data.categories || [];
      setCategories(loaded);

      // Keep client-side query store in sync so forms and dropdowns see new categories immediately
      if (loaded.length > 0) {
        try {
          for (const c of loaded) {
            await supabase.from('categories').upsert({
              id: c.id,
              kind: c.kind,
              name: c.name,
              name_ml: c.name_ml || null,
            });
          }
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn(err);
      setError(err.message || 'Could not load categories');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  // Filter categories by section tab and search query
  const filteredCategories = useMemo(() => {
    let list = categories;
    if (activeTab !== 'all') {
      const targetSec = MENU_SECTIONS.find((s) => s.key === activeTab);
      if (targetSec && targetSec.kind) {
        list = list.filter((c) => {
          if (targetSec.kind === 'business') {
            return c.kind === 'business' || c.kind === 'shop';
          }
          if (targetSec.kind === 'education') {
            return c.kind === 'education' || c.kind === 'school';
          }
          return c.kind === targetSec.kind;
        });
      }
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.name_ml && c.name_ml.toLowerCase().includes(q)) ||
          (c.kind || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [categories, activeTab, search]);

  // Tab counts map
  const tabCounts = useMemo(() => {
    const counts = { all: categories.length };
    MENU_SECTIONS.forEach((sec) => {
      if (sec.key === 'all') return;
      counts[sec.key] = categories.filter((c) => {
        if (sec.kind === 'business') return c.kind === 'business' || c.kind === 'shop';
        if (sec.kind === 'education') return c.kind === 'education' || c.kind === 'school';
        return c.kind === sec.kind;
      }).length;
    });
    return counts;
  }, [categories]);

  function handleOpenAdd() {
    setModalError('');
    setEditingCat(null);
    const defaultKind = activeTab !== 'all' ? (MENU_SECTIONS.find((s) => s.key === activeTab)?.kind || 'business') : 'business';
    setFormKind(defaultKind);
    setFormName('');
    setFormNameMl('');
    setModalMode('add');
  }

  function handleOpenEdit(cat) {
    setModalError('');
    setEditingCat(cat);
    setFormKind(cat.kind || 'business');
    setFormName(cat.name || '');
    setFormNameMl(cat.name_ml || '');
    setModalMode('edit');
  }

  // Handle saving (Create or Update)
  async function handleSaveCategory(e) {
    e.preventDefault();
    setModalError('');
    if (!formName.trim() || formName.trim().length < 2) {
      setModalError('Category name must be at least 2 characters.');
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'add') {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: formKind,
            name: formName.trim(),
            name_ml: formNameMl.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create category');

        try {
          const clientCat = data.category || {
            kind: formKind,
            name: formName.trim(),
            name_ml: formNameMl.trim() || null,
          };
          await supabase.from('categories').insert(clientCat);
        } catch {
          // ignore
        }

        setSuccessMsg(
          data.created
            ? `Category "${data.category.name}" added successfully!`
            : `Category "${data.category.name}" already exists.`
        );
      } else if (modalMode === 'edit' && editingCat) {
        const res = await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCat.id,
            kind: formKind,
            name: formName.trim(),
            name_ml: formNameMl.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update category');

        try {
          await supabase.from('categories').update({
            kind: formKind,
            name: formName.trim(),
            name_ml: formNameMl.trim() || null,
          }).eq('id', editingCat.id);
        } catch {
          // ignore
        }

        setSuccessMsg(`Category "${data.category.name}" updated successfully!`);
      }

      setTimeout(() => setSuccessMsg(''), 4000);
      setModalMode(null);
      await loadCategories();
    } catch (err) {
      setModalError(err.message || 'Error saving category');
    } finally {
      setSaving(false);
    }
  }

  // Handle deleting a category
  async function handleDelete(cat) {
    if (cat.listing_count > 0) {
      setError(`Cannot delete "${cat.name}" because it has ${cat.listing_count} active listing(s). Reassign or delete those listings first.`);
      return;
    }

    if (deletingId !== cat.id) {
      setDeletingId(cat.id);
      return;
    }

    setDeletingId(null);
    try {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(cat.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');

      try {
        await supabase.from('categories').delete().eq('id', cat.id);
      } catch {
        // ignore
      }

      setSuccessMsg(`Category "${cat.name}" removed.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadCategories();
    } catch (err) {
      setError(err.message || 'Could not delete category');
    }
  }

  const getSectionBadge = (kind) => {
    const item = MENU_KINDS.find((k) => k.value === kind);
    return item ? item.label.split('(')[0].trim() : kind?.toUpperCase();
  };

  return (
    <div className="page">
      <PageHeader title="Manage Categories" ml="വിഭാഗങ്ങൾ ക്രമീകരിക്കുക" back="/admin" backLabel="Admin">
        <form onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="cat-search" className="hp">Search categories</label>
          <input
            id="cat-search"
            type="search"
            placeholder="Search categories across all menus (English or മലയാളം)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </PageHeader>

      <main className="body">
        {/* Informational banner about "at least one entry" rule */}
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--accent-tint)',
            border: '1.5px solid var(--accent-border)',
            borderRadius: 14,
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--ink)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--gold-dark)' }}>
            🏷️ Category Control for All Menus:
          </p>
          <p style={{ margin: '4px 0 0', opacity: 0.9 }}>
            You can add, edit, or customize categories for <strong>Local Shops, Workers, Transport, Contacts, Schools & Education, Panchayath, Announcements, Blood Donors, Bus Routes, and Victory Club</strong>. Categories become visible on public listing screens once they contain at least one entry.
          </p>
        </div>

        {/* Action Button: Add Custom Category */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            className="btn dark big"
            onClick={handleOpenAdd}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>+</span>
            <span>Add Custom Category · പുതിയ വിഭാഗം ചേർക്കുക</span>
          </button>
        </div>

        {/* Section Tabs with badge counts */}
        <div className="chips" style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {MENU_SECTIONS.map((sec) => (
            <button
              key={sec.key}
              type="button"
              className={`chip ${activeTab === sec.key ? 'on' : ''}`}
              onClick={() => setActiveTab(sec.key)}
              style={{ padding: '6px 12px', fontSize: 12.5 }}
            >
              {sec.icon ? `${sec.icon} ` : ''}{sec.label} ({tabCounts[sec.key] || 0})
            </button>
          ))}
        </div>

        {error ? (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#b91c1c', fontSize: 13 }}>
            ⚠️ {error} <button type="button" className="btn light small" onClick={loadCategories} style={{ marginLeft: 8 }}>Retry</button>
          </div>
        ) : null}

        {successMsg ? (
          <p className="note" style={{ color: '#166534', borderColor: '#bbf7d0', background: '#f0fdf4' }}>
            ✅ {successMsg}
          </p>
        ) : null}

        {loading ? <p className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>Loading categories...</p> : null}

        {/* Categories List */}
        {!loading && filteredCategories.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <span style={{ fontSize: 32 }}>🏷️</span>
            <p style={{ fontWeight: 700, fontSize: 16, margin: '8px 0 4px' }}>No categories found</p>
            <p className="muted small">
              {search ? 'Try clearing your search query.' : 'Click "Add Custom Category" to create a category for this section.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="small muted">
                Showing {filteredCategories.length} categor{filteredCategories.length === 1 ? 'y' : 'ies'}
              </span>
            </div>

            {filteredCategories.map((c) => {
              const hasEntries = (c.listing_count || 0) > 0;
              const isDeleting = deletingId === c.id;

              return (
                <article
                  key={c.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    background: '#ffffff',
                    border: '1.5px solid var(--card-border)',
                    borderRadius: 16,
                    padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16 }}>{c.name}</h3>
                      {c.name_ml ? (
                        <p style={{ margin: '3px 0 0', fontSize: 13.5, color: 'var(--muted)', fontWeight: 600 }}>
                          {c.name_ml}
                        </p>
                      ) : null}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span
                        className="pill"
                        style={{
                          fontSize: 11,
                          letterSpacing: '0.02em',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {getSectionBadge(c.kind)}
                      </span>
                    </div>
                  </div>

                  {/* Status & Entry Count */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: hasEntries ? '#f4fbf6' : '#fafaf9',
                      border: `1px solid ${hasEntries ? '#bbf7d0' : '#e5e5e5'}`,
                      fontSize: 12.5,
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, color: hasEntries ? '#166534' : '#737373' }}>
                        {hasEntries ? '● Active' : '○ Standby'}
                      </span>
                      <span>
                        <strong>{c.listing_count || 0}</strong> item{c.listing_count === 1 ? '' : 's'} linked
                      </span>
                    </div>

                    <span
                      style={{
                        fontWeight: 600,
                        color: hasEntries ? '#166534' : 'var(--muted)',
                        fontSize: 11.5,
                      }}
                    >
                      {hasEntries ? 'Visible on public menu' : 'Hidden from user view (needs 1 item)'}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="btnrow" style={{ marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn light"
                      onClick={() => handleOpenEdit(c)}
                      style={{ fontSize: 13, padding: '0 14px' }}
                    >
                      ✏️ Edit Category
                    </button>

                    <Link
                      href={
                        c.kind === 'business' || c.kind === 'shop'
                          ? `/admin/shops?category_id=${c.id}`
                          : c.kind === 'worker'
                          ? `/admin/workers?category_id=${c.id}`
                          : c.kind === 'transport'
                          ? `/admin/transport?category_id=${c.id}`
                          : c.kind === 'panchayath'
                          ? `/admin/panchayath`
                          : c.kind === 'announcement'
                          ? `/admin/announcements`
                          : c.kind === 'donor'
                          ? `/admin/donors`
                          : c.kind === 'bus'
                          ? `/admin/bus`
                          : c.kind === 'victory'
                          ? `/admin/victory`
                          : `/admin/contacts?category_id=${c.id}`
                      }
                      className="btn"
                      style={{ fontSize: 13, padding: '0 14px' }}
                    >
                      Manage Entries ({c.listing_count || 0})
                    </Link>

                    {c.listing_count === 0 && (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleDelete(c)}
                        style={{
                          fontSize: 13,
                          color: isDeleting ? '#ffffff' : '#dc2626',
                          background: isDeleting ? '#dc2626' : undefined,
                          borderColor: isDeleting ? '#dc2626' : '#fecaca',
                          marginLeft: 'auto',
                        }}
                      >
                        {isDeleting ? 'Confirm Delete?' : 'Delete'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal: Add or Edit Custom Category */}
      {modalMode && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setModalMode(null);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 500,
              background: '#ffffff',
              borderRadius: 20,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              border: '1.5px solid var(--accent-border)',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 19 }}>
                  {modalMode === 'edit' ? 'Edit Category' : 'Add Custom Category'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                  {modalMode === 'edit' ? 'വിഭാഗം എഡിറ്റ് ചെയ്യുക' : 'പുതിയ വിഭാഗം ചേർക്കുക'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                disabled={saving}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: 6,
                  color: 'var(--muted)',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              {modalError ? (
                <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#b91c1c', fontSize: 13, marginBottom: 14 }}>
                  ⚠️ {modalError}
                </div>
              ) : null}

              <div className="field" style={{ marginBottom: 12 }}>
                <label htmlFor="cat-kind-select">Target Menu / വിഭാഗത്തിന്റെ തരം *</label>
                <select
                  id="cat-kind-select"
                  value={formKind}
                  onChange={(e) => setFormKind(e.target.value)}
                  disabled={saving}
                >
                  {MENU_KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label htmlFor="new-cat-name">Category Name (English) *</label>
                <input
                  id="new-cat-name"
                  type="text"
                  placeholder="e.g. Higher Secondary Schools, Organic Store, Ambulance Wing..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  disabled={saving}
                  required
                />
              </div>

              <div className="field" style={{ marginBottom: 16 }}>
                <label htmlFor="new-cat-ml">Category Name in Malayalam (മലയാളത്തിൽ - Optional)</label>
                <input
                  id="new-cat-ml"
                  type="text"
                  placeholder="ഉദാ: ഹയർ സെക്കൻഡറി സ്കൂളുകൾ, ഓർഗാനിക് സ്റ്റോർ..."
                  value={formNameMl}
                  onChange={(e) => setFormNameMl(e.target.value)}
                  disabled={saving}
                />
              </div>

              <p className="small muted" style={{ margin: '0 0 16px', lineHeight: 1.4 }}>
                💡 Categories created here will appear immediately in the admin panel and submission menus. They will automatically be displayed on the public user listings once they have at least one approved item.
              </p>

              <div className="btnrow">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setModalMode(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn dark"
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  {saving
                    ? 'Saving...'
                    : modalMode === 'edit'
                    ? 'Update Category · അപ്ഡേറ്റ് ചെയ്യുക'
                    : 'Save Category · വിഭാഗം ചേർക്കുക'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
