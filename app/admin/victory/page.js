'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '../../../components/PageHeader';
import ImageUploadField from '../../../components/ImageUploadField';
import { useAdmin } from '../../../components/AdminGate';
import { supabase, cleanSearch } from '../../../lib/supabase';
import { adminMutate } from '../../../lib/adminApi';
import { logAudit } from '../../../lib/audit';
import { useRows } from '../../../lib/useRows';
import { VICTORY_WINGS, VICTORY_PORTFOLIOS } from '../../../lib/sections';
import { STARTER_VICTORY_MEMBERS } from '../../../lib/mockStore';
import { showToast } from '../../../lib/toast';
import { parseVictorySocials, encodeVictorySocials } from '../../../lib/victorySocials';

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
    alt_phone: '',
    email: '',
    facebook: '',
    linkedin: '',
    twitter: '',
    website: '',
    blood_group: 'O+',
    location: 'Pailippuram',
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
    } else if (activeTab === 'non_committee') {
      list = list.filter((m) => m.wing === 'non_committee' || m.wing === 'general' || m.wing === 'club_member' || m.wing === 'member');
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
    const isNonComm = activeTab === 'non_committee';
    setFormData({
      name: '',
      photo_url: '',
      role: isNonComm ? 'Club Member' : '',
      role_ml: isNonComm ? 'ക്ലബ്ബ് അംഗം' : '',
      wing: isNonComm ? 'non_committee' : (activeTab !== 'all' && activeTab !== 'hidden' ? activeTab : 'executive'),
      portfolio: '',
      link: DEFAULT_LINK,
      phone: '',
      alt_phone: '',
      email: '',
      facebook: '',
      linkedin: '',
      twitter: '',
      website: '',
      blood_group: 'O+',
      location: 'Pailippuram',
      display_order: nextOrder,
      status: 'approved',
    });
    setEditingMember('new');
  };

  const handleOpenEdit = (member) => {
    setErrorMsg('');
    setSuccessMsg('');
    const rawBg = member.blood_group;
    const cleanBg = Array.isArray(rawBg) ? rawBg[0] : (rawBg || 'O+');
    const rawLoc = member.location;
    const cleanLoc = Array.isArray(rawLoc) ? rawLoc[0] : (rawLoc || 'Pailippuram');
    const socials = parseVictorySocials(member);

    setFormData({
      name: member.name || '',
      photo_url: member.photo_url || '',
      role: member.role || '',
      role_ml: member.role_ml || '',
      wing: member.wing || 'executive',
      portfolio: member.portfolio || '',
      link: socials.instagram || DEFAULT_LINK,
      phone: socials.phone || '',
      alt_phone: socials.alt_phone || '',
      email: socials.email || '',
      facebook: socials.facebook || '',
      linkedin: socials.linkedin || '',
      twitter: socials.twitter || '',
      website: socials.website || '',
      blood_group: cleanBg,
      location: cleanLoc,
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
      const encoded = encodeVictorySocials({
        instagram: formData.link,
        phone: formData.phone,
        alt_phone: formData.alt_phone,
        email: formData.email,
        facebook: formData.facebook,
        linkedin: formData.linkedin,
        twitter: formData.twitter,
        website: formData.website,
      });

      let rawBg = formData.blood_group;
      if (Array.isArray(rawBg)) rawBg = rawBg[0];
      const cleanBg = rawBg?.trim() ? rawBg.trim().slice(0, 10).toUpperCase() : 'O+';

      let rawLoc = formData.location;
      if (Array.isArray(rawLoc)) rawLoc = rawLoc[0];
      const cleanLoc = rawLoc?.trim() ? rawLoc.trim().slice(0, 80) : 'Pailippuram';

      let targetWing = formData.wing;
      if (targetWing === 'general') targetWing = 'non_committee';

      let payload = {
        name: formData.name.trim().slice(0, 120),
        photo_url: formData.photo_url?.trim() || null,
        role: formData.role.trim().slice(0, 120),
        role_ml: formData.role_ml?.trim() ? formData.role_ml.trim().slice(0, 120) : null,
        wing: targetWing,
        portfolio: targetWing === 'portfolios' ? (formData.portfolio?.trim() || null) : null,
        link: encoded.link,
        phone: encoded.phone,
        blood_group: cleanBg,
        location: cleanLoc,
        display_order: Number(formData.display_order) >= 1 ? Number(formData.display_order) : 1,
        status: formData.status === 'hidden' ? 'hidden' : 'approved',
        updated_at: new Date().toISOString(),
      };

      if (editingMember === 'new') {
        const { data, error: insertErr } = await adminMutate({
          action: 'insert',
          table: 'victory_members',
          data: payload,
        });

        if (insertErr) throw insertErr;

        await logAudit(user, {
          action: 'add committee member',
          table: 'victory_members',
          rowId: data?.id,
          note: `Added ${payload.name} (${payload.role}) to Victory Club Committee`,
        });

        setSuccessMsg(`Added "${payload.name}" successfully!`);
        showToast({
          type: 'success',
          message: 'Committee member added!',
          sub: `${payload.name} (${payload.role})`,
        });
      } else {
        const { error: updateErr } = await adminMutate({
          action: 'update',
          table: 'victory_members',
          id: editingMember.id,
          data: payload,
        });

        if (updateErr) throw updateErr;

        await logAudit(user, {
          action: 'update committee member',
          table: 'victory_members',
          rowId: editingMember.id,
          note: `Updated ${payload.name} details & photo`,
        });

        setSuccessMsg(`Updated "${payload.name}" successfully!`);
        showToast({
          type: 'success',
          message: 'Member details updated!',
          sub: `${payload.name} (${payload.role})`,
        });
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
      const { error: updateErr } = await adminMutate({
        action: 'update',
        table: 'victory_members',
        id: member.id,
        data: { status: nextStatus },
      });

      if (updateErr) throw updateErr;

      await logAudit(user, {
        action: nextStatus === 'hidden' ? 'hide committee member' : 'unhide committee member',
        table: 'victory_members',
        rowId: member.id,
        note: `${nextStatus === 'hidden' ? 'Hidden' : 'Made live'}: ${member.name}`,
      });

      showToast({
        type: 'success',
        message: nextStatus === 'hidden' ? 'Member hidden from committee' : 'Member is now live!',
        sub: member.name,
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
      const { error: delErr } = await adminMutate({
        action: 'delete',
        table: 'victory_members',
        id: member.id,
      });

      if (delErr) throw delErr;

      await logAudit(user, {
        action: 'delete committee member',
        table: 'victory_members',
        rowId: member.id,
        note: `Removed ${member.name} from Victory Club committee`,
      });

      showToast({
        type: 'success',
        message: 'Committee member deleted',
        sub: member.name,
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
              className={`chip ${activeTab === 'non_committee' ? 'on' : ''}`}
              onClick={() => setActiveTab('non_committee')}
            >
              Non-Committee ({(effectiveRows || []).filter((m) => m.wing === 'non_committee' || m.wing === 'general' || m.wing === 'club_member' || m.wing === 'member').length})
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
                  <div className="btnrow" style={{ marginTop: 2, flexWrap: 'wrap' }}>
                    <Link
                      href={`/victory/member/${m.id}`}
                      target="_blank"
                      className="btn light"
                      style={{ fontSize: 13, minHeight: 38, gap: 5, color: '#b45309', borderColor: '#fcd34d', textDecoration: 'none' }}
                      title="Preview NFC Digital Card"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <line x1="6" y1="8" x2="6" y2="8" />
                        <line x1="10" y1="8" x2="18" y2="8" />
                        <line x1="6" y1="12" x2="18" y2="12" />
                      </svg>
                      NFC Profile
                    </Link>

                    <button
                      type="button"
                      className="btn light"
                      onClick={() => {
                        const url = `${window.location.origin}/victory/member/${m.id}`;
                        navigator.clipboard?.writeText(url);
                        showToast(`NFC URL copied for ${m.name}!`);
                      }}
                      style={{ fontSize: 13, minHeight: 38, gap: 5 }}
                      title="Copy URL to program onto physical NFC tag"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy NFC URL
                    </button>

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
                      Edit
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
                      {deletingId === m.id ? 'Confirm?' : 'Delete'}
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

              {/* Wing Selection / Committee vs Non-Committee */}
              <div className="field">
                <label htmlFor="m-wing" style={{ fontWeight: 700 }}>
                  Member Category / സമിതി വിഭാഗം *
                </label>
                <select
                  id="m-wing"
                  value={formData.wing}
                  onChange={(e) => {
                    const newWing = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      wing: newWing,
                      role: newWing === 'non_committee' && (!prev.role || prev.role === 'President' || prev.role === 'Secretary') ? 'Club Member' : prev.role,
                      role_ml: newWing === 'non_committee' && (!prev.role_ml || prev.role_ml === 'പ്രസിഡന്റ്') ? 'ക്ലബ്ബ് അംഗം' : prev.role_ml,
                    }));
                  }}
                  required
                >
                  {VICTORY_WINGS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
                {formData.wing === 'non_committee' && (
                  <span style={{ fontSize: 11.5, color: '#047857', fontWeight: 600, marginTop: 4, display: 'block' }}>
                    ✓ Registered as Non-Committee Club Member with personal NFC Digital Card profile
                  </span>
                )}
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

              {/* SECTION: PHONE NUMBERS & DIRECT CONTACTS (NFC SYNC) */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    📞 Contact Numbers &amp; Email
                  </span>
                  <span className="pill line" style={{ fontSize: 10.5 }}>NFC &amp; vCard</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label htmlFor="m-phone" style={{ fontWeight: 700, fontSize: 12.5 }}>
                      Primary Phone / WhatsApp
                    </label>
                    <input
                      id="m-phone"
                      type="tel"
                      placeholder="e.g. 9847123456"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label htmlFor="m-alt-phone" style={{ fontWeight: 700, fontSize: 12.5 }}>
                      Secondary / Emergency Phone
                    </label>
                    <input
                      id="m-alt-phone"
                      type="tel"
                      placeholder="e.g. 9447012345"
                      value={formData.alt_phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, alt_phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="field" style={{ margin: 0 }}>
                  <label htmlFor="m-email" style={{ fontWeight: 700, fontSize: 12.5 }}>
                    Email Address (Optional)
                  </label>
                  <input
                    id="m-email"
                    type="email"
                    placeholder="e.g. member@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              {/* SECTION: SOCIAL MEDIA PROFILES (LINKTREE NFC IDENTITY) */}
              <div style={{ background: '#fdfbf7', padding: 14, borderRadius: 16, border: '1px solid rgba(197, 160, 89, 0.3)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    🌐 Social Profiles (Linktree &amp; NFC)
                  </span>
                  <span className="pill" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#b45309', borderColor: '#fcd34d', fontSize: 10.5 }}>
                    Linktree Cards
                  </span>
                </div>

                {/* Instagram */}
                <div className="field" style={{ margin: 0 }}>
                  <label htmlFor="m-link" style={{ fontWeight: 700, fontSize: 12.5 }}>
                    Instagram (Profile URL or @handle)
                  </label>
                  <input
                    id="m-link"
                    type="text"
                    placeholder="https://www.instagram.com/victory_pailippuram or @handle"
                    value={formData.link}
                    onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
                  />
                </div>

                {/* Facebook & LinkedIn */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label htmlFor="m-facebook" style={{ fontWeight: 700, fontSize: 12.5 }}>
                      Facebook URL
                    </label>
                    <input
                      id="m-facebook"
                      type="text"
                      placeholder="https://facebook.com/username"
                      value={formData.facebook}
                      onChange={(e) => setFormData((prev) => ({ ...prev, facebook: e.target.value }))}
                    />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label htmlFor="m-linkedin" style={{ fontWeight: 700, fontSize: 12.5 }}>
                      LinkedIn Profile
                    </label>
                    <input
                      id="m-linkedin"
                      type="text"
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedin}
                      onChange={(e) => setFormData((prev) => ({ ...prev, linkedin: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Twitter / X & Website */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label htmlFor="m-twitter" style={{ fontWeight: 700, fontSize: 12.5 }}>
                      Twitter / X (@handle or link)
                    </label>
                    <input
                      id="m-twitter"
                      type="text"
                      placeholder="@handle or https://x.com/username"
                      value={formData.twitter}
                      onChange={(e) => setFormData((prev) => ({ ...prev, twitter: e.target.value }))}
                    />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label htmlFor="m-website" style={{ fontWeight: 700, fontSize: 12.5 }}>
                      Personal Website / Portfolio
                    </label>
                    <input
                      id="m-website"
                      type="text"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* NFC & Emergency Vitals: Blood Group & Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="field">
                  <label htmlFor="m-blood" style={{ fontWeight: 700 }}>
                    Blood Group (NFC Vitals)
                  </label>
                  <select
                    id="m-blood"
                    value={formData.blood_group}
                    onChange={(e) => setFormData((prev) => ({ ...prev, blood_group: e.target.value }))}
                  >
                    {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="m-location" style={{ fontWeight: 700 }}>
                    Base Location / Area
                  </label>
                  <input
                    id="m-location"
                    type="text"
                    placeholder="e.g. Pailippuram, Dubai, etc."
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  />
                </div>
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
