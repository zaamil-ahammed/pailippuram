import { adminMutate } from './adminApi.js';
import { logAudit } from './audit.js';
import { SECTIONS, getSubmissionSection } from './sections.js';
import {
  extractAllPhones,
  cleanAnnouncementBody,
  cleanAnnouncementTitle,
} from './supabase.js';

// Intelligently maps and publishes any approved visitor submission into the live directory database table
// (listings, donors, announcements, bus_routes, panchayath_items, victory_members).
export async function publishSubmission(submission, user = null) {
  if (!submission) {
    return { success: false, error: 'No submission provided' };
  }

  const sec = getSubmissionSection(submission) || 'shops';
  const cfg = SECTIONS[sec] || SECTIONS.shops;
  const table = cfg.table;

  // Extract phone numbers
  const allNums = extractAllPhones(submission);
  const primaryPhone = allNums[0] || (submission.phone ? String(submission.phone).trim() : null);
  const extraPhones = allNums.slice(1);

  let payload = {};

  if (table === 'listings') {
    let desc = submission.description ? submission.description.trim() : '';

    // If there are extra phones, format them cleanly into description
    if (extraPhones.length > 0 && !desc.toLowerCase().includes('alt phone')) {
      const altText = `Alt Phones: ${extraPhones.join(', ')}`;
      desc = desc ? `${desc}\n${altText}` : altText;
    }

    // Extract WhatsApp if present
    const waMatch = desc.match(/WhatsApp:\s*([^\n]+)/i);
    const whatsapp = waMatch ? waMatch[1].trim() : (submission.whatsapp || null);

    // Extract Hours / Availability if present
    const hoursMatch = desc.match(/Hours:\s*([^\n]+)/i) || desc.match(/Availability:\s*([^\n]+)/i);
    const hours = hoursMatch ? hoursMatch[1].trim() : null;

    // Clean description markers
    desc = desc.replace(/\[(?:SHOP|WORKER|TRANSPORT|CONTACT|EDUCATION|SCHOOL|MADRASSA|BUSINESS|CAT_ID:[^\]]+)\]\s*/gi, '').trim();

    payload = {
      title: (submission.title || 'Untitled').trim().slice(0, 120),
      kind: cfg.match?.kind || 'business',
      phone: primaryPhone ? primaryPhone.slice(0, 20) : null,
      whatsapp: whatsapp ? whatsapp.slice(0, 20) : null,
      area: submission.area ? submission.area.trim().slice(0, 80) : null,
      hours: hours ? hours.slice(0, 80) : null,
      description: desc ? desc.slice(0, 600) : null,
      photo_url: submission.photo_url || null,
      status: 'approved',
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } else if (table === 'donors') {
    const bgMatch =
      submission.title?.match(/\b(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)\b/i) ||
      submission.description?.match(/Blood Group:\s*([A-Za-z0-9+-]+)/i);
    const bloodGroup = bgMatch ? bgMatch[1].toUpperCase() : 'O+';
    const cleanName = submission.title?.replace(/\s*\([A-Za-z0-9+-\s]+\)/i, '').trim() || submission.title;

    let areaVal = submission.area ? submission.area.trim() : '';
    if (extraPhones.length > 0 && !areaVal.includes('Alt:')) {
      const altText = `Alt: ${extraPhones.join(', ')}`;
      areaVal = areaVal ? `${areaVal} · ${altText}` : altText;
    }

    payload = {
      name: (cleanName || 'Donor').slice(0, 80),
      blood_group: bloodGroup,
      phone: primaryPhone ? primaryPhone.slice(0, 20) : null,
      area: areaVal ? areaVal.slice(0, 80) : null,
      photo_url: submission.photo_url || null,
      available: true,
      consent: true,
      status: 'approved',
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } else if (table === 'announcements') {
    const cleanTitle = cleanAnnouncementTitle(submission.title || 'Announcement').slice(0, 120);
    const cleanBody = cleanAnnouncementBody(submission.description || submission.title || '').slice(0, 1500);

    const dateMatch = submission.description?.match(/Date:\s*([^\n]+)/i);
    const eventDate = dateMatch ? dateMatch[1].trim() : null;

    payload = {
      title: cleanTitle,
      body: cleanBody || cleanTitle,
      event_date: eventDate,
      is_pinned: false,
      status: 'approved',
      updated_at: new Date().toISOString(),
    };
  } else if (table === 'bus_routes') {
    const busNameMatch = submission.description?.match(/Bus Name:\s*([^\n]+)/i);
    const timesMatch = submission.description?.match(/Times:\s*([\s\S]+)/i);

    payload = {
      route: (submission.title || 'Route').trim().slice(0, 120),
      direction: 'Both Ways',
      bus_name: busNameMatch ? busNameMatch[1].trim().slice(0, 80) : '',
      times: (timesMatch ? timesMatch[1].trim() : (submission.description || '')).slice(0, 800),
      status: 'approved',
      updated_at: new Date().toISOString(),
    };
  } else if (table === 'panchayath_items') {
    payload = {
      title: (submission.title || 'Item').trim().slice(0, 120),
      section: 'service',
      detail: (submission.description || '').trim().slice(0, 1000),
      extra: (primaryPhone || '').slice(0, 80),
      photo_url: submission.photo_url || null,
      status: 'approved',
      updated_at: new Date().toISOString(),
    };
  } else {
    payload = {
      title: (submission.title || 'Item').trim().slice(0, 120),
      kind: 'business',
      phone: primaryPhone ? primaryPhone.slice(0, 20) : null,
      area: submission.area ? submission.area.trim().slice(0, 80) : null,
      description: submission.description ? submission.description.trim().slice(0, 600) : null,
      status: 'approved',
      updated_at: new Date().toISOString(),
    };
  }

  // 1. Insert into live table
  const insertRes = await adminMutate({
    action: 'insert',
    table,
    data: payload,
  });

  if (insertRes.error) {
    console.error(`[publishSubmission] Failed to insert into ${table}:`, insertRes.error);
    return { success: false, error: insertRes.error.message || `Could not publish to ${table}` };
  }

  const publishedRow = insertRes.data;

  // 2. Mark submission as approved in submissions table
  const updateRes = await adminMutate({
    action: 'update',
    table: 'submissions',
    id: submission.id,
    data: { status: 'approved' },
  });

  if (updateRes.error) {
    console.warn('[publishSubmission] Submission status update warning:', updateRes.error);
  }

  // 3. Log audit
  if (user) {
    try {
      await logAudit(user, {
        action: 'approve and publish submission',
        table,
        rowId: publishedRow?.id || submission.id,
        note: `Published "${submission.title}" into ${cfg.label}`,
      });
    } catch (auditErr) {
      console.warn('[publishSubmission] Audit log warning:', auditErr);
    }
  }

  return {
    success: true,
    table,
    section: sec,
    label: cfg.label,
    publishedRow,
  };
}
