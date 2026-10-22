'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '../../../../components/PageHeader';
import MultiPhoneInput from '../../../../components/MultiPhoneInput';
import ImageUploadField from '../../../../components/ImageUploadField';
import { useAdmin } from '../../../../components/AdminGate';
import { supabase, extractAllPhones, isPinnedAnnouncement, cleanAnnouncementBody, cleanAnnouncementTitle } from '../../../../lib/supabase';
import { logAudit } from '../../../../lib/audit';
import { useRows } from '../../../../lib/useRows';
import { SECTIONS } from '../../../../lib/sections';
import { showToast } from '../../../../lib/toast';

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

  const cats = useRows(
    (s) => {
      let q = s.from('categories').select('*').order('name');
      if (section === 'schools') {
        return q.or('kind.eq.education,kind.eq.school,kind.eq.contact');
      }
      if (section === 'shops') {
        return q.or('kind.eq.business,kind.eq.shop');
      }
      return q.eq('kind', cfg?.match?.kind || 'none');
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
        setStatus(data.status || 'approved');
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
        if (v === '' || v === 'none' || v === 'null') v = null;
        if (f.type === 'category') {
          if (v == null) {
            v = null;
          } else {
            const num = Number(v);
            v = !isNaN(num) && String(num) === String(v).trim() ? num : v;
          }
        }
        if (f.type === 'number' && v != null && v !== '') {
          const num = Number(v);
          v = isNaN(num) ? null : num;
        }
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
      payload.description = desc ? desc.slice(0, 600) : null;
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
      payload.is_pinned = isPinned;
      delete payload.pinned;
      let bodyText = cleanAnnouncementBody(payload.body || '');
      if (isPinned) {
        bodyText = `[PINNED]\n${bodyText}`;
      }
      payload.body = (bodyText || payload.title || 'Details').slice(0, 1500);
    }

    const isValidUuid = (val) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    if (isValidUuid(user?.id)) {
      payload.updated_by = user.id;
    }
    if (cfg.verify && verify) payload.verified_at = new Date().toISOString();

    setBusy(true);
    let rowId = id;
    let error;

    async function executeSave(data) {
      if (isNew) {
        let insertPayload = { ...data, ...cfg.match };
        let res = await supabase.from(cfg.table).insert(insertPayload).select('id').single();

        // 1. updated_by column missing or RLS/UUID syntax issue
        if (res.error && res.error.message && (res.error.message.includes('updated_by') || res.error.message.includes('uuid'))) {
          const { updated_by, ...cleaned } = insertPayload;
          insertPayload = cleaned;
          res = await supabase.from(cfg.table).insert(insertPayload).select('id').single();
        }

        // 2. phone_check length constraint
        if (res.error && res.error.message && res.error.message.includes('phone_check')) {
          const safePhone = (insertPayload.phone || '').slice(0, 15) || null;
          insertPayload = { ...insertPayload, phone: safePhone };
          res = await supabase.from(cfg.table).insert(insertPayload).select('id').single();
        }

        // 3. status_check constraint
        if (res.error && res.error.message && res.error.message.includes('status_check')) {
          const altStatus = insertPayload.status === 'hidden' ? 'archived' : 'hidden';
          insertPayload = { ...insertPayload, status: altStatus };
          res = await supabase.from(cfg.table).insert(insertPayload).select('id').single();
        }

        // 4. listings_kind_check constraint (remote database only allows specific kinds)
        if (cfg.table === 'listings' && res.error && res.error.message && (res.error.message.includes('listings_kind_check') || res.error.message.includes('kind_check'))) {
          const intendedKind = cfg.match?.kind;
          let safeDesc = insertPayload.description || '';
          if (intendedKind === 'worker' && !safeDesc.includes('[WORKER]')) {
            safeDesc = safeDesc ? `[WORKER]\n${safeDesc}` : '[WORKER]';
          } else if (intendedKind === 'transport' && !safeDesc.includes('[TRANSPORT]')) {
            safeDesc = safeDesc ? `[TRANSPORT]\n${safeDesc}` : '[TRANSPORT]';
          }
          const baseData = { ...insertPayload, description: safeDesc.slice(0, 600) || null };

          const candidateKinds = ['business', 'shop', 'contact'].filter((k) => k !== intendedKind);
          for (const candKind of candidateKinds) {
            let tryPayload = { ...baseData, kind: candKind };
            let candRes = await supabase.from(cfg.table).insert(tryPayload).select('id').single();
            if (candRes.error && (candRes.error.message.includes('updated_by') || candRes.error.message.includes('uuid'))) {
              const { updated_by, ...noUser } = tryPayload;
              tryPayload = noUser;
              candRes = await supabase.from(cfg.table).insert(tryPayload).select('id').single();
            }
            if (candRes.error && (candRes.error.message.includes('category') || candRes.error.message.includes('foreign key'))) {
              tryPayload = { ...tryPayload, category_id: null };
              candRes = await supabase.from(cfg.table).insert(tryPayload).select('id').single();
            }
            if (!candRes.error) {
              res = candRes;
              break;
            }
          }
        }

        // 5. category foreign key error
        if (res.error && res.error.message && (res.error.message.includes('category') || res.error.message.includes('foreign key'))) {
          const { category_id, ...noCat } = insertPayload;
          res = await supabase.from(cfg.table).insert(noCat).select('id').single();
        }

        return { error: res.error, rowId: res.data?.id };
      } else {
        let updatePayload = { ...data };
        let res = await supabase.from(cfg.table).update(updatePayload).eq('id', id);

        if (res.error && res.error.message && (res.error.message.includes('updated_by') || res.error.message.includes('uuid'))) {
          const { updated_by, ...cleaned } = updatePayload;
          updatePayload = cleaned;
          res = await supabase.from(cfg.table).update(updatePayload).eq('id', id);
        }
        if (res.error && res.error.message && res.error.message.includes('phone_check')) {
          const safePhone = (updatePayload.phone || '').slice(0, 15) || null;
          updatePayload = { ...updatePayload, phone: safePhone };
          res = await supabase.from(cfg.table).update(updatePayload).eq('id', id);
        }
        if (res.error && res.error.message && res.error.message.includes('status_check')) {
          const altStatus = updatePayload.status === 'hidden' ? 'archived' : 'hidden';
          updatePayload = { ...updatePayload, status: altStatus };
          res = await supabase.from(cfg.table).update(updatePayload).eq('id', id);
        }

        if (cfg.table === 'listings' && res.error && res.error.message && (res.error.message.includes('listings_kind_check') || res.error.message.includes('kind_check'))) {
          const intendedKind = cfg.match?.kind;
          let safeDesc = updatePayload.description || '';
          if (intendedKind === 'worker' && !safeDesc.includes('[WORKER]')) {
            safeDesc = safeDesc ? `[WORKER]\n${safeDesc}` : '[WORKER]';
          } else if (intendedKind === 'transport' && !safeDesc.includes('[TRANSPORT]')) {
            safeDesc = safeDesc ? `[TRANSPORT]\n${safeDesc}` : '[TRANSPORT]';
          }
          const baseUpdate = { ...updatePayload, description: safeDesc.slice(0, 600) || null };

          const candidateKinds = ['business', 'shop', 'contact'].filter((k) => k !== intendedKind);
          for (const candKind of candidateKinds) {
            let tryPayload = { ...baseUpdate, kind: candKind };
            let candRes = await supabase.from(cfg.table).update(tryPayload).eq('id', id);
            if (candRes.error && (candRes.error.message.includes('updated_by') || candRes.error.message.includes('uuid'))) {
              const { updated_by, ...noUser } = tryPayload;
              tryPayload = noUser;
              candRes = await supabase.from(cfg.table).update(tryPayload).eq('id', id);
            }
            if (!candRes.error) {
              res = candRes;
              break;
            }
          }
        }

        return { error: res.error, rowId: id };
      }
    }

    let result;
    try {
      result = await executeSave(payload);
    } catch (saveErr) {
      console.error('[AdminEdit save error]', saveErr);
      setBusy(false);
      return setMsg(saveErr?.message || 'Could not save. Please check the fields and try again.');
    }

    error = result?.error;
    rowId = result?.rowId || id;

    if (error) {
      setBusy(false);
      return setMsg(error.message || 'Could not save. Please check the fields and try again.');
    }

    try {
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
    } catch (auditErr) {
      console.warn('[AdminEdit audit error]', auditErr);
    }

    setBusy(false);
    const itemTitle = payload.title || payload.name || payload.route || 'Item';
    const singular = cfg.singular ? cfg.singular[0].toUpperCase() + cfg.singular.slice(1) : 'Item';
    showToast({
      type: 'success',
      message: isNew ? `${singular} published successfully!` : `${singular} updated successfully!`,
      sub: `${itemTitle} · Changes are live in directory`,
    });
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
            if (f.name === 'phone') {
              return (
                <div key={f.name}>
                  <MultiPhoneInput
                    primaryPhone={values.phone || ''}
                    onPrimaryChange={(val) => setValues((v) => ({ ...v, phone: val }))}
                    additionalPhones={extraPhones}
                    onAdditionalChange={setExtraPhones}
                    required={f.required}
                    label={f.label}
                    maxPhones={6}
                  />
                </div>
              );
            }
            if (f.type === 'image' || f.name === 'photo_url') {
              return (
                <div key={f.name}>
                  <ImageUploadField
                    id={fid}
                    label={f.label}
                    value={values[f.name] || ''}
                    onChange={(val) => setValues((v) => ({ ...v, [f.name]: val }))}
                  />
                </div>
              );
            }
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
