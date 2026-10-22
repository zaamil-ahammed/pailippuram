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
    try {
      const q = build(supabase);
      if (!q || typeof q.then !== 'function') {
        setState({ rows: [], loading: false, error: '' });
        return;
      }
      q.then(({ data, error }) => {
        if (cancelled) return;
        setState({
          rows: data || [],
          loading: false,
          error: error ? (error.message || 'Could not load this. Please try again.') : '',
        });
      }).catch((err) => {
        if (cancelled) return;
        console.warn('[useRows] Query promise rejection:', err);
        setState({
          rows: [],
          loading: false,
          error: err?.message || 'Could not load this. Please try again.',
        });
      });
    } catch (err) {
      if (!cancelled) {
        console.warn('[useRows] Build function threw:', err);
        setState({ rows: [], loading: false, error: err?.message || 'Could not load this.' });
      }
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload: () => setTick((n) => n + 1) };
}
