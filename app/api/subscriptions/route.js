import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { normalizeSupabaseUrl } from '../../../lib/supabase';
import { memoryStore } from '../../../lib/mockStore';

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

// --------------------------------------------------------------------------
// POST /api/subscriptions: Opt-in for urgent community updates & announcements
// --------------------------------------------------------------------------
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { contact_type = 'browser', target, name, area, topics = 'all' } = body;

    const cleanTarget = typeof target === 'string' ? target.trim() : '';
    if (!cleanTarget) {
      return NextResponse.json(
        { success: false, error: 'Phone number, email or browser notification token is required' },
        { status: 400 }
      );
    }

    // Validation based on type
    if (contact_type === 'phone' || contact_type === 'whatsapp') {
      const digitsOnly = cleanTarget.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid 10-digit phone number' },
          { status: 400 }
        );
      }
    } else if (contact_type === 'email') {
      if (!cleanTarget.includes('@') || !cleanTarget.includes('.')) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid email address' },
          { status: 400 }
        );
      }
    }

    const payload = {
      contact_type: ['browser', 'whatsapp', 'phone', 'email'].includes(contact_type) ? contact_type : 'browser',
      target: cleanTarget.slice(0, 255),
      name: name ? String(name).trim().slice(0, 120) : null,
      area: area ? String(area).trim().slice(0, 80) : null,
      topics: typeof topics === 'string' ? topics : Array.isArray(topics) ? topics.join(',') : 'all',
      status: 'active',
      updated_at: new Date().toISOString(),
    };

    const supabase = getServiceClient();
    let savedRow = null;

    if (supabase) {
      try {
        // Check if subscriber already exists with this target
        const { data: existing } = await supabase
          .from('announcement_subscriptions')
          .select('id')
          .eq('target', payload.target)
          .maybeSingle();

        if (existing?.id) {
          const { data: updated } = await supabase
            .from('announcement_subscriptions')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .single();
          savedRow = updated;
        } else {
          const { data: inserted, error: insErr } = await supabase
            .from('announcement_subscriptions')
            .insert({ ...payload, created_at: new Date().toISOString() })
            .select()
            .single();

          if (!insErr && inserted) {
            savedRow = inserted;
          }
        }
      } catch (err) {
        console.warn('[Subscriptions POST Remote Error]', err?.message);
      }
    }

    // Always keep server memoryStore synchronized for offline / dev resilience
    const localTable = memoryStore.getTable('announcement_subscriptions');
    const existIdx = localTable.findIndex((s) => s.target === payload.target);
    const finalRecord = savedRow || {
      id: existIdx >= 0 ? localTable[existIdx].id : `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...payload,
      created_at: existIdx >= 0 ? localTable[existIdx].created_at : new Date().toISOString(),
    };

    if (existIdx >= 0) {
      localTable[existIdx] = finalRecord;
    } else {
      localTable.unshift(finalRecord);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to community announcements and alerts!',
        subscription: finalRecord,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[Subscriptions POST Fatal]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error processing subscription' },
      { status: 500 }
    );
  }
}

// --------------------------------------------------------------------------
// GET /api/subscriptions: Check subscription status or retrieve subscriber list
// --------------------------------------------------------------------------
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get('target');
    const type = searchParams.get('type');

    const supabase = getServiceClient();

    // Query for single subscriber by target
    if (target) {
      const cleanTarget = target.trim();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('announcement_subscriptions')
            .select('*')
            .eq('target', cleanTarget)
            .maybeSingle();

          if (!error && data) {
            return NextResponse.json({ success: true, subscribed: data.status === 'active', subscription: data });
          }
        } catch {}
      }

      const localTable = memoryStore.getTable('announcement_subscriptions');
      const found = localTable.find((s) => s.target === cleanTarget);
      return NextResponse.json({
        success: true,
        subscribed: found ? found.status === 'active' : false,
        subscription: found || null,
      });
    }

    // List all subscriptions (with optional contact_type filter)
    let list = [];
    if (supabase) {
      try {
        let q = supabase
          .from('announcement_subscriptions')
          .select('*')
          .order('created_at', { ascending: false });
        if (type && type !== 'all') {
          q = q.eq('contact_type', type);
        }
        const { data, error } = await q;
        if (!error && Array.isArray(data)) {
          list = data;
        }
      } catch {}
    }

    if (list.length === 0) {
      const localTable = memoryStore.getTable('announcement_subscriptions');
      list = type && type !== 'all' ? localTable.filter((s) => s.contact_type === type) : localTable;
    }

    const activeCount = list.filter((s) => s.status === 'active').length;

    return NextResponse.json({
      success: true,
      subscriptions: list,
      activeCount,
      totalCount: list.length,
    });
  } catch (err) {
    console.error('[Subscriptions GET Fatal]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// --------------------------------------------------------------------------
// DELETE /api/subscriptions: Opt-out / unsubscribe from community updates
// --------------------------------------------------------------------------
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    let target = searchParams.get('target');
    let id = searchParams.get('id');

    if (!target && !id) {
      const body = await req.json().catch(() => ({}));
      target = body.target;
      id = body.id;
    }

    if (!target && !id) {
      return NextResponse.json(
        { success: false, error: 'Target identifier or subscription ID is required to unsubscribe' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    if (supabase) {
      try {
        if (id) {
          await supabase.from('announcement_subscriptions').update({ status: 'unsubscribed' }).eq('id', id);
        } else if (target) {
          await supabase.from('announcement_subscriptions').update({ status: 'unsubscribed' }).eq('target', target);
        }
      } catch (err) {
        console.warn('[Subscriptions DELETE Remote Error]', err?.message);
      }
    }

    // Sync memoryStore
    const localTable = memoryStore.getTable('announcement_subscriptions');
    const idx = localTable.findIndex((s) => (id && s.id === id) || (target && s.target === target));
    if (idx >= 0) {
      localTable[idx].status = 'unsubscribed';
      localTable[idx].updated_at = new Date().toISOString();
    }

    return NextResponse.json({
      success: true,
      message: 'You have been unsubscribed from community announcement updates.',
    });
  } catch (err) {
    console.error('[Subscriptions DELETE Fatal]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
