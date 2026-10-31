import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { normalizeSupabaseUrl } from '../../../../lib/supabase';
import { memoryStore } from '../../../../lib/mockStore';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

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

export function getHiddenStatusForTable(table) {
  // Remote PostgreSQL check constraints:
  // listings and announcements enforce status in ('approved', 'archived', 'rejected', 'pending')
  // donors, bus_routes, and victory_members enforce status in ('approved', 'hidden')
  if (table === 'listings' || table === 'announcements') {
    return 'archived';
  }
  return 'hidden';
}

export function normalizeOutputRow(table, row) {
  if (!row || typeof row !== 'object') return row;
  if (Array.isArray(row)) return row.map((r) => normalizeOutputRow(table, r));
  const res = { ...row };
  if (Array.isArray(res.blood_group)) {
    res.blood_group = res.blood_group[0] || 'O+';
  }
  if (Array.isArray(res.location)) {
    res.location = res.location[0] || 'Pailippuram';
  }
  if (table === 'victory_members' && typeof res.link === 'string' && res.link.startsWith('{')) {
    try {
      const parsed = JSON.parse(res.link);
      res.instagram = parsed.instagram || '';
      res.facebook = parsed.facebook || '';
      res.linkedin = parsed.linkedin || '';
      res.twitter = parsed.twitter || '';
      res.website = parsed.website || '';
      if (parsed.alt_phone) res.alt_phone = parsed.alt_phone;
      if (parsed.email) res.email = parsed.email;
      if (parsed.whatsapp) res.whatsapp = parsed.whatsapp;
      res.link = parsed.instagram || parsed.website || 'https://www.instagram.com/victory_pailippuram';
    } catch {
      // ignore
    }
  }
  return res;
}

