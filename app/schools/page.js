'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import PageHeader from '../../components/PageHeader';
import { useRows } from '../../lib/useRows';
import { formatDate } from '../../lib/supabase';
import { shareServiceOrApp } from '../../lib/share';

// Role catalog with category mappings
const ROLE_CATALOG = [
  { key: 'hm', label: 'Headmaster (HM)', ml: 'പ്രധാനാധ്യാപകൻ', icon: '👔', category: 'leadership' },
  { key: 'headmistress', label: 'Headmistress (HM)', ml: 'പ്രധാനാധ്യാപിക', icon: '👩‍🏫', category: 'leadership' },
  { key: 'principal', label: 'Principal', ml: 'പ്രിൻസിപ്പാൾ', icon: '🎓', category: 'leadership' },
  { key: 'sadar', label: 'Sadar Ustad', ml: 'സദർ ഉസ്താദ്', icon: '📖', category: 'ustad' },
  { key: 'mudarris', label: 'Chief Mudarris', ml: 'മുദരിസ്', icon: '🕌', category: 'ustad' },
  { key: 'office', label: 'Office Desk', ml: 'ഓഫീസ്', icon: '🏢', category: 'office' },
  { key: 'pta', label: 'PTA President', ml: 'പി.ടി.എ പ്രസിഡന്റ്', icon: '🤝', category: 'pta' },
  { key: 'mpta', label: 'MPTA President', ml: 'എം.പി.ടി.എ പ്രസിഡന്റ്', icon: '👩‍👧‍👦', category: 'pta' },
  { key: 'president', label: 'Management President', ml: 'പ്രസിഡന്റ്', icon: '👥', category: 'pta' },
  { key: 'secretary', label: 'General Secretary', ml: 'സെക്രട്ടറി', icon: '📝', category: 'pta' },
  { key: 'manager', label: 'Manager / Correspondent', ml: 'മാനേജർ', icon: '🏛️', category: 'leadership' },
  { key: 'convener', label: 'Convener', ml: 'കൺവീനർ', icon: '📋', category: 'pta' },
  { key: 'bus', label: 'School / Madrasa Bus', ml: 'വാഹനം / ഡ്രൈവർ', icon: '🚌', category: 'transport' },
  { key: 'van', label: 'School Van Driver', ml: 'സ്കൂൾ വാൻ', icon: '🚐', category: 'transport' },
  { key: 'worker', label: 'Anganwadi Worker (AWW)', ml: 'വർക്കർ', icon: '👩‍🏫', category: 'anganwadi' },
  { key: 'helper', label: 'Anganwadi Helper (AWH)', ml: 'ഹെൽപ്പർ', icon: '🤝', category: 'anganwadi' },
];

export const ROLE_MENU_ITEMS = [
  { id: 'all', label: 'All Roles', ml: 'എല്ലാ ഭാരവാഹികളും', icon: '👥' },
  { id: 'leadership', label: 'HM & Principals', ml: 'പ്രധാനാധ്യാപകർ', icon: '👔' },
  { id: 'ustad', label: 'Sadar Ustads', ml: 'സദർ ഉസ്താദുമാർ', icon: '📖' },
  { id: 'office', label: 'Office Desks', ml: 'ഓഫീസ് നമ്പറുകൾ', icon: '🏢' },
  { id: 'pta', label: 'PTA & Management', ml: 'പി.ടി.എ ഭാരവാഹികൾ', icon: '🤝' },
  { id: 'transport', label: 'School / Madrasa Bus', ml: 'സ്കൂൾ ബസ് & വാൻ', icon: '🚌' },
  { id: 'anganwadi', label: 'Anganwadi Staff', ml: 'അങ്കണവാടി', icon: '🎒' },
];

