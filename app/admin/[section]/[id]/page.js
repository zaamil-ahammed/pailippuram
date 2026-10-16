'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '../../../../components/PageHeader';
import { useAdmin } from '../../../../components/AdminGate';
import { supabase } from '../../../../lib/supabase';
import { logAudit } from '../../../../lib/audit';
import { useRows } from '../../../../lib/useRows';
import { SECTIONS } from '../../../../lib/sections';

// One form for every section. The fields come from lib/sections.js.
export default function AdminEdit() {
  const { section, id } = useParams();
  const router = useRouter();
  const { user } = useAdmin();
  const cfg = SECTIONS[section];
  const isNew = id === 'new';

  const [values, setValues] = useState(null);
  const [original, setOriginal] = useState(null);
  const [status, setStatus] = useState('approved');
  const [verify, setVerify] = useState(false);
  const [note, setNote] = useState('');
  const [fromId, setFromId] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const cats = useRows(
    (s) => s.from('categories').select('*').eq('kind', cfg?.match?.kind || 'none').order('name'),
    [section]
  );

  useEffect(() => {
    if (!cfg) return;
    const blank = Object.fromEntries(cfg.fields.map((f) => [f.name, f.type === 'checkbox' ? Boolean(f.default) : '']));
    (async () => {
      if (!isNew) {
        const { data, error } = await supabase.from(cfg.table).select('*').eq('id', id).maybeSingle();
        if (error || !data) return setMsg('Could not find this item.');
        setOriginal(data);
        setStatus(data.status);
        return setValues(Object.fromEntries(cfg.fields.map((f) => [f.name, data[f.name] ?? blank[f.name]])));
      }
      const from = new URLSearchParams(window.location.search).get('from');
      if (from) {
        const { data } = await supabase.from('submissions').select('*').eq('id', from).maybeSingle();
        if (data) {
          setFromId(from);
          const pre = cfg.fromSubmission(data);
          return setValues({ ...blank, ...Object.fromEntries(Object.entries(pre).filter(([, v]) => v != null)) });
        }
      }
      setValues(blank);
    })();
  }, [section, id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cfg) return <div className="page"><main className="body"><p>Unknown section.</p></main></div>;

  const set = (name) => (e) => {
    const t = e.target;
    setValues((v) => ({ ...v, [name]: t.type === 'checkbox' ? t.checked : t.value }));
  };

  async function save(e) {
    e.preventDefault();
    setMsg('');
    const payload = {};
    for (const f of cfg.fields) {
      let v = values[f.name];
      if (f.type === 'checkbox') {
        if (f.required && !v) return setMsg(`Please confirm: ${f.label}`);
      } else {
        v = typeof v === 'string' ? v.trim() : v;
        if (f.required && !v) return setMsg(`Please fill in: ${f.label}`);
        if (v === '') v = null;
        if (f.type === 'category' && v) v = Number(v);
      }
      payload[f.name] = v;
    }
    payload.status = status;
    payload.updated_by = user.id;
    if (cfg.verify && verify) payload.verified_at = new Date().toISOString();

    setBusy(true);
    let rowId = id;
    let error;
    if (isNew) {
      const res = await supabase.from(cfg.table).insert({ ...payload, ...cfg.match }).select('id').single();
      error = res.error;
      rowId = res.data?.id;
      if (error && cfg.match?.kind === 'transport') {
        const fallbackRes = await supabase.from(cfg.table).insert({ ...payload, kind: 'worker' }).select('id').single();
        if (!fallbackRes.error) {
          error = null;
          rowId = fallbackRes.data?.id;
        }
      }
    } else {
      ({ error } = await supabase.from(cfg.table).update(payload).eq('id', id));
    }
    if (error) {
      setBusy(false);
      return setMsg('Could not save. Please check the fields and try again.');
    }

    const changes = {};
    for (const [k, v] of Object.entries(payload)) {
      if (k === 'updated_by') continue;
      const before = original ? original[k] ?? null : null;
      if (before !== v) changes[k] = [before, v];
    }
    await logAudit(user, { action: isNew ? 'create' : 'edit', table: cfg.table, rowId, note: note || null, changes });
    if (fromId) {
      await supabase.from('submissions').update({ status: 'approved' }).eq('id', fromId);
      await logAudit(user, { action: 'approve submission', table: 'submissions', rowId: fromId, note: `published as ${cfg.singular}` });
    }
    router.push(`/admin/${section}`);
  }

  return (
    <div className="page">
      <PageHeader title={isNew ? `Add ${cfg.singular}` : `Edit ${cfg.singular}`} ml="Changes go live as soon as you save" back={`/admin/${section}`} backLabel="Back to list" />
      {!values ? (
        <main className="body">{msg ? <p className="error">{msg}</p> : <p className="muted">Loading...</p>}</main>
      ) : (
        <form className="body" onSubmit={save}>
          {fromId ? <p className="note">This came from a visitor. Check and fix anything, then save to publish it.</p> : null}
          {cfg.fields.map((f) => {
            const fid = `f-${f.name}`;
            if (f.type === 'checkbox')
              return (
                <div key={f.name} className="check">
                  <input id={fid} type="checkbox" checked={Boolean(values[f.name])} onChange={set(f.name)} />
                  <label htmlFor={fid}>{f.label}</label>
                </div>
              );
            return (
              <div key={f.name} className="field">
                <label htmlFor={fid}>{f.label}{f.required ? ' *' : ''}</label>
                {f.type === 'textarea' ? (
                  <textarea id={fid} value={values[f.name] || ''} onChange={set(f.name)} />
                ) : f.type === 'select' ? (
                  <select id={fid} value={values[f.name] || ''} onChange={set(f.name)}>
                    <option value="">Choose...</option>
                    {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'category' ? (
                  <select id={fid} value={values[f.name] ?? ''} onChange={set(f.name)}>
                    <option value="">None</option>
                    {cats.rows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <input id={fid} type={f.type} value={values[f.name] || ''} onChange={set(f.name)} />
                )}
              </div>
            );
          })}
          <div className="label">Status</div>
          <div className="btnrow">
            <button type="button" className={`btn ${status === 'approved' ? 'dark' : ''}`} onClick={() => setStatus('approved')}>Live</button>
            <button type="button" className={`btn ${status === 'hidden' ? 'dark' : ''}`} onClick={() => setStatus('hidden')}>Hidden</button>
          </div>
          {cfg.verify ? (
            <div className="check">
              <input id="verify" type="checkbox" checked={verify} onChange={(e) => setVerify(e.target.checked)} />
              <label htmlFor="verify">Mark as verified today (I checked these details)</label>
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="note">Note for the activity log <span className="muted small">(optional)</span></label>
            <input id="note" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. owner called to change the number" />
          </div>
          {msg ? <p className="error" role="alert">{msg}</p> : null}
          <button type="submit" className="btn dark big" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
          <button type="button" className="btn big" onClick={() => router.push(`/admin/${section}`)}>Cancel</button>
          <div className="note">Every save is recorded in the activity log with your name, the time and what changed.</div>
        </form>
      )}
    </div>
  );
}
