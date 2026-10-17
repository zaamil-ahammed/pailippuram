'use client';
import PageHeader from '../../components/PageHeader';
import { formatDate } from '../../lib/supabase';
import { PANCHAYATH_SECTIONS } from '../../lib/sections';
import { useRows } from '../../lib/useRows';
import PersonAvatar from '../../components/PersonAvatar';

const HEADINGS = {
  bearer: 'Office bearers',
  ward: 'Ward members',
  service: 'Services you can apply for or pay for',
  notice: 'Notices and Gram Sabha dates',
};

// A phone number becomes a call link; anything else (like a date) stays as text.
function Extra({ value }) {
  if (!value) return null;
  return /^[+\d\s-]{8,}$/.test(value) ? (
    <a className="btn dark" href={`tel:${value}`}>Call {value}</a>
  ) : (
    <p className="muted">{value}</p>
  );
}

export default function Panchayath() {
  const { rows, loading, error } = useRows(
    (s) => s.from('panchayath_items').select('*').eq('status', 'approved').order('title'),
    []
  );

  return (
    <div className="page">
      <PageHeader title="Panchayath" ml="പഞ്ചായത്ത് വിവരങ്ങൾ" />
      <main className="body">
        <p className="note">Services are things you apply for or pay for. Notices are official announcements.</p>
        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading...</p> : null}
        {PANCHAYATH_SECTIONS.map(({ value }) => {
          const items = rows.filter((r) => r.section === value);
          if (items.length === 0) return null;
          const isPersonSection = value === 'bearer' || value === 'ward';
          return (
            <section key={value} className="stack">
              <h2>{HEADINGS[value]}</h2>
              {items.map((r) => {
                const photoFromDetail = r.detail?.match(/Photo:\s*([^\s\n]+)/i)?.[1]?.trim();
                const effectivePhoto = r.photo_url || photoFromDetail || '';
                const cleanDetail = r.detail ? r.detail.replace(/Photo:\s*[^\s\n]+/gi, '').replace(/\n{2,}/g, '\n').trim() : '';
                return (
                  <article key={r.id} className="card">
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      {(isPersonSection || effectivePhoto) && (
                        <PersonAvatar
                          src={effectivePhoto}
                          alt={r.title}
                          category={value === 'bearer' ? 'Office bearer' : 'Ward member'}
                          kind="panchayath"
                          size={72}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3>{r.title}</h3>
                        {cleanDetail ? <p style={{ marginTop: 4 }}>{cleanDetail}</p> : null}
                        <div style={{ marginTop: 8 }}>
                          <Extra value={r.extra} />
                        </div>
                        {r.verified_at ? <p className="muted small" style={{ marginTop: 6 }}>Checked {formatDate(r.verified_at)}</p> : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}
        {!loading && !error && rows.length === 0 ? <p className="muted">Nothing added yet.</p> : null}
      </main>
    </div>
  );
}
