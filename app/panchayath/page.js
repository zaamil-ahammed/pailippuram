'use client';
import PageHeader from '../../components/PageHeader';
import { formatDate, cleanDescription } from '../../lib/supabase';
import { PANCHAYATH_SECTIONS } from '../../lib/sections';
import { useRows } from '../../lib/useRows';

const HEADINGS = {
  bearer: 'Office bearers',
  ward: 'Ward members',
  service: 'Services you can apply for or pay for',
  notice: 'Notices and Gram Sabha dates',
};

// A phone number becomes a call link; multiple numbers become individual call links; anything else stays as text.
function Extra({ value }) {
  if (!value) return null;
  const numbers = String(value).split(/[,/;\n]/).map((n) => n.trim()).filter(Boolean);
  const isPhoneList = numbers.length > 0 && numbers.every((n) => /^[+\d\s-]{7,25}$/.test(n));
  if (isPhoneList) {
    return (
      <div className="btnrow" style={{ marginTop: 4 }}>
        {numbers.map((n, idx) => (
          <a key={idx} className="btn dark" href={`tel:${n.replace(/\D/g, '')}`}>
            Call {n}
          </a>
        ))}
      </div>
    );
  }
  return <p className="muted">{value}</p>;
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
          return (
            <section key={value} className="stack">
              <h2>{HEADINGS[value]}</h2>
              {items.map((r) => (
                <article key={r.id} className="card">
                  <h3>{r.title}</h3>
                  {cleanDescription(r.detail) ? <p>{cleanDescription(r.detail)}</p> : null}
                  <Extra value={r.extra} />
                  {r.verified_at ? <p className="muted small">Checked {formatDate(r.verified_at)}</p> : null}
                </article>
              ))}
            </section>
          );
        })}
        {!loading && !error && rows.length === 0 ? <p className="muted">Nothing added yet.</p> : null}
      </main>
    </div>
  );
}
