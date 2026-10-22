import { createClient } from '@supabase/supabase-js';
import { createMockSupabaseClient } from './mockStore.js';

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

export const isRemoteConfigured = Boolean(url && key && !url.includes('placeholder'));
export const isConfigured = true; // Always true so directory data functions immediately in AI Studio

const mockClient = createMockSupabaseClient();
const realClient = isRemoteConfigured ? createClient(url, key) : null;

function timeoutPromise(promise, ms = 2000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Auth request timed out')), ms)),
  ]);
}

const safeAuth = {
  async getUser() {
    if (realClient) {
      try {
        const res = await timeoutPromise(realClient.auth.getUser(), 2000);
        if (res?.data?.user) return res;
      } catch (err) {
        console.warn('[Supabase Auth Fallback] getUser failed or timed out:', err);
      }
    }
    return mockClient.auth.getUser();
  },

  async getSession() {
    if (realClient) {
      try {
        const res = await timeoutPromise(realClient.auth.getSession(), 2000);
        if (res?.data?.session) return res;
      } catch (err) {
        console.warn('[Supabase Auth Fallback] getSession failed or timed out:', err);
      }
    }
    return mockClient.auth.getSession();
  },

  async signInWithPassword({ email, password }) {
    if (realClient) {
      try {
        const res = await timeoutPromise(realClient.auth.signInWithPassword({ email, password }), 3000);
        if (!res?.error && res?.data?.user) {
          await mockClient.auth.signInWithPassword({ email, password });
          return res;
        }
      } catch (err) {
        console.warn('[Supabase Auth Fallback] signInWithPassword failed or timed out:', err);
      }
    }
    return mockClient.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    if (realClient) {
      try {
        await timeoutPromise(realClient.auth.signOut(), 1500);
      } catch {
        // ignore
      }
    }
    return mockClient.auth.signOut();
  },

  onAuthStateChange(callback) {
    if (realClient) {
      try {
        return realClient.auth.onAuthStateChange(callback);
      } catch {
        // fallback to mock
      }
    }
    return mockClient.auth.onAuthStateChange(callback);
  },
};

// Proxy client that uses real Supabase when configured, or in-memory mock seamlessly
export const supabase = {
  from(tableName) {
    if (!realClient) {
      return mockClient.from(tableName);
    }
    const realQuery = realClient.from(tableName);
    const mockQuery = mockClient.from(tableName);

    // Return a wrapped query builder that falls back to mock on any query or network failure
    return new Proxy(realQuery, {
      get(target, prop) {
        if (prop === 'then') {
          return (onFulfilled, onRejected) => {
            return target
              .then((result) => {
                if (result.error) {
                  console.warn(`[Supabase Fallback] Error on table ${tableName}, falling back to local store:`, result.error?.message || result.error);
                  return mockQuery.then(onFulfilled, onRejected);
                }
                return onFulfilled ? onFulfilled(result) : result;
              })
              .catch((err) => {
                console.warn(`[Supabase Fallback] Promise error on table ${tableName}, falling back to local store:`, err);
                return mockQuery.then(onFulfilled, onRejected);
              });
          };
        }
        const val = target[prop];
        if (typeof val === 'function') {
          return (...args) => {
            const nextReal = val.apply(target, args);
            if (typeof mockQuery[prop] === 'function') {
              mockQuery[prop](...args);
            }
            return new Proxy(nextReal, this);
          };
        }
        return val;
      },
    });
  },
  get auth() {
    return safeAuth;
  },
  rpc(funcName, args) {
    if (realClient) {
      return realClient.rpc(funcName, args).catch(() => mockClient.rpc(funcName, args));
    }
    return mockClient.rpc(funcName, args);
  },
};

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

  // 2. Extra field (e.g. Panchayath items)
  if (item.extra) {
    add(item.extra);
  }

  // 3. Alt phones in description
  if (item.description) {
    const matches = item.description.matchAll(/(?:Alt(?:\s*Phones?|\s*Numbers?)?|Additional\s*Phones?|Phone\s*(?:\d+)?|Ph\s*(?:\d+)?|Contact(?:\s*\d+)?):\s*([^\n]+)/gi);
    for (const m of matches) {
      add(m[1]);
    }
  }

  // 4. Alt phones in area
  if (item.area) {
    const match = item.area.match(/(?:Alt(?:\s*Phones?)?|Phone\s*(?:\d+)?):\s*([^\n]+)/i);
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
