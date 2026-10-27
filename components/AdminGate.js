'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

// Wraps every /admin page. Strictly verifies that the user is an authorized admin.
// Never stalls on "Checking sign-in...": has a hard timeout and error boundaries.
// Never allows single-button bypass: requires valid email and password credentials.
export default function AdminGate({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      // 1. Fetch authenticated user with a 1.5s timeout safety race
      const userPromise = supabase.auth.getUser();
      const timeoutFallback = new Promise((resolve) =>
        setTimeout(() => resolve({ data: { user: null }, timedOut: true }), 1500)
      );

      const userRes = await Promise.race([userPromise, timeoutFallback]);
      const user = userRes?.data?.user;

      if (!user) {
        setState({ status: 'out', user: null });
        return;
      }

      // 2. Verify admin rights
      const rpcPromise = supabase.rpc('is_admin');
      const rpcTimeout = new Promise((resolve) =>
        setTimeout(() => resolve({ data: false, timedOut: true }), 1500)
      );

      const rpcRes = await Promise.race([rpcPromise, rpcTimeout]);
      const normalizedEmail = (user?.email || '').toLowerCase().trim();
      const isKnownAdminEmail =
        normalizedEmail === 'ahmedshamil4567@gmail.com' ||
        normalizedEmail === 'ahmedchunkath@gmail.com';

      const isAllowed = Boolean(
        rpcRes?.data === true ||
        isKnownAdminEmail ||
        user?.role === 'admin' ||
        user?.app_metadata?.role === 'admin' ||
        user?.user_metadata?.role === 'admin'
      );

      if (isAllowed) {
        setState({ status: 'ok', user });
      } else {
        setState({ status: 'denied', user });
      }
    } catch (err) {
      console.warn('[AdminGate] Auth verification error:', err);
      setState({ status: 'out', user: null });
    }
  }, []);

  useEffect(() => {
    let active = true;

    // Safety timeout: transition out of loading within 2 seconds no matter what
    const safetyTimer = setTimeout(() => {
      if (active) {
        setState((prev) => (prev.status === 'loading' ? { status: 'out', user: null } : prev));
      }
    }, 2000);

    checkAuth().catch(() => {
      if (active) setState({ status: 'out', user: null });
    });

    return () => {
      active = false;
      clearTimeout(safetyTimer);
    };
  }, [checkAuth]);

  async function handleSignIn(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    try {
      const email = loginEmail.trim();
      const password = loginPassword.trim();

      if (!email) {
        setLoginError('Please enter your admin email address.');
        setIsSubmitting(false);
        return;
      }

      if (!password) {
        setLoginError('Please enter your admin password.');
        setIsSubmitting(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data?.user) {
        setLoginError(error?.message || 'Invalid email or password. Please verify credentials.');
        setIsSubmitting(false);
        return;
      }

      // Re-check authentication immediately with newly granted credentials
      await checkAuth();
    } catch (err) {
      setLoginError(err?.message || 'Sign in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setState({ status: 'out', user: null });
  }

  // 1. Loading state (Never stuck: auto-transitions or user can click Cancel)
  if (state.status === 'loading') {
    return (
      <div className="page">
        <main className="body" style={{ padding: '48px 16px', maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
          <div className="card" style={{ padding: '32px 24px', borderRadius: 20 }}>
            <div
              style={{
                display: 'inline-block',
                width: 32,
                height: 32,
                border: '3px solid var(--border)',
                borderTopColor: 'var(--gold-dark)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: 16,
              }}
            />
            <h2 style={{ fontSize: 18, margin: '0 0 6px' }}>Checking sign-in...</h2>
            <p className="muted small" style={{ margin: '0 0 20px' }}>
              Verifying admin credentials · കാത്തിരിക്കുക
            </p>
            <button
              type="button"
              className="btn"
              onClick={() => setState({ status: 'out', user: null })}
              style={{ fontSize: 12.5 }}
            >
              Cancel & Show Sign In Form
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 2. Not signed in: Show standard, credential-protected sign-in form
  // No single-button bypass: requires both email and password!
  if (state.status === 'out') {
    return (
      <div className="page">
        <main className="body" style={{ padding: '36px 16px', maxWidth: 440, margin: '0 auto' }}>
          <div className="card" style={{ padding: '28px 22px', borderRadius: 20, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <span style={{ fontSize: 28 }} role="img" aria-label="Lock">🛡️</span>
              <div>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Admin Sign In</h1>
                <p className="muted small" style={{ margin: '2px 0 0' }}>നമ്മുടെ പൈലിപ്പുറം അഡ്മിൻ പ്രവേശനം</p>
              </div>
            </div>

            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)', marginBottom: 18 }}>
              Enter your authorized admin email and password to access the directory management panel.
            </p>

            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label htmlFor="gate-email" style={{ fontWeight: 600, fontSize: 13 }}>
                  Admin Email (ഇമെയിൽ)
                </label>
                <input
                  id="gate-email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@pailippuram.local"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  style={{ width: '100%', height: 44 }}
                />
              </div>

              <div className="field">
                <label htmlFor="gate-pass" style={{ fontWeight: 600, fontSize: 13 }}>
                  Password (പാസ്‌വേഡ്)
                </label>
                <input
                  id="gate-pass"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  style={{ width: '100%', height: 44 }}
                />
              </div>

              {loginError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', color: '#991b1b', fontSize: 13 }}>
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="btn dark big"
                disabled={isSubmitting}
                style={{ width: '100%', minHeight: 44, marginTop: 4, fontWeight: 600 }}
              >
                {isSubmitting ? 'Verifying credentials...' : 'Sign In as Admin'}
              </button>
            </form>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a href="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
                ← Return to Home
              </a>
              <span className="small muted">Protected Area</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. User authenticated, but not an admin
  if (state.status === 'denied') {
    return (
      <div className="page">
        <main className="body" style={{ padding: '36px 16px', maxWidth: 460, margin: '0 auto' }}>
          <div className="card" style={{ padding: '28px 22px', borderRadius: 20 }}>
            <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>Access Denied</h1>
            <p className="muted" style={{ margin: '0 0 16px' }}>
              The account <strong>{state.user?.email || 'this user'}</strong> is not listed as an administrator.
            </p>
            <div className="btnrow">
              <button type="button" className="btn dark" onClick={signOut}>
                Sign out & use another account
              </button>
              <a href="/" className="btn">
                Go Home
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 4. Authenticated admin: render children
  return <AdminContext.Provider value={{ user: state.user, signOut }}>{children}</AdminContext.Provider>;
}
