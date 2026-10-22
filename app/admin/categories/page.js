'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '../../../components/PageHeader';
import { useAdmin } from '../../../components/AdminGate';
import { useRows } from '../../../lib/useRows';
import { adminMutate } from '../../../lib/adminApi';
import { logAudit } from '../../../lib/audit';
import { showToast } from '../../../lib/toast';

const KINDS = [
  { value: 'all', label: 'All Categories · എല്ലാം' },
  { value: 'business', label: 'Shops & Businesses · കടകൾ' },
  { value: 'worker', label: 'Native Workers · തൊഴിലാളികൾ' },
  { value: 'transport', label: 'Transportation · വാഹനങ്ങൾ' },
  { value: 'contact', label: 'Important Contacts · സേവനങ്ങൾ' },
];

export default function AdminCategories() {
  const { user } = useAdmin();
  const [selectedKind, setSelectedKind] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [nameMl, setNameMl] = useState('');
  const [kind, setKind] = useState('business');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  // Categories query
  const cats = useRows(
    (s) => s.from('categories').select('*').order('name'),
    []
  );

  // Listings count query to show how many items are in each category
  const listings = useRows(
    (s) => s.from('listings').select('id, category_id, status'),
    []
  );

  // Category usage count map
  const usageCountMap = useMemo(() => {
    const map = {};
    if (listings.rows) {
      listings.rows.forEach((r) => {
        if (r.category_id) {
          map[r.category_id] = (map[r.category_id] || 0) + 1;
        }
      });
    }
    return map;
  }, [listings.rows]);

  // Filter categories
  const filteredCategories = useMemo(() => {
    let list = cats.rows || [];
    if (selectedKind !== 'all') {
      list = list.filter((c) => c.kind === selectedKind || (selectedKind === 'business' && c.kind === 'shop'));
    }
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.name_ml || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [cats.rows, selectedKind, searchTerm]);

  // Create new custom category
  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter a category name.');
      return;
    }

    setBusy(true);
    const payload = {
      name: name.trim(),
      name_ml: nameMl.trim() || null,
      kind: kind || 'business',
    };

    const res = await adminMutate({
      action: 'insert',
      table: 'categories',
      data: payload,
    });

    setBusy(false);

    if (res.error) {
      setFormError(res.error.message || 'Could not create category.');
      return;
    }

    showToast({
      type: 'success',
      message: 'Category created!',
      sub: `${payload.name} added to directory categories`,
    });

    try {
      await logAudit(user, {
        action: 'create category',
        table: 'categories',
        rowId: res.data?.id,
        note: payload.name,
      });
    } catch {
      // audit log failure is non-blocking
    }

    setName('');
    setNameMl('');
    setShowAddForm(false);
    cats.reload();
  }

  // Delete category
  async function handleDelete(category) {
    const count = usageCountMap[category.id] || 0;
    const confirmPrompt = count > 0
      ? `This category is currently linked to ${count} listing(s). Deleting it will unlink those items. Proceed?`
      : `Delete category "${category.name}"?`;

    if (!window.confirm(confirmPrompt)) return;

    const res = await adminMutate({
      action: 'delete',
      table: 'categories',
      id: category.id,
    });

    if (res.error) {
      showToast({
        type: 'error',
        message: 'Could not delete category',
        sub: res.error.message,
      });
      return;
    }

    showToast({
      type: 'success',
      message: 'Category deleted',
      sub: category.name,
    });

    try {
      await logAudit(user, {
        action: 'delete category',
        table: 'categories',
        rowId: category.id,
        note: category.name,
      });
    } catch {
      // ignore
    }

    cats.reload();
  }

  return (
    <div className="page">
      <PageHeader
        title="Manage Categories"
        ml="വിഭാഗങ്ങൾ നിയന്ത്രിക്കുക"
        back="/admin"
        backLabel="Back to Admin"
      />

      <main className="body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 18, margin: 0 }}>Directory Categories</h2>
            <p className="muted small" style={{ margin: '2px 0 0' }}>
              Only authenticated administrators can manage custom categories. Normal visitors cannot add custom categories.
            </p>
          </div>
          <button
            type="button"
            className="btn dark"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setFormError('');
            }}
            style={{ fontWeight: 700 }}
          >
            {showAddForm ? '✕ Close Form' : '+ Add custom category'}
          </button>
        </div>

        {/* Add custom category form */}
        {showAddForm && (
          <form
            onSubmit={handleCreate}
            style={{
              padding: 18,
              background: 'var(--card-subtle, #faf8f5)',
              border: '2px solid var(--accent, #c5a059)',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 10,
            }}
          >
            <h3 style={{ fontSize: 16, margin: 0, color: 'var(--ink)' }}>
              ✨ Add New Custom Category · പുതിയ വിഭാഗം ചേർക്കുക
            </h3>

            <div className="field">
              <label htmlFor="cat-kind">Section / Kind *</label>
              <select
                id="cat-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                required
              >
                <option value="business">Local Shops & Businesses (കടകൾ)</option>
                <option value="worker">Native Workers & Trades (തൊഴിലാളികൾ)</option>
                <option value="transport">Transportation Services (വാഹനങ്ങൾ)</option>
                <option value="contact">Important Contacts & Services (സേവനങ്ങൾ)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div className="field">
                <label htmlFor="cat-name">English Name *</label>
                <input
                  id="cat-name"
                  type="text"
                  placeholder="e.g. Electrical & Plumbing Supplies"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="cat-name-ml">Malayalam Name (optional)</label>
                <input
                  id="cat-name-ml"
                  type="text"
                  placeholder="e.g. ഇലക്ട്രിക്കൽ & പ്ലംബിംഗ്"
                  value={nameMl}
                  onChange={(e) => setNameMl(e.target.value)}
                />
              </div>
            </div>

            {formError && <p className="error" style={{ margin: 0 }}>{formError}</p>}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowAddForm(false);
                  setFormError('');
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn dark" disabled={busy}>
                {busy ? 'Saving...' : 'Save Category · വിഭാഗം ചേർക്കുക'}
              </button>
            </div>
          </form>
        )}

        {/* Kind Filters */}
        <div className="chips" style={{ marginTop: 12 }}>
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              className={`chip ${selectedKind === k.value ? 'on' : ''}`}
              onClick={() => setSelectedKind(k.value)}
            >
              {k.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ marginTop: 6 }}>
          <input
            type="search"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Categories List */}
        {cats.loading ? (
          <p className="muted">Loading categories...</p>
        ) : cats.error ? (
          <p className="error">{cats.error}</p>
        ) : filteredCategories.length === 0 ? (
          <p className="muted">No categories found.</p>
        ) : (
          <div className="stack" style={{ marginTop: 8 }}>
            {filteredCategories.map((c) => {
              const count = usageCountMap[c.id] || 0;
              const kindBadge = {
                business: '🏪 Shops',
                shop: '🏪 Shops',
                worker: '👷 Workers',
                transport: '🚖 Transport',
                contact: '📞 Contacts',
              }[c.kind] || c.kind;

              return (
                <div
                  key={c.id}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>
                        {c.name}
                      </span>
                      {c.name_ml && (
                        <span style={{ color: 'var(--muted)', fontSize: 13.5 }}>
                          ({c.name_ml})
                        </span>
                      )}
                      <span className="pill small">{kindBadge}</span>
                    </div>
                    <div className="small muted" style={{ marginTop: 2 }}>
                      {count} active {count === 1 ? 'listing' : 'listings'} in this category
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleDelete(c)}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12.5,
                        color: '#dc2626',
                        borderColor: 'rgba(220, 38, 38, 0.3)',
                      }}
                      title="Delete category"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
