import { createClient } from '@supabase/supabase-js';

export function normalizeSupabaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Handle Supabase project ID (e.g. "jwmcvrkwxcacfwcdkjqr")
  if (/^[a-z0-9]{20}$/i.test(trimmed)) {
    return `https://${trimmed}.supabase.co`;
  }

  // Prepend https:// if protocol is omitted (e.g. "jwmcvrkwxcacfwcdkjqr.supabase.co")
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.origin;
    }
  } catch {
    // invalid URL format
  }

  return '';
}

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const url = normalizeSupabaseUrl(rawUrl);

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

// Extracts all unique callable phone numbers from an item (checks phone, description, and area)
export function extractAllPhones(item) {
  if (!item) return [];
  const list = [];
  const seen = new Set();

  function add(raw) {
    if (!raw) return;
    const parts = String(raw).split(/[,/;\n]/);
    for (let p of parts) {
      p = p.trim();
      const d = p.replace(/\D/g, '');
      if (d.length >= 7 && !seen.has(d)) {
        seen.add(d);
        list.push(p);
      }
    }
  }

  // 1. Primary phone
  add(item.phone);

  // 2. Alt phones in description
  if (item.description) {
    const matches = item.description.matchAll(/(?:Alt(?:\s*Phones?|\s*Numbers?)?|Additional\s*Phones?|Phone\s*2|Ph\s*2):\s*([^\n]+)/gi);
    for (const m of matches) {
      add(m[1]);
    }
  }

  // 3. Alt phones in area
  if (item.area) {
    const match = item.area.match(/(?:Alt(?:\s*Phone)?|Phone\s*2):\s*([^\n]+)/i);
    if (match) {
      add(match[1]);
    }
  }

  return list;
}

// Announcements 'Pin to top' helpers
export function isPinnedAnnouncement(item) {
  if (!item) return false;
  return Boolean(
    item.is_pinned ||
    item.pinned ||
    (typeof item.body === 'string' && item.body.includes('[PINNED]')) ||
    (typeof item.title === 'string' && item.title.startsWith('📌'))
  );
}

export function cleanAnnouncementBody(body) {
  if (!body) return '';
  return body.replace(/(?:^|\n)\[PINNED\]\s*/gi, '\n').trim();
}

export function cleanAnnouncementTitle(title) {
  if (!title) return '';
  return title.replace(/^📌\s*/, '').trim();
}