export function sanitizePayload(table, data, isInsert = false) {
  if (!data || typeof data !== 'object') return {};
  const cleaned = { ...data };

  // Remove envelope keys
  delete cleaned.table;
  delete cleaned.action;

  // On insert, strip invalid/mock/empty id so PostgreSQL can generate a valid UUID default
  if (isInsert && (!cleaned.id || !isValidUuid(cleaned.id))) {
    delete cleaned.id;
  }

  // Status check constraint mapping
  if ('status' in cleaned) {
    if (cleaned.status === 'approved') {
      cleaned.status = 'approved';
    } else {
      cleaned.status = getHiddenStatusForTable(table);
    }
  }

  // Strip invalid updated_by UUID
  if ('updated_by' in cleaned && !isValidUuid(cleaned.updated_by)) {
    delete cleaned.updated_by;
  }

  // Clean strings
  for (const [k, v] of Object.entries(cleaned)) {
    if (typeof v === 'string') {
      cleaned[k] = v.trim();
    }
  }

  if (table === 'listings') {
    delete cleaned.updated_by;
    delete cleaned.is_pinned;
    delete cleaned.pinned;

    if ('category_id' in cleaned) {
      cleaned.category_id = isValidUuid(cleaned.category_id) ? cleaned.category_id : null;
    }
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
    if (!cleaned.kind) cleaned.kind = 'business';
  } else if (table === 'announcements') {
    const pinned = Boolean(cleaned.is_pinned || cleaned.pinned);
    delete cleaned.is_pinned;
    delete cleaned.pinned;
    delete cleaned.updated_by;
    delete cleaned.photo_url;
    delete cleaned.phone;

    let body = cleaned.body || '';
    if (pinned && !body.includes('[PINNED]')) {
      body = `[PINNED]\n${body.replace(/^(?:\[PINNED\]\s*)+/gi, '').trim()}`;
    } else if (!pinned) {
      body = body.replace(/^(?:\[PINNED\]\s*)+/gi, '').trim();
    }
    cleaned.body = (body || cleaned.title || 'Details').slice(0, 1500);
    if (cleaned.title) cleaned.title = cleaned.title.slice(0, 120);
  } else if (table === 'bus_routes') {
    delete cleaned.photo_url;
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
    const validBg = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    let bg = cleaned.blood_group;
    if (Array.isArray(bg)) bg = bg[0];
    if (typeof bg === 'string') bg = bg.trim().toUpperCase();
    if (bg && !validBg.includes(bg)) {
      cleaned.blood_group = 'O+';
    } else if (bg) {
      cleaned.blood_group = bg;
    }
  } else if (table === 'categories') {
    delete cleaned.created_at;
    delete cleaned.updated_at;
    delete cleaned.updated_by;
  } else if (table === 'audit_logs') {
    delete cleaned.admin_email;
    delete cleaned.table_name;
    delete cleaned.row_id;
    delete cleaned.note;
    delete cleaned.changes;
    if (!isValidUuid(cleaned.admin_id)) delete cleaned.admin_id;
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
    if (cleaned.phone) cleaned.phone = cleaned.phone.slice(0, 80);
    cleaned.display_order = Number(cleaned.display_order) >= 1 ? Number(cleaned.display_order) : 1;
    
    // Map non-committee options safely to PostgreSQL allowed check constraint values
    let wing = cleaned.wing;
    if (wing === 'general') wing = 'non_committee';
    const validWings = ['executive', 'portfolios', 'gcc', 'central', 'non_committee', 'club_member', 'member', 'advisory', 'volunteer'];
    if (!validWings.includes(wing)) wing = 'executive';
    cleaned.wing = wing;
    if (cleaned.wing !== 'portfolios') cleaned.portfolio = null;

    // Pack social profiles and extra contact numbers safely into link JSON
    const hasExtraSocials = Boolean(
      cleaned.facebook || cleaned.linkedin || cleaned.twitter || cleaned.website ||
      cleaned.alt_phone || cleaned.email || cleaned.whatsapp
    );

    let link = cleaned.link || '';
    if (hasExtraSocials) {
      let currentSocials = {};
      if (typeof link === 'string' && link.startsWith('{')) {
        try { currentSocials = JSON.parse(link); } catch { currentSocials = {}; }
      }
      const combined = {
        instagram: cleaned.instagram || currentSocials.instagram || (!link.startsWith('{') && link ? link : 'https://www.instagram.com/victory_pailippuram'),
        facebook: cleaned.facebook || currentSocials.facebook || undefined,
        linkedin: cleaned.linkedin || currentSocials.linkedin || undefined,
        twitter: cleaned.twitter || currentSocials.twitter || undefined,
        website: cleaned.website || currentSocials.website || undefined,
        alt_phone: cleaned.alt_phone || currentSocials.alt_phone || undefined,
        email: cleaned.email ? cleaned.email.toLowerCase() : currentSocials.email || undefined,
        whatsapp: cleaned.whatsapp || currentSocials.whatsapp || undefined,
      };
      cleaned.link = JSON.stringify(combined);
    } else if (typeof link === 'string' && link.startsWith('{')) {
      cleaned.link = link;
    } else {
      if (link && link.startsWith('@')) link = `https://instagram.com/${link.slice(1)}`;
      else if (link && !link.startsWith('http://') && !link.startsWith('https://')) link = `https://${link}`;
      cleaned.link = link ? link.slice(0, 300) : 'https://www.instagram.com/victory_pailippuram';
    }

    // Strip virtual columns not physically in Supabase table
    delete cleaned.instagram;
    delete cleaned.facebook;
    delete cleaned.linkedin;
    delete cleaned.twitter;
    delete cleaned.website;
    delete cleaned.alt_phone;
    delete cleaned.email;
    delete cleaned.whatsapp;

    if (cleaned.location) cleaned.location = cleaned.location.trim().slice(0, 80);

    // In Supabase PostgreSQL, victory_members.blood_group is an array column text[]
    if (cleaned.blood_group !== undefined && cleaned.blood_group !== null) {
      let rawBg = cleaned.blood_group;
      if (Array.isArray(rawBg)) rawBg = rawBg[0];
      if (typeof rawBg === 'string') rawBg = rawBg.trim().toUpperCase();
      const validBg = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (!rawBg || !validBg.includes(rawBg)) rawBg = 'O+';
      cleaned.blood_group = [rawBg];
    }
  } else if (table === 'submissions') {
    const validSubStatus = ['pending', 'approved', 'rejected', 'handled'];
    if (cleaned.status && !validSubStatus.includes(cleaned.status)) {
      cleaned.status = 'approved';
    }
  }

  if (table !== 'categories' && table !== 'audit_logs') {
    if (isInsert && !cleaned.created_at) {
      cleaned.created_at = new Date().toISOString();
    }
    cleaned.updated_at = new Date().toISOString();
  }

  return cleaned;
}