// Helper to extract structured roles from institution description
function parseInstitutionRoles(desc = '', fallbackPhone = '') {
  const roles = [];
  const lines = desc.split('\n');

  let inRolesSection = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^roles?:/i.test(line)) {
      inRolesSection = true;
      continue;
    }
    if (/^details?:/i.test(line) || /^type:/i.test(line)) {
      inRolesSection = false;
    }

    for (const kw of ROLE_CATALOG) {
      const regex = new RegExp(`(?:^[-*•\\s]*|\\b)(${kw.label}|${kw.key}|${kw.ml})\\s*[:=-]\\s*([^\n]+)`, 'i');
      const match = line.match(regex);
      if (match) {
        const rolePayload = match[2].trim();
        let personName = '';
        let personPhone = '';

        if (rolePayload.includes('|')) {
          const parts = rolePayload.split('|');
          personName = parts[0].trim();
          personPhone = parts[1].trim();
        } else if (rolePayload.includes('(') && rolePayload.includes(')')) {
          const pMatch = rolePayload.match(/^([^(]+)\s*\(([^)]+)\)/);
          if (pMatch) {
            personName = pMatch[1].trim();
            personPhone = pMatch[2].trim();
          } else {
            personPhone = rolePayload;
          }
        } else if (/^[+0-9\s,-]{7,25}$/.test(rolePayload)) {
          personPhone = rolePayload;
        } else {
          const numMatch = rolePayload.match(/(?:\+91[\s-]?)?[6-9]\d{9}|04\d{2,3}[\s-]?\d{6,7}/);
          if (numMatch) {
            personPhone = numMatch[0];
            personName = rolePayload.replace(numMatch[0], '').replace(/[-:,()|]/g, '').trim();
          } else {
            personName = rolePayload;
          }
        }

        if (!roles.some((r) => r.label === kw.label && r.phone === personPhone)) {
          roles.push({
            role: kw.label,
            roleMl: kw.ml,
            roleKey: kw.key,
            roleCategory: kw.category,
            icon: kw.icon,
            name: personName,
            phone: personPhone,
          });
        }
        break;
      }
    }
  }

  // If no office role was found but a primary institution phone is listed, add Office Desk
  if (fallbackPhone && !roles.some((r) => r.phone === fallbackPhone)) {
    roles.unshift({
      role: 'Office Desk',
      roleMl: 'ഓഫീസ്',
      roleKey: 'office',
      roleCategory: 'office',
      icon: '🏢',
      name: 'Main Enquiries',
      phone: fallbackPhone,
    });
  }

  return roles;
}

// Clean details text by removing metadata tags and roles block
function cleanInstitutionDetails(desc = '') {
  if (!desc) return '';
  return desc
    .replace(/\[EDUCATION\]\s*/gi, '')
    .replace(/\[SCHOOL\]\s*/gi, '')
    .replace(/\[MADRASSA\]\s*/gi, '')
    .replace(/Type:\s*[^\n]+\n?/gi, '')
    .replace(/Roles:[\s\S]*?(?=Details:|$)/gi, '')
    .replace(/Details:\s*/gi, '')
    .trim();
}

function detectInstitutionType(r) {
  const t = (r.title || '').toLowerCase();
  const d = (r.description || '').toLowerCase();
  const cat = (r.categories?.name || '').toLowerCase();

  if (d.includes('madrassa') || d.includes('madrasa') || t.includes('madrassa') || t.includes('madrasa') || cat.includes('madrassa') || d.includes('dars') || t.includes('dars')) {
    return 'madrassa';
  }
  if (t.includes('anganwadi') || d.includes('anganwadi')) {
    return 'anganwadi';
  }
  return 'school';
}

