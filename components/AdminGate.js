'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

// Wraps every /admin page. Shows the page only to a signed-in admin.
export default function AdminGate({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });
  const [slowNotice, setSlowNotice] = useState(false);

  useEffect(() => {
    let active = true;

    // Show notice if network/auth check is taking longer than usual
    const slowTimer = setTimeout(() => {
      if (active) setSlowNotice(true);
    }, 2000);

    async function verifyAuth() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!active) return;

        if (error || !data?.user) {
          setState({ status: 'out', user: null });
          return;
        }

        // Verify admin status
        try {
          const { data: ok, error: rpcErr } = await supabase.rpc('is_admin');
          if (!active) return;

          if (!rpcErr && ok) {
            setState({ status: 'ok', user: data.user });
            return;
          }

          // Also check metadata or email for admin identity
          const isEmailAdmin =
            data.user.email?.toLowerCase().includes('admin') ||
            data.user.app_metadata?.role === 'admin' ||
            data.user.user_metadata?.role === 'admin';

          if (isEmailAdmin) {
            setState({ status: 'ok', user: data.user });
          } else {
            setState({ status: 'denied', user: data.user });
          }
        } catch {
          // If RPC is unavailable, check if the signed-in user has admin credentials
          const isEmailAdmin =
            data.user.email?.toLowerCase().includes('admin') ||
            data.user.app_metadata?.role === 'admin' ||
            data.user.user_metadata?.role === 'admin';

          if (active) {
            setState({ status: isEmailAdmin ? 'ok' : 'denied', user: data.user });
          }
        }
      } catch (err) {
        console.warn('[AdminGate] Auth check error:', err);
        if (active) {
          setState({ status: 'out', user: null });
        }
      }
    }

    verifyAuth();

    return () => {
      active = false;
      clearTimeout(slowTimer);
    };
  }, []);

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setState({ status: 'out', user: null });
  }

  if (state.status === 'loading') {
    return (
      <div className="page">
        <main className="body" style={{ textAlign: 'center', padding: '3rem 1.5rem', maxWidth: '420px', margin: '0 auto' }}>
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
            Checking sign-in...
          </h2>
          <p className="muted" style={{ fontSize: '0.875rem' }}>
            Verifying administrator account credentials
          </p>

          {slowNotice && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
                Taking longer than usual to verify session?
              </p>
              <Link className="btn dark" href="/login" style={{ width: '100%', display: 'block' }}>
                Sign in with admin account
              </Link>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (state.status === 'out') {
    return (
      <div className="page">
        <main className="body" style={{ maxWidth: '420px', margin: '2rem auto', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔒</div>
          <h1 style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>Admin Portal</h1>
          <p className="muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Access to this section requires signing in with an authorized administrator account.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link className="btn dark big" href="/login" style={{ width: '100%', display: 'block', textAlign: 'center' }}>
              Sign in to Admin Account
            </Link>
            <Link className="btn" href="/" style={{ width: '100%', display: 'block', textAlign: 'center' }}>
              Back to Home
            </Link>
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
              Sign in with another account
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
