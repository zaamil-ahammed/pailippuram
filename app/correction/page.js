'use client';
import { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { sendSubmission } from '../../lib/submit';

const KINDS = [
  { value: 'correct', label: 'Correct wrong information' },
  { value: 'remove', label: 'Remove my details' },
  { value: 'closed', label: 'Closed or moved' },
  { value: 'other', label: 'Something else' },
];

export default function Correction() {
  const [kind, setKind] = useState('correct');
  const [owner, setOwner] = useState(true);
  const [f, setF] = useState({ listing: '', wrong: '', instead: '', contact: '', website: '' });
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    if (f.website) return setDone(true);
    if (f.listing.trim().length < 2) return setMsg('Please tell us which listing or page.');
    setBusy(true);
    const label = KINDS.find((k) => k.value === kind).label;
    const description = [
      `Request: ${label}`,
      `Own details/listing: ${owner ? 'Yes' : 'No'}`,
      f.wrong.trim() && `What is wrong: ${f.wrong.trim()}`,
      f.instead.trim() && `Should say: ${f.instead.trim()}`,
    ].filter(Boolean).join('\n');
    const err = await sendSubmission({
      type: kind === 'remove' ? 'removal' : 'correction',
      title: f.listing.trim(),
      description: description.slice(0, 1500),
      submitter_contact: f.contact.trim() || null,
      consent: false,
    });
    setBusy(false);
    if (err) setMsg(err);
    else setDone(true);
  }

  if (done) {
    return (
      <div className="page">
        <PageHeader title="Request received" ml="നന്ദി" />
        <main className="body">
          <p>Thank you. An admin will look at it. We aim to respond within 48 hours.</p>
          <a className="btn dark" href="/">Back to home</a>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title="Request a correction or removal" ml="തിരുത്തലിനോ നീക്കം ചെയ്യാനോ" />
      <form className="body" onSubmit={submit}>
        <div className="note">
          Use this if something on the site is wrong or out of date, or if you want your details taken down.{' '}
          <strong>Removal requests about personal details are handled first.</strong>
        </div>
        <div className="label">What do you need?</div>
        <div className="chips">
          {KINDS.map((k) => (
            <button key={k.value} type="button" className={`chip ${kind === k.value ? 'on' : ''}`} onClick={() => setKind(k.value)}>{k.label}</button>
          ))}
        </div>
        <div className="field"><label htmlFor="l">Which listing or page?</label><input id="l" type="text" maxLength={120} placeholder="Name of the listing, or paste its page address" value={f.listing} onChange={set('listing')} /></div>
        <div className="field"><label htmlFor="w">What is wrong?</label><textarea id="w" maxLength={600} value={f.wrong} onChange={set('wrong')} /></div>
        <div className="field"><label htmlFor="r">What should it say instead? <span className="muted small">(optional)</span></label><textarea id="r" maxLength={600} value={f.instead} onChange={set('instead')} /></div>
        <div className="label">Is this your own listing or your own details?</div>
        <div className="btnrow">
          <button type="button" className={`btn ${owner ? 'dark' : ''}`} onClick={() => setOwner(true)}>Yes</button>
          <button type="button" className={`btn ${!owner ? 'dark' : ''}`} onClick={() => setOwner(false)}>No</button>
        </div>
        <div className="field"><label htmlFor="yc">Your contact <span className="muted small">(optional, private, never shown)</span></label><input id="yc" type="text" maxLength={120} placeholder="Phone or email, so we can reply" value={f.contact} onChange={set('contact')} /></div>
        <div className="hp" aria-hidden="true"><label htmlFor="hp">Leave this empty</label><input id="hp" type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></div>
        <div className="note">If you ask to remove your own details, adding a contact helps us confirm it is really you. We use it only to answer this request.</div>
        {msg ? <p className="error" role="alert">{msg}</p> : null}
        <button type="submit" className="btn dark big" disabled={busy}>{busy ? 'Sending...' : 'Send request'}</button>
        <h2>What happens next</h2>
        <div className="steps">
          <div className="step"><b>1</b><span>An admin reads your request and checks it.</span></div>
          <div className="step"><b>2</b><span>The listing is corrected, marked outdated, or removed from the public site.</span></div>
          <div className="step"><b>3</b><span>If you left a contact, we tell you what was done. We aim to respond within 48 hours.</span></div>
        </div>
      </form>
    </div>
  );
}
