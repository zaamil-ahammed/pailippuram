'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '../../components/PageHeader';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMsg(error.message || 'Could not sign in. Check your email and password.');
    } else {
      window.location.href = '/admin';
    }
  }

  return (
    <div className="page">
      <PageHeader title="Admin sign in" />
      <form className="body" onSubmit={signIn}>
        <div className="field"><label htmlFor="e">Email</label><input id="e" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="field"><label htmlFor="p">Password</label><input id="p" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {msg ? <p className="error" role="alert">{msg}</p> : null}
        <button type="submit" className="btn dark big" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        <p className="muted small">Only people added as admins can use the admin area.</p>
      </form>
    </div>
  );
}