// -------------------------------------------------------------
// POST /api/admin/records: Creates a new community record
// -------------------------------------------------------------
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, table, id } = body;

    // Handle legacy action delegation if posted with action: 'update' or 'delete'
    if (action === 'update') {
      const mockPatchReq = {
        json: async () => body,
      };
      return PATCH(mockPatchReq);
    }
    if (action === 'delete') {
      const mockDelReq = {
        url: `http://localhost/api/admin/records?table=${encodeURIComponent(table || '')}&id=${encodeURIComponent(id || '')}`,
        json: async () => body,
      };
      return DELETE(mockDelReq);
    }

    if (!table) {
      return NextResponse.json({ success: false, error: 'Table name is required' }, { status: 400 });
    }

    const rawData = (body.data && typeof body.data === 'object') ? body.data : { ...body };
    const supabase = getServiceClient();
    let insertData = sanitizePayload(table, rawData, true);
    let insertedRow = null;
    let remoteError = null;

    if (supabase) {
      try {
        let res = await supabase.from(table).insert(insertData).select();

        // Resilient retry 1: if updated_by failed
        if (res.error && res.error.message && (res.error.message.includes('updated_by') || res.error.message.includes('uuid'))) {
          const { updated_by, ...noUser } = insertData;
          insertData = noUser;
          res = await supabase.from(table).insert(insertData).select();
        }

        // Resilient retry 2: if category foreign key failed
        if (res.error && res.error.message && (res.error.message.includes('category') || res.error.message.includes('foreign key'))) {
          insertData = { ...insertData, category_id: null };
          res = await supabase.from(table).insert(insertData).select();
        }

        // Resilient retry 3: if status check constraint failed
        if (res.error && res.error.message && res.error.message.includes('status')) {
          insertData = { ...insertData, status: insertData.status === 'approved' ? 'approved' : getHiddenStatusForTable(table) };
          res = await supabase.from(table).insert(insertData).select();
        }

        // Resilient retry 4: listings kind_check constraint
        if (table === 'listings' && res.error && res.error.message && res.error.message.includes('kind')) {
          const currentKind = insertData.kind;
          const safeKinds = ['business', 'shop', 'contact'].filter((k) => k !== currentKind);
          for (const candKind of safeKinds) {
            const tryData = { ...insertData, kind: candKind };
            const candRes = await supabase.from(table).insert(tryData).select();
            if (!candRes.error && candRes.data) {
              res = candRes;
              break;
            }
          }
        }

        // Resilient retry 5: Postgres array format (malformed array literal: e.g. text[] vs text)
        if (res.error && res.error.message && (res.error.message.includes('malformed array literal') || res.error.message.includes('array'))) {
          let retryData = { ...insertData };
          let changed = false;
          for (const k of ['blood_group', 'location']) {
            if (retryData[k] !== undefined && retryData[k] !== null) {
              if (typeof retryData[k] === 'string') {
                retryData[k] = [retryData[k]];
                changed = true;
              } else if (Array.isArray(retryData[k])) {
                retryData[k] = retryData[k][0] || null;
                changed = true;
              }
            }
          }
          if (changed) {
            const arrRes = await supabase.from(table).insert(retryData).select();
            if (!arrRes.error && arrRes.data) {
              res = arrRes;
              insertData = retryData;
            }
          }
        }

        if (res.error) {
          console.error(`[POST /api/admin/records] Error on ${table}:`, res.error);
          remoteError = res.error;
        } else {
          insertedRow = res.data?.[0] || res.data;
        }
      } catch (err) {
        console.error(`[POST /api/admin/records] Exception on ${table}:`, err);
        remoteError = err;
      }
    }

    if (supabase && remoteError && !insertedRow) {
      return NextResponse.json({
        success: false,
        error: remoteError.message || `Failed to create record in ${table}`,
      }, { status: 400 });
    }

    // Keep server memoryStore synchronized
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

    return NextResponse.json({ success: true, data: normalizeOutputRow(table, finalRow) }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/records Fatal]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// -------------------------------------------------------------
