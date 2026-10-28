'use client';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// Runs a database query and returns { rows, loading, error }.
// `build` receives the supabase client and must return a query. Re-runs when `deps` change.
export function useRows(build, deps = []) {
  const [state, setState] = useState({ rows: [], loading: true, error: '' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    build(supabase).then(({ data, error }) => {
      if (cancelled) return;
      setState({
        rows: data || [],
        loading: false,
        error: error ? 'Could not load this. Please try again.' : '',
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  // Automatically re-fetch when returning to the tab (e.g. after making edits in Supabase Table Editor)
  useEffect(() => {
    function onFocus() {
      setTick((n) => n + 1);
    }
    function onVisibility() {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        setTick((n) => n + 1);
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibility);
      return () => {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisibility);
      };
    }
  }, []);

  return { ...state, reload: () => setTick((n) => n + 1) };
}