export default function SchoolsPage() {
  const [viewMode, setViewMode] = useState('roles'); // 'roles' (Menu for Roles & Numbers) or 'institutions'
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'school', 'madrassa', 'anganwadi'
  const [selectedRoleCategory, setSelectedRoleCategory] = useState('all'); // 'all', 'leadership', 'ustad', 'office', 'pta', 'transport', 'anganwadi'
  const [term, setTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Fetch all approved listings tagged as EDUCATION or with school/madrassa categories
  const { rows, loading, error } = useRows(
    (s) =>
      s
        .from('listings')
        .select('*, categories(id, name, name_ml)')
        .eq('status', 'approved')
        .or(
          'description.ilike.%[EDUCATION]%,description.ilike.%[SCHOOL]%,description.ilike.%[MADRASSA]%,category_id.eq.aefbe578-e693-4d17-b1b9-3fcbaa58ae19,category_id.eq.690aa10e-e82e-4393-b0a8-f1b814aa322f,title.ilike.%school%,title.ilike.%madrassa%,title.ilike.%madrasa%,title.ilike.%anganwadi%'
        )
        .order('title'),
    []
  );

  // Extract all individual roles paired with their parent institution
  const allRolesList = useMemo(() => {
    const list = [];
    rows.forEach((inst) => {
      const instType = detectInstitutionType(inst);
      const roles = parseInstitutionRoles(inst.description, inst.phone);
      roles.forEach((r, idx) => {
        list.push({
          id: `${inst.id}-role-${idx}`,
          ...r,
          instId: inst.id,
          instTitle: inst.title,
          instType,
          instArea: inst.area || 'Pailippuram',
          instHours: inst.hours,
          instVerified: inst.verified_at,
        });
      });
    });
    return list;
  }, [rows]);

  // Counts by institution tab
  const instCounts = useMemo(() => {
    let schoolsCount = 0;
    let madrassasCount = 0;
    let anganwadisCount = 0;

    rows.forEach((r) => {
      const type = detectInstitutionType(r);
      if (type === 'madrassa') madrassasCount++;
      else if (type === 'anganwadi') anganwadisCount++;
      else schoolsCount++;
    });

    return {
      all: rows.length,
      school: schoolsCount,
      madrassa: madrassasCount,
      anganwadi: anganwadisCount,
    };
  }, [rows]);

  // Counts by role category
  const roleCategoryCounts = useMemo(() => {
    const counts = {
      all: allRolesList.length,
      leadership: 0,
      ustad: 0,
      office: 0,
      pta: 0,
      transport: 0,
      anganwadi: 0,
    };
    allRolesList.forEach((r) => {
      if (counts[r.roleCategory] !== undefined) {
        counts[r.roleCategory]++;
      }
    });
    return counts;
  }, [allRolesList]);

  // Filtered Roles (for Roles Menu view)
  const filteredRoles = useMemo(() => {
    let list = allRolesList;

    // Filter by institution type tab
    if (activeTab !== 'all') {
      list = list.filter((r) => r.instType === activeTab);
    }

    // Filter by role category
    if (selectedRoleCategory !== 'all') {
      list = list.filter((r) => r.roleCategory === selectedRoleCategory);
    }

    // Filter by search term
    const q = term.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        return (
          r.role.toLowerCase().includes(q) ||
          (r.roleMl && r.roleMl.toLowerCase().includes(q)) ||
          (r.name && r.name.toLowerCase().includes(q)) ||
          r.instTitle.toLowerCase().includes(q) ||
          r.instArea.toLowerCase().includes(q) ||
          (r.phone && r.phone.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [allRolesList, activeTab, selectedRoleCategory, term]);

  // Filtered Institutions (for Institution view)
  const filteredInstitutions = useMemo(() => {
    let list = rows;

    if (activeTab !== 'all') {
      list = list.filter((r) => detectInstitutionType(r) === activeTab);
    }

    const q = term.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const title = (r.title || '').toLowerCase();
        const area = (r.area || '').toLowerCase();
        const desc = (r.description || '').toLowerCase();
        const phone = (r.phone || '').toLowerCase();
        const catName = (r.categories?.name || '').toLowerCase();
        return (
          title.includes(q) ||
          area.includes(q) ||
          desc.includes(q) ||
          phone.includes(q) ||
          catName.includes(q)
        );
      });
    }

    // If a role category is selected, only show institutions that contain that role
    if (selectedRoleCategory !== 'all') {
      list = list.filter((inst) => {
        const roles = parseInstitutionRoles(inst.description, inst.phone);
        return roles.some((r) => r.roleCategory === selectedRoleCategory);
      });
    }

    return list;
  }, [rows, activeTab, selectedRoleCategory, term]);

  const handleShareRole = async (r) => {
    const text = `${r.icon} ${r.role} (${r.roleMl || ''})\n👤 ${r.name || 'In-Charge'}\n📞 Phone: ${r.phone}\n🏫 ${r.instTitle} (${r.instArea})\n\nNammude Pailippuram Directory:`;
    await shareServiceOrApp({
      title: `${r.role} - ${r.instTitle}`,
      text,
      url: typeof window !== 'undefined' ? `${window.location.origin}/schools` : '',
    });
    setCopiedId(r.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleShareInstitution = async (inst) => {
    const roles = parseInstitutionRoles(inst.description, inst.phone);
    const rolesText = roles.map((r) => `${r.role}: ${r.name ? `${r.name} - ` : ''}${r.phone}`).join('\n');
    const text = `🏫 ${inst.title}\n📍 ${inst.area || 'Pailippuram'}\n\nKey Roles & Contacts:\n${rolesText}\n\nNammude Pailippuram Directory:`;
    await shareServiceOrApp({
      title: `${inst.title} · Schools & Madrassas`,
      text,
      url: typeof window !== 'undefined' ? `${window.location.origin}/schools#item-${inst.id}` : '',
    });
    setCopiedId(inst.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="page">
      <PageHeader
        title="Schools & Madrassas"
        ml="സ്കൂളുകൾ & മദ്രസകൾ"
        back="/"
        backLabel="Home"
      >
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.4 }}>
            അദ്ധ്യാപകർ, സദർ ഉസ്താദ്, പ്രധാന നമ്പറുകൾ & ഭാരവാഹികൾ
          </p>

          {/* Search Bar */}
          <form onSubmit={(e) => e.preventDefault()} style={{ marginTop: 4 }}>
            <label htmlFor="school-search" className="hp">Search schools and madrassas</label>
            <input
              id="school-search"
              type="search"
              placeholder="Search by role (HM, Sadar, PTA, Bus), person name, school, area or number..."
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              style={{
                width: '100%',
                minHeight: 44,
                padding: '0 16px',
                borderRadius: 14,
                fontSize: 14,
                background: '#ffffff',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}
            />
          </form>
        </div>
      </PageHeader>

      <main className="body">
        {/* VIEW MODE SWITCHER: Roles Directory vs Institutions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--accent-tint)',
            border: '1.5px solid var(--accent-border)',
            borderRadius: 16,
            padding: '6px 8px',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 6, flex: 1 }}>
            <button
              type="button"
              onClick={() => setViewMode('roles')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: viewMode === 'roles' ? '#ffffff' : 'transparent',
                color: viewMode === 'roles' ? 'var(--gold-dark)' : 'var(--muted)',
                boxShadow: viewMode === 'roles' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>📋</span>
              <span>Roles & Numbers Menu · ഭാരവാഹികൾ</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('institutions')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: viewMode === 'institutions' ? '#ffffff' : 'transparent',
                color: viewMode === 'institutions' ? 'var(--gold-dark)' : 'var(--muted)',
                boxShadow: viewMode === 'institutions' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>🏫</span>
              <span>By Institution · സ്ഥാപനങ്ങൾ</span>
            </button>
          </div>
        </div>

        {/* DEDICATED ROLE MENU FILTER CHIPS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🎯 Filter by Role · ഭാരവാഹികളുടെ വിഭാഗം
            </span>
            {selectedRoleCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedRoleCategory('all')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold-dark)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '2px 4px',
                }}
              >
                Reset Role Filter &times;
              </button>
            )}
          </div>

          <div className="chips" style={{ margin: 0, gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {ROLE_MENU_ITEMS.map((rm) => {
              const active = selectedRoleCategory === rm.id;
              const count = roleCategoryCounts[rm.id] ?? 0;
              return (
                <button
                  key={rm.id}
                  type="button"
                  className={`chip ${active ? 'on' : ''}`}
                  onClick={() => setSelectedRoleCategory(rm.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    fontSize: 12.5,
                    fontWeight: active ? 800 : 600,
                    borderRadius: 14,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{rm.icon}</span>
                  <span>{rm.label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: active ? '#ffffff' : 'rgba(0,0,0,0.06)',
                      color: active ? 'var(--gold-dark)' : 'var(--muted)',
                      fontWeight: 700,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* INSTITUTION TYPE TABS & ADD ACTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          {/* Tab Filter Chips */}
          <div className="chips" style={{ margin: 0 }}>
            <button
              type="button"
              className={`chip ${activeTab === 'all' ? 'on' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({instCounts.all})
            </button>
            <button
              type="button"
              className={`chip ${activeTab === 'school' ? 'on' : ''}`}
              onClick={() => setActiveTab('school')}
            >
              <span>🏫 Schools ({instCounts.school})</span>
            </button>
            <button
              type="button"
              className={`chip ${activeTab === 'madrassa' ? 'on' : ''}`}
              onClick={() => setActiveTab('madrassa')}
            >
              <span>📖 Madrassas ({instCounts.madrassa})</span>
            </button>
            <button
              type="button"
              className={`chip ${activeTab === 'anganwadi' ? 'on' : ''}`}
              onClick={() => setActiveTab('anganwadi')}
            >
              <span>🎒 Anganwadi ({instCounts.anganwadi})</span>
            </button>
          </div>

          <Link
            href="/share?type=school"
            className="btn small"
            style={{
              borderRadius: 16,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--accent-tint)',
              borderColor: 'var(--accent-border)',
              color: 'var(--ink)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>✨</span>
            <span>+ Add School / Madrassa Roles</span>
          </Link>
        </div>

        {/* Results summary and reset */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
            {viewMode === 'roles' ? (
              <>Showing {filteredRoles.length} {filteredRoles.length === 1 ? 'role' : 'roles'}</>
            ) : (
              <>Showing {filteredInstitutions.length} {filteredInstitutions.length === 1 ? 'institution' : 'institutions'}</>
            )}
            {selectedRoleCategory !== 'all' ? ` for "${ROLE_MENU_ITEMS.find((r) => r.id === selectedRoleCategory)?.label}"` : ''}
            {term ? ` matching "${term}"` : ''}
          </span>
          {term && (
            <button
              type="button"
              onClick={() => setTerm('')}
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
              Clear search &times;
            </button>
          )}
        </div>

        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading schools and madrassas...</p> : null}

        {/* MODE 1: ROLES & NUMBERS DIRECTORY VIEW */}
        {viewMode === 'roles' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {filteredRoles.map((r) => {
              const cleanNum = (r.phone || '').replace(/\D/g, '');
              const typeBadge =
                r.instType === 'madrassa'
                  ? '📖 Madrassa'
                  : r.instType === 'anganwadi'
                  ? '🎒 Anganwadi'
                  : '🏫 School';

              return (
                <article
                  key={r.id}
                  className="card"
                  style={{
                    padding: '16px',
                    borderRadius: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                    background: '#ffffff',
                    border: '1.5px solid var(--card-border)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <div>
                    {/* Top row: Role Badge & Share */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 18 }}>{r.icon}</span>
                        <div>
                          <strong style={{ fontSize: 14.5, color: 'var(--ink)', display: 'block', lineHeight: 1.2 }}>
                            {r.role}
                          </strong>
                          {r.roleMl && (
                            <span style={{ fontSize: 12, color: 'var(--gold-dark)', fontWeight: 600 }}>
                              {r.roleMl}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: r.instType === 'madrassa' ? '#f0fdf4' : '#faf5ff',
                          color: r.instType === 'madrassa' ? '#166534' : '#6b21a8',
                          border: `1px solid ${r.instType === 'madrassa' ? '#bbf7d0' : '#e9d5ff'}`,
                          flexShrink: 0,
                        }}
                      >
                        {typeBadge}
                      </span>
                    </div>

                    {/* Person Name & Institution Details */}
                    <div style={{ marginTop: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      {r.name && (
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                          👤 {r.name}
                        </div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginTop: 2 }}>
                        🏫 {r.instTitle}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>📍 {r.instArea}</span>
                        {r.instHours && <span>· 🕒 {r.instHours}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Contact Action Bar with Direct Calling & WhatsApp */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                      📞 {r.phone}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {cleanNum && (
                        <a
                          href={`tel:${cleanNum}`}
                          className="btn dark small"
                          style={{
                            padding: '6px 12px',
                            fontSize: 12.5,
                            borderRadius: 10,
                            fontWeight: 700,
                            minHeight: 32,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title={`Call ${r.role}`}
                        >
                          <span>📞</span>
                          <span>Call</span>
                        </a>
                      )}

                      {cleanNum.length === 10 && (
                        <a
                          href={`https://wa.me/91${cleanNum}?text=${encodeURIComponent(`Hello, I found your contact for ${r.role} at ${r.instTitle} on Nammude Pailippuram directory.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 10px',
                            fontSize: 12.5,
                            borderRadius: 10,
                            border: '1px solid #bbf7d0',
                            background: '#f0fdf4',
                            color: '#166534',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            minHeight: 32,
                          }}
                          title="Chat on WhatsApp"
                        >
                          <span>WA</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleShareRole(r)}
                        style={{
                          background: 'none',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: '6px 8px',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                        title="Share this contact"
                      >
                        {copiedId === r.id ? '✓' : '📤'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* MODE 2: INSTITUTIONS VIEW (with full institution cards and all roles listed) */}
        {viewMode === 'institutions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredInstitutions.map((inst) => {
              const instType = detectInstitutionType(inst);
              const roles = parseInstitutionRoles(inst.description, inst.phone);
              const cleanDesc = cleanInstitutionDetails(inst.description);
              const typeBadgeLabel =
                instType === 'madrassa'
                  ? '📖 Madrassa & Dars'
                  : instType === 'anganwadi'
                  ? '🎒 Anganwadi'
                  : '🏫 School / Vidhyalayam';

              return (
                <article
                  key={inst.id}
                  id={`item-${inst.id}`}
                  className="card"
                  style={{
                    padding: '20px',
                    borderRadius: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    background: '#ffffff',
                    border: '1.5px solid var(--card-border)',
                    boxShadow: '0 3px 12px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  {/* Header row: Title, Type badge, Location */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: instType === 'madrassa' ? '#f0fdf4' : '#faf5ff',
                            color: instType === 'madrassa' ? '#166534' : '#6b21a8',
                            border: `1px solid ${instType === 'madrassa' ? '#bbf7d0' : '#e9d5ff'}`,
                          }}
                        >
                          {typeBadgeLabel}
                        </span>

                        {inst.verified_at && (
                          <span style={{ fontSize: 11.5, color: '#059669', fontWeight: 600 }}>
                            ✓ Verified
                          </span>
                        )}
                      </div>

                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 4px', color: 'var(--ink)' }}>
                        {inst.title}
                      </h2>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 13, color: 'var(--muted)' }}>
                        {inst.area && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            📍 {inst.area}
                          </span>
                        )}
                        {inst.hours && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            🕒 {inst.hours}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleShareInstitution(inst)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--card-border)',
                        borderRadius: 10,
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--ink)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                      }}
                      title="Share institution details"
                    >
                      <span>{copiedId === inst.id ? '✓ Shared' : '📤 Share'}</span>
                    </button>
                  </div>

                  {/* ROLES & CONTACTS SECTION */}
                  {roles.length > 0 && (
                    <div
                      style={{
                        background: '#f8fafc',
                        borderRadius: 14,
                        border: '1px solid #e2e8f0',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            color: '#475569',
                          }}
                        >
                          Roles & Numbers Menu · പ്രധാന ഭാരവാഹികൾ
                        </span>
                        <span style={{ fontSize: 11.5, color: '#64748b' }}>
                          {roles.length} {roles.length === 1 ? 'role listed' : 'roles listed'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                        {roles.map((r, idx) => {
                          const cleanNum = (r.phone || '').replace(/\D/g, '');
                          return (
                            <div
                              key={idx}
                              style={{
                                background: '#ffffff',
                                borderRadius: 10,
                                border: '1px solid #e2e8f0',
                                padding: '9px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 8,
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                                  <span>{r.icon}</span>
                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {r.role}
                                  </span>
                                </div>
                                {r.name && (
                                  <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {r.name}
                                  </div>
                                )}
                                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1, fontFamily: 'monospace' }}>
                                  {r.phone}
                                </div>
                              </div>

                              {r.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                  <a
                                    href={`tel:${cleanNum}`}
                                    className="btn dark small"
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: 12,
                                      borderRadius: 8,
                                      minHeight: 30,
                                      fontWeight: 700,
                                    }}
                                    title={`Call ${r.role}`}
                                  >
                                    Call
                                  </a>
                                  {cleanNum.length === 10 && (
                                    <a
                                      href={`https://wa.me/91${cleanNum}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: 12,
                                        borderRadius: 8,
                                        border: '1px solid #bbf7d0',
                                        background: '#f0fdf4',
                                        color: '#166534',
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        minHeight: 30,
                                      }}
                                      title="Chat on WhatsApp"
                                    >
                                      WA
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Details / Notes */}
                  {cleanDesc && (
                    <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                      {cleanDesc}
                    </p>
                  )}

                  {/* Footer bar with Primary Call & WhatsApp actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: -4 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                      {inst.verified_at ? `Checked: ${formatDate(inst.verified_at)}` : 'Community verified'}
                    </span>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {inst.phone && (
                        <a
                          href={`tel:${inst.phone.replace(/\D/g, '')}`}
                          className="btn dark"
                          style={{ padding: '6px 14px', fontSize: 13, fontWeight: 700 }}
                        >
                          📞 Call Office ({inst.phone})
                        </a>
                      )}
                      {inst.whatsapp && (
                        <a
                          href={`https://wa.me/91${inst.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{ padding: '6px 14px', fontSize: 13, fontWeight: 700 }}
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && (viewMode === 'roles' ? filteredRoles.length === 0 : filteredInstitutions.length === 0) && (
          <div className="card" style={{ textAlign: 'center', padding: '36px 20px', gap: 12 }}>
            <div style={{ fontSize: '2.5rem' }}>🏫</div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>No schools or madrassas found</h3>
            <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
              {term
                ? `No results matching "${term}". Try another name, place or role.`
                : 'Be the first to list a school or madrassa in Pailippuram!'}
            </p>
            <div>
              <Link href="/share?type=school" className="btn dark" style={{ display: 'inline-block', marginTop: 8 }}>
                + Submit School / Madrassa Details
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
