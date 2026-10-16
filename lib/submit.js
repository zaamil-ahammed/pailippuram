import { supabase } from './supabase';

// Sends one visitor submission (new info, correction or removal) for admin review.
// First tries the API route which inserts into Supabase AND sends an instant email alert to admins.
// Falls back gracefully to direct client-side Supabase insert if offline or API is unreachable.
export async function sendSubmission(row) {
  try {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    });

    if (res.ok) {
      return '';
    }

    const data = await res.json().catch(() => ({}));
    if (data.error) {
      return data.error;
    }
  } catch (err) {
    console.warn('[Submit] API route unreachable, falling back to direct client insert...', err);
  }

  // Graceful direct fallback
  const { error } = await supabase.from('submissions').insert({ ...row, status: 'pending' });
  return error ? 'Could not send. Please try again in a moment.' : '';
}
