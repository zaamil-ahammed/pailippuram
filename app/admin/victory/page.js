'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '../../../components/PageHeader';
import ImageUploadField from '../../../components/ImageUploadField';
import { useAdmin } from '../../../components/AdminGate';
import { supabase, cleanSearch } from '../../../lib/supabase';
import { logAudit } from '../../../lib/audit';
import { useRows } from '../../../lib/useRows';
import { VICTORY_WINGS, VICTORY_PORTFOLIOS } from '../../../lib/sections';
import { STARTER_VICTORY_MEMBERS } from '../../../lib/mockStore';

const DEFAULT_LINK = 'https://www.instagram.com/victory_pailippuram';

export default function AdminVictoryPage() {
  const { user } = useAdmin();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMember, setEditingMember] = useState(null); // null, 'new', or member object
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Form state for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    photo_url: '',
    role: '',
    role_ml: '',
    wing: 'executive',
    portfolio: '',
    link: DEFAULT_LINK,
    phone: '',
    display_order: 1,
    status: 'approved',
  });

  const { rows, loading, error, reload } = useRows(
    (s) => s.from('victory_members').select('*').order('display_order', { ascending: true }),
    []
  );

  // Auto-seed in case database was completely empty
  useEffect(() => {
    (async () => {
      if (!loading && (!rows || rows.length === 0)) {
        try {
          for (const m of STARTER_VICTORY_MEMBERS) {
            await supabase.from('victory_members').insert(m);
          }
          reload();
        } catch (e) {
          console.warn('Seeding victory members:', e);
        }
      }
    })();
  }, [loading, rows?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveRows = useMemo(() => {
    if (Array.isArray(rows) && rows.length > 0) return rows;
    return STARTER_VICTORY_MEMBERS;
  }, [rows]);

  const filteredMembers = useMemo(() => {
    let list = effectiveRows;
    if (activeTab === 'hidden') {
      list = list.filter((m) => m.status === 'hidden');
    } else if (activeTab !== 'all') {
      list = list.filter((m) => m.wing === activeTab);
    }
    const q = cleanSearch(searchTerm);
    if (q) {
      list = list.filter(
        (m) =>
          (m.name || '').toLowerCase().includes(q.toLowerCase()) ||
          (m.role || '').toLowerCase().includes(q.toLowerCase()) ||
          (m.role_ml || '').toLowerCase().includes(q.toLowerCase()) ||
          (m.portfolio || '').toLowerCase().includes(q.toLowerCase())
      );
    }
    return list;
  }, [effectiveRows, activeTab, searchTerm]);

  const handleOpenAdd = () => {
    setErrorMsg('');
    setSuccessMsg('');
    const nextOrder = (rows?.length || 0) + 1;
    setFormData({
      name: '',
      photo_url: '',
      role: '',
      role_ml: '',
      wing: activeTab !== 'all' && activeTab !== 'hidden' ? activeTab : 'executive',
      portfolio: '',
      link: DEFAULT_LINK,
      phone: '',
      display_order: nextOrder,
      status: 'approved',
    });
    setEditingMember('new');
  };

  const handleOpenEdit = (member) => {
    setErrorMsg('');
    setSuccessMsg('');
    setFormData({
      name: member.name || '',
      photo_url: member.photo_url || '',
      role: member.role || '',
      role_ml: member.role_ml || '',
      wing: member.wing || 'executive',
      portfolio: member.portfolio || '',
      link: member.link || DEFAULT_LINK,
      phone: member.phone || '',
      display_order: member.display_order ?? 1,
      status: member.status || 'approved',
    });
    setEditingMember(member);
  };

  const handleCloseModal = () => {
    setEditingMember(null);
    setErrorMsg('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name?.trim()) {
      return setErrorMsg('Please enter member name.');
    }
    if (!formData.role?.trim()) {
      return setErrorMsg('Please enter member role/designation.');
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        photo_url: formData.photo_url?.trim() || null,
        role: formData.role.trim(),
        role_ml: formData.role_ml?.trim() || null,
        wing: formData.wing,
        portfolio: formData.wing === 'portfolios' ? formData.portfolio?.trim() || null : null,
        link: formData.link?.trim() || DEFAULT_LINK,
        phone: formData.phone?.trim() || null,
        display_order: Number(formData.display_order) || 1,
        status: formData.status,
        updated_at: new Date().toISOString(),
      };

      if (editingMember === 'new') {
        const { data, error: insertErr } = await supabase
          .from('victory_members')
          .insert(payload)
          .select('id')
          .single();

        if (insertErr) throw insertErr;

        await logAudit(user, {
          action: 'add committee member',
          table: 'victory_members',
          rowId: data?.id,
          note: `Added ${payload.name} (${payload.role}) to Victory Club Committee`,
        });

        setSuccessMsg(`Added "${payload.name}" successfully!`);
      } else {
        const { error: updateErr } = await supabase
          .from('victory_members')
          .update(payload)
          .eq('id', editingMember.id);

        if (updateErr) throw updateErr;

        await logAudit(user, {
          action: 'update committee member',
          table: 'victory_members',
          rowId: editingMember.id,
          note: `Updated ${payload.name} details & photo`,
        });

        setSuccessMsg(`Updated "${payload.name}" successfully!`);
      }

      reload();
      setTimeout(() => {
        setEditingMember(null);
        setSuccessMsg('');
      }, 700);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (member) => {
    setErrorMsg('');
    const nextStatus = member.status === 'approved' ? 'hidden' : 'approved';
    try {
      const { error: updateErr } = await supabase
        .from('victory_members')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', member.id);

      if (updateErr) throw updateErr;

      await logAudit(user, {
        action: nextStatus === 'hidden' ? 'hide committee member' : 'unhide committee member',
        table: 'victory_members',
        rowId: member.id,
        note: `${nextStatus === 'hidden' ? 'Hidden' : 'Made live'}: ${member.name}`,
      });

      reload();
    } catch (err) {
      setErrorMsg(err.message || 'Could not change status.');
    }
  };

  const handleDelete = async (member) => {
    setErrorMsg('');
    if (deletingId !== member.id) {
      setDeletingId(member.id);
      return;
    }
    setDeletingId(null);
    try {
      const { error: delErr } = await supabase
        .from('victory_members')
        .delete()
        .eq('id', member.id);

      if (delErr) throw delErr;

      await logAudit(user, {
        action: 'delete committee member',
        table: 'victory_members',
        rowId: member.id,
        note: `Removed ${member.name} from Victory Club committee`,
      });

      reload();
    } catch (err) {
      setErrorMsg(err.message || 'Could not delete member.');
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Victory Club Committee"
        ml="ഭാരവാഹികളുടെ വിവരങ്ങളും ഫോട്ടോയും തിരുത്തുക"
        back="/admin"
        backLabel="Back to Admin"
        action={
          <Link
            href="/victory"
            className="btn light small"
            style={{ minHeight: 34, padding: '0 12px', fontSize: 13, gap: 5 }}
            target="_blank"
            title="Preview public page"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View Live Page
          </Link>
        }
      />

      <main className="body" style={{ gap: 18 }}>
        {/* Top Control Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 20 }}>Committee Members ({effectiveRows?.length || 0})</h2>
              <span className="muted small">Add photos, edit roles, links and wings for 2026–27 roster</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn light"
                onClick={async () => {
                  if (confirm('Restore the standard 25-member 2026–27 committee roster?')) {
                    try {
                      for (const m of STARTER_VICTORY_MEMBERS) {
                        await supabase.from('victory_members').insert(m);
                      }
                      reload();
                      setSuccessMsg('2026–27 roster restored successfully!');
                      setTimeout(() => setSuccessMsg(''), 4000);
                    } catch (err) {
                      console.warn(err);
                    }
                  }
                }}
                style={{ minHeight: 40, padding: '0 14px' }}
              >
                ↻ Reset Roster
              </button>
              <button
                type="button"
                className="btn dark"
                onClick={handleOpenAdd}
                style={{ gap: 6, minHeight: 40, padding: '0 16px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Member
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <input
              type="search"
              placeholder="Search member by name, role or portfolio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 40,
                borderRadius: 14,
                minHeight: 46,
                border: '1.5px solid var(--card-border)',
                background: '#ffffff',
              }}
            />
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Wing Filter Tabs */}
          <div className="chips" style={{ overflowX: 'auto', paddingBottom: 4 }}>
            <button
              type="button"
              className={`chip ${activeTab === 'all' ? 'on' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Wings ({rows?.length || 0})
            </button>
            <button
              type="button"
              className={`chip ${activeTab === 'executive' ? 'on' : ''}`}
              onClick={() => setActiveTab('executive')}
            >
              Executive ({(rows || []).filter((m) => m.wing === 'executive').length})
            </button>
            <button
              type="button"
              className={`chip ${activeTab === 'portfolios' ? 'on' : ''}`}
              onClick={() => setActiveTab('portfolios')}
            >
              Portfolios ({(rows || []).filter((m) => m.wing === 'portfolios').length})
            </button>
            <button
              type="button"
              className={`chip ${activeTab === 'gcc' ? 'on' : ''}`}
              onClick={() => setActiveTab('gcc')}
            >
              GCC Wing ({(rows || []).filter((m) => m.wing === 'gcc').length})
            </button>
            <button
              type="button"
              className={`chip ${activeTab === 'central' ? 'on' : ''}`}
              onClick={() => setActiveTab('central')}
            >
              Central ({(effectiveRows || []).filter((m) => m.wing === 'central').length})
            </button>
            <button
              type="button"
              className={`chip ${activeTab === 'hidden' ? 'on' : ''}`}
              onClick={() => setActiveTab('hidden')}
              style={{ color: activeTab === 'hidden' ? '#ffffff' : '#94a3b8' }}
            >
              Hidden ({(effectiveRows || []).filter((m) => m.status === 'hidden').length})
            </button>
          </div>
        </div>

        {error && effectiveRows.length === 0 ? <p className="error">{error}</p> : null}
        {errorMsg ? <p className="error">{errorMsg}</p> : null}

        {/* Member Cards List */}
        {loading ? (
          <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>Loading committee roster...</p>
        ) : filteredMembers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <span style={{ fontSize: 32, marginBottom: 8 }}>⚽</span>
            <p style={{ fontWeight: 700, fontSize: 16 }}>No committee members found</p>
            <p className="muted small" style={{ marginTop: 4 }}>
              {searchTerm ? 'Try adjusting your search criteria' : 'Click "Add Member" to add the first member.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredMembers.map((m) => {
              const isHidden = m.status === 'hidden';
              const wingLabel = VICTORY_WINGS.find((w) => w.value === m.wing)?.label?.split('·')[0] || m.wing;
              return (
                <article
                  key={m.id}
                  className="card"
                  style={{
                    opacity: isHidden ? 0.65 : 1,
                    border: isHidden ? '1px dashed var(--card-border)' : '1px solid var(--card-border)',
                    padding: 14,
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Avatar Preview */}
                    <div
                      style={{
                        position: 'relative',
                        width: 54,
                        height: 54,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #24221b 0%, #0d0d10 100%)',
                        border: '2px solid #c5a059',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      {m.photo_url ? (
                        <img
                          src={m.photo_url}
                          alt={m.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#dfbd69' }}>
                          {m.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Member Details */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--ink)' }}>
                          {m.name}
                        </span>
                        {m.photo_url ? (
                          <span className="pill line" style={{ fontSize: 11, padding: '1px 7px' }}>
                            📷 Photo added
                          </span>
                        ) : (
                          <span className="muted small" style={{ fontSize: 11 }}>
                            No photo
                          </span>
                        )}
                        {isHidden && (
                          <span className="pill" style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca', fontSize: 11 }}>
                            Hidden
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 13, color: 'var(--gold-dark)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{m.role}</span>
                        {m.role_ml && <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· {m.role_ml}</span>}
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span>Wing: <strong style={{ color: 'var(--ink)' }}>{wingLabel}</strong></span>
                        {m.portfolio && <span>Portfolio: <strong style={{ color: 'var(--ink)' }}>{m.portfolio}</strong></span>}
                        <span>Order: <strong>#{m.display_order ?? 1}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="btnrow" style={{ marginTop: 2 }}>
                    <button
                      type="button"
                      className="btn light"
                      onClick={() => handleOpenEdit(m)}
                      style={{ fontSize: 13, minHeight: 38, gap: 5 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit Details &amp; Photo
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleToggleStatus(m)}
                      style={{ fontSize: 13, minHeight: 38 }}
                      title={isHidden ? 'Make visible publicly' : 'Hide from public roster'}
                    >
                      {isHidden ? 'Show Live' : 'Hide'}
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleDelete(m)}
                      style={{
                        fontSize: 13,
                        minHeight: 38,
                        color: deletingId === m.id ? '#dc2626' : undefined,
                        borderColor: deletingId === m.id ? '#dc2626' : undefined,
                      }}
                    >
                      {deletingId === m.id ? 'Confirm Delete?' : 'Delete'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Inline Modal Editor for Adding & Editing Member Details + Photo */}
      {editingMember && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 24,
              maxWidth: 540,
              width: '100%',
              padding: '24px 22px',
              maxHeight: '92vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
              border: '1.5px solid var(--accent-border)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--card-border)', paddingBottom: 12 }}>
              <div>
                <span className="pill line" style={{ fontSize: 11, marginBottom: 4, display: 'inline-block' }}>
                  Victory Arts &amp; Sports Club
                </span>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>
                  {editingMember === 'new' ? 'Add Committee Member' : `Edit: ${formData.name || 'Member'}`}
                </h3>
                <span className="muted small">
                  Upload member photo and customize title, role and social links
                </span>
              </div>
              <button
                type="button"
                className="iconbtn"
                onClick={handleCloseModal}
                style={{ width: 36, height: 36, borderRadius: 10 }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {errorMsg && <p className="error" style={{ margin: 0 }}>{errorMsg}</p>}
            {successMsg && (
              <p style={{ margin: 0, padding: '10px 14px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: 12, fontWeight: 600, fontSize: 14 }}>
                {successMsg}
              </p>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Photo Upload Field with instant preview & camera/gallery selection */}
              <div style={{ background: '#fafaf9', padding: 14, borderRadius: 18, border: '1.5px solid var(--card-border)' }}>
                <ImageUploadField
                  value={formData.photo_url}
                  onChange={(val) => setFormData((prev) => ({ ...prev, photo_url: val }))}
                  label="Member Profile Photo / ഫോട്ടോ"
                />
              </div>

              {/* Name */}
              <div className="field">
                <label htmlFor="m-name" style={{ fontWeight: 700 }}>
                  Member Name / പേര് *
                </label>
                <input
                  id="m-name"
                  type="text"
                  placeholder="e.g. Ansil, Jilshad, Shafeer..."
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              {/* Role in English and Malayalam */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="field">
                  <label htmlFor="m-role" style={{ fontWeight: 700 }}>
                    Role / Title *
                  </label>
                  <input
                    id="m-role"
                    type="text"
                    placeholder="e.g. President, Sports Manager"
                    value={formData.role}
                    onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="m-role-ml" style={{ fontWeight: 700 }}>
                    Role (Malayalam)
                  </label>
                  <input
                    id="m-role-ml"
                    type="text"
                    placeholder="e.g. പ്രസിഡന്റ്"
                    value={formData.role_ml}
                    onChange={(e) => setFormData((prev) => ({ ...prev, role_ml: e.target.value }))}
                  />
                </div>
              </div>

              {/* Wing Selection */}
              <div className="field">
                <label htmlFor="m-wing" style={{ fontWeight: 700 }}>
                  Wing / സമിതി വിഭാഗം *
                </label>
                <select
                  id="m-wing"
                  value={formData.wing}
                  onChange={(e) => setFormData((prev) => ({ ...prev, wing: e.target.value }))}
                  required
                >
                  {VICTORY_WINGS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Portfolio Selection (only visible if wing is portfolios) */}
              {formData.wing === 'portfolios' && (
                <div className="field">
                  <label htmlFor="m-portfolio" style={{ fontWeight: 700 }}>
                    Specific Portfolio Category *
                  </label>
                  <select
                    id="m-portfolio"
                    value={formData.portfolio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, portfolio: e.target.value }))}
                  >
                    {VICTORY_PORTFOLIOS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Instagram / Profile Link */}
              <div className="field">
                <label htmlFor="m-link" style={{ fontWeight: 700 }}>
                  Profile Link (Instagram or personal URL)
                </label>
                <input
                  id="m-link"
                  type="url"
                  placeholder="https://www.instagram.com/victory_pailippuram"
                  value={formData.link}
                  onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
                />
                <span className="muted small" style={{ fontSize: 11.5 }}>
                  Default is @victory_pailippuram official club Instagram profile
                </span>
              </div>

              {/* Sort Order & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="field">
                  <label htmlFor="m-order" style={{ fontWeight: 700 }}>
                    Display Order / ക്രമം
                  </label>
                  <input
                    id="m-order"
                    type="number"
                    min="1"
                    max="99"
                    value={formData.display_order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, display_order: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="m-status" style={{ fontWeight: 700 }}>
                    Visibility Status
                  </label>
                  <select
                    id="m-status"
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="approved">Live (Visible)</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="btnrow" style={{ marginTop: 8 }}>
                <button
                  type="submit"
                  className="btn dark big"
                  disabled={saving}
                  style={{ flex: 2 }}
                >
                  {saving ? 'Saving...' : editingMember === 'new' ? 'Save New Member' : 'Update Member & Photo'}
                </button>
                <button
                  type="button"
                  className="btn big"
                  onClick={handleCloseModal}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
