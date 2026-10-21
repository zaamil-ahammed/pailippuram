import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { normalizeSupabaseUrl } from '../../../lib/supabase';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  const key = supabaseServiceKey || supabaseAnonKey;
  if (!supabaseUrl || !key) return null;
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false },
  });
}

function normalizeKind(kind) {
  if (!kind) return 'business';
  const k = kind.toLowerCase();
  if (k === 'shop' || k === 'shops' || k === 'business') return 'business';
  if (k === 'worker' || k === 'workers') return 'worker';
  if (k === 'transport' || k === 'transports') return 'transport';
  if (k === 'contact' || k === 'contacts') return 'contact';
  return k;
}

// GET /api/categories?kind=...&withCounts=true
export async function GET(req) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const rawKind = searchParams.get('kind');
    const withCounts = searchParams.get('withCounts') === 'true';

    let query = supabase.from('categories').select('*').order('name');
    if (rawKind) {
      const kind = normalizeKind(rawKind);
      if (kind === 'business') {
        query = query.or('kind.eq.business,kind.eq.shop');
      } else {
        query = query.eq('kind', kind);
      }
    }

    const { data: categories, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (withCounts) {
      // Fetch count of approved listings for each category
      const { data: listings } = await supabase
        .from('listings')
        .select('category_id')
        .eq('status', 'approved');

      const countMap = {};
      (listings || []).forEach((l) => {
        if (l.category_id) {
          countMap[l.category_id] = (countMap[l.category_id] || 0) + 1;
        }
      });

      const enriched = (categories || []).map((c) => ({
        ...c,
        listing_count: countMap[c.id] || 0,
      }));

      return NextResponse.json({ categories: enriched });
    }

    return NextResponse.json({ categories: categories || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/categories
// Body: { kind: 'business' | 'worker' | 'transport' | 'contact', name: string, name_ml?: string }
export async function POST(req) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { kind: rawKind, name: rawName, name_ml: rawNameMl } = body || {};

    const name = (rawName || '').trim();
    const name_ml = (rawNameMl || '').trim() || null;
    const kind = normalizeKind(rawKind);

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Category name must be at least 2 characters.' },
        { status: 400 }
      );
    }

    // Check if category already exists in this kind (case-insensitive)
    let existQuery = supabase
      .from('categories')
      .select('*')
      .ilike('name', name);

    if (kind === 'business') {
      existQuery = existQuery.or('kind.eq.business,kind.eq.shop');
    } else {
      existQuery = existQuery.eq('kind', kind);
    }

    const { data: existing } = await existQuery.maybeSingle();
    if (existing) {
      return NextResponse.json({
        category: existing,
        created: false,
        message: 'Category already exists',
      });
    }

    // Insert new custom category
    const { data: inserted, error: insertError } = await supabase
      .from('categories')
      .insert({
        kind,
        name,
        name_ml,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({
      category: inserted,
      created: true,
      message: 'Category created successfully',
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/categories?id=...
export async function DELETE(req) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Check if any listings reference this category
    const { count } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${count} listing(s) are currently assigned to this category.` },
        { status: 400 }
      );
    }

    const { error: delError } = await supabase.from('categories').delete().eq('id', id);
    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
