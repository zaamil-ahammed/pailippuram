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

  // Quick inline category creation state
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatMl, setNewCatMl] = useState('');
  const [catBusy, setCatBusy] = useState(false);

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

  async function handleCreateCategoryInline(fieldName) {
    if (!newCatName.trim()) return;
    setCatBusy(true);
    setMsg('');
    const targetKind = cfg.match?.kind || 'business';
    const { data: createdCat, error: catErr } = await supabase
      .from('categories')
      .insert({
        kind: targetKind,
        name: newCatName.trim(),
        name_ml: newCatMl.trim() || null,
      })
      .select('id, name')
      .single();
    setCatBusy(false);
    if (catErr) {
      setMsg(catErr.message || 'Could not save category.');
      return;
    }
    if (createdCat) {
      setValues((v) => ({ ...v, [fieldName]: createdCat.id }));
      setNewCatName('');
      setNewCatMl('');
      setShowAddCat(false);
      cats.reload();
    }
  }

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
        if (f.type === 'category' && v) {
          if (typeof v === 'string' && /^\d+$/.test(v.trim())) {
            v = Number(v);
          }
        }
      }
      payload[f.name] = v;
    }

    if (cfg.table === 'categories') {
      // The categories table schema is strictly { id, kind, name, name_ml }.
      // Do not attach status, updated_by, verified_at, or body.
    } else {
      let effectiveStatus = status;
      if (cfg.table === 'listings' && status === 'hidden') {
        effectiveStatus = 'archived';
      }
      payload.status = effectiveStatus;
      if (cfg.table === 'announcements' && !payload.body) {
        payload.body = payload.title || 'Details';
      }
      if (user?.id) payload.updated_by = user.id;
      if (cfg.verify && verify) payload.verified_at = new Date().toISOString();
    }

    setBusy(true);
    let rowId = id;
    let error;

    async function executeSave(data) {
      if (isNew) {
        let insertData = { ...data, ...cfg.match };
        if (cfg.table === 'listings' && !insertData.kind) {
          insertData.kind = cfg.match?.kind || 'business';
        }
        let res = await supabase.from(cfg.table).insert(insertData).select('id').single();
        if (res.error && res.error.message && res.error.message.includes('updated_by')) {
          const { updated_by, ...cleaned } = insertData;
          res = await supabase.from(cfg.table).insert(cleaned).select('id').single();
        }
        if (res.error && res.error.message && res.error.message.includes('status_check')) {
          const altStatus = insertData.status === 'hidden' ? 'archived' : 'hidden';
          const { updated_by, ...cleaned } = insertData;
          res = await supabase.from(cfg.table).insert({ ...cleaned, status: altStatus }).select('id').single();
        }
        if (res.error && res.error.message && res.error.message.includes('listings_kind_check')) {
          console.warn('[Admin Save] listings_kind_check constraint violation for kind:', insertData.kind, '- applying business fallback');
          const originalKind = insertData.kind || 'worker';
          const { updated_by, ...cleaned } = insertData;
          const tag = `[${originalKind.toUpperCase()}]`;
          const safeDesc = cleaned.description ? (cleaned.description.includes(tag) ? cleaned.description : `${tag} ${cleaned.description}`) : tag;
          
          res = await supabase.from(cfg.table).insert({
            ...cleaned,
            kind: 'business',
            description: safeDesc,
          }).select('id').single();

          if (res.error && res.error.message && res.error.message.includes('status_check')) {
            const altStatus = insertData.status === 'hidden' ? 'archived' : 'hidden';
            res = await supabase.from(cfg.table).insert({
              ...cleaned,
              kind: 'business',
              description: safeDesc,
              status: altStatus,
            }).select('id').single();
          }
        }
        return { error: res.error, rowId: res.data?.id };
      } else {
        let updateData = { ...data };
        let res = await supabase.from(cfg.table).update(updateData).eq('id', id);
        if (res.error && res.error.message && res.error.message.includes('updated_by')) {
          const { updated_by, ...cleaned } = updateData;
          res = await supabase.from(cfg.table).update(cleaned).eq('id', id);
        }
        if (res.error && res.error.message && res.error.message.includes('status_check')) {
          const altStatus = updateData.status === 'hidden' ? 'archived' : 'hidden';
          const { updated_by, ...cleaned } = updateData;
          res = await supabase.from(cfg.table).update({ ...cleaned, status: altStatus }).eq('id', id);
        }
        if (res.error && res.error.message && res.error.message.includes('listings_kind_check')) {
          console.warn('[Admin Save] listings_kind_check on update - applying business fallback');
          const { updated_by, ...cleaned } = updateData;
          res = await supabase.from(cfg.table).update({ ...cleaned, kind: 'business' }).eq('id', id);
        }
        return { error: res.error, rowId: id };
      }
    }

    const result = await executeSave(payload);
    error = result.error;
    rowId = result.rowId;

    if (error) {
      setBusy(false);
      return setMsg(error.message || 'Could not save. Please check the fields and try again.');
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select id={fid} value={values[f.name] ?? ''} onChange={set(f.name)} style={{ flex: 1 }}>
                        <option value="">None / Choose category</option>
                        {cats.rows.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}{c.name_ml ? ` (${c.name_ml})` : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn light"
                        style={{ padding: '0 12px', minWidth: 110, fontSize: 13 }}
                        onClick={() => setShowAddCat(!showAddCat)}
                      >
                        {showAddCat ? 'Cancel' : '+ New category'}
                      </button>
                    </div>
                    {showAddCat && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: 'var(--accent-tint)', border: '1px solid var(--accent-border)', borderRadius: 12, marginTop: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>Add Category for {cfg.label}</span>
                        <input
                          type="text"
                          placeholder="Category name (e.g. Bakery, Pharmacy, Electrician)"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          style={{ minHeight: 42 }}
                        />
                        <input
                          type="text"
                          placeholder="Category name in Malayalam (optional)"
                          value={newCatMl}
                          onChange={(e) => setNewCatMl(e.target.value)}
                          style={{ minHeight: 42 }}
                        />
                        <button
                          type="button"
                          className="btn dark"
                          style={{ minHeight: 38, fontSize: 13 }}
                          disabled={catBusy || !newCatName.trim()}
                          onClick={() => handleCreateCategoryInline(f.name)}
                        >
                          {catBusy ? 'Saving category...' : 'Save & Select Category'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <input id={fid} type={f.type} value={values[f.name] || ''} onChange={set(f.name)} />
                )}
              </div>
            );
          })}
          {cfg.table !== 'categories' && (
            <>
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
            </>
          )}
          {msg ? <p className="error" role="alert">{msg}</p> : null}
          <button type="submit" className="btn dark big" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
          <button type="button" className="btn big" onClick={() => router.push(`/admin/${section}`)}>Cancel</button>
          <div className="note">Every save is recorded in the activity log with your name, the time and what changed.</div>
        </form>
      )}
    </div>
  );
}
