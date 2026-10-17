'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import PageHeader from '../../components/PageHeader';
import { formatDate } from '../../lib/supabase';
import { useRows } from '../../lib/useRows';
import PersonAvatar from '../../components/PersonAvatar';
import { TAXONOMY } from '../../lib/taxonomy';

// Headings and Malayalam labels for Panchayat groups
const PANCHAYAT_GROUPS = [
  {
    id: 'representatives',
    sectionKey: 'bearer',
    name: 'Representatives & Offices',
    ml: 'ജനപ്രതിനിധികളും ഓഫീസും',
    icon: '👥',
    match: (r) => r.section === 'bearer' || r.section === 'ward' || /president|secretary|member|office|desk/i.test(r.title),
  },
  {
    id: 'services',
    sectionKey: 'service',
    name: 'Certificates & Government Services',
    ml: 'സർട്ടിഫിക്കറ്റുകളും സേവനങ്ങളും',
    icon: '📜',
    match: (r) => r.section === 'service' || /certificate|tax|pension|permit|kudumbashree|mgnregs|scheme/i.test(r.title),
  },
  {
    id: 'facilities',
    sectionKey: 'facility',
    name: 'Public Facilities',
    ml: 'പൊതു സൗകര്യങ്ങൾ',
    icon: '🏫',
    match: (r) => r.section === 'facility' || /anganwadi|school|library|hall|water|waste|haritha|sanitation/i.test(r.title),
  },
  {
    id: 'notices',
    sectionKey: 'notice',
    name: 'Local Information & Notices',
    ml: 'പ്രാദേശിക വിവരങ്ങൾ & അറിയിപ്പുകൾ',
    icon: '📢',
    match: (r) => r.section === 'notice' || /notice|sabha|meeting|project|update/i.test(r.title),
  },
];

// A phone number becomes a call link; anything else (like a date) stays as text.
function Extra({ value }) {
  if (!value) return null;
  return /^[+\d\s-]{8,}$/.test(value) ? (
    <a className="btn dark" href={`tel:${value}`} style={{ minHeight: 38, fontSize: 13 }}>
      Call {value}
    </a>
  ) : (
    <p className="muted small" style={{ fontWeight: 600 }}>{value}</p>
  );
}

export default function Panchayath() {
  const [q, setQ] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  const { rows, loading, error } = useRows(
    (s) => s.from('panchayath_items').select('*').eq('status', 'approved').order('title'),
    []
  );

  // "only show categories with atleast one to show":
  // Filter groups to strictly those that have >= 1 approved item
  const activeGroups = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return PANCHAYAT_GROUPS.map((g) => {
      const count = rows.filter((r) => g.match(r)).length;
      return { ...g, count };
    }).filter((g) => g.count > 0);
  }, [rows]);

  // Filter items by search query and selected group
  const filteredRows = useMemo(() => {
    let list = rows;

    if (selectedGroup) {
      const grp = PANCHAYAT_GROUPS.find((g) => g.id === selectedGroup);
      if (grp) {
        list = list.filter((r) => grp.match(r));
      }
    }

    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (r) =>
          (r.title && r.title.toLowerCase().includes(query)) ||
          (r.detail && r.detail.toLowerCase().includes(query)) ||
          (r.extra && r.extra.toLowerCase().includes(query))
      );
    }

    return list;
  }, [rows, selectedGroup, q]);

  return (
    <div className="page">
      <PageHeader title="Panchayat" ml="ഗ്രാമപഞ്ചായത്ത് വിവരങ്ങൾ & സേവനങ്ങൾ">
        <label htmlFor="pq" className="hp">Search</label>
        <input
          id="pq"
          type="search"
          placeholder="Search representatives, services, or notices..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </PageHeader>

      <main className="body">
        <p className="note" style={{ fontSize: 13.5 }}>
          Official local-government information: Panchayat President, Secretary, Ward Members, citizen certificates, and public civic services in Pailippuram.
        </p>

        {/* Categories / Groups: ONLY SHOW CATEGORIES WITH AT LEAST ONE LISTING */}
        {activeGroups.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Categories ({activeGroups.length})
            </span>
            <div className="chips">
              <button
                type="button"
                className={`chip ${selectedGroup === '' ? 'on' : ''}`}
                onClick={() => setSelectedGroup('')}
              >
                All ({rows.length})
              </button>
              {activeGroups.map((g) => {
                const isSelected = selectedGroup === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`chip ${isSelected ? 'on' : ''}`}
                    onClick={() => setSelectedGroup(isSelected ? '' : g.id)}
                    title={g.ml}
                  >
                    <span>{g.icon} {g.name}</span>
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 10,
                        background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                      }}
                    >
                      {g.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading...</p> : null}

        {/* Render grouped items */}
        {activeGroups.map((g) => {
          if (selectedGroup && selectedGroup !== g.id) return null;
          const items = filteredRows.filter((r) => g.match(r));
          if (items.length === 0) return null;

          return (
            <section key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid var(--card-border)', paddingBottom: 6 }}>
                <div>
                  <h2 style={{ fontSize: 18, color: 'var(--primary)' }}>
                    {g.icon} {g.name}
                  </h2>
                  <p className="muted small" style={{ fontWeight: 600 }}>{g.ml}</p>
                </div>
                <span className="pill" style={{ fontSize: 11 }}>
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {items.map((r) => {
                const photoFromDetail = r.detail?.match(/Photo:\s*([^\s\n]+)/i)?.[1]?.trim();
                const effectivePhoto = r.photo_url || photoFromDetail || '';
                const cleanDetail = r.detail
                  ? r.detail.replace(/Photo:\s*[^\s\n]+/gi, '').replace(/\n{2,}/g, '\n').trim()
                  : '';
                const isPerson = g.id === 'representatives' || Boolean(effectivePhoto);

                return (
                  <article key={r.id} className="card">
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      {isPerson && (
                        <PersonAvatar
                          src={effectivePhoto}
                          alt={r.title}
                          category={g.name}
                          kind="panchayath"
                          size={70}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: 17 }}>{r.title}</h3>
                        {cleanDetail ? (
                          <p style={{ marginTop: 4, whiteSpace: 'pre-line', fontSize: 14 }}>{cleanDetail}</p>
                        ) : null}
                        {r.extra ? (
                          <div style={{ marginTop: 10 }}>
                            <Extra value={r.extra} />
                          </div>
                        ) : null}
                        {r.verified_at ? (
                          <p className="muted small" style={{ marginTop: 8 }}>
                            Checked {formatDate(r.verified_at)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}

        {!loading && !error && filteredRows.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
            <p className="muted">No information found matching your filters.</p>
          </div>
        ) : null}

        <div style={{ marginTop: 8 }}>
          <Link
            href="/share?type=other"
            className="tile dash"
            style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              + Suggest Panchayat Update or Notice · വിവരം ചേർക്കുക
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
