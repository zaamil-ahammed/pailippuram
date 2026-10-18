import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { normalizeSupabaseUrl } from '../../../lib/supabase';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const adminEmail = process.env.ADMIN_ALERT_EMAIL;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Nammude Pailippuram <onboarding@resend.dev>';

// Helper to send formatted email via Resend REST API (zero extra npm dependencies)
async function sendAlertEmail(submission) {
  if (!resendApiKey || !adminEmail) {
    console.log('[Submission Alert] Skipping email: RESEND_API_KEY or ADMIN_ALERT_EMAIL not configured.');
    return;
  }

  const { type, title, description, phone, area, submitter_contact, consent, created_at } = submission;
  const isUrgent = type === 'removal' || type === 'correction';

  const typeLabels = {
    business: 'Shop / Local Business',
    transport: 'Taxi / Auto / Transportation',
    worker: 'Native Worker / Trade',
    contact: 'Important Contact',
    bus: 'Bus Timing',
    donor: 'Blood Donor',
    announcement: 'Announcement',
    correction: 'Information Correction',
    removal: 'Details Removal Request (URGENT)',
    other: 'General Submission',
  };

  const typeName = typeLabels[type] || type;
  const subject = `${isUrgent ? '⚠️ [ACTION REQUIRED]' : '📬 [New Submission]'} ${typeName}: ${title}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06); }
          .header { background: linear-gradient(135deg, #172554 0%, #1e40af 100%); color: #ffffff; padding: 24px 28px; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
          .header p { margin: 4px 0 0; font-size: 13px; color: #bfdbfe; }
          .content { padding: 28px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: ${isUrgent ? '#fee2e2' : '#eff6ff'}; color: ${isUrgent ? '#991b1b' : '#1e40af'}; border: 1px solid ${isUrgent ? '#fca5a5' : '#bfdbfe'}; margin-bottom: 16px; }
          .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px; }
          .field { margin-bottom: 14px; }
          .field-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.04em; margin-bottom: 4px; }
          .field-value { font-size: 15px; color: #0f172a; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; white-space: pre-wrap; line-height: 1.5; }
          .btn { display: inline-block; background: #1e40af; color: #ffffff !important; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 20px; text-align: center; }
          .footer { padding: 16px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nammude Pailippuram</h1>
            <p>Admin Notification Service</p>
          </div>
          <div class="content">
            <span class="badge">${typeName}</span>
            <div class="title">${title}</div>

            <div class="field">
              <div class="field-label">Details / Description</div>
              <div class="field-value">${description || '(No extra details provided)'}</div>
            </div>

            ${phone ? `
              <div class="field">
                <div class="field-label">Listing Phone</div>
                <div class="field-value">${phone}</div>
              </div>
            ` : ''}

            ${area ? `
              <div class="field">
                <div class="field-label">Area / Location</div>
                <div class="field-value">${area}</div>
              </div>
            ` : ''}

            ${submitter_contact ? `
              <div class="field">
                <div class="field-label">Submitter Contact (Private)</div>
                <div class="field-value">${submitter_contact}</div>
              </div>
            ` : ''}

            <div class="field">
              <div class="field-label">Consent Given</div>
              <div class="field-value">${consent ? 'Yes (Submitter agreed to listing rules)' : 'No / N/A'}</div>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://nammudepailippuram.vercel.app'}/admin" class="btn">
                Open Admin Panel to Review & Approve &rarr;
              </a>
            </div>
          </div>
          <div class="footer">
            Submitted at ${new Date(created_at || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [adminEmail],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[Resend Error]', res.status, errBody);
    } else {
      console.log(`[Submission Alert] Email successfully dispatched to ${adminEmail}`);
    }
  } catch (err) {
    console.error('[Submission Alert] Failed to send email via Resend:', err);
  }
}

// Handles both:
// 1. Next.js app submission requests from /share and /correction
// 2. Supabase Database Webhook (if configured in Supabase dashboard)
export async function POST(req) {
  try {
    const body = await req.json();

    // Check if request is a Supabase Database Webhook payload
    if (body.type === 'INSERT' && body.record) {
      await sendAlertEmail(body.record);
      return NextResponse.json({ ok: true, source: 'supabase-webhook' });
    }

    // Direct form submission flow
    const { type, title, description, phone, area, submitter_contact, consent } = body;

    if (!title || title.trim().length < 2) {
      return NextResponse.json({ ok: false, error: 'Please provide a valid title.' }, { status: 400 });
    }

    const supabaseKey = supabaseServiceKey || supabaseAnonKey;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { ok: false, error: 'Database is not configured yet. Please check .env.local' },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    let cleanPhone = phone ? phone.trim() : null;
    let safeDesc = description?.trim() || title.trim() || 'N/A';

    if (cleanPhone && cleanPhone.length > 20) {
      const parts = cleanPhone.split(/[,/;\n]/).map((p) => p.trim()).filter(Boolean);
      cleanPhone = parts[0]?.slice(0, 20) || null;
      if (parts.length > 1) {
        const extraText = `Alt Phones: ${parts.slice(1).join(', ')}`;
        if (!safeDesc.includes('Alt Phones:')) {
          safeDesc = `${safeDesc}\n${extraText}`;
        }
      }
    }

    const row = {
      type: type || 'other',
      title: title.trim(),
      description: safeDesc,
      phone: cleanPhone,
      area: area ? area.trim() : null,
      submitter_contact: submitter_contact ? submitter_contact.trim() : null,
      consent: Boolean(consent),
      status: 'pending',
    };

    // Do NOT chain .select() or .single() here.
    // The RLS policy on `submissions` only allows public/anon INSERT with status='pending'.
    // Only admins have SELECT permissions. Chaining .select() tells PostgREST to use RETURNING *,
    // which causes PostgreSQL to evaluate the SELECT policy on the returned row and throws:
    // "new row violates row-level security policy for table 'submissions'".
    let { error } = await supabase.from('submissions').insert(row);

    // If phone check constraint fails
    if (error && error.message && error.message.includes('submissions_phone_check')) {
      const fallbackRow = {
        ...row,
        phone: row.phone ? row.phone.slice(0, 15) : null,
      };
      const res = await supabase.from('submissions').insert(fallbackRow);
      if (!res.error) error = null;
      else error = res.error;
    }

    // If the remote database has an older check constraint on `type` (e.g. only business, contact, announcement, correction)
    if (error && error.message && error.message.includes('submissions_type_check')) {
      console.warn(`[Supabase Type Fallback] '${row.type}' violated check constraint, falling back to 'contact'`);
      const fallbackRow = {
        ...row,
        type: 'contact',
        description: `[${(row.type || 'Submission').toUpperCase()}] ${row.description}`.trim(),
      };
      const fallbackRes = await supabase.from('submissions').insert(fallbackRow);
      if (!fallbackRes.error) {
        error = null;
      } else {
        error = fallbackRes.error;
      }
    }

    if (error) {
      console.error('[Supabase Insert Error]', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Send email alert asynchronously without blocking user response
    sendAlertEmail(row).catch((err) => console.error('[Async Email Error]', err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API Submissions Error]', err);
    return NextResponse.json({ ok: false, error: 'Internal server error.' }, { status: 500 });
  }
}
