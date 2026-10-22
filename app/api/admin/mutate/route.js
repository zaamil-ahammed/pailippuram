import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { normalizeSupabaseUrl } from '../../../../lib/supabase';
import { memoryStore } from '../../../../lib/mockStore';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getServiceClient() {
  const key = supabaseServiceKey || supabaseAnonKey;
  if (!supabaseUrl || !key) return null;
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false },
  });
}

const isValidUuid = (val) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

function sanitizePayload(table, data, isInsert = false) {
  if (!data || typeof data !== 'object') return {};
  const cleaned = { ...data };

  // Common UUID check for updated_by
  if ('updated_by' in cleaned && !isValidUuid(cleaned.updated_by)) {
    delete cleaned.updated_by;
  }

  // Common status check: strictly 'approved' or 'hidden'
  if ('status' in cleaned) {
    cleaned.status = cleaned.status === 'hidden' ? 'hidden' : 'approved';
  }

  // Clean strings
  for (const [k, v] of Object.entries(cleaned)) {
    if (typeof v === 'string') {
      cleaned[k] = v.trim();
    }
  }

  if (table === 'listings') {
    // listings table does not have an updated_by column on remote Supabase
    delete cleaned.updated_by;

    // phone check length constraint
    if (cleaned.phone && cleaned.phone.length > 20) {
      cleaned.phone = cleaned.phone.slice(0, 20);
    }
    if (cleaned.whatsapp && cleaned.whatsapp.length > 20) {
      cleaned.whatsapp = cleaned.whatsapp.slice(0, 20);
    }
    if (cleaned.title) cleaned.title = cleaned.title.slice(0, 120);
    if (cleaned.area) cleaned.area = cleaned.area.slice(0, 80);
    if (cleaned.hours) cleaned.hours = cleaned.hours.slice(0, 80);
    if (cleaned.description) cleaned.description = cleaned.description.slice(0, 600);
  } else if (table === 'announcements') {
    // remote announcements table does not have is_pinned or updated_by columns
    const pinned = Boolean(cleaned.is_pinned || cleaned.pinned);
    delete cleaned.is_pinned;
    delete cleaned.pinned;
    delete cleaned.updated_by;

    let body = cleaned.body || '';
    if (pinned && !body.includes('[PINNED]')) {
      body = `[PINNED]\n${body.replace(/^(?:\[PINNED\]\s*)+/gi, '').trim()}`;
    } else if (!pinned) {
      body = body.replace(/^(?:\[PINNED\]\s*)+/gi, '').trim();
    }
    cleaned.body = (body || cleaned.title || 'Details').slice(0, 1500);
    if (cleaned.title) cleaned.title = cleaned.title.slice(0, 120);
  } else if (table === 'bus_routes') {
    // remote bus_routes table does not have a direction column
    if (cleaned.direction) {
      const dir = cleaned.direction.trim();
      delete cleaned.direction;
      if (dir && dir !== 'Both Ways' && cleaned.route && !cleaned.route.includes(dir)) {
        cleaned.route = `${cleaned.route} (${dir})`.slice(0, 120);
      }
    }
    if (cleaned.route) cleaned.route = cleaned.route.slice(0, 120);
    if (cleaned.bus_name) cleaned.bus_name = cleaned.bus_name.slice(0, 80);
    if (cleaned.times) cleaned.times = cleaned.times.slice(0, 800);
  } else if (table === 'donors') {
    if (cleaned.name) cleaned.name = cleaned.name.slice(0, 80);
    if (cleaned.area) cleaned.area = cleaned.area.slice(0, 80);
    if (cleaned.phone) cleaned.phone = cleaned.phone.slice(0, 20);
    cleaned.available = Boolean(cleaned.available ?? true);
    cleaned.consent = Boolean(cleaned.consent ?? true);
  } else if (table === 'panchayath_items') {
    if (cleaned.title) cleaned.title = cleaned.title.slice(0, 120);
    if (cleaned.extra) cleaned.extra = cleaned.extra.slice(0, 80);
    if (cleaned.detail) cleaned.detail = cleaned.detail.slice(0, 1000);
    const validSections = ['bearer', 'ward', 'service', 'notice'];
    if (!validSections.includes(cleaned.section)) {
      cleaned.section = 'service';
    }
  } else if (table === 'victory_members') {
    if (cleaned.name) cleaned.name = cleaned.name.slice(0, 120);
    if (cleaned.role) cleaned.role = cleaned.role.slice(0, 120);
    if (cleaned.role_ml) cleaned.role_ml = cleaned.role_ml.slice(0, 120);
    if (cleaned.phone) cleaned.phone = cleaned.phone.slice(0, 20);
    cleaned.display_order = Number(cleaned.display_order) >= 1 ? Number(cleaned.display_order) : 1;
    const validWings = ['executive', 'portfolios', 'gcc', 'central'];
    if (!validWings.includes(cleaned.wing)) cleaned.wing = 'executive';
    if (cleaned.wing !== 'portfolios') cleaned.portfolio = null;
    let link = cleaned.link || '';
    if (link && link.startsWith('@')) link = `https://instagram.com/${link.slice(1)}`;
    else if (link && !link.startsWith('http://') && !link.startsWith('https://')) link = `https://${link}`;
    cleaned.link = link ? link.slice(0, 300) : 'https://www.instagram.com/victory_pailippuram';
  } else if (table === 'submissions') {
    const validSubStatus = ['pending', 'approved', 'rejected', 'handled'];
    if (cleaned.status && !validSubStatus.includes(cleaned.status)) {
      cleaned.status = 'approved';
    }
  }

  if (isInsert) {
    if (!cleaned.created_at) cleaned.created_at = new Date().toISOString();
  }
  cleaned.updated_at = new Date().toISOString();

  return cleaned;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, table, id, data } = body || {};

    if (!action || !table) {
      return NextResponse.json({ error: 'Action and table are required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // 1. INSERT OPERATION
    if (action === 'insert') {
      let insertData = sanitizePayload(table, data, true);
      let insertedRow = null;
      let remoteError = null;

      if (supabase) {
        try {
          let res = await supabase.from(table).insert(insertData).select().single();

          // Resilient retry 1: if updated_by failed
          if (res.error && res.error.message && (res.error.message.includes('updated_by') || res.error.message.includes('uuid'))) {
            const { updated_by, ...noUser } = insertData;
            insertData = noUser;
            res = await supabase.from(table).insert(insertData).select().single();
          }

          // Resilient retry 2: if photo_url column missing on remote table
          if (res.error && res.error.message && res.error.message.includes('photo_url')) {
            const { photo_url, ...noPhoto } = insertData;
            insertData = noPhoto;
            res = await supabase.from(table).insert(insertData).select().single();
          }

          // Resilient retry 3: if category_id foreign key constraint failed
          if (res.error && res.error.message && (res.error.message.includes('category') || res.error.message.includes('foreign key'))) {
            insertData = { ...insertData, category_id: null };
            res = await supabase.from(table).insert(insertData).select().single();
          }

          // Resilient retry 4: listings kind_check constraint
          if (table === 'listings' && res.error && res.error.message && res.error.message.includes('kind')) {
            const currentKind = insertData.kind;
            const safeKinds = ['business', 'shop', 'contact'].filter((k) => k !== currentKind);
            for (const candKind of safeKinds) {
              const tryData = { ...insertData, kind: candKind };
              const candRes = await supabase.from(table).insert(tryData).select().single();
              if (!candRes.error && candRes.data) {
                res = candRes;
                break;
              }
            }
          }

          if (res.error) {
            console.warn(`[API Admin Mutate] Remote insert error on ${table}:`, res.error);
            remoteError = res.error;
          } else {
            insertedRow = res.data;
          }
        } catch (err) {
          console.warn(`[API Admin Mutate] Remote insert exception on ${table}:`, err);
          remoteError = err;
        }
      }

      // Sync into server-side memoryStore
      const localTable = memoryStore.getTable(table);
      const finalRow = insertedRow || {
        id: insertData.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...insertData,
      };

      if (!insertedRow) {
        localTable.unshift(finalRow);
      } else {
        const existIdx = localTable.findIndex((r) => String(r.id) === String(finalRow.id));
        if (existIdx >= 0) localTable[existIdx] = finalRow;
        else localTable.unshift(finalRow);
      }

      if (remoteError && !insertedRow) {
        return NextResponse.json({
          success: true,
          data: finalRow,
          warning: remoteError.message || 'Saved to offline store',
        });
      }

      return NextResponse.json({ success: true, data: finalRow });
    }

    // 2. UPDATE OPERATION
    if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
      }

      let updateData = sanitizePayload(table, data, false);
      let updatedRow = null;
      let remoteError = null;

      if (supabase) {
        try {
          let res = await supabase.from(table).update(updateData).eq('id', id).select().single();

          // Resilient retry 1: if updated_by failed
          if (res.error && res.error.message && (res.error.message.includes('updated_by') || res.error.message.includes('uuid'))) {
            const { updated_by, ...noUser } = updateData;
            updateData = noUser;
            res = await supabase.from(table).update(updateData).eq('id', id).select().single();
          }

          // Resilient retry 2: if photo_url column missing on remote table
          if (res.error && res.error.message && res.error.message.includes('photo_url')) {
            const { photo_url, ...noPhoto } = updateData;
            updateData = noPhoto;
            res = await supabase.from(table).update(updateData).eq('id', id).select().single();
          }

          // Resilient retry 3: if category_id foreign key constraint failed
          if (res.error && res.error.message && (res.error.message.includes('category') || res.error.message.includes('foreign key'))) {
            updateData = { ...updateData, category_id: null };
            res = await supabase.from(table).update(updateData).eq('id', id).select().single();
          }

          // Resilient retry 4: listings kind_check constraint
          if (table === 'listings' && res.error && res.error.message && res.error.message.includes('kind')) {
            const currentKind = updateData.kind;
            const safeKinds = ['business', 'shop', 'contact'].filter((k) => k !== currentKind);
            for (const candKind of safeKinds) {
              const tryData = { ...updateData, kind: candKind };
              const candRes = await supabase.from(table).update(tryData).eq('id', id).select().single();
              if (!candRes.error && candRes.data) {
                res = candRes;
                break;
              }
            }
          }

          if (res.error) {
            console.warn(`[API Admin Mutate] Remote update error on ${table}:`, res.error);
            remoteError = res.error;
          } else {
            updatedRow = res.data;
          }
        } catch (err) {
          console.warn(`[API Admin Mutate] Remote update exception on ${table}:`, err);
          remoteError = err;
        }
      }

      // Sync in server-side memoryStore
      const localTable = memoryStore.getTable(table);
      const idx = localTable.findIndex((r) => String(r.id) === String(id));
      const finalRow = updatedRow || {
        ...(idx >= 0 ? localTable[idx] : { id }),
        ...updateData,
        id,
      };

      if (idx >= 0) {
        localTable[idx] = finalRow;
      } else {
        localTable.unshift(finalRow);
      }

      if (remoteError && !updatedRow) {
        return NextResponse.json({
          success: true,
          data: finalRow,
          warning: remoteError.message || 'Saved to offline store',
        });
      }

      return NextResponse.json({ success: true, data: finalRow });
    }

    // 3. DELETE OPERATION
    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'ID is required for delete' }, { status: 400 });
      }

      let remoteError = null;
      if (supabase) {
        try {
          const res = await supabase.from(table).delete().eq('id', id);
          if (res.error) {
            console.warn(`[API Admin Mutate] Remote delete error on ${table}:`, res.error);
            remoteError = res.error;
          }
        } catch (err) {
          console.warn(`[API Admin Mutate] Remote delete exception on ${table}:`, err);
          remoteError = err;
        }
      }

      // Sync in server-side memoryStore
      const localTable = memoryStore.getTable(table);
      memoryStore.tables[table] = localTable.filter((r) => String(r.id) !== String(id));

      return NextResponse.json({ success: true, id, warning: remoteError?.message });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error('[API Admin Mutate Fatal]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
