import { createClient } from '@supabase/supabase-js';
import { createMockSupabaseClient } from './mockStore.js';
import { adminMutate } from './adminApi.js';

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
const srvKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const activeKey = typeof window === 'undefined' && srvKey ? srvKey : key;
const url = normalizeSupabaseUrl(rawUrl);

export const isRemoteConfigured = Boolean(url && key && !url.includes('placeholder'));
export const isConfigured = true; // Always true so directory data functions immediately in AI Studio

const mockClient = createMockSupabaseClient();
const realClient = isRemoteConfigured ? createClient(url, activeKey) : null;

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

function createProxyQuery(realQuery, mockQuery, tableName) {
  if (!mockQuery.ast) {
    mockQuery.ast = {
      table: tableName,
      select: '*',
      filters: [],
      order: null,
      limit: null,
      range: null,
      head: false,
      count: null,
      single: false,
      maybeSingle: false,
    };
  }

  const handler = {
    get(target, prop) {
      if (prop === 'then') {
        return (onFulfilled, onRejected) => {
          // If this is a mutation (insert, update, upsert, delete) in browser, execute via server API route
          // so service role credentials bypass PostgreSQL RLS policies cleanly.
          if (typeof window !== 'undefined' && ['insert', 'update', 'upsert', 'delete'].includes(mockQuery.operation)) {
            const action = mockQuery.operation === 'upsert' ? 'insert' : mockQuery.operation;
            return adminMutate({
              action,
              table: tableName,
              id: mockQuery.targetId,
              data: mockQuery.payload,
            })
              .then((res) => {
                if (res.error) {
                  return mockQuery.then(onFulfilled, onRejected);
                }
                const resultObj = {
                  data: res.data,
                  error: null,
                  count: Array.isArray(res.data) ? res.data.length : (res.data ? 1 : 0),
                  status: 200,
                  statusText: 'OK',
                };
                return onFulfilled ? onFulfilled(resultObj) : resultObj;
              })
              .catch(() => mockQuery.then(onFulfilled, onRejected));
          }

          // In admin pages, route SELECT queries through /api/admin/query so service role credentials
          // allow admins to view, filter, and manage hidden/archived rows and audit logs without RLS restrictions.
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
            return fetch(`/api/admin/query?_t=${Date.now()}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                Pragma: 'no-cache',
              },
              cache: 'no-store',
              body: JSON.stringify(mockQuery.ast),
            })
              .then((r) => r.json())
              .then((res) => {
                if (res && res.success) {
                  const resultObj = {
                    data: res.data,
                    error: null,
                    count: res.count,
                    status: res.status || 200,
                    statusText: 'OK',
                  };
                  return onFulfilled ? onFulfilled(resultObj) : resultObj;
                }
                throw new Error(res?.error || 'Admin query failed');
              })
              .catch((err) => {
                console.warn(`[Admin Query API on ${tableName} error]:`, err?.message || err);
                if (isRemoteConfigured) {
                  const resultObj = {
                    data: [],
                    error: { message: err?.message || 'Database query failed' },
                    count: 0,
                    status: 500,
                    statusText: 'Error',
                  };
                  return onFulfilled ? onFulfilled(resultObj) : resultObj;
                }
                return Promise.resolve(target)
                  .then(onFulfilled, onRejected)
                  .catch(() => mockQuery.then(onFulfilled, onRejected));
              });
          }

          // For public queries: Race real query with a 3500ms timeout so network stalls never freeze
          const queryTimeout = new Promise((resolve) =>
            setTimeout(() => resolve({ error: { message: `Request to ${tableName} timed out (falling back to offline store)` } }), 3500)
          );

          return Promise.race([
            Promise.resolve(target).catch((err) => ({ error: err })),
            queryTimeout,
          ])
            .then((result) => {
              if (result?.error) {
                console.warn(
                  `[Supabase Fallback] Error on table ${tableName}, falling back to local store:`,
                  result.error?.message || result.error
                );
                return mockQuery.then(onFulfilled, onRejected);
              }
              return onFulfilled ? onFulfilled(result) : result;
            })
            .catch((err) => {
              console.warn(
                `[Supabase Fallback] Promise error on table ${tableName}, falling back to local store:`,
                err
              );
              return mockQuery.then(onFulfilled, onRejected);
            });
        };
      }
      if (prop === 'catch') {
        return (onRejected) => {
          return target.catch((err) => {
            console.warn(
              `[Supabase Fallback] Catch error on table ${tableName}, falling back to local store:`,
              err
            );
            return mockQuery.catch(onRejected);
          });
        };
      }
      const val = target[prop];
      if (typeof val === 'function') {
        return (...args) => {
          // Record AST for server proxying
          if (mockQuery.ast) {
            if (prop === 'select') {
              mockQuery.ast.select = args[0] || '*';
              if (args[1]?.count) mockQuery.ast.count = args[1].count;
              if (args[1]?.head) mockQuery.ast.head = args[1].head;
            } else if (prop === 'eq') {
              mockQuery.ast.filters.push({ type: 'eq', col: args[0], val: args[1] });
            } else if (prop === 'neq') {
              mockQuery.ast.filters.push({ type: 'neq', col: args[0], val: args[1] });
            } else if (prop === 'or') {
              mockQuery.ast.filters.push({ type: 'or', expr: args[0] });
            } else if (prop === 'in') {
              mockQuery.ast.filters.push({ type: 'in', col: args[0], vals: args[1] });
            } else if (prop === 'ilike') {
              mockQuery.ast.filters.push({ type: 'ilike', col: args[0], pattern: args[1] });
            } else if (prop === 'like') {
              mockQuery.ast.filters.push({ type: 'like', col: args[0], pattern: args[1] });
            } else if (prop === 'not') {
              mockQuery.ast.filters.push({ type: 'not', col: args[0], operator: args[1], val: args[2] });
            } else if (prop === 'contains') {
              mockQuery.ast.filters.push({ type: 'contains', col: args[0], val: args[1] });
            } else if (prop === 'is') {
              mockQuery.ast.filters.push({ type: 'is', col: args[0], val: args[1] });
            } else if (prop === 'lt') {
              mockQuery.ast.filters.push({ type: 'lt', col: args[0], val: args[1] });
            } else if (prop === 'lte') {
              mockQuery.ast.filters.push({ type: 'lte', col: args[0], val: args[1] });
            } else if (prop === 'gt') {
              mockQuery.ast.filters.push({ type: 'gt', col: args[0], val: args[1] });
            } else if (prop === 'gte') {
              mockQuery.ast.filters.push({ type: 'gte', col: args[0], val: args[1] });
            } else if (prop === 'order') {
              const sortSpec = {
                col: args[0],
                ascending: args[1]?.ascending ?? true,
                ...(args[1]?.nullsFirst !== undefined ? { nullsFirst: args[1].nullsFirst } : {}),
              };
              mockQuery.ast.order = sortSpec;
              if (!mockQuery.ast.orders) mockQuery.ast.orders = [];
              mockQuery.ast.orders.push(sortSpec);
            } else if (prop === 'limit') {
              mockQuery.ast.limit = args[0];
            } else if (prop === 'range') {
              mockQuery.ast.range = [args[0], args[1]];
            } else if (prop === 'single') {
              mockQuery.ast.single = true;
            } else if (prop === 'maybeSingle') {
              mockQuery.ast.maybeSingle = true;
            }
          }

          let nextReal = null;
          try {
            nextReal = val.apply(target, args);
          } catch (callErr) {
            console.warn(`[Supabase Proxy] Failed calling ${prop} on real query:`, callErr);
          }
          if (typeof mockQuery[prop] === 'function') {
            try {
              mockQuery[prop](...args);
            } catch (mockErr) {
              console.warn(`[Supabase Proxy] Failed calling ${prop} on mock query:`, mockErr);
            }
          }
          if (nextReal && (typeof nextReal === 'object' || typeof nextReal === 'function')) {
            return createProxyQuery(nextReal, mockQuery, tableName);
          }
          return nextReal;
        };
      }
      return val;
    },
  };
  return new Proxy(realQuery, handler);
}

// Proxy client that uses real Supabase when configured, or in-memory mock seamlessly
export const supabase = {
  from(tableName) {
    if (!realClient) {
      return mockClient.from(tableName);
    }
    const realQuery = realClient.from(tableName);
    const mockQuery = mockClient.from(tableName);
    return createProxyQuery(realQuery, mockQuery, tableName);
  },
  get auth() {
    return safeAuth;
  },
  async rpc(funcName, args) {
    if (funcName === 'is_admin') {
      if (realClient) {
        try {
          const res = await timeoutPromise(realClient.rpc(funcName, args), 1500);
          if (res?.data === true) return res;
        } catch {
          // fall through to local verification
        }
      }
      return mockClient.rpc(funcName, args);
    }
    if (realClient) {
      try {
        return await timeoutPromise(realClient.rpc(funcName, args), 2500);
      } catch {
        return mockClient.rpc(funcName, args);
      }
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

// Cleans internal markers, phone tags, and whatsapp tags from display descriptions
export function cleanDescription(desc, categoryName) {
  if (!desc || typeof desc !== 'string') return '';
  return desc
    .replace(/^\[(DONOR|TRANSPORT|WORKER|BUS|SHOP|BUSINESS|ANNOUNCEMENT|EDUCATION|SCHOOL|MADRASSA)\]\s*/i, '')
    .replace(/(?:\n|^)(?:Alt(?:\s*Phones?|\s*Numbers?)?|Additional\s*Phones?|Phone\s*(?:\d+)?|Ph\s*(?:\d+)?|Contact(?:\s*\d+)?):\s*[^\n]+/gi, '')
    .replace(/(?:\n|^)WhatsApp:\s*[^\n]+/gi, '')
    .trim();
}

// Checks if an announcement is pinned
export function isPinnedAnnouncement(a) {
  if (!a) return false;
  const title = a.title || '';
  const body = a.body || '';
  return Boolean(
    a.pinned ||
    a.is_pinned ||
    /^\[PIN(?:NED)?\]/i.test(title) ||
    /^[📌📍]/.test(title) ||
    /^\[PIN(?:NED)?\]/i.test(body)
  );
}

// Removes [PIN] or pin emojis from announcement titles
export function cleanAnnouncementTitle(title) {
  if (!title || typeof title !== 'string') return '';
  return title
    .replace(/^\[PIN(?:NED)?\]\s*/i, '')
    .replace(/^[📌📍]\s*/, '')
    .trim();
}

// Removes [PIN] or pin emojis from announcement bodies
export function cleanAnnouncementBody(body) {
  if (!body || typeof body !== 'string') return '';
  return body
    .replace(/^\[PIN(?:NED)?\]\s*/i, '')
    .replace(/^[📌📍]\s*/, '')
    .trim();
}
