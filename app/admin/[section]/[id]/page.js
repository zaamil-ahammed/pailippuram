'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '../../../../components/PageHeader';
import { useAdmin } from '../../../../components/AdminGate';
import { supabase, extractAllPhones, isPinnedAnnouncement, cleanAnnouncementBody, cleanAnnouncementTitle } from '../../../../lib/supabase';
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
  const [extraPhones, setExtraPhones] = useState([]);
  const [status, setStatus] = useState('approved');
  const [verify, setVerify] = useState(false);
  const [note, setNote] = useState('');
  const [fromId, setFromId] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const addExtraPhone = () => {
    if (extraPhones.length < 3) {
      setExtraPhones((prev) => [...prev, '']);
    }
  };

  const updateExtraPhone = (idx, val) => {
    setExtraPhones((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const removeExtraPhone = (idx) => {
    setExtraPhones((prev) => prev.filter((_, i) => i !== idx));
  };

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
        const allNums = extractAllPhones(data);
        if (allNums.length > 1) {
          setExtraPhones(allNums.slice(1));
        } else {
          setExtraPhones([]);
        }
        const cleanPhone = allNums[0] || data.phone || '';
        if (cfg.table === 'announcements') {
          const isPinned = isPinnedAnnouncement(data);
          const cleanBody = cleanAnnouncementBody(data.body);
          const cleanTitle = cleanAnnouncementTitle(data.title);
          return setValues({
            ...blank,
            title: cleanTitle,
            pinned: isPinned,
            event_date: data.event_date || '',
            body: cleanBody,
          });
        }
        return setValues(Object.fromEntries(cfg.fields.map((f) => [f.name, f.name === 'phone' ? cleanPhone : (data[f.name] ?? blank[f.name])])));
      }
      const from = new URLSearchParams(window.location.search).get('from');
      if (from) {
        const { data } = await supabase.from('submissions').select('*').eq('id', from).maybeSingle();
        if (data) {
          setFromId(from);
          const allNums = extractAllPhones(data);
          if (allNums.length > 1) {
            setExtraPhones(allNums.slice(1));
          } else {
            setExtraPhones([]);
          }
          const pre = cfg.fromSubmission(data);
          if (cfg.table === 'announcements') {
            const cleanBody = cleanAnnouncementBody(data.description);
            const cleanTitle = cleanAnnouncementTitle(data.title);
            return setValues({
              ...blank,
              title: cleanTitle,
              pinned: false,
              event_date: pre.event_date || '',
              body: cleanBody,
            });
          }
          const cleanPhone = allNums[0] || pre.phone || '';
          return setValues({ ...blank, ...Object.fromEntries(Object.entries(pre).filter(([, v]) => v != null)), phone: cleanPhone });
        }
      }
      setExtraPhones([]);
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

    // Process and safeguard phone numbers
    const cleanExtra = extraPhones.map((p) => p.trim()).filter(Boolean);
    let primaryPhone = payload.phone ? payload.phone.trim() : null;
    if (primaryPhone) {
      const splitNums = primaryPhone.split(/[,/;\n]/).map((p) => p.trim()).filter(Boolean);
      if (splitNums.length > 1) {
        primaryPhone = splitNums[0];
        for (let i = 1; i < splitNums.length; i++) {
          if (!cleanExtra.includes(splitNums[i])) {
            cleanExtra.push(splitNums[i]);
          }
        }
      }
    }
    // Limit primary phone to 20 chars to prevent phone_check constraint failure
    payload.phone = primaryPhone ? primaryPhone.slice(0, 20) : null;

    if (cfg.table === 'listings') {
      let desc = payload.description || '';
      desc = desc.replace(/(?:\n|^)(?:Alt(?:\s*Phones?|\s*Numbers?)?|Additional\s*Phones?|Phone\s*2|Ph\s*2):\s*[^\n]+/gi, '').trim();
      if (cleanExtra.length > 0) {
        const altText = `Alt Phones: ${cleanExtra.join(', ')}`;
        desc = desc ? `${desc}\n${altText}` : altText;
      }
      payload.description = desc ? desc.slice(0, 1500) : null;
    } else if (cfg.table === 'donors') {
      let areaStr = payload.area || '';
      areaStr = areaStr.replace(/(?:·|\s)*Alt:\s*[+0-9\s,-]+/gi, '').trim();
      if (cleanExtra.length > 0) {
        const altText = `Alt: ${cleanExtra.join(', ')}`;
        areaStr = areaStr ? `${areaStr} · ${altText}` : altText;
      }
      payload.area = areaStr ? areaStr.slice(0, 80) : null;
    }

    let effectiveStatus = status;
    if (cfg.table === 'listings' && status === 'hidden') {
      effectiveStatus = 'archived';
    }
    payload.status = effectiveStatus;
    if (cfg.table === 'announcements') {
      const isPinned = Boolean(payload.pinned);
      delete payload.pinned;
      let bodyText = cleanAnnouncementBody(payload.body || '');
      if (isPinned) {
        bodyText = `[PINNED]\n${bodyText}`;
      }
      payload.body = bodyText || payload.title || 'Details';
    }
    if (user?.id) payload.updated_by = user.id;
    if (cfg.verify && verify) payload.verified_at = new Date().toISOString();

    setBusy(true);
    let rowId = id;
    let error;

    async function executeSave(data) {
      if (isNew) {
        let res = await supabase.from(cfg.table).insert({ ...data, ...cfg.match }).select('id').single();
        if (res.error && res.error.message && res.error.message.includes('updated_by')) {
          const { updated_by, ...cleaned } = data;
          res = await supabase.from(cfg.table).insert({ ...cleaned, ...cfg.match }).select('id').single();
        }
        if (res.error && res.error.message && res.error.message.includes('phone_check')) {
          const { updated_by, ...cleaned } = data;
          const safePhone = (data.phone || '').slice(0, 15) || null;
          res = await supabase.from(cfg.table).insert({ ...cleaned, ...cfg.match, phone: safePhone }).select('id').single();
        }
        if (res.error && res.error.message && res.error.message.includes('status_check')) {
          const altStatus = data.status === 'hidden' ? 'archived' : 'hidden';
          const { updated_by, ...cleaned } = data;
          res = await supabase.from(cfg.table).insert({ ...cleaned, ...cfg.match, status: altStatus }).select('id').single();
        }
        if (res.error && cfg.match?.kind === 'transport') {
          const { updated_by, ...cleaned } = data;
          const fallbackRes = await supabase.from(cfg.table).insert({ ...cleaned, kind: 'worker' }).select('id').single();
          if (!fallbackRes.error) {
            return { error: null, rowId: fallbackRes.data?.id };
          }
        }
        return { error: res.error, rowId: res.data?.id };
      } else {
        let res = await supabase.from(cfg.table).update(data).eq('id', id);
        if (res.error && res.error.message && res.error.message.includes('updated_by')) {
          const { updated_by, ...cleaned } = data;
          res = await supabase.from(cfg.table).update(cleaned).eq('id', id);
        }
        if (res.error && res.error.message && res.error.message.includes('phone_check')) {
          const { updated_by, ...cleaned } = data;
          const safePhone = (data.phone || '').slice(0, 15) || null;
          res = await supabase.from(cfg.table).update({ ...cleaned, phone: safePhone }).eq('id', id);
        }
        if (res.error && res.error.message && res.error.message.includes('status_check')) {
          const altStatus = data.status === 'hidden' ? 'archived' : 'hidden';
          const { updated_by, ...cleaned } = data;
          res = await supabase.from(cfg.table).update({ ...cleaned, status: altStatus }).eq('id', id);
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
      let { error: subErr } = await supabase.from('submissions').update({ status: 'approved' }).eq('id', fromId);
      if (subErr && subErr.message && subErr.message.includes('status_check')) {
        await supabase.from('submissions').update({ status: 'approved' }).eq('id', fromId);
      }
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
                {f.name === 'phone' ? (
                  <div style={{ marginTop: 8 }}>
                    {extraPhones.map((p, idx) => (
                      <div key={idx} style={{ marginTop: 8, padding: '10px 12px', background: 'var(--card-bg, #f8fafc)', border: '1px solid var(--card-border, #e2e8f0)', borderRadius: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <label htmlFor={`extra-p-${idx}`} style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                            Additional Phone {idx + 2} / രണ്ടാമത്തെ നമ്പർ
                          </label>
                          <button
                            type="button"
                            onClick={() => removeExtraPhone(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#dc2626',
                              fontSize: 12.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: '2px 6px',
                            }}
                          >
                            ✕ Remove
                          </button>
                        </div>
                        <input
                          id={`extra-p-${idx}`}
                          type="tel"
                          maxLength={20}
                          placeholder={`Additional phone number ${idx + 2}`}
                          value={p}
                          onChange={(e) => updateExtraPhone(idx, e.target.value)}
                        />
                      </div>
                    ))}
                    {extraPhones.length < 3 && (
                      <button
                        type="button"
                        className="btn light"
                        onClick={addExtraPhone}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 14px',
                          minHeight: 36,
                          fontSize: 13,
                          borderRadius: 10,
                          cursor: 'pointer',
                          marginTop: 6,
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        + Add another phone number · മറ്റൊരു നമ്പർ ചേർക്കുക
                      </button>
                    )}
                  </div>
                ) : null}
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
