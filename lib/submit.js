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
    if (res.status < 500 && data.error) {
      return data.error;
    }
    console.warn('[Submit] API route returned error, falling back to direct client insert...', data?.error);
  } catch (err) {
    console.warn('[Submit] API route unreachable, falling back to direct client insert...', err);
  }

  // Graceful direct fallback
  let cleanPhone = row.phone ? row.phone.trim() : null;
  let safeDesc = row.description?.trim() || row.title?.trim() || 'N/A';
  if (cleanPhone && cleanPhone.length > 20) {
    const parts = cleanPhone.split(/[,/;\n]/).map((p) => p.trim()).filter(Boolean);
    cleanPhone = parts[0]?.slice(0, 20) || null;
    if (parts.length > 1 && !safeDesc.includes('Alt Phones:')) {
      safeDesc = `${safeDesc}\nAlt Phones: ${parts.slice(1).join(', ')}`;
    }
  }

  const safeRow = {
    ...row,
    phone: cleanPhone,
    description: safeDesc,
    status: 'pending',
  };
  let { error } = await supabase.from('submissions').insert(safeRow);
  if (error && error.message && error.message.includes('submissions_phone_check')) {
    const fallbackPhoneRow = {
      ...safeRow,
      phone: safeRow.phone ? safeRow.phone.slice(0, 15) : null,
    };
    const resPhone = await supabase.from('submissions').insert(fallbackPhoneRow);
    if (!resPhone.error) error = null;
    else error = resPhone.error;
  }
  if (error && error.message && error.message.includes('submissions_type_check')) {
    const fallbackRow = {
      ...safeRow,
      type: 'contact',
      description: `[${(safeRow.type || 'Submission').toUpperCase()}] ${safeRow.description}`.trim(),
    };
    const res2 = await supabase.from('submissions').insert(fallbackRow);
    error = res2.error;
  }
  return error ? (error.message || 'Could not send. Please try again in a moment.') : '';
}