// PATCH /api/admin/records: Updates an existing community record
// -------------------------------------------------------------
export async function PATCH(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { table, id } = body || {};

    if (!table || !id) {
      return NextResponse.json({ success: false, error: 'Table and record ID are required for update' }, { status: 400 });
    }

    const rawData = (body.data && typeof body.data === 'object') ? body.data : { ...body };
    delete rawData.id;
    const supabase = getServiceClient();
    let updateData = sanitizePayload(table, rawData, false);
    let updatedRow = null;
    let remoteError = null;

    if (supabase) {
      try {
        let res = await supabase.from(table).update(updateData).eq('id', id).select();

        // Resilient retry 1: if updated_by failed
        if (res.error && res.error.message && (res.error.message.includes('updated_by') || res.error.message.includes('uuid'))) {
          const { updated_by, ...noUser } = updateData;
          updateData = noUser;
          res = await supabase.from(table).update(updateData).eq('id', id).select();
        }

        // Resilient retry 2: if category foreign key failed
        if (res.error && res.error.message && (res.error.message.includes('category') || res.error.message.includes('foreign key'))) {
          updateData = { ...updateData, category_id: null };
          res = await supabase.from(table).update(updateData).eq('id', id).select();
        }

        // Resilient retry 3: if status check constraint failed
        if (res.error && res.error.message && res.error.message.includes('status')) {
          updateData = { ...updateData, status: updateData.status === 'approved' ? 'approved' : getHiddenStatusForTable(table) };
          res = await supabase.from(table).update(updateData).eq('id', id).select();
        }

        // Resilient retry 4: listings kind_check constraint
        if (table === 'listings' && res.error && res.error.message && res.error.message.includes('kind')) {
          const currentKind = updateData.kind;
          const safeKinds = ['business', 'shop', 'contact'].filter((k) => k !== currentKind);
          for (const candKind of safeKinds) {
            const tryData = { ...updateData, kind: candKind };
            const candRes = await supabase.from(table).update(tryData).eq('id', id).select();
            if (!candRes.error && candRes.data) {
              res = candRes;
              break;
            }
          }
        }

        // Resilient retry 5: Postgres array format (malformed array literal: e.g. text[] vs text)
        if (res.error && res.error.message && (res.error.message.includes('malformed array literal') || res.error.message.includes('array'))) {
          let retryData = { ...updateData };
          let changed = false;
          for (const k of ['blood_group', 'location']) {
            if (retryData[k] !== undefined && retryData[k] !== null) {
              if (typeof retryData[k] === 'string') {
                retryData[k] = [retryData[k]];
                changed = true;
              } else if (Array.isArray(retryData[k])) {
                retryData[k] = retryData[k][0] || null;
                changed = true;
              }
            }
          }
          if (changed) {
            const arrRes = await supabase.from(table).update(retryData).eq('id', id).select();
            if (!arrRes.error && arrRes.data) {
              res = arrRes;
              updateData = retryData;
            }
          }
        }

        if (res.error) {
          console.error(`[PATCH /api/admin/records] Error on ${table}:`, res.error);
          remoteError = res.error;
        } else {
          updatedRow = res.data?.[0] || res.data;
        }
      } catch (err) {
        console.error(`[PATCH /api/admin/records] Exception on ${table}:`, err);
        remoteError = err;
      }
    }

    if (supabase && remoteError && !updatedRow) {
      return NextResponse.json({
        success: false,
        error: remoteError.message || `Failed to update record in ${table}`,
      }, { status: 400 });
    }

    // Keep server memoryStore synchronized
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

    return NextResponse.json({ success: true, data: normalizeOutputRow(table, finalRow) }, { status: 200 });
  } catch (err) {
    console.error('[PATCH /api/admin/records Fatal]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// -------------------------------------------------------------
// DELETE /api/admin/records: Deletes an existing community record
// -------------------------------------------------------------
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    let table = searchParams.get('table');
    let id = searchParams.get('id');

    // Also support JSON body if params were not in query string
    if (!table || !id) {
      const body = await req.json().catch(() => ({}));
      table = table || body.table;
      id = id || body.id;
    }

    if (!table || !id) {
      return NextResponse.json({ success: false, error: 'Table and record ID are required for deletion' }, { status: 400 });
    }

    const supabase = getServiceClient();
    let remoteError = null;

    if (supabase) {
      try {
        const res = await supabase.from(table).delete().eq('id', id);
        if (res.error) {
          console.error(`[DELETE /api/admin/records] Error on ${table}:`, res.error);
          remoteError = res.error;
        }
      } catch (err) {
        console.error(`[DELETE /api/admin/records] Exception on ${table}:`, err);
        remoteError = err;
      }
    }

    if (supabase && remoteError) {
      return NextResponse.json({
        success: false,
        error: remoteError.message || `Failed to delete record from ${table}`,
      }, { status: 400 });
    }

    // Keep server memoryStore synchronized
    const localTable = memoryStore.getTable(table);
    memoryStore.tables[table] = localTable.filter((r) => String(r.id) !== String(id));

    return NextResponse.json({
      success: true,
      id,
      table,
      message: 'Record deleted successfully',
    }, { status: 200 });
  } catch (err) {
    console.error('[DELETE /api/admin/records Fatal]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// -------------------------------------------------------------
// GET /api/admin/records: Retrieves community records
// -------------------------------------------------------------
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Table parameter is required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const supabase = getServiceClient();
    if (!supabase) {
      const localTable = memoryStore.getTable(table);
      let filtered = localTable;
      if (id) filtered = filtered.filter((r) => String(r.id) === String(id));
      if (status) filtered = filtered.filter((r) => r.status === status);
      return NextResponse.json(
        { success: true, data: id ? (filtered[0] || null) : filtered.slice(0, limit) },
        { headers: NO_CACHE_HEADERS }
      );
    }

    let q = supabase.from(table).select('*');
    if (id) {
      if (isValidUuid(id)) {
        q = q.eq('id', id).maybeSingle();
      } else {
        // Not a UUID (e.g. starter ID like vm-1, c1) - find in memoryStore or fallback
        const localTable = memoryStore.getTable(table);
        const match = localTable.find((r) => String(r.id) === String(id));
        if (match) {
          return NextResponse.json({ success: true, data: match }, { status: 200, headers: NO_CACHE_HEADERS });
        }
        return NextResponse.json({ success: true, data: null }, { status: 200, headers: NO_CACHE_HEADERS });
      }
    } else {
      if (status) q = q.eq('status', status);
      if (table === 'categories') {
        q = q.order('name', { ascending: true });
      } else if (table === 'victory_members') {
        q = q.order('display_order', { ascending: true });
      } else {
        q = q.order('created_at', { ascending: false });
      }
      q = q.limit(limit);
    }

    const { data, error } = await q;

    if (error) {
      console.error(`[GET /api/admin/records] Error on ${table}:`, error);
      // Fallback to memoryStore before returning error
      const localTable = memoryStore.getTable(table);
      if (id) {
        const fallbackMatch = localTable.find((r) => String(r.id) === String(id));
        if (fallbackMatch) {
          return NextResponse.json({ success: true, data: fallbackMatch }, { status: 200, headers: NO_CACHE_HEADERS });
        }
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // If id was requested but not found in Supabase, check memoryStore fallback
    if (id && !data) {
      const localTable = memoryStore.getTable(table);
      const fallbackMatch = localTable.find((r) => String(r.id) === String(id));
      if (fallbackMatch) {
        return NextResponse.json({ success: true, data: fallbackMatch }, { status: 200, headers: NO_CACHE_HEADERS });
      }
    }

    return NextResponse.json({ success: true, data: normalizeOutputRow(table, data) }, { status: 200, headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('[GET /api/admin/records Fatal]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
