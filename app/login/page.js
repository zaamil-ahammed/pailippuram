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
    if (!password.trim()) {
      setMsg('Please enter your administrator password.');
      return;
    }

    setBusy(true);
    setMsg('');

    try {
      const adminEmail = email.trim() || 'kl58u8090@gmail.com';
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: password.trim(),
      });

      if (error || !data?.user) {
        setMsg(error?.message || 'Incorrect password. Only authorized administrators can access this panel.');
        setBusy(false);
      } else {
        router.push('/admin');
      }
    } catch (err) {
      console.error('[Login] Sign-in error:', err);
      setMsg('Authentication error. Please check your password.');
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <PageHeader title="Admin Sign In" back="/" backLabel="Home" />
      <main className="body" style={{ maxWidth: '440px', margin: '1.5rem auto' }}>
        <form
          onSubmit={signIn}
          className="card"
          style={{
            background: '#ffffff',
            border: '1.5px solid var(--card-border)',
            borderRadius: '20px',
            padding: '24px 20px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '32px' }}>🔒</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '8px 0 4px', color: 'var(--ink)' }}>
              Administrator Authentication
            </h2>
            <p className="muted small" style={{ margin: 0 }}>
              Enter your password to unlock the administrative dashboard.
            </p>
          </div>

          <div className="field" style={{ marginBottom: '14px' }}>
            <label htmlFor="e" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Admin Email / Username
            </label>
            <input
              id="e"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kl58u8090@gmail.com"
              disabled={busy}
              style={{ padding: '10px 12px' }}
            />
            <span className="small muted" style={{ fontSize: '0.78rem', marginTop: '3px' }}>
              Defaults to authorized administrator if left blank
            </span>
          </div>

          <div className="field" style={{ marginBottom: '18px' }}>
            <label htmlFor="p" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Admin Password *
            </label>
            <input
              id="p"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              required
              disabled={busy}
              autoFocus
              style={{ padding: '10px 12px' }}
            />
          </div>

          {msg ? (
            <div style={{
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              color: '#b91c1c',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}>
              ⚠️ {msg}
            </div>
          ) : null}

          <button
            type="submit"
            className="btn dark big"
            disabled={busy}
            style={{ width: '100%', marginBottom: '12px' }}
          >
            {busy ? 'Verifying Password...' : 'Sign In as Admin'}
          </button>

          <p className="muted small" style={{ margin: 0, textAlign: 'center', lineHeight: 1.4 }}>
            Only individuals with the authorized admin password can modify listings, announcements, bus schedules, or committee details.
          </p>
        </form>
      </main>
    </div>
  );
}
