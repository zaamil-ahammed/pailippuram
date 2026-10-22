import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { normalizeSupabaseUrl } from '../../../lib/supabase';
import { memoryStore, STARTER_VICTORY_MEMBERS } from '../../../lib/mockStore';

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
  if (k === 'school' || k === 'schools' || k === 'education') return 'education';
  if (k === 'panchayath' || k === 'panchayat') return 'panchayath';
  if (k === 'announcement' || k === 'announcements') return 'announcement';
  if (k === 'donor' || k === 'donors') return 'donor';
  if (k === 'bus' || k === 'routes') return 'bus';
  if (k === 'victory' || k === 'committee') return 'victory';
  return k;
}

// GET /api/categories?kind=...&withCounts=true
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rawKind = searchParams.get('kind');
    const withCounts = searchParams.get('withCounts') === 'true';
    const kind = rawKind ? normalizeKind(rawKind) : null;

    let categories = [];
    const supabase = getSupabase();

    if (supabase) {
      try {
        let query = supabase.from('categories').select('*').order('name');
        if (kind) {
          if (kind === 'business') {
            query = query.or('kind.eq.business,kind.eq.shop');
          } else {
            query = query.eq('kind', kind);
          }
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          categories = data;
        }
      } catch (err) {
        console.warn('[API Categories] Remote fetch error, falling back to local store:', err);
      }
    }

    // Fallback to in-memory store
    if (categories.length === 0) {
      const allMockCats = memoryStore.getTable('categories') || [];
      if (kind) {
        if (kind === 'business') {
          categories = allMockCats.filter((c) => c.kind === 'business' || c.kind === 'shop');
        } else {
          categories = allMockCats.filter((c) => c.kind === kind);
        }
      } else {
        categories = [...allMockCats];
      }
    }

    if (withCounts) {
      // Calculate count of approved listings or records per category
      const allListings = memoryStore.getTable('listings') || [];
      const allPanchayath = memoryStore.getTable('panchayath_items') || [];
      const allAnnouncements = memoryStore.getTable('announcements') || [];
      const allDonors = memoryStore.getTable('donors') || [];
      const allBusRoutes = memoryStore.getTable('bus_routes') || [];
      const allVictory = memoryStore.getTable('victory_members') || STARTER_VICTORY_MEMBERS;

      const countMap = {};

      allListings.forEach((l) => {
        if (l.category_id != null) {
          countMap[l.category_id] = (countMap[l.category_id] || 0) + 1;
        }
      });

      const enriched = (categories || []).map((c) => {
        let count = countMap[c.id] || 0;

        // Custom contextual count matching for other menus
        if (c.kind === 'panchayath') {
          count = allPanchayath.filter((p) =>
            (p.section || '').toLowerCase() === (c.name || '').toLowerCase() ||
            (p.title || '').toLowerCase().includes((c.name || '').toLowerCase())
          ).length;
        } else if (c.kind === 'announcement') {
          count = allAnnouncements.length;
        } else if (c.kind === 'donor') {
          count = allDonors.filter((d) =>
            (d.blood_group || '').toLowerCase().includes((c.name || '').toLowerCase())
          ).length;
        } else if (c.kind === 'bus') {
          count = allBusRoutes.length;
        } else if (c.kind === 'victory') {
          count = allVictory.filter((v) =>
            (v.wing || '').toLowerCase() === (c.name || '').toLowerCase() ||
            (v.role || '').toLowerCase().includes((c.name || '').toLowerCase())
          ).length;
        }

        return {
          ...c,
          listing_count: count,
        };
      });

      return NextResponse.json({ categories: enriched });
    }

    return NextResponse.json({ categories: categories || [] });
  } catch (err) {
    console.error('[API Categories GET]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/categories
// Body: { kind: string, name: string, name_ml?: string }
export async function POST(req) {
  try {
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

    const supabase = getSupabase();
    let createdCategory = null;

    if (supabase) {
      try {
        let existQuery = supabase.from('categories').select('*').ilike('name', name);
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

        const { data: inserted, error: insertError } = await supabase
          .from('categories')
          .insert({ kind, name, name_ml })
          .select()
          .single();

        if (!insertError && inserted) {
          createdCategory = inserted;
        }
      } catch (err) {
        console.warn('[API Categories POST] Remote insert error, falling back to local store:', err);
      }
    }

    // Always ensure local memoryStore is in sync
    const allMockCats = memoryStore.getTable('categories');
    const existingInMock = allMockCats.find(
      (c) => c.kind === kind && c.name.toLowerCase() === name.toLowerCase()
    );

    if (existingInMock) {
      return NextResponse.json({
        category: existingInMock,
        created: false,
        message: 'Category already exists',
      });
    }

    const nextId = createdCategory ? createdCategory.id : (allMockCats.length > 0 ? Math.max(...allMockCats.map((c) => Number(c.id) || 0)) + 1 : 100);
    const newLocalCat = createdCategory || {
      id: nextId,
      kind,
      name,
      name_ml,
    };

    allMockCats.push(newLocalCat);
    memoryStore.saveToStorage();

    return NextResponse.json({
      category: newLocalCat,
      created: true,
      message: 'Category created successfully',
    });
  } catch (err) {
    console.error('[API Categories POST]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/categories (Edit Category)
// Body: { id: number, kind?: string, name: string, name_ml?: string }
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, kind: rawKind, name: rawName, name_ml: rawNameMl } = body || {};

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const name = (rawName || '').trim();
    const name_ml = (rawNameMl || '').trim() || null;
    const kind = rawKind ? normalizeKind(rawKind) : undefined;

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Category name must be at least 2 characters.' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const updatePayload = { name, name_ml };
        if (kind) updatePayload.kind = kind;
        await supabase.from('categories').update(updatePayload).eq('id', id);
      } catch (err) {
        console.warn('[API Categories PUT] Remote update error:', err);
      }
    }

    // Update in local store
    const allCats = memoryStore.getTable('categories');
    const idx = allCats.findIndex((c) => String(c.id) === String(id));
    if (idx !== -1) {
      allCats[idx] = {
        ...allCats[idx],
        name,
        name_ml,
        ...(kind ? { kind } : {}),
      };
      memoryStore.saveToStorage();
    }

    return NextResponse.json({
      success: true,
      category: idx !== -1 ? allCats[idx] : { id, name, name_ml, kind },
      message: 'Category updated successfully',
    });
  } catch (err) {
    console.error('[API Categories PUT]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/categories?id=...
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const allListings = memoryStore.getTable('listings') || [];
    const count = allListings.filter((l) => String(l.category_id) === String(id)).length;

    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${count} active listing(s) are assigned to this category.` },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (err) {
        console.warn('[API Categories DELETE] Remote delete error:', err);
      }
    }

    // Delete in local store
    const allCats = memoryStore.getTable('categories');
    const filtered = allCats.filter((c) => String(c.id) !== String(id));
    memoryStore.tables.categories = filtered;
    memoryStore.saveToStorage();

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error('[API Categories DELETE]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
