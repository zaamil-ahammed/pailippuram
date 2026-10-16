'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SubmitRedirect() {
  const router = useRouter();

  useEffect(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`/share${search}`);
  }, [router]);

  return (
    <div className="page" style={{ padding: 40, textAlign: 'center' }}>
      <p className="muted">Redirecting to Share form...</p>
    </div>
  );
}
