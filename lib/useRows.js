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

  return { ...state, reload: () => setTick((n) => n + 1) };
}
