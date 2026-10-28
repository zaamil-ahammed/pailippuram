import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { normalizeSupabaseUrl } from '../../../../lib/supabase';
import { memoryStore } from '../../../../lib/mockStore';
import {
  SECTIONS,
  getSubmissionSection,
} from '../../../../lib/sections';

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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

// GET /api/admin/submissions: Fetches pending review queue directly with service role (bypassing RLS)
export async function GET(req) {
  try {
    const supabase = getServiceClient();
    if (!supabase) {
      const localSubs = memoryStore.getTable('submissions').filter((s) => s.status === 'pending');
      return NextResponse.json({ success: true, submissions: localSubs }, { headers: NO_CACHE_HEADERS });
    }

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[API Submissions GET error]', error);
      const localSubs = memoryStore.getTable('submissions').filter((s) => s.status === 'pending');
      return NextResponse.json({ success: true, submissions: localSubs }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: true, submissions: data || [] }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('[API Submissions GET exception]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

// POST /api/admin/submissions: Handles 1-click Approve & Publish, Reject, and Sync
export async function POST(req) {
  try {
    const body = await req.json();
    const { action, id, submission } = body || {};

    const supabase = getServiceClient();

    // 1. APPROVE & PUBLISH A SUBMISSION
    if (action === 'approve' || action === 'publish') {
      let subRecord = submission;
      if (!subRecord && id && supabase) {
        const { data } = await supabase.from('submissions').select('*').eq('id', id).maybeSingle();
        subRecord = data;
      }
      if (!subRecord && id) {
        const localSubs = memoryStore.getTable('submissions');
        subRecord = localSubs.find((s) => String(s.id) === String(id));
      }

      if (!subRecord) {
        return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
      }

      const sec = getSubmissionSection(subRecord) || 'shops';
      const cfg = SECTIONS[sec] || SECTIONS.shops;
      const table = cfg.table;

      const rawPhone = subRecord.phone ? String(subRecord.phone).trim() : '';
      let primaryPhone = rawPhone;
      let altPhoneText = '';
      if (rawPhone.includes(',') || rawPhone.includes('/') || rawPhone.includes(';')) {
        const parts = rawPhone.split(/[,/;\n]/).map((p) => p.trim()).filter(Boolean);
        primaryPhone = parts[0] || '';
        if (parts.length > 1) {
          altPhoneText = `Alt Phones: ${parts.slice(1).join(', ')}`;
        }
      }

      let payload = {};

      if (table === 'listings') {
        let desc = subRecord.description ? subRecord.description.trim() : '';
        if (altPhoneText && !desc.toLowerCase().includes('alt phone')) {
          desc = desc ? `${desc}\n${altPhoneText}` : altPhoneText;
        }

        const waMatch = desc.match(/WhatsApp:\s*([^\n]+)/i);
        const hoursMatch = desc.match(/Hours:\s*([^\n]+)/i) || desc.match(/Availability:\s*([^\n]+)/i);

        payload = {
          title: (subRecord.title || 'Untitled').trim().slice(0, 120),
          kind: cfg.match?.kind || 'business',
          phone: primaryPhone ? primaryPhone.slice(0, 20) : null,
          whatsapp: waMatch ? waMatch[1].trim().slice(0, 20) : null,
          area: subRecord.area ? subRecord.area.trim().slice(0, 80) : null,
          hours: hoursMatch ? hoursMatch[1].trim().slice(0, 80) : null,
          description: desc ? desc.slice(0, 600) : null,
          status: 'approved',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else if (table === 'donors') {
        const bgMatch =
          subRecord.title?.match(/\b(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)\b/i) ||
          subRecord.description?.match(/Blood Group:\s*([A-Za-z0-9+-]+)/i);
        const bloodGroup = bgMatch ? bgMatch[1].toUpperCase() : 'O+';
        const cleanName = subRecord.title?.replace(/\s*\([A-Za-z0-9+-\s]+\)/i, '').trim() || subRecord.title;

        let areaVal = subRecord.area ? subRecord.area.trim() : '';
        if (altPhoneText && !areaVal.includes('Alt:')) {
          areaVal = areaVal ? `${areaVal} · ${altPhoneText}` : altPhoneText;
        }

        payload = {
          name: cleanName.slice(0, 80),
          blood_group: bloodGroup,
          phone: primaryPhone ? primaryPhone.slice(0, 20) : null,
          area: areaVal ? areaVal.slice(0, 80) : null,
          available: true,
          consent: true,
          status: 'approved',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else if (table === 'announcements') {
        payload = {
          title: (subRecord.title || 'Announcement').trim().slice(0, 120),
          body: (subRecord.description || subRecord.title || '').trim().slice(0, 1500),
          status: 'approved',
          updated_at: new Date().toISOString(),
        };
      } else if (table === 'bus_routes') {
        payload = {
          route: (subRecord.title || 'Route').trim().slice(0, 120),
          direction: 'Both Ways',
          times: (subRecord.description || '').trim().slice(0, 800),
          status: 'approved',
          updated_at: new Date().toISOString(),
        };
      } else {
        payload = {
          title: (subRecord.title || 'Item').trim().slice(0, 120),
          kind: 'business',
          phone: primaryPhone ? primaryPhone.slice(0, 20) : null,
          area: subRecord.area ? subRecord.area.trim().slice(0, 80) : null,
          description: subRecord.description ? subRecord.description.trim().slice(0, 600) : null,
          status: 'approved',
          updated_at: new Date().toISOString(),
        };
      }

      let insertedRow = null;
      if (supabase) {
        let res = await supabase.from(table).insert(payload).select().single();
        if (res.error && res.error.message && res.error.message.includes('category')) {
          payload.category_id = null;
          res = await supabase.from(table).insert(payload).select().single();
        }
        insertedRow = res.data;
        // Update submission status to approved
        await supabase.from('submissions').update({ status: 'approved' }).eq('id', subRecord.id);
      }

      // Also sync into local memoryStore
      const localTable = memoryStore.getTable(table);
      const finalItem = insertedRow || {
        id: `pub-${Date.now()}`,
        ...payload,
      };
      localTable.unshift(finalItem);

      const localSubs = memoryStore.getTable('submissions');
      const subIdx = localSubs.findIndex((s) => String(s.id) === String(subRecord.id));
      if (subIdx >= 0) {
        localSubs[subIdx].status = 'approved';
      }

      return NextResponse.json({
        success: true,
        message: `Published "${subRecord.title}" to ${cfg.label}!`,
        section: sec,
        label: cfg.label,
        data: finalItem,
      });
    }

    // 2. REJECT SUBMISSION
    if (action === 'reject') {
      const subId = id || submission?.id;
      if (!subId) {
        return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
      }

      if (supabase) {
        await supabase.from('submissions').update({ status: 'rejected' }).eq('id', subId);
      }

      const localSubs = memoryStore.getTable('submissions');
      const subIdx = localSubs.findIndex((s) => String(s.id) === String(subId));
      if (subIdx >= 0) {
        localSubs[subIdx].status = 'rejected';
      }

      return NextResponse.json({ success: true, message: 'Submission rejected' });
    }

    // 3. SYNC ALL PREVIOUSLY APPROVED SUBMISSIONS INTO LIVE DIRECTORY TABLES
    if (action === 'sync') {
      if (!supabase) {
        return NextResponse.json({ success: true, publishedCount: 0 });
      }

      const { data: approvedSubs } = await supabase
        .from('submissions')
        .select('*')
        .in('status', ['approved', 'handled']);

      const [listingsRes, donorsRes, announceRes] = await Promise.all([
        supabase.from('listings').select('id, title, phone'),
        supabase.from('donors').select('id, name, phone'),
        supabase.from('announcements').select('id, title'),
      ]);

      const liveListingsTitles = new Set((listingsRes.data || []).map((l) => (l.title || '').trim().toLowerCase()));
      const liveDonorsNames = new Set((donorsRes.data || []).map((d) => (d.name || '').trim().toLowerCase()));
      const liveAnnounceTitles = new Set((announceRes.data || []).map((a) => (a.title || '').trim().toLowerCase()));

      let publishedCount = 0;
      for (const sub of approvedSubs || []) {
        if (sub.type === 'removal' || sub.type === 'correction') continue;
        const title = (sub.title || '').trim();
        if (title.length < 2) continue;
        const lowTitle = title.toLowerCase();

        // Blood donor
        if (sub.description?.includes('Blood Group:') || /\b(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)\b/i.test(title)) {
          const bgMatch = title.match(/\b(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)\b/i) || sub.description?.match(/Blood Group:\s*([A-Za-z0-9+-]+)/i);
          const cleanName = title.replace(/\s*\([A-Za-z0-9+-\s]+\)/i, '').trim();
          if (!liveDonorsNames.has(cleanName.toLowerCase()) && !liveDonorsNames.has(lowTitle)) {
            const { error } = await supabase.from('donors').insert({
              name: cleanName.slice(0, 80),
              blood_group: bgMatch ? bgMatch[1].toUpperCase() : 'O+',
              phone: sub.phone ? sub.phone.slice(0, 20) : null,
              area: sub.area ? sub.area.slice(0, 80) : null,
              status: 'approved',
              available: true,
              consent: true,
            });
            if (!error) {
              publishedCount++;
              liveDonorsNames.add(cleanName.toLowerCase());
            }
          }
          continue;
        }

        // Listings
        if (!liveListingsTitles.has(lowTitle)) {
          let kind = 'business';
          if (sub.type === 'contact' || sub.description?.includes('Doctor') || sub.description?.includes('Hospital') || sub.description?.includes('Medical')) {
            kind = 'contact';
          } else if (sub.type === 'worker') {
            kind = 'worker';
          } else if (sub.type === 'transport') {
            kind = 'transport';
          }
          const { error } = await supabase.from('listings').insert({
            title: title.slice(0, 120),
            kind,
            phone: sub.phone ? sub.phone.slice(0, 20) : null,
            area: sub.area ? sub.area.slice(0, 80) : null,
            description: sub.description ? sub.description.slice(0, 600) : null,
            status: 'approved',
          });
          if (!error) {
            publishedCount++;
            liveListingsTitles.add(lowTitle);
          }
        }
      }

      return NextResponse.json({
        success: true,
        publishedCount,
        message: publishedCount > 0 ? `Successfully published ${publishedCount} approved inputs to directory!` : 'All approved inputs are already live.',
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error('[API Submissions POST exception]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
