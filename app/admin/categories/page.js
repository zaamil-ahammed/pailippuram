'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageHeader from '../../../components/PageHeader';
import { useAdmin } from '../../../components/AdminGate';
import { supabase } from '../../../lib/supabase';
import { TAXONOMY, getAllSubcategories } from '../../../lib/taxonomy';

const SECTIONS = [
  { key: 'all', label: 'All Categories', kind: null },
  { key: 'shops', label: 'Local Shops', kind: 'business', icon: '🏪' },
  { key: 'workers', label: 'Native Workers', kind: 'worker', icon: '🛠️' },
  { key: 'transport', label: 'Transportation', kind: 'transport', icon: '🚗' },
  { key: 'contacts', label: 'Important Contacts', kind: 'contact', icon: '🚨' },
];

export default function AdminCategoriesPage() {
  const { user } = useAdmin();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add custom category modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKind, setNewKind] = useState('business');
  const [newName, setNewName] = useState('');
  const [newNameMl, setNewNameMl] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');

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
      setCategories(data.categories || []);
    } catch (err) {
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
      const targetSec = SECTIONS.find((s) => s.key === activeTab);
      if (targetSec && targetSec.kind) {
        list = list.filter((c) => {
          if (targetSec.kind === 'business') {
            return c.kind === 'business' || c.kind === 'shop';
          }
          return c.kind === targetSec.kind;
        });
      }
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.name_ml && c.name_ml.toLowerCase().includes(q)) ||
          c.kind.toLowerCase().includes(q)
      );
    }
    return list;
  }, [categories, activeTab, search]);

  // Handle adding a custom category
  async function handleAddCategory(e) {
    e.preventDefault();
    setAddError('');
    if (!newName.trim() || newName.trim().length < 2) {
      setAddError('Category name must be at least 2 characters.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: newKind,
          name: newName.trim(),
          name_ml: newNameMl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create category');

      setSuccessMsg(
        data.created
          ? `Category "${data.category.name}" added successfully!`
          : `Category "${data.category.name}" already exists.`
      );
      setTimeout(() => setSuccessMsg(''), 4000);

      setNewName('');
      setNewNameMl('');
      setShowAddModal(false);
      await loadCategories();
    } catch (err) {
      setAddError(err.message || 'Error creating category');
    } finally {
      setSaving(false);
    }
  }

  // Handle deleting a category
  async function handleDelete(cat) {
    if (cat.listing_count > 0) {
      alert(`Cannot delete "${cat.name}" because it has ${cat.listing_count} active listing(s). Reassign or delete those listings first.`);
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

      setSuccessMsg(`Category "${cat.name}" removed.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadCategories();
    } catch (err) {
      alert(err.message || 'Could not delete category');
    }
  }

  return (
    <div className="page">
      <PageHeader title="Manage Categories" ml="വിഭാഗങ്ങൾ ക്രമീകരിക്കുക" back="/admin" backLabel="Admin">
        <form onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="cat-search" className="hp">Search categories</label>
          <input
            id="cat-search"
            type="search"
            placeholder="Search categories (English or മലയാളം)..."
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
            🏷️ Category Display Rule:
          </p>
          <p style={{ margin: '4px 0 0', opacity: 0.9 }}>
            Categories are <strong>only visible to users</strong> on the public listings panel once they contain <strong>at least one approved entry</strong>. This keeps the user interface clean and prevents empty category filters.
          </p>
        </div>

        {/* Action Button: Add Custom Category */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            className="btn dark big"
            onClick={() => {
              setAddError('');
              setShowAddModal(true);
            }}
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

        {/* Section Tabs */}
        <div className="chips" style={{ marginTop: 8 }}>
          {SECTIONS.map((sec) => (
            <button
              key={sec.key}
              type="button"
              className={`chip ${activeTab === sec.key ? 'on' : ''}`}
              onClick={() => setActiveTab(sec.key)}
            >
              {sec.icon ? `${sec.icon} ` : ''}{sec.label}
            </button>
          ))}
        </div>

        {error ? <p className="error">{error}</p> : null}
        {successMsg ? <p className="note" style={{ color: '#166534', borderColor: '#bbf7d0', background: '#f0fdf4' }}>{successMsg}</p> : null}
        {loading ? <p className="muted">Loading categories...</p> : null}

        {/* Categories List */}
        {!loading && filteredCategories.length === 0 ? (
          <p className="muted">No categories found matching your filter.</p>
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
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16 }}>{c.name}</h3>
                      {c.name_ml ? (
                        <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--muted)', fontWeight: 600 }}>
                          {c.name_ml}
                        </p>
                      ) : null}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span
                        className="pill"
                        style={{
                          textTransform: 'uppercase',
                          fontSize: 11,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {c.kind === 'business' || c.kind === 'shop'
                          ? 'Local Shop'
                          : c.kind === 'worker'
                          ? 'Native Worker'
                          : c.kind === 'transport'
                          ? 'Transportation'
                          : 'Important Contact'}
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
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, color: hasEntries ? '#166534' : '#737373' }}>
                        {hasEntries ? '● Active' : '○ Standby'}
                      </span>
                      <span>
                        <strong>{c.listing_count || 0}</strong> entry{c.listing_count === 1 ? '' : 'ies'}
                      </span>
                    </div>

                    <span
                      style={{
                        fontWeight: 600,
                        color: hasEntries ? '#166534' : 'var(--muted)',
                        fontSize: 11.5,
                      }}
                    >
                      {hasEntries ? 'Visible on user panel' : 'Hidden from user panel (needs 1 entry)'}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="btnrow" style={{ marginTop: 4 }}>
                    <Link
                      href={`/admin/${
                        c.kind === 'business' || c.kind === 'shop'
                          ? 'shops'
                          : c.kind === 'worker'
                          ? 'workers'
                          : c.kind === 'transport'
                          ? 'transport'
                          : 'contacts'
                      }/new?category_id=${c.id}`}
                      className="btn light"
                      style={{ fontSize: 13 }}
                    >
                      + Add Listing to this Category
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

      {/* Modal: Add Custom Category */}
      {showAddModal && (
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
            if (e.target === e.currentTarget && !saving) setShowAddModal(false);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#ffffff',
              borderRadius: 20,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              border: '1.5px solid var(--accent-border)',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 19 }}>Add Custom Category</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>പുതിയ വിഭാഗം ചേർക്കുക</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
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

            <form onSubmit={handleAddCategory}>
              {addError ? <p className="error">{addError}</p> : null}

              <div className="field">
                <label htmlFor="new-cat-kind">Main Section / വിഭാഗത്തിന്റെ തരം *</label>
                <select
                  id="new-cat-kind"
                  value={newKind}
                  onChange={(e) => setNewKind(e.target.value)}
                  disabled={saving}
                >
                  <option value="business">🏪 Local Shops (കടകൾ & വ്യാപാരങ്ങൾ)</option>
                  <option value="worker">🛠️ Native Workers (തൊഴിലാളികൾ)</option>
                  <option value="transport">🚗 Transportation (വാഹനങ്ങൾ & ഗതാഗതം)</option>
                  <option value="contact">🚨 Important Contacts (പ്രധാന നമ്പറുകൾ)</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="new-cat-name">Category Name (English) *</label>
                <input
                  id="new-cat-name"
                  type="text"
                  placeholder="e.g. Lorry & Goods Transport, Organic Store, etc."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={saving}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="new-cat-ml">Category Name in Malayalam (മലയാളത്തിൽ - Optional)</label>
                <input
                  id="new-cat-ml"
                  type="text"
                  placeholder="ഉദാ: ലോറി & ചരക്ക് ഗതാഗതം"
                  value={newNameMl}
                  onChange={(e) => setNewNameMl(e.target.value)}
                  disabled={saving}
                />
              </div>

              <p className="small muted" style={{ marginTop: 8 }}>
                💡 Once created, this category will appear in the Admin and User submission panels. It will automatically show on the public user listings view as soon as it has at least one approved entry.
              </p>

              <div className="btnrow" style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowAddModal(false)}
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
                  {saving ? 'Creating...' : 'Save Category · വിഭാഗം ചേർക്കുക'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
