'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

// Wraps every /admin page. Shows the page ONLY to a signed-in admin with valid password authentication.
export default function AdminGate({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });
  const [passwordInput, setPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkExistingSession() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!active) return;

        if (error || !data?.user) {
          // No active verified session. Prompt for password.
          setState({ status: 'out', user: null });
          return;
        }

        // Check is_admin RPC if remote database has it
        try {
          const { data: ok, error: rpcErr } = await supabase.rpc('is_admin');
          if (!active) return;
          if (!rpcErr && ok === false) {
            setState({ status: 'denied', user: data.user });
            return;
          }
        } catch {
          // RPC not configured; verified user session is accepted
        }

        setState({ status: 'ok', user: data.user });
      } catch (err) {
        console.warn('[AdminGate] Verification error:', err);
        if (active) {
          setState({ status: 'out', user: null });
        }
      }
    }

    checkExistingSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleInlineSignIn(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!passwordInput.trim()) {
      setAuthError('Please enter the administrator password.');
      return;
    }

    setVerifying(true);
    setAuthError('');

    try {
      const email = emailInput.trim() || 'kl58u8090@gmail.com';
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: passwordInput.trim(),
      });

      if (error || !data?.user) {
        setAuthError(error?.message || 'Incorrect password. Access denied.');
        setVerifying(false);
        return;
      }

      setState({ status: 'ok', user: data.user });
      setPasswordInput('');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setState({ status: 'out', user: null });
    setPasswordInput('');
  }

  if (state.status === 'loading') {
    return (
      <div className="page">
        <main className="body" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', maxWidth: '420px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            width: '32px',
            height: '32px',
            border: '3px solid rgba(15, 23, 42, 0.1)',
            borderTopColor: '#059669',
            borderRadius: '50%',
            animation: 'adminGateSpin 0.75s linear infinite',
            marginBottom: '1.25rem',
          }} />
          <style>{`@keyframes adminGateSpin { to { transform: rotate(360deg); } }`}</style>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
            Checking administrator session...
          </h2>
          <p className="muted" style={{ fontSize: '0.875rem' }}>
            Verifying secure credentials
          </p>
        </main>
      </div>
    );
  }

  // Shown when not logged in or on a new device. Strictly requires password.
  if (state.status === 'out') {
    return (
      <div className="page">
        <main className="body" style={{ maxWidth: '440px', margin: '2.5rem auto', padding: '1.75rem 1.25rem' }}>
          <div style={{
            background: '#ffffff',
            border: '1.5px solid var(--card-border)',
            borderRadius: '20px',
            padding: '24px 20px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: '#fef3c7',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 16px',
            }}>
              🔒
            </div>

            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--ink)' }}>
              Admin Panel Access
            </h1>
            <p className="muted" style={{ fontSize: '0.88rem', margin: '0 0 20px', lineHeight: 1.5 }}>
              This section is restricted. Only authorized administrators with the password can enter.
            </p>

            <form onSubmit={handleInlineSignIn} style={{ textAlign: 'left' }}>
              <div className="field" style={{ marginBottom: '12px' }}>
                <label htmlFor="admin-email" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Admin Email / Username (Optional)
                </label>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="kl58u8090@gmail.com"
                  disabled={verifying}
                  style={{ width: '100%', fontSize: '0.9rem', padding: '10px 12px' }}
                />
              </div>

              <div className="field" style={{ marginBottom: '16px' }}>
                <label htmlFor="admin-gate-pass" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Admin Password *
                </label>
                <input
                  id="admin-gate-pass"
                  type="password"
                  autoComplete="current-password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter administrator password..."
                  required
                  disabled={verifying}
                  autoFocus
                  style={{ width: '100%', fontSize: '0.9rem', padding: '10px 12px' }}
                />
              </div>

              {authError ? (
                <div style={{
                  padding: '10px 12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  color: '#b91c1c',
                  fontSize: '0.85rem',
                  marginBottom: '14px',
                  lineHeight: 1.4,
                }}>
                  ⚠️ {authError}
                </div>
              ) : null}

              <button
                type="submit"
                className="btn dark big"
                disabled={verifying}
                style={{ width: '100%', marginBottom: '10px' }}
              >
                {verifying ? 'Verifying Password...' : 'Sign In with Password'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <Link href="/" className="small muted" style={{ textDecoration: 'none' }}>
                  ← Return to Public Site
                </Link>
                <Link href="/login" className="small" style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>
                  Full Sign-In Page
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  if (state.status === 'denied') {
    return (
      <div className="page">
        <main className="body" style={{ maxWidth: '420px', margin: '2rem auto', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🚫</div>
          <h1 style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>Access Denied</h1>
          <p className="muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            The signed-in account is not authorized as an administrator.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button type="button" className="btn dark" onClick={signOut}>
              Sign out
            </button>
            <Link className="btn" href="/login" style={{ width: '100%', display: 'block', textAlign: 'center' }}>
              Sign in with password
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ user: state.user, signOut }}>
      {children}
    </AdminContext.Provider>
  );
}
