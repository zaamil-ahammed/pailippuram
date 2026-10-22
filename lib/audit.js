import { supabase } from './supabase';

// Records one admin action in the activity log. Never blocks the action if logging fails.
export async function logAudit(user, { action, table, rowId, note, changes }) {
  try {
    const isValidUuid = (val) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    await supabase.from('audit_logs').insert({
      admin_id: isValidUuid(user?.id) ? user.id : null,
      admin_email: user?.email || 'admin@pailippuram.local',
      action,
      table_name: table,
      row_id: rowId ? String(rowId) : null,
      note: note || null,
      changes: changes || null,
    });
  } catch {
    /* the log is best-effort */
  }
}
