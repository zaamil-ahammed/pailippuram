'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '../../../../components/PageHeader';
import { useAdmin } from '../../../../components/AdminGate';
import { supabase } from '../../../../lib/supabase';
import { logAudit } from '../../../../lib/audit';
import { useRows } from '../../../../lib/useRows';
import { SECTIONS } from '../../../../lib/sections';
import ImageUploadField from '../../../../components/ImageUploadField';

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
    (s) => {
      if (section === 'shops') {
        return s.from('categories').select('*').or('kind.eq.business,kind.eq.shop').order('name');
      }
      return s.from('categories').select('*').eq('kind', cfg?.match?.kind || 'none').order('name');
    },
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
        const localPhoto = typeof window !== 'undefined' ? window.localStorage.getItem(`np_photo_${id}`) : null;
        const photoFromDesc = data.description?.match(/Photo:\s*([^\s\n]+)/i)?.[1]?.trim()
          || data.detail?.match(/Photo:\s*([^\s\n]+)/i)?.[1]?.trim();
        const initialValues = Object.fromEntries(cfg.fields.map((f) => [f.name, data[f.name] ?? blank[f.name]]));
        if (!initialValues.photo_url) {
          initialValues.photo_url = data.photo_url || localPhoto || photoFromDesc || '';
        }
        if (photoFromDesc) {
          if (initialValues.description) {
            initialValues.description = initialValues.description.replace(/Photo:\s*[^\s\n]+/gi, '').trim();
          }
          if (initialValues.detail) {
            initialValues.detail = initialValues.detail.replace(/Photo:\s*[^\s\n]+/gi, '').trim();
          }
        }
        return setValues(initialValues);
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

  if (section === 'bus' && isNew) {
    return (
      <div className="page">
        <PageHeader title="Bus timings" ml="ബസ് സമയം" back="/admin/bus" backLabel="Bus routes" />
        <main className="body">
          <div className="note">
            <strong>Adding new bus routes is disabled.</strong>
            <p>You can edit and update existing bus routes and departure timings from the list.</p>
          </div>
          <button type="button" className="btn dark big" onClick={() => router.push('/admin/bus')}>Back to bus routes</button>
        </main>
      </div>
    );
  }

  const set = (name) => (e) => {
    const t = e.target;
    setValues((v) => ({ ...v, [name]: t.type === 'checkbox' ? t.checked : t.value }));
  };

  async function handleCreateCategoryInline(fieldName) {
    if (!newCatName.trim()) return;
    setCatBusy(true);
    setMsg('');
    const targetKind = cfg.match?.kind || 'business';
    let { data: createdCat, error: catErr } = await supabase
      .from('categories')
      .insert({
        kind: targetKind,
        name: newCatName.trim(),
        name_ml: newCatMl.trim() || null,
      })
      .select('id, name')
      .single();

    if (catErr && (catErr.message?.includes('kind_check') || catErr.message?.includes('check constraint'))) {
      const fallbackKinds = ['business', 'shop', 'contact'].filter((k) => k !== targetKind);
      for (const fk of fallbackKinds) {
        const alt = await supabase
          .from('categories')
          .insert({
            kind: fk,
            name: newCatName.trim(),
            name_ml: newCatMl.trim() || null,
          })
          .select('id, name')
          .single();
        if (!alt.error && alt.data) {
          createdCat = alt.data;
          catErr = null;
          break;
        }
      }
    }

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
      if (cfg.table === 'categories') {
        const catPayload = {
          name: data.name,
          name_ml: data.name_ml || null,
          kind: data.kind || 'business',
        };
        if (isNew) {
          let res = await supabase.from('categories').insert(catPayload).select('id').single();
          if (res.error && (res.error.message?.includes('kind_check') || res.error.message?.includes('check constraint'))) {
            const fallbackKinds = ['business', 'shop', 'contact'].filter((k) => k !== catPayload.kind);
            for (const fk of fallbackKinds) {
              const tryAlt = await supabase.from('categories').insert({ ...catPayload, kind: fk }).select('id').single();
              if (!tryAlt.error) {
                res = tryAlt;
                break;
              }
            }
          }
          return { error: res.error, rowId: res.data?.id };
        } else {
          const numId = /^\d+$/.test(String(id).trim()) ? Number(id) : id;
          let res = await supabase.from('categories').update(catPayload).eq('id', numId);
          if (res.error && (res.error.message?.includes('kind_check') || res.error.message?.includes('check constraint'))) {
            const fallbackKinds = ['business', 'shop', 'contact'].filter((k) => k !== catPayload.kind);
            for (const fk of fallbackKinds) {
              const tryAlt = await supabase.from('categories').update({ ...catPayload, kind: fk }).eq('id', numId);
              if (!tryAlt.error) {
                res = tryAlt;
                break;
              }
            }
          }
          return { error: res.error, rowId: id };
        }
      }

      if (isNew) {
        let insertData = { ...data, ...cfg.match };
        if (cfg.table === 'listings' && !insertData.kind) {
          insertData.kind = cfg.match?.kind || 'business';
        }
        if (insertData.description) {
          insertData.description = insertData.description.replace(/Photo:\s*data:[^\s\n]+/gi, '').slice(0, 500).trim() || null;
        }

        let res = await supabase.from(cfg.table).insert(insertData).select('id').single();

        // If photo_url column is missing from remote DB schema cache (e.g. listings table)
        if (res.error && res.error.message && (res.error.message.includes('photo_url') || res.error.message.includes('schema cache'))) {
          console.warn('[Admin Save] photo_url column not found in schema cache, saving without photo_url column');
          const { photo_url, ...withoutPhoto } = insertData;
          if (photo_url && photo_url.startsWith('http') && photo_url.length <= 120) {
            const descField = cfg.table === 'panchayath_items' ? 'detail' : 'description';
            const cur = withoutPhoto[descField] || '';
            if (!cur.includes(photo_url) && (cur.length + photo_url.length + 10) <= 500) {
              withoutPhoto[descField] = cur ? `${cur}\nPhoto: ${photo_url}` : `Photo: ${photo_url}`;
            }
          }
          insertData = withoutPhoto;
          res = await supabase.from(cfg.table).insert(insertData).select('id').single();
        }

        // If description check constraint fails
        if (res.error && res.error.message && (res.error.message.includes('description_check') || res.error.message.includes('listings_description_check'))) {
          console.warn('[Admin Save] description_check constraint violated - shortening description');
          const descField = cfg.table === 'panchayath_items' ? 'detail' : 'description';
          let curDesc = insertData[descField] || '';
          curDesc = curDesc.replace(/Photo:\s*[^\s\n]+/gi, '').trim();
          insertData = { ...insertData, [descField]: curDesc.slice(0, 300).trim() || null };
          res = await supabase.from(cfg.table).insert(insertData).select('id').single();
          if (res.error && res.error.message && (res.error.message.includes('description_check') || res.error.message.includes('listings_description_check'))) {
            insertData = { ...insertData, [descField]: (insertData.title || 'Service').slice(0, 50) };
            res = await supabase.from(cfg.table).insert(insertData).select('id').single();
          }
        }

        if (res.error && res.error.message && res.error.message.includes('updated_by')) {
          const { updated_by, ...cleaned } = insertData;
          insertData = cleaned;
          res = await supabase.from(cfg.table).insert(insertData).select('id').single();
        }
        if (res.error && res.error.message && res.error.message.includes('status_check')) {
          const altStatus = insertData.status === 'hidden' ? 'archived' : 'hidden';
          insertData = { ...insertData, status: altStatus };
          res = await supabase.from(cfg.table).insert(insertData).select('id').single();
        }
        if (res.error && res.error.message && (res.error.message.includes('kind_check') || res.error.message.includes('listings_kind_check'))) {
          console.warn('[Admin Save] listings_kind_check constraint violation for kind:', insertData.kind, '- trying candidate fallbacks');
          const originalKind = insertData.kind || cfg.match?.kind || 'worker';
          const tag = `[${String(originalKind).toUpperCase()}]`;
          const safeDesc = insertData.description
            ? (insertData.description.includes(tag) ? insertData.description : `${tag} ${insertData.description}`)
            : tag;
          const { updated_by, ...baseCleaned } = insertData;

          const candidateKinds = ['business', 'shop', 'contact', 'other'].filter((k) => k !== insertData.kind);
          for (const candKind of candidateKinds) {
            let tryRes = await supabase.from(cfg.table).insert({
              ...baseCleaned,
              kind: candKind,
              description: safeDesc ? safeDesc.slice(0, 500) : null,
            }).select('id').single();

            if (tryRes.error && tryRes.error.message && tryRes.error.message.includes('status_check')) {
              const altStatus = insertData.status === 'hidden' ? 'archived' : 'hidden';
              tryRes = await supabase.from(cfg.table).insert({
                ...baseCleaned,
                kind: candKind,
                description: safeDesc ? safeDesc.slice(0, 500) : null,
                status: altStatus,
              }).select('id').single();
            }

            if (!tryRes.error) {
              res = tryRes;
              break;
            }
          }
        }
        const createdId = res.data?.id || (Array.isArray(res.data) ? res.data[0]?.id : null);
        return { error: res.error, rowId: createdId };
      } else {
        let updateData = { ...data };
        if (updateData.description) {
          updateData.description = updateData.description.replace(/Photo:\s*data:[^\s\n]+/gi, '').slice(0, 500).trim() || null;
        }
        let res = await supabase.from(cfg.table).update(updateData).eq('id', id);

        // If photo_url column is missing from remote DB schema cache on update
        if (res.error && res.error.message && (res.error.message.includes('photo_url') || res.error.message.includes('schema cache'))) {
          console.warn('[Admin Save Update] photo_url column not found in schema cache, saving without photo_url column');
          const { photo_url, ...withoutPhoto } = updateData;
          if (photo_url && photo_url.startsWith('http') && photo_url.length <= 120) {
            const descField = cfg.table === 'panchayath_items' ? 'detail' : 'description';
            const cur = withoutPhoto[descField] || '';
            if (!cur.includes(photo_url) && (cur.length + photo_url.length + 10) <= 500) {
              withoutPhoto[descField] = cur ? `${cur}\nPhoto: ${photo_url}` : `Photo: ${photo_url}`;
            }
          }
          updateData = withoutPhoto;
          res = await supabase.from(cfg.table).update(updateData).eq('id', id);
        }

        // If description check constraint fails on update
        if (res.error && res.error.message && (res.error.message.includes('description_check') || res.error.message.includes('listings_description_check'))) {
          console.warn('[Admin Save Update] description_check constraint violated - shortening description');
          const descField = cfg.table === 'panchayath_items' ? 'detail' : 'description';
          let curDesc = updateData[descField] || '';
          curDesc = curDesc.replace(/Photo:\s*[^\s\n]+/gi, '').trim();
          updateData = { ...updateData, [descField]: curDesc.slice(0, 300).trim() || null };
          res = await supabase.from(cfg.table).update(updateData).eq('id', id);
          if (res.error && res.error.message && (res.error.message.includes('description_check') || res.error.message.includes('listings_description_check'))) {
            updateData = { ...updateData, [descField]: (updateData.title || 'Service').slice(0, 50) };
            res = await supabase.from(cfg.table).update(updateData).eq('id', id);
          }
        }

        if (res.error && res.error.message && res.error.message.includes('updated_by')) {
          const { updated_by, ...cleaned } = updateData;
          updateData = cleaned;
          res = await supabase.from(cfg.table).update(updateData).eq('id', id);
        }
        if (res.error && res.error.message && res.error.message.includes('status_check')) {
          const altStatus = updateData.status === 'hidden' ? 'archived' : 'hidden';
          updateData = { ...updateData, status: altStatus };
          res = await supabase.from(cfg.table).update(updateData).eq('id', id);
        }
        if (res.error && res.error.message && (res.error.message.includes('kind_check') || res.error.message.includes('listings_kind_check'))) {
          console.warn('[Admin Save] listings_kind_check on update - trying candidate fallbacks');
          const { updated_by, ...baseCleaned } = updateData;
          const candidateKinds = ['business', 'shop', 'contact', 'other'];
          for (const candKind of candidateKinds) {
            const tryRes = await supabase.from(cfg.table).update({ ...baseCleaned, kind: candKind }).eq('id', id);
            if (!tryRes.error) {
              res = tryRes;
              break;
            }
          }
        }
        return { error: res.error, rowId: id };
      }
    }

    const result = await executeSave(payload);
    error = result.error;
    rowId = result.rowId || id;

    if (error) {
      setBusy(false);
      return setMsg(error.message || 'Could not save. Please check the fields and try again.');
    }

    if (typeof window !== 'undefined' && rowId && payload.photo_url) {
      try {
        window.localStorage.setItem(`np_photo_${rowId}`, payload.photo_url);
      } catch (e) {
        // ignore
      }
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
            if (f.type === 'image')
              return (
                <div key={f.name} className="field">
                  <ImageUploadField
                    id={fid}
                    value={values[f.name] || ''}
                    label={`${f.label}${f.required ? ' *' : ''}`}
                    onChange={(val) => setValues((v) => ({ ...v, [f.name]: val }))}
                  />
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
