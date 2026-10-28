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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

// --------------------------------------------------------------------------
// GET /api/admin/notifications: Retrieves subscriber statistics & broadcast history
// --------------------------------------------------------------------------
export async function GET(req) {
  try {
    const supabase = getServiceClient();

    let subscribers = [];
    let notifications = [];

    if (supabase) {
      try {
        const [subRes, notifRes] = await Promise.all([
          supabase.from('announcement_subscriptions').select('*').order('created_at', { ascending: false }),
          supabase.from('custom_notifications').select('*').order('created_at', { ascending: false }).limit(50),
        ]);

        if (!subRes.error && Array.isArray(subRes.data)) subscribers = subRes.data;
        if (!notifRes.error && Array.isArray(notifRes.data)) notifications = notifRes.data;
      } catch (err) {
        console.warn('[Admin Notifications GET Remote Error]', err?.message);
      }
    }

    if (subscribers.length === 0) {
      subscribers = memoryStore.getTable('announcement_subscriptions');
    }
    if (notifications.length === 0) {
      notifications = memoryStore.getTable('custom_notifications');
    }

    const activeSubs = subscribers.filter((s) => s.status === 'active');
    const stats = {
      totalSubscribers: subscribers.length,
      activeSubscribers: activeSubs.length,
      browserCount: activeSubs.filter((s) => s.contact_type === 'browser').length,
      whatsappCount: activeSubs.filter((s) => s.contact_type === 'whatsapp').length,
      phoneCount: activeSubs.filter((s) => s.contact_type === 'phone').length,
      emailCount: activeSubs.filter((s) => s.contact_type === 'email').length,
    };

    return NextResponse.json({
      success: true,
      stats,
      subscribers,
      notifications,
    }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('[Admin Notifications GET Fatal]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// --------------------------------------------------------------------------
// POST /api/admin/notifications: Broadcasts a custom community notification
// --------------------------------------------------------------------------
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      title,
      title_ml,
      body: content,
      urgency = 'urgent',
      topic = 'all',
      channels = ['browser', 'announcement', 'whatsapp'],
      publishAnnouncement = true,
      sender = 'Admin',
    } = body;

    if (!title || title.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Notification title is required' }, { status: 400 });
    }
    if (!content || content.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Notification message body is required' }, { status: 400 });
    }

    const cleanTitle = title.trim();
    const cleanTitleMl = title_ml ? title_ml.trim() : '';
    const cleanBody = content.trim();

    const supabase = getServiceClient();

    // 1. Fetch matching active subscribers count
    let subscribers = [];
    if (supabase) {
      try {
        const { data } = await supabase
          .from('announcement_subscriptions')
          .select('*')
          .eq('status', 'active');
        if (Array.isArray(data)) subscribers = data;
      } catch {}
    }
    if (subscribers.length === 0) {
      subscribers = memoryStore.getTable('announcement_subscriptions').filter((s) => s.status === 'active');
    }

    const matchingSubs = subscribers.filter((s) => {
      if (!s.topics || s.topics === 'all') return true;
      if (topic === 'all') return true;
      return s.topics.includes(topic) || s.topics.includes('all');
    });

    // 2. Publish to Live Announcements table if requested
    let createdAnnouncementId = null;
    if (publishAnnouncement) {
      const isUrgent = urgency === 'urgent';
      const announcementTitle = cleanTitleMl ? `${cleanTitle} · ${cleanTitleMl}` : cleanTitle;
      const announcementBody = isUrgent && !cleanBody.includes('[PINNED]')
        ? `[PINNED]\n${cleanBody}`
        : cleanBody;

      const announcePayload = {
        title: announcementTitle.slice(0, 120),
        body: announcementBody.slice(0, 1500),
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (supabase) {
        try {
          const { data: annRow } = await supabase
            .from('announcements')
            .insert(announcePayload)
            .select()
            .single();
          if (annRow) {
            createdAnnouncementId = annRow.id;
          }
        } catch (err) {
          console.warn('[Broadcast Announcement Remote Insert]', err?.message);
        }
      }

      // Sync memoryStore
      const localAnnouncements = memoryStore.getTable('announcements');
      const finalAnnounce = {
        id: createdAnnouncementId || `ann-${Date.now()}`,
        ...announcePayload,
      };
      localAnnouncements.unshift(finalAnnounce);
    }

    // 3. Save to custom_notifications broadcast log
    const notifRecord = {
      title: cleanTitle.slice(0, 150),
      title_ml: cleanTitleMl ? cleanTitleMl.slice(0, 150) : null,
      body: cleanBody.slice(0, 2000),
      urgency,
      topic,
      target_audience: topic === 'all' ? 'All Subscribers' : `Topic: ${topic}`,
      recipients_count: matchingSubs.length,
      channels: Array.isArray(channels) ? channels : ['browser', 'announcement'],
      announcement_id: createdAnnouncementId,
      sent_by: sender,
      created_at: new Date().toISOString(),
    };

    let savedNotif = null;
    if (supabase) {
      try {
        const { data: notifRow } = await supabase
          .from('custom_notifications')
          .insert(notifRecord)
          .select()
          .single();
        if (notifRow) savedNotif = notifRow;
      } catch (err) {
        console.warn('[Custom Notifications Remote Insert]', err?.message);
      }
    }

    const localNotifs = memoryStore.getTable('custom_notifications');
    const finalNotif = savedNotif || {
      id: `notif-${Date.now()}`,
      ...notifRecord,
    };
    localNotifs.unshift(finalNotif);

    // 4. Log in audit_logs
    if (supabase) {
      try {
        await supabase.from('audit_logs').insert({
          action: 'broadcast notification',
          detail: `Sent "${cleanTitle}" [${urgency.toUpperCase()}] to ${matchingSubs.length} subscriber(s)`,
          created_at: new Date().toISOString(),
        });
      } catch {}
    }

    // 5. Pre-formatted WhatsApp share link for village groups & community broadcasts
    const urgencyEmoji = {
      urgent: '🚨 *അടിയന്തര അറിയിപ്പ് | URGENT ALERT*',
      general: '📢 *പൊതു അറിയിപ്പ് | COMMUNITY ANNOUNCEMENT*',
      service: '⚡ *വൈദ്യുതി / ജലവിതരണ തടസ്സം | SERVICE ALERT*',
      health: '🏥 *ആരോഗ്യ അറിയിപ്പ് | HEALTH UPDATE*',
    }[urgency] || '📢 *അറിയിപ്പ് | ANNOUNCEMENT*';

    const waText = `${urgencyEmoji}\n*${cleanTitle}*${cleanTitleMl ? `\n_${cleanTitleMl}_` : ''}\n\n${cleanBody}\n\n📍 *നമ്മുടെ പൈലിപ്പുറം* · കൂടുതൽ വിവരങ്ങൾക്ക്:\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nammudepailippuram.vercel.app'}/announcements`;
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;

    return NextResponse.json({
      success: true,
      message: `Notification broadcasted successfully to ${matchingSubs.length} subscriber(s)!`,
      notification: finalNotif,
      subscribersReached: matchingSubs.length,
      announcementId: createdAnnouncementId,
      whatsappShareUrl,
      whatsappFormattedText: waText,
    });
  } catch (err) {
    console.error('[Admin Notifications POST Fatal]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// --------------------------------------------------------------------------
// DELETE /api/admin/notifications: Remove past notification log or subscriber
// --------------------------------------------------------------------------
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const notifId = searchParams.get('notifId');
    const subId = searchParams.get('subId');

    const supabase = getServiceClient();

    if (notifId) {
      if (supabase) {
        try {
          await supabase.from('custom_notifications').delete().eq('id', notifId);
        } catch {}
      }
      const localNotifs = memoryStore.getTable('custom_notifications');
      memoryStore.tables.custom_notifications = localNotifs.filter((n) => String(n.id) !== String(notifId));
      return NextResponse.json({ success: true, message: 'Notification removed from log' });
    }

    if (subId) {
      if (supabase) {
        try {
          await supabase.from('announcement_subscriptions').delete().eq('id', subId);
        } catch {}
      }
      const localSubs = memoryStore.getTable('announcement_subscriptions');
      memoryStore.tables.announcement_subscriptions = localSubs.filter((s) => String(s.id) !== String(subId));
      return NextResponse.json({ success: true, message: 'Subscriber removed successfully' });
    }

    return NextResponse.json({ success: false, error: 'notifId or subId is required' }, { status: 400 });
  } catch (err) {
    console.error('[Admin Notifications DELETE Fatal]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
