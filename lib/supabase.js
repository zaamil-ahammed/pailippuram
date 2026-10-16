import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);

// The anon key is safe to expose. Row Level Security in the database does the protecting.
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder');

// Removes characters that have a special meaning inside a search filter.
export function cleanSearch(text) {
  return (text || '').replace(/[%,()*\\]/g, ' ').trim().slice(0, 60);
}

// Phone helpers shared by every page that shows a number.
export function digits(phone) {
  return (phone || '').replace(/\D/g, '');
}

export function whatsappLink(phone) {
  const d = digits(phone);
  if (!d) return '';
  return `https://wa.me/${d.length === 10 ? '91' + d : d}`;
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
