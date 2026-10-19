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
    if (e && e.preventDefault) e.preventDefault();
    setBusy(true);
    setMsg('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setMsg(error.message || 'Could not sign in with provided credentials.');
        setBusy(false);
      } else {
        // Only redirect if authentication is genuinely successful
        router.push('/admin');
      }
    } catch (err) {
      console.error('[Login] Sign-in error:', err);
      setMsg('An unexpected network error occurred.');
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <PageHeader title="Admin sign in" />
      <form className="body" onSubmit={signIn}>
        <div className="field">
          <label htmlFor="e">Email</label>
          <input
            id="e"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@pailippuram.local"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="p">Password</label>
          <input
            id="p"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        
        {msg ? <p className="error" role="alert">{msg}</p> : null}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="submit" className="btn dark big" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
        
        <p className="muted small" style={{ marginTop: '1rem' }}>
          Authorized administrators can manage listings, announcements, buses, donors, panchayath details, and Victory club members.
        </p>
      </form>
    </div>
  );
}
