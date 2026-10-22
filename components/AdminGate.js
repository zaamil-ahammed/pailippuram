'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

// Wraps every /admin page. Shows the page only to a signed-in admin.
// This is a convenience: the real protection is the database rules (is_admin()).
export default function AdminGate({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return !cancelled && setState({ status: 'out', user: null });
      const { data: ok } = await supabase.rpc('is_admin');
      if (!cancelled) setState({ status: ok ? 'ok' : 'denied', user: data.user });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (state.status === 'loading') return <div className="page"><main className="body"><p className="muted">Checking sign-in...</p></main></div>;
  if (state.status === 'out')
    return (
      <div className="page"><main className="body">
        <h1>Admin</h1>
        <p>Please sign in first.</p>
        <Link className="btn dark" href="/login">Go to sign in</Link>
      </main></div>
    );
  if (state.status === 'denied')
    return (
      <div className="page"><main className="body">
        <h1>No access</h1>
        <p>This account is not an admin.</p>
        <button type="button" className="btn" onClick={signOut}>Sign out</button>
      </main></div>
    );

  return <AdminContext.Provider value={{ user: state.user, signOut }}>{children}</AdminContext.Provider>;
}
