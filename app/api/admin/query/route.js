import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { normalizeSupabaseUrl } from '../../../../lib/supabase';

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

// POST /api/admin/query: Allows authenticated admin panel to query Supabase directly
// using the service role key, bypassing RLS restrictions that prevent anon users from
// viewing hidden/archived items, audit logs, or pending records.
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      table,
      select = '*',
      filters = [],
      order,
      limit,
      range,
      head = false,
      count = null,
      single = false,
      maybeSingle = false,
    } = body || {};

    if (!table) {
      return NextResponse.json({ error: 'Table is required' }, { status: 400 });
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service client not configured' }, { status: 503 });
    }

    const selectOptions = {};
    if (count) selectOptions.count = count;
    if (head) selectOptions.head = true;

    let q = supabase.from(table).select(select, selectOptions);

    for (const f of filters) {
      if (f.type === 'eq') q = q.eq(f.col, f.val);
      else if (f.type === 'neq') q = q.neq(f.col, f.val);
      else if (f.type === 'or') q = q.or(f.expr);
      else if (f.type === 'in') q = q.in(f.col, f.vals);
      else if (f.type === 'ilike') q = q.ilike(f.col, f.pattern);
      else if (f.type === 'is') q = q.is(f.col, f.val);
      else if (f.type === 'lt') q = q.lt(f.col, f.val);
      else if (f.type === 'lte') q = q.lte(f.col, f.val);
      else if (f.type === 'gt') q = q.gt(f.col, f.val);
      else if (f.type === 'gte') q = q.gte(f.col, f.val);
    }

    if (order && order.col) {
      q = q.order(order.col, { ascending: order.ascending ?? true });
    }

    if (range && Array.isArray(range) && range.length === 2) {
      q = q.range(range[0], range[1]);
    } else if (limit != null) {
      q = q.limit(limit);
    }

    if (maybeSingle) {
      q = q.maybeSingle();
    } else if (single) {
      q = q.single();
    }

    const res = await q;

    if (res.error) {
      console.warn(`[API Admin Query] Query error on ${table}:`, res.error);
      return NextResponse.json({ success: false, error: res.error.message, data: null }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: res.data,
      count: res.count,
      status: res.status,
    });
  } catch (err) {
    console.error('[API Admin Query Fatal]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
