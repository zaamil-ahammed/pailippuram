'use client';
import { useEffect, useState } from 'react';
import { supabase, isConfigured } from './supabase';

// Reusable hook to check if the current visitor is an authenticated admin.
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data?.user) {
          if (!cancelled) {
            setIsAdmin(false);
            setLoading(false);
          }
          return;
        }
        const { data: ok } = await supabase.rpc('is_admin');
        if (!cancelled) {
          setIsAdmin(Boolean(ok));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isAdmin, loading };
}
